const CONCURRENT_TILE_CACHING_OPERATIONS_LIMIT = 100;
let firstTileCacheStart = null;
let tilesCached = 0;
const SQUARE_CELL = {
  [ck.kind]: ct.walls.smooth.id,
  [ck.variation]: ct.walls.smooth.square.id,
};

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
    this.x = x;
    this.y = y;
    this.cells = [];
    // layer -> element
    this.layerElements = new Map();
    this.firstCell = null;
    this.lastCell = null;

    // Geometry
    this.dimensionsInitialized_ = false;
    this.left = null;
    this.right = null;
    this.top = null;
    this.bottom = null;
    this.width = null;
    this.height = null;

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
    this.width = this.lastCell.offsetLeft + this.lastCell.width - this.left;
    this.height = this.lastCell.offsetTop + this.lastCell.height - this.top;
    this.containerElement_.style.width = this.width;
    this.containerElement_.style.height = this.height;

    this.active_ = true;
    this.cacheImage_();
  }

  // Called when the cursor enters the tile
  enter() {
    this.lock_('cursor');
    // Sometimes the exit event isn't called because the browser doesn't
    // guarantee mouseexit. To prevent that from becoming an issue in the long
    // run, we occasionally exit() all other tiles upon tile entry.
    if (performance.now() % 10 == 0) {
      let count = 0;
      state.theMap.tiles.forEach(tile => {
        if (tile != this) {
          count += tile.exit() ? 1 : 0;
        }
      });
      if (count > 0) {
        debug(`Deactivating ${count} tiles stuch on 'cursor' lock.`);
      }
    }
    this.activate_();
  }

  // Called when the cursor leaves the tile
  exit() {
    return this.unlock_('cursor');
  }

  showHighlight() {
    this.lock_('highlight');
    this.activate_();
  }

  hideHighlight() {
    return this.unlock_('highlight');
  }

  // Called when an element that this tile contains (directly or as a replica)
  // has changed.
  invalidate() {
    this.interrupted_ = true;
    this.imageIsValid_ = false;
    this.locks_.delete('highlight');
    this.activate_();
  }

  // Called when we want to prevent this tile from being cached.
  lock_(id) {
    if (this.locks_.has(id)) return;
    this.locks_.add(id);
    this.interrupted_ = true;
    this.stopTimer_();
  }

  // Called when we no longer want to prevent caching of this tile.
  unlock_(id) {
    const wasRemoved = this.locks_.delete(id);
    if (wasRemoved) this.restartTimer_();
    return wasRemoved;
  }

  activate_() {
    if (!this.active_) {
      this.containerElement_.appendChild(this.mapElement);
      this.imageElement_.style.visibility = 'hidden';
      this.containerElement_.style.filter = '';
      debug(`Tile ${this.key} activated.`);
      this.active_ = true;
    }
    this.restartTimer_();
  }

  deactivate_(start) {
    if (!this.active_) return;
    this.containerElement_.removeChild(this.mapElement);
    this.imageElement_.style.visibility = 'visible';
    this.containerElement_.style.filter = 'grayscale(1)';
    this.imageIsValid_ = true;
    this.active_ = false;
    const duration = Math.ceil(performance.now() - start);
    debug(`Deactivated tile ${this.key} in ${duration}ms.`);
  }

  cacheImage_() {
    if (state.theMap.areTilesLocked()) {
      this.restartTimer_();
      return;
    }
    this.interrupted_ = false;
    const start = performance.now();
    if (!firstTileCacheStart) firstTileCacheStart = performance.now();
    if (this.imageIsValid_) {
      debug(`Matched tile ${this.key} with the cached image.`);
      this.deactivate_(start);
      return;
    }
    const imageFromTheme = this.getImageFromTheme_();
    if (imageFromTheme) {
      this.imageElement_.src = imageFromTheme;
      this.imageElement_.style.width = tileSize * 32;
      this.imageElement_.style.height = tileSize * 32;
      this.deactivate_(start);
      return;
    }
    if (state.theMap.concurrentTileCachingOperations >
        CONCURRENT_TILE_CACHING_OPERATIONS_LIMIT) {
      this.restartTimer_();
      return;
    }
    state.theMap.concurrentTileCachingOperations++;
    state.tileGridImager
        .node2pngDataUrl(this.mapElement, this.width, this.height)
        .then(dataUrl => {
          state.theMap.concurrentTileCachingOperations--;
          // Local locks already interrupt, so it's only global locks we have to
          // worry about.
          if (state.theMap.areTilesLocked()) return;
          this.imageElement_.src = dataUrl;
          this.imageElement_.style.width = this.width;
          this.imageElement_.style.height = this.height;
          this.deactivate_(start);
          tilesCached++;
          if (tilesCached % 10 == 0) {
            const duration =
                Math.ceil((performance.now() - firstTileCacheStart) / 1000);
            debug(`Cached ${tilesCached} tiles in ${duration}s`);
          }
        }).catch(reason => {
          state.theMap.concurrentTileCachingOperations--;
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
    const emptyTileImage = state.currentTheme[`emptyTile${tileSize}Src`];
    if (emptyTileImage) {
      const tileOnlyHasFloors = ct.children.every(layer =>
        layer == ct.floors ||
        this.layerElements.get(layer).childElementCount == 0
      );
      if (tileOnlyHasFloors) {
        debug(`Matched tile ${this.key} with the empty tile image.`);
        return emptyTileImage;
      }
    }
    const fullTileImage = state.currentTheme[`fullTile${tileSize}Src`];
    if (fullTileImage) {
      const tileOnlyHasFloorsAndWalls = ct.children.every(layer =>
        layer == ct.floors ||
        layer == ct.walls ||
        this.layerElements.get(layer).childElementCount == 0
      );
      // For early termination, we require the wall layer to have at least the
      // number of elements as the number of grid cells.
      if (this.layerElements.get(ct.walls).childElementCount <
          this.gridLayer.childElementCount) {
        return null;
      }
      const allOwnedCellsAreSquareWalls =
          this.cells.every(
              cell => sameContent(cell.getLayerContent(ct.walls), SQUARE_CELL));
      if (tileOnlyHasFloorsAndWalls && allOwnedCellsAreSquareWalls) {
        debug(`Matched tile ${this.key} with the full tile image.`);
        return fullTileImage;
      }
    }
    return null;
  }
}
