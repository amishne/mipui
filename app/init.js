function getUrlParams() {
  var result = {};
  location.search.substr(1).split('&').forEach(pair => {
    const [key, val] = pair.split('=');
    result[key] = val;
  });
  return result;
}

function start() {
  const app = document.getElementById('app');
  const grid = document.getElementById('grid');
  createGrid(grid, 30);
  document.onkeydown = (keyDownEvent) => { handleKeyDownEvent(keyDownEvent); };
  app.onwheel = (wheelEvent) => { handleWheelEvent(wheelEvent); };
  const params = getUrlParams();
  if (params.ps) {
    state.loadFromString(params.ps);
  }
}

function handleKeyDownEvent(keyDownEvent) {
  if (keyDownEvent.ctrlKey) {
    switch (keyDownEvent.key) {
      case 'z': state.undo(); break;
      case 'y': state.redo(); break;
    }
  }
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
  const grid = document.getElementById('grid');
  grid.style.transform =
      `translate(${nav.translate.x}px, ${nav.translate.y}px) ` +
      `scale(${nav.scale})`;
  wheelEvent.stopPropagation();
}

const state = new State();
window.onload = () => { start(); };
