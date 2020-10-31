class PaintBucketGesture extends Gesture {
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
          nextWave.add(modifiedCell);
          this.refreshHighlights_(modifiedCell);
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

      const isModified =
          this.calculateNewContent_(neighbor, -columnDiff, -rowDiff);
      if (isModified) modifiedCells.push(neighbor);
    }
    return modifiedCells;
  }

  calculateNewContent_(cell, columnDiff, rowDiff) {
    const existingWallContent = cell.getLayerContent(ct.walls);
    const existingCellsToSetContents = this.cellsToSet_.get(cell);

    if (this.mode_ == 'toFloor') {
      if (!existingWallContent) {
        // We're converting to floor and there's already floor there.
        return false;
      }
      if (existingCellsToSetContents &&
          existingCellsToSetContents.has(ct.walls)) {
        // We already processed this.
        return false;
      }
      return this.setNewCellsToSetContent_(cell, ct.walls, null);
    }
    if (this.mode_ == 'toWall') {
      if (existingWallContent) {
        if (existingWallContent.hasOwnProperty(ck.clipExclude) ||
            existingWallContent.hasOwnProperty(ck.clipInclude)) {
        }
        // We're converting to wall and there's already wall there.
        return false;
      }
      if (existingCellsToSetContents &&
          existingCellsToSetContents.has(ct.walls)) {
        // We already processed this.
        return false;
      }
      return this.setNewCellsToSetContent_(cell, ct.walls, {
        [ck.kind]: ct.walls.smooth.id,
        [ck.variation]: ct.walls.smooth.square.id,
      });
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
}
/*
class OldPaintBucketGesture extends Gesture {
  constructor() {
    super();
    this.magicWandGesture_ = new NoopMagicWandSelectGesture();
    this.wallGesture_ = new WallGesture(1, true);
    this.cellsToSet_ = new Set();
    this.lastOp_ = state.getLastOpNum();
    this.targetCell_ = null;
    this.timer_ = null;
  }

  startHover(cell) {
    this.stopHover();
    if (cell == this.targetCell_) {
      return;
    }
    this.targetCell_ = cell;
    if (this.timer_) {
      clearTimeout(this.timer_);
    }
    this.timer_ = setTimeout(() => {
      this.timer_ = null;
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
    }, 30);
  }

  stopHover() {
    if (this.timer_) {
      clearTimeout(this.timer_);
      this.timer_ = null;
    } else {
      this.wallGesture_.stopHover();
    }
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

class What {
  constructor() {
    super();
  }

  startGesture() {
    super.startGesture();
    if (!this.anchorCell_) return;
    const anchorIsWall = this.anchorCell_.isKind(ct.walls, ct.walls.smooth);
    this.includePredicate_ = cell => {
      const isWall = cell.isKind(ct.walls, ct.walls.smooth);
      if (isWall && anchorIsWall) return true;
      if (!isWall && !anchorIsWall) return true;
      if (anchorIsWall || !this.partialCellsConsideredFloor) return false;
      const isPartialWall =
          cell.isVariation(ct.walls, ct.walls.smooth, ct.walls.smooth.angled) ||
          cell.isVariation(ct.walls, ct.walls.smooth, ct.walls.smooth.oval);
      return anchorIsWall != isPartialWall;
    };
    this.advancePredicate_ =
        cell => anchorIsWall == cell.isKind(ct.walls, ct.walls.smooth);
    this.addCellsLinkedTo_(this.anchorCell_);
  }

  continueGesture(cell) {
    this.addCellsLinkedTo_(cell);
  }

  addCellsLinkedTo_(cell) {
    let front = new Set();
    front.add(cell);
    this.addSelectedCell_(cell);
    while (front.size > 0) {
      const newFront = new Set();
      const newCells = new Set();
      for (const cell of front.values()) {
        this.getImmediateNeighborCells(cell).forEach(neighborCell => {
          if (neighborCell &&
              this.includePredicate_(neighborCell) &&
              !this.selectedCells_.has(neighborCell) &&
              !front.has(neighborCell)) {
            newCells.add(neighborCell);
            if (this.advancePredicate_(neighborCell)) {
              newFront.add(neighborCell);
            }
          }
        });
      }
      newCells.forEach(cell => this.addSelectedCell_(cell));
      if (this.selectedCells_.size > constants.maxNumSelectedCells) return;
      front = newFront;
    }
  }

  getImmediateNeighborCells(cell) {
    const result = [];
    if (!cell) return result;
    switch (cell.role) {
      case 'corner':
      case 'primary':
        result.push(cell.getNeighbor('top', true));
        result.push(cell.getNeighbor('right', true));
        result.push(cell.getNeighbor('bottom', true));
        result.push(cell.getNeighbor('left', true));
        result.push(cell.getNeighbor('top-right', cell.role == 'primary'));
        result.push(cell.getNeighbor('bottom-right', cell.role == 'primary'));
        result.push(cell.getNeighbor('bottom-left', cell.role == 'primary'));
        result.push(cell.getNeighbor('top-left', cell.role == 'primary'));
        break;
      case 'horizontal':
        result.push(cell.getNeighbor('top', false));
        result.push(cell.getNeighbor('right', true));
        result.push(cell.getNeighbor('bottom', false));
        result.push(cell.getNeighbor('left', true));
        break;
      case 'vertical':
        result.push(cell.getNeighbor('top', true));
        result.push(cell.getNeighbor('right', false));
        result.push(cell.getNeighbor('bottom', true));
        result.push(cell.getNeighbor('left', false));
        break;
    }
    return result;
  }
}
*/
