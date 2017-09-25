class SightGesture extends Gesture {
  constructor() {
    super();
    this.hoveredCell_ = null;
    this.cellsInSight_ = [];
    this.overlayContent_ = {
      [ck.kind]: ct.overlay.hidden.id,
      [ck.variation]: ct.overlay.hidden.black.id,
    };
    this.shouldMakeOtherCellsHidden_ =
        Array.from(state.theMap.cells.entries)
            .every(([key, cell]) => !cell.hasLayerContent(ct.overlay));
  }

  startHover(cell) {
    if (cell && cell.role == 'primary') {
      this.hoveredCell_ = cell;
    }
    if (!this.hoveredCell_) return;

    this.cellsInSight_ = this.calculateCellsInSight_(this.hoveredCell_);

    if (this.cellsInSight_.length > 0 && this.shouldMakeOtherCellsHidden_) {
      state.theMap.cells.forEach((existingCell, key) => {
        existingCell.showHighlight(ct.overlay, this.overlayContent_);
      });
    }

    this.cellsInSight_.forEach(cellInSight => {
      cellInSight.hideHighlight(ct.overlay);
      cellInSight.showHighlight(ct.overlay, null);
    });
  }

  stopHover() {
    if (this.cellsInSight_.length > 0 && this.shouldMakeOtherCellsHidden_) {
      state.theMap.cells.forEach((existingCell, key) => {
        existingCell.hideHighlight(ct.overlay);
      });
    } else {
      this.cellsInSight_.forEach(cellInSight => {
        cellInSight.hideHighlight(ct.overlay);
      });
    }
    this.hoveredCell_ = null;
    this.cellsInSight_ = [];
  }

  startGesture() {
    if (this.cellsInSight_.length > 0 && this.shouldMakeOtherCellsHidden_) {
      state.theMap.cells.forEach((existingCell, key) => {
        existingCell.hideHighlight(ct.overlay);
        existingCell.setLayerContent(ct.overlay, this.overlayContent_, true);
      });
    }

    this.cellsInSight_.forEach(cellInSight => {
      cellInSight.hideHighlight(ct.overlay);
      cellInSight.setLayerContent(ct.overlay, null, true);
    });

    if (this.shouldMakeOtherCellsHidden_) {
      state.opCenter.recordOperationComplete(true);
      this.shouldMakeOtherCellsHidden_ = false;
    }
  }

  continueGesture(cell) {
    if (cell && cell.role == 'primary') {
      this.hoveredCell_ = cell;
    }
    if (!this.hoveredCell_) return;

    this.cellsInSight_ = this.calculateCellsInSight_(this.hoveredCell_);
    this.cellsInSight_.forEach(cellInSight => {
      cellInSight.setLayerContent(ct.overlay, null, true);
    });
  }

  stopGesture() {
    state.opCenter.recordOperationComplete();
  }

  getColumnCells_(column, columnDiff) {
    const result = [];
    // Naive implementation.
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

  getRowCells_(row, rowDiff) {
    const result = [];
    // Naive implementation.
    const firstColumn = parseInt(state.getProperty(pk.firstColumn)) - 1;
    const lastColumn = parseInt(state.getProperty(pk.lastColumn)) + 1;
    const startColumn = rowDiff > 0 ? firstColumn : lastColumn;
    const endColumn = rowDiff > 0 ? lastColumn : firstColumn;
    for (let column = startColumn; column != endColumn; column += rowDiff) {
      column = Math.round(column * 2) / 2;
      const cell = state.theMap.getCell(row, column);
      if (cell) result.push(cell);
    }
    return result;
  }

  isOpaque_(cell) {
    return cell && cell.hasLayerContent(ct.walls);
  }

  cleanSectors_(sectors) {
    if (!sectors) return [];
    return sectors.filter(sector => sector.start < sector.end);
  }

  isHiddenByCellsInSameColumn_(cell, originPoint) {
    const seeTop = originPoint.y < cell.offsetTop - 1;
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

  isHiddenByCellsInSameRow_(cell, originPoint) {
    const seeLeft = originPoint.x < cell.offsetLeft - 1;
    const seeRight = originPoint.x > cell.offsetLeft + cell.width;
    const isOpaque =
        (row, column) => this.isOpaque_(state.theMap.getCell(row, column));
    if (seeLeft && isOpaque(cell.row, cell.column - 0.5)) {
      return true;
    }
    if (seeRight && isOpaque(cell.row, cell.column + 0.5)) {
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
        this.calculateCellsInSightByColumn_(cell, createOriginPoints(), 0.5);
    const left =
        this.calculateCellsInSightByColumn_(cell, createOriginPoints(), -0.5);
    const bottom =
        this.calculateCellsInSightByRow_(cell, createOriginPoints(), 0.5);
    const top =
        this.calculateCellsInSightByRow_(cell, createOriginPoints(), -0.5);
    const uniqueCells =
        Array.from(new Set([...right, ...left, ...bottom, ...top]));
    const eligibleCells =
        this.shouldMakeOtherCellsHidden_ ?
          uniqueCells :
          uniqueCells.filter(cellToReveal =>
            cellToReveal.hasLayerContent(ct.overlay));
    return [cell].concat(eligibleCells);
  }

  calculateCellsInSightByColumn_(originCell, originPoints, columnDiff) {
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
      const columnLeft = columnCells[0].offsetLeft - 1;
      const columnRight = columnLeft + columnCells[0].width;
      columnCells.forEach(columnCell => {
        const cellIsBeforeOrigin = columnDiff > 0 ?
          columnCell.row <= originCell.row : columnCell.row < originCell.row;
        const cellTop = columnCell.offsetTop - 1;
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
              const distanceToFront =
                  columnDiff > 0 ? distanceToLeft : distanceToRight;
              const seenFromTheFront =
                  sector.start <= (distanceToEnd / distanceToFront) &&
                  sector.end >= (distanceToStart / distanceToFront);
              if (seenFromTheFront ||
                  !this.isHiddenByCellsInSameColumn_(columnCell, originPoint)) {
                cellsInSight.push(columnCell);
              }
              const currentCellIsOpaque = this.isOpaque_(columnCell);
              if (currentCellIsOpaque && !sector.prevColCellWasOpaque) {
                nextSector.end =
                    Math.max(nextSector.start, cellStartFromScanDirection);
              } else if (!currentCellIsOpaque && sector.prevColCellWasOpaque) {
                nextSector = {
                  start: Math.min(1, cellStartFromAntiScanDirection),
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

  calculateCellsInSightByRow_(originCell, originPoints, rowDiff) {
    const cellsInSight = [];
    const startRow = originCell.row + rowDiff;
    const endRow =
        parseInt(
            state
                .getProperty(rowDiff > 0 ? pk.lastRow : pk.firstRow)) +
                rowDiff * 2;
    for (let row = startRow; row != endRow; row += rowDiff) {
      row = Math.round(row * 2) / 2;
      const rowCells = this.getRowCells_(row, rowDiff);
      if (rowCells.length == 0) break;
      const rowTop = rowCells[0].offsetTop - 1;
      const rowBottom = rowTop + rowCells[0].height;
      rowCells.forEach(rowCell => {
        const cellIsBeforeOrigin = rowDiff > 0 ?
          rowCell.column <= originCell.column :
          rowCell.column < originCell.column;
        const cellLeft = rowCell.offsetLeft - 1;
        const cellRight = rowCell.offsetLeft + rowCell.width;
        const cellStart = rowDiff > 0 ? cellLeft : cellRight;
        const cellEnd = rowDiff > 0 ? cellRight : cellLeft;
        originPoints.forEach(originPoint => {
          const distanceToStart = cellStart - originPoint.x;
          const distanceToEnd = cellEnd - originPoint.x;
          const distanceToTop = rowTop - originPoint.y;
          const distanceToBottom = rowBottom - originPoint.y;
          const cellStartFromScanDirection =
              distanceToStart /
              (cellIsBeforeOrigin ? distanceToTop : distanceToBottom);
          let cellEndFromScanDirection =
              distanceToEnd /
              (cellIsBeforeOrigin ? distanceToTop : distanceToBottom);
          const cellStartFromAntiScanDirection =
              distanceToStart /
              (cellIsBeforeOrigin ? distanceToBottom : distanceToTop);
          let cellEndFromAntiScanDirection =
              distanceToEnd /
              (cellIsBeforeOrigin ? distanceToBottom : distanceToTop);
          if (rowCell.column == originCell.column) {
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
              const distanceToFront =
                  rowDiff > 0 ? distanceToTop : distanceToBottom;
              const seenFromTheFront =
                  sector.start <= (distanceToEnd / distanceToFront) &&
                  sector.end >= (distanceToStart / distanceToFront);
              if (seenFromTheFront ||
                  !this.isHiddenByCellsInSameRow_(rowCell, originPoint)) {
                cellsInSight.push(rowCell);
              }
              const currentCellIsOpaque = this.isOpaque_(rowCell);
              if (currentCellIsOpaque && !sector.prevRowCellWasOpaque) {
                nextSector.end =
                    Math.max(nextSector.start, cellStartFromScanDirection);
              } else if (!currentCellIsOpaque && sector.prevRowCellWasOpaque) {
                nextSector = {
                  start: Math.min(1, cellStartFromAntiScanDirection),
                  end: sector.end,
                };
                originPoint.nextSectors
                    .splice(actualSectorIndex + 1, 0, nextSector);
                originPoint.additionalNextSectorsCount++;
              }
              sector.prevRowCellWasOpaque = currentCellIsOpaque;
            }
          }); // Sectors of origin point loop
        }); // Origin point loop
      }); // Cells in row loop
      originPoints.forEach(originPoint => {
        originPoint.sectors = this.cleanSectors_(originPoint.nextSectors);
        originPoint.nextSectors = null;
        originPoint.additionalNextSectorsCount = 0;
      });
      originPoints =
          originPoints.filter(originPoint => originPoint.sectors.length > 0);
      if (originPoints.length == 0) break;
    } // row loop
    return cellsInSight;
  }
}
