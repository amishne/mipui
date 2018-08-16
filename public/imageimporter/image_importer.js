const images = [{
  src: 'dungeon-map.jpg',
  name: 'dungeon',
  grid: {
    columns: 32,
    rows: 32,
    cellSize: 14,
    offsetLeft: -3,
    offsetTop: -3,
    boundarySize: 6,
  },
}, {
  src: 'blue_map.png',
  name: 'blue',
  grid: {
    columns: 32,
    rows: 32,
    cellSize: 55,
    offsetLeft: -10,
    offsetTop: -10,
    boundarySize: 20,
  },
}, {
  src: 'brown_map.png',
  name: 'brown',
  grid: {
    columns: 60,
    rows: 60,
    cellSize: 22,
    offsetLeft: 8,
    offsetTop: -5,
    boundarySize: 10,
  },
}, {
  src: 'bw_map.jpg',
  name: 'bw',
  grid: {
    columns: 41,
    rows: 34,
    cellSize: 19,
    offsetLeft: -3,
    offsetTop: 1,
    boundarySize: 6,
  },
}, {
  src: 'donjon_map.png',
  name: 'donjon',
  grid: {
    columns: 60,
    rows: 60,
    cellSize: 10,
    offsetLeft: -2,
    offsetTop: -2,
    boundarySize: 4,
  },
}, {
  src: 'dyson_map1.png',
  name: 'dyson',
  grid: {
    columns: 20,
    rows: 35,
    cellSize: 22,
    offsetLeft: 1,
    offsetTop: 8,
    boundarySize: 8,
  },
}, {
  src: 'embossed_map.jpg',
  name: 'embossed',
  grid: {
    columns: 43,
    rows: 30,
    cellSize: 16,
    offsetLeft: 12,
    offsetTop: -2,
    boundarySize: 4,
  },
}, {
  src: 'hand_drawn_map.jpg',
  name: 'hand',
  grid: {},
}];

function createElement(parent, tag, className, focusable) {
  const element = document.createElement(tag);
  element.className = className;
  parent.appendChild(element);
  return element;
}

function start() {
  const parent = document.getElementById('stackContainer');
  createImageStack(parent, images[0]);
//  images.forEach(image => {
//    createImageStack(parent, image);
//  });
}

function createImageStack(parent, image) {
  const stackElement = createElement(parent, 'div', 'image-stack');
  image.stackElement = stackElement;
  const imageElement = createElement(stackElement, 'img', 'source-image');
  image.sourceImage = imageElement;
  imageElement.onload = () => { processImage(image); };
  imageElement.src = image.src;
}

function processImage(image) {
  const canvas = initializeImageCanvas(image);
  const src = cv.imread(canvas);
  const mat = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
  cv.cvtColor(src, mat, cv.COLOR_RGBA2GRAY, 0);
  cv.imshow(createStackCanvas(image), mat);
  console.log(image.name);
  cv.Canny(mat, mat, 100, 300, 3, false);
  cv.imshow(createStackCanvas(image), mat);
  const lines = houghTransform(image, mat);
  cv.imshow(createStackCanvas(image), mat);
  const lineInfo = getLineInfo(image, lines);
  console.log(lineInfo);
  const withLines = src.clone();
  // Temp fix while color clustering
  if (image.name == 'donjon') {
    lineInfo.cellSize -= 2;
    lineInfo.offsetLeft -= 1;
    lineInfo.offsetTop += 1;
  } else if (image.name == 'hand') {
    lineInfo.cellSize -= 0.25;
    lineInfo.offsetLeft += 7;
    lineInfo.offsetTop -= 2;
  }
  expandLineInfo(lineInfo);
  showLines(image, withLines, lineInfo);
  withLines.delete();
  assign(image, src, lineInfo);
  mat.delete();
  src.delete();
}

function expandLineInfo(lineInfo) {
  if (lineInfo.dividerSize > lineInfo.cellSize / 4) return;
  const expandDividerBy = lineInfo.dividerSize;
  const before = Math.floor(expandDividerBy / 2);
  lineInfo.dividerSize += expandDividerBy;
  lineInfo.cellSize -= expandDividerBy;
  lineInfo.offsetLeft -= before;
  lineInfo.offsetTop -= before;
}

