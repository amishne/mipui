class Tile {
  constructor(parent, key, x, y) {
    this.element = createAndAppendDivWithClass(parent, 'tile');
    this.gridLayer = createAndAppendDivWithClass(this.element, 'grid-layer');
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
  }

  initializeDimensions(left, top) {
    if (this.dimensionsInitialized) return;
    this.dimensionsInitialized = true;
    this.left = left;
    this.top = top;
    this.element.style.left = left;
    this.element.style.top = top;
  }

  finalizeDimensions() {
    if (!this.lastCell) return;
    this.right = this.lastCell.offsetRight;
    this.bottom = this.lastCell.offsetBottom;
    this.width = 1 + this.lastCell.offsetLeft + this.lastCell.width - this.left;
    this.height = 1 + this.lastCell.offsetTop + this.lastCell.height - this.top;
    this.element.style.width = this.width;
    this.element.style.height = this.height;
  }

  mouseEntered() {
    this.hovered = true;
    this.activate();
  }

  mouseExited() {
    this.hovered = false;
    setTimeout(() => this.deactivate(), 5000);
  }

  activate() {
    if (this.active) return;
    this.active = true;
    console.log(`Tile ${this.key} activated.`);
    setTimeout(() => this.deactivate(), 5000);
  }

  deactivate() {
    if (!this.active || this.hovered) return;
    this.active = false;
    console.log(`Tile ${this.key} deactivated.`);
  }
}
