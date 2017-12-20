class Cell {
  constructor(key, role, gridElement, tile) {
    this.key = key;
    this.role = role;
    this.gridElement = gridElement;
    this.tile = tile;
    this.offsetLeft = null;
    this.offsetTop = null;
    this.width = null;
    this.height = null;
    this.offsetRight = null;
    this.offsetBottom = null;
    this.row = null;
    this.column = null;

    // Elements owned by this cell, keyed by layer.
    this.elements_ = new Map();

    // Exposed to be used by text gestures.
    this.textHeight = null;

    // Initialization.
    this.neighborKeys_ = new Map();
    this.wireInteractions_();
  }

  getLayerContent(layer) {
    if (layer.getShadowingLayer) {
      return this.getLayerContent(layer.getShadowingLayer());
    }
    return state.getLayerContent(this.key, layer);
  }

  setLayerContent(layer, content, recordChange) {
    const oldContent = this.getLayerContent(layer);
    state.setLayerContent(this.key, layer, content);
    const newContent = this.getLayerContent(layer);
    if (!sameContent(oldContent, newContent)) {
      if (recordChange) {
        state.opCenter
            .recordCellChange(this.key, layer.id, oldContent, newContent);
      }
      this.updateElement_(layer, oldContent, newContent);
      if (layer.getShadowLayer) {
        this.updateElement_(layer.getShadowLayer(), oldContent, newContent);
      }
    }
  }

  hasLayerContent(layer) {
    return !!this.getLayerContent(layer);
  }

  isKind(layer, kind) {
    const content = this.getLayerContent(layer);
    return content ? content[ck.kind] === kind.id : false;
  }

  isVariation(layer, kind, variation) {
    const content = this.getLayerContent(layer);
    if (!content) return false;
    if (content[ck.kind] !== kind.id) return false;
    if (content[ck.variation] !== variation.id) return false;
    return true;
  }

  hasHiddenContent() {
    return this.hasLayerContent(ct.gmoverlay) ||
        this.isVariation(
            ct.separators,
            ct.separators.door,
            ct.separators.door.hiddenSecret) ||
        this.isKind(ct.text, ct.text.gmNote) ||
        this.isKind(ct.mask, ct.mask.hidden);
  }

  getVal(layer, contentKey) {
    const content = this.getLayerContent(layer);
    return content ? content[contentKey] : null;
  }

  createElementFromContent(layer, content) {
    if (!this.contentShouldHaveElement_(content)) return null;
    const element = createAndAppendDivWithClass(
        this.tile.layerElements.get(layer));
    this.populateElementFromContent_(element, layer, content);
    this.elements_.set(layer, element);
    return element;
  }

  // Returns all the cells in a square between this cell and 'cell', in row
  // and then col order.
  getPrimaryCellsInSquareTo(cell) {
    if (!cell || !this.role == 'primary' || !cell.role == 'primary') return [];

    const startCellKey =
        CellMap.primaryCellKey(
            Math.min(this.row, cell.row), Math.min(this.column, cell.column));
    const endCellKey =
        CellMap.primaryCellKey(
            Math.max(this.row, cell.row), Math.max(this.column, cell.column));
    const startCell = state.theMap.cells.get(startCellKey);
    if (!startCell) return [];
    const endCell = state.theMap.cells.get(endCellKey);
    if (!endCell) return [];
    const width = 1 + endCell.column - startCell.column;
    const height = 1 + endCell.row - startCell.row;

    const result = [];
    let rowStart = startCell;
    for (let i = 0; i < height; i++) {
      let currCell = rowStart;
      for (let j = 0; j < width; j++) {
        result.push(currCell);
        currCell = currCell.getNeighbors('right').cells[0];
        if (!currCell) break;
      }
      rowStart = rowStart.getNeighbors('bottom').cells[0];
      if (!rowStart) break;
    }
    return result;
  }

  populateElementFromContent_(element, layer, content) {
    this.modifyElementClasses_(layer, content, element, 'add');
    this.setElementGeometryToGridElementGeometry_(element, layer, content);
    this.setText_(element, content[ck.text]);
    this.setImage_(element, content[ck.image], content[ck.variation]);
    this.setImageHash_(element, content[ck.imageHash], content[ck.variation]);
    this.setImageFromVariation_(element, layer, content);
    this.setClip_(
        element, content[ck.clipInclude], content[ck.clipExclude]);
  }

  setClip_(element, clipInclude, clipExclude) {
    if (!element) return;
    element.style.mask = null;
    element.style['-webkit-mask'] = null;
    if (!clipInclude && !clipExclude) return;
    const shapes = [];
    if (clipInclude) {
      clipInclude.split('|').forEach(clipShape => {
        shapes.push(this.clipToSvgShape_(clipShape, 'white'));
      });
    } else {
      // If there are no inclusions, include the whole element.
      shapes
          .push("<rect x='0' y='0' width='100%' height='100%' fill='white'/>");
    }
    if (clipExclude) {
      clipExclude.split('|').forEach(clipShape => {
        shapes.push(this.clipToSvgShape_(clipShape, 'black'));
      });
    }
    const svg =
        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg'>" +
        `<defs><mask id='m'>${shapes.join('')}</mask></defs>` +
        "<rect x='0' y='0' width='100%' height='100%' mask='url(%23m)' />" +
        '</svg>';
    element.style['-webkit-mask'] = `url("${svg}")`;
    element.style['mask'] = `url("${svg}")`;
  }

  clipToSvgShape_(clipShape, color) {
    switch (clipShape[0]) {
      case 'e':
        const [rx, ry, cx, cy] =
            clipShape.substr(2).split(',').map(s => Number.parseFloat(s));
        return `<ellipse rx='${rx}' ry='${ry}' cx='${cx}' cy='${cy}' ` +
            `fill='${color}' />`;
    }
  }

  setText_(element, text) {
    if (!element || !text) return;
    const offsetWidth = element.offsetWidth;
    const offsetHeight = element.offsetHeight;
    const theMapElement = document.getElementById('theMap');
    const sizingElement = createAndAppendDivWithClass(
        theMapElement, element.className);
    sizingElement.style.visibility = 'hidden';
    sizingElement.style.display = 'inline-block';
    sizingElement.style.width = offsetWidth;
    sizingElement.textContent = text;
    let fontSize = 14;
    sizingElement.style.fontSize = fontSize + 'pt';
    while (sizingElement.scrollWidth <= offsetWidth &&
        sizingElement.scrollHeight <= offsetHeight) {
      fontSize++;
      sizingElement.style.fontSize = fontSize + 'pt';
    }
    while (fontSize > 1 &&
        (sizingElement.scrollWidth > offsetWidth ||
         sizingElement.scrollHeight > offsetHeight)) {
      fontSize--;
      sizingElement.style.fontSize = fontSize + 'pt';
    }
    this.textHeight = sizingElement.scrollHeight;
    theMapElement.removeChild(sizingElement);
    element.style.fontSize = fontSize + 'pt';
    element.textContent = text;
  }

  setImage_(element, imageUrl, variation) {
    if (!element || !imageUrl) return;
    const width = element.offsetWidth;
    const height = element.offsetHeight;
    const classNames = variation.classNames || [];
    element.innerHTML = `<img class="image ${classNames.join(' ')}" src=` +
        `"${imageUrl}" style="width: ${width}px; height: ${height}px; alt="">`;
    if (imageUrl.endsWith('.svg')) {
      // Asynchronously replace <img> with <svg>, which then supports
      // 1. Styling
      // 2. Exporting to PNG / SVG
      if (state.lastUsedSvg && state.lastUsedSvg.imageUrl == imageUrl &&
          state.lastUsedSvg.variation == variation) {
        // The element is cached!
        element.innerHTML = '';
        const svgElement = state.lastUsedSvg.svgElement.cloneNode(true);
        svgElement.style.width = width;
        svgElement.style.height = height;
        element.appendChild(svgElement);
      } else {
        const xhr = new XMLHttpRequest();
        xhr.open('get', imageUrl, true);
        xhr.onreadystatechange = () => {
          if (xhr.readyState != 4) return;
          const svgElement = xhr.responseXML.documentElement;
          svgElement.classList.add('image');
          svgElement.classList.add(...classNames);
          svgElement.style.width = width;
          svgElement.style.height = height;
          Array.from(svgElement.children)
              .forEach(svgChild => svgChild.removeAttribute('fill'));
          element.innerHTML = '';
          element.appendChild(svgElement);
          state.lastUsedSvg = {imageUrl, variation, svgElement};
        };
        xhr.send();
      }
    }
  }

  setImageHash_(element, imageHash, variation) {
    if (!element || !imageHash) return;
    const imageUrl =
        gameIcons.find(gameIcon => gameIcon.hash == imageHash).path;
    if (imageUrl) {
      this.setImage_(element, imageUrl.replace('public/app/', ''), variation);
    }
  }

  setImageFromVariation_(element, layer, content) {
    if (!element) return;
    const kind = ct.children[layer.id].children[content[ck.kind]];
    const variation = kind.children[content[ck.variation]];
    if (!variation.imagePath) return;
    this.setImage_(element, variation.imagePath, variation);
  }

  getOrCreateLayerElement(layer, initialContent) {
    let element = this.elements_.get(layer);
    if (!element) {
      element = this.createElementFromContent(layer, initialContent);
    }
    return element;
  }

  removeElement(layer) {
    const element = this.elements_.get(layer);
    if (!element) return;
    element.parentElement.removeChild(element);
    this.elements_.delete(layer);
  }

  contentShouldHaveElement_(content) {
    // Either there's no content, or the content has a start cell, signalling
    // it should be rendered in another cell.
    return content && !content[ck.startCell];
  }

  updateElement_(layer, oldContent, newContent) {
    if (!this.contentShouldHaveElement_(newContent)) {
      this.removeElement(layer);
      return null;
    }
    const element = this.getOrCreateLayerElement(layer, newContent);
    this.modifyElementClasses_(layer, oldContent, element, 'remove');
    this.populateElementFromContent_(element, layer, newContent);
    return element;
  }

  updateLayerElementToCurrentContent_(layer) {
    const element = this.elements_.get(layer);
    const content = this.getLayerContent(layer);
    if (!element) {
      this.createElementFromContent(layer, content);
    } else {
      if (this.contentShouldHaveElement_(content)) {
        element.className = '';
        this.populateElementFromContent_(element, layer, content);
      } else {
        this.removeElement(layer);
      }
    }
  }

  updateAllElementsToCurrentContent() {
    ct.children.forEach(layer => {
      this.updateLayerElementToCurrentContent_(layer);
    });
  }

  resetToDefault() {
    ct.children.forEach(layer => {
      this.setLayerContent(layer, null, true);
    });
  }

  onMouseEnter(e) {
    if (!state.gesture) return;
    this.tile.tileEntered();
    if (e.buttons == 0) {
      state.gesture.startHover(this);
    } else if (e.buttons == 1) {
      state.gesture.continueGesture(this);
    }
    e.stopPropagation();
  }

  onMouseLeave(e) {
    if (!state.gesture) return;
    this.tile.tileLeft();
    if (e.buttons == 0) {
      state.gesture.stopHover();
    }
    e.stopPropagation();
  }

  onMouseDown(e) {
    if (!state.gesture) return;
    if (e.buttons == 1) {
      state.gesture.startGesture();
    }
    e.preventDefault();
    e.stopPropagation();
  }

  onMouseUp(e) {
    if (!state.gesture) return;
    if (e.button == 0) {
      state.gesture.stopGesture();
    }
    state.gesture.startHover(this);
    e.stopPropagation();
  }

  wireInteractions_() {
    // All grid element interactions stop the event from bubbling up.
    this.gridElement.onmouseenter = e => this.onMouseEnter(e);
    this.gridElement.onmouseleave = e => this.onMouseLeave(e);
    this.gridElement.onmousedown = e => this.onMouseDown(e);
    this.gridElement.onmouseup = e => this.onMouseUp(e);
  }

  setElementGeometryToGridElementGeometry_(element, layer, content) {
    const endCellKey = content[ck.endCell];
    const endCell = endCellKey ? state.theMap.cells.get(endCellKey) : this;
    element.style.top = this.offsetTop - this.tile.top;
    element.style.right = endCell.offsetRight - this.tile.right;
    element.style.bottom = endCell.offsetBottom - this.tile.bottom;
    element.style.left = this.offsetLeft - this.tile.left;
    if (layer == ct.walls) {
      let backgroundOffsetLeft = -this.offsetLeft;
      let backgroundOffsetTop = -this.offsetTop;
      if (content[ck.variation] == ct.walls.smooth.angled.id) {
        backgroundOffsetLeft += 7;
        backgroundOffsetTop += 7;
      }
      element.style.backgroundPosition =
          `${backgroundOffsetLeft}px ${backgroundOffsetTop}px`;
    }
  }

  addNeighborKey(direction, dividerKey, cellKeys) {
    this.neighborKeys_.set(direction, {
      dividerKey,
      cellKeys,
    });
  }

  getNeighbors(direction) {
    const neighborKeysInDirection = this.neighborKeys_.get(direction);
    if (!neighborKeysInDirection) return null;
    return {
      dividerCell:
          state.theMap.cells.get(neighborKeysInDirection.dividerKey),
      cells: neighborKeysInDirection.cellKeys
          .map(cellKey => state.theMap.cells.get(cellKey))
          .filter(cell => !!cell),
    };
  }

  getNeighbor(direction, divider) {
    const neighbors = this.getNeighbors(direction);
    if (!neighbors) return null;
    if (divider) {
      return neighbors.dividerCell;
    }
    if (!neighbors.cells || neighbors.cells.length == 0) return null;
    return neighbors.cells[0];
  }

  getAllNeighbors() {
    const neighbors = [];
    for (const direction of this.neighborKeys_.keys()) {
      const neighborsOfDirection = this.getNeighbors(direction);
      neighbors.push({
        direction,
        dividerCell: neighborsOfDirection.dividerCell,
        cells: neighborsOfDirection.cells,
      });
    };
    return neighbors;
  }

  modifyElementClasses_(layer, content, element, addOrRemove) {
    if (!content) return;
    const kind = ct.children[layer.id].children[content[ck.kind]];
    const variation = kind.children[content[ck.variation]];
    const classNames = [].concat(
        layer.classNames || [],
        kind.classNames || [],
        variation.classNames || []);
    classNames.forEach(className => {
      let renamed = className.replace(/_ROLE_/g, this.role);
      if (content.hasOwnProperty(ck.connections)) {
        renamed = renamed.replace(/_CONNECTIONS_/g, content[ck.connections]);
      }
      element.classList[addOrRemove](renamed);
    });
  }

  showHighlight(layer, content) {
    const existingContent = this.getLayerContent(layer);
    const action = existingContent && content ? 'editing' :
      (existingContent ? 'removing' : 'adding');
    const element = content ?
      this.updateElement_(layer, this.getLayerContent(layer), content) :
      this.elements_.get(layer);
    if (!element) return;
    if (action == 'adding') {
      element.className = element.className
          .replace(/_ADDING-REMOVING_/g, 'adding')
          .replace(/_ADDING_/g, 'adding');
    } else if (action == 'removing') {
      element.className = element.className
          .replace(/_ADDING-REMOVING_/g, 'removing')
          .replace(/_REMOVING_/g, 'removing');
    } else if (action == 'editing') {
      element.className = element.className.replace(/_EDITING_/g, 'editing');
    }
  }

  hideHighlight(layer) {
    this.updateLayerElementToCurrentContent_(layer);
  }
}
