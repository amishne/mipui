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

function handleKeyDownEvent(keyDownEvent) {
  if (keyDownEvent.ctrlKey) {
    switch (keyDownEvent.key) {
      case 'z': state.undo(); break;
      case 'y': state.redo(); break;
    }
  }
}

function updateGridTransform() {
  const nav = state.getNavigation();
  document.getElementById('grid').style.transform =
      `translate(${nav.translate.x}px, ${nav.translate.y}px) ` +
      `scale(${nav.scale})`;
}

function handleWheelEvent(wheelEvent) {
  const nav = state.getNavigation();
  let scaleDiff = 1.0;
  if (wheelEvent.deltaY > 0 && nav.scale > 0.5) {
    scaleDiff = -0.2;
  } else if (wheelEvent.deltaY < 0 && nav.scale < 3.9) {
    scaleDiff = 0.2;
  } else {
    return;
  }
  const growth = scaleDiff / nav.scale;
  nav.scale += scaleDiff;
  nav.translate.x -= growth * (wheelEvent.x - nav.translate.x);
  nav.translate.y -= growth * (wheelEvent.y - nav.translate.y);
  updateGridTransform();
  wheelEvent.stopPropagation();
}

function handleMouseMoveEvent(mouseEvent) {
  if (mouseEvent.buttons == 4) {
    // Middle button is pan.
    const nav = state.getNavigation();
    nav.translate.x += mouseEvent.movementX;
    nav.translate.y += mouseEvent.movementY;
    updateGridTransform();
  }
}

function expandGrid(n) {
  const gridData = state.getGridData();
  gridData.from -= n;
  gridData.to += n;
  createGridAndUpdateElements();
  state.recordChange();
}

function resetView() {
  const nav = state.getNavigation();
  nav.scale = 1.0;
  nav.translate.x = 8;
  nav.translate.y = 8;
  updateGridTransform();
}
