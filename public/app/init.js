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
}

function initializeFirebase(callback) {
  const isProd =
      window.location.href.match(/^https?:\/\/(www\.)?mipui.net\/.*/);
  var config = isProd ? {
    apiKey: "AIzaSyA7tcZVmhwYyV4ygmEEuB1RKwgBZZC7HsQ",
    authDomain: "mipui-prod.firebaseapp.com",
    databaseURL: "https://mipui-prod.firebaseio.com",
  } : {
    apiKey: "AIzaSyAP7CfYeh9_DWmKqTPI_-etKuhYFggaYy4",
    authDomain: "mipui-dev.firebaseapp.com",
    databaseURL: "https://mipui-dev.firebaseio.com",
  };
  firebase.initializeApp(config);
  firebase.database.enableLogging(true);
  firebase.auth().signInAnonymously()
      .then(user => {state.user = user; callback();})
      .catch(error => setStatus(Status.AUTH_ERROR));
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      state.user = user;
    }
  });
}

function start() {
  const params = getUrlParams();
  const menu = new Menu();
  menu.createMenu();
  setStatus(Status.INITIALIZING);
  createTheMapAndUpdateElements();
  initializeFirebase(() => {
    const mid = params.mid ? decodeURIComponent(params.mid) : null;
    const secret = params.secret ? decodeURIComponent(params.secret) : null;
    if (mid) {
      state.opCenter.connectToExistingMap(mid, secret, () => {
        if (secret) menu.setToInitialSelection();
        setStatus(Status.READY);
      });
    } else {
      menu.setToInitialSelection();
      setStatus(Status.READY);
    }
  });
  resetView();
  wireUiElements();
}

const state = new State();
window.onload = () => {
  start();
  window.ga=window.ga||function(){(ga.q=ga.q||[]).push(arguments)};
  ga.l=+new Date;
  ga('create', 'UA-96544349-1', 'auto');
  ga('send', 'pageview');
};
