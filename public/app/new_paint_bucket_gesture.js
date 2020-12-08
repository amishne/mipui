// Upcoming strategy:
// 1. Make every cell be told in which cardinal direction it was approached.
// 2. Make every cell notify the loop into which cardinal directions it should
//    be propagated, and with what intervals.
//    Propagation decisions need to be made by origin and not the target to
//    simplify full-cell handling.
// 3. To make propagation decision:
//   3.1 Collect clear intervals on each cell boundary.
//   3.2 Chart a line from the center of each input interval on the incoming
//       boundary to each clear interval on any other boundary walls.
//   3.3 If that line does not intersect any polygon line or any inclusion or
//       exclusion ellipse wall, add that target interval to the outgoing
//       interval collection.
// Testing map: ?mid=m9rgi9fv8rf&secret=si70dcirzb5

// Upcoming strategy v2:
// 1. Create a front class, composed of target cell, from direction, and
//    interval.
// 2. Change the wavefront to be fronts. Maintain seen list of fronts.
// 3. When a front is processed:
//   1. Choose a starting edge of that interval. Walk on the boundary, INTO that
//      point, until reaching the corner or intersecting with ANY of the
//      existing polygons or circles.
//   2. On each such intersection, mark a new polygon corner, and continue
//      walking on the next line - next boundary (if corner) or polygon line or
//      ellipse line.
//      * It actually needs to be a path and not a polygon, since some lines
//        can be ellipse lines.
//   3. When we reach back to the starting point (can be interval center), we've
//      created a new path. Add it to the cell's mask (possibly with
//      thicker lines?), then use its boundary-aligned edges as new intervals.

// Upcoming simplified strategy:
// As above, but:
// 1. For each polygon, find the interval point furthest away from it.
//    Expand the polygon to that point.
//   * How to propagate this? Manually check which boundary the new polygon
//     intersects?
// 2. For each ellipse, delete its exclusion if there's an interval point inside
//    it, delete its inclusion if there's one outside it, delete both if both.
//   * How to propagate this? Manually check which parts the outside and inside
//     touch? How? Probably needs to intersect the ellipse walls with all the
//     boundaries.

// OR
// For each polygon, find the two points closest to the interval. Then add a new
// polygon build by closest point 1, interval point 1, closest point 2, interval
// point 2. That leads to a lot of extra polygons though, and requires visiting
// all intervals.

class NewPaintBucketGesture extends Gesture {
  constructor() {
    super();
    this.anchorCell_ = null;
    this.prevAnchorCell_ = null;
    this.cellsToSet_ = new Map();
    this.lastOp_ = state.getLastOpNum();
    this.mode_ = null;
    this.iterativeCalculationTimeout_ = null;
  }

  startHover(cell) {
    super.startHover();
    const mode = cell.hasLayerContent(ct.walls) ? 'toFloor' : 'toWall';
    if (this.mode_ != mode ||
        !this.cellsToSet_.has(cell) || this.lastOp_ !== state.getLastOpNum()) {
      this.hideHighlights_();
      this.mode_ = mode;
      this.lastOp_ = state.getLastOpNum();
      this.anchorCell_ = cell;
      this.prevAnchorCell_ = cell;
      this.recalculateCellsToSet_(cell);
    } else {
      this.anchorCell_ = this.prevAnchorCell_;
    }
  }

  stopHover() {
    this.anchorCell_ = null;
    setTimeout(() => {
      if (this.anchorCell_ == null) {
        this.hideHighlights_();
        this.cellsToSet_.clear();
      }
    }, 1);
  }

  startGesture() {
    // Immediately stop processing additional cells.
    this.anchorCell_ = null;

    this.hideHighlights_();
    this.anchorCell_ = null;
    for (const [cell, contents] of this.cellsToSet_.entries()) {
      for (const [layer, content] of contents.entries()) {
        cell.setLayerContent(layer, content, true);
      }
    }
    state.opCenter.recordOperationComplete(false);
  }

  continueGesture(cell) {}

  stopGesture() {
    super.stopGesture();
    this.anchorCell_ = null;
  }

