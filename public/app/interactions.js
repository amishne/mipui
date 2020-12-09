const isTouchDevice =
    window.matchMedia(
        '(any-hover: none) and (orientation: portrait)').matches;
const cached = {};
let mapContainer;
const mapResizeButtons = [
  {name: 'add-column-right', pos: 'right', place: 0},
  {name: 'remove-column-right', pos: 'right', place: 1},
  {name: 'add-row-bottom', pos: 'bottom', place: 0},
  {name: 'remove-row-bottom', pos: 'bottom', place: 1},
  {name: 'add-column-left', pos: 'left', place: 0},
  {name: 'remove-column-left', pos: 'left', place: 1},
  {name: 'add-row-top', pos: 'top', place: 0},
  {name: 'remove-row-top', pos: 'top', place: 1},
];
let refreshMapResizeButtonLocationsTimeout = null;

function getCached(obj, fieldName) {
  const cachedObj = cached[obj] || {};
  let result = cachedObj[fieldName];
  if (!result) {
    result = obj[fieldName];
    cached[obj] = cachedObj;
    cachedObj[fieldName] = result;
  }
  return result;
}

function setAndCache(obj, fieldName, value) {
  obj[fieldName] = value;
  if (!cached[obj]) cached[obj] = {};
  cached[obj][fieldName] = value;
}

function incrementAndCache(obj, fieldName, valueDiff) {
  const oldValue = obj[fieldName];
  const newValue = oldValue + valueDiff;
  setAndCache(obj, fieldName, newValue);
}

function invalidateCached(obj, fieldName) {
  if (!cached[obj]) return;
  cached[obj][fieldName] = null;
}

function handleResizeEvent() {
  invalidateCached(mapContainer, 'offsetWidth');
  invalidateCached(mapContainer, 'offsetHeight');
}

function handleKeyDownEvent(keyDownEvent) {
  if (state.dialog) {
    switch (keyDownEvent.key) {
      case 'Escape': state.dialog.cancel(); break;
      case 'Enter': state.dialog.accept(); break;
      default:
        // Ignore.
        return;
    }
  }
  if (state.isReadOnly()) return;
  if (keyDownEvent.ctrlKey) {
    switch (keyDownEvent.key) {
      case 'z':
        state.opCenter.undo();
        state.opCenter.recordOperationComplete();
        keyDownEvent.preventDefault();
        break;
      case 'y':
        state.opCenter.redo();
        state.opCenter.recordOperationComplete();
        keyDownEvent.preventDefault();
        break;
      case 'x':
        if (state.gesture instanceof SelectGesture) {
          state.gesture.cut();
          keyDownEvent.preventDefault();
        }
        break;
      case 'c':
        if (state.gesture instanceof SelectGesture) {
          state.gesture.copy();
          keyDownEvent.preventDefault();
        }
        break;
      case 'v': {
        state.gesture = new PasteGesture();
        keyDownEvent.preventDefault();
        break;
      }
    }
  } else {
    switch (keyDownEvent.key) {
      case 'Escape': {
        state.menu.setToInitialSelection();
        keyDownEvent.preventDefault();
        break;
      }
      case 'Delete':
        if (state.gesture instanceof SelectGesture) {
          state.gesture.deleteSelection();
          keyDownEvent.preventDefault();
        }
        break;
      default:
        // Delegate this to the menu.
        state.menu.keydown(keyDownEvent.key);
        break;
    }
  }
}

function updateMapTransform(shouldRefreshMapResizeButtonLocations) {
  const nav = state.navigation;
  const theMap = document.getElementById('theMap');
  theMap.style.transform = `scale(${nav.scale})`;
  // For proper container sizing:
  invalidateCached(mapContainer, 'offsetWidth');
  invalidateCached(mapContainer, 'offsetHeight');
  const mapWidth = getCached(mapContainer, 'offsetWidth');
  const mapHeight = getCached(mapContainer, 'offsetHeight');
  const mapFrame = document.getElementById('mapFrame');
  mapFrame.style.width =
      (state.theMap.mapWidth * nav.scale + mapWidth) + 'px';
  mapFrame.style.height =
      (state.theMap.mapHeight * nav.scale + mapHeight) + 'px';
  theMap.style.left = (mapWidth / 2) + 'px';
  theMap.style.top = (mapHeight / 2) + 'px';
  if (shouldRefreshMapResizeButtonLocations) {
    refreshMapResizeButtonLocations();
  }
}

