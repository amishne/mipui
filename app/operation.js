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
    if (singleCellChanges.has(layer)) {
      // This overrides content that were already recorded as changed. In that
      // case, skip the intermediate content.
      oldValue = singleCellChanges.get(layer).oldValue;
    }
    singleCellChanges.set(layer, {oldValue, newValue});
  }

  addGridDataChange(property, oldValue, newValue) {
    this.gridDataChanges_.set(property, {oldValue, newValue});
  }

  undo() {
    this.undoOrRedo_('oldValue');
  }

  redo() {
    this.undoOrRedo_('newValue');
  }

  undoOrRedo_(contentToUse) {
    this.cellChanges_.forEach((valueMap, key) => {
      const cell = state.theMap.cells.get(key);
      valueMap.forEach((contentPair, layer) => {
        cell.setLayerContent(layer, contentPair[contentToUse], false);
      });
    });
    let gridDataChanged = false;
    this.gridDataChanges_.forEach((contentPair, property) => {
      const updatedGridData = {};
      Object.assign(updatedGridData, state.getGridData());
      updatedGridData[property] = contentPair[contentToUse];
      state.setGridData(updatedGridData);
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