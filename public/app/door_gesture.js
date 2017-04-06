class DoorGesture extends Gesture {
  constructor(variation) {
    super();
    this.variation_ = variation;
    this.startCell_ = null;
    this.nonStartCells_ = [];
    this.toDoor = null;
    this.makeWallGesture = null;
    this.hoveredCell_ = null;
  }

  startHover(cell) {
    // Corner case: hovering over a corner cell in the middle of a door behaves
    // as if hovering over the next cell.
    if (cell.role == 'corner') {
      const rightCell = cell.getNeighbors('right').dividerCell;
      if (rightCell && rightCell.isKind(ct.doors, ct.doors.door) &&
          rightCell.getLayerContent(ct.doors)[ck.startCell]) {
        cell = rightCell;
      } else {
        const bottomCell = cell.getNeighbors('bottom').dividerCell;
        if (bottomCell && bottomCell.isKind(ct.doors, ct.doors.door) &&
            bottomCell.getLayerContent(ct.doors)[ck.startCell]) {
          cell = bottomCell;
        }
      }
    }
    this.hoveredCell_ = cell;
    if (!this.isCellEligible_(cell)) return;
    this.toDoor = !cell.isKind(ct.doors, ct.doors.door);
    this.setCells_(cell);
    this.showDoorHighlight_();

    if (this.shouldPaintWall_()) {
      this.makeWallGesture = new WallGesture(1, false);
      this.makeWallGesture.mode = 'divider only';
      this.makeWallGesture.toWall = true;
      this.makeWallGesture.startHoverAfterInitialFieldsAreSet(cell);
    }
  }

  showDoorHighlight_() {
    this.startCell_.showHighlight(ct.doors, this.createStartCellContent_());
    this.nonStartCells_.forEach(nonStartCell => {
      nonStartCell.showHighlight(ct.doors, this.createNonStartCellContent_());
    });
  }

  hideDoorHighlight_() {
    this.startCell_.hideHighlight(ct.doors);
    this.nonStartCells_.forEach(nonStartCell => {
      nonStartCell.hideHighlight(ct.doors);
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
    if (this.toDoor) {
      this.startCell_ = cell;
    } else {
      // Clear the entire door.
      this.startCell_ = state.theMap.cells.get(
          cell.getLayerContent(ct.doors)[ck.startCell]) || cell;
      let currCell = this.startCell_;
      while (true) {
        currCell = this.getNextCell_(currCell);
        if (!currCell || !currCell.isKind(ct.doors, ct.doors.door) ||
            currCell.getLayerContent(ct.doors)[ck.startCell] !=
            this.startCell_.key) {
          break;
        }
        this.nonStartCells_.push(currCell);
      }
    }
  }

  stopHover() {
    if (!this.startCell_) return;
    this.hideDoorHighlight_();
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
        ct.doors, this.createStartCellContent_(), true);
    this.nonStartCells_.forEach(nonStartCell => {
      nonStartCell.setLayerContent(
          ct.doors, this.createNonStartCellContent_(), true);
    });

    if (this.shouldPaintWall_()) {
      this.makeWallGesture.startGesture();
    }
  }

  continueGesture(cell) {
    // Can only continue door-creation gestures.
    if (!this.toDoor) return;
    // Only enable for eligible cells.
    if (!this.isCellEligible_(cell)) return;

    const prevCell = this.getPrevCell_(cell)
    const nextCell = this.getNextCell_(cell);

    if (prevCell == this.startCell_ ||
        this.nonStartCells_.includes(prevCell)) {
      // Connecting forward, to a cell before this one.
      this.nonStartCells_.push(cell);
      let currCell = cell;
      while (currCell && currCell.isKind(ct.doors, ct.doors.door) &&
          (currCell.getLayerContent(ct.doors)[ck.startCell] ||
           currCell.getLayerContent(ct.doors)[ck.endCell])) {
        this.nonStartCells_.push(currCell);
        currCell = this.getNextCell_(currCell);
      }
    } else if (nextCell == this.startCell_) {
      // Connecting backward, to a cell after this one.
      this.nonStartCells_.unshift(this.startCell_);
      let currCell = cell;
      while (currCell && currCell.isKind(ct.doors, ct.doors.door) &&
          currCell.getLayerContent(ct.doors)[ck.startCell]) {
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
    return this.toDoor;
  }

  createStartCellContent_() {
    if (!this.toDoor) return null;
    const content = {
      [ck.kind]: ct.doors.door.id,
      [ck.variation]: this.variation_.id,
    };
    if (this.nonStartCells_.length > 0) {
      content[ck.endCell] =
          this.nonStartCells_[this.nonStartCells_.length - 1].key;
    }
    return content;
  }

  createNonStartCellContent_() {
    if (!this.toDoor) return null;
    return {
      [ck.kind]: ct.doors.door.id,
      [ck.variation]: this.variation_.id,
      [ck.startCell]: this.startCell_.key,
    }
  }
}
