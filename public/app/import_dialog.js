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
    addRadioButton('One Page Dungeon', 'Import a JSON file exported by ' +
        '<a href="https://watabou.itch.io/one-page-dungeon" ' +
        'target="_blank">One Page Dungeon</a>.');
    addRadioButton('Image', '<span style="color: yellow">Experimental</span>:' +
        ' Convert an image of a map into a new map.');
  }

  async act_() {
    state.theMap.lockTiles();
    const selectedButton = this.importButtons_.find(button => button.checked);
    switch (selectedButton.value) {
      case 'donjon':
        await this.importDonjonMap_();
        break;
      case 'One Page Dungeon':
        await this.importOnePageDungeonMap_();
        break;
      case 'Image':
        await this.importFromImage_();
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
    wallGesture.isBatched = true;
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

  importOnePageDungeonMap_() {
    return new Promise((accept, reject) => {
      const inputElement = document.createElement('input');
      inputElement.type = 'file';
      inputElement.accept = '.json';
      inputElement.addEventListener('change', () => {
        const files = inputElement.files;
        if (files && files.length > 0) {
          const fr = new FileReader();
          fr.addEventListener('load', async() => {
            const numOpsToUndo =
                await this.applyOnePageDungeonFile_(
                    inputElement.value, fr.result);
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

  applyOnePageDungeonFile_(filename, input) {
    const data = JSON.parse(input);

    // Basic map metadata.
    state.setProperty(
        pk.theme,
        themes.find(theme => theme.name === 'Cross Hatch (with grid)')
            .propertyIndex,
        true);
    state.setProperty(pk.title, data.title, true);
    state.setProperty(pk.longDescription, data.story, true);

    // Map size.
    let minRow = 0;
    let minCol = 0;
    let maxRow = 0;
    let maxCol = 0;
    for (const rect of data.rects) {
      minCol = Math.min(minCol, rect.x);
      minRow = Math.min(minRow, rect.y);
      maxCol = Math.max(maxCol, rect.x + rect.w);
      maxRow = Math.max(maxRow, rect.y + rect.h);
    }
    const margin = 2;
    state.setProperty(pk.firstColumn, minCol - margin, true);
    state.setProperty(pk.firstRow, minRow - margin, true);
    state.setProperty(pk.lastColumn, maxCol + margin, true);
    state.setProperty(pk.lastRow, maxRow + margin, true);
    state.opCenter.recordOperationComplete();

    // Initialize everything to walls.
    const wall = {
      [ck.kind]: ct.walls.smooth.id,
      [ck.variation]: ct.walls.smooth.square.id,
    };
    this.drawRoom_(
        minCol - margin - 0.5,
        minRow - margin - 0.5,
        2 * margin + maxCol - minCol,
        2 * margin + maxRow - minRow,
        wall);
    // And then curve out non-wall rooms.
    for (const rect of data.rects) {
      this.drawRoom_(rect.x, rect.y, rect.w - 1, rect.h - 1, null);
    }

    // Doors and other separators.
    for (const door of data.doors) {
      const cell =
          state.theMap.getCell(
              door.y - (door.dir.y / 2),
              door.x - (door.dir.x / 2));
      const oppositeCell =
          state.theMap.getCell(
              door.y + (door.dir.y / 2),
              door.x + (door.dir.x / 2));
      oppositeCell.setLayerContent(ct.walls, null, true);
      switch (door.type) {
        case 1:
          // Single door
          cell.setLayerContent(ct.walls, wall, true);
          cell.setLayerContent(ct.separators, {
            [ck.kind]: ct.separators.door.id,
            [ck.variation]: ct.separators.door.single.id,
          }, true);
          break;
        case 2:
          // Archway
          cell.setLayerContent(ct.walls, null, true);
          cell.setLayerContent(ct.separators, {
            [ck.kind]: ct.separators.archway.id,
            [ck.variation]: ct.separators.archway.generic.id,
          }, true);
          break;
        case 3:
          // Stairs
          cell.setLayerContent(ct.walls, null, true);
          const stairsCell = state.theMap.getCell(door.y, door.x);
          let stairsKind;
          let stairsVariation;
          if (door.dir.x !== 0) {
            stairsKind = ct.elevation.horizontal;
            stairsVariation = door.dir.x > 0 ? 
                ct.elevation.horizontal.ascendingLeft :
                ct.elevation.horizontal.ascendingRight;
          } else {
            stairsKind = ct.elevation.vertical;
            stairsVariation = door.dir.y > 0 ? 
                ct.elevation.vertical.ascendingTop :
                ct.elevation.vertical.ascendingBottom;
          }
          stairsCell.setLayerContent(ct.elevation, {
            [ck.kind]: stairsKind.id,
            [ck.variation]: stairsVariation.id,
          }, true);
          break;
        case 4:
          // Bars
          cell.setLayerContent(ct.walls, null, true);
          cell.setLayerContent(ct.separators, {
            [ck.kind]: ct.separators.bars.id,
            [ck.variation]: ct.separators.bars.generic.id,
          }, true);
          break;
        case 5:
          // Double door
          cell.setLayerContent(ct.walls, wall, true);
          cell.setLayerContent(ct.separators, {
            [ck.kind]: ct.separators.door.id,
            [ck.variation]: ct.separators.door.double.id,
          }, true);
          break;
        case 6:
          // Secret door
          cell.setLayerContent(ct.walls, wall, true);
          cell.setLayerContent(ct.separators, {
            [ck.kind]: ct.separators.door.id,
            [ck.variation]: ct.separators.door.secret.id,
          }, true);
          break;
        default:
          // Unknown.
          cell.setLayerContent(ct.walls, null, true);
          break;
      }
    }

    state.opCenter.recordOperationComplete();
  }

  drawRoom_(startCol, startRow, width, height, content) {
    const endCol = startCol + width;
    const endRow = startRow + height;
    for (let col = startCol; col <= endCol; col += 0.5) {
      for (let row = startRow; row <= endRow; row += 0.5) {
        const cell = state.theMap.getCell(row, col);
        cell.setLayerContent(ct.walls, content, true);
      }
    }
  }

  importFromImage_() {
    window.open('../imageimporter/image_importer.html', '_blank');
  }
}