  refreshHighlights_(cell) {
    const contents = this.cellsToSet_.get(cell);
    if (!contents) return;
    for (const [layer, content] of contents.entries()) {
      cell.showHighlight(layer, content);
    }
  }

  hideHighlights_() {
    for (const [cell, contents] of this.cellsToSet_.entries()) {
      for (const [layer, content] of contents.entries()) {
        cell.hideHighlight(layer);
      }
    }
  }

  recalculateCellsToSet_(originCell) {
    this.cellsToSet_.clear();
    this.calculateNewContent_(originCell, 0, 0);
    this.refreshHighlights_(originCell);
    this.calculateBatch_(originCell, new Set([originCell]));
  }

  calculateBatch_(originCell, firstWaveFront) {
    if (originCell != this.anchorCell_) {
      // this is obsolete.
      return;
    }

    // Calculate wavefronts until the given number of cells has been calculated.
    // Then run a highlight pass, and then schedule the next batch.
    let count = 0;
    let currWave = firstWaveFront;
    while (count < constants.paintBucketBatchSize && currWave.size > 0) {
      const nextWave = new Set();
      for (const currentWaveCell of currWave) {
        if (count > constants.paintBucketBatchSize) {
          // We've exceeded the limit for this batch; just blindly add this cell
          // to the next wave.
          nextWave.add(currentWaveCell);
          continue;
        }
        const modifiedCells = this.addNeighbors_(currentWaveCell);
        count += modifiedCells.length;
        modifiedCells.forEach(modifiedCell => {
          if (modifiedCell.isPropagating) nextWave.add(modifiedCell.cell);
          this.refreshHighlights_(modifiedCell.cell);
        });
      }
      currWave = nextWave;
    }
    state.cursorStatusBar.showMessage(
        `Painting ${this.cellsToSet_.size} cells`);
    if (currWave.size > 0 &&
        this.cellsToSet_.size < constants.paintBucketMaxSize) {
      this.iterativeCalculationTimeout_ = setTimeout(() => {
        this.calculateBatch_(originCell, currWave);
      }, 1);
    }
  }

  addNeighbors_(originCell) {
    const modifiedCells = [];
    // Iterate cardinal directions.
    for (const [columnDiff, rowDiff]
        of [[-0.5, 0], [0.5, 0], [0, -0.5], [0, 0.5]]) {
      const neighbor =
          state.theMap.getCell(
              originCell.row + rowDiff, originCell.column + columnDiff);
      if (!neighbor) continue;

      const {isModified, isPropagating} =
          this.calculateNewContent_(neighbor, -columnDiff, -rowDiff);
      if (isModified) modifiedCells.push({cell: neighbor, isPropagating});
    }
    return modifiedCells;
  }

  calculateNewContent_(cell, columnDiff, rowDiff) {
    const existingWallContent = cell.getLayerContent(ct.walls);
    const existingCellsToSetContents = this.cellsToSet_.get(cell);

    if (this.mode_ == 'toFloor') {
      if (!existingWallContent) {
        // We're converting to floor and there's already floor there.
        return {isModified: false};
      }
      if (existingCellsToSetContents &&
          existingCellsToSetContents.has(ct.walls)) {
        // We already processed this.
        return {isModified: false};
      }
      return {
        isModified: this.setNewCellsToSetContent_(cell, ct.walls, null),
        isPropagating: true,
      };
    }
    if (this.mode_ == 'toWall') {
      if (existingWallContent) {
        if (existingWallContent[ck.variation] == ct.walls.smooth.angled.id) {
          return this.setAngledWallContent_(cell, columnDiff, rowDiff);
        }
        if (existingWallContent[ck.variation] == ct.walls.smooth.oval.id) {
          const isModified =
              this.setOvalWallContent_(cell, columnDiff, rowDiff);
          // Oval walls only propagate fills if the fill filled the entire cell,
          // turning it into square.
          const isPropagating =
              isModified &&
              this.cellsToSet_.get(cell).get(ct.walls)[ck.variation] ==
                  ct.walls.smooth.square.id;
          return {isModified, isPropagating};
        }
        // We're converting to wall and there's already wall there.
        return {isModified: false};
      }
      if (existingCellsToSetContents &&
          existingCellsToSetContents.has(ct.walls)) {
        // We already processed this.
        return {isModified: false};
      }
      return {
        isModified: this.setNewCellsToSetContent_(cell, ct.walls, {
          [ck.kind]: ct.walls.smooth.id,
          [ck.variation]: ct.walls.smooth.square.id,
        }),
        isPropagating: true,
      };
    }
  }

