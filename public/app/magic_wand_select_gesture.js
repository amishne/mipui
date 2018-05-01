class MagicWandSelectGesture extends SelectGesture {
  constructor() {
    super();
    this.includePredicate_ = null;
    this.advancePredicate_ = null;
    this.partialCellsConsideredFloor = false;
  }

  startGesture() {
    super.startGesture();
    if (!this.anchorCell_) return;
    const anchorIsWall = this.anchorCell_.isKind(ct.walls, ct.walls.smooth);
    this.includePredicate_ = cell => {
      const isWall = cell.isKind(ct.walls, ct.walls.smooth);
      if (isWall && anchorIsWall) return true;
      if (!isWall && !anchorIsWall) return true;
      if (anchorIsWall || !this.partialCellsConsideredFloor) return false;
      const isPartialWall =
          cell.isVariation(ct.walls, ct.walls.smooth, ct.walls.smooth.angled) ||
          cell.isVariation(ct.walls, ct.walls.smooth, ct.walls.smooth.oval);
      return anchorIsWall != isPartialWall;
    };
    this.advancePredicate_ =
        cell => anchorIsWall == cell.isKind(ct.walls, ct.walls.smooth);
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
      const newCells = new Set();
      for (const cell of front.values()) {
        this.getImmediateNeighborCells(cell).forEach(neighborCell => {
          if (neighborCell &&
              this.includePredicate_(neighborCell) &&
              !this.selectedCells_.has(neighborCell) &&
              !front.has(neighborCell)) {
            newCells.add(neighborCell);
            if (this.advancePredicate_(neighborCell)) {
              newFront.add(neighborCell);
            }
          }
        });
      }
      newCells.forEach(cell => this.addSelectedCell_(cell));
      if (this.selectedCells_.size > constants.maxNumSelectedCells) return;
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
        result.push(cell.getNeighbor('top-right', cell.role == 'primary'));
        result.push(cell.getNeighbor('bottom-right', cell.role == 'primary'));
        result.push(cell.getNeighbor('bottom-left', cell.role == 'primary'));
        result.push(cell.getNeighbor('top-left', cell.role == 'primary'));
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
