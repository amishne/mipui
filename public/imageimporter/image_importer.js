const mode = window.location.href.match(/^https?:\/\/(www\.)?mipui.net\/.*/) ?
  'prod' : 'dev';
let currentStep = -1;
let baseZoom = null;
let currentZoom = 1;
let loadedFile = null;
let sourceMat = null;
let sourceImage = null;
let lineInfo = null;
let cellInfo = null;
let assignments = null;
let gridCanvasScale = null;
let gridCanvasCtx = null;
let assignmentCanvasCtx = null;
let imagesRef = null;
let finalMapMid = null;
let finalMapSecret = null;

const steps = [{
  canStepForward: () => true,
  canStepBackward: () => false,
  onStepForwardIntoThis: () => {},
  reset: () => {},
}, {
  canStepForward: () => !!sourceImage,
  canStepBackward: () => true,
  onStepForwardIntoThis: () => {},
  reset: () => {
    document.getElementById('chooser-image-preview').innerHTML = '';
    sourceImage = null;
    sourceMat = null;
  },
}, {
  canStepForward: () => true,
  canStepBackward: () => true,
  onStepForwardIntoThis: () => { gridImage(); },
  reset: () => {
    document.getElementById('griddler-image-preview').innerHTML = '';
    const gridCanvas = document.getElementById('griddler-grid-canvas');
    if (gridCanvas) {
      gridCanvas.parentElement.removeChild(gridCanvas);
    }
    lineInfo = null;
  },
}, {
  canStepForward: () => !!assignments,
  canStepBackward: () => true,
  onStepForwardIntoThis: () => { assignCells(); },
  reset: () => {
    document.getElementById('assigner-map-preview').innerHTML = '';
    assignments = null;
  },
}, {
  canStepForward: () => false,
  canStepBackward: () => true,
  onStepForwardIntoThis: () => {
    const importButton =
        document.getElementById('importer-import-mipui-button');
    importButton.disabled = true;
    importButton.textContent = 'Loading...';
    document.getElementById('importer-smooth-walls').disabled = true;
    iframedMipui = document.getElementById('iframed-mipui');
    iframedMipui.src = '';
    iframedMipui.onload = () => {
      sendPStateToMipui();
    };
    iframedMipui.src = '../app/index.html?tc=no&noui=yes';
    finalMapMid = null;
    finalMapSecret = null;
    document.getElementById('importer-open-map-button').disabled = true;
  },
  reset: () => {},
}];

function stepForward() {
  const nextButton = document.getElementById('next-button');
  nextButton.disabled = true;
  nextButton.textContent = 'Processing';
  currentStep++;
  setTimeout(() => {
    steps[currentStep].onStepForwardIntoThis();
    nextButton.textContent = 'Next Step';
    updateStepHeaders();
  }, 0);
}

function stepBackward() {
  const prevButton = document.getElementById('prev-button');
  prevButton.disabled = true;
  currentStep--;
  updateStepHeaders();
}

function updateStepHeaders() {
  const step = steps[currentStep];
  const stepHeaders = document.getElementsByClassName('step-header');
  const stepBodies = document.getElementsByClassName('step');
  for (let i = 0; i < stepHeaders.length; i++) {
    const stepHeader = stepHeaders[i];
    stepHeader.classList.remove('active-step-header');
    stepHeader.classList.remove('inactive-step-header');
    stepHeader.classList.remove('completed-step-header');
    if (i < currentStep) {
      const prevStepIndex = i;
      stepHeader.classList.add('completed-step-header');
      stepHeader.onclick = () => {
        currentStep -= currentStep - prevStepIndex;
        updateStepHeaders();
      };
    } else if (i == currentStep) {
      stepHeader.classList.add('active-step-header');
      stepHeader.onclick = null;
    } else {
      stepHeader.classList.add('inactive-step-header');
      steps[i].reset();
      stepHeader.onclick = null;
    }
    const step = stepBodies[i];
    if (i == currentStep) {
      step.classList.add('active-step');
      step.classList.remove('inactive-step');
    } else {
      step.classList.remove('active-step');
      step.classList.add('inactive-step');
    }
  }
  document.getElementById('next-button').disabled = !step.canStepForward();
  document.getElementById('prev-button').disabled = !step.canStepBackward();
}

