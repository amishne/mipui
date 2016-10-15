function startGesture(cell) {
  if (cell.classList.contains('solid')) {
    gesture.callback = setClear;
  } else if (cell.classList.contains('clear')) {
    gesture.callback = setSolid;
  }
  gesture.primaryCellsOnly = cell.classList.contains('primary-cell');
  continueGesture(cell);
}

function continueGesture(cell) {
  const primaryCell = cell.classList.contains('primary-cell');
  if (!gesture.primaryCellsOnly || primaryCell) {
    gesture.callback(cell);
  }
  if (gesture.primaryCellsOnly && primaryCell) {
    // Primary cell gestures update neighbors.
    updatePrimaryCellNeighbors(cell);
  }
}
    
function setSolid(cell) {
  cell.classList.remove('clear');
  cell.classList.add('solid');
}

function setClear(cell) {
  cell.classList.remove('solid');
  cell.classList.add('clear');
}

function updatePrimaryCellNeighbors(cell) {
  for (const neighbor of getNeighbors(cell)) {
    const anyPrimaryCellIsSolid =
        ([cell].concat(neighbor.primaryCellKeys.map(key => { return objects[key]; })))
        .some(primaryCell => {
          return primaryCell && primaryCell.classList.contains('solid');
        });
    if (anyPrimaryCellIsSolid) {
      setSolid(objects[neighbor.dividerCellKey]);
    } else {
      setClear(objects[neighbor.dividerCellKey]);
    }
  }
}
