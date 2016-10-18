function getUrlParams() {
  var result = {};
  location.search.substr(1).split('&').forEach(pair => {
    const [key, val] = pair.split('=');
    result[key] = val;
  });
  return result;
}

function start() {
  createGrid(document.getElementById('grid'), 30);
  const params = getUrlParams();
  if (params.ps) {
    state.loadFromString(params.ps);
    state.updateAllCells();
  }
}

const state = new State();
window.onload = () => { start(); };
