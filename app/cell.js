class Cell {
  constructor(key, element) {
    this.key = key;
    this.element = element;
    this.isPrimary = false;
    this.neighborDividerKeyToPrimaryKeys = {};
  }
  
  setSolid() {
    state.removeCellOverride(this.key);
    this.updateElementToCurrentState();
  }
  
  setClear() {
    state.getOrCreateCellOverride(this.key).solid = false;
    this.updateElementToCurrentState();
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
