// Text gesture behavior:
// * Hover over empty cell: show text highlight for that cell.
// * Hover over cell with text:
//   * Change cursor to text cursor.
//   * Show "delete" and "resize" buttons.
// * Start clicking empty cell: show hover
// * Start clicking empty cell: change cursor to move cursor after short delay.
// * Drag empty cell: show text highlight for all cells between the first cell
//   and that cell, unless it's illegal (there's already a text cell
//   in-between) and then either show the hover for the first cell only, or for
//   some subset of the square.
// * Drag text cell: move the entire text around.
class TextGesture extends Gesture {
  constructor() {
    super();
    this.removeText_ = null;
    this.hoveredCell_ = null;
    this.startCell_ = null;
    this.nonStartCells_ = [];
  }

  startHover(cell) {
    // Corner case: hovering over a divider cell in the middle of the text
    // behaves as if hovering over the next cell.
    if (cell.role == 'horizontal') {
      const topCell = cell.getNeighbors('top').cells[0];
      const bottomCell = cell.getNeighbors('bottom').cells[0];
      if (this.cellsBelongToSameText_(topCell, bottomCell)) {
        cell = bottomCell;
      }
    } else if (cell.role == 'vertical') {
      const leftCell = cell.getNeighbors('left').cells[0];
      const rightCell = cell.getNeighbors('right').cells[0];
      if (this.cellsBelongToSameText_(leftCell, rightCell)) {
        cell = rightCell;
      }
    } else if (cell.role == 'corner') {
      const topLeftCell = cell.getNeighbors('top-left').cells[0];
      const bottomRightCell = cell.getNeighbors('bottom-right').cells[0];
      if (this.cellsBelongToSameText_(topLeftCell, bottomRightCell)) {
        cell = bottomRightCell;
      }
    }

    this.hoveredCell_ = cell;
    if (!this.isCellEligible_(this.hoveredCell_)) return;
    this.startCell_ = null;
    this.nonStartCells_ = [];
    this.removeText_ = cell.hasLayerContent(ct.text);
    if (this.removeText_) {
      this.setCells_(cell);
    } else if (cell.role == 'primary') {
      this.startCell_ = cell;
      this.nonStartCells_ = [];
    } else {
      return;
    }
    this.showHighlight_();
  }

  stopHover() {
    if (!this.startCell_) return;
    this.hideHighlight_();
  }

  startGesture() {
    if (!this.isCellEligible_(this.hoveredCell_)) return;
    this.stopHover();
    this.apply_();
  }

  continueGesture(cell) {
    if (!this.isCellEligible_(cell)) return;
    if (cell == this.startCell_) return;
    this.setNonStartCells_(cell);
    this.showHighlight_();
    this.apply_();
  }

  stopGesture() {
    if (!this.removeText_ && this.startCell_.hasLayerContent(ct.text)) {
      this.startEditing_();
    }
  }

  cellsBelongToSameText_(topLeftCell, bottomRightCell) {
    if (!topLeftCell || !bottomRightCell) return false;
    const content1 = topLeftCell.getLayerContent(ct.text);
    const content2 = bottomRightCell.getLayerContent(ct.text);
    if (!content1 || !content2) return false;
    
    return content2[ck.startCell] == topLeftCell.key ||
      content2[ck.startCell] == content1[ck.startCell];
  }

  startEditing_() {
    const startCell = this.startCell_;
    const textElement = startCell.getOrCreateLayerElement(ct.text, null);
    this.textArea_ = document.createElement('textarea');
    this.textArea_.className = 'text-cell-textarea';
    this.textArea_.style.left = startCell.offsetLeft;
    this.textArea_.style.top = startCell.offsetTop;
    this.textArea_.style.width = textElement.offsetWidth;
    this.textArea_.style.height = textElement.offsetHeight;
    document.getElementById('textLayer').appendChild(this.textArea_);
    this.textArea_.focus();
    this.textArea_.onkeyup = (e) => {
      if (e.key == 'Escape') {
        this.finishEditing_();
        return;
      }
      const text = this.textArea_.value;
      const content = startCell.getLayerContent(ct.text);
      if (!content) return;
      content[ck.text] = text;
      startCell.setLayerContent(ct.text, text ? content : null, true);
      const startCellElement =
          startCell.getOrCreateLayerElement(ct.text, content);
      this.textArea_.style.fontSize = startCellElement.style.fontSize;
      if (startCell.textHeight) {
        const whitespace =
            startCellElement.scrollHeight - startCell.textHeight;
        this.textArea_.style.paddingTop = (whitespace / 2 + 1) + 'px';
      }
    }
    this.textArea_.onblur = () => {
      this.finishEditing_();
    };
  }
  
  finishEditing_() {
    if (this.textArea_) {
      document.getElementById('textLayer').removeChild(this.textArea_);
    }
    this.textArea_ = null;
    state.recordOperationComplete();
  }

  isCellEligible_(cell) {
    return cell && cell.role == 'primary';
  }

  setCells_(targetedCell) {
    this.startCell_ = state.theMap.cells.get(
        targetedCell.getLayerContent(ct.text)[ck.startCell]) || targetedCell;
    const content = this.startCell_.getLayerContent(ct.text);
    if (!content) return;
    const endCellKey = this.startCell_.getLayerContent(ct.text)[ck.endCell];
    if (!endCellKey) return;
    const endCell = state.theMap.cells.get(endCellKey);
    if (!endCell) return;
    this.setNonStartCells_(endCell);
  }

  setNonStartCells_(endCell) {
    const width = endCell.column - this.startCell_.column;
    const height = endCell.row - this.startCell_.row;

    let rowStart = this.startCell_;
    for (let i = 0; i < height + 1; i++) {
      let currCell = rowStart;
      for (let j = 0; j < width + 1; j++) {
        if (currCell != this.startCell_) this.nonStartCells_.push(currCell);
        currCell = currCell.getNeighbors('right').cells[0];
        if (!currCell) break;
      }
      rowStart = rowStart.getNeighbors('bottom').cells[0];
      if (!rowStart) break;
    }
  }

  showHighlight_() {
    this.startCell_.showHighlight(ct.text, this.createStartCellContent_());
    this.nonStartCells_.forEach(nonStartCell => {
      nonStartCell.showHighlight(ct.text, this.createNonStartCellContent_());
    });
  }

  hideHighlight_() {
    this.startCell_.hideHighlight(ct.text);
    this.nonStartCells_.forEach(nonStartCell => {
      nonStartCell.hideHighlight(ct.text);
    });
  }

  apply_() {
    this.startCell_.setLayerContent(
        ct.text, this.createStartCellContent_(), true);
    this.nonStartCells_.forEach(nonStartCell => {
      nonStartCell.setLayerContent(
          ct.text, this.createNonStartCellContent_(), true);
    });
  }

  createStartCellContent_() {
    if (this.removeText_) return null;
    const content = {
      [ck.kind]: ct.text.text.id,
      [ck.variation]: ct.text.text.standard.id,
      [ck.text]: '',
    };
    if (this.nonStartCells_.length > 0) {
      content[ck.endCell] =
          this.nonStartCells_[this.nonStartCells_.length - 1].key;
    }
    return content;
  }

  createNonStartCellContent_() {
    if (this.removeText_) return null;
    return {
      [ck.kind]: ct.text.text.id,
      [ck.variation]: ct.text.text.standard.id,
      [ck.startCell]: this.startCell_.key,
    }
  }
}