function initializeImageCanvas(image) {
  const canvas = createStackCanvas(image);
  canvas.width = image.sourceImage.naturalWidth;
  canvas.height = image.sourceImage.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image.sourceImage, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function createStackCanvas(image) {
  const element = createElement(image.stackElement, 'canvas', 'stack-canvas');
  element.onclick = () => {
    element.classList.toggle('focused');
  };
  return element;
}

function houghTransform(image, mat) {
  // Get a measure of image "density", to control hough transform threshold.
  const density = cv.countNonZero(mat) / (mat.cols * mat.rows);
  const divisionFactor = 0.34 / density;

  // We perform two transforms; one vertical and one horizontal. We do this
  // because the threshold depends on the size, and our map is not necessarily
  // square.
  const hLines = houghTransformOnDir(mat, 'horizontal', divisionFactor);
  const vLines = houghTransformOnDir(mat, 'vertical', divisionFactor);
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
  cv.imshow(createStackCanvas(image), dst);
  dst.delete();
  return lines;
}

function houghTransformOnDir(mat, dir, divisionFactor) {
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

function getLineInfo(image, lines) {
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

function showLines(image, mat, lineInfo) {
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
  cv.imshow(createStackCanvas(image), mat);
}

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

function clusterColors(image, mat, cellInfo) {
  // const unknownCells = cellInfo.cells.filter(cell => !cell.meanColor);
  const primaryCells =
      cellInfo.cells.filter(cell => cell.meanColor && cell.role == 'primary');
  const dividerCells =
      cellInfo.cells.filter(cell => cell.meanColor && cell.role != 'primary');
//  const verHorCells =
//      cellInfo.cells.filter(cell => cell.meanColor &&
//          (cell.role == 'vertical' || cell.role == 'horizontal'));
//  const cornerCells =
//      cellInfo.cells.filter(cell => cell.meanColor && cell.role == 'corner');
  const primaryClusters =
      new Ichuk(primaryCells, 'meanColor', 'primary_').getTopClusters(2);
  const dividerClusters =
      new Ichuk(dividerCells, 'meanColor', 'divider_').getTopClusters(3);
  primaryCells.forEach(cell => {
    cell.topCluster = primaryClusters.find(c => c.objects.includes(cell));
  });
  dividerCells.forEach(cell => {
    cell.topCluster = dividerClusters.find(c => c.objects.includes(cell));
  });
//  const verHorClusters =
//      new Ichuk(verHorCells, 'meanColor').getTopClusters(2);
//  const cornerClusters =
//      new Ichuk(cornerCells, 'meanColor').getTopClusters(2);
  const segmented = cv.Mat.zeros(mat.rows, mat.cols, cv.CV_8UC3);
  drawTopClusters(segmented, primaryClusters);
  drawTopClusters(segmented, dividerClusters);
//  drawTopClusters(segmented, verHorClusters);
//  drawTopClusters(segmented, cornerClusters);
  cv.imshow(createStackCanvas(image), segmented);
  segmented.delete();
  return {primaryClusters, dividerClusters};
}

function drawTopClusters(mat, clusters) {
  drawCluster(mat, clusters[0], [0, 0, 0, 255]);
  drawCluster(mat, clusters[1], [255, 255, 255, 255]);
  if (clusters.length > 2) {
    drawCluster(mat, clusters[2], [255, 0, 0, 255]);
  }
  if (clusters.length > 3) {
    drawCluster(mat, clusters[3], [0, 255, 0, 255]);
  }
  if (clusters.length > 4) {
    drawCluster(mat, clusters[4], [0, 0, 255, 255]);
  }
  if (clusters.length > 5) {
    drawCluster(mat, clusters[4], [0, 255, 255, 255]);
  }
}

function drawCluster(mat, cluster, color) {
  cluster.objects.forEach(cell => {
    cv.rectangle(mat,
        new cv.Point(cell.x, cell.y),
        new cv.Point(cell.x + cell.width, cell.y + cell.height),
        color, cv.FILLED);
  });
}

function assignClusters(image, mat, cellInfo, clusters) {
  applyHueristics(cellInfo, clusters);
  assignByHueristics(image, mat, cellInfo, clusters);
}

function applyHueristics(cellInfo, clusters) {
  // Search for statistically-significant behaviors and vote accordingly.

  // Cells are in general ^2 more likely to touch similar cells than dissimilar
  // cells.
  rule(cellInfo, data => ({
    satisfied: true,
    info: {
      center: data.target,
      neighbors: new Set([
        data.half.t, data.half.tr, data.half.r, data.half.br,
        data.half.b, data.half.bl, data.half.l, data.half.tl]),
    },
  }), ({center, neighbors}) => {
    if (!center.sameAs) center.sameAs = [];
    for (const neighbor of neighbors) {
      if (center !== neighbor) center.sameAs.push({cluster: neighbor});
    }
  });

  // When a primary cell is surrounded by 4 borders of a single cluster, it's
  // likely that the primary cell is the same assignment as the borders.
  rule(cellInfo, data => {
    const satisfied =
        data.role == 'primary' && data.half.t &&
        data.half.t === data.half.r &&
        data.half.r === data.half.b &&
        data.half.b === data.half.l;
    return {satisfied, info: {center: data.target, surroundedBy: data.half.t}};
  }, ({center, surroundedBy}) => {
    if (!center.sameAs) center.sameAs = [];
    center.sameAs.push({cluster: surroundedBy});
    center.sameAs.push({cluster: surroundedBy});
    center.sameAs.push({cluster: surroundedBy});
    center.sameAs.push({cluster: surroundedBy});
    center.sameAs.push({cluster: surroundedBy});
    center.sameAs.push({cluster: surroundedBy});
    center.sameAs.push({cluster: surroundedBy});
    center.sameAs.push({cluster: surroundedBy});
    center.sameAs.push({cluster: surroundedBy});
    center.sameAs.push({cluster: surroundedBy});
  });

  // When a primary cell is surrounded by 4 primaries of a single cluster but
  // that are different from it, it's unlikely to be floor.
  rule(cellInfo, data => {
    const satisfied =
        data.role == 'primary' && data.full.t && data.full.t !== data.target &&
        data.full.t === data.full.r &&
        data.full.r === data.full.b &&
        data.full.b === data.full.l;
    return {satisfied, info: {center: data.target}};
  }, ({center}) => {
    center.isFloor = (center.isFloor || 0) - 10;
  });

  // When a primary cell is surrounded by 4 primaries of the same cluster as
  // itself, they are likely to be floor.
  rule(cellInfo, data => {
    const satisfied =
        data.role == 'primary' && data.full.t &&
        data.full.t === data.full.r &&
        data.full.r === data.full.b &&
        data.full.b === data.full.l;
    return {satisfied, info: {center: data.target, surroundedBy: data.half.t}};
  }, ({center, surroundedBy}) => {
    if (!center.sameAs) center.sameAs = [];
    center.sameAs.push({cluster: surroundedBy});
    center.sameAs.push({cluster: surroundedBy});
    center.sameAs.push({cluster: surroundedBy});
    center.sameAs.push({cluster: surroundedBy});
    center.sameAs.push({cluster: surroundedBy});
  });

  // When a corner is surrounded by the same cluster for all dividers, they are
  // unlikely to be walls.
  rule(cellInfo, data => {
    const satisfied =
        data.role == 'corner' &&
        data.half.t && data.half.t === data.half.r &&
        data.half.t && data.half.r === data.half.b &&
        data.half.t && data.half.b === data.half.l;
    return {satisfied, info: {center: data.target, surroundedBy: data.half.t}};
  }, ({center, surroundedBy}) => {
    surroundedBy.isFloor = (surroundedBy.isFloor || 0) + 1;
  });

  // When a primary is cornered between two different clusters, it's likely to
  // be angular walls.
  rule(cellInfo, data => {
    if (data.role != 'primary') return {satisfied: false};
    const satisfied =
        data.full.t !== data.full.b && data.full.r !== data.full.l &&
        ((data.full.t === data.full.r && data.full.b === data.full.l) ||
        (data.full.t === data.full.l && data.full.b === data.full.r));
    return {satisfied, info: {center: data.target}};
  }, ({center}) => {
    center.isAngular = (center.isAngular || 0) + 1;
  });

  // A divider that doesn't share its cluster with its corners is unlikely to be
  // a wall.
  rule(cellInfo, data => {
    const satisfied =
        (data.role == 'horizontal' &&
        (data.target !== data.half.l || data.target !== data.half.r)) ||
        (data.role == 'vertical' &&
        (data.target !== data.half.t || data.target !== data.half.b));
    return {satisfied, info: {center: data.target}};
  }, ({center}) => {
    center.isWall = (center.isWall || 0) - 1;
  });

  // A divider that separates two different clusters is likely to be a wall.
  rule(cellInfo, data => {
    const satisfied =
        (data.role == 'horizontal' && data.half.t !== data.half.b) ||
        (data.role == 'vertical' && data.half.l !== data.half.r);
    return {satisfied, info: {center: data.target}};
  }, ({center}) => {
    center.isWall = (center.isWall || 0) + 1;
  });

  aggregateSameAs(clusters.primaryClusters);
  aggregateSameAs(clusters.dividerClusters);

  console.log(clusters);
}

function rule(cellInfo, condition, conclusion) {
  for (let y = -0.5; y < cellInfo.height; y += 0.5) {
    for (let x = -0.5; x < cellInfo.width; x += 0.5) {
      const targetCell = getCell(cellInfo, x, y);
      if (!targetCell || !targetCell.topCluster) continue;
      const data = {
        role: targetCell.role,
        target: targetCell.topCluster,
        full: {
          t: getCellCluster(cellInfo, x, y - 1),
          r: getCellCluster(cellInfo, x + 1, y),
          b: getCellCluster(cellInfo, x, y + 1),
          l: getCellCluster(cellInfo, x - 1, y),
          tr: getCellCluster(cellInfo, x + 1, y - 1),
          br: getCellCluster(cellInfo, x + 1, y + 1),
          bl: getCellCluster(cellInfo, x - 1, y + 1),
          tl: getCellCluster(cellInfo, x - 1, y - 1),
        },
        half: {
          t: getCellCluster(cellInfo, x, y - 0.5),
          r: getCellCluster(cellInfo, x + 0.5, y),
          b: getCellCluster(cellInfo, x, y + 0.5),
          l: getCellCluster(cellInfo, x - 0.5, y),
          tr: getCellCluster(cellInfo, x + 0.5, y - 0.5),
          br: getCellCluster(cellInfo, x + 0.5, y + 0.5),
          bl: getCellCluster(cellInfo, x - 0.5, y + 0.5),
          tl: getCellCluster(cellInfo, x - 1, y - 0.5),
        },
      };
      const {satisfied, info} = condition(data);
      if (satisfied) {
        conclusion(info);
      }
    }
  }
}

function getCell(cellInfo, x, y) {
  return cellInfo.cells.find(cell => cell.row == y && cell.col == x);
}

function getCellCluster(cellInfo, x, y) {
  const cell = getCell(cellInfo, x, y);
  if (!cell) return null;
  return cell.topCluster;
}

function aggregateSameAs(clusters) {
  const idsToClusters = new Map();
  clusters.forEach(cluster => {
    const counts = new Map();
    cluster.sameAs = cluster.sameAs || [];
    cluster.sameAs.forEach(sameAsCluster => {
      if (!idsToClusters.has(sameAsCluster.id)) {
        idsToClusters.set(sameAsCluster.id, sameAsCluster);
      }
      counts.set(sameAsCluster.id, (counts.get(sameAsCluster.id) || 0) + 1);
    });
    const aggregatedSameAs = [];
    for (const [key, value] of counts.entries()) {
      aggregatedSameAs.push({cluster: idsToClusters.get(key), count: value});
    }
    aggregatedSameAs.sort((x, y) => x.count - y.count);
    cluster.aggregatedSameAs = aggregatedSameAs;
  });
}

function assignByHueristics(image, mat, cellInfo, clusters) {
  clusters.dividerClusters.forEach(cluster => {
    cluster.isWallRatio = (cluster.isWall || 0) / cluster.size;
    cluster.isFloorRatio = (cluster.isFloor || 0) / cluster.size;
  });
  const dividerClusterWithHighestIsWallRatio =
      clusters.dividerClusters.reduce((c, m) =>
        c.isWallRatio > m.isWallRatio ? c : m, clusters.dividerClusters[0]);
  const dividerClusterWithHighestIsFloorRatio =
      clusters.dividerClusters.reduce((c, m) =>
        c.isFloorRatio > m.isFloorRatio ? c : m, clusters.dividerClusters[0]);

  const primaryWallClusters = [];
  const primaryFloorClusters = [];
  clusters.primaryClusters.forEach(cluster => {
    if (cluster.aggregatedSameAs.length > 0 &&
        cluster.aggregatedSameAs[0].cluster ===
        dividerClusterWithHighestIsWallRatio) {
      primaryWallClusters.push(cluster);
    }
    if (cluster.aggregatedSameAs.length > 0 &&
        cluster.aggregatedSameAs[0].cluster ===
        dividerClusterWithHighestIsFloorRatio) {
      primaryFloorClusters.push(cluster);
    }
  });
  clusters.primaryClusters.forEach(cluster => {
    if (cluster.aggregatedSameAs.length > 0 &&
        primaryWallClusters.length > 0 &&
        cluster !== primaryWallClusters[0] &&
        cluster.aggregatedSameAs[0].cluster === primaryWallClusters[0]) {
      primaryWallClusters.push(cluster);
    }
    if (cluster.aggregatedSameAs.length > 0 &&
        primaryFloorClusters.length > 0 &&
        cluster !== primaryFloorClusters[0] &&
        cluster.aggregatedSameAs[0].cluster === primaryFloorClusters[0]) {
      primaryFloorClusters.push(cluster);
    }
  });

  const segmented = cv.Mat.zeros(mat.rows, mat.cols, cv.CV_8UC3);
  drawCluster(
      segmented, dividerClusterWithHighestIsWallRatio, [200, 0, 0, 255]);
  drawCluster(
      segmented, dividerClusterWithHighestIsFloorRatio, [0, 0, 200, 255]);
  primaryWallClusters.forEach(c => {
    drawCluster(segmented, c, [100, 0, 0, 255]);
  });
  primaryFloorClusters.forEach(c => {
    drawCluster(segmented, c, [0, 0, 100, 255]);
  });
  cv.imshow(createStackCanvas(image), segmented);
  segmented.delete();
}

window.onload = () => {
  start();
};
