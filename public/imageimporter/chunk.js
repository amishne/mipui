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
    // Compose a front from all cells of similar stats.
    let front =
        new Set(this.cellInfo_.cellList.filter(
          cell => this.areCellsSimilar_(seed, cell, 'global')));
    while (front.size > 0) {
      const newFront = new Set();
      for (const frontCell of front) {
        for (const neighbor of this.getImmediateNeighbors_(frontCell)) {
          if (this.cells_.has(neighbor) ||
              this.boundaries_.has(neighbor)) {
            continue;
          }
          if (this.areCellsSimilar_(frontCell, neighbor, 'immediate')) {
            this.cells_.add(neighbor);
            newFront.add(neighbor);
          } else {
            this.boundaries_.add(neighbor);
          }
        }
        for (const neighbor of this.getSameNeighbors_(frontCell)) {
          if (this.cells_.has(neighbor) ||
              this.boundaries_.has(neighbor)) {
            continue;
          }
          if (this.areCellsSimilar_(frontCell, neighbor, 'same')) {
            this.cells_.add(neighbor);
            newFront.add(neighbor);
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

  getSameNeighbors_(cell) {
    const neighbors = [];
    for (let colDiff = -1; colDiff <= 1; colDiff++) {
      for (let rowDiff = -1; rowDiff <= 1; rowDiff++) {
        const neighbor =
            this.cellInfo_.getCell(cell.col + colDiff, cell.row + rowDiff);
        if (neighbor) neighbors.push(neighbor);
      }
    }
    return neighbors;
  }

  areCellsSimilar_(cell1, cell2, tier) {
    if (cell1 == cell2) return true;
    let colorEpsilon = 0;
    let varianceEpsilon = 0;
    switch (tier) {
      case 'immediate':
        colorEpsilon = 20;
        varianceEpsilon = 10000;
        break;
      case 'same':
        colorEpsilon = 20;
        varianceEpsilon = 10000;
        break;
      case 'global':
        colorEpsilon = 10;
        varianceEpsilon = 100;
        break;
    }
    return this.areCellsSimilarToEpsilon_(
        cell1, cell2, colorEpsilon, varianceEpsilon);
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
