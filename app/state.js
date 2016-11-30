// Update scheme!
// Storage:
// $mid: {
//   version: "1.0",
//   payload: {
//     fullMap: {
//       content: {...},
//       gridData: {...},
//       latestOperation: 3,
//     },
//     latestOperation: {
//       num: 3,
//       changes: {...}
//     operations: {
//       1: {...},
//       2: {...},
//       3: {...},
//     }
//   }
// }
// Update algorithm:
// update(op) {
//   transaction($mid/payload/latestOperation, fun(data) {
//     if (!data || data conforms with op && data.num + 1 = op.num) {
//       return op;
//     }
//   }, onSuccess() {
//     // num is available!
//     set($mid/payload/operations/3, op);
//   }, onFailure() {
//     undo op, apply latestOperation and increment counter, try to redo op.
//     offer fork on redo failure?
//   }
// }
// Read algorithm:
// listenToChanges() {
//   ref('$mid/payload/operations/latest/num').on(value) {
//     if (value = null) {
//       do nothing
//     }
//     if the value is higher than latestOperation, then for each in-between:
//       apply new op, add to undo list, update latestOperation
//   }
// }
// Rewrite algorithm:
// rewrite() {
//   transaction($mid/payload, fun(data) {
//     if (data.fullMap.latestOperation < latestOperation &&
//         data.latestOperation.num == latestOperation) {
//       return {
//         fullMap: this fullmap,
//         latestOperation: null,
//         operations: null,
//       };
//     }
//   });
// }

class State {
  constructor() {
    this.pstate = {
      version: '1.0',
      gridData: null,
      // Map cell key to a map which maps layer IDs to the content of that
      // layer.
      // "Content" is a mapping of content key (ck) to content type (ct) IDs.
      content: {},
    };

    this.theMap = new TheMap();

    this.gesture = new WallGesture();

    this.undoStack = {
      // Current index in the stack, moved by undo and redo operations.
      index: 0,
      // The actual stack, each entry is an operation.
      operationStack: [],
      // An operation containing changes since the last commit to the undo
      // stack.
      currentOperation: new Operation(),
    };

    this.navigation = {
      scale: 1.0,
      translate: {
        x: 8,
        y: 8,
      },
    };

    this.tool = {
      brushSize: 1,
      manualMode: false,
    };

    this.defaultTerrainContent_ = {
      [ck.kind]: ct.terrain.wall.id,
      [ck.variation]: ct.terrain.wall.generic.id,
    };

    this.defaultGridData_ = {
      from: 0,
      to: 25,
    };

    this.autoSaveTimerId_ = null;
  }

  getLayerContent(cellKey, layer) {
    const content = this.pstate.content || null;
    const cellContent = content ? content[cellKey] : null;
    const layerContent = cellContent ? cellContent[layer.id] : null;
    if (!layerContent && layer == ct.terrain) {
      // Missing terrain translates to the default terrain content.
      return this.defaultTerrainContent_;
    }
    return layerContent || null;
  }

  setLayerContent(cellKey, layer, content) {
    if (!this.pstate.content) {
      this.pstate.content = {};
    }
    let cellContent = this.pstate.content[cellKey];
    if (!cellContent) {
      if (!content) return;
      cellContent = {};
      this.pstate.content[cellKey] = cellContent;
    } else if (!content) {
      delete cellContent[layer.id];
      return;
    }
    if (layer == ct.terrain &&
        Object.keys(content).length == 2 &&
        content[ck.kind] == this.defaultTerrainContent_[ck.kind] &&
        content[ck.variation] == this.defaultTerrainContent_[ck.variation]) {
      // If it's the terrain layer with a content equivalent to the default
      // terrain, it can be deleted.
      delete cellContent[layer.id];
      return;
    }
    cellContent[layer.id] = content;
  }

  getGridData() {
    return this.pstate.gridData || this.defaultGridData_;
  }

  setGridData(gridData) {
    if (gridData && gridData.from == this.defaultGridData_.from &&
        gridData.to == this.defaultGridData_.to) {
      gridData = null;
    }
    this.pstate.gridData = gridData;
  }

  load(mid, pstate) {
    this.mid_ = mid;
    this.pstate = pstate;
    createTheMapAndUpdateElements();
  }

  recordCellChange(key, layer, oldContent, newContent) {
    this.undoStack.currentOperation
        .addCellChange(key, layer, oldContent, newContent);
    this.recordChange_();
  }

  recordGridDataChange(property, oldContent, newContent) {
    this.undoStack.currentOperation
        .addGridDataChange(property, oldContent, newContent);
    this.recordChange_();
  }

  recordChange_() {
    if (this.autoSaveTimerId_) {
      clearTimeout(this.autoSaveTimerId_);
    }
    this.autoSaveTimerId_ = setTimeout(() => {
      this.autoSaveTimerId_ = null;
      this.recordOperationComplete();
    }, 5000);
  }

  recordOperationComplete() {
    this.recordState_();
    this.commitToUndoStack_();
    if (this.autoSaveTimerId_) {
      clearTimeout(this.autoSaveTimerId_);
      this.autoSaveTimerId_ = null;
    }
  }

  commitToUndoStack_() {
    const currentOperation = this.undoStack.currentOperation;
    if (currentOperation.length == 0) {
      return;
    }

    const newStackTail = this.undoStack.operationStack.slice(
        this.undoStack.index, this.undoStack.index + 999);

    this.undoStack.operationStack = [currentOperation]
        .concat(newStackTail);
    this.undoStack.currentOperation = new Operation();
    this.undoStack.index = 0;
  }

  undo() {
    this.commitToUndoStack_();
    const currentIndex = this.undoStack.index;
    const operation = this.undoStack.operationStack[currentIndex];
    if (!operation) return;
    operation.undo();
    this.undoStack.index = Math.min(currentIndex + 1,
        this.undoStack.operationStack.length);
    this.recordState_();
  }

  redo() {
    this.commitToUndoStack_();
    const currentIndex = this.undoStack.index;
    const operation = this.undoStack.operationStack[currentIndex - 1];
    this.undoStack.index = Math.max(currentIndex - 1, 0);
    if (!operation) return;
    operation.redo();
    this.recordState_();
  }

  recordState_() {
    if (!this.mid_) {
      this.mid_ = this.createNewMid_();
      firebase.database().ref(`/maps/${this.mid_}/payload`).set(this.pstate)
          .then(() => {
            window.history.replaceState(
                null, '', 'index.html?mid=' + encodeURIComponent(this.mid_));
            firebase.database()
                .ref(`/maps/${this.mid_}/payload`)
                    .on('value', payloadRef => {
                      this.load(this.mid_, payloadRef.val());
                    });
          })
          .catch(error => {
            this.mid_ = null;
          });
    } else {
      firebase.database().ref(`/maps/${this.mid_}/payload`).set(this.pstate);
    }
  }

  // Create a random 10-character string with characters belonging to [a-z0-9].
  createNewMid_() {
    // From http://stackoverflow.com/a/19964557
    return (Math.random().toString(36)+'00000000000000000').slice(2, 12);
  }
}