function image2mat(image) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    resolve(cv.imread(canvas));
  });
}

function uploadImage(file) {
  loadedFile = file;
  const image = document.createElement('img');
  image.src = window.URL.createObjectURL(file);
  const preview = document.getElementById('chooser-image-preview');
  document.getElementById('griddler-image-preview').innerHTML = '';
  previewElements(preview, image);
  image.onload = () => {
    sourceImage = image;
    baseZoom = Math.min(
        image.clientWidth / image.naturalWidth,
        image.clientHeight / image.naturalHeight);
    updateStepHeaders();
  };
}

function gridImage() {
  const image2matPromise = image2mat(sourceImage);
  image2matPromise.then(mat => {
    sourceMat = mat;
    lineInfo = new Griddler({
      mat: sourceMat,
      appendMatCanvas: () => {},
    }).calculateLineInfo();
    const primarySizeInput =
        document.getElementById('griddler-primary-size-input');
    const dividerSizeInput =
        document.getElementById('griddler-divider-size-input');
    const offsetLeftInput =
        document.getElementById('griddler-offset-left-input');
    const offsetTopInput = document.getElementById('griddler-offset-top-input');
    primarySizeInput.value = +lineInfo.cellSize.toFixed(3);
    dividerSizeInput.value = +lineInfo.dividerSize.toFixed(3);
    offsetLeftInput.value = +lineInfo.offsetLeft.toFixed(3);
    offsetTopInput.value = +lineInfo.offsetTop.toFixed(3);
    previewGridLines();
    [
      primarySizeInput,
      dividerSizeInput,
      offsetLeftInput,
      offsetTopInput,
    ].forEach(element => {
      element.oninput = () => {
        updateLineInfo();
        if (element == primarySizeInput && Number(primarySizeInput.value) < 4) {
          return;
        }
        previewGridLines();
      };
    });
  });
}

function updateLineInfo() {
  const primarySizeInput =
        document.getElementById('griddler-primary-size-input');
  const dividerSizeInput =
      document.getElementById('griddler-divider-size-input');
  const offsetLeftInput =
      document.getElementById('griddler-offset-left-input');
  const offsetTopInput = document.getElementById('griddler-offset-top-input');
  const oldDividerSize = lineInfo.dividerSize;
  const newDividerSize = Number(dividerSizeInput.value);
  if (oldDividerSize != newDividerSize) {
    const mod = Number(primarySizeInput.value) + newDividerSize;
    const offsetBy = (inputElement, half) => {
      let newInputElementValue = +((Number(inputElement.value) -
          (newDividerSize - oldDividerSize) / (half ? 2 : 1)) % mod);
      if (newInputElementValue < 0) newInputElementValue += mod;
      inputElement.value = newInputElementValue.toFixed(3);
    };
    offsetBy(primarySizeInput);
    offsetBy(offsetLeftInput, true);
    offsetBy(offsetTopInput, true);
  }
  lineInfo.cellSize = Number(primarySizeInput.value);
  lineInfo.dividerSize = newDividerSize;
  lineInfo.offsetLeft = Number(offsetLeftInput.value);
  lineInfo.offsetTop = Number(offsetTopInput.value);
}

function createGridCanvas(previewCanvas, scale) {
  const gridCanvas = document.createElement('canvas');
  gridCanvas.id = 'griddler-grid-canvas';
  gridCanvas.className = 'previewed';
  gridCanvas.style.transform = `scale(${currentZoom})`;
  gridCanvas.width = scale * previewCanvas.width;
  gridCanvas.height = scale * previewCanvas.height;
  gridCanvas.style.width = previewCanvas.clientWidth;
  gridCanvas.style.height = previewCanvas.clientHeight;
  gridCanvas.onmousedown = mouseDownEvent => {
    if (document.getElementById('grid-drag-moves').checked) {
      startDraggingGrid(gridCanvas, mouseDownEvent);
    } else {
      startRedrawingGrid(gridCanvas, mouseDownEvent);
    }
  };
  gridCanvas.onmouseenter = () => {
    if (document.getElementById('grid-drag-moves').checked) {
      gridCanvas.style.cursor = 'move';
    } else {
      gridCanvas.style.cursor = 'crosshair';
    }
  };
  return gridCanvas;
}

