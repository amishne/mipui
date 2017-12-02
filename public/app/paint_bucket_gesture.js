class PaintBucketGesture extends Gesture {
  constructor() {
    super();
    this.magicWandGesture_ = new NoopMagicWandSelectGesture();
    this.wallGesture_ = new WallGesture(1, true);
    this.cellsToSet_ = [];
  }

  startHover(cell) {
    this.stopHover();
    const toWall = !cell.isKind(ct.walls, ct.walls.smooth);
    this.magicWandGesture_.partialCellsConsideredFloor = toWall;
    this.magicWandGesture_.hoveredCell_ = cell;
    this.magicWandGesture_.anchorCell_ = null;
    this.magicWandGesture_.startGesture(cell);
    const selectedCells = this.magicWandGesture_.selectedCells_;
    if (selectedCells.size == 0) return;
    this.wallGesture_.toWall = toWall;
    this.wallGesture_.cellsToSet = selectedCells;
    this.wallGesture_.startHoverAfterAllFieldsAreSet_();
  }

  stopHover() {
    this.wallGesture_.stopHover();
  }

  startGesture() {
    this.wallGesture_.startGesture();
    this.wallGesture_.stopGesture();
    state.opCenter.recordOperationComplete(false);
  }

  continueGesture(cell) {}

  stopGesture() {}
}

class NoopMagicWandSelectGesture extends MagicWandSelectGesture {
  addSelectedCell_(cell) {
    if (!cell) return;
    this.selectedCells_.add(cell);
  }
}
