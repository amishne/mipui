class Cell {
  constructor(key, element) {
    this.key = key;
    this.element = element;
    this.isPrimary = false;
    this.neighborDividerKeyToPrimaryKeys = {};
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
  
  addNeighborKey(dividerKey, primaryKeys) {
    this.neighborDividerKeyToPrimaryKeys[dividerKey] = primaryKeys;
  }
  
  getNeighbors() {
    const neighbors = [];
    for (const dividerKey
        of Object.keys(this.neighborDividerKeyToPrimaryKeys)) {
      neighbors.push({
        dividerCell: state.getCell(dividerKey),
        primaryCells: this.neighborDividerKeyToPrimaryKeys[dividerKey]
            .map(primaryCellKey => { return state.getCell(primaryCellKey); }),
      });
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