function startDraggingGrid(gridCanvas, mouseDownEvent) {
  const primarySizeInput =
      document.getElementById('griddler-primary-size-input');
  const dividerSizeInput =
      document.getElementById('griddler-divider-size-input');
  const offsetLeftInput = document.getElementById('griddler-offset-left-input');
  const offsetTopInput = document.getElementById('griddler-offset-top-input');
  const mod = Number(primarySizeInput.value) + Number(dividerSizeInput.value);
  const startX = mouseDownEvent.clientX;
  const startY = mouseDownEvent.clientY;
  const initialOffsetLeftInput = Number(offsetLeftInput.value);
  const initialOffsetTopInput = Number(offsetTopInput.value);
  const effectiveZoom = currentZoom * baseZoom;
  gridCanvas.onmouseup = mouseUpEvent => {
    gridCanvas.onmousemove = null;
    gridCanvas.onmouseup = null;
    mouseUpEvent.stopPropagation();
    return true;
  };
  gridCanvas.onmousemove = mouseMoveEvent => {
    const logicalDistanceX =
        round((mouseMoveEvent.clientX - startX) / effectiveZoom, effectiveZoom);
    const logicalDistanceY =
        round((mouseMoveEvent.clientY - startY) / effectiveZoom, effectiveZoom);
    let offsetLeftInputValue =
        (initialOffsetLeftInput + logicalDistanceX) % mod;
    if (offsetLeftInputValue < 0) offsetLeftInputValue += mod;
    offsetLeftInput.value = offsetLeftInputValue.toFixed(3);
    let offsetTopInputValue = (initialOffsetTopInput + logicalDistanceY) % mod;
    if (offsetTopInputValue < 0) offsetTopInputValue += mod;
    offsetTopInput.value = offsetTopInputValue.toFixed(3);
    updateLineInfo();
    previewGridLines();
    mouseMoveEvent.stopPropagation();
    return true;
  };
  mouseDownEvent.stopPropagation();
  return true;
}

function getMouseCoords(preview, mouseEvent) {
  const factor = currentZoom * baseZoom;
  const clientRect = preview.getClientRects()[0];
  return {
    x: -1 + (preview.scrollLeft + mouseEvent.clientX - clientRect.x) / factor,
    y: -1 + (preview.scrollTop + mouseEvent.clientY - clientRect.y) / factor,
  };
}

function startRedrawingGrid(gridCanvas, mouseDownEvent) {
  const primarySizeInput =
      document.getElementById('griddler-primary-size-input');
  const dividerSizeInput =
      document.getElementById('griddler-divider-size-input');
  const offsetLeftInput = document.getElementById('griddler-offset-left-input');
  const offsetTopInput = document.getElementById('griddler-offset-top-input');
  const preview = document.getElementById('griddler-image-preview');
  const initialMouse = getMouseCoords(preview, mouseDownEvent);
  gridCanvas.onmouseup = mouseUpEvent => {
    previewGridLines();
    gridCanvas.onmousemove = null;
    gridCanvas.onmouseup = null;
    mouseUpEvent.stopPropagation();
    return true;
  };
  gridCanvas.onmousemove = mouseMoveEvent => {
    const currentMouse = getMouseCoords(preview, mouseMoveEvent);
    const maxDistance =
        Math.max(Math.abs(currentMouse.x - initialMouse.x),
            Math.abs(currentMouse.y - initialMouse.y));
    let primarySizeInputValue = maxDistance;
    if (primarySizeInputValue < 5) return true;
    const dividerSizeInputValue = primarySizeInputValue / 6;
    primarySizeInputValue -= dividerSizeInputValue;
    primarySizeInput.value = primarySizeInputValue.toFixed(3);
    dividerSizeInput.value = dividerSizeInputValue.toFixed(3);
    const mod = primarySizeInputValue + dividerSizeInputValue;
    offsetLeftInput.value =
        ((mod + initialMouse.x - (dividerSizeInputValue / 2)) % mod).toFixed(3);
    offsetTopInput.value =
        ((mod + initialMouse.y - (dividerSizeInputValue / 2)) % mod).toFixed(3);
    updateLineInfo();
    previewBox(initialMouse, currentMouse);
    mouseMoveEvent.stopPropagation();
    return true;
  };
  mouseDownEvent.stopPropagation();
  return true;
}

