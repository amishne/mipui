class CellInfo {
  constructor(image, lineInfo) {
    this.image_ = image;
    this.lineInfo_ = lineInfo;

    this.cellList = [];
    this.width = -1;
    this.height = -1;
  }

  initialize() {
    const lineInfo = this.lineInfo_;
    const mat = this.image_.mat;
    const cells = [];
    const cellAndTwoDividers = lineInfo.dividerSize * 2 + lineInfo.cellSize;
    let x = null;
    let y = lineInfo.offsetTop;
    let row = -0.5;
    let col = null;
    while (y < mat.rows - cellAndTwoDividers) {
      x = lineInfo.offsetLeft;
      col = -0.5;
      // Boundary row
      while (x < mat.cols - cellAndTwoDividers) {
        cells.push(this.createCornerCell_(row, col, x, y, lineInfo));
        x += lineInfo.dividerSize;
        col += 0.5;
        cells.push(this.createHorizontalCell_(row, col, x, y, lineInfo));
        x += lineInfo.cellSize;
        col += 0.5;
      }
      cells.push(this.createCornerCell_(row, col, x, y, lineInfo));
      // Primary row
      x = lineInfo.offsetLeft;
      col = -0.5;
      y += lineInfo.dividerSize;
      row += 0.5;
      while (x < mat.cols - cellAndTwoDividers) {
        cells.push(this.createVerticalCell_(row, col, x, y, lineInfo));
        x += lineInfo.dividerSize;
        col += 0.5;
        cells.push(this.createPrimaryCell_(row, col, x, y, lineInfo));
        x += lineInfo.cellSize;
        col += 0.5;
      }
      cells.push(this.createVerticalCell_(row, col, x, y, lineInfo));
      row += 0.5;
      y += lineInfo.cellSize;
    }
    // Final boundary row
    x = lineInfo.offsetLeft;
    col = -0.5;
    while (x < mat.cols - cellAndTwoDividers) {
      cells.push(this.createCornerCell_(row, col, x, y, lineInfo));
      x += lineInfo.dividerSize;
      col += 0.5;
      cells.push(this.createHorizontalCell_(row, col, x, y, lineInfo));
      x += lineInfo.cellSize;
      col += 0.5;
    }
    cells.push(this.createCornerCell_(row, col, x, y, lineInfo));
    this.cellList = cells;
    this.width = col;
    this.height = row;
    this.calcCellStats_();
  }

  getCell(col, row) {
    if (col < -0.5 || col > this.width || row < -0.5 || row > this.height) {
      return null;
    }
    const x = (col + 0.5) * 2;
    const y = (row + 0.5) * 2;
    const elementsPerRow = (this.width + 1) * 2;
    return this.cellList[x + y * elementsPerRow];
  }

  createCornerCell_(row, col, x, y, lineInfo) {
    return this.createCell_(
        row, col, x, y, lineInfo.dividerSize, lineInfo.dividerSize, 'corner');
  }

  createHorizontalCell_(row, col, x, y, lineInfo) {
    return this.createCell_(
        row, col, x, y, lineInfo.cellSize, lineInfo.dividerSize, 'horizontal');
  }

  createVerticalCell_(row, col, x, y, lineInfo) {
    return this.createCell_(
        row, col, x, y, lineInfo.dividerSize, lineInfo.cellSize, 'vertical');
  }

  createPrimaryCell_(row, col, x, y, lineInfo) {
    return this.createCell_(
        row, col, x, y, lineInfo.cellSize, lineInfo.cellSize, 'primary');
  }

  createCell_(row, col, x, y, width, height, role) {
    return {row, col, x, y, width, height, role};
  }

  calcCellStats_() {
    let greyscale = this.image_.greyscale;
    if (!greyscale) {
      greyscale =
          cv.Mat.zeros(this.image_.mat.rows, this.image_.mat.cols, cv.CV_8UC3);
      cv.cvtColor(this.image_.mat, greyscale, cv.COLOR_RGBA2GRAY, 0);
    }
    this.cellList.forEach(cell => {
      const cellMat = this.image_.mat.roi(
          new cv.Rect(cell.x, cell.y, cell.width, cell.height));
      const centerWidth = Math.ceil(cell.width / 10);
      const centerHeight = Math.ceil(cell.height / 10);
      const centerMat = cellMat.roi(
          new cv.Rect(
              (cell.width - centerWidth) / 2,
              (cell.height - centerHeight) / 2,
              centerWidth, centerHeight));
      cell.meanColor = cv.mean(cellMat);
      const meanColor = new cv.Mat();
      const meanStdDev = new cv.Mat();
      cv.meanStdDev(cellMat, meanColor, meanStdDev);
      cell.meanColor = Array.from(meanColor.data64F);
      cell.variance = Array.from(meanStdDev.data64F);
      meanColor.delete();
      meanStdDev.delete();
      const greyscaleCellMat = greyscale.roi(
          new cv.Rect(cell.x, cell.y, cell.width, cell.height));
      const minMax = cv.minMaxLoc(greyscaleCellMat);
      cell.minIntensity = minMax.minVal;
      cell.maxIntensity = minMax.maxVal;
      cell.centerColor = cv.mean(centerMat);
      cellMat.delete();
      greyscaleCellMat.delete();
      centerMat.delete();
    });
    // Preview average colors
    const colored =
        cv.Mat.zeros(this.image_.mat.rows, this.image_.mat.cols, cv.CV_8UC3);
    this.cellList.forEach(cell => {
      cv.rectangle(colored,
          new cv.Point(cell.x, cell.y),
          new cv.Point(cell.x + cell.width, cell.y + cell.height),
          cell.meanColor, cv.FILLED);
    });
    this.image_.appendMatCanvas(colored);
    colored.delete();
//    // Preview variance
//    const varianced =
//        cv.Mat.zeros(this.image_.mat.rows, this.image_.mat.cols, cv.CV_8UC3);
//    this.cellList.forEach(cell => {
//      cv.rectangle(varianced,
//          new cv.Point(cell.x, cell.y),
//          new cv.Point(cell.x + cell.width, cell.y + cell.height),
//          cell.variance, cv.FILLED);
//    });
//    this.image_.appendMatCanvas(varianced);
//    varianced.delete();
//    // Preview intensity
//    const intensity =
//        cv.Mat.zeros(this.image_.mat.rows, this.image_.mat.cols, cv.CV_8UC3);
//    this.cellList.forEach(cell => {
//      const delta = cell.maxIntensity - cell.minIntensity;
//      cv.rectangle(intensity,
//          new cv.Point(cell.x, cell.y),
//          new cv.Point(cell.x + cell.width, cell.y + cell.height),
//          [delta, delta, delta, 255], cv.FILLED);
//    });
//    this.image_.appendMatCanvas(intensity);
//    intensity.delete();
    // Preview center color
    const centered =
        cv.Mat.zeros(this.image_.mat.rows, this.image_.mat.cols, cv.CV_8UC3);
    this.cellList.forEach(cell => {
      cv.rectangle(centered,
          new cv.Point(cell.x, cell.y),
          new cv.Point(cell.x + cell.width, cell.y + cell.height),
          cell.centerColor, cv.FILLED);
    });
    this.image_.appendMatCanvas(centered);
    centered.delete();
  }
}
