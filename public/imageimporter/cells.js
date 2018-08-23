class Cells {
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
    }
    cells.push(this.createCornerCell_(row, col, x, y, lineInfo));
    this.cellList = cells;
    this.width = col;
    this.height = row;
    this.calcCellStats_();
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
    this.cellList.forEach(cell => {
      const cellMat = this.image_.mat.roi(
          new cv.Rect(cell.x, cell.y, cell.width, cell.height));
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
  }
}
