class OvalRoomGesture extends RoomGesture {
  constructor(hollow) {
    super();
    this.hollow_ = hollow;
    // This maps each cell to either fully inside the ellipse, fully outside it,
    // or on the border - and if so, its x and y offsets from the top-left cell.
    this.cellValues_ = new Map();
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
    if (this.mode_ == 'toWall' || this.mode_ == 'hollow') {
      this.mapCellsToValues_(true, 'w');
    }
    if (this.mode_ == 'toFloor' || this.mode_ == 'hollow') {
      this.mapCellsToValues_(false, 'f');
    }
  }
  
  mapCellsToValues_(includeBoundaries, mapKey) {
    // Outline:
    // 1. Find the ellipse center point.
    // 2. For each cell, find the point in that cell closest to the center and
    //    the point furthest away from the center.
    // 3. If the ellipse passes between those points, it means the cell needs
    //    a special clip path.
  
    // This is in rows/cols, not pixels.
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
      const cellValue = this.cellValues_.get(cell) || {};
      this.cellValues_.set(cell, cellValue);
      const keyedValue = {};
      cellValue[mapKey] = keyedValue;

      if ((this.mode_ == 'toWall' && cell.hasLayerContent(ct.walls)) ||
          (this.mode_ == 'toFloor' && !cell.hasLayerContent(ct.walls))) {
        keyedValue.pos = 'outside';
        return;
      }
      const closestPixel = {
        x: clamp(cell.offsetLeft, centerPoint.x, cell.offsetLeft + cell.width),
        y: clamp(cell.offsetTop, centerPoint.y, cell.offsetTop + cell.height),
      };
      if (check(closestPixel.x, closestPixel.y) > 1) {
        keyedValue.pos = 'outside';
        return;
      }
      const furthestPixel = {
        x: cell.offsetLeft + (cell.column >= centerX ? cell.width : 0),
        y: cell.offsetTop + (cell.row >= centerY ? cell.height : 0),
      };
      if (check(furthestPixel.x, furthestPixel.y) < 1) {
        keyedValue.pos = 'inside';
        return;
      }
      keyedValue.rx = axes.x / 2;
      keyedValue.ry = axes.y / 2;
      keyedValue.cx = centerPoint.x;
      keyedValue.cy = centerPoint.y;
    });
    
  }
  
  ellipseEquation_(x, y, h, k, rx, ry) {
    return Math.pow(x - h, 2) / Math.pow(rx, 2) +
        Math.pow(y - k, 2) / Math.pow(ry, 2);
  }

  shouldApplyContentTo_(cell) {
    const val = this.cellValues_.get(cell);
    return (val.w && val.w.pos != 'outside') ||
        (val.f && val.f.pos != 'outside');
  }

  calculateContent_(cell) {
    const val = this.cellValues_.get(cell);
    if ((!val.w || val.w.pos == 'inside') &&
        (!val.f || val.f.pos == 'inside')) {
      return this.mode_ == 'toWall' ? this.wallContent_ : null;
    }
    const result = {
      [ck.kind]: ct.walls.smooth.id,
      [ck.variation]: ct.walls.smooth.oval.id,
    };
    if (val.w && val.w.cx) {
      result[ck.clipInclude] = this.calculateEllipse_(val.w, cell);
    }
    if (val.f && val.f.cx) {
      result[ck.clipExclude] = this.calculateEllipse_(val.f, cell);
    }
    return result;
  }
  
  calculateEllipse_(val, cell) {
    return `e:${val.rx},${val.ry},` +
        `${val.cx - cell.offsetLeft},${val.cy - cell.offsetTop}`
  }
}
