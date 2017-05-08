class NoncardinalWallGesture extends ShapeGesture {
  constructor(layer, kind, variation) {
    super(layer, kind, variation);
    this.wallRemovingGesture_ = new WallGesture(1, false);
    this.wallRemovingGesture_.toWall = false;
  }

  populateCornerMask_(cell, primaryDir1, mask1, primaryDir2, mask2) {
    if (primaryDir1 == primaryDir2) return;
    const layer = this.layer_;
    const kind = this.kind_;
    if (!cell || !cell.isKind(layer, kind)) return;
    let mask = primaryDir1 ? mask1 : mask2;
    this.populateCellMask_(cell, mask);
  }

  populateCellMasks_(cell) {
    this.cellMasks_ = new Map();
    if (!cell) return;
    switch (cell.role) {
      case 'primary':
        // Create mask reflecting existing walls.
        const layer = this.layer_;
        const kind = this.kind_;
        let mask = this.populateCellMask_(cell, this.mode_ == 'adding' ? 0 : null);
        // Update corners.
        const mask1 = (mask & 1) == 0;
        const mask2 = (mask & 2) == 0;
        const mask4 = (mask & 4) == 0;
        const mask8 = (mask & 8) == 0;
        this.populateCornerMask_(
            cell.getNeighbor('bottom-left', true), mask8, 2, mask4, 1);
        this.populateCornerMask_(
            cell.getNeighbor('bottom-right', true), mask2, 8, mask4, 1);
        this.populateCornerMask_(
            cell.getNeighbor('top-right', true), mask1, 4, mask2, 8);
        this.populateCornerMask_(
            cell.getNeighbor('top-left', true), mask1, 4, mask8, 2);
        break;
      case 'vertical':
        // Can't apply to dividers adjuscent to square walls.
        if (this.isAnySquare_(
            [cell.getNeighbor('right'), cell.getNeighbor('left')])) {
          break;
        }
        this.populateCellMask_(cell, this.mode_ == 'adding' ? 10 : null);
        // Connect the left and right primaries.
        this.populateCellMask_(cell.getNeighbor('left'), 2);
        this.populateCellMask_(cell.getNeighbor('right'), 8);
        // Connect the top and bottom corners.
        this.populateCellMask_(cell.getNeighbor('top', true), 4);
        this.populateCellMask_(cell.getNeighbor('bottom', true), 1);
        break;
      case 'horizontal':
        // Can't apply to dividers adjuscent to square walls.
        if (this.isAnySquare_(
            [cell.getNeighbor('top'), cell.getNeighbor('bottom')])) {
          break;
        }
        this.populateCellMask_(cell, this.mode_ == 'adding' ? 5 : null);
        // Connect the top and bottom primaries.
        this.populateCellMask_(cell.getNeighbor('top'), 4);
        this.populateCellMask_(cell.getNeighbor('bottom'), 1);
        // Connect the left and right corners.
        this.populateCellMask_(cell.getNeighbor('left', true), 2);
        this.populateCellMask_(cell.getNeighbor('right', true), 8);
        break;
      case 'corner':
        // Corners can't be targeted.
        break;
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
    return neighbor.isKind(this.layer_, this.kind_);
  }

  populateCellMask_(cell, mask) {
    if (!cell) return;
    // Don't apply a corner connection if the opposite side is a wall.
    if (cell.role == 'corner') {
      if (((mask & 1) != 0 && this.isNeighborWall_(cell, 'bottom')) ||
          ((mask & 2) != 0 && this.isNeighborWall_(cell, 'left')) ||
          ((mask & 4) != 0 && this.isNeighborWall_(cell, 'top')) ||
          ((mask & 8) != 0 && this.isNeighborWall_(cell, 'right'))) {
        return super.populateCellMask_(cell, 15);
      }
    }

    // Update mask to reflect existing square walls before proceeding to set it.
    if (this.isNeighborWall_(cell, 'top')) mask |= 1;
    if (this.isNeighborWall_(cell, 'right')) mask |= 2;
    if (this.isNeighborWall_(cell, 'bottom')) mask |= 4;
    if (this.isNeighborWall_(cell, 'left')) mask |= 8;
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
        if (connections == 15) return connectionlessContent;
        return content;
      case 'corner':
        if (this.mode_ == 'removing') {
          let numConnections = 0;
          if (this.isNeighborWall_(cell, 'top')) numConnections++;
          if (this.isNeighborWall_(cell, 'right')) numConnections++;
          if (this.isNeighborWall_(cell, 'bottom')) numConnections++;
          if (this.isNeighborWall_(cell, 'left')) numConnections++;
          if (numConnections >= 2) connections = 15;
        }
        if (connections == 15) return connectionlessContent;
        if (connections == 0) {
          return this.mode_ == 'adding' ? connectionlessContent : null;
        }
        return content;
      case 'horizontal':
      case 'vertical':
        return this.mode_ == 'adding' ? connectionlessContent : null;
    }
  }
}