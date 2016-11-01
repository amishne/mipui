class WallToggleGesture extends Gesture {
  constructor() {
    super();
    // Cell to target. Determines by hovered cell and by the brush size. This
    // includes cells that will not be changed since they're already with the
    // desired content.
    this.rootCells = null;

    // Cells to change once the gesture is applies. In manual mode, it's just
    // the root cells; otherwise, it also includes some of the surrounding
    // dividers. It doesn't include cells that don't need to be set since they
    // are already with the desired content.
    this.cellsToSet = null;

    // One of 'manual', 'primary only' and 'divider only'.
    this.mode = null;

    // Gesture toggle direction, either true or false.
    this.toSolid = null;
    
    this.brushSize_;
  }
  
  isSolid_(cell) {
    return cell && cell.getLayerValue('terrain').startsWith('solid');
  }
  
  startHover(targetedCell) {
    this.toSolid = !this.isSolid_(targetedCell);
    this.mode = state.tool.manualMode ? 'manual' :
        (targetedCell.role == 'primary' ? 'primary only' : 'divider only');
    this.brushSize_ = state.tool.brushSize;
    this.startHoverAfterInitialFieldsAreSet(targetedCell);
  }
  
  startHoverAfterInitialFieldsAreSet(targetedCell) {
    this.calculateRootCellsAndCellsToSet_(targetedCell);
    this.cellsToSet.forEach(cell => {
      cell.showHighlight('terrain', this.toSolid ? 'to-solid' : 'to-clear');
    });
  }
  
  calculateRootCellsAndCellsToSet_(targetedCell) {
    this.rootCells = this.calcRootCells_(targetedCell);
    this.cellsToSet = new Set();
    this.rootCells.forEach(rootCell => {
      if (rootCell) this.addCellsToSet_(rootCell);
    });
  }
      
  calcRootCells_(targetedCell) {
    if (this.mode == 'manual') {
      // Don't respect brush size in manual mode, for now.
      return new Set([targetedCell]);
    }
    if (this.mode == 'primary only' && targetedCell.role == 'primary') {
      return this.calcNonManualRootCells_(targetedCell);
    }
    if (this.mode == 'divider only' &&
        (targetedCell.role == 'horizontal' ||
         targetedCell.role == 'vertical')) {
      return this.calcNonManualRootCells_(targetedCell);
    }
    return new Set();
  }
  
  calcNonManualRootCells_(targetedCell) {
    let roots = new Set([targetedCell]);
    let front = new Set([targetedCell]);
    for (let i = 1; i < this.brushSize_; i += 2) {
      const newFront = new Set();
      front.forEach(cell => {
        const neighbors = cell.getNeighbors('all-similar');
        if (!neighbors) return;
        neighbors.cells.forEach(neighborCell => {
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
  
  addCellsToSet_(cell) {
    this.addCellIfEligible_(cell);
    if (this.mode == 'manual') return;
    for (const neighbor of cell.getAllNeighbors()) {
      if (!neighbor.dividerCell) continue;
      if (this.toSolid || !this.anyCellIsSolid_(neighbor.cells)) {
        this.addCellIfEligible_(neighbor.dividerCell);
      }
    }
  }

  addCellIfEligible_(cell) {
    // Don't toggle cells that don't need toggling.
    if (this.isSolid_(cell) == this.toSolid) return;

    // Don't clear horizontal/vertical walls that have at least one clear
    // neighbor.
    if (!this.toSolid && this.mode == 'divider only' &&
        (cell.role == 'horizontal' || cell.role == 'vertical')) {
      const neighbor1 = cell.getNeighbors(
          cell.role == 'horizontal' ? 'top' : 'right').cells[0];
      const neighbor2 = cell.getNeighbors(
          cell.role == 'horizontal' ? 'bottom' : 'left').cells[0];
      if (this.isSolid_(neighbor1) || this.isSolid_(neighbor2)) return;
    }
    
    // Don't clear cells that contain doors.
    if (!this.toSolid && cell.getLayerValue('door')) return;
    // Don't clear corner cells that are adjacent to cells with doors.
    if (!this.toSolid && cell.role == 'corner') {
      const aNeighborHasADoor = cell.getAllNeighbors().some(neighbor => {
        return !!neighbor.dividerCell.getLayerValue('door');
      });
      if (aNeighborHasADoor) return;
    }

    this.cellsToSet.add(cell);
  }
  
  anyCellIsSolid_(cells) {
    return cells.some(cell => {
      return cell &&
          (this.rootCells.has(cell) ||
           this.cellsToSet.has(cell) ? this.toSolid : this.isSolid_(cell));
    });
  }
  
  stopHover() {
    this.cellsToSet.forEach(cell => {
      cell.hideHighlight('terrain', this.toSolid ? 'to-solid' : 'to-clear');
    });
  }
  
  startGesture() {
    this.stopHover();
    this.apply_();
  }
  
  continueGesture(cell) {
    this.stopHover();
    if (!cell.role == 'primary' && this.primaryCellsOnly) return;
    this.calculateRootCellsAndCellsToSet_(cell);
    this.apply_();
  }
  
  stopGesture() {
    delete this.timeoutId;
    state.recordOperationComplete();
  }
  
  apply_() {
    this.cellsToSet.forEach(cell => {
      cell.setLayerValue('terrain', this.toSolid ? 'solid' : 'clear', true);
    });
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = setTimeout(() => {
      this.stopGesture();
    }, 1000);
  }
}
