class AngledWallGesture extends ShapeGesture {
  constructor(layer, kind, variation) {
    super(layer, kind, variation);
    this.wallRemovingGesture_ = new WallGesture(1, false);
    this.wallRemovingGesture_.toWall = false;
  }

  populateCellMasks_(cell) {
    this.cellMasks_ = new Map();
    if (!cell) return;
    switch (cell.role) {
      case 'primary':
        // Create mask reflecting existing walls.
        this.populateCellMask_(cell, this.mode_ == 'adding' ? 0 : null);
        break;
      case 'vertical':
        // Can't apply to dividers adjuscent to square walls.
        if (this.isAnySquare_(
            [cell.getNeighbor('right'), cell.getNeighbor('left')])) {
          break;
        }
        this.populateCellMask_(cell, this.mode_ == 'adding' ? 0 : null);
        // Connect the top and bottom corners.
        this.populateCellMask_(cell.getNeighbor('top', true), 4);
        this.populateCellMask_(cell.getNeighbor('bottom', true), 1);
        // Connect the left and right primaries.
        this.populateCellMask_(cell.getNeighbor('left'), 2);
        this.populateCellMask_(cell.getNeighbor('right'), 8);
        break;
      case 'horizontal':
        // Can't apply to dividers adjuscent to square walls.
        if (this.isAnySquare_(
            [cell.getNeighbor('top'), cell.getNeighbor('bottom')])) {
          break;
        }
        this.populateCellMask_(cell, this.mode_ == 'adding' ? 5 : null);
        // Connect the left and right corners.
        this.populateCellMask_(cell.getNeighbor('left', true), 2);
        this.populateCellMask_(cell.getNeighbor('right', true), 8);
        // Connect the top and bottom primaries.
        this.populateCellMask_(cell.getNeighbor('top'), 4);
        this.populateCellMask_(cell.getNeighbor('bottom'), 1);
        break;
      case 'corner':
        this.populateCellMask_(cell, this.mode_ == 'adding' ? 0 : null);
        // Connect primaries
        this.connectIfWallOrWillBecomeWall_(cell.getNeighbor('top-right'), 64);
        this.connectIfWallOrWillBecomeWall_(
            cell.getNeighbor('bottom-right'), 128);
        this.connectIfWallOrWillBecomeWall_(cell.getNeighbor('bottom-left'), 16);
        this.connectIfWallOrWillBecomeWall_(cell.getNeighbor('top-left'), 32);
        break;
    }
  }

  connectIfWallOrWillBecomeWall_(cell, mask) {
    if (!cell) return;
    if (cell.isKind(this.layer_, this.kind_) || this.cellMasks_.has(cell)) {
      this.populateCellMask_(cell, mask);
    }
  }

  populateCellMaskIfWall_() {
    if (this.isNeighborWall_(cell)) {
      this.populateCellMask_(neighbor, mask);
    }
  }

  isNeighborWall_(cell, dir) {
    if (!cell) return false;
    let divider = null;
    switch (cell.role) {
      case 'primary':
      case 'corner':
        divider = true;
        break;
      case 'horizontal':
        divider = dir == 'right' || dir == 'left';
        break;
      case 'vertical':
        divider = dir == 'top' || dir == 'bootom';
        break;
    }
    const neighbor = cell.getNeighbor(dir, divider);
    if (!neighbor) return false;
    return neighbor.isKind(this.layer_, this.kind_) ||
        this.cellMasks_.get(neighbor) != null;
  }

  populateCellMask_(cell, mask) {
    if (!cell) return;
    // Update mask to reflect existing square walls before proceeding to set it.
    if (this.isNeighborWall_(cell, 'top')) mask |= 1;
    if (this.isNeighborWall_(cell, 'right')) mask |= 2;
    if (this.isNeighborWall_(cell, 'bottom')) mask |= 4;
    if (this.isNeighborWall_(cell, 'left')) mask |= 8;
    if (this.isNeighborWall_(cell, 'top-right')) mask |= 16;
    if (this.isNeighborWall_(cell, 'bottom-right')) mask |= 32;
    if (this.isNeighborWall_(cell, 'bottom-left')) mask |= 64;
    if (this.isNeighborWall_(cell, 'top-left')) mask |= 128;
    return super.populateCellMask_(cell, mask);
  }

  isAnySquare_(cells) {
    return cells.some(cell => {
      return cell != null &&
          cell.isVariation(
              this.layer_, ct.walls.smooth, ct.walls.smooth.square);
    });
  }

  calcFinalContent_(cell, content) {
    if (!cell || !content) return null;
    let connections = content[ck.connections];
    const connectionlessContent = {
      [ck.kind]: ct.walls.smooth.id,
      [ck.variation]: ct.walls.smooth.square.id,
    };
    switch (cell.role) {
      case 'primary':
        if (connections == 0 && this.mode_ == 'removing') return null;
        if (connections == 255) return connectionlessContent;
        return content;
      case 'corner':
      case 'horizontal':
      case 'vertical':
        return this.mode_ == 'adding' ? connectionlessContent : null;
    }
  }
}