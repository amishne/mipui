// Utility method for importing a map from watawatabou's One Page Dungeon
// generator.

class OnePageDungeonImporter {
  constructor() {
    this.smoothWall = {
      [ck.kind]: ct.walls.smooth.id,
      [ck.variation]: ct.walls.smooth.square.id,
    };
    this.waterContent = {
      [ck.kind]: ct.shapes.circle.id,
      [ck.variation]: ct.shapes.circle.blue.id,
    };
  }

  importMap(filename, input) {
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
    this.drawRoom_(
        minCol - margin - 0.5,
        minRow - margin - 0.5,
        2 * margin + maxCol - minCol,
        2 * margin + maxRow - minRow,
        this.smoothWall,
    );
    // And then curve out non-wall rooms.
    for (const rect of data.rects) {
      this.drawRoom_(rect.x, rect.y, rect.w - 1, rect.h - 1, null,
          {rotunda: rect.rotunda || false});
    }

    // Doors and other separators.
    for (const door of data.doors || []) {
      this.drawDoor_(door);
    }
    
    // Columns.
    for (const column of data.columns || []) {
      this.drawColumn_(column);
    }

    // Water cells.
    this.drawAllWater_(data.water);

    for (const note of data.notes) {
      this.drawNote_(note);
    }

    state.opCenter.recordOperationComplete();
  }

  drawRoom_(startCol, startRow, width, height, content, options = {}) {
    const endCol = startCol + width;
    const endRow = startRow + height;
    if (options.rotunda) {
      state.opCenter.recordOperationComplete();
      this.drawOvalRoom_(startCol, startRow, endCol, endRow);
      return;
    }
    for (let col = startCol; col <= endCol; col += 0.5) {
      for (let row = startRow; row <= endRow; row += 0.5) {
        const cell = state.theMap.getCell(row, col);
        cell.setLayerContent(ct.walls, content, true);
      }
    }
  }

  drawOvalRoom_(startCol, startRow, endCol, endRow) {
    const gesture = new OvalRoomGesture(false);
    const startCell = state.theMap.getCell(startRow, startCol);
    const endCell = state.theMap.getCell(endRow, endCol);
    gesture.startHover(startCell);
    gesture.startGesture();
    gesture.continueGesture(endCell);
    gesture.stopGesture();
  }

  drawDoor_(door) {
    const cell =
        state.theMap.getCell(
            door.y - (door.dir.y / 2),
            door.x - (door.dir.x / 2));
    const nextCell = 
        state.theMap.getCell(
            door.y - door.dir.y,
            door.x - door.dir.x);
    const oppositeCell =
        state.theMap.getCell(
            door.y + (door.dir.y / 2),
            door.x + (door.dir.x / 2));
    const previousCell =
        state.theMap.getCell(
            door.y + door.dir.y,
            door.x + door.dir.x);
    oppositeCell.setLayerContent(ct.walls, null, true);
    let isStairs = false;
    switch (door.type) {
      case 1:
        // Single door
        cell.setLayerContent(ct.walls, this.smoothWall, true);
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
        isStairs = true;
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
        cell.setLayerContent(ct.walls, this.smoothWall, true);
        cell.setLayerContent(ct.separators, {
          [ck.kind]: ct.separators.door.id,
          [ck.variation]: ct.separators.door.double.id,
        }, true);
        break;
      case 6:
        // Secret door
        cell.setLayerContent(ct.walls, this.smoothWall, true);
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
    if (!isStairs) {
      nextCell.setLayerContent(ct.walls, null, true);
      previousCell.setLayerContent(ct.walls, null, true);
    }
  }

  drawColumn_(column) {
    const col = Math.round(column.x) - 0.5;
    const row = Math.round(column.y) - 0.5;
    const cell = state.theMap.getCell(row, col);
    cell.setLayerContent(ct.walls, this.smoothWall, true);
  }

  drawAllWater_(waterData) {
    const waterCoords = new Set();
    for (const water of waterData) {
      waterCoords.add(`${water.x},${water.y}`);
    }
    for (const water of waterData) {
      const centerCell = state.theMap.getCell(water.y, water.x);
      if (centerCell.hasLayerContent(ct.walls)) continue;
      const topCell = state.theMap.getCell(water.y - 1, water.x);
      const rightCell = state.theMap.getCell(water.y, water.x + 1);
      const bottomCell = state.theMap.getCell(water.y + 1, water.x);
      const leftCell = state.theMap.getCell(water.y, water.x - 1);
      const bottomRightCell = state.theMap.getCell(water.y + 1, water.x + 1);
      const cornerCell = state.theMap.getCell(water.y + 0.5, water.x + 0.5);

      let centerConnections = 0;
      if (!topCell.hasLayerContent(ct.walls) &&
          waterCoords.has(`${water.x},${water.y - 1}`)) {
        centerConnections |= 1;
      }
      if (!rightCell.hasLayerContent(ct.walls) &&
          waterCoords.has(`${water.x + 1},${water.y}`)) {
        centerConnections |= 2;
        state.theMap.getCell(water.y, water.x + 0.5).setLayerContent(
            ct.shapes, {...this.waterContent, [ck.connections]: 2 | 8}, true);
      }
      if (!bottomCell.hasLayerContent(ct.walls) &&
          waterCoords.has(`${water.x},${water.y + 1}`)) {
        centerConnections |= 4;
        state.theMap.getCell(water.y + 0.5, water.x).setLayerContent(
            ct.shapes, {...this.waterContent, [ck.connections]: 1 | 4}, true);
      }
      if (!leftCell.hasLayerContent(ct.walls) &&
          waterCoords.has(`${water.x - 1},${water.y}`)) {
        centerConnections |= 8;
      }
      if (!rightCell.hasLayerContent(ct.walls) &&
          !bottomCell.hasLayerContent(ct.walls) &&
          !bottomRightCell.hasLayerContent(ct.walls) &&
          !cornerCell.hasLayerContent(ct.walls) &&
          waterCoords.has(`${water.x + 1},${water.y}`) &&
          waterCoords.has(`${water.x},${water.y + 1}`) &&
          waterCoords.has(`${water.x + 1},${water.y + 1}`)) {
        cornerCell.setLayerContent(
            ct.shapes, {...this.waterContent, [ck.connections]: 255}, true);
      }

      centerCell.setLayerContent(ct.shapes,
          {...this.waterContent, [ck.connections]: centerConnections}, true);
    }
  }

  drawNote_(note) {
    const x = note.pos.x - 0.5;
    const y = note.pos.y - 0.5;
    const startCell = state.theMap.getCell(Math.floor(y), Math.floor(x));
    // Intentionally flooring y again - we don't want high text.
    const endCell = state.theMap.getCell(Math.floor(y), Math.ceil(x));

    startCell.setLayerContent(ct.text, {
      [ck.kind]: ct.text.text.id,
      [ck.variation]: ct.text.text.standard.id,
      [ck.endCell]: endCell.key,
      [ck.text]: note.ref,
    }, true);
    const cells = startCell.getPrimaryCellsInSquareTo(endCell);
    for (const cell of cells) {
      if (cell === startCell) continue;
      cell.setLayerContent(ct.text, {
        [ck.kind]: ct.text.text.id,
        [ck.variation]: ct.text.text.standard.id,
        [ck.startCell]: startCell.key,
      }, true);
    }
  }
}