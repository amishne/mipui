class SelectGesture extends Gesture {
  constructor() {
    super();
    this.selectedCells_ = new Set();
    this.hoveredCell_ = null;
    this.anchorCell_ = null;
  }

  startHover(cell) {
    this.hoveredCell_ = cell;
  }

  startGesture() {
    this.clearSelection();
    if (this.anchorCell_) {
      // Clicking anywhere when there's an active selection just cancels it.
      this.anchorCell_ = null;
    } else {
      this.anchorCell_ = this.hoveredCell_;
    }
  }

  onUnselect() {
    super.onUnselect();
    this.clearSelection();
    this.anchorCell_ = null;
  }

  stopHover() {}
  stopGesture() {}

  copy() {
    if (!this.anchorCell_) return;
    this.copyWithoutClearingSelection_();
    this.clearSelection();
    this.anchorCell_ = null;
  }

  copyWithoutClearingSelection_() {
    const cellMapping = [];
    this.selectedCells_.forEach(cell => {
      const layerContents = new Map();
      ct.children.forEach(layer => {
        layerContents.set(
            layer,
            cell.getLayerContent(layer));
      });
      cellMapping.push({
        location: this.locationForCopy_(this.anchorCell_, cell),
        key: cell.key,
        role: cell.role,
        layerContents,
      });
    });
    state.clipboard = {
      anchor: {
        role: this.anchorCell_.role,
        location: {
          row: this.anchorCell_.row,
          column: this.anchorCell_.column,
        },
      },
      cells: cellMapping,
    };
  }

  cut() {
    if (!this.anchorCell_) return;
    this.copyWithoutClearingSelection_();
    this.deleteSelection();
  }

  deleteSelection() {
    if (!this.anchorCell_) return;
    this.selectedCells_.forEach(cell => {
      ct.children.forEach(layer => {
        const affectedCells = [cell];
        const content = cell.getLayerContent(layer);
        if (content && content[ck.endCell]) {
          this.forEachCellWithStartCell_(layer, cell, affectedCell =>
            affectedCells.push(affectedCell));
        }
        if (content && content[ck.startCell]) {
          const startCell = state.theMap.cells.get(content[ck.startCell]);
          this.forEachCellWithStartCell_(layer, startCell, affectedCell =>
            affectedCells.push(affectedCell));
        }
        affectedCells.forEach(
            affectedCell => affectedCell.setLayerContent(layer, null, true));
      });
    });
    state.opCenter.recordOperationComplete();
    this.clearSelection();
    this.anchorCell_ = null;
  }

  forEachCellWithStartCell_(layer, startCell, callback) {
    state.theMap.cells.forEach(cell => {
      if (cell == startCell) callback(cell);
    });
  }

  locationForCopy_(anchorCell, cell) {
    return {
      row: cell.row - anchorCell.row,
      column: cell.column - anchorCell.column,
    };
  }

  invert() {
    const newCells = [];
    this.anchorCell_ = null;
    for (const cell of state.theMap.cells.values()) {
      if (!this.selectedCells_.has(cell)) {
        if (!this.anchorCell_) this.anchorCell_ = cell;
        newCells.push(cell);
      }
    }
    this.clearSelection();
    newCells.map(cell => this.addSelectedCell_(cell));
  }

  clearSelection() {
    this.selectedCells_.forEach(cell => {
      cell.gridElement.classList.remove('selected-cell');
    });
    this.selectedCells_ = new Set();
  }

  addSelectedCell_(cell) {
    if (!cell) return;
    this.selectedCells_.add(cell);
    cell.gridElement.classList.add('selected-cell');
  }
}
