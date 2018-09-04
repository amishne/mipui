class Chunk {
  constructor(cellInfo) {
    this.cellInfo_ = cellInfo;
    this.cells_ = new Set();
    this.boundaries_ = new Set();
  }

  has(cell) {
    return this.cells_.has(cell);
  }

  addSeed(seed) {
    if (this.cells_.has(seed)) return;
    this.cells_.add(seed);
    // Compose a front from all cells of identical stats.
    let front =
        new Set(this.cellInfo_.cellList.filter(
          cell => this.areCellsIdentical_(seed, cell)));
    while (front.size > 0) {
      const newFront = new Set();
      for (const frontCell of front) {
        for (const neighbor of this.getImmediateNeighbors_(frontCell)) {
          if (this.cells_.has(neighbor) ||
              this.boundaries_.has(neighbor)) {
            continue;
          }
          if (this.areCellsSimilar_(seed, neighbor)) {
            this.cells_.add(neighbor);
            newFront.add(neighbor);
          } else {
            this.boundaries_.add(neighbor);
          }
        }
      }
      front = newFront;
    }
  }

  getImmediateNeighbors_(cell) {
    const neighbors = [];
    for (let colDiff = -0.5; colDiff <= 0.5; colDiff += 0.5) {
      for (let rowDiff = -0.5; rowDiff <= 0.5; rowDiff += 0.5) {
        const neighbor =
            this.cellInfo_.getCell(cell.col + colDiff, cell.row + rowDiff);
        if (neighbor) neighbors.push(neighbor);
      }
    }
    return neighbors;
  }

  areCellsSimilar_(cell1, cell2) {
    return this.areCellsSimilarToEpsilon_(cell1, cell2, 75, 5000);
  }

  areCellsIdentical_(cell1, cell2) {
    return this.areCellsSimilarToEpsilon_(cell1, cell2, 25, 5000);
  }

  areCellsSimilarToEpsilon_(cell1, cell2, colorEpsilon, varianceEpsilon) {
    for (let i = 0; i < cell1.meanColor.length; i++) {
      if (Math.abs(cell1.meanColor[i] - cell2.meanColor[i]) > colorEpsilon) {
        return false;
      }
    }
    for (let i = 0; i < cell1.variance.length; i++) {
      if (Math.abs(cell1.variance[i] - cell2.variance[i]) > varianceEpsilon) {
        return false;
      }
    }
    return true;
  }

  draw(mat, color) {
    for (const cell of this.cells_) {
      cv.rectangle(mat,
          new cv.Point(cell.x, cell.y),
          new cv.Point(cell.x + cell.width, cell.y + cell.height),
          color, cv.FILLED);
    }
  }
}
