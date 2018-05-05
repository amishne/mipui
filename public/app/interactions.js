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
  cached[obj][fieldName] = null;
}

function handleResizeEvent() {
  invalidateCached(mapContainer, 'offsetWidth');
  invalidateCached(mapContainer, 'offsetHeight');
}

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
  const mapFrame = document.getElementById('mapFrame');
  const mapWidth = getCached(mapContainer, 'offsetWidth');
  const mapHeight = getCached(mapContainer, 'offsetHeight');
  mapFrame.style.width =
      state.theMap.mapWidth * nav.scale + mapWidth;
  mapFrame.style.height =
      state.theMap.mapHeight * nav.scale + mapHeight;
  theMap.style.left = mapWidth / 2;
  theMap.style.top = mapHeight / 2;
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
  state.opCenter.recordOperationComplete();
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
  state.opCenter.recordOperationComplete();
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
      button.element.style.left = x + offsetX;
      button.element.style.top = y + offsetY;
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
  actionPane.textContent = 'Tap here to Apply. ' +
      'WARNING: Mobile/touch support is experimental and work-in-progress, ' +
      'and it might even permanently corrupt your map.';
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

function showResizeDialog() {
  const overlay = createAndAppendDivWithClass(document.body, 'modal-overlay');
  const closeOverlay = () => {
    overlay.parentElement.removeChild(overlay);
  };

  const dialog = createAndAppendDivWithClass(overlay, 'modal-dialog');

  const currentSize = createAndAppendDivWithClass(dialog, 'modal-dialog-line');
  const currentWidth =
      state.getProperty(pk.lastColumn) - state.getProperty(pk.firstColumn);
  const currentHeight =
      state.getProperty(pk.lastRow) - state.getProperty(pk.firstRow);
  currentSize.textContent =
      `Current size is ${currentWidth} x ${currentHeight}.`;

  const newSizeLine = createAndAppendDivWithClass(dialog, 'modal-dialog-line');
  const newSizePrefix = createAndAppendDivWithClass(newSizeLine);
  newSizePrefix.textContent = 'New size is ';
  const newSizeWidth = document.createElement('input');
  newSizeLine.appendChild(newSizeWidth);
  newSizeWidth.value = currentWidth;
  newSizeWidth.type = 'number';
  newSizeWidth.min = 1;
  newSizeWidth.max = 1000;
  const newSizeInfix = createAndAppendDivWithClass(newSizeLine);
  newSizeInfix.textContent = 'x';
  const newSizeHeight = document.createElement('input');
  newSizeLine.appendChild(newSizeHeight);
  newSizeHeight.value = currentHeight;
  newSizeHeight.type = 'number';
  newSizeHeight.min = 1;
  newSizeHeight.max = 1000;

  const anchorButtons = [];
  let selectedAnchor = {x: 0, y: 0};
  const selectAnchor = (x, y) => {
    selectedAnchor = {x, y};
    anchorButtons.forEach((button, index) => {
      const currX = index % 3;
      const currY = Math.floor(index / 3);
      button.classList.remove('anchor-button-selected');
      if (currX == x && currY == y) {
        button.classList.add('anchor-button-selected');
        button.textContent = '⚓';
      } else if (currX == x + 1 && currY == y) {
        button.textContent = '→';
      } else if (currX == x + 1 && currY == y + 1) {
        button.textContent = '↘';
      } else if (currX == x && currY == y + 1) {
        button.textContent = '↓';
      } else if (currX == x - 1 && currY == y + 1) {
        button.textContent = '↙';
      } else if (currX == x - 1 && currY == y) {
        button.textContent = '←';
      } else if (currX == x - 1 && currY == y - 1) {
        button.textContent = '↖';
      } else if (currX == x && currY == y - 1) {
        button.textContent = '↑';
      } else if (currX == x + 1 && currY == y - 1) {
        button.textContent = '↗';
      } else {
        button.textContent = 'o';
      }
    });
  };
  const anchorBox =
      createAndAppendDivWithClass(dialog, 'modal-dialog-anchorbox');
  for (let y = 0; y < 3; y++) {
    const anchorBoxLine =
        createAndAppendDivWithClass(anchorBox, 'modal-dialog-anchorbox-line');
    for (let x = 0; x < 3; x++) {
      const anchorButton = document.createElement('button');
      anchorBoxLine.appendChild(anchorButton);
      anchorButton.className = 'anchor-button';
      anchorButtons.push(anchorButton);
      anchorButton.onclick = () => { selectAnchor(x, y); };
    }
  }
  selectAnchor(selectedAnchor.x, selectedAnchor.y);

  const warningLine = createAndAppendDivWithClass(
      dialog, 'modal-dialog-line modal-dialog-warning');
  warningLine.textContent = 'Warning: Depending on your device, expect ' +
      'significant slowdowns on maps where width times height is over ~3000.';

  const dialogButtons =
      createAndAppendDivWithClass(dialog, 'modal-dialog-line');
  const accept = document.createElement('button');
  accept.className = 'modal-dialog-button modal-dialog-accept-button';
  dialogButtons.appendChild(accept);
  accept.textContent = 'Resize';
  const cancel = document.createElement('button');
  dialogButtons.appendChild(cancel);
  cancel.className = 'modal-dialog-button modal-dialog-cancel-button';
  cancel.textContent = 'Cancel';
  cancel.onclick = closeOverlay;
  accept.onclick = () => {
    const newWidth = newSizeWidth.value;
    const newHeight = newSizeHeight.value;
    if (newWidth < 1 || newWidth > 1000 || newHeight < 1 || newHeight > 1000) {
      return;
    }
    const widthDiff = newWidth - currentWidth;
    const heightDiff = newHeight - currentHeight;
    let firstColumnDiff = null;
    let lastColumnDiff = null;
    switch (selectedAnchor.x) {
      case 0:
        firstColumnDiff = 0;
        lastColumnDiff = widthDiff;
        break;
      case 1:
        firstColumnDiff = Math.floor(widthDiff / 2);
        lastColumnDiff = widthDiff - firstColumnDiff;
        break;
      case 2:
        firstColumnDiff = widthDiff;
        lastColumnDiff = 0;
        break;
    }
    let firstRowDiff = null;
    let lastRowDiff = null;
    switch (selectedAnchor.y) {
      case 0:
        firstRowDiff = 0;
        lastRowDiff = heightDiff;
        break;
      case 1:
        firstRowDiff = Math.floor(heightDiff / 2);
        lastRowDiff = heightDiff - firstRowDiff;
        break;
      case 2:
        firstRowDiff = heightDiff;
        lastRowDiff = 0;
        break;
    }
    resizeGridBy(-firstColumnDiff, lastColumnDiff, -firstRowDiff, lastRowDiff);
    closeOverlay();
  };
}

