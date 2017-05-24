class PasteGesture extends Gesture {
  constructor() {
    super();
    this.relocatedCells_ = [];
    this.hoveredCell_ = null;
  }

  startHover(cell) {
    if (!state.clipboard) return;
    if (cell.role != state.clipboard.anchor.role) return;
    this.hoveredCell_ = cell;
    this.relocateCells_(cell);
    this.forEachRelocatedAndGroupCell_((targetCell, layer, content) => {
      targetCell.showHighlight(layer, content);
    }, (objectCell, layer) => {
      objectCell.showHighlight(layer, null);
    });
  }

  stopHover() {
    this.forEachRelocatedAndGroupCell_((targetCell, layer, content) => {
      targetCell.hideHighlight(layer);
    }, (objectCell, layer) => {
      objectCell.hideHighlight(layer);
    });
    this.relocatedCells_ = [];
    this.hoveredCell_ = null;
  }

  startGesture() {
    this.forEachRelocatedAndGroupCell_((targetCell, layer, content) => {
      targetCell.setLayerContent(layer, content, true);
    }, (objectCell, layer) => {
      objectCell.setLayerContent(layer, null, true);
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

  forEachRelocatedAndGroupCell_(cellCallback, groupCallback) {
    // First, apply to existing colliding objects.
    this.forEachRelocatedCellLayerContent_((targetCell, layer, content) => {
      this.forEachObjectCell_(targetCell, layer, objectCell => {
        groupCallback(objectCell, layer);
      });
    });
    // Then apply to relocated cells.
    this.forEachRelocatedCellLayerContent_((targetCell, layer, content) => {
      cellCallback(targetCell, layer, content);
    });
  }

  forEachRelocatedCellLayerContent_(callback) {
    this.relocatedCells_.forEach(({key, location, layerContents}) => {
      const targetCell = state.theMap.cells.get(key);
      if (!targetCell) return;
      ct.children.forEach(layer => {
        callback(targetCell, layer, layerContents.get(layer));
      });
    });
  }

  forEachObjectCell_(cell, layer, callback) {
    const content = cell.getLayerContent(layer);
    if (!content) return;
    const endCellKey = content[ck.endCell];
    const startCellKey = content[ck.startCell];
    if (!endCellKey && !startCellKey) return;
    const startCell =
        startCellKey ? state.theMap.cells.get(startCellKey) : cell;
    const endCell =
        state.theMap.cells.get(startCell.getLayerContent(layer)[ck.endCell]);
    startCell.getPrimaryCellsInSquareTo(endCell).forEach(groupCell => {
      callback(groupCell);
    });
  }

  relocateCells_(newAnchor) {
    state.clipboard.cells.forEach(({location, key, role, layerContents}) => {
      const updatedLayerContents = new Map();
      layerContents.forEach((content, layer) => {
        updatedLayerContents.set(
            layer, this.updateContent_(layer, key, location, content));
      });
      this.relocatedCells_.push({
        key: this.calcKey_(newAnchor, role, location),
        location,
        layerContents: updatedLayerContents,
      });
    });
  }

  updateContent_(layer, key, location, content) {
    if (!content) return content;
    const newContent = Object.assign({}, content);
    // We only copy multi-cell layer content if *all* the relevant cells are
    // being copied.
    const startCellKey = content[ck.startCell];
    if (startCellKey) {
      const endCellKey = state.theMap.cells.get(startCellKey)
          .getLayerContent(layer, [ck.endCell]);
      if (!this.areAllCellsBeingCopied_(layer, startCellKey, endCellKey)) {
        return null;
      }
      newContent[ck.startCell] = this.relocateCellKey_(location, startCellKey);
    }
    const endCellKey = content[ck.endCell];
    if (endCellKey) {
      if (!this.areAllCellsBeingCopied_(layer, key, endCellKey)) {
        return null;
      }
      newContent[ck.endCell] = this.relocateCellKey_(location, endCellKey);
    }

    return newContent;
  }

  areAllCellsBeingCopied_(layer, startCellKey, endCellKey) {
    if (!state.clipboard.cells.some(({key}) => key == startCellKey)) {
      // The start cell is not being copied.
      return false;
    }
    for (let cell of state.theMap.cells.values()) {
      const cellLayerContent = cell.getLayerContent(layer);
      if (!cellLayerContent) continue;
      const cellStartCellKey = cellLayerContent[ck.startCell];
      if (cellStartCellKey && startCellKey == cellStartCellKey) {
        // This cell belongs to the same object!
        if (!state.clipboard.cells.some(({key}) => key == cell.key)) {
          // This cell doesn't appear in the clipboard.
          return false;
        }
      }
    }
    return true;
  }

  relocateCellKey_(location, key) {
    const rowDiff =
        this.hoveredCell_.row - state.clipboard.anchor.location.row;
    const columnDiff =
        this.hoveredCell_.column - state.clipboard.anchor.location.column;
    return key.split(':').map(part => {
      const coords = part.split(',');
      return Math.floor(Number(coords[0]) + rowDiff) + ',' +
          Math.floor(Number(coords[1]) + columnDiff);
    }).join(':');
  }

  calcKey_(anchor, cellRole, location) {
    const row = anchor.row + location.row;
    const column = anchor.column + location.column;
    switch (cellRole) {
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
