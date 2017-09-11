class RoomGesture extends Gesture {
  constructor() {
    super();
    this.anchorCell_ = null;
    this.hoveredCell_ = null;
    this.cells_ = new Set();
    this.mode_ = null;
  }

  startHover(cell) {
    this.hoveredCell_ = cell;
    if (!this.hoveredCell_ || this.hoveredCell_.role != 'primary') {
      this.anchorCell_ = null;
      return;
    }
    this.anchorCell_ = cell;
    this.clearCells_();
    this.mode_ = cell.hasLayerContent(ct.walls) ? 'toFloor' : 'toWall';
  }

  startGesture() {
    if (!this.anchorCell_) return;
    this.addCell_(this.anchorCell_);
    this.process_();
    this.showHighlight_();
  }

  stopHover() {}

  continueGesture(cell) {
    if (!this.anchorCell_ || !cell || cell.role != 'primary') return;
    this.clearCells_();
    this.addCell_(this.anchorCell_);
    const cells = this.anchorCell_.getPrimaryCellsInSquareTo(cell);
    cells.forEach(cell => this.addCell_(cell));
    this.process_();
    this.showHighlight_();
  }

  stopGesture() {
    this.apply_(false);
    this.clearCells_();
  }

  addCell_(cell) {
    this.cells_.add(cell);
    cell.getAllNeighbors().forEach(neighbor => {
      if (!neighbor || !neighbor.dividerCell) return;
      this.cells_.add(neighbor.dividerCell);
    });
  }

  clearCells_() {
    this.cells_.forEach(cell => {
      cell.hideHighlight(ct.walls);
    });
    this.cells_ = new Set();
  }

  showHighlight_() {
    this.apply_(true);
  }

  calculateMinMaxCellPositions_(includeDividers) {
    let [minX, minY, maxX, maxY] = [null, null, null, null];
    this.cells_.forEach(cell => {
      if (!includeDividers && !(cell.role == 'primary')) return;
      minX = minX === null ? cell.column : Math.min(minX, cell.column);
      minY = minY === null ? cell.row : Math.min(minY, cell.row);
      maxX = maxX === null ? cell.column : Math.max(maxX, cell.column);
      maxY = maxY === null ? cell.row : Math.max(maxY, cell.row);
    });
    return {minX, minY, maxX, maxY};
  }

  apply_(highlightOnly) {
    this.cells_.forEach(cell => {
      if (!this.shouldApplyContentTo_(cell)) return;
      const content = this.calculateContent_(cell);
      if (highlightOnly) {
        cell.showHighlight(ct.walls, content);
      } else {
        cell.setLayerContent(ct.walls, content, true);
      }
    });
  }

  // Called once before per-cell calls to shouldApplyContentTo_ and to
  // calculateContent_.
  process_() {}

  shouldApplyContentTo_() {
    return false;
  }

  calculateContent_() {
    return null;
  }
}
