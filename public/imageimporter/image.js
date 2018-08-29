class Image {
  constructor(src) {
    this.src_ = src;
    this.mat = null;
    this.stackElement_ = null;
  }

  initialize(parent) {
    return new Promise((resolve, reject) => {
      this.stackElement_ = this.createElement_(parent, 'div', 'image-stack');
      const sourceImage = this.appendStackElement_('img');
      sourceImage.onload = () => {
        this.mat = this.createSourceMat_(sourceImage);
        resolve();
      };
      sourceImage.src = this.src_;
    });
  }

  createSourceMat_(sourceImage) {
    const canvas = document.createElement('canvas');
    canvas.width = sourceImage.naturalWidth;
    canvas.height = sourceImage.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);
    return cv.imread(canvas);
  }

  createElement_(parent, tag, className) {
    const element = document.createElement(tag);
    element.className = className;
    if (parent.childElementCount > 0) {
      parent.insertBefore(element, parent.firstChild);
    } else {
      parent.appendChild(element);
    }
    return element;
  }

  appendStackElement_(tag) {
    const element =
        this.createElement_(this.stackElement_, tag, 'stack-element');
    element.onclick = () => {
      element.classList.toggle('focused');
    };
    return element;
  }

  appendMatCanvas(mat) {
    cv.imshow(this.appendStackElement_('canvas'), mat);
  }
}
