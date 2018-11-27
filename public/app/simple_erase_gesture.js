// This only blindly removed content, use erase_gesture for full removal.
class SimpleEraseGesture extends Gesture {
  constructor(layer) {
    super();
    this.layer_ = layer;
    this.affectedCells_ = [];
  }

  startHover(cell) {
    if (!cell) return;
    this.affectedCells_ = this.calcAffectedCells_(cell);
    this.affectedCells_.forEach(affectedCell => {
      affectedCell.showHighlight(this.layer_, null);
    });
  }

  stopHover() {
    this.affectedCells_.forEach(affectedCell => {
      affectedCell.hideHighlight(this.layer_);
    });
    this.affectedCells_ = [];
  }

  startGesture() {
    super.startGesture();
    this.affectedCells_.forEach(affectedCell => {
      affectedCell.setLayerContent(this.layer_, null, true);
    });
  }

  continueGesture(cell) {
    if (!cell) return;
    this.affectedCells_ = this.calcAffectedCells_(cell);
    this.affectedCells_.forEach(affectedCell => {
      affectedCell.setLayerContent(this.layer_, null, true);
    });
  }

  stopGesture() {
    super.stopGesture();
    this.affectedCells_ = [];
    state.opCenter.recordOperationComplete();
  }

  calcAffectedCells_(cell) {
    const targetCell = this.calculateTargetCell_(cell);
    if (!targetCell.hasLayerContent(this.layer_)) {
      return [];
    }
    if (targetCell.role != 'primary') {
      return [cell];
    }
    const targetCellContent = targetCell.getLayerContent(this.layer_);
    let startCell = targetCell;
    if (targetCellContent[ck.startCell]) {
      startCell = state.theMap.cells.get(targetCellContent[ck.startCell]);
    }
    const startCellContent = startCell.getLayerContent(this.layer_);
    let endCell = startCell;
    if (startCellContent[ck.endCell]) {
      endCell = state.theMap.cells.get(startCellContent[ck.endCell]);
    }
    return startCell.getPrimaryCellsInSquareTo(endCell);
  }

  calculateTargetCell_(cell) {
    if (cell.role == 'horizontal') {
      const topCell = cell.getNeighbor('top', false);
      const bottomCell = cell.getNeighbor('bottom', false);
      if (this.cellsBelongToSameBox_(topCell, bottomCell)) {
        return topCell;
      }
      const leftCell = cell.getNeighbor('left', true);
      const rightCell = cell.getNeighbor('right', true);
      if (this.cellsBelongToSameBox_(leftCell, rightCell)) {
        return leftCell;
      }
    } else if (cell.role == 'vertical') {
      const leftCell = cell.getNeighbor('left', false);
      const rightCell = cell.getNeighbor('right', false);
      if (this.cellsBelongToSameBox_(leftCell, rightCell)) {
        return leftCell;
      }
      const topCell = cell.getNeighbor('top', true);
      const bottomCell = cell.getNeighbor('bottom', true);
      if (this.cellsBelongToSameBox_(topCell, bottomCell)) {
        return topCell;
      }
    } else if (cell.role == 'corner') {
      const topLeftCell = cell.getNeighbor('top-left', false);
      const bottomRightCell = cell.getNeighbor('bottom-right', false);
      if (this.cellsBelongToSameBox_(topLeftCell, bottomRightCell)) {
        return topLeftCell;
      }
      const leftCell = cell.getNeighbor('left', true);
      const rightCell = cell.getNeighbor('right', true);
      if (this.cellsBelongToSameBox_(leftCell, rightCell)) {
        return leftCell;
      }
      const topCell = cell.getNeighbor('top', true);
      const bottomCell = cell.getNeighbor('bottom', true);
      if (this.cellsBelongToSameBox_(topCell, bottomCell)) {
        return topCell;
      }
    }
    // It's either a primary cell or a non-primary cell which does not belong to
    // another primary cell.
    return cell;
  }

  cellsBelongToSameBox_(topLeftCell, bottomRightCell) {
    if (!topLeftCell || !bottomRightCell) return false;
    const content1 = topLeftCell.getLayerContent(this.layer_);
    const content2 = bottomRightCell.getLayerContent(this.layer_);
    if (!content1 || !content2) return false;
    if (!content2[ck.startCell]) return false;

    return content2[ck.startCell] == topLeftCell.key ||
        content2[ck.startCell] == content1[ck.startCell];
  }
}
