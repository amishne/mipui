function startGesture(cell) {
  finishGesture();
  const gesture = state.getGesture();
  gesture.toSolid = !cell.isSolid;
  gesture.primaryCellsOnly = cell.isPrimary;
  continueGesture(cell);
}

function continueGesture(cell) {
  const gesture = state.getGesture();
  if (!gesture.primaryCellsOnly || cell.isPrimary) {
    let changed = false;
    if (gesture.toSolid) {
      changed = cell.setSolid();
    } else {
      changed = cell.setClear();
    }
    if (changed) {
      gesture.affectedCells.push(cell);
    }
  }
  if (gesture.primaryCellsOnly && cell.isPrimary) {
    // Primary cell gestures update neighbors.
    updatePrimaryCellNeighbors(cell);
  }
  if (gesture.timeoutId) {
    clearTimeout(gesture.timeoutId);
  }
  gesture.timeoutId = setTimeout(() => {
    finishGesture();
  }, 1000);
}

function finishGesture() {
  const gesture = state.getGesture();
  delete gesture.timeoutId;
  state.recordChange();
  gesture.affectedCells = [];
}

function updatePrimaryCellNeighbors(cell) {
  const gesture = state.getGesture();
  for (const neighbor of cell.getNeighbors()) {
    if (!neighbor.dividerCell) continue;
    let changed = false;
    if (cell.isSolid || anyCellIsSolid(neighbor.primaryCells)) {
      changed = neighbor.dividerCell.setSolid();
    } else {
      changed = neighbor.dividerCell.setClear();
    }
    if (changed) {
      gesture.affectedCells.push(neighbor.dividerCell);
    }
  }
}

function anyCellIsSolid(cells) {
  return cells.some(cell => { return cell && cell.isSolid; });
}