function round(n, m) {
  return Number(n.toFixed(Math.max(0, Math.ceil(Math.log2(m)))));
}

function previewBox(from, to) {
  const factor = gridCanvasScale;
  const gridCanvas = document.getElementById('griddler-grid-canvas');
  gridCanvasCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
  gridCanvasCtx.beginPath();
  gridCanvasCtx.strokeStyle = 'red';
  gridCanvasCtx.lineWidth =
      Math.ceil(gridCanvasScale / (currentZoom * baseZoom));
  const length =
      Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y)) * factor;
  gridCanvasCtx.strokeRect(from.x * factor, from.y * factor,
      Math.sign(to.x - from.x) * length, Math.sign(to.y - from.y) * length);
}

function previewGridLines() {
  const previewPanel = document.getElementById('griddler-image-preview');
  let previewCanvas = document.getElementById('griddler-preview-canvas');
  if (!previewCanvas) {
    previewCanvas = document.createElement('canvas');
    previewCanvas.id = 'griddler-preview-canvas';
    previewCanvas.className = 'previewed';
    previewCanvas.style.transform = `scale(${currentZoom})`;
    previewCanvas.width = sourceMat.cols;
    previewCanvas.height = sourceMat.rows;
    previewPanel.innerHTML = '';
    previewPanel.appendChild(previewCanvas);
    cv.imshow(previewCanvas, sourceMat);
  }

  gridCanvasScale = Math.round(
      100 * Math.max(
          1, 2000 / Math.max(previewCanvas.width, previewCanvas.height))) / 100;
  gridCanvasScale = Math.min(gridCanvasScale, 4);

  let gridCanvas = document.getElementById('griddler-grid-canvas');
  if (!gridCanvas) {
    gridCanvas = createGridCanvas(previewCanvas, gridCanvasScale);
    previewPanel.appendChild(gridCanvas);
    gridCanvasCtx = gridCanvas.getContext('2d');
  }
  if (lineInfo.primarySize <= 6) return;
  gridCanvasCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
  gridCanvasCtx.beginPath();
  gridCanvasCtx.strokeStyle = 'red';
  gridCanvasCtx.lineWidth = 1;
  let x = Math.round(lineInfo.offsetLeft);
  while (x < previewCanvas.width) {
    gridCanvasCtx.moveTo(x * gridCanvasScale, 0);
    gridCanvasCtx.lineTo(x * gridCanvasScale, gridCanvas.height);
    gridCanvasCtx.stroke();
    x += lineInfo.dividerSize;
    gridCanvasCtx.moveTo(x * gridCanvasScale, 0);
    gridCanvasCtx.lineTo(x * gridCanvasScale, gridCanvas.height);
    gridCanvasCtx.stroke();
    x += lineInfo.cellSize;
  }
  let y = Math.round(lineInfo.offsetTop);
  while (y < previewCanvas.height) {
    gridCanvasCtx.moveTo(0, y * gridCanvasScale);
    gridCanvasCtx.lineTo(gridCanvas.width, y * gridCanvasScale);
    gridCanvasCtx.stroke();
    y += lineInfo.dividerSize;
    gridCanvasCtx.moveTo(0, y * gridCanvasScale);
    gridCanvasCtx.lineTo(gridCanvas.width, y * gridCanvasScale);
    gridCanvasCtx.stroke();
    y += lineInfo.cellSize;
  }
}

