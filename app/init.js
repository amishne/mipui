function getUrlParams() {
  var result = {};
  location.search.substr(1).split('&').forEach(pair => {
    const [key, val] = pair.split('=');
    result[key] = val;
  });
  return result;
}

function createGridAndUpdateElements() {
  const gridData = state.getGridData();
  const gridElement = document.getElementById('grid');
  gridElement.innerHTML = '';
  createGrid(gridElement, gridData.from, gridData.to);
  state.updateAllCells();
}

function wireUiElements() {
  const app = document.getElementById('app');
  document.onkeydown = (keyDownEvent) => { handleKeyDownEvent(keyDownEvent); };
  app.onwheel = (wheelEvent) => { handleWheelEvent(wheelEvent); };
  app.onmousemove = (mouseEvent) => { handleMouseMoveEvent(mouseEvent); };
  document.getElementById('expandButton').onclick = () => { expandGrid(2); };
  document.getElementById('resetViewButton').onclick = () => { resetView(); };
}

function start() {
  const params = getUrlParams();
  if (params.ps) {
    state.loadFromString(params.ps);
  }
  createGridAndUpdateElements();
  resetView();
  wireUiElements();
}

const state = new State();
window.onload = () => { start(); };
