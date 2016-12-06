class WallGesture extends Gesture {
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
    this.toWall = null;
    
    this.brushSize_;
    
    this.removeDoorGestures = null;
  }

  isWall_(cell) {
    return cell && cell.isKind(ct.terrain, ct.terrain.wall);
  }

  hasDoor_(cell) {
    return cell && cell.isKind(ct.doors, ct.doors.door);
  }

  startHover(targetedCell) {
    this.toWall = !this.isWall_(targetedCell);
    this.mode = state.tool.manualMode ? 'manual' :
        (targetedCell.role == 'primary' ? 'primary only' : 'divider only');
    this.brushSize_ = state.tool.brushSize;
    this.startHoverAfterInitialFieldsAreSet(targetedCell);
  }

  startHoverAfterInitialFieldsAreSet(targetedCell) {
    this.calculateRootCellsAndCellsToSet_(targetedCell);
    this.removeDoorGestures = new Map();
    this.cellsToSet.forEach(cell => {
      this.showHighlight_(cell);
      if (this.shouldRemoveDoors_(cell)) {
        const removeDoorGesture = new DoorGesture(null);
        removeDoorGesture.toDoor = false;
        removeDoorGesture.startHover(cell);
        this.removeDoorGestures.set(cell, removeDoorGesture);
      }
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
      if (this.toWall || !this.anyCellIsWall_(neighbor.cells)) {
        this.addCellIfEligible_(neighbor.dividerCell);
      }
    }
  }

  addCellIfEligible_(cell) {
    // Don't toggle cells that don't need toggling.
    if (this.isWall_(cell) == this.toWall) return;
    // If it's manual mode, just set the cell and be done with it.
    if (this.mode == 'manual') {
      this.cellsToSet.add(cell);
      return;
    }

    // Don't clear horizontal/vertical walls that have at least one clear
    // neighbor.
    if (!this.toWall && this.mode == 'divider only' &&
        (cell.role == 'horizontal' || cell.role == 'vertical')) {
      const neighbor1 = cell.getNeighbors(
          cell.role == 'horizontal' ? 'top' : 'right').cells[0] || null;
      const neighbor2 = cell.getNeighbors(
          cell.role == 'horizontal' ? 'bottom' : 'left').cells[0] || null;
      if (this.isWall_(neighbor1) || this.isWall_(neighbor2)) return;
    }

    // Don't clear cells that contain doors, unless those are in the roots.
    if (!this.toWall && this.hasDoor_(cell) &&
        !this.shouldRemoveDoors_(cell)) {
      return;
    }
    // Don't clear corner cells that are adjacent to cells with doors that are
    // not removed.
    if (!this.toWall && cell.role == 'corner') {
      const aNeighborHasADoor = cell.getAllNeighbors().some(neighbor => {
        return neighbor.dividerCell &&
            neighbor.dividerCell.isKind(ct.doors, ct.doors.door) &&
            !this.shouldRemoveDoors_(neighbor.dividerCell);
      });
      if (aNeighborHasADoor) return;
    }

    this.cellsToSet.add(cell);
  }

  anyCellIsWall_(cells) {
    return cells.some(cell => {
      return cell &&
          (this.rootCells.has(cell) ||
           this.cellsToSet.has(cell) ? this.toWall : this.isWall_(cell));
    });
  }

  stopHover() {
    this.cellsToSet.forEach(cell => {
      this.hideHighlight_(cell);
    });
    this.removeDoorGestures.forEach(gesture => gesture.stopHover());
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
    state.opCenter.recordOperationComplete();
  }

  apply_() {
    this.cellsToSet.forEach(cell => {
      cell.setLayerContent(ct.terrain, this.createContent_(), true);
      const removeDoorGesture = this.removeDoorGestures.get(cell);
      if (removeDoorGesture) removeDoorGesture.startGesture();
    });
  }

  shouldRemoveDoors_(cell) {
    return !this.toWall && this.mode == 'divider only' &&
        this.hasDoor_(cell) && this.rootCells.has(cell);
  }

  showHighlight_(cell) {
    cell.showHighlight(ct.terrain, this.createContent_());
  }

  hideHighlight_(cell) {
    cell.hideHighlight(ct.terrain);
  }

  createContent_() {
    const kind = this.toWall ? ct.terrain.wall : ct.terrain.floor;
    return {
      [ck.kind]: kind.id,
      [ck.variation]: kind.generic.id,
    }
  }
}