function assignCells() {
  const image = {
    mat: sourceMat,
    appendMatCanvas: () => {},
  };
  cellInfo = new CellInfo(image, lineInfo);
  cellInfo.initialize();
  assignments = new Clusterer(image, cellInfo).assign();
  assignments.forEach(assignment => { assignment.subassignments = []; });
  previewAssignments();
  console.log(assignments);
}

function previewAssignments() {
  const previewPanel = document.getElementById('assigner-map-preview');
  let previewCanvas = document.getElementById('assigner-preview-canvas');
  if (!previewCanvas) {
    previewCanvas = document.createElement('canvas');
    previewCanvas.id = 'assigner-preview-canvas';
    previewCanvas.className = 'previewed';
    previewCanvas.style.transform = `scale(${currentZoom})`;
    previewCanvas.width = sourceMat.cols;
    previewCanvas.height = sourceMat.rows;
    previewPanel.innerHTML = '';
    previewPanel.appendChild(previewCanvas);
    cv.imshow(previewCanvas, sourceMat);
  }

  let assignmentCanvas = document.getElementById('assigner-assignment-canvas');
  if (!assignmentCanvas) {
    assignmentCanvas = createAssignmentCanvas(previewCanvas);
    previewPanel.appendChild(assignmentCanvas);
    assignmentCanvasCtx = assignmentCanvas.getContext('2d');
    //assignmentCanvasCtx.translate(-0.5, -0.5);
  }
  assignmentCanvasCtx
      .clearRect(0, 0, assignmentCanvas.width, assignmentCanvas.height);
  const tree = document.getElementById('assigner-tree');
  tree.innerHTML = '';
  assignments.forEach(assignment => {
    addAssignment(assignment, tree, assignmentCanvasCtx);
  });
}

function addAssignment(assignment, tree, ctx) {
  const item = document.createElement('li');
  const combo = document.createElement('select');
  item.appendChild(combo);
  const wallOption = document.createElement('option');
  wallOption.value = 'wall';
  wallOption.textContent = 'Wall';
  combo.appendChild(wallOption);
  const floorOption = document.createElement('option');
  floorOption.value = 'floor';
  floorOption.textContent = 'Floor';
  combo.appendChild(floorOption);
  if (assignmentContainsOnlyRoles(assignment, ['horizontal', 'vertical'])) {
    const doorOption = document.createElement('option');
    doorOption.value = 'door';
    doorOption.textContent = 'Door';
    combo.appendChild(doorOption);
  }
  if (assignmentContainsOnlyRoles(assignment, ['primary'])) {
    const angledOption = document.createElement('option');
    angledOption.value = 'angled';
    angledOption.textContent = 'Angled Wall';
    combo.appendChild(angledOption);
  }
  if (assignment.cluster.size > 1) {
    const multipleOption = document.createElement('option');
    multipleOption.value = 'multiple';
    multipleOption.textContent = 'Multiple assignments';
    combo.appendChild(multipleOption);
  }
  combo.setAttribute('list', 'assignment-options');
  assignment.final = assignment.final || 'floor';
  combo.value = assignment.final;
  tree.appendChild(item);
  if (assignment.subassignments.length > 0) {
    const subtree = document.createElement('ul');
    subtree.className = 'assigner-subtree';
    item.appendChild(subtree);
    for (const subassignment of assignment.subassignments) {
      addAssignment(subassignment, subtree, ctx);
    }
  }
  let hovering = false;
  combo.onchange = () => {
    if (combo.value == 'multiple') {
      const subclusters = assignment.cluster.split(3);
      assignment.subassignments = subclusters.map(subcluster => ({
        cluster: subcluster,
        final: assignment.final,
        subassignments: [],
      }));
    } else {
      assignment.subassignments = [];
    }
    assignment.final = combo.value;
    hovering = false;
    previewAssignments();
  };
  if (assignment.subassignments.length == 0) {
    let color;
    switch (assignment.final) {
      case 'door': color = 'white'; break;
      case 'wall': color = 'rgb(222, 184, 135)'; break;
      case 'floor': color = 'rgb(245, 245, 220)'; break;
      case 'angled': color = 'rgb(236, 214, 177)'; break;
      default: color = 'black'; break;
    }
    drawAssignment(assignment, ctx, color);
    const startTime = performance.now();
    const drawAnimationFrame = timestamp => {
      const colorIntensity = (Math.sin((timestamp - startTime) / 100) + 1) * 50;
      const frameColor = [
        105 + colorIntensity,
        100 - colorIntensity / 2,
        100 - colorIntensity / 2,
      ];
      const frameColorRgb =
          `rgb(${frameColor[0]}, ${frameColor[1]}, ${frameColor[2]})`;
      drawAssignment(assignment, ctx, frameColorRgb);
      item.style.backgroundColor = frameColorRgb;
      if (hovering) {
        requestAnimationFrame(drawAnimationFrame);
      } else {
        drawAssignment(assignment, ctx, color);
        item.style.backgroundColor = null;
        //previewAssignments();
      }
    };
    item.onmouseover = () => {
      hovering = true;
      requestAnimationFrame(drawAnimationFrame);
    };
    item.onmouseout = () => {
      hovering = false;
    };
  }
}

