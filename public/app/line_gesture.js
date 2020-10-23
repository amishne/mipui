class LineGesture extends OvalRoomGesture {
  constructor() {
    super(false);
    this.startCorner_ = null;
    this.endCorner_ = null;
  }

  getPrimaryNearCorner_(cornerCell) {
    let primaryCell = cornerCell.getNeighbor('top-right', false);
    if (!primaryCell) {
      primaryCell = cornerCell.getNeighbor('bottom-right', false);
    }
    if (!primaryCell) {
      primaryCell = cornerCell.getNeighbor('bottom-left', false);
    }
    if (!primaryCell) {
      primaryCell = cornerCell.getNeighbor('top-left', false);
    }
    return primaryCell;
  }

  startHover(cell) {
    if (!cell || cell.role != 'corner') {
      this.hoveredCell = null;
      this.anchorCell_ = null;
      return;
    }
    this.cellValues_ = new Map();
    const primaryCell = this.getPrimaryNearCorner_(cell);
    if (!primaryCell) return;
    this.startCorner_ = cell;
    this.endCorner_ = cell;
    super.startHover(primaryCell);
  }

  continueGesture(cell) {
    if (!this.anchorCell_ || !cell || cell.role != 'corner') {
      return;
    }
    this.endCorner_ = cell;
    const primaryCell = this.getPrimaryNearCorner_(cell);
    super.continueGesture(primaryCell);
  }

  addFullCell_(column, row) {
    const cell = state.theMap.getCell(row, column);
    const cellValue = this.cellValues_.get(cell) || {};
    this.cellValues_.set(cell, cellValue);
    const keyedValue = {};
    const mapKey = this.mode_ == 'toWall' ? 'w' : 'f';
    cellValue[mapKey] = keyedValue;
    keyedValue.pos = 'full';
  }

  process_() {
    // Outline:
    // 1. Prepare a special case for completely vertical or horizontal lines.
    //    Otherwise, continue to the next step.
    // 2. There are 4 imaginary lines - from each corner of startCorner to each
    //    corresponding corner of endCorner.
    //    Isolate the 2 external lines among these 4, using the relation between
    //    end and start corners.
    // 3. For each boundary line of each cell, find its intersection with the
    //    first line and then the second line. If there are exactly two in-
    //    bound intersections, the line passes through the cell. If both lines
    //    don't pass through the cell, skip the cell.
    // 3. Four each boundary line, among the 4 intersection points, find the
    //    two at the greatest extent.
    // 4. If both are not on the line itself, skip the cell.
    // 5. 
    this.addFullCell_(this.startCorner_.column, this.startCorner_.row);
    if (this.startCorner === this.endCorner) return;
    this.addFullCell_(this.endCorner_.column, this.endCorner_.row);

    if (this.startCorner_.row === this.endCorner_.row) {
      for (let column = this.startCorner_.column + 0.5;
          column < this.endCorner_.column; column += 0.5) {
        this.addFullCell_(column, this.startCorner_.row);
      }
      return;
    }
    if (this.startCorner_.column === this.endCorner_.column) {
      for (let row = this.startCorner_.row + 0.5;
          row < this.endCorner_.row; row += 0.5) {
        this.addFullCell_(this.startCorner_.column, row);
      }
      return;
    }
/*
    // This is in rows/cols, not pixels.
    const {minX, minY, maxX, maxY} =
        this.calculateMinMaxCellPositions_(includeBoundaries);
    const [centerX, centerY] =
        [minX + (maxX - minX) / 2, minY + (maxY - minY) / 2];

    const topLeftCell = state.theMap.cells.get(CellMap.cellKey(minY, minX));
    const bottomRightCell = state.theMap.cells.get(CellMap.cellKey(maxY, maxX));
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
    const check = (x, y) => this.ellipseEquation_(
        x, y, centerPoint.x, centerPoint.y, axes.x / 2, axes.y / 2);
    this.cells_.forEach(cell => {
      const cellValue = this.cellValues_.get(cell) || {};
      this.cellValues_.set(cell, cellValue);
      const keyedValue = {};
      cellValue[mapKey] = keyedValue;
      if ((this.mode_ == 'toWall' &&
           this.hasWallContentWithoutClipping_(cell)) ||
          (this.mode_ == 'toFloor' &&
           !this.hasWallContentWithoutClipping_(cell))) {
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
    */
  }

  calculateContent_(cell) {
    const val = this.cellValues_.get(cell);
    if (val.w && val.w.pos == 'full') {
      return this.wallContent_;
    }
    if (val.f && val.f.pos == 'full') {
      return null;
    }
  }

  shouldApplyContentTo_(cell) {
    const val = this.cellValues_.get(cell);
    return val &&
        ((val.w && val.w.pos == 'full') ||
        (val.f && val.f.pos == 'full'));
  }
}
