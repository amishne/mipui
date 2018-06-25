class ShapeGesture extends Gesture {
  constructor(layer, kind, variation) {
    super();
    this.layer_ = layer;
    this.kind_ = kind;
    this.variation_ = variation;
    this.mode_ = null;
    this.cellMasks_ = new Map();
    this.maskBits_ = layer == ct.shapes ? 4 : 8;
  }

  startHover(cell) {
    this.mode_ = cell.hasLayerContent(this.layer_) ? 'removing' : 'adding';
    this.populateCellMasks_(cell);
    this.showHighlight_();
  }

  stopHover() {
    this.hideHighlight_();
  }

  startGesture() {
    super.startGesture();
    this.hideHighlight_();
    this.apply_();
  }

  continueGesture(cell) {
    if (this.mode_ == 'removing' && !cell.hasLayerContent(this.layer_)) {
      // This is an attempt to remove content from a cell without content.
      return;
    }
    this.populateCellMasks_(cell);
    this.apply_();
  }

  stopGesture() {
    super.stopGesture();
    state.opCenter.recordOperationComplete();
  }

  apply_() {
    this.calcNewContent_().forEach((newContent, cell) => {
      const finalContent = this.calcFinalContent_(cell, newContent);
      cell.setLayerContent(this.layer_, finalContent, true);
    });
  }

  showHighlight_() {
    this.calcNewContent_().forEach((newContent, cell) => {
      const finalContent = this.calcFinalContent_(cell, newContent);
      cell.showHighlight(this.layer_, finalContent);
    });
  }

  calcFinalContent_(cell, content) {
    return content;
  }

  hideHighlight_() {
    this.cellMasks_.forEach((_, cell) => {
      cell.hideHighlight(this.layer_);
    });
  }

  calcNewContent_() {
    const result = new Map();
    this.cellMasks_.forEach((val, cell) => {
      if (val == null) {
        result.set(cell, null);
        return;
      }
      if (!cell.hasLayerContent(this.layer_)) {
        if (this.mode_ == 'removing') return;
        result.set(cell, {
          [ck.kind]: this.kind_.id,
          [ck.variation]: this.variation_.id,
          [ck.connections]: val,
        });
        return;
      }
      const existingContent = cell.getLayerContent(this.layer_);
      if (existingContent.hasOwnProperty(ck.connections)) {
        const existingConnections = existingContent[ck.connections];
        result.set(cell, {
          [ck.kind]: existingContent[ck.kind],
          [ck.variation]: existingContent[ck.variation],
          [ck.connections]:
              this.mode_ == 'adding' ?
                existingConnections | val : existingConnections & ~val,
        });
      } else {
        result.set(cell, {
          [ck.kind]: this.kind_.id,
          [ck.variation]: this.variation_.id,
          [ck.connections]: val,
        });
      }
    });
    return result;
  }

  // 128   1  16
  //   8       2
  //  64   4  32
  populateCellMasks_(cell) {
    this.cellMasks_ = new Map();
    if (this.mode_ == 'adding') {
      switch (cell.role) {
        case 'primary':
          this.populateCellMask_(cell, 0);
          break;
        case 'vertical':
          this.populateCellMask_(cell, 10);
          // Connect the left and right primaries.
          this.populateCellMask_(cell.getNeighbor('left'), 2);
          this.populateCellMask_(cell.getNeighbor('right'), 8);
          break;
        case 'horizontal':
          this.populateCellMask_(cell, 5);
          // Connect the top and bottom primaries.
          this.populateCellMask_(cell.getNeighbor('top'), 4);
          this.populateCellMask_(cell.getNeighbor('bottom'), 1);
          break;
        case 'corner':
          this.populateCellMask_(cell, 15);
          // Connect the surrounding primaries.
          this.populateCellMask_(cell.getNeighbor('top-right'), 76);
          this.populateCellMask_(cell.getNeighbor('bottom-right'), 137);
          this.populateCellMask_(cell.getNeighbor('bottom-left'), 19);
          this.populateCellMask_(cell.getNeighbor('top-left'), 38);
          // Connect the surrounding dividers.
          this.populateCellMask_(cell.getNeighbor('top', true), 14);
          this.populateCellMask_(cell.getNeighbor('right', true), 13);
          this.populateCellMask_(cell.getNeighbor('bottom', true), 11);
          this.populateCellMask_(cell.getNeighbor('left', true), 7);
          break;
      }
    } else {
      this.populateCellMask_(cell, null);
      switch (cell.role) {
        case 'primary':
          // Disconnect the surrounding primaries.
          this.populateCellMask_(cell.getNeighbor('top'), 4);
          this.populateCellMask_(cell.getNeighbor('right'), 8);
          this.populateCellMask_(cell.getNeighbor('bottom'), 1);
          this.populateCellMask_(cell.getNeighbor('left'), 2);
          // Remove the surrounding dividers.
          this.populateCellMask_(cell.getNeighbor('top', true), null);
          this.populateCellMask_(cell.getNeighbor('right', true), null);
          this.populateCellMask_(cell.getNeighbor('bottom', true), null);
          this.populateCellMask_(cell.getNeighbor('left', true), null);
          // Remove the surrounding corners.
          const topRightCorner = cell.getNeighbor('top-right', true);
          if (topRightCorner) this.removeCorner_(topRightCorner);
          const bottomRightCorner = cell.getNeighbor('bottom-right', true);
          if (bottomRightCorner) this.removeCorner_(bottomRightCorner);
          const bottomLeftCorner = cell.getNeighbor('bottom-left', true);
          if (bottomLeftCorner) this.removeCorner_(bottomLeftCorner);
          const topLeftCorner = cell.getNeighbor('top-left', true);
          if (topLeftCorner) this.removeCorner_(topLeftCorner);
          break;
        case 'vertical':
          // Disconnect the left and right primaries.
          this.populateCellMask_(cell.getNeighbor('left'), 2);
          this.populateCellMask_(cell.getNeighbor('right'), 8);
          // Remove the surrounding corners.
          const topCorner = cell.getNeighbor('top', true);
          if (topCorner) this.removeCorner_(topCorner);
          const bottomCorner = cell.getNeighbor('bottom', true);
          if (bottomCorner) this.removeCorner_(bottomCorner);
          break;
        case 'horizontal':
          // Disconnect the top and bottom primaries.
          this.populateCellMask_(cell.getNeighbor('top'), 4);
          this.populateCellMask_(cell.getNeighbor('bottom'), 1);
          // Remove the surrounding corners.
          const rightCorner = cell.getNeighbor('right', true);
          if (rightCorner) this.removeCorner_(rightCorner);
          const leftCorner = cell.getNeighbor('left', true);
          if (leftCorner) this.removeCorner_(leftCorner);
          break;
        case 'corner':
          this.removeCorner_(cell);
          break;
      }
    }
  }

  removeCorner_(cell) {
    this.populateCellMask_(cell, null);
    // Disconnect the surrounding dividers.
    this.populateCellMask_(cell.getNeighbor('top', true), 4);
    this.populateCellMask_(cell.getNeighbor('right', true), 8);
    this.populateCellMask_(cell.getNeighbor('bottom', true), 1);
    this.populateCellMask_(cell.getNeighbor('left', true), 2);
    // Disconnect the surrounding primaries.
    this.populateCellMask_(cell.getNeighbor('top-right'), 64);
    this.populateCellMask_(cell.getNeighbor('bottom-right'), 128);
    this.populateCellMask_(cell.getNeighbor('bottom-left'), 16);
    this.populateCellMask_(cell.getNeighbor('top-left'), 32);
  }

  populateCellMask_(cell, mask) {
    mask = mask == null ? null : (mask & ((1 << this.maskBits_) - 1));
    if (!cell) return mask;
    if (!this.cellMasks_.has(cell)) {
      this.cellMasks_.set(cell, mask);
    } else {
      const existingMask = this.cellMasks_.get(cell) || null;
      let newMask;
      if (this.mode_ == 'removing' && (mask == null || existingMask == null)) {
        newMask = null;
      } else {
        newMask = existingMask | mask;
      }
      this.cellMasks_.set(cell, newMask);
    }
    return mask;
  }
}
