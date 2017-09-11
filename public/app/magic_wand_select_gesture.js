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
      for (const cell of front.values()) {
        this.getImmediateNeighborCells(cell).forEach(neighborCell => {
          if (neighborCell &&
              this.predicate_(neighborCell) &&
              !this.selectedCells_.has(neighborCell) &&
              !front.has(neighborCell)) {
            newFront.add(neighborCell);
          }
        });
      }
      newFront.forEach(cell => this.addSelectedCell_(cell));
      front = newFront;
    }
  }

  getImmediateNeighborCells(cell) {
    const result = [];
    if (!cell) return result;
    switch (cell.role) {
      case 'corner':
      case 'primary':
        result.push(cell.getNeighbor('top', true));
        result.push(cell.getNeighbor('right', true));
        result.push(cell.getNeighbor('bottom', true));
        result.push(cell.getNeighbor('left', true));
        break;
      case 'horizontal':
        result.push(cell.getNeighbor('top', false));
        result.push(cell.getNeighbor('right', true));
        result.push(cell.getNeighbor('bottom', false));
        result.push(cell.getNeighbor('left', true));
        break;
      case 'vertical':
        result.push(cell.getNeighbor('top', true));
        result.push(cell.getNeighbor('right', false));
        result.push(cell.getNeighbor('bottom', true));
        result.push(cell.getNeighbor('left', false));
        break;
    }
    return result;
  }
}
