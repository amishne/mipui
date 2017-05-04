class NoncardinalWallGesture extends ShapeGesture {
  constructor(layer, kind, variation) {
    super(layer, kind, variation);
    this.wallRemovingGesture_ = new WallGesture(1, false);
    this.wallRemovingGesture_.toWall = false;
  }

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

  populateCellMasks_(cell) {
    super.populateCellMasks_(cell);
  }

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
        super.populateCellMask_(cell.getNeighbor('left', true), 2);
        super.populateCellMask_(cell.getNeighbor('right', true), 8);
        break;
      case 'vertical':
        if (this.isAnySquare_(
            [cell.getNeighbor('right'),
            cell.getNeighbor('left')])) {
          break;
        }
        super.populateCellMask_(cell, mask);
        // Set mask on neighboring corners:
        super.populateCellMask_(cell.getNeighbor('top', true), 4);
        super.populateCellMask_(cell.getNeighbor('bottom', true), 1);
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
        if (cell.role == 'primary' && mask % 5 != 0) {
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
  
  isAnySquare_(cells) {
    return cells.some(cell =>
        cell.isVariation(this.layer_, ct.walls.smooth, ct.walls.smooth.square));
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
        return (connections == 5 || connections == 10 || connections == 15) ?
            connectionlessContent : content;
      case 'corner':
        if (connections == 5 || connections == 10 ||
            connections == 0 || connections == 15) {
            return connectionlessContent;
        }
        return content;
      case 'horizontal':
      case 'vertical':
        return connectionlessContent;
    }
  }
}