function assignmentContainsOnlyRoles(assignment, roles) {
  for (const cell of assignment.cluster.cells) {
    if (!roles.includes(cell.role)) return false;
  }
  return true;
}

function drawAssignment(assignment, ctx, color) {
  for (const cell of assignment.cluster.cells) {
    ctx.fillStyle = color;
    ctx.lineWidth = 0;
    ctx.fillRect(Math.floor(cell.x + 0), Math.floor(cell.y + 0),
        Math.ceil(cell.width - 0), Math.ceil(cell.height - 0));
  }
}

function createAssignmentCanvas(previewCanvas) {
  const assignmentCanvas = document.createElement('canvas');
  assignmentCanvas.id = 'assigner-assignment-canvas';

  assignmentCanvas.style.opacity =
      document.getElementById('assigner-overlay-opacity').value;
  assignmentCanvas.className = 'previewed';
  assignmentCanvas.style.transform = `scale(${currentZoom})`;
  assignmentCanvas.width = previewCanvas.width;
  assignmentCanvas.height = previewCanvas.height;
  assignmentCanvas.onclick = e => {
    alert('assignment canvas clicked');
    e.stopPropagation();
    return true;
  };
  return assignmentCanvas;
}

function sendPStateToMipui() {
  const importButton = document.getElementById('importer-import-mipui-button');
  importButton.disabled = true;
  importButton.textContent = 'Updating...';
  document.getElementById('importer-smooth-walls').disabled = true;
  iframedMipui.contentWindow.postMessage({pstate: constructPState()}, '*');
}

window.addEventListener('message', event => {
  const importButton = document.getElementById('importer-import-mipui-button');
  switch (event.data.status) {
    case 'load done':
      importButton.disabled = null;
      importButton.textContent = 'Looks good, convert!';
      document.getElementById('importer-smooth-walls').disabled = null;
      break;
    case 'forks done':
      const {mid, secret} = event.data;
      finalMapMid = mid;
      finalMapSecret = secret;
      importButton.disabled = null;
      importButton.textContent = 'Looks good, convert!';
      document.getElementById('importer-open-map-button').disabled = null;
      break;
  }
});

function constructPState() {
  assignments.forEach(assignment => {
    populateCellFinalFromAssignment(assignment);
  });
  if (document.getElementById('importer-smooth-walls').checked) {
    smoothCellFinal();
  }
  return {
    ver: '1.0',
    props: {
      b: cellInfo.height + 0.5,
      r: cellInfo.width + 0.5,
    },
    // cell key -> (layer id -> content)
    content: createContent(),
    lastOpNum: 1,
  };
}

