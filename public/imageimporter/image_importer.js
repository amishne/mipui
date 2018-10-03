let currentStep = -1;
let sourceMat = null;

function stepForward() {
  currentStep++;
  updateStepHeaders();
}

function stepBackward() {
  currentStep--;
  updateStepHeaders();
}

function updateStepHeaders() {
  const stepHeaders = document.getElementsByClassName('step-header');
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
  }
}

function image2mat(image) {
  return new Promise((resolve, reject) => {
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(cv.imread(canvas));
    };
  });
}

function uploadImage(file) {
  const image = document.createElement('img');
  image.src = window.URL.createObjectURL(file);
  imageCreated(image);
}

function imageCreated(image) {
  const image2matPromise = image2mat(image);
  const preview = document.getElementById('chooser-image-preview');
  document.getElementById('griddler-image-preview').innerHTML = '';
  previewElements(preview, image);
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

function previewGridLines(lineInfo) {
  const previewPanel = document.getElementById('griddler-image-preview');
  let previewCanvas = document.getElementById('griddler-preview-canvas');
  if (!previewCanvas) {
    previewCanvas = document.createElement('canvas');
    previewCanvas.id = 'griddler-preview-canvas';
    previewCanvas.className = 'previewed';
    previewCanvas.width = sourceMat.cols;
    previewCanvas.height = sourceMat.rows;
    previewPanel.innerHTML = '';
    previewPanel.appendChild(previewCanvas);
    cv.imshow(previewCanvas, sourceMat);
  }

  let gridCanvas = document.getElementById('griddler-grid-canvas');
  if (!gridCanvas) {
    gridCanvas = document.createElement('canvas');
    gridCanvas.id = 'griddler-grid-canvas';
    gridCanvas.className = 'previewed';
    gridCanvas.width = previewCanvas.width;
    gridCanvas.height = previewCanvas.height;
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
    //element.onclick = () => { element.classList.toggle('focused'); };
    previewPanel.appendChild(element);
  }
}

function wireInputs() {
  document.getElementById('next-button').onclick = () => { stepForward(); };
  document.getElementById('prev-button').onclick = () => { stepBackward(); };
  document.getElementById('chooser-upload-button').onchange = () => {
    uploadImage(document.getElementById('chooser-upload-button').files[0]);
  };
//  document.getElementById('chooser-url-button').onclick = () => {
//    const image = document.createElement('img');
//    image.src = document.getElementById('chooser-url-input').value;
//    imageCreated(image);
//  };
}

window.onload = () => {
  wireInputs();
  stepForward();
};
