class RoomGesture extends Gesture {
  constructor(hollow) {
    super();
    this.hollow_ = hollow;
    this.anchorCell_ = null;
    this.hoveredCell_ = null;
    this.cells_ = new Set();
    this.mode_ = null;
    this.borders_ = new Set();
  }

  startHover(cell) {
    this.hoveredCell_ = cell;
    if (!this.hoveredCell_ || this.hoveredCell_.role != 'primary') {
      this.anchorCell_ = null;
      return;
    }
    this.anchorCell_ = cell;
    this.clearCells_();
    if (this.hollow_) {
      this.mode_ = 'hollow';
    } else {
      this.mode_ = cell.hasLayerContent(ct.walls) ? 'toFloor' : 'toWall';
    }
  }

  startGesture() {
    if (!this.anchorCell_) return;
    this.addCell_(this.anchorCell_);
    this.calculateBorders_();
    this.showHighlight_();
  }

  stopHover() {}

  continueGesture(cell) {
    if (!this.anchorCell_ || !cell || cell.role != 'primary') return;
    this.clearCells_();
    this.addCell_(this.anchorCell_);
    const cells = this.anchorCell_.getPrimaryCellsInSquareTo(cell);
    cells.forEach(cell => this.addCell_(cell));
    this.calculateBorders_();
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
  
  apply_(highlightOnly) {
    const wallContent = {
      [ck.kind]: ct.walls.smooth.id,
      [ck.variation]: ct.walls.smooth.square.id,
    };

    this.cells_.forEach(cell => {
      if (this.mode_ == 'toFloor' && this.borders_.has(cell)) return;
      const content = this.mode_ == 'toWall' || this.borders_.has(cell) ?
          wallContent : null;
      if (highlightOnly) {
        cell.showHighlight(ct.walls, content);
      } else {
        cell.setLayerContent(ct.walls, content, true);
      }
    });
  }

  calculateBorders_() {
    this.borders_ = new Set();
    if (this.mode_ == 'toWall') return;

    let [minX, minY, maxX, maxY] = [null, null, null, null];
    this.cells_.forEach(cell => {
      minX = minX === null ? cell.column : Math.min(minX, cell.column);
      minY = minY === null ? cell.row : Math.min(minY, cell.row);
      maxX = maxX === null ? cell.column : Math.max(maxX, cell.column);
      maxY = maxY === null ? cell.row : Math.max(maxY, cell.row);
    });
    this.cells_.forEach(cell => {
      if (cell.column == minX || cell.column == maxX ||
         cell.row == minY || cell.row == maxY) {
        this.borders_.add(cell);
      }
    });
  }
}
