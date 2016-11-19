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
    // The cell currently being hovered.
    this.hoveredCell_ = null;
    // The cell we are targeting; either equal to hoveredCell or adjacent to it
    // if the hovered cell is not a primary cell.
    this.targetCell_ = null;
    // Whether the target cell has any text in it before this gesture started.
    this.targetCellHasText_ = null;
    // The top-left text cell; contains the text content.
    this.startCell_ = null;
    // All cells belonging to the text, except the top-left one.
    this.nonStartCells_ = [];
    // Whether this gesture has been initiated from a widget.
    this.fromWidget_ = false;

    // Owned elements.

    // Textarea - created when editing the text.
    this.textarea_ = null;
    // Widget appearing on hover, for 'text' cursor and start-edit-on-click.
    this.hoverWidget_ = null;
    // Widget appearing on hover, for deleting the text.
    this.deleteWidget_ = null;
    // Widget appearing on hover, for resizing the text.
    this.resizeWidget_ = null;
  }

  startHover(cell) {
    if (this.hoveredCell_ == cell) return;
    this.hoveredCell_ = cell;
    this.targetCell_ = cell;
    // Corner case: hovering over a divider cell in the middle of the text
    // behaves as if hovering over the next cell.
    if (cell.role == 'horizontal') {
      const topCell = cell.getNeighbors('top').cells[0];
      const bottomCell = cell.getNeighbors('bottom').cells[0];
      if (this.cellsBelongToSameText_(topCell, bottomCell)) {
        this.targetCell_ = bottomCell;
      }
    } else if (cell.role == 'vertical') {
      const leftCell = cell.getNeighbors('left').cells[0];
      const rightCell = cell.getNeighbors('right').cells[0];
      if (this.cellsBelongToSameText_(leftCell, rightCell)) {
        this.targetCell_ = rightCell;
      }
    } else if (cell.role == 'corner') {
      const topLeftCell = cell.getNeighbors('top-left').cells[0];
      const bottomRightCell = cell.getNeighbors('bottom-right').cells[0];
      if (this.cellsBelongToSameText_(topLeftCell, bottomRightCell)) {
        this.targetCell_ = bottomRightCell;
      }
    }

    if (this.targetCell_.role != 'primary') return;

    this.targetCellHasText_ = this.targetCell_.hasLayerContent(ct.text);

    if (this.targetCellHasText_) {
      this.setCells_(this.targetCell_);
      if (!this.fromWidget_) {
        this.startHoverOverCellWithText_();
      } else {
        this.showHighlight_();
      }
    } else {
      this.startCell_ = cell;
      this.nonStartCells_ = [];
      this.showHighlight_();
    }
  }

  stopHover() {
    if (!this.startCell_) return;
    this.hideHighlight_();
    if (this.hoverWidget_) {
      this.hoverWidget_.parentElement.removeChild(this.hoverWidget_);
      this.hoverWidget_ = null;
    }
    if (this.deleteWidget_) {
      this.deleteWidget_.parentElement.removeChild(this.deleteWidget_);
      this.deleteWidget_ = null;
    }
    if (this.resizeWidget_) {
      this.resizeWidget_.parentElement.removeChild(this.resizeWidget_);
      this.resizeWidget_ = null;
    }
  }

  startGesture() {
    if (this.targetCellHasText_ && !this.fromWidget_) {
      // Do nothing; widgets handle editing cells with text.
      return;
    }
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
  
  startHoverOverCellWithText_() {
    this.startCell_.showHighlight(
        ct.text, this.startCell_.getLayerContent(ct.text));
    this.createHoverWidget_();
    this.createDeleteWidget_();
    this.createResizeWidget_();
  }
  
  createHoverWidget_() {
    this.hoverWidget_ = createAndAppendDivWithClass(
        this.hoveredCell_.gridElement, 'text-hover-widget');
    this.hoverWidget_.style.left =
        this.startCell_.offsetLeft - this.hoveredCell_.offsetLeft;
    this.hoverWidget_.style.top =
        this.startCell_.offsetTop - this.hoveredCell_.offsetTop;
    const textElement = this.startCell_.getOrCreateLayerElement(ct.text);
    this.hoverWidget_.style.width = textElement.scrollWidth;
    this.hoverWidget_.style.height = textElement.scrollHeight;
    this.hoverWidget_.onclick = (e) => {
      if (e.button == 0) this.startEditing_();
    };
    this.hoverWidget_.onmousedown = (e) => e.stopPropagation();
    this.hoverWidget_.onmouseup = (e) => e.stopPropagation();
  }
  
  createDeleteWidget_() {
    this.deleteWidget_ = createAndAppendDivWithClass(
        this.startCell_.gridElement, 'text-delete-widget');
    const textElement = this.startCell_.getOrCreateLayerElement(ct.text);
    this.deleteWidget_.style.left = textElement.scrollWidth;
    const deleteGesture = new TextGesture();
    deleteGesture.fromWidget_ = true;
    this.deleteWidget_.onmouseenter = (e) => {
      deleteGesture.startHover(this.startCell_);
      e.stopPropagation();
    }
    this.deleteWidget_.onmouseleave = (e) => {
      deleteGesture.stopHover();
      this.startCell_.showHighlight(
          ct.text, this.startCell_.getLayerContent(ct.text));
      e.stopPropagation();
    }
    this.deleteWidget_.onclick = (e) => {
      deleteGesture.startGesture();
      e.stopPropagation();
      this.stopHover();
      this.startHover(this.hoveredCell_);
    };
    this.deleteWidget_.onmousedown = (e) => e.stopPropagation();
    this.deleteWidget_.onmouseup = (e) => e.stopPropagation();
  }

  createResizeWidget_(parent) {
    this.resizeWidget_ = createAndAppendDivWithClass(
        this.startCell_.gridElement, 'text-resize-widget');
    const textElement = this.startCell_.getOrCreateLayerElement(ct.text);
    this.resizeWidget_.style.left = textElement.scrollWidth;
    this.resizeWidget_.style.top = textElement.scrollHeight;
    const resizeGesture = new TextGesture();
    this.resizeWidget_.onmousedown = () => {
      // XXX continue setting it to resize
    };
  }

  cellsBelongToSameText_(topLeftCell, bottomRightCell) {
    if (!topLeftCell || !bottomRightCell) return false;
    const content1 = topLeftCell.getLayerContent(ct.text);
    const content2 = bottomRightCell.getLayerContent(ct.text);
    if (!content1 || !content2) return false;
    if (!content2[ck.startCell]) return false;
    
    return content2[ck.startCell] == topLeftCell.key ||
      content2[ck.startCell] == content1[ck.startCell];
  }

  startEditing_() {
    if (this.textarea_) {
      this.finishEditing_();
    }
    const startCell = this.startCell_;
    const textElement = startCell.getOrCreateLayerElement(ct.text, null);
    this.textarea_ = document.createElement('textarea');
    this.textarea_.className = 'text-cell-textarea';
    this.textarea_.style.width = textElement.offsetWidth;
    this.textarea_.style.height = textElement.offsetHeight;
    if (startCell.hasLayerContent(ct.text)) {
      this.textarea_.value = startCell.getLayerContent(ct.text)[ck.text];
    }
    startCell.gridElement.appendChild(this.textarea_);
    this.textarea_.onkeyup = (e) => {
      if (e.key == 'Escape') {
        this.finishEditing_();
        return;
      }
      const text = this.textarea_.value;
      const content = startCell.getLayerContent(ct.text);
      if (text && content) {
        // Changing existing text - just update the start cell content.
        content[ck.text] = text;
        startCell.setLayerContent(ct.text, content, true);
      } else if (!text && !content) {
        // Removing all text when there's already none.
        return;
      } else {
        // We get here if !!text != !!content. In that case we update all
        // affected cells.
        const startCellContent = text ? {
          [ck.kind]: ct.text.text.id,
          [ck.variation]: ct.text.text.standard.id,
          [ck.text]: text,
        } : null;
        if (startCellContent && this.nonStartCells_.length > 0) {
          startCellContent[ck.endCell] =
              this.nonStartCells_[this.nonStartCells_.length - 1].key;
        }
        this.startCell_.setLayerContent(
            ct.text, text ? startCellContent : null, true);
        this.nonStartCells_.forEach(nonStartCell => {
          nonStartCell.setLayerContent(ct.text, text ? {
            [ck.kind]: ct.text.text.id,
            [ck.variation]: ct.text.text.standard.id,
            [ck.startCell]: this.startCell_.key,
          } : null, true);
        });
      }
      const startCellElement =
          startCell.getOrCreateLayerElement(ct.text, content);
      this.textarea_.style.fontSize = startCellElement.style.fontSize;
      if (startCell.textHeight) {
        const whitespace =
            startCellElement.scrollHeight - startCell.textHeight;
        this.textarea_.style.paddingTop = (whitespace / 2 + 1) + 'px';
      }
    }
    this.textarea_.onmousedown = (e) => e.stopPropagation();
    this.textarea_.onmouseup = (e) => e.stopPropagation();
    const content = startCell.getLayerContent(ct.text);
    if (content) {
      const startCellElement =
          startCell.getOrCreateLayerElement(ct.text, content);
      this.textarea_.style.fontSize = startCellElement.style.fontSize;
      if (startCell.textHeight) {
        const whitespace =
            startCellElement.scrollHeight - startCell.textHeight;
        this.textarea_.style.paddingTop = (whitespace / 2 + 1) + 'px';
      }
    }
    this.textarea_.focus();
  }
  
  finishEditing_() {
    if (this.textarea_) {
      this.textarea_.parentElement.removeChild(this.textarea_);
      this.textarea_ = null;
    }
    this.stopHover();
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
    if (this.targetCellHasText_) return null;
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
    if (this.targetCellHasText_) return null;
    return {
      [ck.kind]: ct.text.text.id,
      [ck.variation]: ct.text.text.standard.id,
      [ck.startCell]: this.startCell_.key,
    }
  }
}
