class DoorToggleGesture extends Gesture {
  constructor() {
    super();
    this.cell_ = null;
    this.toDoor_ = null;
    this.wallToggleGesture_ = new WallToggleGesture();
    this.wallToggleGesture_.mode = 'divider only';
    this.wallToggleGesture_.toSolid = true;
    this.wallToggleGesture_.brushSize = 1;
  }

  startHover(cell) {
    if (!this.isCellEligible_(cell)) return;
    this.cell_ = cell;
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
    this.stopHover();
    this.cell_.setLayerValue(
        'door', this.toDoor_ ? this.cell_.role : null , true);
    if (this.shouldPaintWall_()) {
      this.wallToggleGesture_.startGesture();
    }
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
    if (this.shouldPaintWall_()) {
      this.wallToggleGesture_.stopGesture();
    } else {
      state.recordOperationComplete();
    }
  }
  
  isCellEligible_(cell) {
    return cell.role == 'horizontal' || cell.role == 'vertical';
  }
  
  shouldPaintWall_() {
    return this.toDoor_ && !state.tool.manualMode;
  }
}
