class ResizeDialog extends Dialog {
  constructor() {
    super();
    this.newSizeWidth_ = null;
    this.newSizeHeight_ = null;
    this.currentWidth_ = null;
    this.currentHeight_ = null;
    this.selectedAnchor_ = null;
  }

  getAcceptButtonText_() { return 'Resize'; }
  getActivatedAcceptButtonText_() { return 'Resizing...'; }

  showDialogContent_() {
    const currentSize = createAndAppendDivWithClass(
        this.dialogElement_, 'modal-dialog-line');
    this.currentWidth_ =
        state.getProperty(pk.lastColumn) - state.getProperty(pk.firstColumn);
    this.currentHeight_ =
        state.getProperty(pk.lastRow) - state.getProperty(pk.firstRow);
    currentSize.textContent =
        `Current size is ${this.currentWidth_} x ${this.currentHeight_}.`;

    const newSizeLine =
        createAndAppendDivWithClass(this.dialogElement_, 'modal-dialog-line');
    const newSizePrefix = createAndAppendDivWithClass(newSizeLine);
    newSizePrefix.textContent = 'New size is ';
    this.newSizeWidth_ = document.createElement('input');
    newSizeLine.appendChild(this.newSizeWidth_);
    this.newSizeWidth_.value = this.currentWidth_;
    this.newSizeWidth_.type = 'number';
    this.newSizeWidth_.min = 1;
    this.newSizeWidth_.max = 100;
    const newSizeInfix = createAndAppendDivWithClass(newSizeLine);
    newSizeInfix.textContent = 'x';
    this.newSizeHeight_ = document.createElement('input');
    newSizeLine.appendChild(this.newSizeHeight_);
    this.newSizeHeight_.value = this.currentHeight_;
    this.newSizeHeight_.type = 'number';
    this.newSizeHeight_.min = 1;
    this.newSizeHeight_.max = 200;

    const anchorButtons = [];
    this.selectedAnchor_ = {x: 0, y: 0};
    const selectAnchor = (x, y) => {
      this.selectedAnchor_ = {x, y};
      anchorButtons.forEach((button, index) => {
        const currX = index % 3;
        const currY = Math.floor(index / 3);
        button.classList.remove('anchor-button-selected');
        if (currX == x && currY == y) {
          button.classList.add('anchor-button-selected');
          button.textContent = '⚓';
        } else if (currX == x + 1 && currY == y) {
          button.textContent = '→';
        } else if (currX == x + 1 && currY == y + 1) {
          button.textContent = '↘';
        } else if (currX == x && currY == y + 1) {
          button.textContent = '↓';
        } else if (currX == x - 1 && currY == y + 1) {
          button.textContent = '↙';
        } else if (currX == x - 1 && currY == y) {
          button.textContent = '←';
        } else if (currX == x - 1 && currY == y - 1) {
          button.textContent = '↖';
        } else if (currX == x && currY == y - 1) {
          button.textContent = '↑';
        } else if (currX == x + 1 && currY == y - 1) {
          button.textContent = '↗';
        } else {
          button.textContent = 'o';
        }
      });
    };
    const anchorBox = createAndAppendDivWithClass(
        this.dialogElement_, 'modal-dialog-anchorbox');
    for (let y = 0; y < 3; y++) {
      const anchorBoxLine =
          createAndAppendDivWithClass(anchorBox, 'modal-dialog-anchorbox-line');
      for (let x = 0; x < 3; x++) {
        const anchorButton = document.createElement('button');
        anchorBoxLine.appendChild(anchorButton);
        anchorButton.className = 'anchor-button';
        anchorButtons.push(anchorButton);
        anchorButton.onclick = () => { selectAnchor(x, y); };
      }
    }
    selectAnchor(this.selectedAnchor_.x, this.selectedAnchor_.y);

    const warningLine = createAndAppendDivWithClass(
        this.dialogElement_, 'modal-dialog-line modal-dialog-warning');
    warningLine.textContent =
        'Performance degrades as maps get larger. Depending on the device, ' +
        'browser tab crashes and map corruptions might occur in maps over ' +
        '250x250.';
  }

  async act_() {
    const newWidth = this.newSizeWidth_.value;
    const newHeight = this.newSizeHeight_.value;
    if (newWidth < 1 || newWidth > 1000 || newHeight < 1 || newHeight > 1000) {
      return;
    }
    const widthDiff = newWidth - this.currentWidth_;
    const heightDiff = newHeight - this.currentHeight_;
    let firstColumnDiff = null;
    let lastColumnDiff = null;
    switch (this.selectedAnchor_.x) {
      case 0:
        firstColumnDiff = 0;
        lastColumnDiff = widthDiff;
        break;
      case 1:
        firstColumnDiff = Math.floor(widthDiff / 2);
        lastColumnDiff = widthDiff - firstColumnDiff;
        break;
      case 2:
        firstColumnDiff = widthDiff;
        lastColumnDiff = 0;
        break;
    }
    let firstRowDiff = null;
    let lastRowDiff = null;
    switch (this.selectedAnchor_.y) {
      case 0:
        firstRowDiff = 0;
        lastRowDiff = heightDiff;
        break;
      case 1:
        firstRowDiff = Math.floor(heightDiff / 2);
        lastRowDiff = heightDiff - firstRowDiff;
        break;
      case 2:
        firstRowDiff = heightDiff;
        lastRowDiff = 0;
        break;
    }
    resizeGridBy(-firstColumnDiff, lastColumnDiff, -firstRowDiff, lastRowDiff);
  }
}
