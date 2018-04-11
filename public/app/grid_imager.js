const INLINE_SVG_REGEX =
    /url\((\\?(&quot;|"|'))(data:image\/svg\+xml;utf8,.(((?!\1).)|\\\1)*)\1\)/g;

class GridImager {
  constructor(options) {
    this.cssFiles_ = [];   // Order matters!
    this.styleString_ = '';
    this.selectorsOfElementsToStrip_ = options.selectorsOfElementsToStrip || [];
    this.scale_ = options.scale || 1;
    this.disableSmoothing_ = options.disableSmoothing || false;
    this.imageElementContainer_ = null;
  }

  async addCssStyleSheet(cssStyleSheet) {
    let cssStr = '';
    for (const rule of cssStyleSheet.cssRules) {
      const selector = rule.selectorText;
      const properties = {};
      for (let i = 0; i < rule.style.length; i++) {
        const propertyName = rule.style.item(i);
        const propertyValue = rule.style.getPropertyValue(propertyName)
            .replace(INLINE_SVG_REGEX, (match, quote, unused, value) =>
              'url("data:image/svg+xml;utf8,' +
                  encodeURIComponent(value.substr(24).replace(/\\"/g, "'")) + '")');
        properties[propertyName] = propertyValue;
        continue;
      }
      cssStr += `${selector}{`;
      for (const key of Object.keys(properties)) {
        cssStr += `${key}:${properties[key]};`;
      }
      cssStr += '}';
    }
    this.cssFiles_.push({path: cssStyleSheet.href, content: cssStr});
  }

  removeCssFile(path) {
    this.cssFiles_.splice(
        this.cssFiles_.findIndex(cssFile => cssFile.path == path), 1);
  }

  recalculateStyleString() {
    this.styleString_ = this.cssFiles_
        .map(cssFile => `<style>${cssFile.content}</style>`)
        .join('\n')
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

  printTimeSince_(name, start, threshold) {
    const duration = Math.round(performance.now() - start);
    if (duration < threshold) return;
    debug(`${name} done in ${duration}ms`);
  }

  async node2xml_(node) {
    const serializeStart = performance.now();
    const result = new XMLSerializer().serializeToString(node);
    this.printTimeSince_(
        'XMLSerializer().serializeToString', serializeStart, 50);
    return result;
  }

  async xml2foreignObjectString_(xml, includeStyle) {
    return ('<foreignObject x="0" y="0" width="100%" height="100%">' +
      '<html xmlns="http://www.w3.org/1999/xhtml">' +
      (includeStyle ? this.styleString_ : '') + xml + '</html></foreignObject>')
        .replace(/\n/g, ' ')
        .replace(/ +/g, ' ');
  }

  async foreignObjectString2svgElement_(foreignObjectString) {
    const svgElement = document.createElement('svg');
    svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgElement.innerHTML = foreignObjectString;
    return svgElement;
  }

  async foreignObjectString2svgDataUrl_(foreignObjectString, width, height) {
    let svgString = '<svg xmlns="http://www.w3.org/2000/svg" ' +
        `width="${width}" height="${height}">${foreignObjectString}` + '</svg>';
    // svgString = encodeURIComponent(svgString);
    svgString = svgString.replace(/\\"/g, "'");
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svgString);
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

  imageElement2canvas_(imageElement, width, height) {
    return new Promise((resolve, reject) => {
      // const start = performance.now();
      const canvas = document.createElement('canvas');
      canvas.style.width = width;
      canvas.style.height = height;
      canvas.width = this.scale_ * width;
      canvas.height = this.scale_ * height;
      const context = canvas.getContext('2d');
      context.scale(this.scale_, this.scale_);
      if (this.disableSmoothing_) {
        context.imageSmoothingEnabled = false;
      }
      if (!this.imageElementContainer_) {
        const parent = document.getElementById('mapContainer');
        this.imageElementContainer_ =
            createAndAppendDivWithClass(parent, 'grid-imager-image-container');
      }
      imageElement.addEventListener('load', () => {
        const startDraw = performance.now();
        context.drawImage(imageElement, 0, 0);
        this.printTimeSince_('context.drawImage', startDraw, 50);
        this.imageElementContainer_.removeChild(imageElement);
        resolve(canvas);
      });
      this.imageElementContainer_.appendChild(imageElement);
    });
  }

  async canvas2dataUrl_(canvas) {
    const start = performance.now();
    const pngDataUrl = canvas.toDataURL();
    this.printTimeSince_('canvas.toDataURL', start, 50);
    return pngDataUrl;
  }

  async svgDataUrl2pngDataUrl_(svgDataUrl, width, height) {
    const imageElement = await this.dataUrl2imageElement_(svgDataUrl);
    const canvas = await this.imageElement2canvas_(imageElement, width, height);
    return await this.canvas2dataUrl_(canvas);
  }

  filterOutElements_(cloned) {
    this.selectorsOfElementsToStrip_.forEach(selector => {
      const elements = cloned.querySelectorAll(selector);
      for (let i = 0; i < elements.length; i++) {
        elements[i].parentElement.removeChild(elements[i]);
      }
    });
  }
}
