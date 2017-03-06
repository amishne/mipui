class BlobGesture extends Gesture {
  constructor(kind, variation) {
    super();
    this.kind_ = kind;
    this.variation_ = variation;
    this.previousCell_ = null;
    this.mode_ = null;
  }

  startHover(cell) {
    if (!this.isCellEligible_(cell)) return;
    this.hoveredCell_ = cell;
    this.mode_ = cell.hasLayerContent(ct.blobs) ? 'removing' : 'adding';
    this.showHighlight_()
  }

  stopHover() {
    if (!this.hoveredCell_) return;
    this.hideHighlight_();
  }

  startGesture() {
    if (this.mode_ == 'adding' &&
        !this.hoveredCell_.isKind(ct.blobs, this.kind_)) {
      this.hoveredCell_.setLayerContent(
          ct.blobs, this.createContent_(false, false, false, false), true);
    } else {
      this.hoveredCell_.setLayerContent(ct.blobs, null, true);
      // Disconnect neighbors.
      [
        this.createDisconnectedContent_(this.hoveredCell_, 'top', 4),
        this.createDisconnectedContent_(this.hoveredCell_, 'right', 8),
        this.createDisconnectedContent_(this.hoveredCell_, 'bottom', 1),
        this.createDisconnectedContent_(this.hoveredCell_, 'left', 2),
      ].forEach(result => {
        if (!result) return;
        result.neighbor.setLayerContent(ct.blobs, result.content, true);
      });
    }
    this.previousCell_ = this.hoveredCell_;
  }

  continueGesture(cell) {
    if (!this.isCellEligible_(cell)) return;
    this.hideHighlight_();
    if (this.mode_ == 'adding') {
      if (!cell.isKind(ct.blobs, this.kind_)) {
        cell.setLayerContent(
            ct.blobs, this.createContent_(false, false, false, false), true);
        // Disconnect neighbors.
        [
          this.createDisconnectedContent_(cell, 'top', 4),
          this.createDisconnectedContent_(cell, 'right', 8),
          this.createDisconnectedContent_(cell, 'bottom', 1),
          this.createDisconnectedContent_(cell, 'left', 2),
        ].forEach(result => {
          if (!result) return;
          result.neighbor.setLayerContent(ct.blobs, result.content, true);
        });
      }
      this.connect_(this.previousCell_, cell);
    } else {
      cell.setLayerContent(ct.blobs, null, true);
      // Disconnect neighbors.
      [
        this.createDisconnectedContent_(cell, 'top', 4),
        this.createDisconnectedContent_(cell, 'right', 8),
        this.createDisconnectedContent_(cell, 'bottom', 1),
        this.createDisconnectedContent_(cell, 'left', 2),
      ].forEach(result => {
        if (!result) return;
        result.neighbor.setLayerContent(ct.blobs, result.content, true);
      });
    }
    this.previousCell_ = cell;
  }

  stopGesture() {
    this.previousCell_ = null;
    state.opCenter.recordOperationComplete();
  }

  isCellEligible_(cell) {
    return cell.role == 'primary';
  }

  showHighlight_() {
    if (this.mode_ == 'adding') {
      this.hoveredCell_.showHighlight(
          ct.blobs, this.createContent_(false, false, false, false));
    } else {
      // Empty highlight for the targeted cell.
      this.hoveredCell_.showHighlight(ct.blobs, null);
      // Disconnect neighbors.
      [
        this.createDisconnectedContent_(this.hoveredCell_, 'top', 4),
        this.createDisconnectedContent_(this.hoveredCell_, 'right', 8),
        this.createDisconnectedContent_(this.hoveredCell_, 'bottom', 1),
        this.createDisconnectedContent_(this.hoveredCell_, 'left', 2),
      ].forEach(result => {
        if (!result) return;
        result.neighbor.showHighlight(ct.blobs, result.content);
      });
    }
  }

  hideHighlight_() {
    this.hoveredCell_.hideHighlight(ct.blobs);
    if (this.mode_ == 'removing') {
      ['top', 'right', 'bottom', 'left'].forEach(dir => {
        const cells = this.hoveredCell_.getNeighbors(dir).cells;
        if (cells && cells.length > 0) {
          cells[0].hideHighlight(ct.blobs);
        }
      });
    }
  }

  createContent_(top, right, bottom, left) {
    return {
      [ck.kind]: this.kind_.id,
      [ck.variation]: this.variation_.id,
      [ck.connections]: top + right * 2 + bottom * 4 + left * 8,
    }
  }

  createDisconnectedContent_(cell, neighborDir, mask) {
    const cells = cell.getNeighbors(neighborDir).cells;
    if (!cells || cells.length == 0) return null;
    const neighbor = cells[0];
    const neighborContent = cells[0].getLayerContent(ct.blobs);
    if (!neighborContent || !neighborContent[ck.connections] ||
        !neighborContent[ck.connections] | mask == 0) {
      return null;
    }
    return {
      neighbor,
      content: {
        [ck.kind]: neighborContent[ck.kind],
        [ck.variation]: neighborContent[ck.variation],
        [ck.connections]: neighborContent[ck.connections] & ~mask,
      }
    }
  }

  connect_(cell1, cell2) {
    const masks = [];
    const dir = this.findDirection_(cell1, cell2);
    switch (dir) {
      case 'left-to-right': masks[0] = 2; masks[1] = 8; break;
      case 'top-to-bottom': masks[0] = 4; masks[1] = 1; break;
      case 'right-to-left': masks[0] = 8; masks[1] = 2; break;
      case 'bottom-to-top': masks[0] = 1; masks[1] = 4; break;
    }
    masks.forEach((mask, index) => {
      const cell = [cell1, cell2][index];
      const content = cell.getLayerContent(ct.blobs);
      cell.setLayerContent(ct.blobs, {
        [ck.kind]: content[ck.kind],
        [ck.variation]: content[ck.variation],
        [ck.connections]: content[ck.connections] | mask,
      }, true);
    });
  }

  findDirection_(cell1, cell2) {
    if (cell1.getNeighbors('top').cells.includes(cell2)) {
      return 'bottom-to-top';
    }
    if (cell1.getNeighbors('right').cells.includes(cell2)) {
      return 'left-to-right';
    }
    if (cell1.getNeighbors('bottom').cells.includes(cell2)) {
      return 'top-to-bottom';
    }
    if (cell1.getNeighbors('left').cells.includes(cell2)) {
      return 'right-to-left';
    }
    return null;
  }
}