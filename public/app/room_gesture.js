class RoomGesture extends Gesture {
  constructor(hollow) {
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

  process_() {}

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
}
