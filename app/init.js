function getUrlParams() {
  var result = {};
  location.search.substr(1).split('&').forEach(pair => {
    const [key, val] = pair.split('=');
    result[key] = decodeURIComponent(val);
  });
  return result;
}

function start() {
  createGrid(document.getElementById('grid'), 30);
  const params = getUrlParams();
  if (params.ndps) {
    state.loadFromString(params.ndps);
    state.updateAllCells();
  }
}

const state = new State();
window.onload = () => { start(); };
