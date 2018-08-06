const images = {
  dungeon: {
    src: 'dungeon-map.jpg',
    grid: {
      columns: 32,
      rows: 32,
      cellSize: 14,
      offsetLeft: -3,
      offsetTop: -3,
      boundarySize: 6,
    },
  },
  blue: {
    src: 'blue_map.png',
    grid: {
      columns: 32,
      rows: 32,
      cellSize: 55,
      offsetLeft: -10,
      offsetTop: -10,
      boundarySize: 20,
    },
  },
  brown: {
    src: 'brown_map.png',
    grid: {
      columns: 60,
      rows: 60,
      cellSize: 22,
      offsetLeft: 8,
      offsetTop: -5,
      boundarySize: 10,
    },
  },
  bw: {
    src: 'bw_map.jpg',
    grid: {
      columns: 41,
      rows: 34,
      cellSize: 19,
      offsetLeft: -3,
      offsetTop: 1,
      boundarySize: 6,
    },
  },
  donjon: {
    src: 'donjon_map.png',
    grid: {
      columns: 60,
      rows: 60,
      cellSize: 10,
      offsetLeft: -2,
      offsetTop: -2,
      boundarySize: 4,
    },
  },
  dyson: {
    src: 'dyson_map1.png',
    grid: {
      columns: 20,
      rows: 35,
      cellSize: 22,
      offsetLeft: 1,
      offsetTop: 8,
      boundarySize: 8,
    },
  },
  embossed: {
    src: 'embossed_map.jpg',
    grid: {
      columns: 43,
      rows: 30,
      cellSize: 16,
      offsetLeft: 12,
      offsetTop: -2,
      boundarySize: 4,
    },
  },
};
let grid = {};
let currId = 0;

