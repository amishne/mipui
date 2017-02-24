// Text gesture behavior:
// * Hover over empty cell: show text highlight for that cell.
// * Hover over cell with text:
//   * Change cursor to text cursor.
//   * Show "move", delete" and "resize" buttons.
// * Start clicking empty cell: show hover
// * Drag empty cell: show text highlight for all cells between the first cell
//   and that cell, unless it's illegal (there's already a text cell
//   in-between) and then either show the hover for the first cell only, or for
//   some subset of the square.
class TextGesture extends Gesture {
  constructor() {
    super();
    // The cell currently being hovered.
    this.hoveredCell_ = null;
    // The cell we are targeting; either equal to hoveredCell or adjacent to it
    // if the hovered cell is not a primary cell.
    this.targetCell_ = null;
    // Gesture mode, one of:
    // 'adding', 'editing', 'removing', 'resizing', 'moving', 'reverting'.
    this.mode_ = null;
    // Cell in which the gesture started.
    this.anchorCell_ = null;
    // The top-left text cell; contains the text content.
    this.startCell_ = null;
    // The bottom-right text cell; to be referred by startCell_'s content.
    this.endCell_ = null;
    // All cells belonging to the text, except the top-left one.
    this.nonStartCells_ = [];
    // The end cell when the gesture started, if any - used for resizing.
    this.originalEndCell_ = null;
    // The text as it was when editing started - used for reverting to it after
    // canceling the edit.
    this.originalText_ = null;

    // Owned elements.

    // Textarea - created when editing the text.
    this.textarea_ = null;
    // Widget appearing on hover, for 'text' cursor and start-edit-on-click.
    this.hoverWidget_ = null;
    // Widget appearing on hover, for deleting the text.
    this.deleteWidget_ = null;
    // Widget appearing on hover, for resizing the text.
    this.resizeWidget_ = null;
    // Widget appearing on hover, for moving the text.
    this.moveWidget_ = null;
  }

  startHover(cell) {
    if (this.textarea_) {
      // As long as there's an edit in progress, hovering changes are disabled.
      return;
    }

    if (this.mode_ != 'removing' && this.mode_ != 'resizing' &&
        this.mode_ != 'moving') {
      if (this.hoveredCell_ == cell) return;
      this.stopHover();
      this.hoveredCell_ = cell;
      this.calculateTargetCell_();
      if (!this.targetCell_) return;
      this.mode_ =
          this.targetCell_.hasLayerContent(ct.text) ? 'editing' : 'adding';
      this.calculateTextExtent_(true);
      if (!this.startCell_) return;
    } else {
      this.hoveredCell_ = cell;
    }

    this.showHighlight_();
    if (this.mode_ == 'editing') {
      this.createHoverWidget_();
      this.createDeleteWidget_();
      this.createResizeWidget_();
      this.createMoveWidget_();
    }
  }

  stopHover() {
    if (this.textarea_) {
      // There's an edit in progress - do not cancel the hover artifacts.
      return;
    }

    if (this.startCell_) {
      this.hideHighlight_();
    }

    this.removeHoverWidget_();
    this.removeDeleteWidget_();
    this.removeResizeWidget_();
    this.removeMoveWidget_();
  }

  startGesture() {
    this.finishEditing_();

    if (!this.startCell_) {
      return;
    }

    switch (this.mode_) {
      case 'adding':
        this.anchorCell_ = this.targetCell_;
        this.showHighlight_();
        break;
      case 'removing':
        this.apply_();
        break;
      case 'editing':
        // Do nothing; this is handled by the hover widget.
        break;
      case 'moving':
        this.anchorCell_ = this.startCell_;
        break;
      case 'resizing':
        // Do nothing; everything should already be pre-set.
        break;
    }
  }