function populateCellFinalFromAssignment(assignment) {
  if (assignment.subassignments && assignment.subassignments.length > 0) {
    for (const subassignment of assignment.subassignments) {
      populateCellFinalFromAssignment(subassignment);
    }
  } else {
    for (const cell of assignment.cluster.cells) {
      cell.final = assignment.final;
    }
  }
}

function smoothCellFinal() {
  for (const cell of cellInfo.cellList) {
    if (cell.role == 'vertical') {
      // If this is floor but any of the neighboring primaries is wall, so
      // should this.
      if (cell.final == 'floor' && [
        cellInfo.getCell(cell.col - 0.5, cell.row),
        cellInfo.getCell(cell.col + 0.5, cell.row),
      ].some(neighbor => neighbor && neighbor.final == 'wall')) {
        cell.final = 'wall';
      }
    }
    if (cell.role == 'horizontal') {
      // If this is floor but any of the neighboring primaries is wall, so
      // should this.
      if (cell.final == 'floor' && [
        cellInfo.getCell(cell.col, cell.row - 0.5),
        cellInfo.getCell(cell.col, cell.row + 0.5),
      ].some(neighbor => neighbor && neighbor.final == 'wall')) {
        cell.final = 'wall';
      }
    }
  }
  for (const cell of cellInfo.cellList) {
    if (cell.role == 'corner') {
      // If this is a floor but any divider neighbor is a wall, so should this.
      if (cell.final == 'floor' && [
        cellInfo.getCell(cell.col - 0.5, cell.row),
        cellInfo.getCell(cell.col, cell.row - 0.5),
        cellInfo.getCell(cell.col + 0.5, cell.row),
        cellInfo.getCell(cell.col, cell.row + 0.5),
      ].some(neighbor => neighbor && neighbor.final == 'wall')) {
        cell.final = 'wall';
      }
    }
  }
}

function createContent() {
  const content = {};
  for (const cell of cellInfo.cellList) {
    const key = getCellKey(cell);
    const cellLayersToContent = getCellLayersToContent(cell);
    if (cellLayersToContent) content[key] = cellLayersToContent;
  }
  return content;
}

function getCellKey(cell) {
  if (cell.role == 'primary') {
    return `${cell.row},${cell.col}`;
  } else {
    return `${Math.floor(cell.row)},${Math.floor(cell.col)}:` +
        `${Math.ceil(cell.row)},${Math.ceil(cell.col)}`;
  }
}

function getCellLayersToContent(cell) {
  switch (cell.final) {
    case 'floor':
      return null;
    case 'wall':
      return {'1': {k: 0, v: 0}};
    case 'door':
      return {
        '1': {k: 0, v: 0},
        '3': {k: 0, v: 0},
      };
    case 'angled':
      return {'1': {k: 0, v: 1, c: buildAngledConnections(cell)}};
  }
  return null;
}

function buildAngledConnections(cell) {
  let connections = 0;
  const isWall = (col, row) => cellInfo.getCell(col, row).final == 'wall';
  if (isWall(cell.col, cell.row - 0.5)) connections |= 1;
  if (isWall(cell.col + 0.5, cell.row)) connections |= 2;
  if (isWall(cell.col, cell.row + 0.5)) connections |= 4;
  if (isWall(cell.col - 0.5, cell.row)) connections |= 8;
  if (isWall(cell.col + 0.5, cell.row - 0.5)) connections |= 16;
  if (isWall(cell.col + 0.5, cell.row + 0.5)) connections |= 32;
  if (isWall(cell.col - 0.5, cell.row + 0.5)) connections |= 64;
  if (isWall(cell.col - 0.5, cell.row - 0.5)) connections |= 128;
  return connections;
}

function previewElements(previewPanel, ...elements) {
  previewPanel.innerHTML = '';
  for (const element of elements) {
    element.classList.add('previewed');
    element.style.transform = `scale(${currentZoom})`;
    previewPanel.appendChild(element);
  }
}

