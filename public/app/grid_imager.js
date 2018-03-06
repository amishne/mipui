const INLINE_SVG_REGEX =
    /url\((\\?(&quot;|"|'))(data:image\/svg\+xml.(?:(?!\1).)*)\1\)/;
const EXTRACT_DIMENSIONS_REGEX =
    /<svg[^>]*width=.([0-9.%]+).[^>]*height=.([0-9.%]+)./;

class GridImager {
  constructor(options) {
    this.cssFiles_ = new Map();
    this.styleString_ = '';
    this.filter_ = options.filter || (_ => true);
    this.scale_ = options.scale || 1;
    this.disableSmoothing_ = options.disableSmoothing || false;
    this.imageElementContainer_ = null;
    this.unknownSizeSelectors_ = {};
  }

  async addCssElement(path, element) {
    this.cssFiles_.set(path, '');
    let cssStr = '';
    for (const rule of element.sheet.cssRules) {
      const selector = rule.selectorText;
      const properties = {};
      for (let i = 0; i < rule.style.length; i++) {
        const propertyName = rule.style.item(i);
        const propertyValue = rule.style.getPropertyValue(propertyName);
        const propertyWithSvgImage =
            this.getSvgImageFromProperty_(propertyValue);
        if (!propertyWithSvgImage) {
          properties[propertyName] = propertyValue;
          continue;
        }
        if (!propertyWithSvgImage.hasKnownSize) {
          this.addUnknownSizeSelector_(selector, propertyName);
          properties[propertyName] = propertyValue;
          continue;
        }
        const pngDataUrl = await this.svgDataUrl2pngDataUrl_(
            propertyWithSvgImage.dataUrl,
            propertyWithSvgImage.width,
            propertyWithSvgImage.height);
        properties[propertyName] =
            propertyValue.substring(0, propertyWithSvgImage.begin) +
            pngDataUrl + propertyValue.substr(propertyWithSvgImage.end);
      }
      cssStr += `${selector}{`;
      for (const key of Object.keys(properties)) {
        cssStr += `${key}:${properties[key]};`;
      }
      cssStr += '}';
    }
    // Verify the entry still exists, i.e. that it wasn't deleted by a
    // theme change.
    if (this.cssFiles_.has(path)) {
      this.cssFiles_.set(path, cssStr);
    }
  }

  removeCssFile(path) {
    this.cssFiles_.delete(path);
  }

  recalculateStyleString() {
    this.styleString_ = Array.from(this.cssFiles_.entries())
        .map(([path, fileContent]) =>
          `<style>${fileContent}</style>`).join('\n').replace(/\s+/g, ' ');
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
    const needsCloning = node.innerHTML.includes('data:image/svg+xml;');
    let actualNode = node;
    let cloneContainer = null;
    if (needsCloning) {
      cloneContainer = document.createElement('div');
      cloneContainer.style.display = 'none';
      node.parentElement.appendChild(cloneContainer);
      actualNode = await this.cloneNode_(node, cloneContainer);
      debug(`node cloning done in ${this.msSince_(start)}`);
    }
    const serializeStart = performance.now();
    const result = new XMLSerializer().serializeToString(actualNode);
    debug(`node serialization done in ${this.msSince_(serializeStart)}`);
    if (needsCloning) {
      node.parentElement.removeChild(cloneContainer);
    }
    debug(`node2xml_() done in ${this.msSince_(start)}`);
    return result;
  }

  async xml2foreignObjectString_(xml, includeStyle) {
    return '<foreignObject x="0" y="0" width="100%" height="100%">' +
      '<html xmlns="http://www.w3.org/1999/xhtml">' +
      (includeStyle ? this.styleString_ : '') + xml + '</html></foreignObject>'
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

  async imageElement2canvas_(imageElement, width, height) {
    return new Promise((resolve, reject) => {
      const start = performance.now();
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
        debug(`drawing image on canvas done in ${this.msSince_(startDraw)}`);
        this.imageElementContainer_.removeChild(imageElement);
        debug(`imageElement2canvas_() done in ${this.msSince_(start)}`);
        resolve(canvas);
      });
      this.imageElementContainer_.appendChild(imageElement);
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

  async replaceInlinedSvgWithPng_(text) {
    const inlinedSvgs = [];
    let match = null;
    while (match = INLINE_SVG_REGEX.exec(text)) {
      const quoteLength = match[1].length;
      const svgDataUrl = match[3];
      const begin = match.index + 4 + quoteLength;
      const decodedSvgDataUrl = svgDataUrl
          .replace(/&amp;/g, '&')
          .replace(/\\?&quot;/g, '"')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>');
      inlinedSvgs.push({
        begin,
        end: begin + svgDataUrl.length,
        str: decodedSvgDataUrl,
      });
    }
    let result = '';
    let lastIndex = 0;
    for (const inlinedSvg of inlinedSvgs) {
      result += text.substring(lastIndex, inlinedSvg.begin);
      const {width, height} =
          this.extractDimensionsFromSvgStr_(inlinedSvg.str);
      const pngDataUrl =
          await this.svgDataUrl2pngDataUrl_(inlinedSvg.str, width, height);
      result += pngDataUrl;
      lastIndex = inlinedSvg.end;
    };
    result += text.substring(lastIndex);
    return result;
  }

  async cloneNode_(node, parent) {
    const cloned = document.createElement(node.tagName);
    parent.appendChild(cloned);
    cloned.outerHTML = await this.replaceInlinedSvgWithPng_(node.outerHTML);
    return parent.children[0];
  }

  extractDimensionsFromSvgStr_(svgDataUrl) {
    let width = 0;
    let height = 0;
    svgDataUrl.replace(EXTRACT_DIMENSIONS_REGEX, (match, group1, group2) => {
      width = group1;
      height = group2;
      return match;
    });
    return {width, height};
  }

  getSvgImageFromProperty_(value) {
    const match = INLINE_SVG_REGEX.exec(value);
    if (!match) return null;
    const quoteLength = match[1].length;
    const svgDataUrl = match[3];
    const {width, height} = this.extractDimensionsFromSvgStr_(svgDataUrl);
    const begin = match.index + 4 + quoteLength;
    const decodedSvgDataUrl = svgDataUrl
        .replace(/&amp;/g, '&')
        .replace(/\\?&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
    return {
      begin,
      end: begin + svgDataUrl.length,
      str: decodedSvgDataUrl,
      hasKnownSize:
          width && !width.includes('%') && height && !height.includes('%'),
      width: Number.parseFloat(width),
      height: Number.parseFloat(height),
    };
  }

  addUnknownSizeSelector_(selector, propertyName) {
    let curr = this.unknownSizeSelectors_[selector];
    if (!curr) {
      curr = [];
      this.unknownSizeSelectors_[selector] = curr;
    }
    curr.push(propertyName);
  }
}
