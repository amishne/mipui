class State {
  constructor() {
    this.pstate = {
      cellOverrides: {},
    };
    this.tstate = {
      // Cell key -> cell data
      cells: {},
      // Current mouse gesture data
      gesture: {},
    };
  }
  
  getGesture() {
    return this.tstate.gesture;
  }
  
  getCell(key) {
    return this.tstate.cells[key];
  }
  
  hasCellOverride(key) {
    return !!this.pstate.cellOverrides[key];
  }
  
  removeCellOverride(key) {
    delete this.pstate.cellOverrides[key];
  }
  
  getOrCreateCellOverride(key) {
    if (!this.hasCellOverride(key)) {
      this.pstate.cellOverrides[key] = {};
    }
    return this.pstate.cellOverrides[key];
  }
  
  addCell(key, cell) {
    this.tstate.cells[key] = cell;
  }
  
  saveToString() {
    return JSON.stringify(this.pstate);
  }
  
  loadFromString(s) {
    this.pstate = JSON.parse(s);
    this.updateAllCells();
  }
  
  updateAllCells() {
    Object.keys(this.tstate.cells).forEach(key => {
      this.updateCell(key);
    });
  }
  
  updateCell(key) {
    const cell = this.getCell(key);
    if (!cell) return;
    cell.updateElementToCurrentState();
  }
}

function recordChange() {
  window.history.replaceState(null, '',
      'index.html?ndps=' + encodeURIComponent(state.saveToString()));
}
