function getUrlParams() {
  const result = {};
  location.search.substr(1).split('&').forEach(pair => {
    const [key, val] = pair.split('=');
    result[key] = val;
  });
  return result;
}

function createTheMapAndUpdateElements() {
  state.theMap.create(
      state.getProperty(pk.firstColumn),
      state.getProperty(pk.firstRow),
      state.getProperty(pk.lastColumn),
      state.getProperty(pk.lastRow));
  state.theMap.updateAllCells();
}

function wireUiElements() {
  window.addEventListener('contextmenu', contextMenuEvent => {
    contextMenuEvent.preventDefault();
    contextMenuEvent.stopPropagation();
    return true;
  });
  document.onkeydown = keyDownEvent => handleKeyDownEvent(keyDownEvent);
  const mapContainer = document.getElementById('mapContainer');
  mapContainer.onwheel = wheelEvent => handleWheelEvent(wheelEvent);
  mapContainer.onmousemove = mouseEvent => handleMouseMoveEvent(mouseEvent);
  document.getElementById('app')
      .addEventListener('mousedown', handleMouseDownEvent);
  mapContainer.addEventListener('touchstart', handleTouchStartEvent);
  mapContainer.addEventListener('touchmove', handleTouchMoveEvent);
  mapContainer.addEventListener('touchend', handleTouchEndEvent);
  mapContainer.addEventListener('scroll', handleScrollEvent, {passive: true});
  window.onresize = resizeEvent => handleResizeEvent(resizeEvent);
}

function initializeFirebase(callback) {
  const isInTestingMode = false;
  const isProd =
      window.location.href.match(/^https?:\/\/(www\.)?mipui.net\/.*/);
  const config = isProd ? {
    apiKey: 'AIzaSyA7tcZVmhwYyV4ygmEEuB1RKwgBZZC7HsQ',
    authDomain: 'mipui-prod.firebaseapp.com',
    databaseURL: 'https://mipui-prod.firebaseio.com',
  } : {
    apiKey: 'AIzaSyAP7CfYeh9_DWmKqTPI_-etKuhYFggaYy4',
    authDomain: 'mipui-dev.firebaseapp.com',
    databaseURL: 'https://mipui-dev.firebaseio.com',
  };
  if (!isTouchDevice && (!isProd || isInTestingMode)) {
    document.getElementById('warning').style.display = 'inline-block';
    debug = s => console.log(s);
  }
  firebase.initializeApp(config);
  firebase.database.enableLogging(false);
  firebase.auth().signInAnonymously()
      .then(user => { state.user = user; callback(); })
      .catch(() => setStatus(Status.AUTH_ERROR));
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      state.user = user;
    }
  });
}

function createMapResizeButtons() {
  const mapContainer = document.getElementById('mapContainer');
  [
    {name: 'add-column-right', callback: () => resizeGridBy(0, 1, 0, 0)},
    {name: 'remove-column-right', callback: () => resizeGridBy(0, -1, 0, 0)},
    {name: 'add-row-bottom', callback: () => resizeGridBy(0, 0, 0, 1)},
    {name: 'remove-row-bottom', callback: () => resizeGridBy(0, 0, 0, -1)},
    {name: 'add-column-left', callback: () => resizeGridBy(-1, 0, 0, 0)},
    {name: 'remove-column-left', callback: () => resizeGridBy(1, 0, 0, 0)},
    {name: 'add-row-top', callback: () => resizeGridBy(0, 0, -1, 0)},
    {name: 'remove-row-top', callback: () => resizeGridBy(0, 0, 1, 0)},
  ].forEach(({name, callback}) => {
    const button = createAndAppendDivWithClass(
        mapContainer, `map-resize-button map-resize-button-${name}`);
    button.onclick = () => callback();
    button.title =
        name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' ');
  });
  refreshMapResizeButtonLocations();
}

function start() {
  const params = getUrlParams();
  mapContainer = document.getElementById('mapContainer');
  state.menu = new Menu();
  state.menu.createMenu();
  state.menu.descChanged();
  setStatus(Status.INITIALIZING);
  createTheMapAndUpdateElements();
  createMapResizeButtons();
  initializeFirebase(() => {
    const mid = params.mid ? decodeURIComponent(params.mid) : null;
    const secret = params.secret ? decodeURIComponent(params.secret) : null;
    if (mid) {
      state.opCenter.connectToExistingMap(mid, secret, () => {
        if (secret) state.menu.setToInitialSelection();
        resetView();
        setStatus(Status.READY);
      });
    } else {
      state.menu.setToInitialSelection();
      document.getElementById('theMap').classList.add('editor-view');
      setStatus(Status.READY);
    }
  });
  resetView();
  wireUiElements();
  if (window.matchMedia('(any-hover: none)').matches) {
    switchToMobileMode();
  }
}

const state = new State();

window.onload = () => {
  start();
  setTimeout(() => {
    script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.onload = function() {
      window.ga = window.ga || function() {
        (ga.q = ga.q || []).push(arguments);
      };
      ga.l = +new Date();
      ga('create', 'UA-96544349-1', 'auto');
      ga('send', 'pageview');
    };
    script.src = 'https://www.google-analytics.com/analytics.js';
    document.getElementsByTagName('head')[0].appendChild(script);
  }, 50);
};
