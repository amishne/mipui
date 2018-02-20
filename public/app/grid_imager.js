class GridImager {
  constructor() {
    this.cssFiles_ = new Map();
    this.styleString_ = '';
  }

  addCssFile(path, callback) {
    this.loadFile_(path, fileContent => {
      this.cssFiles_.set(path, fileContent);
      callback();
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
    const cloned = node.cloneNode(true);
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
        foreignObjectString, width, height)
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
      const context = canvas.getContext('2d');
      imageElement.onload = () => {
        context.drawImage(imageElement, 0, 0);
        debug(`imageElement2canvas_() done in ${this.msSince_(start)}`);
        resolve(canvas);
      }
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

  async processNode_(node) {
    const backgroundImage =
        getComputedStyle(node).backgroundImage.replace(/\\"/g, "'");
    if (backgroundImage.includes('svg+xml')) {
      const width = 200;//node.clientWidth;
      const height = 20;//node.clientHeight;
      const pngDataUrl = backgroundImage.replace(
          /^url\(['"](data:image\/svg\+xml;utf8,<svg.+)['"]\)/g,
          (match, svgDataUrl) =>
            this.svgDataUrl2pngDataUrl_(svgDataUrl, width, height));
      node.style.backgroundImage = `url("${pngDataUrl}")`;
    }
    for (let i = 0; i < node.childElementCount; i++) {
      await this.processNode_(node.children[i]);
    }
  }
}
