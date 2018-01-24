class PaintBucketGesture extends Gesture {
  constructor() {
    super();
    this.magicWandGesture_ = new NoopMagicWandSelectGesture();
    this.wallGesture_ = new WallGesture(1, true);
    this.cellsToSet_ = new Set();
    this.lastOp_ = state.getLastOpNum();
  }

  startHover(cell) {
    this.stopHover();
    if (this.cellsToSet_.has(cell) && this.lastOp_ == state.getLastOpNum()) {
      this.wallGesture_.startHoverAfterAllFieldsAreSet_();
      return;
    }
    const toWall = !cell.isKind(ct.walls, ct.walls.smooth);
    this.magicWandGesture_.partialCellsConsideredFloor = toWall;
    this.magicWandGesture_.hoveredCell_ = cell;
    this.magicWandGesture_.anchorCell_ = null;
    this.magicWandGesture_.startGesture(cell);
    this.cellsToSet_ = this.magicWandGesture_.selectedCells_;
    this.lastOp_ = state.getLastOpNum();
    if (this.cellsToSet_.size == 0) {
      this.wallGesture_.cellsToSet = [];
      return;
    }
    this.wallGesture_.toWall = toWall;
    this.wallGesture_.cellsToSet = this.cellsToSet_;
    this.wallGesture_.startHoverAfterAllFieldsAreSet_();
  }

  stopHover() {
    this.wallGesture_.stopHover();
  }

  startGesture() {
    super.startGesture();
    this.wallGesture_.startGesture();
    this.wallGesture_.stopGesture();
    state.opCenter.recordOperationComplete(false);
  }

  continueGesture(cell) {}

  stopGesture() {
    this.cellsToSet_ = new Set();
    super.stopGesture();
  }
}

class NoopMagicWandSelectGesture extends MagicWandSelectGesture {
  addSelectedCell_(cell) {
    if (!cell) return;
    this.selectedCells_.add(cell);
  }
}
