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
        state.recordCellChange(this.key, layer, oldContent, newContent);
      }
      this.updateElement_(layer, oldContent, newContent);
    }
  }

  hasLayerContent(layer) {
    return !!this.getLayerContent(layer);
  }

  isKind(layer, kind) {
    const content = this.getLayerContent(layer);
    return content && content[ck.kind] === kind.id;
  }

  createElementFromContent(layer, content) {
    if (!this.contentShouldHaveElement_(content)) return null;
    const element = createAndAppendDivWithClass(
        document.getElementById(layer.name + 'Layer'));
    this.modifyElementClasses_(layer, content, element, 'add');
    this.setElementGeometryToGridElementGeometry_(element, content);
    this.setText_(element, content[ck.text]);
    this.elements_.set(layer, element);
    return element;
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
    sizingElement.style.height = offsetHeight;
    sizingElement.innerHTML = text;
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
    theMapElement.removeChild(sizingElement);
    element.style.fontSize = fontSize + 'pt';
    element.innerHTML = text;
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
    this.gridElement.onmouseenter = (e) => {
      if (e.buttons == 0) {
        state.gesture.startHover(this);
      } else if (e.buttons == 1) {
        state.gesture.continueGesture(this);
      }
    };
    this.gridElement.onmouseleave = (e) => {
      if (e.buttons == 0) {
        state.gesture.stopHover();
      }
    };
    this.gridElement.onmousedown = (e) => {
      if (e.buttons == 1) {
        state.gesture.startGesture();
      }
    };
    this.gridElement.onmouseup = (e) => {
      state.gesture.stopGesture();
      state.gesture.startHover(this);
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
    const element = content ?
        this.updateElement_(layer, this.getLayerContent(layer), content) :
        this.elements_.get(layer);
    if (!element) return;
    element.className = element.className
        .replace(/_ADDING-REMOVING_/g, content ? 'adding' : 'removing')
        .replace(/_ADDING_/g, content ? 'adding' : '_ADDING_')
        .replace(/_REMOVING_/g, content ? '_REMOVING_' : 'removing');
  }

  hideHighlight(layer) {
    this.updateLayerElementToCurrentContent_(layer);
  }
}
