function createGrid(parent, from, to) {
  for (let i = from; i < to; i++) {
    createDividerRow(parent, from, to, i - 1, i);
    createCellRow(parent, from, to, i);
  }
  createDividerRow(parent, from, to, to - 1, to);
}

function createDividerRow(parent, from, to, previousRow, nextRow) {
  const rowContainer = createRowContainer(parent);
  for (let i = from; i < to; i++) {
    createCornerCell(rowContainer, previousRow, nextRow, i - 1, i);
    createHorizontalCell(rowContainer, previousRow, nextRow, i);
  }
  createCornerCell(rowContainer, previousRow, nextRow, to - 1, to);
}

function createCellRow(parent, from, to, row) {
  const rowContainer = createRowContainer(parent);
  for (let i = from; i < to; i++) {
    createVerticalCell(rowContainer, row, i - 1, i);
    createPrimaryCell(rowContainer, row, i);
  }
  createVerticalCell(rowContainer, row, to - 1, to);
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
  state.addCell(key, cell);
  return cell;
}

function setPrimaryCellNeighborKeys(cell, row, column) {
  cell.addNeighborKey('top', dividerCellKey(row - 1, column, row, column), [
    primaryCellKey(row - 1, column),
  ]);
  cell.addNeighborKey('right', dividerCellKey(row, column, row, column + 1), [
    primaryCellKey(row, column + 1),
  ]);
  cell.addNeighborKey('bottom', dividerCellKey(row, column, row + 1, column), [
    primaryCellKey(row + 1, column),
  ]);
  cell.addNeighborKey('left', dividerCellKey(row, column - 1, row, column), [
    primaryCellKey(row, column - 1)
  ]);
  cell.addNeighborKey('top-right',
      dividerCellKey(row - 1, column, row, column + 1), [
    primaryCellKey(row - 1, column),
    primaryCellKey(row, column + 1),
    primaryCellKey(row - 1, column + 1),
  ]);
  cell.addNeighborKey('bottom-right',
      dividerCellKey(row, column, row + 1, column + 1), [
    primaryCellKey(row + 1, column),
    primaryCellKey(row, column + 1),
    primaryCellKey(row + 1, column + 1),
  ]);
  cell.addNeighborKey('bottom-left',
      dividerCellKey(row, column - 1, row + 1, column), [
    primaryCellKey(row + 1, column),
    primaryCellKey(row, column - 1),
    primaryCellKey(row + 1, column - 1),
  ]);
  cell.addNeighborKey('top-left',
      dividerCellKey(row - 1, column - 1, row, column), [
    primaryCellKey(row - 1, column),
    primaryCellKey(row, column - 1),
    primaryCellKey(row - 1, column - 1),
  ]);
}
