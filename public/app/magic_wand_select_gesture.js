class MagicWandSelectGesture extends SelectGesture {
  constructor() {
    super();
    this.predicate_ = null;
  }

  startGesture() {
    super.startGesture();
    if (!this.anchorCell_) return;
    const anchorIsWall = this.anchorCell_.isKind(ct.walls, ct.walls.smooth);
    this.predicate_ =
        cell => cell.isKind(ct.walls, ct.walls.smooth) == anchorIsWall;
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
      for (let cell of front.values()) {
        cell.getAllNeighbors().forEach(neighbor => {
          const neighborCells = neighbor.cells || [];
          if (neighbor.dividerCell) neighborCells.push(neighbor.dividerCell);
          neighborCells.forEach(neighborCell => {
            if (neighborCell &&
                this.predicate_(neighborCell) &&
                !this.selectedCells_.has(neighborCell) &&
                !front.has(neighborCell)) {
              newFront.add(neighborCell);
            }
          });
        });
      }
      newFront.forEach(cell => this.addSelectedCell_(cell));
      front = newFront;
    }
  }
}
