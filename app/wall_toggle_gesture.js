class WallToggleGesture {
  constructor() {
  }
  
  prepare(targetedCell) {
    this.toSolid = !targetedCell.isSolid;
    this.primaryCellsOnly = targetedCell.isPrimary;
    this.calculateRootCellsAndCellsToSet(targetedCell);
    this.cellsToSet.forEach(cell => {
      cell.showHighlight(this.toSolid);
    });
  }
  
  calculateRootCellsAndCellsToSet(targetedCell) {
    this.rootCells = this.calcRootCells(targetedCell);
    this.cellsToSet = new Set();
    this.rootCells.forEach(rootCell => {
      this.calcCellsToSet(rootCell).forEach(cellToSet => {
        this.cellsToSet.add(cellToSet);
      });
    });
  }
  
  flatten(collectionOfCollections) {
    return collectionOfCollections.reduce(function(a, b) {
      return a.concat(b);
    }, []);
  }
      
  calcRootCells(targetedCell) {
    let roots = [targetedCell];
    if (!this.primaryCellsOnly || state.getTool().brushSize == 1) {
      return roots;
    }
    let front = targetedCell;
    let fronts = [targetedCell];
    for (let i = 0; i < state.getTool().brushSize - 1; i++) {
      const primaryCellToTheRight =
          front.getNeighbors('right').primaryCells[0];
      if (!primaryCellToTheRight) break;
      roots.push(primaryCellToTheRight);
      front = primaryCellToTheRight;
      fronts.push(primaryCellToTheRight);
    }
    for (let i = 1; i < state.getTool().brushSize; i++) {
      const newFronts = [];
      fronts.forEach(front => {
        newFronts.push(front.getNeighbors('bottom').primaryCells[0]);
      });
      if (!newFronts[0]) break;
      roots = roots.concat(newFronts);
      fronts = newFronts;
    }
    return roots;
  }
  
  calcCellsToSet(cell) {
    let result = [];
    if (cell.isSolid != this.toSolid) {
      result.push(cell);
    }
    if (this.primaryCellsOnly && cell.isPrimary) {
      for (const neighbor of cell.getAllNeighbors()) {
        if (!neighbor.dividerCell) continue;
        const dividerIsSolid = neighbor.dividerCell.isSolid;
        if (!dividerIsSolid && this.toSolid) {
          result.push(neighbor.dividerCell);
        } else if (dividerIsSolid && !this.toSolid) {
          if (!this.toSolid && !this.anyCellIsSolid(neighbor.primaryCells)) {
            result.push(neighbor.dividerCell);
          }
        }
      }
    }
    return result;
  }
  
  anyCellIsSolid(cells) {
    return cells.some(cell => {
      return cell &&
          (this.rootCells.indexOf(cell) >= 0 ? this.toSolid : cell.isSolid);
    });
  }
  
  stopPreparing() {
    this.cellsToSet.forEach(cell => {
      cell.hideHighlight(this.toSolid);
    });
  }
  
  start() {
    this.stopPreparing();
    this.apply();
  }
  
  continueInNewCell(cell) {
    this.stopPreparing();
    if (!cell.isPrimary && this.primaryCellsOnly) return;
    this.calculateRootCellsAndCellsToSet(cell);
    this.apply();
  }
  
  complete() {
    delete this.timeoutId;
    state.recordChange();
  }
  
  apply() {
    this.cellsToSet.forEach(cell => {
      if (this.toSolid) {
        cell.setSolid();
      } else {
        cell.setClear();
      }
    });
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = setTimeout(() => {
      this.complete();
    }, 1000);
  }
}