  continueGesture(cell) {
    if (this.textarea_) {
      // There's an edit in progress, do not allow continuing the gesture.
      return;
    }

    if (this.mode_ == 'adding' || this.mode_ == 'resizing' ||
        this.mode_ == 'moving') {
      this.hideHighlight_();
      this.hoveredCell_ = cell;
      if (this.hoveredCell_.role != 'primary') {
        if (this.mode_ == 'resizing' || this.mode_ == 'moving') {
          this.showHighlight_();
          return;
        }
      }
      if (this.mode_ == 'moving') {
        // Hide the original location.
        this.mode_ = 'removing';
        this.showHighlight_();
        this.mode_ = 'moving';
      }
      this.targetCell_ = this.hoveredCell_;
      this.calculateTextExtent_();
      this.showHighlight_();
      if (this.mode_ == 'resizing') {
        // Redraw the resize widget so it would appear on the new corner.
        this.removeResizeWidget_();
        this.createResizeWidget_();
      } else if (this.mode_ == 'moving') {
        // Redraw the move widget so it would appear on the new corner.
        this.removeMoveWidget_();
        this.createMoveWidget_();
      }
    }
  }

  stopGesture() {
    if ((this.mode_ == 'adding' || this.mode_ == 'resizing' ||
         this.mode_ == 'moving') && this.startCell_) {
      this.stopHover();
      if (this.mode_ == 'adding') {
        this.startEditing_();
      } else {
        if (this.mode_ == 'resizing' || this.mode_ == 'moving') {
          this.apply_();
        }
        state.opCenter.recordOperationComplete();
        this.anchorCell_ = null;
        this.originalEndCell_ = null;
        this.targetCell_ = null;
        this.startCell_ = null;
        this.nonStartCells_ = [];
        this.hoveredCell_ = null;
      }
    }
    // Return to some safe default.
    this.mode_ = 'adding';
  }

  // Assumes
  //   this.hoveredCell_
  // Sets
  //   this.targetCell_
  calculateTargetCell_() {
    this.targetCell_ = null;
    // Hovering over a divider cell in the middle of the text behaves as if
    // hovering over the next cell.
    if (this.hoveredCell_.role == 'horizontal') {
      const topCell = this.hoveredCell_.getNeighbors('top').cells[0];
      const bottomCell = this.hoveredCell_.getNeighbors('bottom').cells[0];
      if (this.cellsBelongToSameText_(topCell, bottomCell)) {
        this.targetCell_ = bottomCell;
      }
    } else if (this.hoveredCell_.role == 'vertical') {
      const leftCell = this.hoveredCell_.getNeighbors('left').cells[0];
      const rightCell = this.hoveredCell_.getNeighbors('right').cells[0];
      if (this.cellsBelongToSameText_(leftCell, rightCell)) {
        this.targetCell_ = rightCell;
      }
    } else if (this.hoveredCell_.role == 'corner') {
      const topLeftCell = this.hoveredCell_.getNeighbors('top-left').cells[0];
      const bottomRightCell =
          this.hoveredCell_.getNeighbors('bottom-right').cells[0];
      if (this.cellsBelongToSameText_(topLeftCell, bottomRightCell)) {
        this.targetCell_ = bottomRightCell;
      }
    } else {
      // It's a primary cell.
      this.targetCell_ = this.hoveredCell_;
    }
  }

  // Assumes
  //   this.mode_
  //   this.targetCell_
  //   this.anchorCell_ (may be null)
  // Sets
  //   this.startCell_
  //   this.endCell_
  //   this.nonStartCells_
  calculateTextExtent_() {
    switch (this.mode_) {
      case 'removing':
        // Removing assumes the cells are already set by the parent gesture.
        break;
      case 'resizing':
      case 'adding':
        if (!this.anchorCell_) {
          this.startCell_ = this.targetCell_;
          this.nonStartCells_ = [];
          this.endCell_ = null;
        } else {
          const predicate = (cell) => {
            return !cell.hasLayerContent(ct.text) ||
                cell == this.anchorCell_ ||
                cell.getVal(ct.text, ck.startCell) == this.anchorCell_.key;
          };
          this.calculateTextExtentBetween_(
              this.anchorCell_, this.targetCell_, predicate);
        }
        break;
      case 'editing':
        this.startCell_ =
            state.theMap.cells
                .get(this.targetCell_.getVal(ct.text, ck.startCell))
            || this.targetCell_;
        this.endCell_ =
            state.theMap.cells
                .get(this.startCell_.getVal(ct.text, ck.endCell));
        this.calculateTextExtentBetween_(this.startCell_, this.endCell_);
        break;
      case 'moving':
        const predicate = (cell) => {
          return !cell.hasLayerContent(ct.text) ||
              cell == this.anchorCell_ ||
              cell.getVal(ct.text, ck.startCell) == this.anchorCell_.key;
        };
        if (!predicate(this.targetCell_)) {
          // The targeted cell is invalid. Set nothing.
        } else if (!this.originalEndCell_) {
          // Moving a 1-cell text.
          this.startCell_ = this.targetCell_;
          this.nonStartCells_ = [];
          this.endCell_ = null;
        } else {
          const width = this.originalEndCell_.column - this.anchorCell_.column;
          const height = this.originalEndCell_.row - this.anchorCell_.row;
          const newRow = this.targetCell_.row;
          const newColumn = this.targetCell_.column;
          const endCell = state.theMap.cells.get(
              TheMap.primaryCellKey(newRow + height, newColumn + width));
          this.calculateTextExtentBetween_(
              this.targetCell_, endCell, predicate);
        }
        break;
    }
  }

