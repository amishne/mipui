class WallToggleGesture {
  constructor() {
    // Cell to target. Determines by hovered cell and by the brush size. This
    // includes cells that will not be changed since they're already with the
    // desired content.
    this.rootCells = null;

    // Cells to change once the gesture is applies. In manual mode, it's just
    // the root cells; in smart mode, it also includes some of the surrounding
    // dividers. It doesn't include cells that don't need to be set since they
    // are already with the desired content.
    this.cellsToSet = null;

    // One of 'manual', 'primary only' and 'divider only'.
    this.mode = null;

    // Gesture toggle direction, either true or false.
    this.toSolid = null;
  }
  
  prepare(targetedCell) {
    this.toSolid = !targetedCell.isSolid;
    this.mode = !state.getTool().smartMode ? 'manual' :
        (targetedCell.role == 'primary' ? 'primary only' : 'divider only');
    this.calculateRootCellsAndCellsToSet(targetedCell);
    this.cellsToSet.forEach(cell => {
      cell.showHighlight(this.toSolid);
    });
  }
  
  calculateRootCellsAndCellsToSet(targetedCell) {
    this.rootCells = this.calcRootCells(targetedCell);
    this.cellsToSet = new Set();
    this.rootCells.forEach(rootCell => {
      if (rootCell) this.addCellsToSet(rootCell);
    });
  }
  
  flatten(collectionOfCollections) {
    return collectionOfCollections.reduce(function(a, b) {
      return a.concat(b);
    }, []);
  }
      
  calcRootCells(targetedCell) {
    if (this.mode == 'manual') {
      // Don't respect brush size in manual mode, for now.
      return new Set([targetedCell]);
    }
    if (this.mode == 'primary only' && targetedCell.role == 'primary') {
      return this.calcSmartRootCells(targetedCell);
    }
    if (this.mode == 'divider only' &&
        (targetedCell.role == 'horizontal divider' ||
         targetedCell.role == 'vertical divider')) {
      return this.calcSmartRootCells(targetedCell);
    }
    return new Set();
  }
  
  calcSmartRootCells(targetedCell) {
    let roots = new Set([targetedCell]);
    let front = new Set([targetedCell]);
    for (let i = 1; i < state.getTool().brushSize; i += 2) {
      const newFront = new Set();
      front.forEach(cell => {
        cell.getNeighbors('all-similar').cells.forEach(neighborCell => {
          if (neighborCell && !roots.has(neighborCell)) {
            roots.add(neighborCell);
            newFront.add(neighborCell);
          }
        });
      });
      front = newFront;
    }
    return roots;
  }
  
  addCellsToSet(cell) {
    this.addCellIfEligible(cell);
    if (this.mode == 'manual') return;
    for (const neighbor of cell.getAllNeighbors()) {
      if (neighbor.direction == 'all-similar') continue;
      if (!neighbor.dividerCell) continue;
      if (this.toSolid || !this.anyCellIsSolid(neighbor.cells)) {
        this.addCellIfEligible(neighbor.dividerCell);
      }
    }
  }

  addCellIfEligible(cell) {
    if (cell && cell.isSolid != this.toSolid) {
      this.cellsToSet.add(cell);
    }
  }
  
  anyCellIsSolid(cells) {
    return cells.some(cell => {
      return cell &&
          (this.rootCells.has(cell) || this.cellsToSet.has(cell) ? this.toSolid : cell.isSolid);
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
