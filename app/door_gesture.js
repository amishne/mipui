class DoorGesture extends Gesture {
  constructor() {
    super();
    this.cell_ = null;
    this.toDoor = null;
    this.timeoutId = null;
    this.makeWallGesture = null;
  }

  startHover(cell) {
    this.cell_ = cell;
    if (!this.isCellEligible_(cell)) return;
    this.toDoor = !cell.isKind(ct.doors, ct.doors.door);
    cell.showHighlight(ct.doors, this.createContent_());
    if (this.shouldPaintWall_()) {
      this.makeWallGesture = new WallGesture();
      this.makeWallGesture.mode = 'divider only';
      this.makeWallGesture.toWall = true;
      this.makeWallGesture.brushSize = 1;
      this.makeWallGesture.startHoverAfterInitialFieldsAreSet(cell);
    }
  }

  stopHover() {
    if (!this.cell_) return;
    this.cell_.hideHighlight(ct.doors);
    if (this.shouldPaintWall_()) {
      this.makeWallGesture.stopHover();
    }
  }

  startGesture() {
    if (!this.isCellEligible_(this.cell_)) return;
    this.stopHover();
    this.cell_.setLayerContent(ct.doors, this.createContent_(), true);
    if (this.shouldPaintWall_()) {
      this.makeWallGesture.startGesture();
    }
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = setTimeout(() => {
      this.stopGesture();
    }, 1000);
  }

  continueGesture(cell) {
    if (!this.isCellEligible_(cell)) return;
    this.cell_ = cell;
    this.startGesture();
    if (this.shouldPaintWall_()) {
      this.makeWallGesture.continueGesture(cell);
    }
  }

  stopGesture() {
    delete this.timeoutId;
    if (this.shouldPaintWall_()) {
      this.makeWallGesture.stopGesture();
    } else {
      state.recordOperationComplete();
    }
  }

  isCellEligible_(cell) {
    return cell && (cell.role == 'horizontal' || cell.role == 'vertical');
  }

  shouldPaintWall_() {
    return this.toDoor && !state.tool.manualMode;
  }

  createContent_() {
    if (!this.toDoor) return null;
    const kind = ct.doors.door;
    return {
      [ck.kind]: kind.id,
      [ck.variation]: kind.single.id,
    }
  }
}
