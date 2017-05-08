class NoncardinalWallGesture extends ShapeGesture {
  constructor(layer, kind, variation) {
    super(layer, kind, variation);
    this.wallRemovingGesture_ = new WallGesture(1, false);
    this.wallRemovingGesture_.toWall = false;
  }
/*
  startHover(cell) {
    this.mode_ = cell.hasLayerContent(this.layer_) ? 'removing' : 'adding';
    if (this.mode_ == 'adding') {
      super.startHover(cell);
    } else {
      this.wallRemovingGesture_.startHover(cell);
    }
  }

  stopHover() {
    if (this.mode_ == 'adding') {
      super.stopHover();
    } else {
      this.wallRemovingGesture_.stopHover();
    }
  }

  startGesture() {
    if (this.mode_ == 'adding') {
      super.startGesture();
    } else {
      this.wallRemovingGesture_.startGesture();
    }
  }

  continueGesture(cell) {
    if (this.mode_ == 'adding') {
      super.continueGesture(cell);
    } else {
      this.wallRemovingGesture_.continueGesture(cell);
    }
  }

  stopGesture() {
    if (this.mode_ == 'adding') {
      super.stopGesture();
    } else {
      this.wallRemovingGesture_.stopGesture();
    }
  }
*/

  populateCornerMask_(cell, primaryDir1, mask1, primaryDir2, mask2) {
    if (primaryDir1 == primaryDir2) return;
    const layer = this.layer_;
    const kind = this.kind_;
    if (!cell || !cell.isKind(layer, kind)) return;
    this.populateCellMask_(cell, primaryDir1 ? mask1 : mask2);
  }

  populateCellMasks_(cell) {
    this.cellMasks_ = new Map();
    if (!cell) return;
    if (this.mode_ == 'adding' || this.mode_ == 'removing') {
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
          this.populateCellMask_(cell.getNeighbor('top-right', true), null);
          this.populateCellMask_(cell.getNeighbor('bottom-right', true), null);
          this.populateCellMask_(cell.getNeighbor('bottom-left', true), null);
          this.populateCellMask_(cell.getNeighbor('top-left', true), null);
          break;
        case 'vertical':
          // Disconnect the left and right primaries.
          this.populateCellMask_(cell.getNeighbor('left'), 2);
          this.populateCellMask_(cell.getNeighbor('right'), 8);
          // Disconnect the top and bottom dividers.
          this.populateCellMask_(cell.getNeighbor('top-same'), 4);
          this.populateCellMask_(cell.getNeighbor('bottom-same'), 1);
          // Remove the top corner, and disconnect its surrounding horizontal
          // dividers.
          const topCorner = cell.getNeighbor('top', true);
          if (topCorner) {
            this.populateCellMask_(topCorner, null);
            this.populateCellMask_(topCorner.getNeighbor('right', true), 8);
            this.populateCellMask_(topCorner.getNeighbor('left', true), 2);
          }
          // Remove the bottom corner, and disconnect its surrounding horizontal
          // dividers.
          const bottomCorner = cell.getNeighbor('bottom', true);
          if (bottomCorner) {
            this.populateCellMask_(bottomCorner, null);
            this.populateCellMask_(bottomCorner.getNeighbor('right', true), 8);
            this.populateCellMask_(bottomCorner.getNeighbor('left', true), 2);
          }
          break;
        case 'horizontal':
          // Disconnect the top and bottom primaries.
          this.populateCellMask_(cell.getNeighbor('top'), 4);
          this.populateCellMask_(cell.getNeighbor('bottom'), 1);
          // Disconnect the right and left dividers.
          this.populateCellMask_(cell.getNeighbor('right-same'), 8);
          this.populateCellMask_(cell.getNeighbor('left-same'), 2);
          // Remove the right corner, and disconnect its surrounding vertical
          // dividers.
          const rightCorner = cell.getNeighbor('right', true);
          if (rightCorner) {
            this.populateCellMask_(rightCorner, null);
            this.populateCellMask_(rightCorner.getNeighbor('top', true), 4);
            this.populateCellMask_(rightCorner.getNeighbor('bottom', true), 1);
          }
          // Remove the left corner, and disconnect its surrounding vertical
          // dividers.
          const leftCorner = cell.getNeighbor('left', true);
          if (leftCorner) {
            this.populateCellMask_(leftCorner, null);
            this.populateCellMask_(leftCorner.getNeighbor('top', true), 4);
            this.populateCellMask_(leftCorner.getNeighbor('bottom', true), 1);
          }
          break;
        case 'corner':
          // Disconnect the surrounding dividers.
          this.populateCellMask_(cell.getNeighbor('top', true), 4);
          this.populateCellMask_(cell.getNeighbor('right', true), 8);
          this.populateCellMask_(cell.getNeighbor('bottom', true), 1);
          this.populateCellMask_(cell.getNeighbor('left', true), 2);
          break;
      }
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
    // Don't apply a corner connection if the opposite side is a wall.
    if (cell.role == 'corner') {
      if (((mask & 1) != 0 && this.isNeighborWall_(cell, 'bottom')) ||
          ((mask & 2) != 0 && this.isNeighborWall_(cell, 'left')) ||
          ((mask & 4) != 0 && this.isNeighborWall_(cell, 'top')) ||
          ((mask & 8) != 0 && this.isNeighborWall_(cell, 'right'))) {
        return super.populateCellMask_(cell, 0);
      }
    }

    // Update mask to reflect existing square walls before proceeding to set it.
    if (this.isNeighborWall_(cell, 'top')) mask |= 1;
    if (this.isNeighborWall_(cell, 'right')) mask |= 2;
    if (this.isNeighborWall_(cell, 'bottom')) mask |= 4;
    if (this.isNeighborWall_(cell, 'left')) mask |= 8;
    return super.populateCellMask_(cell, mask);
  }
/*
  populateCellMask_(cell, mask) {
    if (!cell) return;
    switch (cell.role) {
      case 'horizontal':
        if (this.isAnySquare_(
            [cell.getNeighbor('top'),
            cell.getNeighbor('bottom')])) {
          break;
        }
        super.populateCellMask_(cell, mask);
        // Set mask on neighboring corners:
        this.populateCellMask_(cell.getNeighbor('left', true), 2);
        this.populateCellMask_(cell.getNeighbor('right', true), 8);
        break;
      case 'vertical':
        if (this.isAnySquare_(
            [cell.getNeighbor('right'),
            cell.getNeighbor('left')])) {
          break;
        }
        super.populateCellMask_(cell, mask);
        // Set mask on neighboring corners:
        this.populateCellMask_(cell.getNeighbor('top', true), 4);
        this.populateCellMask_(cell.getNeighbor('bottom', true), 1);
        break;
      case 'primary':
      case 'corner':
        if (mask != null) {
          // Modify the mask according to surrouding walls.
          const layer = this.layer_;
          const kind = ct.walls.smooth;
          if (cell.getNeighbor('top', true).isKind(layer, kind)) mask |= 1;
          if (cell.getNeighbor('right', true).isKind(layer, kind)) mask |= 2;
          if (cell.getNeighbor('bottom', true).isKind(layer, kind)) mask |= 4;
          if (cell.getNeighbor('left', true).isKind(layer, kind)) mask |= 8;
        }
        super.populateCellMask_(cell, mask);
        if (cell.role == 'primary') {
          // Update corners.
          if (!(mask & 8) != !(mask & 4)) {
            const corner = cell.getNeighbor('bottom-left', true);
            if (corner && corner.hasLayerContent(ct.walls)) {
              this.populateCellMask_(corner, 0);
            }
          }
          if (!(mask & 2) != !(mask & 4)) {
            const corner = cell.getNeighbor('bottom-right', true);
            if (corner && corner.hasLayerContent(ct.walls)) {
              this.populateCellMask_(corner, 0);
            }
          }
          if (!(mask & 1) != !(mask & 2)) {
            const corner = cell.getNeighbor('top-right', true);
            if (corner && corner.hasLayerContent(ct.walls)) {
              this.populateCellMask_(corner, 0);
            }
          }
          if (!(mask & 1) != !(mask & 8)) {
            const corner = cell.getNeighbor('top-left', true);
            if (corner && corner.hasLayerContent(ct.walls)) {
              this.populateCellMask_(corner, 0);
            }
          }
        }
        break;
    }
  }
*/
  isAnySquare_(cells) {
    return cells.some(cell => {
      return cell != null &&
          cell.isVariation(
              this.layer_, ct.walls.smooth, ct.walls.smooth.square);
    });
  }

  calcFinalContent_(cell, content) {
    if (!content) return null;
    const connections = content[ck.connections];
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