function wireInputs() {
  document.getElementById('next-button').onclick = () => { stepForward(); };
  document.getElementById('prev-button').onclick = () => { stepBackward(); };
  document.getElementById('chooser-upload-button').onchange = () => {
    uploadImage(document.getElementById('chooser-upload-button').files[0]);
  };
  document.getElementById('assigner-overlay-opacity').oninput = () => {
    const overlay = document.getElementById('assigner-assignment-canvas');
    if (overlay) {
      overlay.style.opacity =
          document.getElementById('assigner-overlay-opacity').value;
    }
  };
  document.getElementById('importer-import-mipui-button').onclick = e => {
    e.target.disabled = true;
    e.target.textContent = 'Converting...';
    document.getElementById('importer-open-map-button').disabled = true;
    importIntoMipui();
  };
  document.getElementById('importer-smooth-walls').onchange = () => {
    sendPStateToMipui();
  };
  document.getElementById('importer-open-map-button').onclick = e => {
    if (finalMapMid && finalMapSecret) {
      window.open(
          `../app/index.html?mid=${finalMapMid}&secret=${finalMapSecret}`,
          '_blank');
    }
  };
}

function createZoomControls() {
  const instrumentPanels = document.getElementsByClassName('instrument-panel');
  const sliders = [];
  for (let i = 0; i < instrumentPanels.length - 1; i++) {
    const instrumentPanel = instrumentPanels[i];
    const container = document.createElement('div');
    container.classList.add('zoom-slider-container');
    instrumentPanel.appendChild(container);
    const label = document.createElement('div');
    label.classList.add('zoom-slider-label');
    label.textContent = 'Zoom';
    container.appendChild(label);
    const markContainer = document.createElement('div');
    markContainer.classList.add('zoom-slider-marks');
    container.appendChild(markContainer);
    ['100%', '1000%'].forEach(markTitle => {
      const mark = document.createElement('div');
      mark.classList.add('zoom-slider-mark');
      mark.textContent = markTitle;
      markContainer.appendChild(mark);
    });
    const slider = document.createElement('input');
    sliders.push(slider);
    slider.classList.add('zoom-slider-input');
    slider.type = 'range';
    slider.value = 100;
    slider.min = 100;
    slider.max = 1000;
    slider.step = 100;
    container.appendChild(slider);
    slider.oninput = () => {
      // Sychronize all zoom sliders.
      for (const otherSlider of sliders) {
        if (slider == otherSlider) continue;
        otherSlider.value = slider.value;
      }
      // Zoom.
      zoom(slider.value);
    };
  }
}

function zoom(value) {
  currentZoom = Number(value) / 100;
  const previews = document.getElementsByClassName('previewed');
  for (let i = 0; i < previews.length; i++) {
    previews[i].style.transform = `scale(${currentZoom})`;
  }
}

function importIntoMipui() {
  if (!imagesRef) {
    const config = mode == 'prod' ? {
      apiKey: 'AIzaSyA7tcZVmhwYyV4ygmEEuB1RKwgBZZC7HsQ',
      storageBucket: 'gs://mipui-prod.appspot.com',
    } : {
      apiKey: 'AIzaSyAP7CfYeh9_DWmKqTPI_-etKuhYFggaYy4',
      storageBucket: 'gs://mipui-dev.appspot.com',
    };
    firebase.initializeApp(config);
    imagesRef = firebase.storage().ref().child('images/maps');
  }
  hash(loadedFile).then(hashValue => {
    const imageRef = imagesRef.child(hashValue);
    const afterImageUpload = () => {
      const data = {
        image: hashValue,
        lineInfo,
      };
      iframedMipui.contentWindow.postMessage({
        fork: `ii ${JSON.stringify(data)}`,
      }, '*');
    };
    imageRef.put(loadedFile)
        .then(() => { afterImageUpload(); })
        .catch(err => {
          console.log('Image upload failed: ' +
              (err.message ? err.message : JSON.stringify(err)));
          // But proceed anyway.
          afterImageUpload();
        });
  });
}

function hash(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onloadend = e => {
      resolve(SparkMD5.ArrayBuffer.hash(e.target.result));
    };
    reader.readAsArrayBuffer(file);
  });
}

window.onload = () => {
  wireInputs();
  createZoomControls();
  stepForward();
};