let useWheelForZooming = true;
function handleWheelEvent(wheelEvent) {
  wheelEvent.preventDefault();
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

  // Calculate distance from mapContainer edges.
  let distanceFromLeft = wheelEvent.x + getCached(mapContainer, 'scrollLeft');
  let distanceFromTop = wheelEvent.y + getCached(mapContainer, 'scrollTop');
  distanceFromLeft -= getCached(mapContainer, 'offsetWidth') / 2;
  distanceFromTop -= getCached(mapContainer, 'offsetHeight') / 2;

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

  pan(-growth * distanceFromLeft, -growth * distanceFromTop);
  updateMapTransform(true);
}

function handleMouseDownEvent(mouseEvent) {
  if (mouseEvent.buttons == 4) {
    // Don't propagate middle mouse click, to avoid Chrome's "mouse nav" mode.
    mouseEvent.stopPropagation();
    mouseEvent.preventDefault();
  }
}

function handleMouseMoveEvent(mouseEvent) {
  if (mouseEvent.movementX == 0 && mouseEvent.movementY == 0) return;
  if (mouseEvent.buttons == 4) {
    // Middle button is pan.
    pan(mouseEvent.movementX, mouseEvent.movementY);
  }
}

let scrollCallRequested = false;
let prevCellKey = null;
function handleScrollEvent(event) {
  if (scrollCallRequested) return;
  scrollCallRequested = true;
  event.stopPropagation();
  window.requestAnimationFrame(() => {
    invalidateCached(mapContainer, 'scrollLeft');
    invalidateCached(mapContainer, 'scrollTop');
    refreshMapResizeButtonLocations();
    scrollCallRequested = false;

    if (!isTouchDevice) return;
    const theMap = document.getElementById('theMap');
    invalidateCached(mapContainer, 'offsetWidth');
    invalidateCached(mapContainer, 'offsetHeight');
    const currentCellKey = getCellKey(
        getCached(mapContainer, 'scrollLeft') +
        getCached(mapContainer, 'offsetWidth') / 2 -
        getCached(theMap, 'offsetLeft'),
        getCached(mapContainer, 'scrollTop') +
        getCached(mapContainer, 'offsetHeight') / 2 -
        getCached(theMap, 'offsetTop'));
    if (!prevCellKey || prevCellKey != currentCellKey) {
      if (prevCellKey) {
        const prevCell = state.theMap.cells.get(prevCellKey);
        if (prevCell && state.gesture) {
          state.gesture.stopHover();
        }
      }
      const currentCell = state.theMap.cells.get(currentCellKey);
      if (currentCell && state.gesture) {
        if (isActionClicked) {
          state.gesture.continueGesture(currentCell);
        } else {
          state.gesture.startHover(currentCell);
        }
      }
      prevCellKey = currentCellKey;
    }
  });
}

function pan(x, y) {
  incrementAndCache(mapContainer, 'scrollLeft', -x);
  incrementAndCache(mapContainer, 'scrollTop', -y);
}

function calcDistance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function calcCenter(x1, y1, x2, y2) {
  return {x: (x1 + x2) / 2, y: (y1 + y2) / 2};
}

