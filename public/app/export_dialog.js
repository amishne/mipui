class ExportDialog extends Dialog {
  constructor() {
    super();
    this.exportButtons_ = [];
  }

  getAcceptButtonText_() { return 'Export'; }
  getActivatedAcceptButtonText_() { return 'Exporting...'; }

  showDialogContent_() {
    const currentWidth =
        state.getProperty(pk.lastColumn) - state.getProperty(pk.firstColumn);
    const currentHeight =
        state.getProperty(pk.lastRow) - state.getProperty(pk.firstRow);
    const addRadioButton = (name, size, ...descriptions) => {
      const container =
          createAndAppendDivWithClass(this.dialogElement_, 'menu-radio-group');
      const button = document.createElement('input');
      button.type = 'radio';
      button.name = 'export';
      button.value = name;
      const id = 'exportButton' + this.exportButtons_.length;
      button.id = id;
      container.appendChild(button);
      this.exportButtons_.push(button);
      if (this.exportButtons_.length == 1) button.checked = true;
      const label = document.createElement('label');
      const x = size * currentWidth;
      const y = size * currentHeight;
      const lines = [`${size} pixels per cell (final size ${x}x${y}).`]
          .concat(descriptions);
      if (x > 14000 || y > 14000) {
        lines.push('<span style="color: yellow">Warning: Depending on the ' +
            'browser, images with a dimension over 14,000 might not be ' +
            'properly generated.</span>');
      }
      label.innerHTML = `<b>${name}</b><br />` +
          `<div class="menu-radio-details">${lines.join('<br />')}</div>`;
      label.setAttribute('for', id);
      container.appendChild(label);
    };

    addRadioButton('1:1', 32,
        'This looks like the app looks at default zoom level.');
    addRadioButton('2:1', 64,
        'This looks like the app looks at default zoom level ' +
        'on high-DPI displays.');
    if (state.tilingCachingEnabled) {
      addRadioButton('Quick', 192,
          'This is generated faster than the other options.');
    }
    addRadioButton('Battlemap', 300,
        'When printing in 300 DPI, this will result in 1 inch per cell.');
    addRadioButton('Cropped', 70,
        'Cropped to align with grid.',
        'This is the most convenient option when importing the image in ' +
        'other apps, such as virtual tabletops.');
  }

  async act_() {
    state.theMap.lockTiles();
    const selectedButton = this.exportButtons_.find(button => button.checked);
    switch (selectedButton.value) {
      case '1:1':
        await downloadPng(1, 0, 0);
        break;
      case '2:1':
        await downloadPng(2, 0, 0);
        break;
      case 'Quick':
        await downloadPng(192 / 32, 0, 0, true);
        break;
      case 'Battlemap':
        await downloadPng(300 / 32, 0, 0);
        break;
      case 'Cropped':
        await downloadPng(70 / 32, 4, 4);
        break;
    }
    state.theMap.unlockTiles();
  }
}

async function downloadPng(
    scale, startOffset, endOffset, useCachedTiles, name) {
  const gridImager = state.tileGridImager.clone({
    scale,
    cropLeft: startOffset,
    cropTop: startOffset,
    cropRight: endOffset,
    cropBottom: endOffset,
    margins: 0,
    disableSmoothing: true,
  });
  if (!useCachedTiles) {
    state.theMap.invalidateTiles();
  }
  const theMapElement = document.getElementById('theMap');
  const blob = await gridImager.node2blob(theMapElement,
      theMapElement.clientWidth, theMapElement.clientHeight);
  saveAs(blob, name || state.getTitle() || 'mipui.png');
}
