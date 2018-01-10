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
    this.key = key;
    this.x = x;
    this.y = y;
    this.dimensionsInitialized = false;
    this.layerElements = new Map();
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
  }

  mouseEntered() {
    this.hovered = true;
    this.activate();
  }

  mouseExited() {
    this.hovered = false;
    this.markForDeactivation();
  }

  invalidateImage() {
    this.isImageReady = false;
  }

  activate() {
    if (this.active) return;
    this.active = true;
    this.containerElement.classList.remove('inactive-tile');
    console.log(`Tile ${this.key} activated.`);
    this.markForDeactivation();
  }

  markForDeactivation() {
    this.locked = false;
    if (this.deactivationTimer) return;
    this.deactivationTimer = setTimeout(() => {
      window.requestAnimationFrame(() => {
        this.deactivate();
        this.deactivationTimer = null;
      });
    }, 4000 + Math.random() * 2000);
  }

  deactivate() {
    if (!this.active || this.hovered) return;
    this.active = false;
    console.log(`Tile ${this.key} deactivated.`);

    const start = performance.now();
    if (this.isImageReady) {
      this.deactivationComplete(start);
    } else {
      domtoimage.toPng(this.mapElement, {
        width: this.containerElement.clientWidth,
        height: this.containerElement.clientHeight,
        filter: node => !node.classList.contains('grid-layer'),
      }).then(dataUrl => {
        if (this.active) return;
        this.imageElement.src = dataUrl;
        this.isImageReady = true;
        this.deactivationComplete(start);
      });
    }
  }

  deactivationComplete(deactivationStartTime) {
    const duration = performance.now() - deactivationStartTime;
    debug(`Deactivated tile ${this.key} in ${duration}ms.`);
    this.containerElement.classList.add('inactive-tile');
  }

  lock() {}
  unlock() {}
}
