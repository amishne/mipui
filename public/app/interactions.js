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

let useWheelForZooming = true;
function handleWheelEvent(wheelEvent) {
  wheelEvent.preventDefault();
  wheelEvent.stopImmediatePropagation();
  if (wheelEvent.deltaX > 0) {
    useWheelForZooming = false;
  }
  if (useWheelForZooming || wheelEvent.ctrlKey) {
    zoom(wheelEvent);
  } else {
    pan(-wheelEvent.deltaX, -wheelEvent.deltaY);
  }
}

function zoom(wheelEvent) {
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
}

//let prevGridCell = null;
function handleMouseMoveEvent(mouseEvent) {
  if (mouseEvent.buttons == 4) {
    // Middle button is pan.
    pan(mouseEvent.movementX, mouseEvent.movementY);
  }// else {
//    const gridCell = getCurrentGridCell(mouseEvent);
//    if (!prevGridCell || prevGridCell != gridCell) {
//      if (prevGridCell) {
//        //state.theMap.cells.get(prevGridCell).onMouseLeave(mouseEvent);
//        console.log(`Leaving cell ${prevGridCell}`);
//      }
//      console.log(`Entering cell ${gridCell}`);
//      //state.theMap.cells.get(gridCell).onMouseEnter(mouseEvent);
//      prevGridCell = gridCell;
//    }
//  }
}

function pan(x, y) {
  const nav = state.navigation;
  nav.translate.x += x;
  nav.translate.y += y;
  updateMapTransform();
}

function handleTouchStartEvent(touchEvent) {
  console.log('touchStart: ' + touchEvent);
}

function handleTouchMoveEvent(touchEvent) {
  console.log('touchMove: ' + touchEvent);
}

function handleTouchEndEvent(touchEvent) {
  console.log('touchEnd: ' + touchEvent);
}

//function getCurrentGridCell(mouseEvent) {
//  const nav = state.navigation;
//  const cellSize = 25 * nav.scale;
//  const borderSize = 7 * nav.scale;
//  const cellAndBorderSize = cellSize + borderSize;
//  const x = mouseEvent.pageX - (nav.translate.x + 8);
//  const y = mouseEvent.pageY - (nav.translate.y + 8);
//
//  const toRow = Math.floor(y / cellAndBorderSize) + state.getGridData().from;
//  const fromRow = (y % cellAndBorderSize) / borderSize > 1 ? toRow : toRow - 1;
//
//  const toCol = Math.floor(x / cellAndBorderSize) + state.getGridData().from;
//  const fromCol = (x % cellAndBorderSize) / borderSize > 1 ? toCol : toCol - 1;
//
//  const key = fromRow != toRow || fromCol != toCol ?
//      TheMap.dividerCellKey(fromRow, fromCol, toRow, toCol) :
//      TheMap.primaryCellKey(fromRow, fromCol);
//  return key;
//}

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
