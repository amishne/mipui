class SightGesture extends Gesture {
  constructor() {
    super();
    this.hoveredCell_ = null;
    this.cellsInSight_ = [];
  }
  startHover(cell) {
    if (!cell || cell.role != 'primary') return;
    this.hoveredCell_ = cell;
    this.cellsInSight_ = this.calculateCellsInSight_(cell);
    this.cellsInSight_.forEach(cellInSight => {
      cellInSight.showHighlight(ct.overlay, {
        [ck.kind]: ct.overlay.hidden.id,
        [ck.variation]: ct.overlay.hidden.black.id,
      });
    });
  }
  stopHover() {
    this.cellsInSight_.forEach(cellInSight => {
      cellInSight.hideHighlight(ct.overlay);
    });
    this.hoveredCell_ = null;
    this.cellsInSight_ = [];
  }

  startGesture() {}
  continueGesture(cell) {}
  stopGesture() {}

  calculateCellsInSight_(cell) {
    return [cell];
  }
}
