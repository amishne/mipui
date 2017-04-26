function handleKeyDownEvent(keyDownEvent) {
  if (keyDownEvent.ctrlKey) {
    switch (keyDownEvent.key) {
      case 'z': state.opCenter.undo(); break;
      case 'y': state.opCenter.redo(); break;
    }
  }
}

function updateMapTransform() {
  const nav = state.navigation;
  document.getElementById('theMap').style.transform =
      `translate(${nav.translate.x}px, ${nav.translate.y}px) ` +
      `scale(${nav.scale})`;
}

function handleWheelEvent(wheelEvent) {
  const nav = state.navigation;
  let scaleDiff = 1.0;
  if (wheelEvent.deltaY > 0 && nav.scale > 0.3) {
    scaleDiff = -0.2;
  } else if (wheelEvent.deltaY < 0 && nav.scale < 5.9) {
    scaleDiff = 0.2;
  } else {
    return;
  }
  const growth = scaleDiff / nav.scale;
  nav.scale += scaleDiff;
  nav.translate.x -= growth * (wheelEvent.x - nav.translate.x);
  nav.translate.y -= growth * (wheelEvent.y - nav.translate.y);
  updateMapTransform();
  wheelEvent.stopPropagation();
}

let prevGridCell = null;
function handleMouseMoveEvent(mouseEvent) {
  if (mouseEvent.buttons == 4) {
    // Middle button is pan.
    const nav = state.navigation;
    nav.translate.x += mouseEvent.movementX;
    nav.translate.y += mouseEvent.movementY;
    updateMapTransform();
  } else {
    const gridCell = getCurrentGridCell(mouseEvent);
    if (!prevGridCell || prevGridCell != gridCell) {
      if (prevGridCell) {
        console.log(`Leaving cell ${prevGridCell}`);
      }
      console.log(`Entering cell ${gridCell}`);
      prevGridCell = gridCell;
    }
  }
}

function getCurrentGridCell(mouseEvent) {
  const nav = state.navigation;
  const cellSize = 26 * nav.scale;
  const borderSize = 8 * nav.scale;

  const fromRow =
      Math.floor((mouseEvent.y - nav.translate.y) / (cellSize + borderSize));
  const toRow = fromRow + Math.floor(
      ((mouseEvent.y - nav.translate.y) % (cellSize + borderSize)) / cellSize);

  const fromCol =
      Math.floor((mouseEvent.x - nav.translate.x) / (cellSize + borderSize));
  const toCol = fromCol + Math.floor(
      ((mouseEvent.x - nav.translate.x) % (cellSize + borderSize)) / cellSize);

  const key = fromRow != toRow || fromCol != toCol ?
      TheMap.dividerCellKey(fromRow, fromCol, toRow, toCol) :
      TheMap.primaryCellKey(fromRow, fromCol);
  return key;
}

function expandGrid(n) {
  state.opCenter.recordOperationComplete();
  const gridData = state.getGridData();
  changeGridDimensions(gridData.from - n, gridData.to + n);
  createTheMapAndUpdateElements();
  const offsetX = n * (state.theMap.cellWidth + state.theMap.dividerWidth);
  const offsetY = n * (state.theMap.cellHeight + state.theMap.dividerHeight);
  const nav = state.navigation;
  nav.translate.x -= offsetX * nav.scale;
  nav.translate.y -= offsetY * nav.scale;
  updateMapTransform();
  state.opCenter.recordOperationComplete();
}

function changeGridDimensions(newFrom, newTo) {
  const gridData = state.getGridData();
  const oldFrom = gridData.from;
  const oldTo = gridData.to;
  if (oldFrom == newFrom && oldTo == newTo) {
    return;
  }
  state.setGridData({ from: newFrom, to: newTo });
  state.opCenter.recordGridDataChange('from', oldFrom, newFrom);
  state.opCenter.recordGridDataChange('to', oldTo, newTo);
}

function resetView() {
  const nav = state.navigation;
  nav.scale = 1.0;
  nav.translate.x = 8;
  nav.translate.y = 8;
  updateMapTransform();
}

function resetGrid() {
  state.opCenter.recordOperationComplete();
  state.theMap.resetToDefault();
  state.setGridData(null);
  createTheMapAndUpdateElements();
  resetView();
  state.opCenter.recordOperationComplete();
}
