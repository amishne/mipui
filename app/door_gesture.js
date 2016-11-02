class DoorGesture extends Gesture {
  constructor() {
    super();
    this.cell_ = null;
    this.toDoor = null;
    this.timeoutId = null;
    this.makeWallSolidGesture = null;
  }

  startHover(cell) {
    this.cell_ = cell;
    if (!this.isCellEligible_(cell)) return;
    this.toDoor = !cell.getLayerValue('door');
    cell.showHighlight(
        'door', `${cell.role}-door-${this.toDoor ? 'add' : 'remove'}`);
    if (this.shouldPaintWall_()) {
      this.makeWallSolidGesture = new WallGesture();
      this.makeWallSolidGesture.mode = 'divider only';
      this.makeWallSolidGesture.toSolid = true;
      this.makeWallSolidGesture.brushSize = 1;
      this.makeWallSolidGesture.startHoverAfterInitialFieldsAreSet(cell);
    }
  }

  stopHover() {
    if (!this.cell_) return;
    this.cell_.hideHighlight(
        'door', `${this.cell_.role}-door-${this.toDoor ? 'add' : 'remove'}`);
    if (this.shouldPaintWall_()) {
      this.makeWallSolidGesture.stopHover();
    }
  }
  
  startGesture() {
    if (!this.isCellEligible_(this.cell_)) return;
    this.stopHover();
    this.cell_.setLayerValue(
        'door', this.toDoor ? this.cell_.role : null , true);
    if (this.shouldPaintWall_()) {
      this.makeWallSolidGesture.startGesture();
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
      this.makeWallSolidGesture.continueGesture(cell);
    }
  }

  stopGesture() {
    delete this.timeoutId;
    if (this.shouldPaintWall_()) {
      this.makeWallSolidGesture.stopGesture();
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
}
