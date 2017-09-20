class SightGesture extends Gesture {
  constructor() {
    super();
    this.hoveredCell_ = null;
    this.cellsInSight_ = [];
  }
  startHover(cell) {
    if (!cell || cell.role != 'primary') return;
    this.hoveredCell_ = cell;
    const origins = [{
      x: cell.offsetLeft + cell.width / 2,
      y: cell.offsetTop + cell.height / 2,
      sectors: [{top: -1, bottom: 1}],
    }];
    this.cellsInSight_ = this.calculateCellsInSight_(cell, origins);
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

  getColumnCells_(origin, column) {
    const result = [];
    // Initial naive implementation.
    const firstRow = parseInt(state.getProperty(pk.firstRow)) - 0.5;
    const lastRow = parseInt(state.getProperty(pk.lastRow)) + 0.5;// origin.row;
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

  calculateCellsInSight_(originCell, originPoints) {
    const cellsInSight = [];
    const maxColumn = parseInt(state.getProperty(pk.lastColumn)) + 0.5;
    for (let column = originCell.column; column <= maxColumn; column += 0.5) {
      column = Math.round(column * 2) / 2;
      const columnCells = this.getColumnCells_(originCell, column);
      if (columnCells.length == 0) break;
      const columnLeft = columnCells[0].offsetLeft;
      const columnRight = columnLeft + columnCells[0].width;
      columnCells.forEach(columnCell => {
        const cellIsAboveOrigin = columnCell.row <= originCell.row;
        const sideClosestToSectorTop =
            cellIsAboveOrigin ? columnRight : columnLeft;
        const sideClosestToSectorBottom =
            cellIsAboveOrigin ? columnLeft : columnRight;
        const cellTop = columnCell.offsetTop;
        const cellBottom = columnCell.offsetTop + columnCell.height;
        originPoints.forEach(originPoint => {
          const toCellTop =
              (cellTop - originPoint.y) /
              (sideClosestToSectorTop - originPoint.x);
          const toCellBottom =
              (cellBottom - originPoint.y) /
              (sideClosestToSectorBottom - originPoint.x);
          originPoint.sectors.forEach(sector => {
            if (sector.top <= toCellTop && sector.bottom >= toCellBottom) {
              cellsInSight.push(columnCell);
            }
          });
        });
      });
    }
    return cellsInSight;
  }
}