  setNewCellsToSetContent_(cell, layer, content) {
    let contents = this.cellsToSet_.get(cell);
    if (!contents) {
      contents = new Map();
      this.cellsToSet_.set(cell, contents);
    } else {
      const existingContent = contents.get(layer);
      if (sameContent(existingContent, content)) return false;
    }
    contents.set(layer, content);
    return true;
  }

  setAngledWallContent_(cell, columnDiff, rowDiff) {
    return false;
  }

  setOvalWallContent_(cell, columnDiff, rowDiff) {
    let existingWallContent = cell.getLayerContent(ct.walls);
    const contents = this.cellsToSet_.get(cell);
    if (contents && contents.has(ct.walls)) {
      existingWallContent = contents.get(ct.walls);
    }
    const existingInclusions =
        (existingWallContent[ck.clipInclude] || '').split('|');
    const existingExclusions =
        (existingWallContent[ck.clipExclude] || '').split('|');
    const newInclusions = [];
    const newExclusions = [];
    for (const inclusion of existingInclusions) {
      if (inclusion.startsWith('p')) {
        // Polygon.
        // 1. Find the two points closest to the direction we're coming from.
        // 2. For each point at or beyond corresponding cell corner, do nothing.
        // 3. Otherwise add points for each cell corner.
        // 4. Now look at two further points. If both are at or beyond
        //    corresponding corners, it means we've achieved full coverage; omit
        //    the polygon.
        const allPoints = inclusion.substr(2).split(';').map(point => {
          const [x, y] = point.split(',');
          return {x: Number(x), y: Number(y)};
        });
        const {closestPoints, furthestPoints} =
            this.analyzePolygonPoints_(cell, columnDiff, rowDiff, allPoints);
        if (furthestPoints.every(point => point.isBeyondCorner)) {
          // Omit this polygon.
          continue;
        }
        closestPoints.forEach(point => {
          if (point.isBeyondCorner) return;
          allPoints.splice(point.insertionIndex, 0, point.correspondingCorner);
        });
        newInclusions.push(
            `p:${allPoints.map(point => `${point.x},${point.y}`).join(';')}`);
      }
    }

    let newContent = null;
    if (newInclusions.length == 0 && newExclusions.length == 0) {
      // If all polygons and ellipses are omitted, just use square content.
      newContent = {
        [ck.kind]: ct.walls.smooth.id,
        [ck.variation]: ct.walls.smooth.square.id,
      };
    } else {
      newContent = {
        [ck.kind]: ct.walls.smooth.id,
        [ck.variation]: ct.walls.smooth.oval.id,
      };
      if (newInclusions.length > 0) {
        newContent[ck.clipInclude] = newInclusions.join('|');
      }
      if (newExclusions.length > 0) {
        newContent[ck.clipExclude] = newExclusions.join('|');
      }
    }
    return this.setNewCellsToSetContent_(cell, ct.walls, newContent);
  }

