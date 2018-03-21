const tileSize = 5;

class CellMap {
  constructor() {
    this.cells = new Map();
    this.tiles = new Map();

    // Used during construction.
    this.cellHeight = null;
    this.cellWidth = null;
    this.dividerHeight = null;
    this.dividerWidth = null;
    this.currX = null;
    this.currY = null;

    // For later use.
    this.mapWidth = null;
    this.mapHeight = null;

    // Tile state
    this.globalTileLock_ = false;
    this.tileLockListeners_ = new Map();
    this.concurrentTileCachingOperations = 0;
  }

  static dividerCellKey(previousRow, previousColumn, nextRow, nextColumn) {
    return `${previousRow},${previousColumn}:${nextRow},${nextColumn}`;
  }

  static primaryCellKey(row, column) {
    return `${row},${column}`;
  }

  static cellKey(row, column) {
    if (row == Math.floor(row) && column == Math.floor(column)) {
      return this.primaryCellKey(row, column);
    }
    return this.dividerCellKey(
        Math.floor(row), Math.floor(column), Math.ceil(row), Math.ceil(column));
  }

  getCell(row, column) {
    return this.cells.get(CellMap.cellKey(row, column));
  }

  resetToDefault() {
    this.cells.forEach(cell => {
      cell.resetToDefault();
    });
  }

  updateAllCells() {
    this.cells.forEach(cell => {
      cell.updateAllElementsToCurrentContent();
    });
  }

  create(mapElement, minX, minY, maxX, maxY) {
    this.clearMap_();
    this.currX = 0;
    this.currY = 0;
    for (let i = minY; i < maxY; i++) {
      this.createDividerRow_(mapElement, minX, maxX, i - 1, i);
      this.currX = 0;
      this.currY += this.dividerHeight;
      this.createCellRow_(mapElement, minX, maxX, i);
      this.currX = 0;
      this.currY += this.cellHeight;
    }
    this.createDividerRow_(mapElement, minX, maxX, maxY - 1, maxY);
    this.currY += this.dividerHeight;
    this.setMapSize_(mapElement, this.currX + 1, this.currY + 1);
    this.tiles.forEach(tile => { tile.finalizeDimensions(); });
  }

  setMapSize_(container, width, height) {
    this.cells.forEach(cell => {
      cell.offsetRight = (width - 1) - (cell.offsetLeft + cell.width);
      cell.offsetBottom = (height - 1) - (cell.offsetTop + cell.height);
    });
    container.style.width = width;
    container.style.height = height;
    this.mapWidth = width;
    this.mapHeight = height;
  }

  clearMap_() {
    this.cells = new Map();
    this.tiles = new Map();
    this.globalTileLock_ = false;
    this.tileLockListeners_ = new Map();
    document.getElementById('theMap').innerHTML = '';
  }

  createDividerRow_(parent, minX, maxX, previousRow, nextRow) {
    for (let i = minX; i < maxX; i++) {
      this.createCornerCell_(parent, previousRow, i - 1, nextRow, i);
      this.currX += this.dividerWidth;
      this.createHorizontalCell_(parent, previousRow, nextRow, i);
      this.currX += this.cellWidth;
    }
    this.createCornerCell_(parent, previousRow, maxX - 1, nextRow, maxX);
    this.currX += this.dividerWidth;
  }

  createCellRow_(parent, minX, maxX, row) {
    for (let i = minX; i < maxX; i++) {
      this.createVerticalCell_(parent, row, i - 1, i);
      this.currX += this.dividerWidth;
      this.createPrimaryCell_(parent, row, i);
      this.currX += this.cellWidth;
    }
    this.createVerticalCell_(parent, row, maxX - 1, maxX);
    this.currX += this.dividerWidth;
  }

