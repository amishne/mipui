let currentStep = -1;
let currentZoom = 1;
let sourceMat = null;
let sourceImage = null;

function stepForward() {
  currentStep++;
  updateStepHeaders();
  if (currentStep == 2) gridImage();
}

function stepBackward() {
  currentStep--;
  updateStepHeaders();
}

function updateStepHeaders() {
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
  if (currentStep == 1) {
    document.getElementById('next-button').disabled = !sourceImage;
  } else {
    document.getElementById('next-button').disabled =
        currentStep >= stepHeaders.length - 1;
  }
  document.getElementById('prev-button').disabled = currentStep == 0;
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
    const lineInfo = new Griddler({
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
    primarySizeInput.value = lineInfo.cellSize;
    dividerSizeInput.value = lineInfo.dividerSize;
    offsetLeftInput.value = lineInfo.offsetLeft;
    offsetTopInput.value = lineInfo.offsetTop;
    previewGridLines(lineInfo);
    [
      primarySizeInput,
      dividerSizeInput,
      offsetLeftInput,
      offsetTopInput,
    ].forEach(element => {
      element.oninput = () => {
        const oldDividerSize = lineInfo.dividerSize;
        const newDividerSize = Number(dividerSizeInput.value);
        if (oldDividerSize != newDividerSize) {
          const mod = Number(primarySizeInput.value) + newDividerSize;
          const offsetBy = (inputElement, half) => {
            inputElement.value =
              (mod + Number(inputElement.value) -
               (newDividerSize - oldDividerSize) / (half ? 2 : 1)) % mod;
          };
          offsetBy(primarySizeInput);
          offsetBy(offsetLeftInput, true);
          offsetBy(offsetTopInput, true);
        }
        lineInfo.cellSize = Number(primarySizeInput.value);
        lineInfo.dividerSize = newDividerSize;
        lineInfo.offsetLeft = Number(offsetLeftInput.value);
        lineInfo.offsetTop = Number(offsetTopInput.value);
        previewGridLines(lineInfo);
      };
    });
  });
}

function createGridCanvas(previewCanvas) {
  const gridCanvas = document.createElement('canvas');
  gridCanvas.id = 'griddler-grid-canvas';
  gridCanvas.className = 'previewed';
  gridCanvas.style.transform = `scale(${currentZoom})`;
  gridCanvas.width = previewCanvas.width;
  gridCanvas.height = previewCanvas.height;
  let clientX = NaN;
  let clientY = NaN;
  const primarySizeInput =
      document.getElementById('griddler-primary-size-input');
  const dividerSizeInput =
      document.getElementById('griddler-divider-size-input');
  const offsetLeftInput = document.getElementById('griddler-offset-left-input');
  const offsetTopInput = document.getElementById('griddler-offset-top-input');
  gridCanvas.onmousemove = e => {
    if ((e.buttons & 1) == 0) return false;
    if (!isNaN(clientX) && !isNaN(clientY)) {
      if (clientX - e.clientX == 0 && clientY - e.clientY == 0) return true;
      const mod =
          Number(primarySizeInput.value) + Number(dividerSizeInput.value);
      offsetLeftInput.value =
          (mod + Number(offsetLeftInput.value) - (clientX - e.clientX)) % mod;
      offsetTopInput.value =
          (mod + Number(offsetTopInput.value) - (clientY - e.clientY)) % mod;
      offsetLeftInput.oninput();
      offsetTopInput.oninput();
    }
    clientX = e.clientX;
    clientY = e.clientY;
    e.stopPropagation();
    return true;
  };
  return gridCanvas;
}

function previewGridLines(lineInfo) {
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

  let gridCanvas = document.getElementById('griddler-grid-canvas');
  if (!gridCanvas) {
    gridCanvas = createGridCanvas(previewCanvas);
    previewPanel.appendChild(gridCanvas);
  }
  const ctx = gridCanvas.getContext('2d');
  ctx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
  ctx.beginPath();
  ctx.strokeStyle = 'red';
  let x = Math.round(lineInfo.offsetLeft);
  while (x < gridCanvas.width) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, gridCanvas.height);
    ctx.stroke();
    x += lineInfo.dividerSize;
    ctx.moveTo(x, 0);
    ctx.lineTo(x, gridCanvas.height);
    ctx.stroke();
    x += lineInfo.cellSize;
  }
  let y = Math.round(lineInfo.offsetTop);
  while (y < gridCanvas.height) {
    ctx.moveTo(0, y);
    ctx.lineTo(gridCanvas.width, y);
    ctx.stroke();
    y += lineInfo.dividerSize;
    ctx.moveTo(0, y);
    ctx.lineTo(gridCanvas.width, y);
    ctx.stroke();
    y += lineInfo.cellSize;
  }
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
    ['10%', '100%', '1000%'].forEach(markTitle => {
      const mark = document.createElement('div');
      mark.classList.add('zoom-slider-mark');
      mark.textContent = markTitle;
      markContainer.appendChild(mark);
    });
    const slider = document.createElement('input');
    sliders.push(slider);
    slider.classList.add('zoom-slider-input');
    slider.type = 'range';
    slider.step = 10;
    slider.setAttribute('list', 'zoom-slider-data');
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
  switch (value) {
    case '0': currentZoom = 0.1; break;
    case '10': currentZoom = 0.2; break;
    case '20': currentZoom = 0.4; break;
    case '30': currentZoom = 0.6; break;
    case '40': currentZoom = 0.8; break;
    case '50': currentZoom = 1; break;
    case '60': currentZoom = 1.5; break;
    case '70': currentZoom = 2.5; break;
    case '80': currentZoom = 4; break;
    case '90': currentZoom = 7; break;
    case '100': currentZoom = 10; break;
  }
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
