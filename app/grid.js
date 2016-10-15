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
  const cell = createCell(parent, 'cell primary-cell', primaryCellKey(row, column));
  cell.setAttribute('data-row', row);
  cell.setAttribute('data-column', column);
}

function createCell(parent, className, key) {
  const cell = createAndAppendDivWithClass(parent, className + ' solid');
  objects[key] = cell;
  cell.onmousedown = (e) => {
    if (e.buttons == 1) {
      startGesture(cell);
    }
  };
  cell.onmouseover = (e) => {
    if (e.buttons == 1) {
      continueGesture(cell);
    }
  };
  return cell;
}

function getNeighbors(cell) {
  const row = parseInt(cell.getAttribute('data-row'), 10);
  const column = parseInt(cell.getAttribute('data-column'), 10);
  return [
    // Cardinal directions:
    {  // top
      primaryCellKeys: [
        primaryCellKey(row - 1, column)
      ],
      dividerCellKey: dividerCellKey(row - 1, column, row, column)
    },
    {  // right
      primaryCellKeys: [
        primaryCellKey(row, column + 1)
      ],
      dividerCellKey: dividerCellKey(row, column, row, column + 1)
    },
    {  // bottom
      primaryCellKeys: [
        primaryCellKey(row + 1, column)
      ],
      dividerCellKey: dividerCellKey(row, column, row + 1, column)
    },
    {  // left
      primaryCellKeys: [
        primaryCellKey(row, column - 1)
      ],
      dividerCellKey: dividerCellKey(row, column - 1, row, column )
    },
    // Diagonal directions:
    {  // top-right
      primaryCellKeys: [
        primaryCellKey(row - 1, column),
        primaryCellKey(row, column + 1),
        primaryCellKey(row - 1, column + 1)
      ],
      dividerCellKey: dividerCellKey(row - 1, column, row, column + 1)
    },
    {  // bottom-right
      primaryCellKeys: [
        primaryCellKey(row + 1, column),
        primaryCellKey(row, column + 1),
        primaryCellKey(row + 1, column + 1)
      ],
      dividerCellKey: dividerCellKey(row, column, row + 1, column + 1)
    },
    {  // bottom-left
      primaryCellKeys: [
        primaryCellKey(row + 1, column),
        primaryCellKey(row, column - 1),
        primaryCellKey(row + 1, column - 1)
      ],
      dividerCellKey: dividerCellKey(row, column - 1, row + 1, column)
    },
    {  // top-left
      primaryCellKeys: [
        primaryCellKey(row - 1, column),
        primaryCellKey(row, column - 1),
        primaryCellKey(row - 1, column - 1)
      ],
      dividerCellKey: dividerCellKey(row - 1, column - 1, row, column)
    }
  ];
}
