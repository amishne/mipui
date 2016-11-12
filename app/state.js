class State {
  constructor() {
    this.pstate = {
      gridData: {
        from: 0,
        to: 25,
      },
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
  }

  getLayerContent(cellKey, layer) {
    const cellContent = this.pstate.content[cellKey];
    const layerContent = cellContent ? cellContent[layer.id] : null;
    if (!layerContent && layer == ct.terrain) {
      // Missing terrain translates to the default terrain content.
      return this.defaultTerrainContent_;
    }
    return layerContent || null;
  }

  setLayerContent(cellKey, layer, content) {
    let cellContent = this.pstate.content[cellKey];
    if (!cellContent) {
      if (!content) return;
      cellContent = {};
      this.pstate.content[cellKey] = cellContent;
    } else if (!content) {
      delete cellContent[layer.id];
      return;
    }
    cellContent[layer.id] = content;
  }

  saveToString() {
    return LZString.compressToEncodedURIComponent(JSON.stringify(this.pstate));
  }

  loadFromString(s) {
    this.pstate = JSON.parse(LZString.decompressFromEncodedURIComponent(s));
    this.theMap.updateAllCells();
  }

  recordCellChange(key, layer, oldContent, newContent) {
    this.undoStack.currentOperation
        .addCellChange(key, layer, oldContent, newContent);
  }

  recordGridDataChange(property, oldContent, newContent) {
    this.undoStack.currentOperation
        .addGridDataChange(property, oldContent, newContent);
  }

  recordOperationComplete() {
    this.updateUrl_();
    this.commitToUndoStack_();
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
    this.updateUrl_();
  }

  redo() {
    this.commitToUndoStack_();
    const currentIndex = this.undoStack.index;
    const operation = this.undoStack.operationStack[currentIndex - 1];
    this.undoStack.index = Math.max(currentIndex - 1, 0);
    if (!operation) return;
    operation.redo();
    this.updateUrl_();
  }

  updateUrl_() {
    window.history.replaceState(
        null, '', 'index.html?ps=' + this.saveToString());
  }
}
