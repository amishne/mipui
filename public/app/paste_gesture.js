class PasteGesture extends Gesture {
  constructor() {
    super();
    this.relocatedCells_ = [];
    this.clipboard_ = state.clipboard;
    this.hoveredCell_ = null;
  }

  startHover(cell) {
    if (!this.clipboard_) return;
    if (cell.role != this.clipboard_.anchor.role) return;
    this.hoveredCell_ = cell;
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
    this.hoveredCell_ = null;
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
/*
  rotateLeft() {
    this.updateLocation_(location => ({
      row: -location.column,
      column: location.row,
    }));
  }

  rotateRight() {
    this.updateLocation_(location => ({
      row: location.column,
      column: -location.row,
    }));
  }

  flipVertically() {
    this.updateLocation_(location => ({
      row: location.row,
      column: -location.column,
    }));
  }

  flipHorizontally() {
    this.updateLocation_(location => ({
      row: -location.row,
      column: location.column,
    }));
  }
*/
  updateLocation_(callback) {
    this.stopHover();
    this.relocatedCells_.forEach(relocatedCell => {
      relocatedCell.location = callback(relocatedCell.location);
    });
    if (this.hoveredCell_) {
      this.startHover(this.hoveredCell_);
    }
  }

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
    this.clipboard_.cells.forEach(({location, cell}) => {
      const key = this.calcKey_(newAnchor, cell, location);
      const layerContents = new Map();
      ct.children.forEach(layer => {
        if (cell.hasLayerContent(layer)) {
          layerContents.set(
              layer, 
              this.updateContent_(location, cell.getLayerContent(layer)));
        }
      });
      this.relocatedCells_.push({
        key,
        location,
        layerContents,
      });
    });
  }

  updateContent_(location, content) {
    const newContent = Object.assign({}, content);
    if (content[ck.startCell]) {
      const startCell = state.theMap.cells.get(content[ck.startCell]);
      if (!this.clipboard_.cells.some(({_, cell}) => cell == startCell)) {
        return null;
      } else {
        newContent[ck.startCell] =
            this.relocateCellKey_(location, content[ck.startCell]);
      }
    }
    if (content[ck.endCell]) {
      const endCell = state.theMap.cells.get(content[ck.endCell]);
      if (!this.clipboard_.cells.some(({_, cell}) => cell == endCell)) {
        delete newContent[ck.endCell];
      } else {
        newContent[ck.endCell] =
            this.relocateCellKey_(location, content[ck.endCell]);
      }
    }
    return newContent;
  }
  
  relocateCellKey_(location, key) {
    const rowDiff = this.hoveredCell_.row - this.clipboard_.anchor.row;
    const columnDiff = this.hoveredCell_.column - this.clipboard_.anchor.column;
    return key.split(':').map(part => {
      const coords = part.split(',');
      return Math.floor(Number(coords[0]) + rowDiff) + ',' +
          Math.floor(Number(coords[1]) + columnDiff);
    }).join(':');
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
