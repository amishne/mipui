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
    this.clearSelection_();
    if (this.anchorCell_) {
      // Clicking anywhere when there's an active selection just cancels it.
      this.anchorCell_ = null;
    } else {
      this.anchorCell_ = this.hoveredCell_;
    }
  }

  stopHover() {}
  stopGesture() {}

  copy() {}

  invert() {
    const newSet = new Set();
    this.anchorCell_ = null;
    state.theMap.cells.values().forEach(cell => {
      if (!this.selectedCells_.has(cell)) {
        if (!this.anchorCell) this.anchorCell_ = cell;
        newSet.add(cell);
      }
    });
    this.clearSelection_();
    this.selectedCells_ = newSet;
  }

  clearSelection_() {
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