  // Sets this.startCell_, this.endCell_ and this.nonStartCells_, using the
  // cells between cell1 and cell2.
  // If any of the cells fails the predicate, just sets this.startCell_ to
  // cell1.
  calculateTextExtentBetween_(cell1, cell2, predicate) {
    // First, calculate the square between the anchor and the target:
    let cells = cell1.getPrimaryCellsInSquareTo(cell2);
    if (predicate) {
      if (!cells.every(predicate)) {
        cells = [cell1];
      }
    }
    if (cells.length > 0) {
      this.startCell_ = cells[0];
      this.nonStartCells_ = cells.slice(1);
    }
    this.endCell_ = cells.length > 1 ? cells[cells.length - 1] : null;
  }

  // Assumes
  //   this.startCell_
  //   this.endCell_ (may be null)
  // Sets
  //   this.nonStartCells_ (may be empty)
  // Also, might set this.endCell_.
  calculateNonStartCells_() {
    this.nonStartCells_ = [];
    if (!this.endCell_) {
      return;
    }
    const width = this.endCell_.column - this.startCell_.column;
    const height = this.endCell_.row - this.startCell_.row;

    let rowStart = this.startCell_;
    for (let i = 0; i <= height; i++) {
      let currCell = rowStart;
      for (let j = 0; j <= width; j++) {
        if (i != 0 || j != 0) {
          // This isn't the start cell.
          if (currCell.hasLayerContent(ct.text) &&
              this.anchorCell_ &&
              currCell != this.anchorCell_ &&
              currCell.getVal(ct.text, ck.startCell) != this.anchorCell_.key) {
            // In case we encounter a textual cell in range during adding, or
            // encounter a non-owned cell during resizing, we discard all
            // non-start cells and reset the start cell to the anchor.
            this.startCell_ = this.anchorCell_;
            this.endCell_ = null;
            this.nonStartCells_ = [];
            return;
          }
          this.nonStartCells_.push(currCell);
        }
        currCell = currCell.getNeighbors('right').cells[0];
        if (!currCell) break;
      }
      rowStart = rowStart.getNeighbors('bottom').cells[0];
      if (!rowStart) break;
    }
  }

  createHoverWidget_() {
    if (this.hoverWidget_) return;
    this.hoverWidget_ = createAndAppendDivWithClass(
        this.startCell_.gridElement, 'text-hover-widget');
    this.hoverWidget_.style.left =
        this.startCell_.offsetLeft - this.startCell_.offsetLeft;
    this.hoverWidget_.style.top =
        this.startCell_.offsetTop - this.startCell_.offsetTop;
    const textElement =
        this.startCell_.getOrCreateLayerElement(
            ct.text, this.createStartCellContent_());
    this.hoverWidget_.style.width = textElement.scrollWidth;
    this.hoverWidget_.style.height = textElement.scrollHeight;
    this.hoverWidget_.onclick = (e) => {
      if (e.button == 0) this.startEditing_();
    };
    this.hoverWidget_.onmousedown = (e) => e.stopPropagation();
    this.hoverWidget_.onmouseup = (e) => e.stopPropagation();
  }

