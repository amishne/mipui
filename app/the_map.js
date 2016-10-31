class TheMap {
  constructor() {
    this.cells = new Map();
    this.defaultCellContent_ = new Map();
    
    // Used during construction.
    this.cellHeight = null;
    this.cellWidth = null;
    this.dividerHeight = null;
    this.dividerWidth = null;
    this.currX = null;
    this.currY = null;
    this.currZIndex = null;

    // Setup default cell content.
    this.defaultCellContent_.set('terrain', 'solid');
  }

  static dividerCellKey(previousRow, previousColumn, nextRow, nextColumn) {
    return `c ${previousRow},${previousColumn}:${nextRow},${nextColumn}`;
  }

  static primaryCellKey(row, column) {
    return `c ${row},${column}`;
  }
  
  resetToDefault() {
    this.cells.forEach(cell => {
      cell.resetToDefault();
    });
  }
  
  updateAllCells() {
    this.cells.forEach(cell => {
      cell.updateAllElements();
    });
  }
  
  create(minX, minY, maxX, maxY) {
    this.clearMap_();
    this.currX = 0;
    this.currY = 0;
    this.currZIndex = 0;
    const gridLayer = document.getElementById('gridLayer');
    for (let i = minY; i < maxY; i++) {
      this.createDividerRow_(gridLayer, minX, maxX, i - 1, i);
      this.currX = 0;
      this.currY += this.dividerHeight;
      this.createCellRow_(gridLayer, minX, maxX, i);
      this.currX = 0;
      this.currY += this.cellHeight;
    }
    this.createDividerRow_(gridLayer, minX, maxX, maxX - 1, maxX);
    this.currY += this.dividerHeight;
    const layerElements = document.getElementsByClassName('layer');
    for (let i = 0; i < layerElements.length; i++) {
      const layerElement = layerElements[i];
      if (layerElement.id == 'gridLayer') continue;
      layerElement.style.width = this.currX;
      layerElement.style.height = this.currY;
    }
  }
  
  clearMap_() {
    this.cells = new Map();
    const elements = document.getElementsByClassName('layer');
    for (let i = 0; i < elements.length; i++) {
      elements[i].innerHTML = '';
    }
  }

  createDividerRow_(parent, minX, maxX, previousRow, nextRow) {
    const rowContainer = this.createRowContainer_(parent);
    for (let i = minX; i < maxX; i++) {
      this.createCornerCell_(rowContainer, previousRow, i - 1, nextRow, i);
      this.currX += this.dividerWidth;
      this.createHorizontalCell_(rowContainer, previousRow, nextRow, i);
      this.currX += this.cellWidth;
    }
    this.createCornerCell_(rowContainer, previousRow, maxX - 1, nextRow, maxX);
    this.currX += this.dividerWidth;
  }
  
  createRowContainer_(parent) {
    return createAndAppendDivWithClass(parent, 'row-container');
  }

  createCellRow_(parent, minX, maxX, row) {
    const rowContainer = this.createRowContainer_(parent);
    for (let i = minX; i < maxX; i++) {
      this.createVerticalCell_(rowContainer, row, i - 1, i);
      this.currX += this.dividerWidth;
      this.createPrimaryCell_(rowContainer, row, i);
      this.currX += this.cellWidth;
    }
    this.createVerticalCell_(rowContainer, row, maxX - 1, maxX);
    this.currX += this.dividerWidth;
  }
  
  createCornerCell_(parent, previousRow, previousColumn, nextRow, nextColumn) {
    const key = TheMap.dividerCellKey(
        previousRow, previousColumn, nextRow, nextColumn);
    const cell = this.createCell_(parent, 'corner', key);
    if (!this.dividerHeight) {
      this.dividerHeight = cell.gridElement.offsetHeight;
    }
    if (!this.dividerWidth) {
      this.dividerWidth = cell.gridElement.offsetWidth;
    }
  }

  createHorizontalCell_(parent, previousRow, nextRow, column) {
    const key = TheMap.dividerCellKey(previousRow, column, nextRow, column);
    const cell = this.createCell_(parent, 'horizontal', key);
    this.setHorizontalCellNeighborKeys_(cell, previousRow, nextRow, column);
    if (!this.cellWidth) {
      this.cellWidth = cell.gridElement.offsetWidth;
    }
  }

  createVerticalCell_(parent, row, previousColumn, nextColumn) {
    const key = TheMap.dividerCellKey(row, previousColumn, row, nextColumn);
    const cell = this.createCell_(parent, 'vertical', key);
    this.setVerticalCellNeighborKeys_(cell, row, previousColumn, nextColumn);
    if (!this.cellHeight) {
      this.cellHeight = cell.gridElement.offsetHeight;
    }
  }

  createPrimaryCell_(parent, row, column) {
    const key = TheMap.primaryCellKey(row, column);
    const cell = this.createCell_(parent, 'primary', key);
    this.setPrimaryCellNeighborKeys_(cell, row, column);
  }

  createCell_(parent, role, key) {
    const element =
        createAndAppendDivWithClass(parent, `grid-cell ${role}-cell`);
    const cell = new Cell(key, role, element, this.defaultCellContent_);
    cell.offsetLeft = this.currX + 'px';
    cell.offsetTop = this.currY + 'px';
    cell.zIndex = ++this.currZIndex;
    this.cells.set(key, cell);
    return cell;
  }

  setPrimaryCellNeighborKeys_(cell, row, column) {
    cell.addNeighborKey('top',
        TheMap.dividerCellKey(row - 1, column, row, column), [
      TheMap.primaryCellKey(row - 1, column),
    ]);
    cell.addNeighborKey('right',
        TheMap.dividerCellKey(row, column, row, column + 1), [
      TheMap.primaryCellKey(row, column + 1),
    ]);
    cell.addNeighborKey('bottom',
        TheMap.dividerCellKey(row, column, row + 1, column), [
      TheMap.primaryCellKey(row + 1, column),
    ]);
    cell.addNeighborKey('left',
        TheMap.dividerCellKey(row, column - 1, row, column), [
      TheMap.primaryCellKey(row, column - 1)
    ]);
    cell.addNeighborKey('top-right',
        TheMap.dividerCellKey(row - 1, column, row, column + 1), [
      TheMap.primaryCellKey(row - 1, column),
      TheMap.primaryCellKey(row, column + 1),
      TheMap.primaryCellKey(row - 1, column + 1),
      TheMap.dividerCellKey(row - 1, column, row - 1, column + 1),
      TheMap.dividerCellKey(row - 1, column + 1, row, column + 1),
    ]);
    cell.addNeighborKey('bottom-right',
        TheMap.dividerCellKey(row, column, row + 1, column + 1), [
      TheMap.primaryCellKey(row + 1, column),
      TheMap.primaryCellKey(row, column + 1),
      TheMap.primaryCellKey(row + 1, column + 1),
      TheMap.dividerCellKey(row, column + 1, row + 1, column + 1),
      TheMap.dividerCellKey(row + 1, column, row + 1, column + 1),
    ]);
    cell.addNeighborKey('bottom-left',
        TheMap.dividerCellKey(row, column - 1, row + 1, column), [
      TheMap.primaryCellKey(row + 1, column),
      TheMap.primaryCellKey(row, column - 1),
      TheMap.primaryCellKey(row + 1, column - 1),
      TheMap.dividerCellKey(row, column - 1, row + 1, column - 1),
      TheMap.dividerCellKey(row + 1, column - 1, row + 1, column),
    ]);
    cell.addNeighborKey('top-left',
        TheMap.dividerCellKey(row - 1, column - 1, row, column), [
      TheMap.primaryCellKey(row - 1, column),
      TheMap.primaryCellKey(row, column - 1),
      TheMap.primaryCellKey(row - 1, column - 1),
      TheMap.dividerCellKey(row - 1, column - 1, row - 1, column),
      TheMap.dividerCellKey(row - 1, column - 1, row, column - 1),
    ]);
    cell.addNeighborKey('all-similar', null, [
      TheMap.primaryCellKey(row - 1, column - 1),
      TheMap.primaryCellKey(row - 1, column),
      TheMap.primaryCellKey(row - 1, column + 1),
      TheMap.primaryCellKey(row, column - 1),
      TheMap.primaryCellKey(row, column + 1),
      TheMap.primaryCellKey(row + 1, column - 1),
      TheMap.primaryCellKey(row + 1, column),
      TheMap.primaryCellKey(row + 1, column + 1),
    ]);
  }

  setHorizontalCellNeighborKeys_(cell, fromRow, toRow, column) {
    cell.addNeighborKey('right',
        TheMap.dividerCellKey(fromRow, column, toRow, column + 1), [
      TheMap.dividerCellKey(fromRow, column, toRow - 1, column + 1),
      TheMap.dividerCellKey(fromRow, column + 1, toRow, column + 1),
      TheMap.dividerCellKey(fromRow + 1, column, toRow, column + 1),
    ]);
    cell.addNeighborKey('left',
        TheMap.dividerCellKey(fromRow, column - 1, toRow, column), [
      TheMap.dividerCellKey(fromRow, column - 1, toRow - 1, column),
      TheMap.dividerCellKey(fromRow, column - 1, toRow, column - 1),
      TheMap.dividerCellKey(fromRow + 1, column - 1, toRow, column),
    ]);
    cell.addNeighborKey('all-similar', null, [
      TheMap.dividerCellKey(fromRow, column + 1, toRow, column + 1),
      TheMap.dividerCellKey(fromRow, column - 1, toRow, column - 1),
      TheMap.dividerCellKey(fromRow, column, toRow, column + 1),
      TheMap.dividerCellKey(fromRow, column - 1, toRow, column),
    ]);
  }

  setVerticalCellNeighborKeys_(cell, row, fromColumn, toColumn) {
    cell.addNeighborKey('top',
        TheMap.dividerCellKey(row - 1, fromColumn, row, toColumn), [
      TheMap.dividerCellKey(row - 1, fromColumn, row, toColumn - 1),
      TheMap.dividerCellKey(row - 1, fromColumn, row - 1, toColumn),
      TheMap.dividerCellKey(row - 1, fromColumn + 1, row, toColumn),
    ]);
    cell.addNeighborKey('bottom',
        TheMap.dividerCellKey(row, fromColumn, row + 1, toColumn), [
      TheMap.dividerCellKey(row, fromColumn, row + 1, toColumn - 1),
      TheMap.dividerCellKey(row + 1, fromColumn, row + 1, toColumn),
      TheMap.dividerCellKey(row, fromColumn + 1, row + 1, toColumn),
    ]);
    cell.addNeighborKey('all-similar', null, [
      TheMap.dividerCellKey(row - 1, fromColumn, row - 1, toColumn),
      TheMap.dividerCellKey(row + 1, fromColumn, row + 1, toColumn),
      TheMap.dividerCellKey(row - 1, fromColumn, row, toColumn),
      TheMap.dividerCellKey(row, fromColumn, row + 1, toColumn),
    ]);
  }

}