window.onload = () => {
  document.getElementById('image1')
      .addEventListener('click', () => { loadFromDisk('dungeon'); });
  document.getElementById('image2')
      .addEventListener('click', () => { loadFromDisk('blue'); });
  document.getElementById('image3')
      .addEventListener('click', () => { loadFromDisk('brown'); });
  document.getElementById('image4')
      .addEventListener('click', () => { loadFromDisk('bw'); });
  document.getElementById('image5')
      .addEventListener('click', () => { loadFromDisk('donjon'); });
  document.getElementById('image6')
      .addEventListener('click', () => { loadFromDisk('dyson'); });
  document.getElementById('image7')
      .addEventListener('click', () => { loadFromDisk('embossed'); });
  document.getElementById('drawGrid')
      .addEventListener('click', () => { setCells(); drawGrid(); });
  document.getElementById('calcData')
      .addEventListener('click', calcData);
  document.getElementById('colorGrid')
      .addEventListener('click', colorGrid);
  document.getElementById('clusterColors')
      .addEventListener('click', clusterColors);
  document.getElementById('times')
      .addEventListener('click', times);
  document.getElementById('myopencv')
      .addEventListener('click', myopencv);
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
//  const inputElement = document.createElement('input');
//  inputElement.type = 'file';
//  inputElement.accept = '.png';
//  inputElement.addEventListener('change', () => {
//    const files = inputElement.files;
//    if (files && files.length > 0) {
//      const fr = new FileReader();
//      fr.addEventListener('load', async() => {
//        const numOpsToUndo =
//            await this.applyDonjonFile_(inputElement.value, fr.result);
//        state.opCenter.recordOperationComplete();
//        for (let i = 0; i < numOpsToUndo; i++) {
//          state.opCenter.undo();
//        }
//        accept();
//      });
//      fr.readAsText(files[0]);
//    }
//  });
//  inputElement.click();
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

function times() {
  // TODOs
  // First do edge detection
  // Change theta bucketing 72, and only take those around cardinal directions
  // Change rho bucketing to Math.hypot(width, height)
  // Find gradient among values above threshold for local maximum
  const canvas = document.getElementById('step2preview');
  const ctx = canvas.getContext('2d');
  const tImage = new T.Image('uint8', canvas.width, canvas.height);
  tImage.setPixels(ctx.getImageData(0, 0, canvas.width, canvas.height).data);
  const tRaster = tImage.getRaster();
  const tRasterWithLines =
      cpu.houghLines(4, canvas.width * 50)(tRaster);
  const lines = {
    0: [],
    1: [],
    2: [],
    3: [],
  };
  for (let y = 0; y < tRasterWithLines.height; y++) {
    for (let x = 0; x < tRasterWithLines.width; x++) {
      const pixel = tRasterWithLines.getPixel(x, y);
      if (pixel > 100) {
        lines[x].push(y);
      }
    }
  }
  lines[0].sort();
  lines[1].sort();
  lines[2].sort();
  lines[3].sort();
  for (let i = 3; i < lines[0].length - 3; i++) {
    console.log(lines[0][i] - lines[0][i - 1]);
  }
}

function myopencv() {
  const src = cv.imread('step2preview');
  const dst = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
  const lines = new cv.Mat();
  //quantize colors here, maybe using cv.kmeans
  cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
  cv.Canny(src, src, 100, 300, 3, false);
  //cv.imshow('step2preview', src);
  //return;
  cv.HoughLines(src, lines, 1, Math.PI / 2, 180, 0, 0, 0, Math.PI);
  const lineLength = Math.max(src.rows, src.cols);
  for (let i = 0; i < lines.rows; ++i) {
    const rho = lines.data32F[i * 2];
    const theta = lines.data32F[i * 2 + 1];
    const a = Math.cos(theta);
    const b = Math.sin(theta);
    const x0 = a * rho;
    const y0 = b * rho;
    const startPoint = {x: x0 - lineLength * b, y: y0 + lineLength * a};
    const endPoint = {x: x0 + lineLength * b, y: y0 - lineLength * a};
    cv.line(dst, startPoint, endPoint, [255, 0, 0, 255]);
  }
  cv.imshow('step2preview', dst);
  const lineBuckets = {
    horizontalLines: [],
    verticalLines: [],
  };
  for (let i = 0; i < lines.rows; ++i) {
    const rho = lines.data32F[i * 2];
    const theta = lines.data32F[i * 2 + 1];
    const bucket = lineBuckets[theta < 1 ? 'horizontalLines' : 'verticalLines'];
    bucket.push(rho);
  }
  lineBuckets.horizontalLines.sort();
  lineBuckets.verticalLines.sort();
  const buckets = {
    horizontalLines: [],
    verticalLines: [],
  };
  let prevRho = 0;
  lineBuckets.horizontalLines.forEach(rho => {
    const diff = Math.abs(rho - prevRho);
    buckets.horizontalLines.push({diff, offset: rho % diff});
    prevRho = rho;
  });
  prevRho = 0;
  lineBuckets.verticalLines.forEach(rho => {
    const diff = Math.abs(rho - prevRho);
    buckets.verticalLines.push({diff, offset: rho % diff});
    prevRho = rho;
  });
  const diffs = {};
  const allLines = buckets.horizontalLines.concat(buckets.verticalLines);
  allLines.forEach(({diff, offset}) => {
    diffs[diff] = (diffs[diff] || 0) + 1;
  });
  console.log(diffs);
  let firstValue = 0;
  let firstMatch = 0;
  let secondValue = 0;
  let secondMatch = 0;
  Object.keys(diffs).forEach(key => {
    if (key > 5 && diffs[key] > firstValue) {
      firstValue = diffs[key];
      firstMatch = key;
    } else if (diffs[key] > secondValue) {
      secondValue = diffs[key];
      secondMatch = key;
    }
  });
  console.log(`${firstMatch}, ${secondMatch}`);
  let offsetSum = 0;
  let count = 0;
  buckets.horizontalLines.forEach(({diff, offset}) => {
    if (diff == firstMatch) {
      offsetSum += offset;
      count++;
    }
  });
  const offsetLeft = offsetSum / count;
  offsetSum = 0;
  count = 0;
  buckets.verticalLines.forEach(({diff, offset}) => {
    if (diff == firstMatch) {
      offsetSum += offset;
      count++;
    }
  });
  const offsetTop = offsetSum / count;
  console.log(`offset = ${offsetLeft}, ${offsetTop}`);
  src.delete(); dst.delete(); lines.delete();
}
