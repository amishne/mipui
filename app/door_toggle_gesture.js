class DoorToggleGesture extends Gesture {
  constructor() {
    super();
    this.cell_ = null;
    this.toDoor_ = null;
    this.timeoutId = null;
    this.wallToggleGesture_ = new WallToggleGesture();
    this.wallToggleGesture_.mode = 'divider only';
    this.wallToggleGesture_.toSolid = true;
    this.wallToggleGesture_.brushSize = 1;
  }

  startHover(cell) {
    this.cell_ = cell;
    if (!this.isCellEligible_(cell)) return;
    this.toDoor_ = !cell.getLayerValue('door');
    cell.showHighlight(
        'door', `${cell.role}-door-${this.toDoor_ ? 'add' : 'remove'}`);
    if (this.shouldPaintWall_()) {
      this.wallToggleGesture_.startHoverAfterInitialFieldsAreSet(cell);
    }
  }

  stopHover() {
    if (!this.cell_) return;
    this.cell_.hideHighlight(
        'door', `${this.cell_.role}-door-${this.toDoor_ ? 'add' : 'remove'}`);
    if (this.shouldPaintWall_()) {
      this.wallToggleGesture_.stopHover();
    }
  }
  
  startGesture() {
    if (!this.isCellEligible_(this.cell_)) return;
    this.stopHover();
    this.cell_.setLayerValue(
        'door', this.toDoor_ ? this.cell_.role : null , true);
    if (this.shouldPaintWall_()) {
      this.wallToggleGesture_.startGesture();
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
      this.wallToggleGesture_.continueGesture(cell);
    }
  }

  stopGesture() {
    delete this.timeoutId;
    if (this.shouldPaintWall_()) {
      this.wallToggleGesture_.stopGesture();
    } else {
      state.recordOperationComplete();
    }
  }
  
  isCellEligible_(cell) {
    return cell && (cell.role == 'horizontal' || cell.role == 'vertical');
  }
  
  shouldPaintWall_() {
    return this.toDoor_ && !state.tool.manualMode;
  }
}
