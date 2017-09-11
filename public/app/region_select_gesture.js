class RegionSelectGesture extends SelectGesture {
  startGesture() {
    super.startGesture();
    if (!this.anchorCell_ || this.hoveredCell_.role != 'primary') {
      this.anchorCell_ = null;
      return;
    }
    this.addSelectedCell_(this.anchorCell_);
  }

  continueGesture(cell) {
    if (!this.anchorCell_ || !cell || cell.role != 'primary') return;
    this.clearSelection();
    this.addSelectedCell_(this.anchorCell_);
    const cells = this.anchorCell_.getPrimaryCellsInSquareTo(cell);
    const borderCells = [];
    cells.forEach(cell => cell.getAllNeighbors().forEach(neighbor => {
      if (!neighbor || !neighbor.dividerCell) return;
      borderCells.push(neighbor.dividerCell);
    }));
    cells.forEach(cell => this.addSelectedCell_(cell));
    borderCells.forEach(cell => this.addSelectedCell_(cell));
  }
}
