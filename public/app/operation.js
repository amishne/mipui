// A set of state changes that should be applied (or undoed) together.
// * Do not merge or split operations - the results may not be valid.
class Operation {
  constructor(data) {
    this.data = data || {
      // Operation identifiers.
      i: {},
      // Cell changes.
      c: {},
      // Grid changes.
      g: {},
      // Desc changes.
      d: {},
    };
  }

  addCellChange(key, layer, oldValue, newValue) {
    let singleCellChanges = this.data.c[key];
    if (!singleCellChanges) {
      singleCellChanges = {};
      this.data.c[key] = singleCellChanges;
    }
    if (singleCellChanges[layer.id]) {
      // This overrides content that were already recorded as changed. In that
      // case, skip the intermediate content.
      oldValue = singleCellChanges[layer.id].oldValue || null;
    }
    singleCellChanges[layer.id] = {o: oldValue, n: newValue};
  }

  addGridDataChange(property, oldValue, newValue) {
    this.data.g[property] = {o: oldValue, n: newValue};
  }

  addDescChange(property, oldValue, newValue) {
    this.data.d[property] = {o: oldValue, n: newValue};
  }

  undo() {
    this.undoOrRedo_('o');
  }

  redo() {
    this.undoOrRedo_('n');
  }

  undoOrRedo_(contentToUse) {
    if (!this.data) return;
    if (this.data.c) {
      Object.keys(this.data.c).forEach(key => {
        const cell = state.theMap.cells.get(key);
        const cellChange = this.data.c[key];
        Object.keys(cellChange).forEach(layerId => {
          const cellLayerChange = cellChange[layerId];
          const layer = ct.children[layerId];
          cell.setLayerContent(layer, cellLayerChange[contentToUse], false);
        });
      });
    }
    if (this.data.g) {
      let gridDataChanged = false;
      Object.keys(this.data.g).forEach(property => {
        const updatedGridData = {};
        Object.assign(updatedGridData, state.getGridData());
        updatedGridData[property] = this.data.g[property][contentToUse];
        state.setGridData(updatedGridData);
        gridDataChanged = true;
      });
      if (gridDataChanged) {
        createTheMapAndUpdateElements();
      }
    }
    if (this.data.d) {
      let descChanged = false;
      Object.keys(this.data.d).forEach(property => {
        const updatedDesc = {};
        Object.assign(updatedDesc, state.getDesc());
        updatedDesc[property] = this.data.d[property][contentToUse];
        state.setDesc(updatedDesc);
        descChanged = true;
      });
      if (descChanged) {
        state.menu.descChanged();
      }
    }
  }

  get length() {
    if (!this.data || !this.data.c) return 0;
    return Object.keys(this.data.c || {}).length +
        Object.keys(this.data.g || {}).length +
        Object.keys(this.data.d || {}).length;
  }

  get num() {
    if (!this.data || !this.data.i) return null;
    return this.data.i.n;
  }

  set num(num) {
    if (!this.data) {
      this.data = {};
    }
    if (!this.data.i) {
      this.data.i = {};
    }
    this.data.i.n = num;
  }

  get fingerprint() {
    if (!this.data || !this.data.i) return null;
    return this.data.i.f;
  }

  set fingerprint(fingerprint) {
    if (!this.data) {
      this.data = {};
    }
    if (!this.data.i) {
      this.data.i = {};
    }
    this.data.i.f = fingerprint;
  }

  isLegalToRedo() {
    if (!this.data) return true;
    return this.cellChangesAreLegalToRedo_() &&
        this.gridChangesAreLegalToRedo_() &&
        this.descChangesAreLegalToRedo_();
  }

  reverse() {
    const result = new Operation();
    if (!this.data) return result;
    result.data = {};
    if (this.data.c) {
      result.data.c = {};
      Object.keys(this.data.c).forEach(key => {
        const cellChange = this.data.c[key];
        result.data.c[key] = {};
        Object.keys(cellChange).forEach(layerId => {
          const cellLayerChange = cellChange[layerId];
          result.data.c[key][layerId] = {
            o: cellLayerChange.n,
            n: cellLayerChange.o,
          };
        });
      });
    }
    if (this.data.g) {
      result.data.g = {};
      Object.keys(this.data.g).forEach(property => {
        const propertyChange = this.data.g[property];
        result.data.g[property] = {o: propertyChange.n, n: propertyChange.o};
      });
    }
    if (this.data.d) {
      result.data.d = {};
      Object.keys(this.data.d).forEach(property => {
        const propertyChange = this.data.d[property];
        result.data.d[property] = {o: propertyChange.n, n: propertyChange.o};
      });
    }
    return result;
  }

  cellChangesAreLegalToRedo_() {
    if (!this.data.c) return true;
    return Object.keys(this.data.c).every(key => {
      const cell = state.theMap.cells.get(key);
      if (!cell) return false;
      const cellChange = this.data.c[key];
      return Object.keys(cellChange).every(layerId => {
        const cellLayerChange = cellChange[layerId];
        const layer = ct.children[layerId];
        return sameContent(cellLayerChange.o, cell.getLayerContent(layer));
      });
    });
  }

  gridChangesAreLegalToRedo_() {
    if (!this.data.g) return true;
    return Object.keys(this.data.g).every(property => {
      const opChange = this.data.g[property];
      if (!opChange) return true;
      const thisChange = this.data.g[property];
      return thisChange.o == state.getGridData()[property];
    });
  }

  descChangesAreLegalToRedo_() {
    if (!this.data.d) return true;
    return Object.keys(this.data.d).every(property => {
      const opChange = this.data.d[property];
      if (!opChange) return true;
      const thisChange = this.data.d[property];
      return thisChange.o == state.getDesc()[property];
    });
  }
}