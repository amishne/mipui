class Cell {
  constructor(key, role, gridElement, defaultContent) {
    this.key = key;
    this.role = role;
    this.gridElement = gridElement;
    this.defaultContent_ = defaultContent;
    this.offsetLeft = null;
    this.offsetTop = null;
    this.zIndex = null;

    // Elements owned by this cell, keyed by layer.
    this.elements_ = new Map();

    // Initialization.
    this.neighborKeys_ = new Map();
    this.wireInteractions_();
  }
  
  getLayerValue(layer) {
    const override = state.pstate.cellOverrides[this.key];
    if (!override) return this.defaultContent_.get(layer);
    return override[layer] || this.defaultContent_.get(layer);
  }
  
  setLayerValue(layer, value, recordChange) {
    const oldValue = this.getLayerValue(layer);
    const changed = this.setValue_(layer, value);
    if (changed) {
      if (recordChange) {
        state.recordCellChange(this.key, layer, oldValue, value);
      }
      this.updateElement_(layer, oldValue, value);
    }
  }
  
  getOrCreateLayerElement(layer) {
    let element = this.elements_.get(layer);
    if (!element) {
      element = createAndAppendDivWithClass(
          document.getElementById(layer + 'Layer'), layer + '-cell');
      this.setElementGeometryToGridElementGeometry_(element);
      this.elements_.set(layer, element);
    }
    return element;
  }
  
  removeElement_(layer) {
    let element = this.elements_.get(layer);
    if (!element) return;
    element.parentElement.removeChild(element);
  }
  
  setValue_(layer, value) {
    const isToDefault = value == this.defaultContent_.get(layer);
    let override = state.pstate.cellOverrides[this.key];
    let changed = false;
    if (isToDefault && override) {
      changed = !!override[layer];
      delete override[layer];
      if (Object.keys(override).length == 0) {
        delete state.pstate.cellOverrides[this.key];
      }
    } else if (!isToDefault) {
      if (!override) {
        override = {};
        state.pstate.cellOverrides[this.key] = override;
        changed = true;
      }
      changed |= override[layer] == value;
      override[layer] = value;
    }
    return changed;
  }
  
  updateElement_(layer, oldValue, newValue) {
    if (!newValue) {
      this.removeElement_(layer);
      return;
    }
    const element = this.getOrCreateLayerElement(layer);
    element.classList.remove(`${layer}-${oldValue}`);
    element.classList.add(`${layer}-${newValue}`);
  }
  
  updateAllElements() {
    this.defaultContent_.forEach((value, layer) => {
      this.updateElement_(layer, null, value);
    });
    const override = state.pstate.cellOverrides[this.key];
    if (override) {
      Object.keys(override).forEach(layer => {
        this.updateElement_(layer, this.getLayerValue(layer), override[layer]);
      });
    }
  }
  
  resetToDefault() {
    const override = state.pstate.cellOverrides[this.key];
    if (override) {
      Object.keys(override).forEach(layer => {
        this.setLayerValue(layer, null, true);
      });
    }
  }

  wireInteractions_() {
    this.gridElement.onmouseenter = (e) => {
      if (e.buttons == 0) {
        state.gesture.startHover(this);
      } else if (e.buttons == 1) {
        state.gesture.continueGesture(this);
      }
    };
    this.gridElement.onmouseleave = (e) => {
      if (e.buttons == 0) {
        state.gesture.stopHover();
      }
    };
    this.gridElement.onmousedown = (e) => {
      if (e.buttons == 1) {
        state.gesture.startGesture();
      }
    };
    this.gridElement.onmouseup = (e) => {
      state.gesture.stopGesture();
      state.gesture.startHover(this);
    };
  }
  
  setElementGeometryToGridElementGeometry_(element) {
    element.style.left = this.offsetLeft;
    element.style.top = this.offsetTop;
    // element.style.zIndex = this.zIndex;
    const classesToCopy = [
      'primary-cell',
      'corner-cell',
      'vertical-cell',
      'horizontal-cell',
    ];
    classesToCopy.forEach(className => {
      if (this.gridElement.classList.contains(className)) {
        element.classList.add(className);
      }
    });
  }
  
  addNeighborKey(direction, dividerKey, cellKeys) {
    this.neighborKeys_.set(direction, {
      dividerKey: dividerKey,
      cellKeys : cellKeys,
    });
  }
  
  getNeighbors(direction) {
    const neighborKeysInDirection = this.neighborKeys_.get(direction);
    if (!neighborKeysInDirection) return null;
    return {
      dividerCell:
          state.theMap.cells.get(neighborKeysInDirection.dividerKey),
      cells: neighborKeysInDirection.cellKeys
          .map(cellKey => { return state.theMap.cells.get(cellKey); }),
    }
  }
  
  getAllNeighbors() {
    const neighbors = [];
    for (let direction of this.neighborKeys_.keys()) {
      const neighborsOfDirection = this.getNeighbors(direction);
      neighbors.push({
        direction,
        dividerCell: neighborsOfDirection.dividerCell,
        cells: neighborsOfDirection.cells,
      });
    };
    return neighbors;
  }
}
