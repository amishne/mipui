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
  const nav = state.getNavigation();
  nav.translate.x -= 44 * nav.scale;
  nav.translate.y -= 44 * nav.scale;
  updateGridTransform();
  state.recordChange();
}

function resetView() {
  const nav = state.getNavigation();
  nav.scale = 1.0;
  nav.translate.x = 8;
  nav.translate.y = 8;
  updateGridTransform();
}

function resetGrid() {
  state.initializePersistentState();
  createGridAndUpdateElements();
  resetView();
  state.recordChange();
}

function enableOverlay(cell) {
  cell.enableOverlay();
}

function disableOverlay(cell) {
  cell.disableOverlay();
}

function increaseBrushSize() {
  const tool = state.getTool();
  if (tool.brushSize >= 9) {
    return;
  }
  tool.brushSize += 2;
  updateBrushSizeText();
}

function decreaseBrushSize() {
  const tool = state.getTool();
  if (tool.brushSize <= 1) {
    return;
  }
  tool.brushSize -= 2;
  updateBrushSizeText();
}

function updateBrushSizeText() {
  const brushSize = state.getTool().brushSize;
  document.getElementById('brushSize').innerHTML =
      `${brushSize} x ${brushSize}`;
}

function handleSmartModeChange(isSmartMode) {
  state.setSmartMode(isSmartMode);
}
