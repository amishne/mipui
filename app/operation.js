class Operation {
  constructor(changes) {
    this.changes = changes || {
      cellChanges: {},
      gridDataChanges : {},
    };
  }

  addCellChange(key, layer, oldValue, newValue) {
    let singleCellChanges = this.changes.cellChanges[key];
    if (!singleCellChanges) {
      singleCellChanges = new Map();
      this.changes.cellChanges[key] = singleCellChanges;
    }
    if (singleCellChanges.has(layer)) {
      // This overrides content that were already recorded as changed. In that
      // case, skip the intermediate content.
      oldValue = singleCellChanges.get(layer).oldValue;
    }
    singleCellChanges.set(layer, {oldValue, newValue});
  }

  addGridDataChange(property, oldValue, newValue) {
    this.changes.gridDataChanges[property] = {oldValue, newValue};
  }

  undo() {
    this.undoOrRedo_('oldValue');
  }

  redo() {
    this.undoOrRedo_('newValue');
  }

  undoOrRedo_(contentToUse) {
    Object.keys(this.changes.cellChanges).forEach(key => {
      const cell = state.theMap.cells.get(key);
      const cellChange = this.changes.cellChanges[key];
      Object.keys(cellChange).forEach(layer => {
        cell.setLayerContent(layer, cellChange[contentToUse], false);
      });
    });
    let gridDataChanged = false;
    Object.keys(this.changes.gridDataChanges).forEach(property => {
      const updatedGridData = {};
      Object.assign(updatedGridData, state.getGridData());
      updatedGridData[property] =
          this.changes.gridDataChanges[property][contentToUse];
      state.setGridData(updatedGridData);
      gridDataChanged = true;
    });
    if (gridDataChanged) {
      createTheMapAndUpdateElements();
    }
  }

  get length() {
    return Object.keys(this.changes.cellChanges).length +
        Object.keys(this.changes.gridDataChanges).length;
  }
}