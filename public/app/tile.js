// Tile Actions
//   enter()
//     Called when the cursor enters the tile
//   exit()
//     Called when the cursor leaves the tile
//   invalidate()
//     Called when an element that this tile contains (directly or as a replica)
//     has changed.
//   lock()
//     Called when we want to prevent this tile from being cached.
//   unlock()
//     Called when we no longer want to prevent caching of this tile.
// Action active? locked? Result
// enter  f       a       show dom
//                        active = true
//                        locked = true
// enter  t       a       locked = true
// exit   f       a       assert!
// exit   t       f       start timer
// exit   t       t       nop
// invldt f       a       active = true
//                        start timer
// invldt t       f       restart timer
// invldt t       t       local lock: nop, global lock: listen
// timer  t       f       show image
//                        active = false
// timer  f       a       assert!
// timer  t       t       assert!
// lock   a       a       locked = true
// unlock f       a       nop
// unlock t       f       if invalid, start timer
class Tile {
  constructor(parent, key, x, y) {
    this.containerElement = createAndAppendDivWithClass(parent, 'tile');
    this.mapElement =
        createAndAppendDivWithClass(this.containerElement, 'tile-map');
    this.imageElement = document.createElement('img');
    this.imageElement.className = 'tile-image';
    this.imageElement.addEventListener('mouseenter', () => this.mouseEntered());
    this.containerElement.appendChild(this.imageElement);
    this.gridLayer = createAndAppendDivWithClass(this.mapElement, 'grid-layer');
    this.cells = [];
    this.key = key;
    this.x = x;
    this.y = y;
    this.dimensionsInitialized = false;
    this.layerElements = new Map();
    this.firstCell = null;
    this.lastCell = null;
    this.left = null;
    this.right = null;
    this.top = null;
    this.bottom = null;
    this.active = false;
    this.deactivationTimer = null;
    this.isImageReady = false;
    this.locked = false;
  }

  initializeDimensions(left, top) {
    if (this.dimensionsInitialized) return;
    this.dimensionsInitialized = true;
    this.left = left;
    this.top = top;
    this.containerElement.style.left = left;
    this.containerElement.style.top = top;
  }

  finalizeDimensions() {
    if (!this.lastCell) return;
    this.right = this.lastCell.offsetRight;
    this.bottom = this.lastCell.offsetBottom;
    this.width = 1 + this.lastCell.offsetLeft + this.lastCell.width - this.left;
    this.height = 1 + this.lastCell.offsetTop + this.lastCell.height - this.top;
    this.containerElement.style.width = this.width;
    this.containerElement.style.height = this.height;

    this.active = true;
    this.deactivate();
  }

  mouseEntered() {
    this.activate();
  }

  mouseExited() {
    this.markForDeactivation();
  }

  invalidateImage() {
    this.isImageReady = false;
  }

  activate() {
    if (this.active) return;
    this.active = true;
    this.containerElement.appendChild(this.mapElement);
    this.imageElement.style.visibility = 'hidden';
    this.containerElement.style.filter = '';
    clearTimeout(this.deactivationTimer);
    this.deactivationTimer = null;
    debug(`Tile ${this.key} activated.`);
    this.markForDeactivation();
  }

  markForDeactivation() {
    if (this.deactivationTimer || this.locked) return;
    this.deactivationTimer = setTimeout(() => {
      window.requestAnimationFrame(() => {
        this.deactivate();
        this.deactivationTimer = null;
      });
    }, 4000 + Math.random() * 2000);
  }

  deactivate() {
    if (!this.active || this.locked) return;
    this.active = false;
    debug(`Tile ${this.key} deactivated.`);

    const start = performance.now();
    if (this.isImageReady) {
      this.deactivationComplete(start);
      return;
    }
    const imageFromTheme = this.getImageFromTheme();
    if (imageFromTheme) {
      this.imageElement.src = imageFromTheme;
      this.deactivationComplete(start);
      return;
    }
    domtoimage.toPng(this.mapElement, {
      width: this.containerElement.clientWidth,
      height: this.containerElement.clientHeight,
      filter: node => node.style.visibility != 'hidden' &&
          !node.classList.contains('grid-layer'),
      scale: 6, // Maximum zoom level
      responsive: true,
      isInterrupted: () => this.active,
      disableSmoothing: true,
    }).then(dataUrl => {
      if (this.active || this.locked) return;
      this.imageElement.src = dataUrl;
      this.deactivationComplete(start);
    }).catch(reason => {
      debug(`Tile ${this.key} caching failed: ${reason}.`);
    });
  }

  deactivationComplete(deactivationStartTime) {
    const duration = Math.ceil(performance.now() - deactivationStartTime);
    console.log(`Deactivated tile ${this.key} in ${duration}ms.`);
    this.containerElement.removeChild(this.mapElement);
    this.isImageReady = true;
    this.imageElement.style.visibility = 'visible';
    this.containerElement.style.filter = 'grayscale(1)';
  }

  lock() {
    this.locked = true;
  }

  unlock() {
    this.locked = false;
    this.markForDeactivation();
  }

  getImageFromTheme() {
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

  xenter() {
    this.lock('cursor');
    this.activate_();
  }

  xexit() {
    this.unlock('cursor');
  }

  xinvalidate() {
    this.interruptCaching_();
    this.activate_();
  }

  xlock(id) {
    this.locks_.add(id);
    this.interruptCaching_();
    this.stopTimer_();
  }

  xunlock(id) {
    this.locks_.remove(id);
    if (this.isActive_ && this.isUnlocked_()) {
      this.restartTimer_();
    }
  }

  xactivate_() {
    if (!this.isActive_) {
      this.switchToDom_();
      this.isActive_ = true;
    }
    if (this.isUnlocked_()) {
      this.restartTimer_();
    }
  }

  xrestartTimer_() {
  }

  xisUnlocked_() {
  }
}
