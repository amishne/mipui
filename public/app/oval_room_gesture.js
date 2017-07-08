class OvalRoomGesture extends RoomGesture {
  constructor() {
    super();
    // This maps each cell to either fully inside the ellipse, fully outside it,
    // or on the border - and if so, its x and y offsets from the top-left cell.
    this.cellValues_ = new Map();
    this.wallContent_ = {
      [ck.kind]: ct.walls.smooth.id,
      [ck.variation]: ct.walls.smooth.square.id,
    };
  }

  process_() {
    // Outline:
    // 1. Find the ellipse center point.
    // 2. For each cell, find the point in that cell closest to the center and
    //    the point furthest away from the center.
    // 3. Apply XXX
  
    // This is in rows/cols, not pixels.
    const includeBoundaries = this.mode_ != 'toFloor';
    const {minX, minY, maxX, maxY} =
        this.calculateMinMaxCellPositions_(includeBoundaries);
    const [centerX, centerY] =
        [minX + (maxX - minX) / 2, minY + (maxY - minY) / 2];

    const topLeftCell = state.theMap.cells.get(TheMap.cellKey(minY, minX));
    const bottomRightCell = state.theMap.cells.get(TheMap.cellKey(maxY, maxX));
    const topLeftPoint = {
      x: topLeftCell.offsetLeft,
      y: topLeftCell.offsetTop,
    };
    const bottomRightPoint = {
      x: bottomRightCell.offsetLeft + bottomRightCell.width,
      y: bottomRightCell.offsetTop + bottomRightCell.height,
    };
    const centerPoint = {
      x: topLeftPoint.x + (bottomRightPoint.x - topLeftPoint.x) / 2,
      y: topLeftPoint.y + (bottomRightPoint.y - topLeftPoint.y) / 2,
    };
    const axes = {
      x: bottomRightPoint.x - topLeftPoint.x,
      y: bottomRightPoint.y - topLeftPoint.y,
    };
    const check = (x, y) => {
      return this.ellipseEquation_(
          x, y, centerPoint.x, centerPoint.y, axes.x / 2, axes.y / 2);
    }
    this.cells_.forEach(cell => {
      const closestPixel = {
        x: clamp(cell.offsetLeft, centerPoint.x, cell.offsetLeft + cell.width),
        y: clamp(cell.offsetTop, centerPoint.y, cell.offsetTop + cell.height),
      };
      if (check(closestPixel.x, closestPixel.y) > 1) {
        this.cellValues_.set(cell, {pos: 'outside'});
        return;
      }
      const furthestPixel = {
        x: cell.offsetLeft + (cell.column >= centerX ? cell.width : 0),
        y: cell.offsetTop + (cell.row >= centerY ? cell.height : 0),
      };
      if (check(furthestPixel.x, furthestPixel.y) < 1) {
        this.cellValues_.set(cell, {pos: 'inside'});
        return;
      }
      this.cellValues_.set(cell, {
        rx: axes.x / 2,
        ry: axes.y / 2,
        cx: centerPoint.x,
        cy: centerPoint.y,
      });
    });
    
  }
  
  ellipseEquation_(x, y, h, k, rx, ry) {
    return Math.pow(x - h, 2) / Math.pow(rx, 2) +
        Math.pow(y - k, 2) / Math.pow(ry, 2);
  }

  shouldApplyContentTo_(cell) {
    return this.cellValues_.get(cell).pos != 'outside';
  }

  calculateContent_(cell) {
    const val = this.cellValues_.get(cell);
    if (val.pos == 'inside') {
      return this.mode_ == 'toWall' ? this.wallContent_ : null;
    }
    return {
      [ck.kind]: ct.walls.smooth.id,
      [ck.variation]: ct.walls.smooth.oval.id,
      [ck.oval]: `${val.rx},${val.ry},` +
          `${val.cx - cell.offsetLeft},${val.cy - cell.offsetTop},` +
          (this.mode_ == 'toWall' ? 'w' : 'f'),
    };
  }
}
