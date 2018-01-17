class Tile {
  constructor(parent, key, x, y) {
    // Elements
    this.containerElement_ = createAndAppendDivWithClass(parent, 'tile');
    this.mapElement =
        createAndAppendDivWithClass(this.containerElement_, 'tile-map');
    this.imageElement_ = document.createElement('img');
    this.imageElement_.className = 'tile-image';
    this.imageElement_.addEventListener('mouseenter', () => this.enter());
    this.containerElement_.appendChild(this.imageElement_);
    this.gridLayer = createAndAppendDivWithClass(this.mapElement, 'grid-layer');

    // Identity and content
    this.key = key;
    this.cells = [];
    this.layerElements = new Map();
    this.firstCell = null;
    this.lastCell = null;

    // Geometry
    this.x = x;
    this.y = y;
    this.dimensionsInitialized_ = false;
    this.left = null;
    this.right = null;
    this.top = null;
    this.bottom = null;

    // Status
    this.active_ = false;
    this.interrupted_ = false;
    this.imageIsValid_ = false;
    this.timer_ = null;
    this.locks_ = new Set();
  }

  initializeDimensions(left, top) {
    if (this.dimensionsInitialized_) return;
    this.dimensionsInitialized_ = true;
    this.left = left;
    this.top = top;
    this.containerElement_.style.left = left;
    this.containerElement_.style.top = top;
  }

  finalizeDimensions() {
    if (!this.lastCell) return;
    this.right = this.lastCell.offsetRight;
    this.bottom = this.lastCell.offsetBottom;
    this.width = 1 + this.lastCell.offsetLeft + this.lastCell.width - this.left;
    this.height = 1 + this.lastCell.offsetTop + this.lastCell.height - this.top;
    this.containerElement_.style.width = this.width;
    this.containerElement_.style.height = this.height;

    this.active_ = true;
    this.cacheImage_();
  }

  // Called when the cursor enters the tile
  enter() {
    this.lock('cursor');
    this.activate_();
  }

  // Called when the cursor leaves the tile
  exit() {
    this.unlock('cursor');
  }

  // Called when an element that this tile contains (directly or as a replica)
  // has changed.
  invalidate() {
    this.interrupted_ = true;
    this.imageIsValid_ = false;
    this.activate_();
  }

  // Called when we want to prevent this tile from being cached.
  lock(id) {
    this.locks_.add(id);
    this.interrupted_ = true;
    this.stopTimer_();
  }

  // Called when we no longer want to prevent caching of this tile.
  unlock(id) {
    this.locks_.delete(id);
    this.restartTimer_();
  }

  activate_() {
    if (!this.active_) {
      this.containerElement_.appendChild(this.mapElement);
      this.imageElement_.style.visibility = 'hidden';
      // Debug only:
      this.containerElement_.style.filter = '';
      debug(`Tile ${this.key} activated.`);
      this.active_ = true;
    }
    this.restartTimer_();
  }

  deactivate_(start) {
    this.containerElement_.removeChild(this.mapElement);
    this.imageElement_.style.visibility = 'visible';
    this.containerElement_.style.filter = 'grayscale(1)';
    this.imageIsValid_ = true;
    this.active_ = false;
    const duration = Math.ceil(performance.now() - start);
    console.log(`Deactivated tile ${this.key} in ${duration}ms.`);
  }

  cacheImage_() {
    if (state.theMap.areTilesLocked()) {
      this.restartTimer_();
      return;
    }
    this.interrupted_ = false;
    const start = performance.now();
    if (this.imageIsValid_) {
      this.deactivate_(start);
      return;
    }
    const imageFromTheme = this.getImageFromTheme_();
    if (imageFromTheme) {
      this.imageElement_.src = imageFromTheme;
      this.deactivate_(start);
      return;
    }
    domtoimage.toPng(this.mapElement, {
      width: this.containerElement_.clientWidth,
      height: this.containerElement_.clientHeight,
      filter: node => node.style.visibility != 'hidden' &&
          !node.classList.contains('grid-layer'),
      scale: 6, // Maximum zoom level
      responsive: true,
      isInterrupted: () => this.isInterrupted_(),
      disableSmoothing: true,
    }).then(dataUrl => {
      // Local locks already interrupt, so it's only global locks we have to
      // worry about.
      if (state.theMap.areTilesLocked()) return;
      this.imageElement_.src = dataUrl;
      this.deactivate_(start);
    }).catch(reason => {
      debug(`Tile ${this.key} caching failed: ${reason}.`);
    });
  }

  restartTimer_() {
    this.stopTimer_();
    if (!this.active_) return;
    if (this.locks_.size > 0) return;
    if (state.theMap.areTilesLocked()) {
      state.theMap.addTileUnlockListener(this, () => this.restartTimer_());
      return;
    }
    this.timer_ = setTimeout(() => this.cacheImage_(), this.getTimerLength_());
  }

  stopTimer_() {
    if (this.timer_) {
      clearTimeout(this.timer_);
      state.theMap.removeTileUnlockListener(this);
    }
    this.timer_ = null;
  }

  isInterrupted_() {
    if (this.interrupted_) {
      this.interrupted_ = false;
      return true;
    }
    // Local locks already interrupt, so it's only global locks we have to
    // worry about.
    return state.theMap.areTilesLocked();
  }

  getTimerLength_() {
    return 4000 + Math.random() * 2000;
  }

  getImageFromTheme_() {
    const emptyTile5Src = themes[state.getProperty(pk.theme)].emptyTile5Src;
    if (emptyTile5Src) {
      const emptyTile = this.cells.every(
          cell => ct.children.every(
              layer => layer == ct.floors ||
              this.layerElements.get(layer).childElementCount == 0));
      if (emptyTile) {
        console.log(`Matched tile ${this.key} with the empty tile image.`);
        return emptyTile5Src;
      }
    }
    return null;
  }
}
