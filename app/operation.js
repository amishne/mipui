class Operation {
  constructor() {
    this.cellChanges_ = new Map();
    this.gridDataChanges_ = new Map();
  }
  
  addCellChange(key, layer, oldValue, newValue) {
    let singleCellChanges = this.cellChanges_.get(key);
    if (!singleCellChanges) {
      singleCellChanges = new Map();
      this.cellChanges_.set(key, singleCellChanges);
    }
    singleCellChanges.set(layer, {oldValue, newValue});
  }
  
  addGridDataChange(property, oldValue, newValue) {
    this.gridDataChanges_.set(property, { oldValue, newValue});
  }
  
  undo() {
    this.undoOrRedo_('oldValue');
  }
  
  redo() {
    this.undoOrRedo_('newValue');
  }
  
  undoOrRedo_(valueToUse) {
    this.cellChanges_.forEach((valueMap, key) => {
      const cell = state.theMap.cells.get(key);
      valueMap.forEach((valuePair, layer) => {
        cell.setLayerValue(layer, valuePair[valueToUse], false);
      });
    });
    let gridDataChanged = false;
    this.gridDataChanges_.forEach((valuePair, property) => {
      state.pstate.gridData[property] = valuePair[valueToUse];
      gridDataChanged = true;
    });
    if (gridDataChanged) {
      createTheMapAndUpdateElements();
    }
  }
  
  get length() {
    return this.cellChanges_.size + this.gridDataChanges_.size;
  }
}