class SquareRoomGesture extends RoomGesture {
  constructor(hollow) {
    super();
    this.hollow_ = hollow;
    this.borders_ = new Set();
    this.wallContent_ = {
      [ck.kind]: ct.walls.smooth.id,
      [ck.variation]: ct.walls.smooth.square.id,
    };
  }

  startHover(cell) {
    super.startHover(cell);
    if (this.hollow_) this.mode_ = 'hollow';
  }

  process_() {
    this.borders_ = new Set();
    if (this.mode_ == 'toWall') return;

    const {minX, minY, maxX, maxY} = this.calculateMinMaxCellPositions_(true);
    this.cells_.forEach(cell => {
      if (cell.column == minX || cell.column == maxX ||
         cell.row == minY || cell.row == maxY) {
        this.borders_.add(cell);
      }
    });
  }

  shouldApplyContentTo_(cell) {
    return !(this.mode_ == 'toFloor' && this.borders_.has(cell));
  }

  calculateContent_(cell) {
    return (this.mode_ == 'toWall' || this.borders_.has(cell)) ?
        this.wallContent_ : null;
  }
}
