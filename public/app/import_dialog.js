class ImportDialog extends Dialog {
  constructor() {
    super();
    this.importButtons_ = [];
  }

  getAcceptButtonText_() { return 'Import'; }
  getActivatedAcceptButtonText_() { return 'Importing...'; }

  showDialogContent_() {
    const addRadioButton = (name, ...descriptions) => {
      const container = createAndAppendDivWithClass(
          this.dialogElement_, 'menu-radio-group');
      const button = document.createElement('input');
      button.type = 'radio';
      button.name = 'import';
      button.value = name;
      const id = 'exportButton' + this.importButtons_.length;
      button.id = id;
      container.appendChild(button);
      this.importButtons_.push(button);
      if (this.importButtons_.length == 1) button.checked = true;
      const label = document.createElement('label');
      label.innerHTML = `<b>${name}</b><br /><div class="menu-radio-details">${
        descriptions.join('<br />')}</div>`;
      label.setAttribute('for', id);
      container.appendChild(label);
    };

    addRadioButton('donjon', 'Import a TSV file exported by ' +
        '<a href="https://donjon.bin.sh/fantasy/dungeon/index.cgi" ' +
        'target="_blank">donjon Random Dungeon Generator</a>.');
  }

  async act_() {
    state.theMap.lockTiles();
    const selectedButton = this.importButtons_.find(button => button.checked);
    switch (selectedButton.value) {
      case 'donjon':
        await this.importDonjonMap_();
        break;
    }
    // Complete
    state.theMap.unlockTiles();
  }

  importDonjonMap_() {
    return new Promise((accept, reject) => {
      const inputElement = document.createElement('input');
      inputElement.type = 'file';
      inputElement.accept = '.tsv,.txt';
      inputElement.addEventListener('change', () => {
        const files = inputElement.files;
        if (files && files.length > 0) {
          const fr = new FileReader();
          fr.addEventListener('load', async() => {
            const numOpsToUndo =
                await this.applyDonjonFile_(inputElement.value, fr.result);
            state.opCenter.recordOperationComplete();
            for (let i = 0; i < numOpsToUndo; i++) {
              state.opCenter.undo();
            }
            accept();
          });
          fr.readAsText(files[0]);
        }
      });
      inputElement.click();
    });
  }

  async applyDonjonFile_(filename, input) {
    // Try to guess the map title from the file name.
    const match = filename.match(/([^/\\]*)\(tsv\).txt/);
    if (match) {
      state.setProperty(pk.title, match[1], true);
    }
    // donjon files are are one tab-separated row per map row. Values are:
    // "": Wall.
    // "F": Floor.
    // "DB": Floor + door to the bottom of this cell. Same with "T", "R", "L".
    // "DPB": Floor + portcullis door.
    // "DSB": Floor + secret door.
    // "SUU" / "SU": Stairs up. "UU" is the higher section.
    // "SDD" / "SD". Stairs down. "DD" is the lower section.
    const lines = input.split('\n');
    if (lines.length == 0) return 0;
    resetGrid();
    state.setProperty(pk.firstRow, 0, true);
    state.setProperty(pk.lastRow, lines.length, true);
    const width = lines[0].split('\t').length;
    state.setProperty(pk.firstColumn, 0, true);
    state.setProperty(pk.lastColumn, width, true);
    state.opCenter.recordOperationComplete();

    const wallGesture = new WallGesture(1, false);
    wallGesture.recordOperationCompletion = false;
    for (let y = 0; y < lines.length; y++) {
      const values = lines[y].split('\t');
      if (values.length != width) return 2;
      for (let x = 0; x < width; x++) {
        const value = values[x];
        const cell = state.theMap.getCell(y, x);
        wallGesture.stopHover();
        wallGesture.startHover(cell);
        if (value == 'F') continue;
        if (value == '') {
          // Walls. Use a wall gesture for smart connections.
          wallGesture.startGesture();
          wallGesture.stopGesture();
          continue;
        }
        if (value.startsWith('D')) {
          // A floor cell with a door to one of its sides.
          let doorDir = '';
          if (value.endsWith('T')) doorDir = 'top';
          if (value.endsWith('R')) doorDir = 'right';
          if (value.endsWith('B')) doorDir = 'bottom';
          if (value.endsWith('L')) doorDir = 'left';
          let doorKind = ct.separators.door;
          let doorVariation = ct.separators.door.single;
          if (value.startsWith('DS')) doorVariation = ct.separators.door.secret;
          if (value.startsWith('DP')) {
            doorKind = ct.separators.bars;
            doorVariation = ct.separators.bars.generic;
          }
          const doorCell = cell.getNeighbor(doorDir, true);
          doorCell.setLayerContent(ct.separators, {
            [ck.kind]: doorKind.id,
            [ck.variation]: doorVariation.id,
          }, true);
          if (doorKind != ct.separators.bars) {
            doorCell.setLayerContent(ct.walls, {
              [ck.kind]: ct.walls.smooth.id,
              [ck.variation]: ct.walls.smooth.square.id,
            }, true);
          }
          continue;
        }
        if (value.startsWith('S')) {
          // Stairs. We can only know the direction when we see where these
          // connect to; so we always set the first instance to spiral and then
          // set both the startcell and the endcell once we find the endcell.
          let kind = ct.elevation.spiral;
          let variation = ct.elevation.spiral.generic;
          let startCell = null;
          const topCell = cell.getNeighbor('top', false);
          if (topCell &&
              topCell.isKind(ct.elevation, ct.elevation.spiral)) {
            kind = ct.elevation.vertical;
            variation = value == 'SDD' || value == 'SU' ?
              kind.ascendingTop : kind.ascendingBottom;
            startCell = topCell;
          }
          const leftCell = cell.getNeighbor('left', false);
          if (leftCell &&
              leftCell.isKind(ct.elevation, ct.elevation.spiral)) {
            kind = ct.elevation.horizontal;
            variation = value == 'SDD' || value == 'SU' ?
              kind.ascendingLeft : kind.ascendingRight;
            startCell = leftCell;
          }
          if (startCell) {
            startCell.setLayerContent(ct.elevation, {
              [ck.kind]: kind.id,
              [ck.variation]: variation.id,
              [ck.endCell]: cell.key,
            }, true);
            cell.setLayerContent(ct.elevation, {
              [ck.kind]: kind.id,
              [ck.variation]: variation.id,
              [ck.startCell]: startCell.key,
            }, true);
          } else {
            cell.setLayerContent(ct.elevation, {
              [ck.kind]: kind.id,
              [ck.variation]: variation.id,
            }, true);
          }
        }
      }
    }
    wallGesture.stopHover();
  }
}
