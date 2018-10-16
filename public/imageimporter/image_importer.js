let currentStep = -1;
let currentZoom = 1;
let sourceMat = null;
let sourceImage = null;
let lineInfo = null;
let assignments = null;

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
  onStepForwardIntoThis: () => {},
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
      stepHeader.classList.add('completed-step-header');
    } else if (i == currentStep) {
      stepHeader.classList.add('active-step-header');
    } else {
      stepHeader.classList.add('inactive-step-header');
      steps[i].reset();
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
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    resolve(cv.imread(canvas));
  });
}

function uploadImage(file) {
  const image = document.createElement('img');
  image.src = window.URL.createObjectURL(file);
  const preview = document.getElementById('chooser-image-preview');
  document.getElementById('griddler-image-preview').innerHTML = '';
  previewElements(preview, image);
  image.onload = () => {
    sourceImage = image;
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
      inputElement.value = +((mod + Number(inputElement.value) -
          (newDividerSize - oldDividerSize) / (half ? 2 : 1)) % mod).toFixed(3);
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
  let clientX = NaN;
  let clientY = NaN;
  const primarySizeInput =
      document.getElementById('griddler-primary-size-input');
  const dividerSizeInput =
      document.getElementById('griddler-divider-size-input');
  const offsetLeftInput = document.getElementById('griddler-offset-left-input');
  const offsetTopInput = document.getElementById('griddler-offset-top-input');
  gridCanvas.onmousemove = e => {
    if ((e.buttons & 1) == 0) return true;
    if (!isNaN(clientX) && !isNaN(clientY)) {
      if (clientX - e.clientX == 0 && clientY - e.clientY == 0) return true;
      const mod =
          Number(primarySizeInput.value) + Number(dividerSizeInput.value);
      const xDistance = round((clientX - e.clientX) / currentZoom, currentZoom);
      const yDistance = round((clientY - e.clientY) / currentZoom, currentZoom);
      console.log(`${xDistance}, ${yDistance}`);
      offsetLeftInput.value =
          +((mod + Number(offsetLeftInput.value) - xDistance) % mod).toFixed(3);
      offsetTopInput.value =
          +((mod + Number(offsetTopInput.value) - yDistance) % mod).toFixed(3);
      updateLineInfo();
      previewGridLines();
    }
    clientX = e.clientX;
    clientY = e.clientY;
    e.stopPropagation();
    return true;
  };
  return gridCanvas;
}

function round(n, m) {
  return Number(n.toFixed(Math.ceil(Math.log2(m))));
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

  const scale =
      Math.max(1, 2000 / Math.max(previewCanvas.width, previewCanvas.height));

  let gridCanvas = document.getElementById('griddler-grid-canvas');
  if (!gridCanvas) {
    gridCanvas = createGridCanvas(previewCanvas, scale);
    previewPanel.appendChild(gridCanvas);
  }
  if (lineInfo.primarySize <= 6) return;
  const ctx = gridCanvas.getContext('2d');
  ctx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
  ctx.beginPath();
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 1;
  let x = Math.round(lineInfo.offsetLeft);
  while (x < previewCanvas.width) {
    ctx.moveTo(x * scale, 0);
    ctx.lineTo(x * scale, gridCanvas.height);
    ctx.stroke();
    x += lineInfo.dividerSize;
    ctx.moveTo(x * scale, 0);
    ctx.lineTo(x * scale, gridCanvas.height);
    ctx.stroke();
    x += lineInfo.cellSize;
  }
  let y = Math.round(lineInfo.offsetTop);
  while (y < previewCanvas.height) {
    ctx.moveTo(0, y * scale);
    ctx.lineTo(gridCanvas.width, y * scale);
    ctx.stroke();
    y += lineInfo.dividerSize;
    ctx.moveTo(0, y * scale);
    ctx.lineTo(gridCanvas.width, y * scale);
    ctx.stroke();
    y += lineInfo.cellSize;
  }
}

function assignCells() {
  const image = {
    mat: sourceMat,
    appendMatCanvas: () => {},
  };
  const cellInfo = new CellInfo(image, lineInfo);
  cellInfo.initialize();
  assignments = new Clusterer(image, cellInfo).assign();
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
  }
  const ctx = assignmentCanvas.getContext('2d');
  ctx.clearRect(0, 0, assignmentCanvas.width, assignmentCanvas.height);
  const tree = document.getElementById('assigner-tree');
  assignments.forEach(assignment => {
    addAssignment(assignment, tree, ctx);
  });
}

function addAssignment(assignment, tree, ctx) {
  const item = document.createElement('li');
  item.textContent = assignment.final || 'unknown';
  tree.appendChild(item);
  let color = 'black';
  switch (assignment.final) {
    case 'door': color = 'white'; break;
    case 'wall': color = 'rgb(222, 184, 135)'; break;
    case 'floor': color = 'rgb(245, 245, 220)'; break;
  }
  drawAssignment(assignment, ctx, color);
  item.onmouseenter = () => {
    drawAssignment(assignment, ctx, 'red');
  };
  item.onmouseleave = () => {
    drawAssignment(assignment, ctx, color);
  };
}

function drawAssignment(assignment, ctx, color) {
  for (const cell of assignment.cluster.cells) {
    ctx.fillStyle = color;
    ctx.fillRect(cell.x, cell.y, cell.width + 1, cell.height + 1);
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
}

function createZoomControls() {
  const instrumentPanels = document.getElementsByClassName('instrument-panel');
  const sliders = [];
  for (let i = 0; i < instrumentPanels.length; i++) {
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

window.onload = () => {
  wireInputs();
  createZoomControls();
  stepForward();
};
