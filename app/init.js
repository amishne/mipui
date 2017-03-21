function getUrlParams() {
  var result = {};
  location.search.substr(1).split('&').forEach(pair => {
    const [key, val] = pair.split('=');
    result[key] = val;
  });
  return result;
}

function createTheMapAndUpdateElements() {
  const gridData = state.getGridData();
  state.theMap.create(gridData.from, gridData.from, gridData.to, gridData.to);
  state.theMap.updateAllCells();
}

function wireUiElements() {
  const app = document.getElementById('app');
  document.onkeydown = (keyDownEvent) => { handleKeyDownEvent(keyDownEvent); };
  app.onwheel = (wheelEvent) => { handleWheelEvent(wheelEvent); };
  app.onmousemove = (mouseEvent) => { handleMouseMoveEvent(mouseEvent); };
  document.getElementById('expandButton').onclick = () => { expandGrid(2); };
  document.getElementById('resetViewButton').onclick = () => { resetView(); };
  document.getElementById('resetGridButton').onclick = () => { resetGrid(); };
  document.getElementById('increaseBrushSize').onclick = () => {
    increaseBrushSize();
  };
  document.getElementById('decreaseBrushSize').onclick = () => {
    decreaseBrushSize();
  };
  document.getElementById('manualModeCheckbox').onchange = (e) => {
    handleManualModeChange(e.target.checked);
  }
  document.getElementsByName('tool').forEach(elem => {
    elem.onchange = (e) => { handleSelectedToolChange(elem.id); }
  });
}

function initializeFirebase() {
  var config = {
    apiKey: "AIzaSyAP7CfYeh9_DWmKqTPI_-etKuhYFggaYy4",
    authDomain: "mipui-dev.firebaseapp.com",
    databaseURL: "https://mipui-dev.firebaseio.com",
  };
  firebase.initializeApp(config);
  firebase.database.enableLogging(false);
  firebase.auth().signInAnonymously().catch(function(error) {
    setStatus(Status.AUTH_ERROR);
  });
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      state.user = user;
    }
  });
}

function start() {
  setStatus(Status.INITIALIZING);
  createTheMapAndUpdateElements();
  resetView();
  wireUiElements();
  const params = getUrlParams();
  if (params.mid) {
    setStatus(Status.LOADING);
    state.setMid(decodeURIComponent(params.mid));
  } else {
    setStatus(Status.READY);
  }
}

initializeFirebase();
const state = new State();
window.onload = () => { start(); };
