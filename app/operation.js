class Operation {
  constructor(num, changes) {
    this.data = {
      num,
      changes: changes || {
        cellChanges: {},
        gridDataChanges : {},
      },
    };
  }

  addCellChange(key, layer, oldValue, newValue) {
    let singleCellChanges = this.data.changes.cellChanges[key];
    if (!singleCellChanges) {
      singleCellChanges = {};
      this.data.changes.cellChanges[key] = singleCellChanges;
    }
    if (singleCellChanges[layer.id]) {
      // This overrides content that were already recorded as changed. In that
      // case, skip the intermediate content.
      oldValue = singleCellChanges[layer.id].oldValue;
    }
    singleCellChanges[layer.id] = {oldValue, newValue};
  }

  addGridDataChange(property, oldValue, newValue) {
    this.data.changes.gridDataChanges[property] = {oldValue, newValue};
  }

  undo() {
    this.undoOrRedo_('oldValue');
  }

  redo() {
    this.undoOrRedo_('newValue');
  }

  undoOrRedo_(contentToUse) {
    if (!this.data || !this.data.changes) return;
    if (this.data.changes.cellChanges) {
      Object.keys(this.data.changes.cellChanges).forEach(key => {
        const cell = state.theMap.cells.get(key);
        const cellChange = this.data.changes.cellChanges[key];
        Object.keys(cellChange).forEach(layerId => {
          const cellLayerChange = cellChange[layerId];
          const layer = ct.children[layerId];
          cell.setLayerContent(layer, cellLayerChange[contentToUse], false);
        });
      });
    }
    if (this.data.changes.gridDataChanges) {
      let gridDataChanged = false;
      Object.keys(this.data.changes.gridDataChanges).forEach(property => {
        const updatedGridData = {};
        Object.assign(updatedGridData, state.getGridData());
        updatedGridData[property] =
            this.data.changes.gridDataChanges[property][contentToUse];
        state.setGridData(updatedGridData);
        gridDataChanged = true;
      });
      if (gridDataChanged) {
        createTheMapAndUpdateElements();
      }
    }
  }

  get length() {
    if (!this.data || !this.data.changes) return 0;
    return Object.keys(this.data.changes.cellChanges || {}).length +
        Object.keys(this.data.changes.gridDataChanges || {}).length;
  }

  canBePrecededBy(op) {
    if (!op.data || !op.data.changes) return true;
    return this.cellChangesCanBePrecededBy_(op) &&
        this.gridChangesCanBePrecededBy_(op);
  }

  cellChangesCanBePrecededBy_(op) {
    if (!op.data.changes.cellChanges) return true;
    return Object.keys(this.data.changes.cellChanges).every(key => {
      const opCellChange = op.data.changes.cellChanges[key]
      if (!opCellChange) return true;
      const thisCellChange = this.data.changes.cellChanges[key];
      return Object.keys(thisCellChange).every(layer => {
        const opLayerContentPair = opCellChange[layer];
        if (!opLayerContentPair) return true;
        const thisLayerContentPair = thisCellChange[layer];
        // If we got here, both this and op modify the same layer of the same
        // cell. Ensure the changes are compataible.
        return
            sameContent(
                thisLayerContentPair.oldValue,
                opLayerContentPair.newValue);
      });
    });
  }

  gridChangesCanBePrecededBy_(op) {
    if (!op.data.changes.gridChanges) return true;
    return Object.keys(this.data.changes.gridChanges).every(property => {
      const opChange = op.data.changes.gridChanges[property];
      if (!opChange) return true;
      const thisChange = this.data.changes.gridData[property];
      return thisChange.oldValue == opChange.newValue;
    });
  }
}