let currentPinch = null;
let prevSingleTouchPos = null;
function handleTouchStartEvent(touchEvent) {
  if (touchEvent.touches.length == 2) {
    if (touchEvent.touches[0].target.classList.contains('action-pane') ||
        touchEvent.touches[1].target.classList.contains('action-pane')) {
      return;
    }
    currentPinch = {
      initialDistance:
          calcDistance(
              touchEvent.touches[0].pageX,
              touchEvent.touches[0].pageY,
              touchEvent.touches[1].pageX,
              touchEvent.touches[1].pageY),
      center:
          calcCenter(
              touchEvent.touches[0].pageX,
              touchEvent.touches[0].pageY,
              touchEvent.touches[1].pageX,
              touchEvent.touches[1].pageY),
      initialScale: state.navigation.scale,
    };
  } else {
    const mapContainerTouches = getMapContainerTouches(touchEvent.touches);
    if (touchEvent.touches.length > 1 && mapContainerTouches.length == 1) {
      prevSingleTouchPos = {
        x: mapContainerTouches[0].pageX,
        y: mapContainerTouches[0].pageY,
      };
    }
  }
}

let pinchCallRequested = false;
let panRequested = false;
function handleTouchMoveEvent(touchEvent) {
  if (currentPinch && touchEvent.touches.length == 2 && !pinchCallRequested) {
    pinchCallRequested = true;
    window.requestAnimationFrame(() => {
      pinchCallRequested = false;
      const center =
          calcCenter(
              touchEvent.touches[0].pageX,
              touchEvent.touches[0].pageY,
              touchEvent.touches[1].pageX,
              touchEvent.touches[1].pageY);
      const distance =
          calcDistance(
              touchEvent.touches[0].pageX,
              touchEvent.touches[0].pageY,
              touchEvent.touches[1].pageX,
              touchEvent.touches[1].pageY);

      // First, scroll to 0,0
      const oldScroll = {
        x: getCached(mapContainer, 'scrollLeft'),
        y: getCached(mapContainer, 'scrollTop'),
      };
      setAndCache(mapContainer, 'scrollLeft', 0);
      setAndCache(mapContainer, 'scrollTop', 0);
      console.log(oldScroll);

      // Apply zoom.
      const newScale =
          currentPinch.initialScale * (distance / currentPinch.initialDistance);
      //const scaleDiff = newScale - state.navigation.scale;
      //const growth = scaleDiff / state.navigation.scale;
      //const scaleFactor = newScale / state.navigation.scale;
      state.navigation.scale = newScale;
      updateMapTransform(false);

      // Finally, scroll back.
      const centerDiff = {
        x: center.x - currentPinch.center.x,
        y: center.y - currentPinch.center.y,
      };
      setAndCache(
          mapContainer, 'scrollLeft',
          oldScroll.x + centerDiff.x * newScale);
      setAndCache(
          mapContainer, 'scrollTop',
          oldScroll.y + centerDiff.y * newScale);

      currentPinch.center = center;
      updateMapTransform(true);
    });
  } else {
    if (!panRequested) {
      // If exactly one touch is over the map container, use it to pan.
      const mapContainerTouches = getMapContainerTouches(touchEvent.touches);
      if (touchEvent.touches.length > 1 && mapContainerTouches.length == 1) {
        panRequested = true;
        window.requestAnimationFrame(() => {
          const pos = {
            x: mapContainerTouches[0].pageX,
            y: mapContainerTouches[0].pageY,
          };
          if (prevSingleTouchPos) {
            pan(pos.x - prevSingleTouchPos.x, pos.y - prevSingleTouchPos.y);
          }
          prevSingleTouchPos = pos;
          panRequested = false;
        });
      }
    }
  }
}

function getMapContainerTouches(touchList) {
  return Array.from(touchList).filter(
      touch => touch.target.id == 'mapContainer' ||
          touch.target.classList.contains('grid-cell'));
}

function handleTouchEndEvent() {
  currentPinch = null;
  prevSingleTouchPos = null;
}

function getCellKey(x, y) {
  const nav = state.navigation;
  const cellSize = state.theMap.cellWidth * nav.scale;
  const borderSize = state.theMap.dividerWidth * nav.scale;
  const cellAndBorderSize = cellSize + borderSize;

  const toRow =
      Math.floor(y / cellAndBorderSize) + state.getProperty(pk.firstRow);
  const fromRow = (y % cellAndBorderSize) / borderSize > 1 ? toRow : toRow - 1;

  const toCol =
      Math.floor(x / cellAndBorderSize) + state.getProperty(pk.firstColumn);
  const fromCol = (x % cellAndBorderSize) / borderSize > 1 ? toCol : toCol - 1;

  const key = fromRow != toRow || fromCol != toCol ?
    CellMap.dividerCellKey(fromRow, fromCol, toRow, toCol) :
    CellMap.primaryCellKey(fromRow, fromCol);
  return key;
}

