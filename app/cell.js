class Cell {
  constructor(key, element) {
    this.key = key;
    this.element = element;
    this.role = null;
    this.neighborKeys = {};
    this.wireInteractions();
  }
  
  wireInteractions() {
    this.element.onmouseenter = (e) => {
      const gesture = state.getGesture();
      if (e.buttons == 0) {
        gesture.prepare(this);
      } else if (e.buttons == 1) {
        gesture.continueInNewCell(this);
      }
    };
    this.element.onmouseleave = (e) => {
      const gesture = state.getGesture();
      if (e.buttons == 0) {
        gesture.stopPreparing();
      }
    };
    this.element.onmousedown = (e) => {
      const gesture = state.getGesture();
      if (e.buttons == 1) {
        gesture.start();
      }
    };
    this.element.onmouseup = (e) => {
      const gesture = state.getGesture();
      gesture.complete();
      gesture.prepare(this);
    };
  }
  
  showHighlight(toSolid) {
    this.element.classList.add(toSolid ? 'to-solid' : 'to-clear');
  }
  
  hideHighlight(toSolid) {
    this.element.classList.remove(toSolid ? 'to-solid' : 'to-clear');
  }
  
  setSolid() {
    const wasClear = !this.isSolid;
    state.setCellOverride(this.key, undefined);
    this.updateElementToCurrentState();
    return wasClear;
  }
  
  setClear() {
    const wasSolid = this.isSolid;
    state.setCellOverride(this.key, {
      solid: false,
    });
    this.updateElementToCurrentState();
    return wasSolid;
  }
  
  get isSolid() {
    return !state.hasCellOverride(this.key);
  }
  
  updateElementToCurrentState() {
    const toSolid = this.isSolid;
    this.element.classList.remove(toSolid ? 'clear' : 'solid');
    this.element.classList.add(toSolid ? 'solid' : 'clear');
  }
  
  addNeighborKey(direction, dividerKey, cellKeys) {
    this.neighborKeys[direction] = {
      dividerKey: dividerKey,
      cellKeys : cellKeys,
    };
  }
  
  getNeighbors(direction) {
    if (!this.neighborKeys[direction]) {
      return null;
    }
    return {
      dividerCell: state.getCell(this.neighborKeys[direction].dividerKey),
      cells: this.neighborKeys[direction].cellKeys
          .map(cellKey => { return state.getCell(cellKey); }),
    }
  }
  
  getAllNeighbors() {
    const neighbors = [];
    for (const direction of Object.keys(this.neighborKeys)) {
      neighbors.push(this.getNeighbors(direction));
    }
    return neighbors;
  }
  
  enableOverlay() {
    this.element.classList.add('overlay');
  }
  
  disableOverlay() {
    this.element.classList.remove('overlay');
  }
}
