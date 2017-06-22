function handleKeyDownEvent(keyDownEvent) {
  if (state.isReadOnly()) return;
  if (keyDownEvent.ctrlKey) {
    switch (keyDownEvent.key) {
      case 'z':
        state.opCenter.undo();
        state.opCenter.recordOperationComplete();
        break;
      case 'y':
        state.opCenter.redo();
        state.opCenter.recordOperationComplete();
        break;
      case 'x':
        if (state.gesture instanceof SelectGesture) {
          state.gesture.cut();
        }
        break;
      case 'c':
        if (state.gesture instanceof SelectGesture) {
          state.gesture.copy();
        }
        break;
      case 'v': state.gesture = new PasteGesture(); break;
    }
  } else {
    switch (keyDownEvent.key) {
      case 'Escape': state.menu.setToInitialSelection(); break;
      case 'Delete':
        if (state.gesture instanceof SelectGesture) {
          state.gesture.deleteSelection();
        }
        break;
    }
  }
}

function updateMapTransform(shouldRefreshMapResizeButtonLocations) {
  const nav = state.navigation;
  document.getElementById('theMap').style.transform =
      `translate(${nav.translate.x}px, ${nav.translate.y}px) ` +
      `scale(${nav.scale})`;
  if (shouldRefreshMapResizeButtonLocations) {
    refreshMapResizeButtonLocations();
  }
}

let useWheelForZooming = true;
function handleWheelEvent(wheelEvent) {
  wheelEvent.preventDefault();
  wheelEvent.stopImmediatePropagation();
  if (wheelEvent.deltaX > 0 || wheelEvent.ctrlKey) {
    // The first time a horizontal scroll is encountered, or the first time
    // ctrl is held during a scroll, we assume trackpad / touchpad and stop
    // using wheel for zooming.
    useWheelForZooming = false;
  }
  if (useWheelForZooming || wheelEvent.ctrlKey) {
    zoom(wheelEvent, !useWheelForZooming);
  } else {
    pan(-wheelEvent.deltaX, -wheelEvent.deltaY);
  }
}

function zoom(wheelEvent, incremental = false) {
  const nav = state.navigation;
  let scaleDiff = 1.0;
  if (wheelEvent.deltaY > 0 && nav.scale > 0.3) {
    scaleDiff = -0.2;
  } else if (wheelEvent.deltaY < 0 && nav.scale < 5.9) {
    scaleDiff = 0.2;
  } else {
    return;
  }
  if (incremental) {
    scaleDiff *= 0.3 * nav.scale;
  }
  const growth = scaleDiff / nav.scale;
  nav.scale += scaleDiff;
  nav.translate.x -= growth * (wheelEvent.x - nav.translate.x);
  nav.translate.y -= growth * (wheelEvent.y - nav.translate.y);
  updateMapTransform(true);
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
  updateMapTransform(true);
}

function handleTouchStartEvent(touchEvent) {
  debug('touchStart: ' + touchEvent);
}

function handleTouchMoveEvent(touchEvent) {
  debug('touchMove: ' + touchEvent);
}

function handleTouchEndEvent(touchEvent) {
  debug('touchEnd: ' + touchEvent);
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

function resizeGridBy(
    firstColumnDiff, lastColumnDiff, firstRowDiff, lastRowDiff) {
  if (state.isReadOnly()) return;
  // First, complete pending ops.
  state.opCenter.recordOperationComplete();
  // Update the state's grid data.
  [
    {diff: firstColumnDiff, prop: pk.firstColumn},
    {diff: lastColumnDiff, prop: pk.lastColumn},
    {diff: firstRowDiff, prop: pk.firstRow},
    {diff: lastRowDiff, prop: pk.lastRow},
  ].forEach(({diff, prop}) => {
    if (diff != 0) {
      state.setProperty(prop, state.getProperty(prop) + diff, true);
    }
  });
  // Update transform so that elements on the viewport won't move around.
  const offsetX = -firstColumnDiff *
      (state.theMap.cellWidth + state.theMap.dividerWidth);
  const offsetY = -firstRowDiff *
      (state.theMap.cellHeight + state.theMap.dividerHeight);
  const nav = state.navigation;
  nav.translate.x -= offsetX * nav.scale;
  nav.translate.y -= offsetY * nav.scale;
  updateMapTransform(false);
  state.opCenter.recordOperationComplete();
}

function resetView() {
  const nav = state.navigation;
  nav.scale = 1.0;
  nav.translate.x = 8;
  nav.translate.y = 8;
  updateMapTransform(false);
  const app = document.getElementById('app');
  const theMap = document.getElementById('theMap');
  const appRect = app.getBoundingClientRect();
  const theMapRect = theMap.getBoundingClientRect();
  pan(appRect.width / 2 - theMapRect.width / 2,
      appRect.height / 2 - theMapRect.height / 2);
  updateMapTransform(true);
}

function resetGrid() {
  if (state.isReadOnly()) return;
  state.opCenter.recordOperationComplete();
  state.theMap.resetToDefault();
  [pk.firstColumn, pk.firstRow, pk.lastColumn, pk.lastRow].forEach(property => {
    state.setProperty(property, null, true);
  });
  resetView();
  state.opCenter.recordOperationComplete();
}

function refreshMapResizeButtonLocations() {
  const uiOverlay = document.getElementById('uiOverlay');
  const theMap = document.getElementById('theMap');
  const rect = theMap.getBoundingClientRect();
  [
    {name: 'add-column-right', pos: 'right', place: 0},
    {name: 'remove-column-right', pos: 'right', place: 1},
    {name: 'add-row-bottom', pos: 'bottom', place: 0},
    {name: 'remove-row-bottom', pos: 'bottom', place: 1},
    {name: 'add-column-left', pos: 'left', place: 0},
    {name: 'remove-column-left', pos: 'left', place: 1},
    {name: 'add-row-top', pos: 'top', place: 0},
    {name: 'remove-row-top', pos: 'top', place: 1},
  ].forEach(button => {
    const element =
        document.getElementsByClassName('map-resize-button-' + button.name)[0];
    let x =
        Math.min(rect.right - 80,
            Math.max(uiOverlay.offsetWidth / 2, rect.left + 60));
    let y =
        Math.min(rect.bottom - 80,
            Math.max(uiOverlay.offsetHeight / 2, rect.top + 60));
    let offsetX = button.place == 0 ? -70 : 40;
    let offsetY = offsetX;
    switch(button.pos) {
      case 'right': x = rect.right; offsetX = 20; break;
      case 'bottom': y = rect.bottom; offsetY = 20; break;
      case 'left': x = rect.left; offsetX = -70; break;
      case 'top': y = rect.top; offsetY = -70; break;
    }
    element.style.left = x + offsetX;
    element.style.top = y + offsetY;
  });
}

