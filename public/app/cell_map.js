class CellMap {
  constructor() {
    this.cells = new Map();

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
    const gridLayer = mapElement.getElementsByClassName('grid-layer')[0];
    for (let i = minY; i < maxY; i++) {
      this.createDividerRow_(mapElement, gridLayer, minX, maxX, i - 1, i);
      this.currX = 0;
      this.currY += this.dividerHeight;
      this.createCellRow_(mapElement, gridLayer, minX, maxX, i);
      this.currX = 0;
      this.currY += this.cellHeight;
    }
    this.createDividerRow_(mapElement, gridLayer, minX, maxX, maxY - 1, maxY);
    this.currY += this.dividerHeight;
    this.setMapSize_(mapElement, this.currX + 1, this.currY + 1);
  }

  setMapSize_(container, width, height) {
    // Set layer sizes.
    const layerElements = container.getElementsByClassName('layer');
    for (let i = 0; i < layerElements.length; i++) {
      const layerElement = layerElements[i];
      if (layerElement.classList.contains('grid-layer')) continue;
      layerElement.style.width = width;
      layerElement.style.height = height;
    }
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
    const elements = document.getElementsByClassName('layer');
    for (let i = 0; i < elements.length; i++) {
      elements[i].innerHTML = '';
    }
  }

  createDividerRow_(mapElement, parent, minX, maxX, previousRow, nextRow) {
    const rowContainer = this.createRowContainer_(parent);
    for (let i = minX; i < maxX; i++) {
      this.createCornerCell_(
          mapElement, rowContainer, previousRow, i - 1, nextRow, i);
      this.currX += this.dividerWidth;
      this.createHorizontalCell_(
          mapElement, rowContainer, previousRow, nextRow, i);
      this.currX += this.cellWidth;
    }
    this.createCornerCell_(
        mapElement, rowContainer, previousRow, maxX - 1, nextRow, maxX);
    this.currX += this.dividerWidth;
  }

  createRowContainer_(parent) {
    return createAndAppendDivWithClass(parent, 'row-container');
  }

  createCellRow_(mapElement, parent, minX, maxX, row) {
    const rowContainer = this.createRowContainer_(parent);
    for (let i = minX; i < maxX; i++) {
      this.createVerticalCell_(mapElement, rowContainer, row, i - 1, i);
      this.currX += this.dividerWidth;
      this.createPrimaryCell_(mapElement, rowContainer, row, i);
      this.currX += this.cellWidth;
    }
    this.createVerticalCell_(mapElement, rowContainer, row, maxX - 1, maxX);
    this.currX += this.dividerWidth;
  }

  createCornerCell_(
      mapElement, parent, previousRow, previousColumn, nextRow, nextColumn) {
    const key = CellMap.dividerCellKey(
        previousRow, previousColumn, nextRow, nextColumn);
    const cell = this.createCell_(mapElement, parent, 'corner', key);
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
    cell.row = previousRow + 0.5;
    cell.column = previousColumn + 0.5;
  }

  createHorizontalCell_(mapElement, parent, previousRow, nextRow, column) {
    const key = CellMap.dividerCellKey(previousRow, column, nextRow, column);
    const cell = this.createCell_(mapElement, parent, 'horizontal', key);
    this.setHorizontalCellNeighborKeys_(cell, previousRow, nextRow, column);
    if (!this.cellWidth) {
      this.cellWidth = cell.gridElement.offsetWidth;
    }
    cell.height = this.dividerHeight;
    cell.width = this.cellWidth;
    cell.row = previousRow + 0.5;
    cell.column = column;
  }

  createVerticalCell_(mapElement, parent, row, previousColumn, nextColumn) {
    const key = CellMap.dividerCellKey(row, previousColumn, row, nextColumn);
    const cell = this.createCell_(mapElement, parent, 'vertical', key);
    this.setVerticalCellNeighborKeys_(cell, row, previousColumn, nextColumn);
    if (!this.cellHeight) {
      this.cellHeight = cell.gridElement.offsetHeight;
    }
    cell.height = this.cellHeight;
    cell.width = this.dividerWidth;
    cell.row = row;
    cell.column = previousColumn + 0.5;
  }

  createPrimaryCell_(mapElement, parent, row, column) {
    const key = CellMap.primaryCellKey(row, column);
    const cell = this.createCell_(mapElement, parent, 'primary', key);
    this.setPrimaryCellNeighborKeys_(cell, row, column);
    cell.height = this.cellHeight;
    cell.width = this.cellWidth;
    cell.row = row;
    cell.column = column;
  }

  createCell_(mapElement, parent, role, key) {
    const element =
        createAndAppendDivWithClass(parent, `grid-cell ${role}-cell`);
    const cell = new Cell(key, role, element, mapElement);
    cell.offsetLeft = this.currX;
    cell.offsetTop = this.currY;
    this.cells.set(key, cell);
    return cell;
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
}
