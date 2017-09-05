class SeparatorGesture extends Gesture {
  constructor(kind, variation, requiredWall) {
    super();
    this.layer_ = ct.separators;
    this.kind_ = kind;
    this.variation_ = variation;
    this.requiredWall_ = requiredWall;

    this.startCell_ = null;
    this.nonStartCells_ = [];
    this.mode = 'adding';
    this.makeWallGesture = null;
    this.hoveredCell_ = null;
  }

  startHover(cell) {
    // Corner case: hovering over a corner cell in the middle of a separator
    // behaves as if hovering over the next cell.
    if (cell.role == 'corner') {
      const rightCell = cell.getNeighbors('right').dividerCell;
      if (rightCell && rightCell.hasLayerContent(this.layer_) &&
          rightCell.getLayerContent(this.layer_)[ck.startCell]) {
        cell = rightCell;
      } else {
        const bottomCell = cell.getNeighbors('bottom').dividerCell;
        if (bottomCell && bottomCell.hasLayerContent(this.layer_) &&
            bottomCell.getLayerContent(this.layer_)[ck.startCell]) {
          cell = bottomCell;
        }
      }
    }
    this.hoveredCell_ = cell;
    if (!this.isCellEligible_(cell)) return;
    this.mode = cell.hasLayerContent(this.layer_) ? 'removing' : 'adding';
    this.setCells_(cell);
    this.showSeparatorHighlight_();

    if (this.shouldPaintWall_()) {
      this.makeWallGesture = new WallGesture(1, false);
      this.makeWallGesture.mode = 'divider only';
      this.makeWallGesture.toWall = this.requiredWall_;
      this.makeWallGesture.startHoverAfterInitialFieldsAreSet(cell);
    }
  }

  showSeparatorHighlight_() {
    this.startCell_.showHighlight(this.layer_, this.createStartCellContent_());
    this.nonStartCells_.forEach(nonStartCell => {
      nonStartCell.showHighlight(
        this.layer_, this.createNonStartCellContent_());
    });
  }

  hideSeparatorHighlight_() {
    this.startCell_.hideHighlight(this.layer_);
    this.nonStartCells_.forEach(nonStartCell => {
      nonStartCell.hideHighlight(this.layer_);
    });
  }

  getNextCell_(cell) {
    if (!cell) return null;
    return cell.getNeighbors(
      cell.role == 'horizontal' ? 'right-same' : 'bottom-same').cells[0];
  }

  getPrevCell_(cell) {
    if (!cell) return null;
    return cell.getNeighbors(
      cell.role == 'horizontal' ? 'left-same' : 'top-same').cells[0];
  }

  setCells_(cell) {
    this.startCell_ = null;
    this.nonStartCells_ = [];
    if (this.mode == 'adding') {
      this.startCell_ = cell;
    } else {
      // Clear the entire separator.
      this.startCell_ = state.theMap.cells.get(
        cell.getLayerContent(this.layer_)[ck.startCell]) || cell;
      let currCell = this.startCell_;
      while (true) {
        currCell = this.getNextCell_(currCell);
        if (!currCell || !currCell.hasLayerContent(this.layer_) ||
            currCell.getLayerContent(this.layer_)[ck.startCell] !=
            this.startCell_.key) {
          break;
        }
        this.nonStartCells_.push(currCell);
      }
    }
  }

  stopHover() {
    if (!this.startCell_) return;
    this.hideSeparatorHighlight_();
    if (this.shouldPaintWall_()) {
      this.makeWallGesture.stopHover();
    }
  }

  startGesture() {
    if (!this.isCellEligible_(this.hoveredCell_)) return;
    this.stopHover();
    this.apply_();
  }

  apply_() {
    this.startCell_.setLayerContent(
      this.layer_, this.createStartCellContent_(), true);
    this.nonStartCells_.forEach(nonStartCell => {
      nonStartCell.setLayerContent(
        this.layer_, this.createNonStartCellContent_(), true);
    });

    if (this.shouldPaintWall_()) {
      this.makeWallGesture.startGesture();
    }
  }

  continueGesture(cell) {
    // Can only continue separator-creation gestures.
    if (this.mode != 'adding') return;
    // Only enable for eligible, non-separator cells.
    if (!this.isCellEligible_(cell) || cell.hasLayerContent(ct.separators)) {
      return;
    }

    const prevCell = this.getPrevCell_(cell);
    const nextCell = this.getNextCell_(cell);

    if (prevCell == this.startCell_ || this.nonStartCells_.includes(prevCell)) {
      // Connecting forward, to a cell before this one.
      this.nonStartCells_.push(cell);
      let currCell = cell;
      while (currCell && currCell.isKind(this.layer_, this.kind_) &&
          (currCell.getLayerContent(this.layer_)[ck.startCell] ||
           currCell.getLayerContent(this.layer_)[ck.endCell])) {
        this.nonStartCells_.push(currCell);
        currCell = this.getNextCell_(currCell);
      }
    } else if (nextCell == this.startCell_) {
      // Connecting backward, to a cell after this one.
      this.nonStartCells_.unshift(this.startCell_);
      let currCell = cell;
      while (currCell && currCell.isKind(this.layer_, this.kind_) &&
          currCell.getLayerContent(this.layer_)[ck.startCell]) {
        this.nonStartCells_.unshift(currCell);
        currCell = this.getPrevCell_(currCell);
      }
      this.startCell_ = currCell;
    } else {
      return;
    }

    this.apply_();
    if (this.shouldPaintWall_()) {
      this.makeWallGesture.continueGesture(cell);
    }
  }

  stopGesture() {
    if (this.shouldPaintWall_()) {
      this.makeWallGesture.stopGesture();
    }
    state.opCenter.recordOperationComplete();
  }

  isCellEligible_(cell) {
    return cell && (cell.role == 'horizontal' || cell.role == 'vertical');
  }

  shouldPaintWall_() {
    return this.mode == 'adding' && this.requiredWall_ != null;
  }

  createStartCellContent_() {
    if (this.mode != 'adding') return null;
    const content = {
      [ck.kind]: this.kind_.id,
      [ck.variation]: this.variation_.id
    };
    if (this.nonStartCells_.length > 0) {
      content[ck.endCell] =
          this.nonStartCells_[this.nonStartCells_.length - 1].key;
    }
    return content;
  }

  createNonStartCellContent_() {
    if (this.mode != 'adding') return null;
    return {
      [ck.kind]: this.kind_.id,
      [ck.variation]: this.variation_.id,
      [ck.startCell]: this.startCell_.key
    };
  }
}