  createCornerCell_(
      parent, previousRow, previousColumn, nextRow, nextColumn) {
    const row = previousRow + 0.5;
    const column = previousColumn + 0.5;
    const key = CellMap.dividerCellKey(
        previousRow, previousColumn, nextRow, nextColumn);
    const cell =
        this.createCell_(parent, 'corner', key, row, column);
    this.setCornerCellNeighborKeys_(
        cell, previousRow, previousColumn, nextRow, nextColumn);
    if (!this.dividerHeight) {
      this.dividerHeight = cell.gridElement.offsetHeight;
    }
    if (!this.dividerWidth) {
      this.dividerWidth = cell.gridElement.offsetWidth;
    }
    cell.height = this.dividerHeight;
    cell.width = this.dividerWidth;
    cell.row = row;
    cell.column = column;
  }

  createHorizontalCell_(parent, previousRow, nextRow, column) {
    const row = previousRow + 0.5;
    const key = CellMap.dividerCellKey(previousRow, column, nextRow, column);
    const cell =
        this.createCell_(parent, 'horizontal', key, row, column);
    this.setHorizontalCellNeighborKeys_(cell, previousRow, nextRow, column);
    if (!this.cellWidth) {
      this.cellWidth = cell.gridElement.offsetWidth;
    }
    cell.height = this.dividerHeight;
    cell.width = this.cellWidth;
    cell.row = row;
    cell.column = column;
  }

  createVerticalCell_(parent, row, previousColumn, nextColumn) {
    const column = previousColumn + 0.5;
    const key = CellMap.dividerCellKey(row, previousColumn, row, nextColumn);
    const cell =
        this.createCell_(parent, 'vertical', key, row, column);
    this.setVerticalCellNeighborKeys_(cell, row, previousColumn, nextColumn);
    if (!this.cellHeight) {
      this.cellHeight = cell.gridElement.offsetHeight;
    }
    cell.height = this.cellHeight;
    cell.width = this.dividerWidth;
    cell.row = row;
    cell.column = column;
  }

  createPrimaryCell_(parent, row, column) {
    const key = CellMap.primaryCellKey(row, column);
    const cell = this.createCell_(parent, 'primary', key, row, column);
    this.setPrimaryCellNeighborKeys_(cell, row, column);
    cell.height = this.cellHeight;
    cell.width = this.cellWidth;
    cell.row = row;
    cell.column = column;
  }

  createCell_(parent, role, key, row, column) {
    const tile = this.getOrCreateTile(parent, column, row);
    tile.initializeDimensions(this.currX, this.currY);
    const element =
        createAndAppendDivWithClass(tile.gridLayer, `grid-cell ${role}-cell`);
    const cell = new Cell(key, role, element, tile);
    tile.cells.push(cell);
    cell.offsetLeft = this.currX;
    cell.offsetTop = this.currY;
    this.cells.set(key, cell);
    element.style.left = cell.offsetLeft - tile.left;
    element.style.top = cell.offsetTop - tile.top;
    this.updateTileFirstAndLastCells_(tile, cell);
    return cell;
  }

  updateTileFirstAndLastCells_(tile, cell) {
    if (!tile.firstCell ||
        tile.firstCell.offsetLeft > cell.offsetLeft ||
        tile.firstCell.offsetTop > cell.offsetTop) {
      tile.firstCell = cell;
    }
    if (!tile.lastCell ||
        tile.lastCell.offsetLeft < cell.offsetLeft ||
        tile.lastCell.offsetTop < cell.offsetTop) {
      tile.lastCell = cell;
    }
  }

