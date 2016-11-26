function handleKeyDownEvent(keyDownEvent) {
  if (keyDownEvent.ctrlKey) {
    switch (keyDownEvent.key) {
      case 'z': state.undo(); break;
      case 'y': state.redo(); break;
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

function handleMouseMoveEvent(mouseEvent) {
  if (mouseEvent.buttons == 4) {
    // Middle button is pan.
    const nav = state.navigation;
    nav.translate.x += mouseEvent.movementX;
    nav.translate.y += mouseEvent.movementY;
    updateMapTransform();
  }
}

function expandGrid(n) {
  state.recordOperationComplete();
  const gridData = state.pstate.gridData;
  changeGridDimensions(gridData.from - n, gridData.to + n);
  createTheMapAndUpdateElements();
  const offsetX = n * (state.theMap.cellWidth + state.theMap.dividerWidth);
  const offsetY = n * (state.theMap.cellHeight + state.theMap.dividerHeight);
  const nav = state.navigation;
  nav.translate.x -= offsetX * nav.scale;
  nav.translate.y -= offsetY * nav.scale;
  updateMapTransform();
  state.recordOperationComplete();
}

function changeGridDimensions(newFrom, newTo) {
  const gridData = state.pstate.gridData;
  const oldFrom = gridData.from;
  const oldTo = gridData.to;
  if (oldFrom == newFrom && oldTo == newTo) {
    return;
  }
  state.pstate.gridData.from = newFrom;
  state.pstate.gridData.to = newTo;
  state.recordGridDataChange('from', oldFrom, newFrom);
  state.recordGridDataChange('to', oldTo, newTo);
}

function resetView() {
  const nav = state.navigation;
  nav.scale = 1.0;
  nav.translate.x = 8;
  nav.translate.y = 8;
  updateMapTransform();
}

function resetGrid() {
  state.recordOperationComplete();
  state.theMap.resetToDefault();
  changeGridDimensions(0, 25);
  createTheMapAndUpdateElements();
  resetView();
  state.recordOperationComplete();
}

function increaseBrushSize() {
  if (state.tool.brushSize >= 9) {
    return;
  }
  state.tool.brushSize += 2;
  updateBrushSizeText();
}

function decreaseBrushSize() {
  if (state.tool.brushSize <= 1) {
    return;
  }
  state.tool.brushSize -= 2;
  updateBrushSizeText();
}

function updateBrushSizeText() {
  const brushSize = state.tool.brushSize;
  document.getElementById('brushSize').textContent =
      `${brushSize} x ${brushSize}`;
}

function handleManualModeChange(isManualMode) {
  state.tool.manualMode = isManualMode;
}

function handleSelectedToolChange(toolElementName) {
  switch (toolElementName) {
    case 'terrainTool':
      state.gesture = new WallGesture();
      break;
    case 'singleDoorTool':
      state.gesture = new DoorGesture(ct.doors.door.single);
      break;
    case 'doubleDoorTool':
      state.gesture = new DoorGesture(ct.doors.door.double);
      break;
    case 'secretDoorTool':
      state.gesture = new DoorGesture(ct.doors.door.secret);
      break;
    case 'textTool':
      state.gesture = new TextGesture();
      break;
  }
}
