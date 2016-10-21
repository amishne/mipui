class State {
  constructor() {
    this.pstate = {
      gridData: {
        from: 0,
        to: 30,
      },
      cellOverrides: {},
    };
    this.tstate = {
      // Cell key -> cell data
      cells: {},
      // Current mouse gesture data
      gesture: {},
      // Undo stack
      undoStack: {
        // Current index in the stack, moved by undo and redo operations.
        index: 0,
        // The actual stack, each entry is a cellOverrides mapping.
        cellOverrideStack: [],
        // Cell overrides performed since the last commit to the undo stack.
        currentCellOverrides: {},
      },
      navigation: {
        scale: 1.0,
        translate: {
          x: 8,
          y: 8,
        },
      }
    };
  }
  
  getGridData() {
    return this.pstate.gridData;
  }
  
  getGesture() {
    return this.tstate.gesture;
  }
  
  getNavigation() {
    return this.tstate.navigation;
  }
  
  getCell(key) {
    return this.tstate.cells[key];
  }
  
  hasCellOverride(key) {
    return !!this.pstate.cellOverrides[key];
  }
  
  setCellOverride(key, cellOverride) {
    this.addCellOverrideToCurrentOverridesInUndoStack(key, cellOverride);
    this.setCellOverrideWithoutUpdatingUndoStack(key, cellOverride);
  }
  
  setCellOverrideWithoutUpdatingUndoStack(key, cellOverride) {
    if (!cellOverride) {
      delete this.pstate.cellOverrides[key];
    } else {
      this.pstate.cellOverrides[key] = cellOverride;
    }
  }
  
  addCellOverrideToCurrentOverridesInUndoStack(key, newCellOverride) {
    this.tstate.undoStack.currentCellOverrides[key] = {
      before: this.pstate.cellOverrides[key],
      after: newCellOverride,
    };
  }
  
  addCell(key, cell) {
    this.tstate.cells[key] = cell;
  }
  
  saveToString() {
    return LZString.compressToEncodedURIComponent(JSON.stringify(this.pstate));
  }
  
  loadFromString(s) {
    this.pstate = JSON.parse(LZString.decompressFromEncodedURIComponent(s));
    this.updateAllCells();
  }
  
  updateAllCells() {
    this.updateCells(Object.keys(this.tstate.cells));
  }
  
  updateCells(cellKeys) {
    cellKeys.forEach(cellKey => {
      this.updateCell(this.tstate.cells[cellKey]);
    });
  }
  
  updateCell(cell) {
    if (!cell) return;
    cell.updateElementToCurrentState();
  }
  
  recordChange() {
    this.updateUrl();
    this.commitToUndoStack();
  }
  
  commitToUndoStack() {
    if (Object.keys(this.tstate.undoStack.currentCellOverrides).length == 0) {
      return;
    }

    const newChange = this.tstate.undoStack.currentCellOverrides;
    const newStackTail = this.tstate.undoStack.cellOverrideStack.slice(
        this.tstate.undoStack.index, this.tstate.undoStack.index + 999);

    this.tstate.undoStack.currentCellOverrides = {};
    this.tstate.undoStack.cellOverrideStack = [newChange].concat(newStackTail);
    this.tstate.undoStack.index = 0;
  }
  
  undo() {
    this.commitToUndoStack();
    this.changePstateToUndoState('before')
    this.tstate.undoStack.index = Math.min(this.tstate.undoStack.index + 1,
        this.tstate.undoStack.cellOverrideStack.length);
  }
  
  redo() {
    this.commitToUndoStack();
    this.tstate.undoStack.index =
        Math.max(this.tstate.undoStack.index - 1, -1);
    this.changePstateToUndoState('after');
    this.tstate.undoStack.index = Math.max(this.tstate.undoStack.index, 0);
  }
  
  changePstateToUndoState(cellOverridePhaseToUse) {
    const targetCellOverride =
        this.tstate.undoStack.cellOverrideStack[this.tstate.undoStack.index];
    if (!targetCellOverride) return;
    const affectedCellKeys = Object.keys(targetCellOverride);
    affectedCellKeys.forEach(key => {
      this.setCellOverrideWithoutUpdatingUndoStack(
          key, targetCellOverride[key][cellOverridePhaseToUse]);
    });
    this.updateCells(affectedCellKeys);
  }
  
  updateUrl() {
    window.history.replaceState(
        null, '', 'index.html?ps=' + this.saveToString());
  }
}