  removeHoverWidget_() {
    if (this.hoverWidget_) {
      this.hoverWidget_.parentElement.removeChild(this.hoverWidget_);
      this.hoverWidget_ = null;
    }
  }

  createDeleteWidget_() {
    if (this.deleteWidget_) return;
    this.deleteWidget_ = createAndAppendDivWithClass(
        this.startCell_.gridElement, 'text-delete-widget');
    const textElement =
        this.startCell_.getOrCreateLayerElement(
            ct.text, this.createStartCellContent_());
    this.deleteWidget_.style.left = textElement.scrollWidth;
    const deleteGesture = new TextGesture();
    deleteGesture.mode_ = 'removing';
    deleteGesture.startCell_ = this.startCell_;
    deleteGesture.endCell_ = this.endCell_;
    deleteGesture.nonStartCells_ = this.nonStartCells_;
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
      this.finishEditing_();
      deleteGesture.startGesture();
      deleteGesture.stopGesture();
      state.opCenter.recordOperationComplete();
      e.stopPropagation();
      this.stopHover();
      this.startHover(this.startCell_);
    };
    this.deleteWidget_.onmousedown = (e) => e.stopPropagation();
    this.deleteWidget_.onmouseup = (e) => e.stopPropagation();
  }

  removeDeleteWidget_() {
    if (this.deleteWidget_) {
      this.deleteWidget_.parentElement.removeChild(this.deleteWidget_);
      this.deleteWidget_ = null;
    }
  }

  createResizeWidget_() {
    if (this.resizeWidget_) return;
    this.resizeWidget_ = createAndAppendDivWithClass(
        this.startCell_.gridElement, 'text-resize-widget');
    const textElement =
        this.startCell_.getOrCreateLayerElement(
            ct.text, this.createStartCellContent_());
    this.resizeWidget_.style.left = textElement.scrollWidth;
    this.resizeWidget_.style.top = textElement.scrollHeight;
    this.resizeWidget_.onmouseenter = (e) => e.stopPropagation();
    this.resizeWidget_.onmouseleave = (e) => e.stopPropagation();
    this.resizeWidget_.onmouseup = (e) => e.stopPropagation();
    this.resizeWidget_.onmousedown = (e) => {
      this.removeHoverWidget_();
      this.removeDeleteWidget_();
      this.removeMoveWidget_();
      this.anchorCell_ = this.startCell_;
      this.originalEndCell_ = this.endCell_;
      this.mode_ = 'resizing';
      e.stopPropagation();
    }
  }

  removeResizeWidget_() {
    if (this.resizeWidget_) {
      this.resizeWidget_.parentElement.removeChild(this.resizeWidget_);
      this.resizeWidget_ = null;
    }
  }

  createMoveWidget_() {
    if (this.moveWidget_) return;
    this.moveWidget_ = createAndAppendDivWithClass(
        this.startCell_.gridElement, 'text-move-widget');
    const textElement =
        this.startCell_.getOrCreateLayerElement(
            ct.text, this.createStartCellContent_());
    this.moveWidget_.onmouseenter = (e) => e.stopPropagation();
    this.moveWidget_.onmouseleave = (e) => e.stopPropagation();
    this.moveWidget_.onmouseup = (e) => e.stopPropagation();
    this.moveWidget_.onmousedown = (e) => {
      this.removeHoverWidget_();
      this.removeDeleteWidget_();
      this.removeResizeWidget_();
      this.anchorCell_ = this.startCell_;
      this.originalEndCell_ = this.endCell_ || this.startCell_;
      this.mode_ = 'moving';
      e.stopPropagation();
    }
  }

  removeMoveWidget_() {
    if (this.moveWidget_) {
      this.moveWidget_.parentElement.removeChild(this.moveWidget_);
      this.moveWidget_ = null;
    }
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
    this.finishEditing_();
    this.createDeleteWidget_();
    this.originalText_ = this.startCell_.getVal(ct.text, this.getValueKind_());
    const textElement =
        this.startCell_.getOrCreateLayerElement(
            ct.text, this.createStartCellContent_());
    this.textarea_ = document.createElement('textarea');
    this.textarea_.className = 'text-cell-textarea';
    this.textarea_.style.width = textElement.offsetWidth + 2;
    this.textarea_.style.height = textElement.offsetHeight + 2;
    if (this.startCell_.hasLayerContent(ct.text)) {
      this.textarea_.value = this.startCell_.getVal(ct.text, this.getValueKind_());
    }
    this.startCell_.gridElement.appendChild(this.textarea_);
    this.textarea_.onkeydown = (e) => {
      if (this.isTextFinishingEvent_(e)) {
        this.finishEditing_(e);
      }
    }
    this.textarea_.onkeyup = (e) => {
      if (this.isTextFinishingEvent_(e)) {
        return;
      }
      this.apply_();
      this.setTextareaGeometry_(this.startCell_, null);
    }
    this.textarea_.onmousedown = (e) => e.stopPropagation();
    this.textarea_.onmouseup = (e) => e.stopPropagation();
    const content = this.startCell_.getLayerContent(ct.text);
    if (content) {
      this.setTextareaGeometry_(this.startCell_, content);
    }
    this.textarea_.focus();
    this.textarea_.select();
  }

  setTextareaGeometry_(startCell, initialContent) {
    const startCellElement =
        startCell.getOrCreateLayerElement(ct.text, initialContent);
    this.textarea_.style.fontSize = startCellElement.style.fontSize;
    if (startCell.textHeight) {
      const whitespace =
          startCellElement.scrollHeight - startCell.textHeight;
      this.textarea_.style.paddingTop = (whitespace / 2 + 1) + 'px';
    }
  }

  isTextFinishingEvent_(keyboardEvent) {
    return keyboardEvent.key == 'Escape' ||
        (keyboardEvent.key == 'Enter' && !keyboardEvent.shiftKey);
  }

  finishEditing_(keyboardEvent) {
    if (this.textarea_) {
      this.textarea_.parentElement.removeChild(this.textarea_);
      this.textarea_ = null;
      this.anchorCell_ = null;
    }
    this.stopHover();
    if (keyboardEvent && keyboardEvent.key == 'Escape') {
      // Revert this whole thing!
      this.mode_ = 'reverting';
      this.apply_();
    }
    state.opCenter.recordOperationComplete();
  }

  isCellEligible_(cell) {
    return cell && cell.role == 'primary';
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
    // Finally, for resize / move gestures, remove text from cells that were removed
    // by this gesture.
    if (this.originalEndCell_) {
      this.anchorCell_.getPrimaryCellsInSquareTo(this.originalEndCell_)
          .forEach(cell => {
            if (cell != this.startCell_ &&
                !this.nonStartCells_.includes(cell)) {
              cell.setLayerContent(ct.text, null, true);
            }
          });
    }
  }

  createStartCellContent_() {
    let text = 'Text';
    switch (this.mode_) {
      case 'removing':
        text = null;
        break;
      case 'resizing':
      case 'moving':
        text = this.anchorCell_.getVal(ct.text, this.getValueKind_());
        break;
      case 'editing':
        text = this.startCell_.getVal(ct.text, this.getValueKind_());
        // Intentional fallthrough.
      case 'adding':
        if (this.textarea_) {
          text = this.textarea_.value;
        }
        break;
      case 'reverting':
        text = this.originalText_;
        break;
    }
    if (!text) return null;
    const content = {
      [ck.kind]: ct.text.text.id,
      [ck.variation]: ct.text.text.standard.id,
      [this.getValueKind_()]: text,
    };
    if (this.endCell_) {
      content[ck.endCell] = this.endCell_.key;
    }
    return content;
  }

  createNonStartCellContent_() {
    let isDelete = false;
    switch (this.mode_) {
      case 'removing':
        isDelete = true;
        break;
      case 'resizing':
      case 'moving':
        isDelete = false;
        break;
      case 'editing':
      case 'adding':
        isDelete = this.textarea_ && !this.textarea_.value;
        break;
      case 'reverting':
        isDelete = !this.originalText_;
        break;
    }
    return isDelete ? null : {
      [ck.kind]: ct.text.text.id,
      [ck.variation]: ct.text.text.standard.id,
      [ck.startCell]: this.startCell_.key,
    };
  }
  
  getValueKind_() {
    return ck.text;
  }
}