  setPrimaryCellNeighborKeys_(cell, row, column) {
    cell.addNeighborKey('top',
        CellMap.dividerCellKey(row - 1, column, row, column), [
          CellMap.primaryCellKey(row - 1, column),
        ]);
    cell.addNeighborKey('right',
        CellMap.dividerCellKey(row, column, row, column + 1), [
          CellMap.primaryCellKey(row, column + 1),
        ]);
    cell.addNeighborKey('bottom',
        CellMap.dividerCellKey(row, column, row + 1, column), [
          CellMap.primaryCellKey(row + 1, column),
        ]);
    cell.addNeighborKey('left',
        CellMap.dividerCellKey(row, column - 1, row, column), [
          CellMap.primaryCellKey(row, column - 1),
        ]);
    cell.addNeighborKey('top-right',
        CellMap.dividerCellKey(row - 1, column, row, column + 1), [
          CellMap.primaryCellKey(row - 1, column),
          CellMap.primaryCellKey(row, column + 1),
          CellMap.primaryCellKey(row - 1, column + 1),
          CellMap.dividerCellKey(row - 1, column, row - 1, column + 1),
          CellMap.dividerCellKey(row - 1, column + 1, row, column + 1),
        ]);
    cell.addNeighborKey('bottom-right',
        CellMap.dividerCellKey(row, column, row + 1, column + 1), [
          CellMap.primaryCellKey(row + 1, column),
          CellMap.primaryCellKey(row, column + 1),
          CellMap.primaryCellKey(row + 1, column + 1),
          CellMap.dividerCellKey(row, column + 1, row + 1, column + 1),
          CellMap.dividerCellKey(row + 1, column, row + 1, column + 1),
        ]);
    cell.addNeighborKey('bottom-left',
        CellMap.dividerCellKey(row, column - 1, row + 1, column), [
          CellMap.primaryCellKey(row + 1, column),
          CellMap.primaryCellKey(row, column - 1),
          CellMap.primaryCellKey(row + 1, column - 1),
          CellMap.dividerCellKey(row, column - 1, row + 1, column - 1),
          CellMap.dividerCellKey(row + 1, column - 1, row + 1, column),
        ]);
    cell.addNeighborKey('top-left',
        CellMap.dividerCellKey(row - 1, column - 1, row, column), [
          CellMap.primaryCellKey(row - 1, column),
          CellMap.primaryCellKey(row, column - 1),
          CellMap.primaryCellKey(row - 1, column - 1),
          CellMap.dividerCellKey(row - 1, column - 1, row - 1, column),
          CellMap.dividerCellKey(row - 1, column - 1, row, column - 1),
        ]);
    cell.addNeighborKey('all-similar', null, [
      CellMap.primaryCellKey(row - 1, column - 1),
      CellMap.primaryCellKey(row - 1, column),
      CellMap.primaryCellKey(row - 1, column + 1),
      CellMap.primaryCellKey(row, column - 1),
      CellMap.primaryCellKey(row, column + 1),
      CellMap.primaryCellKey(row + 1, column - 1),
      CellMap.primaryCellKey(row + 1, column),
      CellMap.primaryCellKey(row + 1, column + 1),
    ]);
  }

  setHorizontalCellNeighborKeys_(cell, fromRow, toRow, column) {
    cell.addNeighborKey('right',
        CellMap.dividerCellKey(fromRow, column, toRow, column + 1), [
          CellMap.dividerCellKey(fromRow, column, toRow - 1, column + 1),
          CellMap.dividerCellKey(fromRow, column + 1, toRow, column + 1),
          CellMap.dividerCellKey(fromRow + 1, column, toRow, column + 1),
        ]);
    cell.addNeighborKey('left',
        CellMap.dividerCellKey(fromRow, column - 1, toRow, column), [
          CellMap.dividerCellKey(fromRow, column - 1, toRow - 1, column),
          CellMap.dividerCellKey(fromRow, column - 1, toRow, column - 1),
          CellMap.dividerCellKey(fromRow + 1, column - 1, toRow, column),
        ]);
    cell.addNeighborKey('top', null, [
      CellMap.primaryCellKey(fromRow, column),
    ]);
    cell.addNeighborKey('bottom', null, [
      CellMap.primaryCellKey(toRow, column),
    ]);
    cell.addNeighborKey('right-same', null, [
      CellMap.dividerCellKey(fromRow, column + 1, toRow, column + 1),
    ]);
    cell.addNeighborKey('left-same', null, [
      CellMap.dividerCellKey(fromRow, column - 1, toRow, column - 1),
    ]);
    cell.addNeighborKey('all-similar', null, [
      CellMap.dividerCellKey(fromRow, column + 1, toRow, column + 1),
      CellMap.dividerCellKey(fromRow, column - 1, toRow, column - 1),
    ]);
  }

