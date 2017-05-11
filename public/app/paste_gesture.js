class PasteGesture extends Gesture {
  constructor() {
    super();
    this.relocatedCells_ = [];
    this.clipboard_ = state.clipboard;
  }

  startHover(cell) {
    if (!this.clipboard_) return;
    if (cell.role != this.clipboard_.anchor.role) return;
    this.relocateCells_(cell);
    this.forEachRelocatedCellLayerContent_((targetCell, layer, content) => {
      targetCell.showHighlight(layer, content);
    });
  }

  stopHover() {
    this.forEachRelocatedCellLayerContent_((targetCell, layer, content) => {
      targetCell.hideHighlight(layer);
    });
    this.relocatedCells_ = [];
  }

  startGesture() {
    this.forEachRelocatedCellLayerContent_((targetCell, layer, content) => {
      targetCell.setLayerContent(layer, content, true);
    });
    // Completing a paste resets the gesture selection.
    state.menu.setToInitialSelection();
  }

  continueGesture(cell) {}

  stopGesture() {
    state.opCenter.recordOperationComplete();
  }

  rotateLeft() {}
  rotateRight() {}
  flipVertically() {}
  flipHorizontally() {}

  forEachRelocatedCellLayerContent_(callback) {
    this.relocatedCells_.forEach(({key, location, layerContents}) => {
      const targetCell = state.theMap.cells.get(key);
      if (!targetCell) return;
      layerContents.forEach((content, layer) => {
        callback(targetCell, layer, content);
      });
    });
  }

  relocateCells_(newAnchor) {
    this.clipboard_.cells.forEach((cell, location) => {
      const key = this.calcKey_(newAnchor, cell, location);
      const layerContents = new Map();
      ct.children.forEach(layer => {
        if (cell.hasLayerContent(layer)) {
          layerContents.set(layer, cell.getLayerContent(layer));
        }
      });
      this.relocatedCells_.push({
        key,
        location,
        layerContents,
      });
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
