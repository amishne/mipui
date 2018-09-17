class Chunk {
  constructor(cellInfo, id) {
    this.id = id;
    this.cellInfo_ = cellInfo;
    this.cells_ = new Set();
    this.boundaries_ = new Set();
  }

  has(cell) {
    return this.cells_.has(cell);
  }

  get size() {
    return this.cells_.size;
  }

  addSeed(seed) {
    if (this.cells_.has(seed)) return;
    this.cells_.add(seed);
    seed.chunk = this;
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
            neighbor.chunk = this;
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
            neighbor.chunk = this;
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
    let meanColorEpsilon = 0;
    let centerColorEpsilon = 0;
    switch (tier) {
      case 'immediate':
        meanColorEpsilon = 100;
        centerColorEpsilon = 60;
        break;
      case 'same':
        meanColorEpsilon = 80;
        centerColorEpsilon = 40;
        break;
      case 'global':
        meanColorEpsilon = 20;
        centerColorEpsilon = 10;
        break;
    }
    return this.areCellsSimilarToEpsilon_(
        cell1, cell2, meanColorEpsilon, centerColorEpsilon);
  }

  areCellsSimilarToEpsilon_(
      cell1, cell2, meanColorEpsilon, centerColorEpsilon) {
    if (this.colorDistanceSquared_(cell1.meanColor, cell2.meanColor) >
        Math.pow(meanColorEpsilon, 2)) {
      return false;
    }
    if (this.colorDistanceSquared_(cell1.centerColor, cell2.centerColor) >
        Math.pow(centerColorEpsilon, 2)) {
      return false;
    }
    return true;
  }

  colorDistanceSquared_(c1, c2) {
    let sum = 0;
    for (let i = 0; i < 4; i++) {
      sum += Math.pow(c1[i] - c2[i], 2);
    }
    return sum;
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
