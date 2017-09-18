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

  isOpaque_(origin, cell) {
    return cell.hasLayerContent(ct.walls);
  }

  mergeSectors_(sectors) {
    const result = [];
    if (sectors.length == 0) return result;
    let currSector = {
      top: sectors[0].top,
      bottom: sectors[0].bottom,
    };
    sectors.slice(1).forEach(sector => {
      if (sector.top <= sector.bottom) return;
      if (sector.top >= currSector.bottom) {
        currSector.bottom = sector.bottom;
      } else {
        result.push(currSector);
        currSector = {
          top: sector.top,
          bottom: sector.bottom,
        };
      }
    });
    return result;
  }

  calculateCellsInSight_(origin) {
    const cellsInSight = [];
    let currentSectors = [{
      top: -1,
      bottom: 0,
    }];
    const originOffset = {
      top: origin.offsetTop,
      bottom: origin.offsetTop + origin.height,
      center: {
        x: origin.offsetLeft + origin.width / 2,
        y: origin.offsetTop + origin.height / 2,
      },
    };
    const maxColumn = parseInt(state.getProperty(pk.lastColumn)) + 0.5;
    for (let column = origin.column; column <= maxColumn; column += 0.5) {
      const nextSectors = [];
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
        const isOpaque = this.isOpaque_(origin, columnCell);
        currentSectors.forEach(currentSector => {
          const sectorOffsetTop =
              originOffset.center.y +
              (columnOffsetRight - originOffset.center.x) * currentSector.top;
          const sectorOffsetBottom =
              originOffset.center.y +
              (columnOffsetLeft - originOffset.center.x) * currentSector.bottom;
          if (cellOffsetBottom >= sectorOffsetTop &&
              cellOffsetTop <= sectorOffsetBottom) {
            // The cell is visible.
            cellsInSight.push(columnCell);
          }
//          if (!isOpaque) {
//            nextSectors.push({
//              top: (cellOffsetTop - originOffset.center.y) /
//                  (columnOffsetRight - originOffset.center.x),
//              bottom: (cellOffsetBottom - originOffset.center.y) /
//                  (columnOffsetLeft - originOffset.center.x),
//            });
//          }
        });
      });
      // currentSectors = this.mergeSectors_(nextSectors);
      // if (currentSectors.length == 0) break;
    }
    return cellsInSight;
  }
}
