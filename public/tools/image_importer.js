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
}];

function createElement(parent, tag, className, focusable) {
  const element = document.createElement(tag);
  element.className = className;
  parent.appendChild(element);
  return element;
}

function start() {
  const parent = document.getElementById('stackContainer');
  // createImageStack(parent, images[0]);
  images.forEach(image => {
    createImageStack(parent, image);
  });
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
  showLines(image, src, lineInfo);
  mat.delete();
  src.delete();
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
  const lines = [];
  for (let i = 0; i < cvLines.rows; ++i) {
    const rho = cvLines.data32F[i * 2];
    if (rho < 0) console.log(rho);
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
  console.log(sortedDiffs);
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
    console.log(sortedOffsets);
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

window.onload = () => {
  start();
};

function loadFromDisk(id) {
  return new Promise((resolve, reject) => {
    currId = id;
    const img = document.createElement('img');
    img.onload = () => {
      const canvas = document.getElementById('step2preview');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve();
    };
    img.src = images[id].src;
    grid = images[id].grid;
  });
}

let cells = [];

function setCells() {
  cells = [];
  for (let y = 0; y < grid.rows; y++) {
    addBoundaryRow(y);
    addCellRow(y);
  }
  addBoundaryRow(grid.rows);
}

function addBoundaryRow(row) {
  for (let x = 0; x < grid.columns; x++) {
    addCornerCell(x, row);
    addHorizontalCell(x, row);
  }
  addCornerCell(grid.columns, row);
}

function addCellRow(row) {
  for (let x = 0; x < grid.columns; x++) {
    addVerticalCell(x, row);
    addPrimaryCell(x, row);
  }
  addVerticalCell(grid.columns, row);
}

function addPrimaryCell(column, row) {
  addCell(column, row, grid.boundarySize, grid.boundarySize,
      grid.cellSize, grid.cellSize);
}

function addCornerCell(column, row) {
  addCell(column, row, 0, 0, grid.boundarySize, grid.boundarySize);
}

function addHorizontalCell(column, row) {
  addCell(column, row, grid.boundarySize, 0, grid.cellSize, grid.boundarySize);
}

function addVerticalCell(column, row) {
  addCell(column, row, 0, grid.boundarySize, grid.boundarySize, grid.cellSize);
}

function addCell(column, row, offsetLeft, offsetTop, width, height) {
  cells.push({
    offsetLeft: grid.offsetLeft +
        column * (grid.cellSize + grid.boundarySize) + offsetLeft,
    offsetTop: grid.offsetTop +
        row * (grid.cellSize + grid.boundarySize) + offsetTop,
    width,
    height,
  });
}

function drawGrid() {
  const ctx = document.getElementById('step2preview').getContext('2d');
  ctx.lineWidth = 0.5;
  ctx.strokeStyle = 'red';
  cells.forEach(cell => {
    ctx.strokeRect(cell.offsetLeft, cell.offsetTop, cell.width, cell.height);
  });
}

async function calcData() {
  await loadFromDisk(currId);
  const ctx = document.getElementById('step2preview').getContext('2d');
  cells.forEach(cell => {
    const data = ctx.getImageData(
        cell.offsetLeft, cell.offsetTop, cell.width, cell.height).data;
    let avgColor = [0, 0, 0];
    for (i = 0; i < data.length - 4; i += 4) {
      avgColor[0] += data[i];
      avgColor[1] += data[i + 1];
      avgColor[2] += data[i + 2];
    }
    avgColor = [
      avgColor[0] / (data.length / 4),
      avgColor[1] / (data.length / 4),
      avgColor[2] / (data.length / 4),
    ];
    //    console.log(`Cell average color is rgb(${
    //      avgColor[0]}, ${avgColor[1]}, ${avgColor[2]}).`);
    cell.avgColor = {r: avgColor[0], g: avgColor[1], b: avgColor[2]};
  });
}

function colorGrid() {
  const ctx = document.getElementById('step2preview').getContext('2d');
  cells.forEach(cell => {
    ctx.fillStyle =
        `rgb(${cell.avgColor.r},${cell.avgColor.g},${cell.avgColor.b})`;
    ctx.fillRect(cell.offsetLeft, cell.offsetTop, cell.width, cell.height);
  });
}

function clusterColors() {
  const colors =
      cells.map(cell => [cell.avgColor.r, cell.avgColor.g, cell.avgColor.b]);
  const clusters = clusterfck.hcluster(colors, clusterfck.MANHATTAN_DISTANCE,
      clusterfck.AVERAGE_LINKAGE);
  document.getElementById('clusters').textContent =
      JSON.stringify(clusters, null, 2);
}
