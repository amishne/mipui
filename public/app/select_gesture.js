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
  }

  stopHover() {}
  stopGesture() {}

  copy() {
    const cellMapping = [];
    this.selectedCells_.forEach(cell => {
      cellMapping.push({
        location: this.locationForCopy_(this.anchorCell_, cell),
        cell,
      });
    });
    state.clipboard = {
      anchor: this.anchorCell_,
      cells: cellMapping,
    };
    this.clearSelection();
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
    for (let cell of state.theMap.cells.values()) {
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
