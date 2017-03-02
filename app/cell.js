class Cell {
  constructor(key, role, gridElement) {
    this.key = key;
    this.role = role;
    this.gridElement = gridElement;
    this.offsetLeft = null;
    this.offsetTop = null;
    this.width = null;
    this.height = null;
    this.offsetRight = null;
    this.offsetBottom = null;

    // Primary cells only.
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
    return state.getLayerContent(this.key, layer);
  }

  setLayerContent(layer, content, recordChange) {
    const oldContent = this.getLayerContent(layer);
    state.setLayerContent(this.key, layer, content);
    const newContent = this.getLayerContent(layer);
    if (!sameContent(oldContent, newContent)) {
      if (recordChange) {
        state.opCenter.
            recordCellChange(this.key, layer, oldContent, newContent);
      }
      this.updateElement_(layer, oldContent, newContent);
    }
  }

  hasLayerContent(layer) {
    return !!this.getLayerContent(layer);
  }

  isKind(layer, kind) {
    const content = this.getLayerContent(layer);
    return content ? content[ck.kind] === kind.id : false;
  }

  getVal(layer, contentKey) {
    const content = this.getLayerContent(layer);
    return content ? content[contentKey] : null;
  }

  createElementFromContent(layer, content) {
    if (!this.contentShouldHaveElement_(content)) return null;
    const element = createAndAppendDivWithClass(
        document.getElementById(layer.name + 'Layer'));
    this.modifyElementClasses_(layer, content, element, 'add');
    this.setElementGeometryToGridElementGeometry_(element, content);
    this.setText_(element, content[ck.text]);
    this.setImage_(element, content[ck.image]);
    this.elements_.set(layer, element);
    return element;
  }

  // Returns all the cells in a square between this cell and 'cell', in row
  // and then col order.
  getPrimaryCellsInSquareTo(cell) {
    if (!cell || !this.role == 'primary' || !cell.role == 'primary') return [];

    const startCellKey =
        TheMap.primaryCellKey(
            Math.min(this.row, cell.row), Math.min(this.column, cell.column));
    const endCellKey =
        TheMap.primaryCellKey(
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
    // sizingElement.style.height = offsetHeight;
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

  setImage_(element, imageUrl) {
    if (!element || !imageUrl) return;
    const width = element.offsetWidth;
    const height = element.offsetHeight;
    element.innerHTML = `<img class="image" src="${imageUrl}" ` +
        `style="width: ${width}px; height: ${height}px; alt="">`;
  }

  getOrCreateLayerElement(layer, initialContent) {
    let element = this.elements_.get(layer);
    if (!element) {
      element = this.createElementFromContent(layer, initialContent);
    }
    return element;
  }

  removeElement(layer) {
    let element = this.elements_.get(layer);
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
      return;
    }
    const element = this.getOrCreateLayerElement(layer, newContent);
    this.modifyElementClasses_(layer, oldContent, element, 'remove');
    this.modifyElementClasses_(layer, newContent, element, 'add');
    this.setElementGeometryToGridElementGeometry_(element, newContent);
    this.setText_(element, newContent[ck.text]);
    this.setImage_(element, newContent[ck.image]);
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
        this.modifyElementClasses_(layer, content, element, 'add');
        this.setElementGeometryToGridElementGeometry_(element, content);
        this.setText_(element, content[ck.text]);
        this.setImage_(element, content[ck.image]);
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

  wireInteractions_() {
    // All grid element interactions stop the event from bubbling up.
    this.gridElement.onmouseenter = (e) => {
      if (e.buttons == 0) {
        state.gesture.startHover(this);
      } else if (e.buttons == 1) {
        state.gesture.continueGesture(this);
      }
      e.stopPropagation();
    };
    this.gridElement.onmouseleave = (e) => {
      if (e.buttons == 0) {
        state.gesture.stopHover();
      }
      e.stopPropagation();
    };
    this.gridElement.onmousedown = (e) => {
      if (e.buttons == 1) {
        state.gesture.startGesture();
      }
      e.stopPropagation();
    };
    this.gridElement.onmouseup = (e) => {
      if (e.buttons == 0) {
        state.gesture.stopGesture();
      }
      state.gesture.startHover(this);
      e.stopPropagation();
    };
  }

  setElementGeometryToGridElementGeometry_(element, content) {
    const endCellKey = content[ck.endCell];
    const endCell = endCellKey ? state.theMap.cells.get(endCellKey) : this;
    element.style.top = this.offsetTop;
    element.style.right = endCell.offsetRight;
    element.style.bottom = endCell.offsetBottom;
    element.style.left = this.offsetLeft;
  }

  addNeighborKey(direction, dividerKey, cellKeys) {
    this.neighborKeys_.set(direction, {
      dividerKey: dividerKey,
      cellKeys : cellKeys,
    });
  }

  getNeighbors(direction) {
    const neighborKeysInDirection = this.neighborKeys_.get(direction);
    if (!neighborKeysInDirection) return null;
    return {
      dividerCell:
          state.theMap.cells.get(neighborKeysInDirection.dividerKey),
      cells: neighborKeysInDirection.cellKeys
          .map(cellKey => { return state.theMap.cells.get(cellKey); })
          .filter(cell => !!cell),
    }
  }

  getAllNeighbors() {
    const neighbors = [];
    for (let direction of this.neighborKeys_.keys()) {
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
      element.classList[addOrRemove](className.replace(/_ROLE_/g, this.role));
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
    if (action == 'adding' || (content && layer == ct.terrain)) {
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
