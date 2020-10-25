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

  calculateMode_() {
    return 'toWall';
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
    this.cellValues_.set(cell, {pos: 'full'});
  }

  process_() {
    this.cellValues_.clear();

    // Add start and end corners as full cells.
    this.addFullCell_(this.startCorner_.column, this.startCorner_.row);
    if (this.startCorner_ === this.endCorner_) return;
    this.addFullCell_(this.endCorner_.column, this.endCorner_.row);

    // Corner-case for vertical or horizontal lines.
    if (this.startCorner_.row === this.endCorner_.row) {
      const step =
          this.startCorner_.column < this.endCorner_.column ? 0.5 : -0.5;
      for (let column = this.startCorner_.column + step;
          column != this.endCorner_.column; column += step) {
        this.addFullCell_(column, this.startCorner_.row);
      }
      return;
    }
    if (this.startCorner_.column === this.endCorner_.column) {
      const step = this.startCorner_.row < this.endCorner_.row ? 0.5 : -0.5;
      for (let row = this.startCorner_.row + step;
          row != this.endCorner_.row; row += step) {
        this.addFullCell_(this.startCorner_.column, row);
      }
      return;
    }

    this.processAngledLine_();
  }

  verticalLineIntersection_(verticalLineX, minY, maxY, x1, y1, x2, y2) {
    // https://en.wikipedia.org/wiki/Line%E2%80%93line_intersection
    const [x3, y3] = [verticalLineX, minY];
    const [x4, y4] = [verticalLineX, maxY];
    const intersectionY =
        ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) /
        ((x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4));
    return (intersectionY < minY || intersectionY > maxY) ?
        null : {x: verticalLineX, y: intersectionY};
  }

  horizontalLineIntersection_(horizontalLineY, minX, maxX, x1, y1, x2, y2) {
    // https://en.wikipedia.org/wiki/Line%E2%80%93line_intersection
    const [x3, y3] = [minX, horizontalLineY];
    const [x4, y4] = [maxX, horizontalLineY];
    const intersectionX =
        ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) /
        ((x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4));
    return (intersectionX < minX || intersectionX > maxX) ?
        null : {x: intersectionX, y: horizontalLineY};
  }

  calculateExternalLines_() {
    const rowBefore = this.startCorner_.row < this.endCorner_.row;
    const columnBefore = this.startCorner_.column < this.endCorner_.column;
    const [start, end] = [this.startCorner_, this.endCorner_].map(cell => ({
      left: cell.offsetLeft,
      right: cell.offsetLeft + cell.width,
      top: cell.offsetTop,
      bottom: cell.offsetTop + cell.height,
    }));
    return {
      line1: {
        x1: rowBefore ? start.left : start.right,
        y1: columnBefore ? start.bottom : start.top,
        x2: rowBefore ? end.left : end.right,
        y2: columnBefore ? end.bottom : end.top,
      },
      line2: {
        x1: rowBefore ? start.right : start.left,
        y1: columnBefore ? start.top : start.bottom,
        x2: rowBefore ? end.right : end.left,
        y2: columnBefore ? end.top : end.bottom,
      },
    };
  }

  processAngledLine_() {
    // Outline:
    // 1. There are 4 imaginary lines - from each corner of startCorner to each
    //    corresponding corner of endCorner.
    //    Isolate the 2 external lines among these 4, using the relation between
    //    end and start corners.
    // 2. For each one of the four boundary line of each cell, find its
    //    intersection with the first line and then the second line. If there's
    //    at least one intersection, add a clip to the cell of a polygon using
    //    the 4 endpoints of the two external lines.
    const externalLines = this.calculateExternalLines_();

    this.cells_.forEach(cell => {
      // Skip the endpoint corners.
      if (cell == this.startCorner_ || cell == this.endCorner_) return;
      // Skip any full walls in-between.
      if (cell.hasLayerContent(ct.walls) &&
          !cell.getLayerContent(ct.walls)[ck.clipExclude] &&
          !cell.getLayerContent(ct.walls)[ck.clipInclude]) {
        return;
      }
      const [left, right, top, bottom] = [
        cell.offsetLeft,
        cell.offsetLeft + cell.width,
        cell.offsetTop,
        cell.offsetTop + cell.height,
      ];
      let hasIntersections = false;
      [externalLines.line1, externalLines.line2].forEach(
          (externalLine, index) => {
            if (hasIntersections) return;
            [top, bottom].forEach(horizontalLineY => {
              if (hasIntersections) return;
              const intersection = this.horizontalLineIntersection_(
                  horizontalLineY,
                  left,
                  right,
                  externalLine.x1, externalLine.y1,
                  externalLine.x2, externalLine.y2);
              if (intersection) hasIntersections = true;
            });
            [left, right].forEach(verticalLineX => {
              if (hasIntersections) return;
              const intersection = this.verticalLineIntersection_(
                  verticalLineX,
                  top,
                  bottom,
                  externalLine.x1, externalLine.y1,
                  externalLine.x2, externalLine.y2);
              if (intersection) hasIntersections = true;
            });
      });
      if (hasIntersections) {
        const cellValue = this.cellValues_.get(cell) || {};
        this.cellValues_.set(cell, {
          pos : 'intersects',
          polygon: [
            `${externalLines.line1.x1 - left},${externalLines.line1.y1 - top}`,
            `${externalLines.line1.x2 - left},${externalLines.line1.y2 - top}`,
            `${externalLines.line2.x2 - left},${externalLines.line2.y2 - top}`,
            `${externalLines.line2.x1 - left},${externalLines.line2.y1 - top}`,
          ].join(';'),
        });
      }
    });
  }

  calculateContent_(cell) {
    const val = this.cellValues_.get(cell);
    if (val.pos == 'full') {
      return this.wallContent_;
    }
    if (val.pos == 'intersects') {
      const result = {
        [ck.kind]: ct.walls.smooth.id,
        [ck.variation]: ct.walls.smooth.oval.id,
      };
      let resultString = ''
      const existingContent = cell.getLayerContent(ct.walls);
      if (existingContent && existingContent[ck.clipInclude]) {
        resultString += existingContent[ck.clipInclude] + '|';
      }
      if (existingContent && existingContent[ck.clipExclude]) {
        result[ck.clipExclude] = existingContent[ck.clipExclude];
      }
      resultString += 'p:' + val.polygon;
      result[ck.clipInclude] = resultString;
      return result;
    }
  }

  shouldApplyContentTo_(cell) {
    return this.cellValues_.has(cell);
  }
}