function showExportDialog() {
  const overlay = createAndAppendDivWithClass(document.body, 'modal-overlay');
  const closeOverlay = () => {
    overlay.parentElement.removeChild(overlay);
  };

  const dialog = createAndAppendDivWithClass(overlay, 'modal-dialog');
  const exportButtons = [];
  addRadioButton = (name, ...descriptions) => {
    const container = createAndAppendDivWithClass(dialog, 'export-group');
    const button = document.createElement('input');
    button.type = 'radio';
    button.name = 'export';
    button.value = name;
    const id = 'exportButton' + exportButtons.length;
    button.id = id;
    container.appendChild(button);
    exportButtons.push(button);
    if (exportButtons.length == 1) button.checked = true;
    const label = document.createElement('label');
    label.innerHTML = `<b>${name}</b><br />` +
        `<div class="export-details">${descriptions.join('<br />')}</div>`;
    label.setAttribute('for', id);
    container.appendChild(label);
  };

  addRadioButton('1:1', '32 pixels per cell.',
      'This looks like the app looks at default zoom level.');
  addRadioButton('Quick', '192 pixels per cell.',
      'This is generated faster than the other options.');
  addRadioButton('Battlemap', '300 pixels per cell.',
      'When printing in 300 DPI, this will result in 1 inch per cell.');
  addRadioButton('App',
      '70 pixels per cell, cropped to align with grid.',
      'This is the most convenient option when importing the image in ' +
      'other apps, such as virtual tabletops.');

  const dialogButtons =
      createAndAppendDivWithClass(dialog, 'modal-dialog-line');
  const accept = document.createElement('button');
  accept.className = 'modal-dialog-button modal-dialog-accept-button';
  dialogButtons.appendChild(accept);
  accept.textContent = 'Export';
  const cancel = document.createElement('button');
  dialogButtons.appendChild(cancel);
  cancel.className = 'modal-dialog-button modal-dialog-cancel-button';
  cancel.textContent = 'Cancel';
  cancel.onclick = closeOverlay;
  accept.onclick = async() => {
    accept.textContent = 'Exporting...';
    accept.disabled = 1;
    state.theMap.lockTiles();
    const selectedButton = exportButtons.find(button => button.checked);
    switch (selectedButton.value) {
      case '1:1':
        await downloadPng(1, 0, 0);
        break;
      case 'Quick':
        await downloadPng(0, 0, 0, true);
        break;
      case 'Battlemap':
        await downloadPng(300 / 32, 0, 0);
        break;
      case 'App':
        await downloadPng(70 / 32, 3, 4);
        break;
    }
    state.theMap.unlockTiles();
    closeOverlay();
  };
}

async function downloadPng(scale, startOffset, endOffset, disableCloning) {
  const gridImager = disableCloning ? state.tileGridImager :
    state.tileGridImager.clone({
      scale,
      margin: -startOffset,
    });
  if (!disableCloning) {
    state.theMap.invalidateTiles();
  }
  const theMapElement = document.getElementById('theMap');
  const blob = await gridImager.node2blob(theMapElement,
      theMapElement.clientWidth, theMapElement.clientHeight);
  saveAs(blob, 'mipui.png');
}