function resizeGridBy(
    firstColumnDiff, lastColumnDiff, firstRowDiff, lastRowDiff) {
  if (state.isReadOnly()) return;
  // First, complete pending ops.
  state.opCenter.recordOperationComplete();
  deleteContentThatWillBeOutsideTheMap(
      firstColumnDiff, lastColumnDiff, firstRowDiff, lastRowDiff);
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
  if (firstColumnDiff != 0 || firstRowDiff != 0) {
    // The below will trigger a scroll event, though. To prevent that event from
    // starting a resize button refresh flow, we set the button refresh timer id
    // here to be some invalid number, if it's not defined.
    if (refreshMapResizeButtonLocationsTimeout == null) {
      refreshMapResizeButtonLocationsTimeout = -1;
    }
    const nav = state.navigation;
    incrementAndCache(mapContainer, 'scrollLeft',
        -firstColumnDiff * nav.scale *
        (state.theMap.cellWidth + state.theMap.dividerWidth));
    incrementAndCache(mapContainer, 'scrollTop',
        -firstRowDiff * nav.scale *
        (state.theMap.cellHeight + state.theMap.dividerHeight));
  }
  updateMapTransform(false);
  state.opCenter.recordOperationComplete(true);
}

function cellIsOutsideBoundaries(
    cell, firstColumn, lastColumn, firstRow, lastRow) {
  return cell.column < firstColumn - 0.5 ||
      cell.column >= lastColumn ||
      cell.row < firstRow - 0.5 ||
      cell.row >= lastRow;
}

function deleteContentThatWillBeOutsideTheMap(
    firstColumnDiff, lastColumnDiff, firstRowDiff, lastRowDiff) {
  const newFirstColumn = state.getProperty(pk.firstColumn) + firstColumnDiff;
  const newLastColumn = state.getProperty(pk.lastColumn) + lastColumnDiff;
  const newFirstRow = state.getProperty(pk.firstRow) + firstRowDiff;
  const newLastRow = state.getProperty(pk.lastRow) + lastRowDiff;
  const cellsToDelete = new Set();
  const cellLayersToDelete = new Map();
  ct.children.forEach(layer => cellLayersToDelete.set(layer, new Set()));
  state.theMap.cells.forEach(cell => {
    // If the cell is outside the map, delete it.
    if (cellIsOutsideBoundaries(
        cell, newFirstColumn, newLastColumn, newFirstRow, newLastRow)) {
      cellsToDelete.add(cell);
    }
    // If the cell has an endcell which is outside the map for a given layer,
    // delete the content for that layer.
    ct.children.forEach(layer => {
      const content = cell.getLayerContent(layer);
      if (!content) return;
      const endCellKey = content[ck.endCell];
      if (!endCellKey) return;
      const endCell = state.theMap.cells.get(endCellKey);
      if (cellIsOutsideBoundaries(
          endCell, newFirstColumn, newLastColumn, newFirstRow, newLastRow)) {
        cellLayersToDelete.get(layer).add(cell);
      }
    });
  });
  state.theMap.cells.forEach(cell => {
    ct.children.forEach(layer => {
      // Delete if it was deleted or its endcell was deleted.
      let deleteLayerContent =
          cellsToDelete.has(cell) || cellLayersToDelete.get(layer).has(cell);
      // Delete if its startcell was deleted.
      if (!deleteLayerContent) {
        const content = cell.getLayerContent(layer);
        if (content && content[ck.startCell]) {
          const startCell = state.theMap.cells.get(content[ck.startCell]);
          if (cellsToDelete.has(startCell) ||
              cellLayersToDelete.get(layer).has(startCell)) {
            deleteLayerContent = true;
          }
        }
      }
      if (deleteLayerContent) {
        cell.setLayerContent(layer, null, true);
      }
    });
  });
}

