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

    // Elements owned by this cell.
    // Elements in the owning tile, keyed by layer (layer -> element):
    this.elements_ = new Map();
    // Replicated element in other tiles (layer -> (tile -> element)):
    this.replicatedElements_ = new Map();
    ct.children.forEach(
        layer => this.replicatedElements_.set(layer, new Map()));

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
      this.tile.invalidate();
      this.updateElements_(layer, oldContent, newContent, false);
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
    return this.contentIsVariation_(content, kind, variation);
  }

  contentIsVariation_(content, kind, variation) {
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

  createElementInOwnerTile_(layer, content, isHighlight) {
    const element = createAndAppendDivWithClass(
        this.tile.layerElements.get(layer));
    const offsetLeft = this.offsetLeft - this.tile.left;
    const offsetRight = this.offsetRight - this.tile.right;
    const offsetTop = this.offsetTop - this.tile.top;
    const offsetBottom = this.offsetBottom - this.tile.bottom;
    element.style.left = offsetLeft;
    element.style.right = offsetRight;
    element.style.top = offsetTop;
    element.style.bottom = offsetBottom;
    this.populateElementFromContent_(element, layer, content, isHighlight);
    this.elements_.set(layer, element);
    return element;
  }

  createReplicas_(layer, content, isHighlight, baseElement) {
    const offsetLeft = this.offsetLeft - this.tile.left;
    const offsetRight = this.offsetRight - this.tile.right;
    const offsetTop = this.offsetTop - this.tile.top;
    const offsetBottom = this.offsetBottom - this.tile.bottom;
    const elements = [];
    this.getReplicas_(layer, content).forEach(replica => {
      const clone = baseElement.cloneNode(true);
      clone.style.left = offsetLeft + replica.offsetLeft;
      clone.style.right = offsetRight + replica.offsetRight;
      clone.style.top = offsetTop + replica.offsetTop;
      clone.style.bottom = offsetBottom + replica.offsetBottom;

      replica.tile.layerElements.get(layer).appendChild(clone);
      if (!isHighlight) {
        replica.tile.invalidate();
      } else {
        if (isHighlight == 'showHighlight') {
          replica.tile.showHighlight();
        } else {
          replica.tile.hideHighlight();
        }
      }

      this.replicatedElements_.get(layer).set(replica.tile, clone);
      elements.push(clone);
    });
    return elements;
  }

  clearReplicas_(layer, isHighlight) {
    this.replicatedElements_.get(layer).forEach((replicatedElement, tile) => {
      if (!isHighlight) {
        tile.invalidate();
      } else {
        if (isHighlight == 'showHighlight') {
          tile.showHighlight();
        } else {
          tile.hideHighlight();
        }
      }
      replicatedElement.parentElement.removeChild(replicatedElement);
    });
    this.replicatedElements_.get(layer).clear();
  }

  createElementsFromContent_(layer, content, isHighlight) {
    if (!this.contentShouldHaveElement_(content)) return [];
    this.tile.invalidate();
    const baseElement =
        this.createElementInOwnerTile_(layer, content, isHighlight);
    const replicas =
        this.createReplicas_(layer, content, isHighlight, baseElement);
    return [baseElement].concat(replicas);
  }

  getReplicas_(layer, content) {
    const tilesWithReplicas = new Set();
    if (!content) return replicas;
    const endCellKey = content[ck.endCell];
    if (endCellKey) {
      // This is a multi-cell content. Add all tiles between this cell and the
      // end cell (excluding the current tile) as replicas.
      const endCell = state.theMap.cells.get(endCellKey);
      for (let x = this.tile.x; x <= endCell.tile.x; x++) {
        for (let y = this.tile.y; y <= endCell.tile.y; y++) {
          if (x != this.tile.x || y != this.tile.y) {
            tilesWithReplicas.add(state.theMap.tiles.get(x + ',' + y));
          }
        }
      }
    }

    if (layer == ct.walls) {
      // Because walls cast shadows, any wall on the tile edge gets the
      // neighboring tiles as replicas.
      // This applies to walls not immediately on the tile edge if those are
      // angled walls, since they overflow.
      const maxDistanceFromEdgeForReplication =
          content[ck.variation] == ct.walls.smooth.angled.id ? 7 : 0;
      [
        {name: 'left', edges: ['offsetLeft'], x: -1, y: 0},
        {name: 'right', edges: ['offsetRight'], x: 1, y: 0},
        {name: 'top', edges: ['offsetTop'], x: 0, y: -1},
        {name: 'bottom', edges: ['offsetBottom'], x: 0, y: 1},
        {name: 'top-left', edges: ['offsetTop', 'offsetLeft'], x: -1, y: -1},
        {name: 'top-right', edges: ['offsetTop', 'offsetRight'], x: 1, y: -1},
        {name: 'bottom-left', edges: ['offsetBottom', 'offsetLeft'],
          x: -1, y: 1},
        {name: 'bottom-right', edges: ['offsetBottom', 'offsetRight'],
          x: 1, y: 1},
      ].forEach(dir => {
        for (let i = 0; i < dir.edges.length; i++) {
          const distanceFromEdge =
              Math.abs(this[dir.edges[i]] - this.tile[dir.name.split('-')[i]]);
          if (distanceFromEdge > maxDistanceFromEdgeForReplication) return;
        }
        // This cell is on the tile edge.
        const neighborCell = state.theMap.cells.get(
            CellMap.cellKey(this.row + dir.y, this.column + dir.x));
        if (!neighborCell) return;
        if (neighborCell.tile == this.tile) return;
        tilesWithReplicas.add(neighborCell.tile);
      });
    }

    // Just replicate those one tile over.
    if ((layer == ct.shapes && this.role != 'primary') ||
        (layer == ct.floors && this.role != 'primary' &&
         content[ck.kind] == ct.floors.pit.id) ||
        (layer == ct.mask)) {
      for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
          if (x == 0 && y == 0) continue;
          const neighborCell =
              state.theMap.getCell(this.row + y, this.column + x);
          if (!neighborCell) continue;
          if (neighborCell.tile == this.tile) continue;
          tilesWithReplicas.add(neighborCell.tile);
        }
      }
    }

    // Create replicas and set offsets on them.
    const replicas = [];
    tilesWithReplicas.forEach(tileWithReplica => {
      const replica = {
        tile: tileWithReplica,
        offsetLeft: 0,
        offsetRight: 0,
        offsetTop: 0,
        offsetBottom: 0,
      };

      if (this.tile.x < replica.tile.x) {
        replica.offsetLeft += replica.tile.width - this.tile.width;
        for (let x = this.tile.x + 1; x <= replica.tile.x; x++) {
          const tile = state.theMap.tiles.get(x + ',' + this.tile.y);
          replica.offsetLeft -= tile.width;
          replica.offsetRight += tile.width;
        }
      } else if (replica.tile.x < this.tile.x) {
        replica.offsetRight += replica.tile.width - this.tile.width;
        for (let x = replica.tile.x; x < this.tile.x; x++) {
          const tile = state.theMap.tiles.get(x + ',' + this.tile.y);
          replica.offsetLeft += tile.width;
          replica.offsetRight -= tile.width;
        }
      }
      if (this.tile.y < replica.tile.y) {
        replica.offsetTop += replica.tile.height - this.tile.height;
        for (let y = this.tile.y + 1; y <= replica.tile.y; y++) {
          const tile = state.theMap.tiles.get(this.tile.x + ',' + y);
          replica.offsetTop -= tile.height;
          replica.offsetBottom += tile.height;
        }
      } else if (replica.tile.y < this.tile.y) {
        replica.offsetBottom += replica.tile.height - this.tile.height;
        for (let y = replica.tile.y; y < this.tile.y; y++) {
          const tile = state.theMap.tiles.get(this.tile.x + ',' + y);
          replica.offsetTop += tile.height;
          replica.offsetBottom -= tile.height;
        }
      }
      replicas.push(replica);
    });
    return replicas;
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

  populateElementFromContent_(element, layer, content, isHighlight) {
    if (element) element.className = '';
    const kind = layer.children[content[ck.kind]];
    const variation = kind.children[content[ck.variation]];
    this.modifyElementClasses_(layer, content, element, 'add');
    this.setElementGeometryToGridElementGeometry_(
        element, layer, content, isHighlight);
    this.setText_(element, content[ck.text]);
    this.setImage_(element, content[ck.image], variation);
    this.setImageHash_(element, content[ck.imageHash], variation);
    this.setImageFromVariation_(element, layer, content);
    this.setMask_(element, layer, content);
    this.setShape_(element, layer, kind, variation, content[ck.connections]);
  }

  setShape_(element, layer, kind, variation, connections) {
    if (!element ||
        (layer != ct.shapes &&
         kind != ct.floors.pit &&
         kind != ct.stairs.passage)) {
      return;
    }
    element.innerHTML = '';
    let svgContent = null;
    if (layer == ct.shapes) {
      svgContent = createShapeSvgContent(kind, this.role, connections);
    } else if (kind == ct.floors.pit) {
      svgContent = createPitSvgContent(this.role, connections);
    } else if (kind == ct.stairs.passage) {
      svgContent = createPassageSvgContent(this.role, connections);
    }
    if (svgContent) {
      const svgElement =
          document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svgElement.setAttribute('width', element.offsetWidth);
      svgElement.setAttribute('height', element.offsetHeight);
      svgElement.style.position = 'absolute';
      svgElement.innerHTML = svgContent;
      element.appendChild(svgElement);
    }
  }

  setMask_(element, layer, content) {
    if (!element) return;
    let mask = null;
    if (layer == ct.walls && this.contentIsVariation_(
        content, ct.walls.smooth, ct.walls.smooth.angled)) {
      mask = createAngledWallSvgMask(content[ck.connections]);
    } else {
      const clipInclude = content[ck.clipInclude];
      const clipExclude = content[ck.clipExclude];
      if (clipInclude || clipExclude) {
        mask = this.createMaskSvgFromClip_(content, clipInclude, clipExclude);
      }
    }
    element.style.mask = mask;
    element.style['-webkit-mask'] = mask;
  }

  createMaskSvgFromClip_(element, clipInclude, clipExclude) {
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
    return 'url("data:image/svg+xml;utf8,' +
        "<svg xmlns='http://www.w3.org/2000/svg'>" +
        `<defs><mask id='m'>${shapes.join('')}</mask></defs>` +
        "<rect x='0' y='0' width='100%' height='100%' mask='url(%23m)' />" +
        '</svg>")';
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
        svgElement.style.width = width + 'px';
        svgElement.style.height = height + 'px';
        element.appendChild(svgElement);
      } else {
        const xhr = new XMLHttpRequest();
        xhr.open('get', imageUrl, true);
        xhr.onreadystatechange = () => {
          if (xhr.readyState != 4) return;
          const svgElement = xhr.responseXML.documentElement;
          svgElement.classList.add('image');
          svgElement.classList.add(...classNames);
          svgElement.style.width = width + 'px';
          svgElement.style.height = height + 'px';
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

  getBaseElementAndMaybeCreateAllElements(layer, initialContent, isHighlight) {
    const element = this.elements_.get(layer);
    if (element) return element;
    const elements = this.createElementsFromContent_(
        layer, initialContent, isHighlight);
    return elements.length >= 1 ? elements[0] : null;
  }

  getLayerElements_(layer) {
    const element = this.elements_.get(layer);
    if (!element) return [];
    return [element].concat(
        Array.from(this.replicatedElements_.get(layer).values()));
  }

  removeElements(layer, isHighlight) {
    const element = this.elements_.get(layer);
    if (!element) return;
    element.parentElement.removeChild(element);
    this.elements_.delete(layer);
    this.clearReplicas_(layer, isHighlight);
    this.modifyAffectedElementClasses_(layer, 'remove');
  }

  contentShouldHaveElement_(content) {
    // Either there's no content, or the content has a start cell, signalling
    // it should be rendered in another cell.
    return content && !content[ck.startCell];
  }

  updateElements_(layer, oldContent, newContent, isHighlight) {
    if (!this.contentShouldHaveElement_(newContent)) {
      this.removeElements(layer, isHighlight);
      return [];
    }
    let elements = [];
    const baseElement = this.elements_.get(layer);
    if (!baseElement) {
      elements = this.createElementsFromContent_(
          layer, newContent, isHighlight);
    } else {
      this.clearReplicas_(layer, isHighlight);
      elements = [baseElement].concat(
          this.createReplicas_(layer, newContent, isHighlight, baseElement));
    }
    elements.forEach(element => {
      this.modifyElementClasses_(layer, oldContent, element, 'remove');
      this.populateElementFromContent_(element, layer, newContent, isHighlight);
    });
    return elements;
  }

  updateLayerElementsToCurrentContent_(layer, isHighlight) {
    const content = this.getLayerContent(layer);
    this.updateElements_(layer, null, content, isHighlight);
  }

  updateAllElementsToCurrentContent() {
    ct.children.forEach(layer => {
      this.updateLayerElementsToCurrentContent_(layer, false);
    });
  }

  resetToDefault() {
    ct.children.forEach(layer => {
      this.setLayerContent(layer, null, true);
    });
  }

  onMouseEnter(e) {
    state.cursorStatusBar.showMessage(`x: ${this.column} y: ${this.row}`);
    if (!state.gesture) return;
    this.tile.enter();
    if (e.buttons == 0) {
      state.gesture.startHover(this);
    } else if (e.buttons == 1) {
      state.gesture.continueGesture(this);
    }
    e.stopPropagation();
  }

  onMouseLeave(e) {
    this.tile.exit();
    if (!state.gesture) {
      state.cursorStatusBar.hideMessage();
      return;
    }
    if (e.buttons == 0) {
      state.gesture.stopHover();
      state.cursorStatusBar.hideMessage();
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

  setElementGeometryToGridElementGeometry_(
      element, layer, content, isHighlight) {
    const endCellKey = content[ck.endCell];
    const endCell = endCellKey ? state.theMap.cells.get(endCellKey) : this;
    let baseOffsetRight = this.offsetRight - this.tile.right;
    let baseOffsetBottom = this.offsetBottom - this.tile.bottom;
    const tilesToRefresh = [];
    this.getReplicas_(layer, content).forEach(replica => {
      if (this.replicatedElements_.has(layer) &&
          this.replicatedElements_.get(layer).has(replica.tile) &&
          element == this.replicatedElements_.get(layer).get(replica.tile)) {
        // This element is a replica.
        baseOffsetRight += replica.offsetRight;
        baseOffsetBottom += replica.offsetBottom;
        tilesToRefresh.push(replica.tile);
      }
    });
    element.style.right =
        baseOffsetRight - (this.offsetRight - endCell.offsetRight);
    element.style.bottom =
        baseOffsetBottom - (this.offsetBottom - endCell.offsetBottom);
    if (layer == ct.walls) {
      // Set background offset.
      let backgroundOffsetLeft = -this.offsetLeft;
      let backgroundOffsetTop = -this.offsetTop;
      if (content[ck.variation] == ct.walls.smooth.angled.id) {
        backgroundOffsetLeft += 7;
        backgroundOffsetTop += 7;
      }
      element.style.backgroundPosition =
          `${backgroundOffsetLeft}px ${backgroundOffsetTop}px`;
    }
    tilesToRefresh.forEach(tile => {
      if (!isHighlight) {
        tile.invalidate();
      } else {
        if (isHighlight == 'showHighlight') {
          tile.showHighlight();
        } else {
          tile.hideHighlight();
        }
      }
    });
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
    const kind = layer.children[content[ck.kind]];
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
      if (className.includes('_OVER-WALL_')) {
        renamed = renamed.replace(/_OVER-WALL_/g,
            this.hasLayerContent(ct.walls) ? 'over-wall' : 'over-floor');
      }
      element.classList[addOrRemove](renamed);
    });
    this.modifyAffectedElementClasses_(layer, addOrRemove);
  }

  modifyAffectedElementClasses_(layer, addOrRemove) {
    if (layer == ct.walls) {
      // Need to fix any existing _OVER-WALL_ element; currently they can only
      // exist in the stairs layer.
      const replaceWhat = addOrRemove == 'add' ? /over-floor/g : /over-wall/g;
      const replaceWith = addOrRemove == 'add' ? 'over-wall' : 'over-floor';
      this.getLayerElements_(ct.stairs).forEach(stairsElement => {
        stairsElement.className =
            stairsElement.className.replace(replaceWhat, replaceWith);
      });
    }
  }

  showHighlight(layer, content) {
    this.tile.showHighlight();
    const existingContent = this.getLayerContent(layer);
    const action = existingContent && content ? 'editing' :
      (existingContent ? 'removing' : 'adding');
    const elements = content ?
      this.updateElements_(
          layer, this.getLayerContent(layer), content, 'showHighlight') :
      this.getLayerElements_(layer);
    if (elements.length == 0) return;
    elements.forEach(element => {
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
    });
  }

  hideHighlight(layer) {
    this.tile.hideHighlight();
    this.updateLayerElementsToCurrentContent_(layer, 'hideHighlight');
  }
}
