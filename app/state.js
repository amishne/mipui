class State {
  constructor() {
    this.pstate = {
      gridData: {
        from: 0,
        to: 30,
      },
      cellOverrides: {},
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
  }
  
  saveToString() {
    return LZString.compressToEncodedURIComponent(JSON.stringify(this.pstate));
  }
  
  loadFromString(s) {
    this.pstate = JSON.parse(LZString.decompressFromEncodedURIComponent(s));
    this.theMap.updateAllCells();
  }
  
  recordCellChange(key, layer, oldValue, newValue) {
    this.undoStack.currentOperation
        .addCellChange(key, layer, oldValue, newValue);
  }
  
  recordGridDataChange(property, oldValue, newValue) {
    this.undoStack.currentOperation
        .addGridDataChange(property, oldValue, newValue);
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
