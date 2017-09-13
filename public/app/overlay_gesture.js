class OverlayGesture extends Gesture {
  constructor(layer, kind, variation) {
    super();
    this.layer_ = layer;
    this.kind_ = kind;
    this.variation_ = variation;
    this.hoveredCell_ = null;
    this.mode_ = null;
  }

  startHover(cell) {
    if (!cell) return;
    this.hoveredCell_ = cell;
    this.mode_ = cell.hasLayerContent(ct.overlay) ? 'removing' : 'adding';
    cell.showHighlight(this.layer_, this.createContent_());
  }

  stopHover() {
    if (this.hoveredCell_) this.hoveredCell_.hideHighlight(this.layer_);
    this.hoveredCell_ = null;
  }

  startGesture() {
    if (!this.hoveredCell_) return;
    this.hoveredCell_.hideHighlight(this.layer_);
    this.hoveredCell_.setLayerContent(this.layer_, this.createContent_(), true);
  }

  continueGesture(cell) {
    this.hoveredCell_ = cell;
    if (cell) cell.setLayerContent(this.layer_, this.createContent_(), true);
  }

  stopGesture() {
    state.opCenter.recordOperationComplete();
    if (this.hoveredCell_) this.startHover(this.hoveredCell_);
  }

  createContent_() {
    return this.mode_ == 'removing' ? null : {
      [ck.kind]: this.kind_.id,
      [ck.variation]: this.variation_.id,
    };
  }
}