  setVerticalCellNeighborKeys_(cell, row, fromColumn, toColumn) {
    cell.addNeighborKey('top',
        CellMap.dividerCellKey(row - 1, fromColumn, row, toColumn), [
          CellMap.dividerCellKey(row - 1, fromColumn, row, toColumn - 1),
          CellMap.dividerCellKey(row - 1, fromColumn, row - 1, toColumn),
          CellMap.dividerCellKey(row - 1, fromColumn + 1, row, toColumn),
        ]);
    cell.addNeighborKey('bottom',
        CellMap.dividerCellKey(row, fromColumn, row + 1, toColumn), [
          CellMap.dividerCellKey(row, fromColumn, row + 1, toColumn - 1),
          CellMap.dividerCellKey(row + 1, fromColumn, row + 1, toColumn),
          CellMap.dividerCellKey(row, fromColumn + 1, row + 1, toColumn),
        ]);
    cell.addNeighborKey('right', null, [
      CellMap.primaryCellKey(row, toColumn),
    ]);
    cell.addNeighborKey('left', null, [
      CellMap.primaryCellKey(row, fromColumn),
    ]);
    cell.addNeighborKey('top-same', null, [
      CellMap.dividerCellKey(row - 1, fromColumn, row - 1, toColumn),
    ]);
    cell.addNeighborKey('bottom-same', null, [
      CellMap.dividerCellKey(row + 1, fromColumn, row + 1, toColumn),
    ]);
    cell.addNeighborKey('all-similar', null, [
      CellMap.dividerCellKey(row - 1, fromColumn, row - 1, toColumn),
      CellMap.dividerCellKey(row + 1, fromColumn, row + 1, toColumn),
    ]);
  }

  setCornerCellNeighborKeys_(
      cell, previousRow, previousColumn, nextRow, nextColumn) {
    cell.addNeighborKey('top',
        CellMap.dividerCellKey(
            previousRow, previousColumn, previousRow, nextColumn), []);
    cell.addNeighborKey('right',
        CellMap.dividerCellKey(
            previousRow, nextColumn, nextRow, nextColumn), []);
    cell.addNeighborKey('bottom',
        CellMap.dividerCellKey(
            nextRow, previousColumn, nextRow, nextColumn), []);
    cell.addNeighborKey('left',
        CellMap.dividerCellKey(
            previousRow, previousColumn, nextRow, previousColumn), []);
    cell.addNeighborKey('top-right', null, [
      CellMap.primaryCellKey(previousRow, nextColumn),
    ]);
    cell.addNeighborKey('bottom-right', null, [
      CellMap.primaryCellKey(nextRow, nextColumn),
    ]);
    cell.addNeighborKey('bottom-left', null, [
      CellMap.primaryCellKey(nextRow, previousColumn),
    ]);
    cell.addNeighborKey('top-left', null, [
      CellMap.primaryCellKey(previousRow, previousColumn),
    ]);
  }

  getOrCreateTile(parent, cellColumn, cellRow) {
    const tileX = Math.floor((cellColumn + 1) / tileSize);
    const tileY = Math.floor((cellRow + 1) / tileSize);
    const tileKey = tileX + ',' + tileY;
    let tile = this.tiles.get(tileKey);
    if (!tile) {
      tile = this.createTile(parent, tileKey, tileX, tileY);
      this.tiles.set(tileKey, tile);
    }
    return tile;
  }

  createTile(parent, key, x, y) {
    const tile = new Tile(parent, key, x, y);
    ct.children.forEach(layer => {
      const layerElement =
          createAndAppendDivWithClass(
              tile.mapElement, 'layer ' + layer.name + '-layer');
      tile.layerElements.set(layer, layerElement);
    });
    return tile;
  }

  invalidateTiles() {
    this.tiles.forEach(tile => { tile.invalidate(); });
  }

  lockTiles() {
    this.globalTileLock_ = true;
  }

  unlockTiles() {
    this.globalTileLock_ = false;
    this.tileLockListeners_.forEach(listener => { listener(); });
    this.tileLockListeners_ = new Map();
  }

  areTilesLocked() {
    return this.globalTileLock_;
  }

  addTileUnlockListener(id, listener) {
    this.tileLockListeners_.set(id, listener);
  }

  removeTileUnlockListener(id) {
    this.tileLockListeners_.delete(id);
  }
}
