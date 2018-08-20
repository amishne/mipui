class Griddler {
  constructor(image) {
    this.image_ = image;
  }

  calculateCellInfo() {
    const mat = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
    cv.cvtColor(this.image_.mat, mat, cv.COLOR_RGBA2GRAY, 0);
    this.image_.appendMatCanvas(mat);
    cv.Canny(mat, mat, 100, 300, 3, false);
    this.image_.appendMatCanvas(mat);
    const lines = this.houghTransform_(mat);
    this.image_.appendMatCanvas(mat);
    const lineInfo = this.calcLineInfo_(lines);
    console.log(lineInfo);
    const withLines = this.image_.mat.clone();
    this.drawLines_(withLines, lineInfo);
    withLines.delete();
    mat.delete();
    this.expandLineInfo_(lineInfo);
    return lineInfo;
  }

  houghTransform_(mat) {
    // Get a measure of image "density", to control hough transform threshold.
    const density = cv.countNonZero(mat) / (mat.cols * mat.rows);
    const divisionFactor = 0.34 / density;

    // We perform two transforms; one vertical and one horizontal. We do this
    // because the threshold depends on the size, and our map is not necessarily
    // square.
    const hLines = this.houghTransformOnDir_(mat, 'horizontal', divisionFactor);
    const vLines = this.houghTransformOnDir_(mat, 'vertical', divisionFactor);
    // Preview the lines.
    const dst = cv.Mat.zeros(mat.rows, mat.cols, cv.CV_8UC3);
    const lineLength = Math.max(mat.rows, mat.cols);
    const lines = hLines.concat(vLines);
    for (const line of lines) {
      const a = Math.cos(line.theta);
      const b = Math.sin(line.theta);
      const x0 = a * line.rho;
      const y0 = b * line.rho;
      const startPoint = {x: x0 - lineLength * b, y: y0 + lineLength * a};
      const endPoint = {x: x0 + lineLength * b, y: y0 - lineLength * a};
      cv.line(dst, startPoint, endPoint, [255, 0, 0, 255]);
      // Also preview on top of the base image!
      cv.line(mat, startPoint, endPoint, [255, 0, 0, 255]);
    }
    this.image_.appendMatCanvas(dst);
    dst.delete();
    return lines;
  }

  houghTransformOnDir_(mat, dir, divisionFactor) {
    const threshold =
        (dir == 'horizontal' ? mat.cols : mat.rows) / divisionFactor;
    const cvLines = new cv.Mat();
    cv.HoughLines(mat, cvLines, 1, Math.PI / 2, threshold, 0, 0, 0, Math.PI);
    const minNumOfLines = 20;
    if (cvLines.rows < minNumOfLines) {
      cv.HoughLines(
          mat, cvLines, 1, Math.PI / 2, threshold / 2, 0, 0, 0, Math.PI);
    }
    const lines = [];
    for (let i = 0; i < cvLines.rows; ++i) {
      const rho = cvLines.data32F[i * 2];
      const theta = cvLines.data32F[i * 2 + 1];
      if ((dir == 'horizontal' && theta > 1) ||
          (dir == 'vertical' && theta < 1)) {
        lines.push({rho, theta, dir});
      }
    }
    cvLines.delete();
    lines.sort((line1, line2) => line1.rho - line2.rho);
    return lines;
  }

  calcLineInfo_(lines) {
    const buckets = [{
      dir: 'horizontal',
      lines: lines.filter(line => line.dir == 'horizontal'),
    }, {
      dir: 'vertical',
      lines: lines.filter(line => line.dir == 'vertical'),
    }];
    const diffMap = {};
    // Collect diffs for each bucket.
    buckets.forEach(bucket => {
      for (let i = 1; i < bucket.lines.length; i++) {
        const line = bucket.lines[i];
        const diff = line.rho - bucket.lines[i - 1].rho;
        line.diff = diff;
        diffMap[diff] = {
          size: diff,
          count: (diffMap[diff] || {count: 0}).count + 1,
          lines: (diffMap[diff] || {lines: []}).lines.concat([line]),
        };
      }
    });
    // Aggregate diffs to find the most common ones to act as grid size.
    const sortedDiffs = Object.keys(diffMap).map(key => diffMap[key])
        .sort((diff1, diff2) => diff2.count - diff1.count);

    const first = sortedDiffs[0] || {size: 1};
    const second = sortedDiffs.slice(1)
        .find(diff => first.size > 5 || diff.size > 5) || {size: 10};
    const cellSize = Math.max(first.size, second.size);
    const dividerSize = Math.min(first.size, second.size);
    const gridSize = cellSize + dividerSize;
    // Identify most common offset for each bucket.
    buckets.forEach(bucket => {
      const offsets = {};
      (diffMap[cellSize] || {lines: []}).lines
          .filter(line => line.dir == bucket.dir).forEach(line => {
            const offset = line.rho % gridSize;
            offsets[offset] = {
              size: offset,
              count: (offsets[offset] || {count: 0}).count + 1,
            };
          });
      const sortedOffsets = Object.keys(offsets).map(key => offsets[key])
          .sort((offset1, offset2) => offset2.count - offset1.count);
      bucket.offset = sortedOffsets.length > 0 ? sortedOffsets[0].size : 0;
    });
    return {
      cellSize,
      dividerSize,
      offsetLeft: buckets[1].offset,
      offsetTop: buckets[0].offset,
    };
  }

  drawLines_(mat, lineInfo) {
    let x = Math.round(lineInfo.offsetLeft);
    while (x < mat.cols) {
      cv.line(mat, {x, y: 0}, {x, y: mat.rows}, [255, 0, 0, 255]);
      x += lineInfo.dividerSize;
      cv.line(mat, {x, y: 0}, {x, y: mat.rows}, [255, 0, 0, 255]);
      x += lineInfo.cellSize;
    }
    let y = Math.round(lineInfo.offsetTop);
    while (y < mat.rows) {
      cv.line(mat, {x: 0, y}, {x: mat.cols, y}, [255, 0, 0, 255]);
      y += lineInfo.dividerSize;
      cv.line(mat, {x: 0, y}, {x: mat.cols, y}, [255, 0, 0, 255]);
      y += lineInfo.cellSize;
    }
    this.image_.appendMatCanvas(mat);
  }

  expandLineInfo_(lineInfo) {
    if (lineInfo.dividerSize > lineInfo.cellSize / 4) return;
    const expandDividerBy = lineInfo.dividerSize;
    const before = Math.floor(expandDividerBy / 2);
    lineInfo.dividerSize += expandDividerBy;
    lineInfo.cellSize -= expandDividerBy;
    lineInfo.offsetLeft -= before;
    lineInfo.offsetTop -= before;
  }
}
