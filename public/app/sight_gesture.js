class SightGesture extends Gesture {
  constructor() {
    super();
    this.hoveredCell_ = null;
    this.cellsInSight_ = [];
  }
  startHover(cell) {
    if (cell && cell.role == 'primary') {
      this.hoveredCell_ = cell;
    }
    if (!this.hoveredCell_) return;

    this.cellsInSight_ = this.calculateCellsInSight_(this.hoveredCell_);
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
    this.cellsInSight_ = [];
  }
  startGesture() {}
  continueGesture(cell) {}
  stopGesture() {}

  getColumnCells_(column, columnDiff) {
    const result = [];
    // Initial naive implementation.
    const firstRow = parseInt(state.getProperty(pk.firstRow)) - 1;
    const lastRow = parseInt(state.getProperty(pk.lastRow)) + 1;
    const startRow = columnDiff > 0 ? firstRow : lastRow;
    const endRow = columnDiff > 0 ? lastRow : firstRow;
    for (let row = startRow; row != endRow; row += columnDiff) {
      row = Math.round(row * 2) / 2;
      const cell = state.theMap.getCell(row, column);
      if (cell) result.push(cell);
    }
    return result;
  }

  isOpaque_(cell) {
    return cell.hasLayerContent(ct.walls);
  }

  cleanSectors_(sectors) {
    if (!sectors) return [];
    return sectors.filter(sector => sector.start < sector.end);
  }

  isHiddenByCellsInSameColumn_(cell, originPoint) {
    const seeTop = originPoint.y < cell.offsetTop;
    const seeBottom = originPoint.y > cell.offsetTop + cell.height;
    const isOpaque =
        (row, column) => this.isOpaque_(state.theMap.getCell(row, column));
    if (seeTop && isOpaque(cell.row - 0.5, cell.column)) {
      return true;
    }
    if (seeBottom && isOpaque(cell.row + 0.5, cell.column)) {
      return true;
    }
    return false;
  }

  calculateCellsInSight_(cell) {
    const createOriginPoints = () => [{
      x: cell.offsetLeft + cell.width / 2,
      y: cell.offsetTop + cell.height / 2,
      sectors: [{start: -1, end: 1}],
    }];
    const right =
        this.calculateCellsInQuarterSight_(cell, createOriginPoints(), 0.5);
    const left =
        this.calculateCellsInQuarterSight_(cell, createOriginPoints(), -0.5);
    const uniqueCells = new Set([...right, ...left]);
    return [cell].concat(Array.from(uniqueCells));
  }

  calculateCellsInQuarterSight_(originCell, originPoints, columnDiff) {
    const cellsInSight = [];
    const startColumn = originCell.column + columnDiff;
    const endColumn =
        parseInt(
            state
                .getProperty(columnDiff > 0 ? pk.lastColumn : pk.firstColumn)) +
                columnDiff * 2;
    for (let column = startColumn; column != endColumn; column += columnDiff) {
      column = Math.round(column * 2) / 2;
      const columnCells = this.getColumnCells_(column, columnDiff);
      if (columnCells.length == 0) break;
      const columnLeft = columnCells[0].offsetLeft;
      const columnRight = columnLeft + columnCells[0].width;
      columnCells.forEach(columnCell => {
        const cellIsBeforeOrigin = columnCell.row <= originCell.row;
        const cellTop = columnCell.offsetTop;
        const cellBottom = columnCell.offsetTop + columnCell.height;
        const cellStart = columnDiff > 0 ? cellTop : cellBottom;
        const cellEnd = columnDiff > 0 ? cellBottom : cellTop;
        originPoints.forEach(originPoint => {
          const distanceToStart = cellStart - originPoint.y;
          const distanceToEnd = cellEnd - originPoint.y;
          const distanceToLeft = columnLeft - originPoint.x;
          const distanceToRight = columnRight - originPoint.x;
          const cellStartFromScanDirection =
              distanceToStart /
              (cellIsBeforeOrigin ? distanceToLeft : distanceToRight);
          let cellEndFromScanDirection =
              distanceToEnd /
              (cellIsBeforeOrigin ? distanceToLeft : distanceToRight);
          const cellStartFromAntiScanDirection =
              distanceToStart /
              (cellIsBeforeOrigin ? distanceToRight : distanceToLeft);
          let cellEndFromAntiScanDirection =
              distanceToEnd /
              (cellIsBeforeOrigin ? distanceToRight : distanceToLeft);
          if (columnCell.row == originCell.row) {
            const temp = cellEndFromScanDirection;
            cellEndFromScanDirection = cellEndFromAntiScanDirection;
            cellEndFromAntiScanDirection = temp;
          }
          originPoint.sectors.forEach((sector, sectorIndex) => {
            if (!originPoint.nextSectors) {
              originPoint.nextSectors =
                  originPoint.sectors.map(currentSector => ({
                    start: currentSector.start,
                    end: currentSector.end,
                  }));
              originPoint.additionalNextSectorsCount = 0;
            }
            const actualSectorIndex =
                sectorIndex + originPoint.additionalNextSectorsCount;
            let nextSector = originPoint.nextSectors[actualSectorIndex];
            if (sector.start < cellEndFromAntiScanDirection &&
                sector.end > cellStartFromScanDirection) {
              const seenFromTheFront =
                  sector.start <= (distanceToEnd / distanceToLeft) &&
                  sector.end >= (distanceToStart / distanceToLeft);
              if (seenFromTheFront ||
                  !this.isHiddenByCellsInSameColumn_(columnCell, originPoint)) {
                cellsInSight.push(columnCell);
              }
              const currentCellIsOpaque = this.isOpaque_(columnCell);
              if (currentCellIsOpaque && !sector.prevColCellWasOpaque) {
                nextSector.end = cellStartFromScanDirection;
              } else if (!currentCellIsOpaque && sector.prevColCellWasOpaque) {
                nextSector = {
                  start: cellStartFromAntiScanDirection,
                  end: sector.end,
                };
                originPoint.nextSectors
                    .splice(actualSectorIndex + 1, 0, nextSector);
                originPoint.additionalNextSectorsCount++;
              }
              sector.prevColCellWasOpaque = currentCellIsOpaque;
            }
          }); // Sectors of origin point loop
        }); // Origin point loop
      }); // Cells in column loop
      originPoints.forEach(originPoint => {
        originPoint.sectors = this.cleanSectors_(originPoint.nextSectors);
        originPoint.nextSectors = null;
        originPoint.additionalNextSectorsCount = 0;
      });
      originPoints =
          originPoints.filter(originPoint => originPoint.sectors.length > 0);
      if (originPoints.length == 0) break;
    } // Column loop
    return cellsInSight;
  }
}
