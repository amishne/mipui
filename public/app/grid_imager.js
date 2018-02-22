class GridImager {
  constructor(options) {
    this.cssFiles_ = new Map();
    this.styleString_ = '';
    this.filter_ = options.filter || (_ => true);
    this.scale_ = options.scale || 1;
    this.disableSmoothing_ = options.disableSmoothing || false;
  }

  addCssFile(path) {
    this.cssFiles_.set(path, '');
    return new Promise((resolve, reject) => {
      this.loadFile_(path, fileContent => {
        // Verify the entry still exists, i.e. that it wasn't deleted by a theme
        // change.
        if (this.cssFiles_.has(path)) {
          this.cssFiles_.set(path, fileContent);
        }
        resolve();
      });
    });
  }

  removeCssFile(path) {
    this.cssFiles_.delete(path);
  }

  recalculateStyleString() {
    this.styleString_ = Array.from(this.cssFiles_.entries())
        .map(([path, fileContent]) =>
          `<style><!-- ${path} -->\n${fileContent}</style>`).join('\n')
        .replace(/\s+/g, ' ');
  }

  async node2svgElement(node) {
    const xml = await this.node2xml_(node);
    const foreignObjectString = await this.xml2foreignObjectString_(xml, false);
    return await this.foreignObjectString2svgElement_(foreignObjectString);
  }

  async node2svgDataUrl(node, width, height) {
    const xml = await this.node2xml_(node);
    const foreignObjectString = await this.xml2foreignObjectString_(xml, true);
    return await this.foreignObjectString2svgDataUrl_(
        foreignObjectString, width, height);
  }

  async node2pngDataUrl(node, width, height) {
    const xml = await this.node2xml_(node);
    const foreignObjectString = await this.xml2foreignObjectString_(xml, true);
    const imageElement = await this.foreignObjectString2imageElement_(
        foreignObjectString, width, height);
    const canvas = await this.imageElement2canvas_(imageElement, width, height);
    return await this.canvas2dataUrl_(canvas);
  }

  msSince_(start) {
    return `${Math.round(performance.now() - start)}ms`;
  }

  async node2xml_(node) {
    const start = performance.now();
    const cloned = this.cloneNode_(node);
    debug(`node cloning done in ${this.msSince_(start)}`);
    const documentInsertionStart = performance.now();
    const cloneContainer = document.createElement('div');
    cloneContainer.style.display = 'none';
    node.parentElement.appendChild(cloneContainer);
    cloneContainer.appendChild(cloned);
    debug(`cloned node document insertion done in ${
      this.msSince_(documentInsertionStart)}`);
    const processStart = performance.now();
    await this.processNode_(cloned);
    debug(`node processing done in ${this.msSince_(processStart)}`);
    const serializeStart = performance.now();
    const result = new XMLSerializer().serializeToString(cloned);
    debug(`node serialization done in ${this.msSince_(serializeStart)}`);
    node.parentElement.removeChild(cloneContainer);
    debug(`node2xml_() done in ${this.msSince_(start)}`);
    return result;
  }

  async xml2foreignObjectString_(xml, includeStyle) {
    return '<foreignObject style="width:100%;height:100%">' +
      (includeStyle ? this.styleString_ : '') + xml + '</foreignObject>'
        .replace(/\n/g, ' ')
        .replace(/ +/g, ' ');
  }

  async foreignObjectString2svgElement_(foreignObjectString) {
    const start = performance.now();
    const svgElement = document.createElement('svg');
    svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgElement.innerHTML = foreignObjectString;
    debug(`foreignObjectString2svgElement_() done in ${this.msSince_(start)}`);
    return svgElement;
  }

  async foreignObjectString2svgDataUrl_(foreignObjectString, width, height) {
    const encodedForeignObjectString = encodeURIComponent(foreignObjectString);
    return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" ' +
        `width="${width}" height="${height}">${encodedForeignObjectString}` +
        '</svg>';
  }

  async foreignObjectString2imageElement_(foreignObjectString, width, height) {
    const svgDataUrl = await this.foreignObjectString2svgDataUrl_(
        foreignObjectString, width, height);
    return await this.dataUrl2imageElement_(svgDataUrl);
  }

  async dataUrl2imageElement_(dataUrl) {
    const imageElement = document.createElement('img');
    imageElement.src = dataUrl;
    return imageElement;
  }

  async imageElement2canvas_(imageElement, width, height, callback) {
    return new Promise((resolve, reject) => {
      const start = performance.now();
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = width;
      canvas.style.height = height
      canvas.width = this.scale_ * width;
      canvas.height = this.scale_ * height;
      const context = canvas.getContext('2d');
      context.scale(this.scale_, this.scale_);
      if (this.disableSmoothing_) {
        context.imageSmoothingEnabled = false;
      }
      imageElement.onload = () => {
        const startDraw = performance.now();
        context.drawImage(imageElement, 0, 0);
        debug(`drawing image on canvas done in ${this.msSince_(startDraw)}`);
        debug(`imageElement2canvas_() done in ${this.msSince_(start)}`);
        resolve(canvas);
      };
    });
  }

  async canvas2dataUrl_(canvas) {
    const start = performance.now();
    const pngDataUrl = canvas.toDataURL();
    debug(`canvas2dataUrl_() done in ${this.msSince_(start)}`);
    return pngDataUrl;
  }

  async svgDataUrl2pngDataUrl_(svgDataUrl, width, height) {
    const imageElement = await this.dataUrl2imageElement_(svgDataUrl);
    const canvas = await this.imageElement2canvas_(imageElement, width, height);
    return await this.canvas2dataUrl_(canvas);
  }

  loadFile_(path, callback) {
    const xhr = new XMLHttpRequest();
    xhr.open('get', path, true);
    xhr.onreadystatechange = () => {
      if (xhr.readyState != 4) return;
      callback(xhr.responseText);
    };
    xhr.send();
  }

  cloneNode_(node) {
    const cloned = node.cloneNode(false);
    for (const child of node.childNodes) {
      if (!this.filter_ || this.filter_(child)) {
        cloned.appendChild(this.cloneNode_(child));
      }
    }
    return cloned;
  }

  async processNode_(node) {
    const computedStyle = getComputedStyle(node);
    const backgroundImage = computedStyle.backgroundImage.replace(/\\"/g, "'");
    const maskNonWebkit = computedStyle.mask.replace(/\\"/g, "'");
    const maskWebkit = computedStyle.webkitMaskImage.replace(/\\"/g, "'");
    let mask = '';
    if (maskNonWebkit != '' && maskNonWebkit != 'none') mask = maskNonWebkit;
    else if (maskWebkit != '' && maskWebkit != 'none') mask = maskWebkit;
    if (backgroundImage.startsWith('url')) {
      const newPropertyValue =
          await this.replaceInlineSvgProperty_(backgroundImage);
      node.style.backgroundImage = newPropertyValue;
    }
    if (mask.startsWith('url')) {
      const newPropertyValue = await this.replaceInlineSvgProperty_(mask);
      node.style.mask = newPropertyValue;
      node.style.webkitMaskImage = newPropertyValue;
    }
    for (let i = 0; i < node.childElementCount; i++) {
      await this.processNode_(node.children[i]);
    }
  }
  
  async replaceInlineSvgProperty_(property) {
    const dataUrl = property.substr(5, property.length - 7);
    if (property.includes('data:image/svg+xml;')) {
      const {width, height} =
          this.extractDimensionsFromSvgStr_(dataUrl);
      const pngDataUrl =
          await this.svgDataUrl2pngDataUrl_(dataUrl, width, height);
      return `url("${pngDataUrl}")`;
    } else if (backgroundImage.includes('data:image/png;')) {
      // If it's already png, do nothing.
      return property;
    } else {
      // If it's a URL but not svg or png, it must be an external reference.
      debug('Unsupported external image reference when caching.');
      return property;
    }
  }

  extractDimensionsFromSvgStr_(svgDataUrl) {
    let width = 0;
    let height = 0;
    svgDataUrl.replace(/<svg xmlns=.http:\/\/www\.w3\.org\/2000\/svg.[^>]*width=.(\d+).[^>]*height=.(\d+)./, (match, group1, group2) => {
      width = group1;
      height = group2;
      return match;
    });
    return {width, height};
  }
}
