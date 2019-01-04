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
      document.getElementById('theMap'),
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
  const config = state.mode == 'prod' ? {
    apiKey: 'AIzaSyA7tcZVmhwYyV4ygmEEuB1RKwgBZZC7HsQ',
    authDomain: 'mipui-prod.firebaseapp.com',
    databaseURL: 'https://mipui-prod.firebaseio.com',
  } : {
    apiKey: 'AIzaSyAP7CfYeh9_DWmKqTPI_-etKuhYFggaYy4',
    authDomain: 'mipui-dev.firebaseapp.com',
    databaseURL: 'https://mipui-dev.firebaseio.com',
  };
  firebase.initializeApp(config);
  firebase.database.enableLogging(false);
  firebase.auth().onAuthStateChanged(user => {
    userChanged(user);
  });
  initAuth(callback);
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

function initializeMenuAndStatus(includeMenu) {
  if (includeMenu) {
    state.menu = new Menu();
    state.menu.createMenu();
    state.menu.descChanged();
    setStatus(Status.INITIALIZING);
  }
  state.cursorStatusBar = new StatusBar(1);
  state.progressStatusBar = new StatusBar(2);
  state.infoStatusBar = new StatusBar(0);
  if (includeMenu && state.mode == 'dev') {
    state.menu.addDebugMenu();
  }
}

function start() {
  const params = getUrlParams();
  state.mode =
      window.location.href.match(/^https?:\/\/(www\.)?mipui.net\/.*/) ?
        'prod' : 'dev';
  const hasUi = params.noui != 'yes';
  if (params.t != 'no' && params.tc != 'no') {
    state.tilingEnabled = true;
  }
  if (params.tc != 'no') {
    state.tilingCachingEnabled = true;
  }
  mapContainer = document.getElementById('mapContainer');
  initializeMenuAndStatus(hasUi);
  createTheMapAndUpdateElements();
  if (hasUi) createMapResizeButtons();
  initializeFirebase(() => {
    const mid = params.mid ? decodeURIComponent(params.mid) : null;
    const secret = params.secret ? decodeURIComponent(params.secret) : null;
    if (mid) {
      setStatus(Status.LOADING);
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
    if (!isTouchDevice && state.mode != 'prod') {
      state.infoStatusBar.showMessage(
          'Warning: Development mode, long-term map storage not guaranteed.',
          'lightpink');
    }
  });
  resetView();
  wireUiElements();
  if (isTouchDevice) {
    switchToMobileMode();
  }

  let gridStyleSheet = null;
  for (let i = 0; i < document.styleSheets.length; i++) {
    const styleSheet = document.styleSheets[i];
    if (styleSheet.href.endsWith('app/grid.css')) {
      gridStyleSheet = styleSheet;
      break;
    }
  }
  state.tileGridImager.addCssStyleSheet(0, gridStyleSheet).then(() => {
    state.tileGridImager.recalculateStyleString();
  });
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

window.onbeforeunload = () => {
  if (state.hasUnsavedChanges) {
    return 'There are unsaved changes. Leave anyway?';
  }
};

window.addEventListener('message', event => {
  if (event.data.pstate) {
    state.load(event.data.pstate);
    event.source.postMessage({status: 'load done'}, event.origin);
  }
  if (event.data.fork) {
    const forkData = event.data.fork;
    console.log(`First map ${state.getMid()}`);
    state.opCenter.fork(() => {
      state.opCenter.pendingLocalsOpsListener = () => {
        state.opCenter.pendingLocalsOpsListener = null;
      };
      console.log(`Intermediate map ${state.getMid()}`);
      state.opCenter.fork(() => {
        console.log(`Final map ${state.getMid()}`);
        event.source.postMessage({
          status: 'forks done',
          mid: state.getMid(),
          secret: state.getSecret(),
        }, event.origin);
      });
    }, forkData);
  }
});
