class State {
  constructor() {
    this.pstate = {
      version: '1.0',
      gridData: null,
      // Map cell key to a map which maps layer IDs to the content of that
      // layer.
      // "Content" is a mapping of content key (ck) to content type (ct) IDs.
      content: {},
      latestOperationNum: 0,
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
      currentOperation: new Operation(1),
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

    this.pendingOperations_ = [];

    this.currentlyProcessingOperations_ = false;
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
    this.listenForChanges_();
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
    const committedOperation =
        this.commitToUndoStack_(this.undoStack.currentOperation);
    if (this.autoSaveTimerId_) {
      clearTimeout(this.autoSaveTimerId_);
      this.autoSaveTimerId_ = null;
    }
    this.updateDb_(committedOperation);
  }

  performNewOperation_(op) {
    op.redo();
    this.commitToUndoStack_(op);
  }

  commitToUndoStack_(op) {
    if (op.length == 0) {
      return null;
    }

    const newStackTail = this.undoStack.operationStack.slice(
        this.undoStack.index, this.undoStack.index + 999);

    this.undoStack.operationStack = [op].concat(newStackTail);
    this.undoStack.currentOperation = new Operation(op.data.num + 1);
    this.undoStack.index = 0;
    return op;
  }

  undo() {
    this.commitToUndoStack_(this.undoStack.currentOperation);
    const currentIndex = this.undoStack.index;
    const operation = this.undoStack.operationStack[currentIndex];
    if (!operation) return;
    operation.undo();
    this.undoStack.index = Math.min(currentIndex + 1,
        this.undoStack.operationStack.length);
    this.recordState_();
  }

  redo() {
    this.commitToUndoStack_(this.undoStack.currentOperation);
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
      firebase.database().ref(`/maps/${this.mid_}/payload/fullMap`)
          .set(this.pstate)
              .then(() => {
                window.history
                    .replaceState(
                        null, '',
                        'index.html?mid=' + encodeURIComponent(this.mid_));
              })
              .catch(error => {
                this.mid_ = null;
              });
    }
  }

  // Create a random 10-character string with characters belonging to [a-z0-9].
  createNewMid_() {
    // From http://stackoverflow.com/a/19964557
    return (Math.random().toString(36)+'00000000000000000').slice(2, 12);
  }

  updateDb_(op) {
    this.pendingOperations_.push(op);
    if (!this.currentlyProcessingOperations_) {
      this.processOperations_();
    }
  }

  processOperations_() {
    const firstOp = this.pendingOperations_[0];
    if (!firstOp) {
      this.currentlyProcessingOperations_ = false;
      setStatus(Status.SAVED);
      return;
    }
    this.currentlyProcessingOperations_ = true;
    setStatus(Status.SAVING);
    this.processOperation_(firstOp, isSuccessful => {
      if (isSuccessful) {
        this.pstate.latestOperationNum = firstOp.data.num;
        this.pendingOperations_.shift();
        this.processOperations_();
      } else {
        this.currentlyProcessingOperations_ = false;
        setStatus(Status.UPDATING);
      }
    });
  }

  processOperation_(op, callback) {
    const payloadPath = `/maps/${this.mid_}/payload`;
    const latestOperationPath = payloadPath + '/latestOperation';
    firebase.database().ref(latestOperationPath).transaction(currData => {
      if (!currData ||
          (currData.num + 1 == op.data.num && op.canBePrecededBy(currData))) {
        return op.data;
      }
    }, (error, committed, snapshot) => {
      if (error) {
        console.log('Transaction failed abnormally!', error);
        callback(false);
      } else if (!committed) {
        // Revert the local change!
        op.undo();
        // Stop processing for now.
        callback(false);
      } else {
        // Success!
        firebase.database()
            .ref(`${payloadPath}/operations/${op.data.num}`).set(op.data);
        callback(true);
      }
    }, false /* suppress updates on intermediate states */);
  }

  listenForChanges_() {
    const latestOperationNumPath =
        `/maps/${this.mid_}/payload/latestOperation/num`;
    firebase.database().ref(latestOperationNumPath).on('value', numRef => {
      setStatus(Status.UPDATING);
      if (!numRef) return;
      const num = numRef.val();
      const currNum = this.pstate.latestOperationNum || 0;
      if (num > currNum) {
        this.loadAndPerformOperations_(currNum + 1, num);
      }
    });
  }

  loadAndPerformOperations_(fromNum, toNum) {
    if (fromNum > toNum) {
      setStatus(Status.READY);
      return;
    }
    const path = `/maps/${this.mid_}/payload/operations/${fromNum}`;
    firebase.database().ref(path).once('value', opDataRef => {
      if (!opDataRef) return;
      const opData = opDataRef.val();
      const op = new Operation(opData.num, opData.changes);
      this.performNewOperation_(op);
      this.pstate.latestOperationNum = fromNum;
      this.loadAndPerformOperations_(fromNum + 1, toNum);
    });
  }
}