function resetView() {
  const nav = state.navigation;
  nav.scale = 1.0;
  updateMapTransform(false);
  const theMap = document.getElementById('theMap');
  setAndCache(mapContainer, 'scrollLeft', theMap.clientWidth / 2);
  setAndCache(mapContainer, 'scrollTop', theMap.clientHeight / 2);
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
  // Force a map rewrite with the operation.
  state.opCenter.recordOperationComplete(true);
}

function refreshMapResizeButtonLocations() {
  if (refreshMapResizeButtonLocationsTimeout) {
    clearTimeout(refreshMapResizeButtonLocationsTimeout);
  } else {
    mapResizeButtons.forEach(button => {
      if (!button.element) {
        button.element =
            document
                .getElementsByClassName('map-resize-button-' + button.name)[0];
      }
      document.getElementById('app').classList.add('transforming-map');
    });
  }
  refreshMapResizeButtonLocationsTimeout = setTimeout(() => {
    const theMap = document.getElementById('theMap');
    document.getElementById('app').classList.remove('transforming-map');
    const nav = state.navigation;
    const left = theMap.offsetLeft;
    const right = left + (theMap.offsetWidth * nav.scale);
    const top = theMap.offsetTop;
    const bottom = top + (theMap.offsetHeight * nav.scale);
    const rect = {left, right, top, bottom};
    mapResizeButtons.forEach(button => {
      if (!button.element) return;
      let x = clamp(rect.left + 70, getCached(mapContainer, 'scrollLeft') +
          getCached(mapContainer, 'offsetWidth') / 2, rect.right - 70);
      let y = clamp(rect.top + 70, getCached(mapContainer, 'scrollTop') +
          getCached(mapContainer, 'offsetHeight') / 2, rect.bottom - 70);
      let offsetX = button.place == 0 ? -70 : 40;
      let offsetY = offsetX;
      switch (button.pos) {
        case 'right': x = rect.right; offsetX = 50; break;
        case 'bottom': y = rect.bottom; offsetY = 50; break;
        case 'left': x = rect.left; offsetX = -70; break;
        case 'top': y = rect.top; offsetY = -70; break;
      }
      button.element.style.left = (x + offsetX) + 'px';
      button.element.style.top = (y + offsetY) + 'px';
      refreshMapResizeButtonLocationsTimeout = null;
    });
    theMap.classList.add('resized-map');
    setTimeout(() => { theMap.classList.remove('resized-map'); }, 100);
  }, 1000);
}

let isActionClicked = false;
function switchToMobileMode() {
  const scale = 1.6;
  const app = document.getElementById('app');
  app.style.transform = `scale(${scale})`;
  app.style.width = (100 / scale) + '%';
  app.style.height = (100 / scale) + '%';
  createAndAppendDivWithClass(mapContainer, 'mobile-cursor');
  invalidateCached(mapContainer, 'offsetWidth');
  invalidateCached(mapContainer, 'offsetHeight');
  updateMapTransform(true);
  const actionPane =
      createAndAppendDivWithClass(
          document.body, 'action-pane');
  actionPane.textContent = 'Tap here to Apply.';
  actionPane.addEventListener('touchstart', e => {
    e.stopPropagation();
    if (state.gesture) {
      isActionClicked = true;
      state.gesture.startGesture();
    }
  });
  actionPane.addEventListener('touchend', e => {
    e.stopPropagation();
    if (state.gesture) {
      state.gesture.stopGesture();
      isActionClicked = false;
      if (prevCellKey) {
        const prevCell = state.theMap.cells.get(prevCellKey);
        state.gesture.startHover(prevCell);
      }
    }
  });
  actionPane.addEventListener('touchmove', e => { e.stopPropagation(); });
  actionPane.onmousedown = e => e.stopPropagation();
  actionPane.onmousemove = e => e.stopPropagation();
  actionPane.onmouseup = e => e.stopPropagation();
}

