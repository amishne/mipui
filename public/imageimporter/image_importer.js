const imageSrcs = [
  'dungeon-map.jpg',
  'blue_map.png',
  'brown_map.png',
  'bw_map.jpg',
  'donjon_map.png',
  'dyson_map1.png',
  'embossed_map.jpg',
  'hand_drawn_map.jpg',
];

function start() {
  const parent = document.getElementById('stackContainer');
  imageSrcs.forEach(async(src, index) => {
    //if (index > 0) return;
    const image = new Image(src);
    await image.initialize(parent);
    processImage(image);
  });
}

function processImage(image) {
  new Griddler(image).calculateCellInfo();
}

/*
function assign(image, mat, lineInfo) {
  const cellInfo = createCells(mat, lineInfo);
  calcCellStats(image, mat, cellInfo);
  const clusters = clusterColors(image, mat, cellInfo);
  assignClusters(image, mat, cellInfo, clusters);
}

function createCells(mat, lineInfo) {
  const cells = [];
  let x = null;
  let y = lineInfo.offsetTop;
  let row = -0.5;
  let col = null;
  while (y < mat.rows) {
    x = lineInfo.offsetLeft;
    col = -0.5;
    // Boundary row
    while (x < mat.cols) {
      cells.push(createCornerCell(row, col, x, y, lineInfo));
      x += lineInfo.dividerSize;
      col += 0.5;
      cells.push(createHorizontalCell(row, col, x, y, lineInfo));
      x += lineInfo.cellSize;
      col += 0.5;
    }
    cells.push(createCornerCell(row, col, x, y, lineInfo));
    // Primary row
    x = lineInfo.offsetLeft;
    col = -0.5;
    y += lineInfo.dividerSize;
    row += 0.5;
    while (x < mat.cols) {
      cells.push(createVerticalCell(row, col, x, y, lineInfo));
      x += lineInfo.dividerSize;
      col += 0.5;
      cells.push(createPrimaryCell(row, col, x, y, lineInfo));
      x += lineInfo.cellSize;
      col += 0.5;
    }
    cells.push(createVerticalCell(row, col, x, y, lineInfo));
    row += 0.5;
    y += lineInfo.cellSize;
  }
  // Final boundary row
  x = lineInfo.offsetLeft;
  col = -0.5;
  while (x < mat.cols) {
    cells.push(createCornerCell(row, col, x, y, lineInfo));
    x += lineInfo.dividerSize;
    col += 0.5;
    cells.push(createHorizontalCell(row, col, x, y, lineInfo));
    x += lineInfo.cellSize;
  }
  cells.push(createCornerCell(row, col, x, y, lineInfo));
  return {
    width: col,
    height: row,
    cells,
  };
}

function createCornerCell(row, col, x, y, lineInfo) {
  return createCell(
      row, col, x, y, lineInfo.dividerSize, lineInfo.dividerSize, 'corner');
}

function createHorizontalCell(row, col, x, y, lineInfo) {
  return createCell(
      row, col, x, y, lineInfo.cellSize, lineInfo.dividerSize, 'horizontal');
}

function createVerticalCell(row, col, x, y, lineInfo) {
  return createCell(
      row, col, x, y, lineInfo.dividerSize, lineInfo.cellSize, 'vertical');
}

function createPrimaryCell(row, col, x, y, lineInfo) {
  return createCell(
      row, col, x, y, lineInfo.cellSize, lineInfo.cellSize, 'primary');
}

function createCell(row, col, x, y, width, height, role) {
  return {row, col, x, y, width, height, role};
}

function calcCellStats(image, mat, cellInfo) {
  cellInfo.cells.forEach(cell => {
    if (cell.x < 0 || cell.y < 0 ||
        cell.x + cell.width > mat.cols || cell.y + cell.height > mat.rows) {
      cell.meanColor = null;
      return;
    }
    const cellMat =
        mat.roi(new cv.Rect(cell.x, cell.y, cell.width, cell.height));
    cell.meanColor = cv.mean(cellMat);

//    const srcVec = new cv.MatVector();
//    srcVec.push_back(cellMat);
//    const channels = [0, 1, 2];
//    const histSize = [10, 10, 10];
//    const ranges = [0, 255, 0, 255, 0, 255];
//    const hist = new cv.Mat();
//    const mask = new cv.Mat();
//    cv.calcHist(srcVec, channels, mask, hist, histSize, ranges);
//    srcVec.delete();
//    mask.delete();
//    hist.delete();
    cellMat.delete();
  });
  // Preview average colors
  const colored = cv.Mat.zeros(mat.rows, mat.cols, cv.CV_8UC3);
  cellInfo.cells.forEach(cell => {
    if (!cell.meanColor) return;
    cv.rectangle(colored,
        new cv.Point(cell.x, cell.y),
        new cv.Point(cell.x + cell.width, cell.y + cell.height),
        cell.meanColor, cv.FILLED);
  });
  cv.imshow(createStackCanvas(image), colored);
  colored.delete();
}
*/

window.onload = () => {
  start();
};
