function startGesture(cell) {
  state.getGesture().toSolid = !cell.isSolid;
  state.getGesture().primaryCellsOnly = cell.isPrimary;
  continueGesture(cell);
}

function continueGesture(cell) {
  if (!state.getGesture().primaryCellsOnly || cell.isPrimary) {
    if (state.getGesture().toSolid) {
      cell.setSolid();
    } else {
      cell.setClear();
    }
  }
  if (state.getGesture().primaryCellsOnly && cell.isPrimary) {
    // Primary cell gestures update neighbors.
    updatePrimaryCellNeighbors(cell);
  }
  recordChange();
}

function updatePrimaryCellNeighbors(cell) {
  for (const neighbor of cell.getNeighbors()) {
    if (!neighbor.dividerCell) continue;
    if (cell.isSolid || anyCellIsSolid(neighbor.primaryCells)) {
      neighbor.dividerCell.setSolid();
    } else {
      neighbor.dividerCell.setClear();
    }
  }
}

function anyCellIsSolid(cells) {
  return cells.some(cell => { return cell && cell.isSolid; });
}
