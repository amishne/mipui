function createGrid(parent, n) {
  for (let i = 0; i < n; i++) {
    createDividerRow(parent, n, i - 1, i);
    createCellRow(parent, n, i);
  }
  createDividerRow(parent, n, n - 1, n);
}

function createDividerRow(parent, n, previousRow, nextRow) {
  const rowContainer = createRowContainer(parent);
  for (let i = 0; i < n; i++) {
    createCornerCell(rowContainer, previousRow, nextRow, i - 1, i);
    createHorizontalCell(rowContainer, previousRow, nextRow, i);
  }
  createCornerCell(rowContainer, previousRow, nextRow, n - 1, n);
}

function createCellRow(parent, n, row) {
  const rowContainer = createRowContainer(parent);
  for (let i = 0; i < n; i++) {
    createVerticalCell(rowContainer, row, i - 1, i);
    createPrimaryCell(rowContainer, row, i);
  }
  createVerticalCell(rowContainer, row, n - 1, n);
}

function createRowContainer(parent) {
  return createAndAppendDivWithClass(parent, 'row-container');
}

function createAndAppendDivWithClass(parent, className) {
  const result = document.createElement('div');
  result.className = className;
  parent.appendChild(result);
  return result;
}

function dividerCellKey(previousRow, previousColumn, nextRow, nextColumn) {
  return `cell ${previousRow},${previousColumn}:${nextRow},${nextColumn}`;
}

function primaryCellKey(row, column) {
  return `cell ${row},${column}`;
}

function createCornerCell(parent, previousRow, nextRow, previousColumn, nextColumn) {
  createCell(parent, 'cell corner-cell',
      dividerCellKey(previousRow, previousColumn, nextRow, nextColumn));
}

function createHorizontalCell(parent, previousRow, nextRow, column) {
  createCell(parent, 'cell horizontal-cell',
      dividerCellKey(previousRow, column, nextRow, column));
}

function createVerticalCell(parent, row, previousColumn, nextColumn) {
  createCell(parent, 'cell vertical-cell',
      dividerCellKey(row, previousColumn, row, nextColumn));
}

function createPrimaryCell(parent, row, column) {
  const key = primaryCellKey(row, column);
  const cell = createCell(parent, 'cell primary-cell', key);
  setPrimaryCellNeighborKeys(cell, row, column);
  cell.row = row;
  cell.column = column;
  cell.isPrimary = true;
}

function createCell(parent, className, key) {
  const element = createAndAppendDivWithClass(parent, className + ' solid');
  const cell = new Cell(key, element);
  element.onmousedown = (e) => {
    if (e.buttons == 1) {
      startGesture(cell);
    }
  };
  element.onmouseover = (e) => {
    if (e.buttons == 1) {
      continueGesture(cell);
    }
  };
  cell.element = element;
  state.addCell(key, cell);
  return cell;
}

function setPrimaryCellNeighborKeys(cell, row, column) {
  // Top
  cell.addNeighborKey(dividerCellKey(row - 1, column, row, column), [
    primaryCellKey(row - 1, column),
  ]);
  // Right
  cell.addNeighborKey(dividerCellKey(row, column, row, column + 1), [
    primaryCellKey(row, column + 1),
  ]);
  // Bottom
  cell.addNeighborKey(dividerCellKey(row, column, row + 1, column), [
    primaryCellKey(row + 1, column),
  ]);
  // Left
  cell.addNeighborKey(dividerCellKey(row, column - 1, row, column), [
    primaryCellKey(row, column - 1)
  ]);
  // Top-right
  cell.addNeighborKey(dividerCellKey(row - 1, column, row, column + 1), [
    primaryCellKey(row - 1, column),
    primaryCellKey(row, column + 1),
    primaryCellKey(row - 1, column + 1),
  ]);
  // Bottom-right
  cell.addNeighborKey(dividerCellKey(row, column, row + 1, column + 1), [
    primaryCellKey(row + 1, column),
    primaryCellKey(row, column + 1),
    primaryCellKey(row + 1, column + 1),
  ]);
  // Bottom-left
  cell.addNeighborKey(dividerCellKey(row, column - 1, row + 1, column), [
    primaryCellKey(row + 1, column),
    primaryCellKey(row, column - 1),
    primaryCellKey(row + 1, column - 1),
  ]);
  // Top-left
  cell.addNeighborKey(dividerCellKey(row - 1, column - 1, row, column), [
    primaryCellKey(row - 1, column),
    primaryCellKey(row, column - 1),
    primaryCellKey(row - 1, column - 1),
  ]);
}