  analyzePolygonPoints_(cell, columnDiff, rowDiff, points) {
    // Closest and furthest depend on approach direction.
    const [rightMostTop, rightMostBottom] =
        this.findExtremePoints_(points, 1, 0, cell.height);
    const [leftMostTop, leftMostBottom] =
        this.findExtremePoints_(points, -1, 0, cell.height);
    const [topMostLeft, topMostRight] =
        this.findExtremePoints_(points, 0, -1, cell.width);
    const [bottomMostLeft, bottomMostRight] =
        this.findExtremePoints_(points, 0, 1, cell.width);
    if (!rightMostTop || !rightMostBottom || !leftMostTop || !leftMostBottom ||
        !topMostLeft || !topMostRight || !bottomMostLeft || !bottomMostRight) {
      // This shouldn't happen.
      debug(
          `Encountered cell (${cell.column},${cell.row}) with invalid polygon`);
      return {closestPoints: [], furthestPoints: []};
    }

    let closestPoints = [];
    let furthestPoints = [];
    if (columnDiff != 0 && rowDiff == 0) {
      // Coming from the right or left.
      const rightMostPoints = [{
        isBeyondCorner: rightMostTop.x >= cell.width && rightMostTop.y <= 0,
        correspondingCorner: {x: cell.width, y: 0},
        insertionIndex: rightMostTop.insertionIndex,
      }, {
        isBeyondCorner:
            rightMostBottom.x >= cell.width && rightMostBottom.y >= cell.height,
        correspondingCorner: {x: cell.width, y: cell.height},
        insertionIndex: rightMostBottom.insertionIndex,
      }];
      const leftMostPoints = [{
        isBeyondCorner: leftMostTop.x <= 0 && leftMostTop.y <= 0,
        correspondingCorner: {x: 0, y: 0},
        insertionIndex: leftMostTop.insertionIndex,
      }, {
        isBeyondCorner:
            leftMostBottom.x <= 0 && leftMostBottom.y >= cell.height,
        correspondingCorner: {x: 0, y: cell.height},
        insertionIndex: leftMostBottom.insertionIndex,
      }];
      closestPoints = columnDiff > 0 ? rightMostPoints : leftMostPoints;
      furthestPoints = columnDiff > 0 ? leftMostPoints : rightMostPoints;
    } else if (columnDiff == 0 && rowDiff != 0) {
      // Coming from the bottom or top.
      const bottomMostPoints = [{
        isBeyondCorner:
            bottomMostRight.x >= cell.width && bottomMostRight.y >= cell.height,
        correspondingCorner: {x: cell.width, y: cell.height},
        insertionIndex: bottomMostRight.insertionIndex,
      }, {
        isBeyondCorner:
            bottomMostLeft.x <= 0 && bottomMostLeft.y >= cell.height,
        correspondingCorner: {x: 0, y: cell.height},
        insertionIndex: bottomMostLeft.insertionIndex,
      }];
      const topMostPoints = [{
        isBeyondCorner: topMostRight.x >= cell.width && topMostRight.y <= 0,
        correspondingCorner: {x: cell.width, y: 0},
        insertionIndex: topMostRight.insertionIndex,
      }, {
        isBeyondCorner: topMostLeft.x <= 0 && topMostLeft.y <= 0,
        correspondingCorner: {x: 0, y: 0},
        insertionIndex: topMostLeft.insertionIndex,
      }];
      closestPoints = rowDiff > 0 ? bottomMostPoints : topMostPoints;
      furthestPoints = rowDiff > 0 ? topMostPoints : bottomMostPoints;
    }

    return {closestPoints, furthestPoints};
  }

  findExtremePoints_(points, xDirection, yDirection, minOrthogonalValue) {
    // We're looking for the two points with the most extreme (x,y) in
    // xDirection and yDirection, as long as their orthogonal dimension is <= 0
    // for the first point and >= minOrthogonalValue for the second point.
    // For example, findExtremePoints_(..., 1, 0, 10) will return the rightmost
    // point that has y <= 0 and the rightmost point that has y >= 10.
    let first = null;
    let second = null;
    const isMoreExtreme = (p1, p2) => {
      if (!p2) return true;
      if (xDirection > 0) {
        return p1.x > p2.x;
      } else if (xDirection < 0) {
        return p1.x < p2.x;
      } else if (yDirection > 0) {
        return p1.y > p2.y;
      } else if (yDirection < 0) {
        return p1.y < p2.y;
      }
      throw `Could not find extreme point with +(${xDirection}, ${yDirection})`;
    }
    const orthogonalDimension = xDirection == 0 ? 'x' : 'y';
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      if (point[orthogonalDimension] <= 0 && isMoreExtreme(point, first)) {
        first = {x: point.x, y: point.y, insertionIndex: i};
      }
      if (point[orthogonalDimension] >= minOrthogonalValue &&
          isMoreExtreme(point, second)) {
        second = {x: point.x, y: point.y, insertionIndex: i};
      }
    }
    if (first.insertionIndex < second.insertionIndex) {
      first.insertionIndex++;
    } else {
      second.insertionIndex++;
    }
    return [first, second];
  }
}
