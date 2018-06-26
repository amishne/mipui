class PassageGesture extends ShapeGesture {
  existsAndHasConnections_(cell) {
    return cell && cell.hasLayerContent(this.layer_) &&
        cell.getLayerContent(this.layer_).hasOwnProperty(ck.connections);
  }

  populateCellMasks_(cell) {
    this.cellMasks_ = new Map();
    let centerMask = 0;
    const top = cell.getNeighbor('top', cell.role != 'horizontal');
    const right = cell.getNeighbor('right', cell.role != 'vertical');
    const bottom = cell.getNeighbor('bottom', cell.role != 'horizontal');
    const left = cell.getNeighbor('left', cell.role != 'vertical');
    if (this.existsAndHasConnections_(top)) {
      centerMask |= 1;
      this.populateCellMask_(top, 4);
    }
    if (this.existsAndHasConnections_(right)) {
      centerMask |= 2;
      this.populateCellMask_(right, 8);
    }
    if (this.existsAndHasConnections_(bottom)) {
      centerMask |= 4;
      this.populateCellMask_(bottom, 1);
    }
    if (this.existsAndHasConnections_(left)) {
      centerMask |= 8;
      this.populateCellMask_(left, 2);
    }
    const topRight = cell.getNeighbor('top-right', cell.role == 'primary');
    const bottomRight =
        cell.getNeighbor('bottom-right', cell.role == 'primary');
    const bottomLeft = cell.getNeighbor('bottom-left', cell.role == 'primary');
    const topLeft = cell.getNeighbor('top-left', cell.role == 'primary');
    if (this.existsAndHasConnections_(topRight)) {
      centerMask |= 16;
      this.populateCellMask_(topRight, 64);
    }
    if (this.existsAndHasConnections_(bottomRight)) {
      centerMask |= 32;
      this.populateCellMask_(bottomRight, 128);
    }
    if (this.existsAndHasConnections_(bottomLeft)) {
      centerMask |= 64;
      this.populateCellMask_(bottomLeft, 16);
    }
    if (this.existsAndHasConnections_(topLeft)) {
      centerMask |= 128;
      this.populateCellMask_(topLeft, 32);
    }
    if (cell.role == 'corner' && this.mode_ == 'adding') {
      centerMask = 255;
      this.populateCellMask_(top, 2 | 4 | 8);
      this.populateCellMask_(topRight, 4 | 64 | 8);
      this.populateCellMask_(right, 1 | 4 | 8);
      this.populateCellMask_(bottomRight, 1 | 128 | 8);
      this.populateCellMask_(bottom, 1 | 2 | 8);
      this.populateCellMask_(bottomLeft, 1 | 16 | 2);
      this.populateCellMask_(left, 1 | 2 | 4);
      this.populateCellMask_(topLeft, 2 | 32 | 4);
    }
    this.populateCellMask_(cell, this.mode_ == 'removing' ? null : centerMask);
  }
}
