class SightGesture extends Gesture {
  constructor() {
    super();
    this.hoveredCell_ = null;
    this.cellsInSight_ = [];
  }
  startHover(cell) {
    if (!cell || cell.role != 'primary') return;
    this.hoveredCell_ = cell;
    this.cellsInSight_ = this.calculateCellsInSight_(cell);
    this.cellsInSight_.forEach(cellInSight => {
      cellInSight.showHighlight(ct.overlay, {
        [ck.kind]: ct.overlay.hidden.id,
        [ck.variation]: ct.overlay.hidden.black.id,
      });
    });
  }
  stopHover() {
    this.cellsInSight_.forEach(cellInSight => {
      cellInSight.hideHighlight(ct.overlay);
    });
    this.hoveredCell_ = null;
    this.cellsInSight_ = [];
  }
  startGesture() {}
  continueGesture(cell) {}
  stopGesture() {}

  getColumnCells_(origin, column, fromAngle, toAngle) {
    const result = [];
    // Initial naive implementation.
    const firstRow = parseInt(state.getProperty(pk.firstRow)) - 0.5;
    const lastRow = origin.row;
    for (let row = firstRow; row <= lastRow; row += 0.5) {
      row = Math.round(row * 2) / 2;
      const cell = state.theMap.getCell(row, column);
      if (cell) result.push(cell);
    }
    return result;
  }

  calculateCellsInSight_(origin) {
    const cellsInSight = [];
    let currentSectors = [{
      top: 1,
      bottom: 0,
    }];
    let nextSectors = [];
    const originOffset = {
      top: origin.offsetTop,
      bottom: origin.offsetTop + origin.height,
      center: {
        x: origin.offsetTop + origin.height / 2,
        y: origin.offsetLeft + origin.width / 2,
      },
    }
    const maxColumn = parseInt(state.getProperty(pk.lastColumn)) + 0.5;
    for (let column = origin.column; column <= maxColumn; column += 0.5) {
      column = Math.round(column * 2) / 2;
      const columnCells =
          this.getColumnCells_(origin, column, currentSectors[0].top,
              currentSectors[currentSectors.length - 1].bottom);
      if (columnCells.length == 0) break;
      const columnOffsetLeft = columnCells[0].offsetLeft;
      const columnOffsetRight = columnOffsetLeft + columnCells[0].width;
      columnCells.forEach(columnCell => {
        const cellOffsetTop = columnCell.offsetTop;
        const cellOffsetBottom = columnCell.offsetTop + columnCell.height;
        currentSectors.forEach(currentSector => {
          // const updatedSector = {
          //   top: currentSector.top,
          //   bottom: currentSector.bottom,
          // };
          const sectorOffsetTop =
              originOffset.center.y -
              (columnOffsetRight - originOffset.center.x) * currentSector.top;
          const sectorOffsetBottom =
              originOffset.center.y -
              (columnOffsetLeft - originOffset.center.x) * currentSector.bottom;
          if (cellOffsetBottom >= sectorOffsetTop &&
              cellOffsetTop <= sectorOffsetBottom) {
            // The cell is visible.
            cellsInSight.push(columnCell);
          }
        });
      });
    }
    return cellsInSight;
  }
}
