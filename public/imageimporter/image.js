class Image {
  constructor() {
    this.src_ = null;
    this.mat = null;
    this.stackElement_ = null;
  }

  initialize(parent, src) {
    return new Promise((resolve, reject) => {
      this.src_ = src;
      this.stackElement_ = this.createElement_(parent, 'div', 'image-stack');
      const sourceImage = this.appendStackElement_('img');
      sourceImage.onload = () => {
        this.mat = cv.imread(sourceImage);
        resolve();
      };
      sourceImage.src = this.src_;
    });
  }

  createElement_(parent, tag, className) {
    const element = document.createElement(tag);
    element.className = className;
    this.stackElement_.appendChild(element);
    return element;
  }

  appendStackElement_(tag) {
    const element =
        createElement(image.stackElement_, 'canvas', 'stack-element');
    element.onclick = () => {
      element.classList.toggle('focused');
    };
    return element;
  }

  appendMatCanvas(mat) {
    cv.imshow(this.appendStackElement_('canvas'), mat);
  }
}