function numberRooms(kind, variation) {
  let num = 1;
  const roomsToNumber = [];
  getRooms().forEach(room => {
    const existingContent = room.centerCell.getLayerContent(ct.text);
    if (existingContent) {
      if (!existingContent[ck.startCell] && !existingContent[ck.endCell]) {
        // There's already a single-cell text content at the center. Maybe
        // that's a previous number?
        const existingNum = Number.parseInt(existingContent[ck.text]);
        if (existingNum != NaN) {
          num = Math.max(num, existingNum + 1);
        }
      }
      return;
    }
    roomsToNumber.push(room);
  });
  roomsToNumber.forEach(room => {
    room.centerCell.setLayerContent(ct.text, {
      [ck.kind]: kind.id,
      [ck.variation]: variation.id,
      [ck.text]: num++,
    }, true);
  });
  state.opCenter.recordOperationComplete();
}

function getRooms() {
  const rooms = [];
  state.theMap.cells.forEach(cell => {
    if (cell.role != 'primary') return;
    if (cell.hasLayerContent(ct.walls)) return;
    if (rooms.some(room => room.cells.has(cell))) return;
    const newRoom = createRoom(cell);
    if (newRoom) rooms.push(newRoom);
  });
  // Filter out rooms that contain other rooms.
  return rooms.filter(room => !rooms.some(otherRoom =>
    room != otherRoom && room.minCol <= otherRoom.minCol &&
        room.minRow <= otherRoom.minRow &&
        room.maxCol >= otherRoom.maxCol &&
        room.maxRow >= otherRoom.maxRow));
}

function createRoom(seed) {
  const cells = new Set([seed]);
  let front = new Set([seed]);
  while (front.size > 0) {
    const newFront = new Set();
    front.forEach(cell => {
      ['top', 'bottom', 'left', 'right'].forEach(dir => {
        const neighbors = cell.getNeighbors(dir);
        if (!neighbors) return;
        const neighborPrimary = neighbors.cells[0];
        if (!neighborPrimary ||
            neighborPrimary.hasLayerContent(ct.walls) ||
            newFront.has(neighborPrimary) ||
            cells.has(neighborPrimary)) {
          return;
        }
        const neighborDivider = neighbors.dividerCell;
        if (neighborPrimary.hasLayerContent(ct.walls)) return;
        // Check corners
        const cornerDirs = (dir == 'left' || dir == 'right') ?
          ['top', 'bottom'] : ['left', 'right'];
        if (cornerDirs
            .map(cornerDir => neighborDivider.getNeighbor(cornerDir, true))
            .filter(corner => !!corner)
            .every(corner => corner.hasLayerContent(ct.walls))) {
          return;
        }
        cells.add(neighborPrimary);
        newFront.add(neighborPrimary);
      });
    });
    front = newFront;
  }
  if (cells.size <= 1) return null;
  let minRow = Number.POSITIVE_INFINITY;
  let minCol = Number.POSITIVE_INFINITY;
  let maxRow = Number.NEGATIVE_INFINITY;
  let maxCol = Number.NEGATIVE_INFINITY;
  cells.forEach(cell => {
    minRow = Math.min(cell.row, minRow);
    minCol = Math.min(cell.column, minCol);
    maxRow = Math.max(cell.row, maxRow);
    maxCol = Math.max(cell.column, minCol);
  });
  // Find the cell closest to the center.
  const centerRow = Math.floor((minRow + maxRow) / 2);
  const centerCol = Math.floor((minCol + maxCol) / 2);
  let centerCell = null;
  let minDistance = Number.POSITIVE_INFINITY;
  for (const cell of cells) {
    const distance = Math.pow(cell.row - centerRow, 2) +
        Math.pow(cell.column - centerCol, 2);
    if (distance < minDistance) {
      minDistance = distance;
      centerCell = cell;
      if (distance == 0) break;
    }
  }
  return {cells, minRow, minCol, maxRow, maxCol, centerCell};
}
