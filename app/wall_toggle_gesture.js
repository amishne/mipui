class WallToggleGesture {
  constructor() {
  }
  
  prepare(cell) {
    this.toSolid = !cell.isSolid;
    this.primaryCellsOnly = cell.isPrimary;
    this.cellsToSet = this.calcCellsToSet(cell);
    this.cellsToSet.forEach(cell => {
      cell.showHighlight(this.toSolid);
    });
  }
  
  calcCellsToSet(cell) {
    let result = [cell];
    if (this.primaryCellsOnly && cell.isPrimary) {
      for (const neighbor of cell.getNeighbors()) {
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
    return cells.some(cell => { return cell && cell.isSolid; });
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
    this.cellsToSet = this.calcCellsToSet(cell);
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
