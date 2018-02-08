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
          `<style><!-- ${path} -->\n${fileContent}</style>`).join('\n');
  }

  node2svgElement(node) {
    return this.foreignObjectString2svgElement_(
        this.xml2foreignObjectString_(this.node2xml_(node), false));
  }

  node2svgDataUrl(node, width, height) {
    return this.foreignObjectString2svgDataUrl_(
        this.xml2foreignObjectString_(this.node2xml_(node), true),
        width, height);
  }

  node2pngDataUrl(node, width, height) {
    return this.canvas2dataUrl_(
        this.imageElement2canvas_(
            this.foreignObjectString2imageElement_(
                this.xml2foreignObjectString_(this.node2xml_(node), true),
                width, height),
            width, height));
  }

  msSince_(start) {
    return `${Math.round(performance.now() - start)}ms`;
  }

  node2xml_(node) {
    const start = performance.now();
    const result = new XMLSerializer().serializeToString(node);
    debug(`node2xml_() done in ${this.msSince_(start)}`);
    return result;
  }

  xml2foreignObjectString_(xml, includeStyle) {
    return '<foreignObject style="width:100%;height:100%">' +
      (includeStyle ? this.styleString_ : '') + xml + '</foreignObject>'
        .replace(/\n/g, ' ')
        .replace(/ +/g, ' ');
  }

  foreignObjectString2svgElement_(foreignObjectString) {
    const start = performance.now();
    const svgElement = document.createElement('svg');
    svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgElement.innerHTML = foreignObjectString;
    debug(`foreignObjectString2svgElement_() done in ${this.msSince_(start)}`);
    return svgElement;
  }

  foreignObjectString2svgDataUrl_(foreignObjectString, width, height) {
    const encodedForeignObjectString = encodeURIComponent(foreignObjectString);
    return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" ' +
        `width="${width}" height="${height}">${encodedForeignObjectString}` +
        '</svg>';
  }

  foreignObjectString2imageElement_(foreignObjectString, width, height) {
    const imageElement = document.createElement('img');
    imageElement.src = this.foreignObjectString2svgDataUrl_(
        foreignObjectString, width, height);
    return imageElement;
  }

  imageElement2canvas_(imageElement, width, height) {
    const start = performance.now();
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    context.drawImage(imageElement, 0, 0);
    debug(`imageElement2canvas_() done in ${this.msSince_(start)}`);
    return canvas;
  }

  canvas2dataUrl_(canvas) {
    const start = performance.now();
    const pngDataUrl = canvas.toDataURL();
    debug(`canvas2dataUrl_() done in ${this.msSince_(start)}`);
    return pngDataUrl;
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
}
