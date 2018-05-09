const INLINE_SVG_REGEX =
    /url\((\\?(&quot;|"|'))(data:image\/svg\+xml;utf8,.(((?!\1).)|\\\1)*)\1\)/g;

const EXTERNAL_PNG_REGEX =
    /url\((\\?(&quot;|"|'))(.*\.png)\1\)/g;

// Converts map nodes (the entire map or individual tiles) to images.
// Basic mechanism:
//
// 1. Maintain a string with the current style, taken from grid.css and any
//    theme-loaded styles.
// 2. Convert the node to XML string.
// 3. Place the XML string and the maintained style string inside a
//    foreignObject string.
// 4. Place the foreignObject string inside a new SVG string.
// 5. Create an image and set its src to a data URL version of that SVG.
// 6. Draw the image to a canvas, scaling it in the process.
// 7. Use the canvas's toDataUrl() to obtain a PNG data URL.
//
// This is inspired by https://github.com/tsayen/dom-to-image and is similar in
// principle, except that I can get away with not cloning any nodes by
// maintaining the style string and carefully escaping embedded SVGs.
class GridImager {
  constructor(options) {
    this.selectorsOfElementsToStrip_ = options.selectorsOfElementsToStrip || [];
    this.scale_ = options.scale || 1;
    this.disableSmoothing_ = options.disableSmoothing || false;
    this.margins_ = options.margins || 0;
    this.xmlPreProcessor_ = options.xmlPreProcessor || null;
    this.cropLeft_ = options.cropLeft || 0;
    this.cropRight_ = options.cropRight || 0;
    this.cropTop_ = options.cropTop || 0;
    this.cropBottom_ = options.cropBottom || 0;

    this.cssFiles_ = [];   // Order matters!
    this.styleString_ = '';
    this.imageElementContainer_ = null;
  }

  createImageElementContainer_() {
    if (this.imageElementContainer_) return;
    const parent = document.getElementById('mapContainer');
    this.imageElementContainer_ =
        createAndAppendDivWithClass(parent, 'grid-imager-image-container');
  }

  clone(options) {
    const gridImager = new GridImager({
      selectorsOfElementsToStrip:
        options.selectorsOfElementsToStrip || this.selectorsOfElementsToStrip_,
      scale: options.scale || this.scale_,
      disableSmoothing:
          options.disableSmoothing !== undefined ? options.disableSmoothing :
            this.disableSmoothing_,
      margins: options.margins != null ? options.margins : this.margins_,
      xmlPreProcessor: options.xmlPreProcessor || this.xmlPreProcessor_,
      cropLeft: options.cropLeft != null ? options.cropLeft : this.cropLeft_,
      cropRight:
          options.cropRight != null ? options.cropRight : this.cropRight_,
      cropTop: options.cropTop != null ? options.cropTop : this.cropTop_,
      cropBottom:
          options.cropBottom != null ? options.cropBottom : this.cropBottom_,
    });
    gridImager.cssFiles_ = this.cssFiles_;
    gridImager.styleString_ = this.styleString_;
    gridImager.imageElementContainer_ = this.imageElementContainer_;
    return gridImager;
  }

  async addCssStyleSheet(cssStyleSheet) {
    let cssStr = '';
    for (const rule of cssStyleSheet.cssRules) {
      const selector = rule.selectorText;
      const properties = {};
      for (let i = 0; i < rule.style.length; i++) {
        const propertyName = rule.style.item(i);
        let propertyValue = rule.style.getPropertyValue(propertyName)
            .replace(INLINE_SVG_REGEX, (match, quote, unused, value) =>
              'url("data:image/svg+xml;utf8,' +
                  encodeURIComponent(
                      value.substr(24)
                          .replace(/\\"/g, "'").replace(/%23/g, '#')) + '")');
        propertyValue = await this.internExternalImages_(propertyValue);
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

  internExternalImages_(value) {
    this.createImageElementContainer_();
    return new Promise(resolve => {
      const match = EXTERNAL_PNG_REGEX.exec(value);
      if (!match) {
        resolve(value);
        return;
      }
      const src = match[3];
      this.url2imageElement_(src).then(imageElement => {
        imageElement.addEventListener('load', () => {
          const width = imageElement.naturalWidth;
          const height = imageElement.naturalHeight;
          this.imageElement2canvas_(imageElement, width, height)
              .then(canvas => {
                this.imageElementContainer_.removeChild(imageElement);
                this.canvas2dataUrl_(canvas).then(dataUrl => {
                  resolve('url("' + dataUrl + '")');
                });
              });
        });
        this.imageElementContainer_.appendChild(imageElement);
      });
    });
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

  async node2svgElement(node, width, height) {
    width += 2 * this.margins_;
    height += 2 * this.margins_;
    const xml = await this.node2xml_(node, width, height);
    const foreignObjectString = await this.xml2foreignObjectString_(xml, false);
    return await this.foreignObjectString2svgElement_(foreignObjectString);
  }

  async node2svgDataUrl(node, width, height) {
    width += 2 * this.margins_;
    height += 2 * this.margins_;
    const xml = await this.node2xml_(node, width, height);
    const foreignObjectString = await this.xml2foreignObjectString_(xml, true);
    return await this.foreignObjectString2svgDataUrl_(
        foreignObjectString, width, height);
  }

  async node2pngDataUrl(node, width, height) {
    width += 2 * this.margins_;
    height += 2 * this.margins_;
    const xml = await this.node2xml_(node, width, height);
    const foreignObjectString = await this.xml2foreignObjectString_(xml, true);
    const imageElement = await this.foreignObjectString2imageElement_(
        foreignObjectString, width, height);
    const canvas = await this.imageElement2canvas_(imageElement, width, height);
    return await this.canvas2dataUrl_(canvas);
  }

  async node2blob(node, width, height) {
    const pngDataUrl = await this.node2pngDataUrl(node, width, height);
    const binaryString = atob(pngDataUrl.split(',')[1]);
    const length = binaryString.length;
    const binaryArray = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      binaryArray[i] = binaryString.charCodeAt(i);
    }
    return new Blob([binaryArray], {type: 'image/png'});
  }

  printTimeSince_(name, start, threshold) {
    const duration = Math.round(performance.now() - start);
    if (duration < threshold) return;
    debug(`${name} done in ${duration}ms`);
  }

  async node2xml_(node, width, height) {
    const serializeStart = performance.now();
    let serializedNode = new XMLSerializer().serializeToString(node);
    if (this.xmlPreProcessor_) {
      serializedNode = this.xmlPreProcessor_(serializedNode);
    }
    const result =
        '<div style="' +
        `padding: ${this.margins_}px;` +
        `width: ${width - 2 * this.margins_}px;` +
        `height: ${height - 2 * this.margins_}px;` +
        `">${serializedNode}</div>`;
    this.printTimeSince_(
        'XMLSerializer().serializeToString', serializeStart, 50);
    return result;
  }

  async xml2foreignObjectString_(xml, includeStyle) {
    return ('<foreignObject x="0" y="0" width="100%" height="100%">' +
      '<html xmlns="http://www.w3.org/1999/xhtml" style="display: inline;">' +
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

  async url2imageElement_(url) {
    const imageElement = document.createElement('img');
    imageElement.src = url;
    return imageElement;
  }

  imageElement2canvas_(imageElement, width, height) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const finalWidth = width - (this.cropLeft_ + this.cropRight_);
      const finalHeight = width - (this.cropTop_ + this.cropBottom_);
      canvas.width = this.scale_ * finalWidth;
      canvas.height = this.scale_ * finalHeight;
      const context = canvas.getContext('2d');
      context.scale(this.scale_, this.scale_);
      if (this.disableSmoothing_) {
        context.imageSmoothingEnabled = false;
      }
      this.createImageElementContainer_();
      const onLoad = added => {
        const startDraw = performance.now();
        context.drawImage(
            imageElement,
            // Rectangle from source image:
            this.cropLeft_, this.cropTop_, finalWidth, finalHeight,
            // Rectangle in canvas:
            0, 0, finalWidth, finalHeight);
        this.printTimeSince_('context.drawImage', startDraw, 50);
        if (added) this.imageElementContainer_.removeChild(imageElement);
        resolve(canvas);
      };
      const isLoaded =
          imageElement.complete && imageElement.naturalHeight !== 0;
      if (isLoaded) {
        onLoad(false);
      } else {
        imageElement.addEventListener('load', () => onLoad(true));
        this.imageElementContainer_.appendChild(imageElement);
      }
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
