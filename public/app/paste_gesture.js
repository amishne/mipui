class PasteGesture extends Gesture {
  constructor() {
    super();
    this.relocatedCells_ = new Map();
  }

  startHover(cell) {
    if (!state.clipboard) return;
    if (cell.role != state.clipboard.anchor.role) return;
    this.relocateCells_(cell);
    this.relocatedCells_.forEach((cell, key) => {
      const targetCell = state.theMap.cells.get(key);
      if (!targetCell) return;
      ct.children.forEach(layer => {
        targetCell.showHighlight(layer, cell.getLayerContent(layer));
      });
    });
  }

  stopHover() {
    this.relocatedCells_.forEach((_, key) => {
      const targetCell = state.theMap.cells.get(key);
      ct.children.forEach(layer => {
        targetCell.hideHighlight(layer);
      });
    });
    this.relocatedCells_ = new Map();
  }

  startGesture() {
    this.relocatedCells_.forEach((cell, key) => {
      const targetCell = state.theMap.cells.get(key);
      if (!targetCell) return;
      ct.children.forEach(layer => {
        targetCell.setLayerContent(layer, cell.getLayerContent(layer), true);
      });
    });
  }

  continueGesture(cell) {}

  stopGesture() {
    state.opCenter.recordOperationComplete();
  }

  rotateLeft() {}
  rotateRight() {}
  flipVertically() {}
  flipHorizontally() {}

  relocateCells_(newAnchor) {
    state.clipboard.cells.forEach((cell, location) => {
      const key = this.calcKey_(newAnchor, cell, location);
      this.relocatedCells_.set(key, cell);
    });
  }

  calcKey_(anchor, cell, location) {
    const row = anchor.row + location.row;
    const column = anchor.column + location.column;
    switch (cell.role) {
      case 'primary':
        return TheMap.primaryCellKey(row, column);
      case 'vertical':
      case 'horizontal':
      case 'corner':
        return TheMap.dividerCellKey(
            Math.floor(row), Math.floor(column),
            Math.ceil(row), Math.ceil(column));
    }
  }
}
