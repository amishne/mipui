class Cell {
  constructor(key, element) {
    this.key = key;
    this.element = element;
    this.isPrimary = false;
    this.neighborDividerKeyToPrimaryKeys = {};
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
}
