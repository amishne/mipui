class Griddler {
  constructor(image) {
    this.image_ = image;
  }

  calculateLineInfo() {
    const src = this.image_.mat;
    const greyscale = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
    cv.cvtColor(this.image_.mat, greyscale, cv.COLOR_RGBA2GRAY, 0);
    this.image_.greyscale = greyscale;
    const mat = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
    //this.image_.appendMatCanvas(greyscale);
    cv.Canny(greyscale, mat, 100, 300, 3, false);
    //this.image_.appendMatCanvas(mat);
    const lines = this.houghTransform_(mat);
    this.image_.appendMatCanvas(mat);
    const lineInfo = this.calcLineInfo_(lines, mat);
    console.log(lineInfo);
    const withLines = this.image_.mat.clone();
    // this.expandLineInfo_(lineInfo);
    this.drawLines_(withLines, lineInfo);
    mat.delete();
    withLines.delete();
    return lineInfo;
  }

  houghTransform_(mat) {
    // Get a measure of image "density", to control hough transform threshold.
    const density = cv.countNonZero(mat) / (mat.cols * mat.rows);
    const divisionFactor = 0.34 / density;
    //const divisionFactor = 0.3 / density;

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
    const mapSize = dir == 'horizontal' ? mat.cols : mat.rows;
    let threshold = mapSize / divisionFactor;
    let lines = [];
    const minLineCount = 30;
    const maxLineCount = mapSize / 20;
    let numIterations = 0;
    while (lines.length < minLineCount || lines.length > maxLineCount) {
      const cvLines = new cv.Mat();
      cv.HoughLines(mat, cvLines, 1, Math.PI / 2, threshold, 0, 0, 0, Math.PI);
      lines = this.getLinesFromHoughTransformResult_(cvLines, dir);
      cvLines.delete();
      threshold *= lines.length < minLineCount ? 0.8 : 1.2;
      if (threshold < 50 || threshold > 1000) break;
      numIterations++;
      if (numIterations > 10) break;
    }
    lines.sort((line1, line2) => line1.rho - line2.rho);
    return lines;
  }

  getLinesFromHoughTransformResult_(cvLines, dir) {
    const lines = [];
    for (let i = 0; i < cvLines.rows; ++i) {
      const rho = cvLines.data32F[i * 2];
      const theta = cvLines.data32F[i * 2 + 1];
      if ((dir == 'horizontal' && theta > 1) ||
          (dir == 'vertical' && theta < 1)) {
        lines.push({rho, theta, dir});
      }
    }
    return lines;
  }

  calcLineInfo_(lines, mat) {
    const buckets = [{
      dir: 'horizontal',
      lines: lines.filter(line => line.dir == 'horizontal'),
    }, {
      dir: 'vertical',
      lines: lines.filter(line => line.dir == 'vertical'),
    }];
    const diffMap = new Map();
    // Collect diffs for each bucket.
    buckets.forEach(bucket => {
      for (let i = 2; i < bucket.lines.length; i++) {
        const line = bucket.lines[i];
        const diff1 = line.rho - bucket.lines[i - 1].rho;
        const diff2 = line.rho - bucket.lines[i - 2].rho;
        const diff3 = diff1 - 0.5;
        const diff4 = diff1 + 0.5;
        [diff1, diff2, diff3, diff4].forEach(diff => {
          if (!diffMap.has(diff)) {
            diffMap.set(diff, {
              size: diff,
              allLines: {
                horizontal: {
                  lines: [],
                  weight: 0,
                },
                vertical: {
                  lines: [],
                  weight: 0,
                },
              },
            });
          }
        });
        diffMap.get(diff1).allLines[bucket.dir].weight += 1;
        diffMap.get(diff1).allLines[bucket.dir].lines.push(line);
        diffMap.get(diff2).allLines[bucket.dir].weight -= 0.25;
        diffMap.get(diff2).allLines[bucket.dir].lines.push(line);
        diffMap.get(diff3).allLines[bucket.dir].weight += 0.55;
        diffMap.get(diff3).allLines[bucket.dir].lines.push(line);
        diffMap.get(diff4).allLines[bucket.dir].weight += 0.55;
        diffMap.get(diff4).allLines[bucket.dir].lines.push(line);
      }
    });
    // Assign count to each diff.
    for (const diff of diffMap.values()) {
      diff.normalizedWeight =
        diff.allLines.horizontal.weight / buckets[0].lines.length +
        diff.allLines.vertical.weight / buckets[1].lines.length;
    };
    // Aggregate diffs to find the most common ones to act as grid size.
    const sortedDiffs = Array.from(diffMap.values())
        .sort((diff1, diff2) =>
          diff2.normalizedWeight - diff1.normalizedWeight);

    console.log(sortedDiffs);

    const minCellSize = Math.max(Math.max(mat.rows, mat.cols) / 150, 8);
    console.log(`width: ${mat.cols}, height: ${mat.rows}, minCellSize: ${minCellSize}`);
    const first = sortedDiffs[0] || {size: 1};
    const second = sortedDiffs.slice(1)
        .find(diff => first.size >= minCellSize || diff.size >= minCellSize) ||
        {size: Math.max(mat.cols, mat.rows) / 40};
    const cellSize = Math.max(first.size, second.size);
    const dividerSize = Math.min(first.size, second.size);
    const gridSize = cellSize + dividerSize;

    // Identify most common offset for each bucket.
    buckets.forEach(bucket => {
      const offsets = new Map();
      const cellDiff = diffMap.get(cellSize);
      if (!cellDiff) {
        bucket.offset = 0;
        return;
      }
      cellDiff.allLines[bucket.dir].lines.forEach(line => {
        let offset = line.rho % gridSize;
        if (offset < 0) offset += gridSize;
        if (!offsets.has(offset)) {
          offsets.set(offset, {
            size: offset,
            count: 0,
          });
        }
        offsets.get(offset).count++;
      });
      const sortedOffsets = Array.from(offsets.values())
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
    const gridSize = lineInfo.cellSize + lineInfo.dividerSize;
    if (lineInfo.offsetLeft < 0) lineInfo.offsetLeft += gridSize;
    if (lineInfo.offsetTop < 0) lineInfo.offsetTop += gridSize;
  }
}
