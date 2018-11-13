class BoxGesture extends Gesture {
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
    // The top-left box cell; contains the box content.
    this.startCell_ = null;
    // The bottom-right box cell; to be referred by startCell_'s content.
    this.endCell_ = null;
    // All cells belonging to the box, except the top-left one.
    this.nonStartCells_ = [];
    // The end cell when the gesture started, if any - used for resizing.
    this.originalEndCell_ = null;
    // The box as it was when editing started - used for reverting to it after
    // canceling the edit.
    this.originalValue_ = null;
    // Status bar message for the size message.
    this.cursorStatusBarMessage_ = '';
    // Delegated gesture in case there's existing non-box content to remove.
    this.delegatedGesture_ = null;

    // Owned elements.

    // Input element - created when editing the box.
    this.inputElement_ = null;
    // Widget appearing on hover, for special cursor and start-edit-on-click.
    this.hoverWidget_ = null;
    // Widget appearing on hover, for deleting the box.
    this.deleteWidget_ = null;
    // Widget appearing on hover, for resizing the box.
    this.resizeWidget_ = null;
    // Widget appearing on hover, for moving the box.
    this.moveWidget_ = null;
  }

  startHover(cell) {
    if (this.inputElement_) {
      // As long as there's an edit in progress, hovering changes are disabled.
      return;
    }

    this.delegatedGesture_ = null;
    if (this.isShapeContent_(cell)) {
      this.delegatedGesture_ = this.createDelegatedGesture_(cell);
      this.delegatedGesture_.startHover(cell);
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
          this.targetCell_.hasLayerContent(
              this.getLayer_()) ? 'editing' : 'adding';
      this.calculateBoxExtent_(true);
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
    if (this.inputElement_) {
      // There's an edit in progress - do not cancel the hover artifacts.
      return;
    }

    if (this.delegatedGesture_) {
      this.delegatedGesture_.stopHover();
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
    if (this.delegatedGesture_) {
      this.delegatedGesture_.startGesture();
      return;
    }

    this.cursorStatusBarMessage_ = 'Width: 1 Height: 1';
    super.startGesture();
    const editWasInProgress = this.finishEditing_();

    if (!this.startCell_) {
      return;
    }

    if (editWasInProgress) {
      this.startCell_ = null;
      return;
    }

    switch (this.mode_) {
      case 'adding':
        this.anchorCell_ = this.targetCell_;
        if (this.isCellEligible_(this.hoveredCell_)) {
          this.showHighlight_();
        }
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
    if (this.inputElement_) {
      // There's an edit in progress, do not allow continuing the gesture.
      return;
    }

    if (this.delegatedGesture_) {
      this.delegatedGesture_.continueGesture(cell);
      return;
    }

    if (this.mode_ == 'adding' || this.mode_ == 'resizing' ||
        this.mode_ == 'moving') {
      this.hideHighlight_();
      this.hoveredCell_ = cell;
      if (this.hoveredCell_.role != 'primary') {
        if (this.mode_ == 'resizing' || this.mode_ == 'adding') {
          state.cursorStatusBar.showMessage(this.cursorStatusBarMessage_);
        }
        if (this.mode_ == 'resizing' || this.mode_ == 'moving') {
          this.showHighlight_();
        }
        return;
      }
      if (this.mode_ == 'moving') {
        // Hide the original location.
        this.mode_ = 'removing';
        this.showHighlight_();
        this.mode_ = 'moving';
      }
      this.targetCell_ = this.hoveredCell_;
      this.calculateBoxExtent_();
      this.showHighlight_();
      if (this.endCell_ &&
          (this.mode_ == 'resizing' || this.mode_ == 'adding')) {
        this.cursorStatusBarMessage_ =
            `Width: ${
              1 + Math.abs(this.startCell_.column - this.endCell_.column)} ` +
            `Height: ${1 + Math.abs(this.startCell_.row - this.endCell_.row)}`;
        state.cursorStatusBar.showMessage(this.cursorStatusBarMessage_);
      }
    }
  }

  stopGesture() {
    if (this.delegatedGesture_) {
      this.delegatedGesture_.stopGesture();
      this.delegatedGesture_ = null;
      return;
    }

    super.stopGesture();
    if ((this.mode_ == 'adding' || this.mode_ == 'resizing' ||
         this.mode_ == 'moving') && this.startCell_) {
      this.stopHover();
      if (this.mode_ == 'adding') {
        if (!this.isCellEligible_(this.hoveredCell_)) {
          return;
        }
        if (this.isEditable_()) {
          this.startEditing_();
        } else {
          this.apply_();
          this.anchorCell_ = null;
          this.originalEndCell_ = null;
          this.targetCell_ = null;
          this.startCell_ = null;
          this.nonStartCells_ = [];
          this.hoveredCell_ = null;
        }
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
    // Hovering over a divider cell in the middle of the box behaves as if
    // hovering over the next cell.
    if (this.hoveredCell_.role == 'horizontal') {
      const topCell = this.hoveredCell_.getNeighbors('top').cells[0];
      const bottomCell = this.hoveredCell_.getNeighbors('bottom').cells[0];
      if (this.cellsBelongToSameBox_(topCell, bottomCell)) {
        this.targetCell_ = bottomCell;
      }
    } else if (this.hoveredCell_.role == 'vertical') {
      const leftCell = this.hoveredCell_.getNeighbors('left').cells[0];
      const rightCell = this.hoveredCell_.getNeighbors('right').cells[0];
      if (this.cellsBelongToSameBox_(leftCell, rightCell)) {
        this.targetCell_ = rightCell;
      }
    } else if (this.hoveredCell_.role == 'corner') {
      const topLeftCell = this.hoveredCell_.getNeighbors('top-left').cells[0];
      const bottomRightCell =
          this.hoveredCell_.getNeighbors('bottom-right').cells[0];
      if (this.cellsBelongToSameBox_(topLeftCell, bottomRightCell)) {
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
  calculateBoxExtent_() {
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
          const predicate = cell => !cell.hasLayerContent(this.getLayer_()) ||
              cell == this.anchorCell_ ||
              cell.getVal(this.getLayer_(), ck.startCell) ==
                  this.anchorCell_.key;
          this.calculateBoxExtentBetween_(
              this.anchorCell_, this.targetCell_, predicate);
        }
        break;
      case 'editing':
        this.startCell_ =
            state.theMap.cells
                .get(this.targetCell_.getVal(this.getLayer_(), ck.startCell)) ||
            this.targetCell_;
        this.endCell_ =
            state.theMap.cells
                .get(this.startCell_.getVal(this.getLayer_(), ck.endCell));
        this.calculateBoxExtentBetween_(this.startCell_, this.endCell_);
        break;
      case 'moving':
        const predicate = cell => !cell.hasLayerContent(this.getLayer_()) ||
            cell == this.anchorCell_ ||
            cell.getVal(this.getLayer_(), ck.startCell) ==
                this.anchorCell_.key;
        if (!predicate(this.targetCell_)) {
          // The targeted cell is invalid. Set nothing.
        } else if (!this.originalEndCell_) {
          // Moving a 1-cell box.
          this.startCell_ = this.targetCell_;
          this.nonStartCells_ = [];
          this.endCell_ = null;
        } else {
          const width = this.originalEndCell_.column - this.anchorCell_.column;
          const height = this.originalEndCell_.row - this.anchorCell_.row;
          const newRow = this.targetCell_.row;
          const newColumn = this.targetCell_.column;
          const endCell = state.theMap.cells.get(
              CellMap.primaryCellKey(newRow + height, newColumn + width));
          this.calculateBoxExtentBetween_(
              this.targetCell_, endCell, predicate);
        }
        break;
    }
  }

  // Sets this.startCell_, this.endCell_ and this.nonStartCells_, using the
  // cells between cell1 and cell2.
  // If any of the cells fails the predicate, just sets this.startCell_ to
  // cell1.
  calculateBoxExtentBetween_(cell1, cell2, predicate) {
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
          if (currCell.hasLayerContent(this.getLayer_()) &&
              this.anchorCell_ &&
              currCell != this.anchorCell_ &&
              currCell.getVal(this.getLayer_(), ck.startCell) !=
                  this.anchorCell_.key) {
            // In case we encounter a same-layer cell in range during adding, or
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
        this.startCell_.gridElement, this.getHoverWidgetCssClassName_());
    this.hoverWidget_.style.left =
        (this.startCell_.offsetLeft - this.startCell_.offsetLeft) + 'px';
    this.hoverWidget_.style.top =
        (this.startCell_.offsetTop - this.startCell_.offsetTop) + 'px';
    const layerElement =
        this.startCell_.getBaseElementAndMaybeCreateAllElements(
            this.getLayer_(), this.createStartCellContent_(), true);
    this.hoverWidget_.style.width = (layerElement.clientWidth - 1) + 'px';
    this.hoverWidget_.style.height = (layerElement.clientHeight - 1) + 'px';
    this.hoverWidget_.onmousedown = e => {
      if (e.button == 0) {
        this.startEditing_();
        e.stopPropagation();
      }
    };
    this.hoverWidget_.onmouseup = () => {
      if (this.mode_ != 'editing') this.stopGesture();
    };
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
        this.startCell_.gridElement, this.getDeleteWidgetCssClassName_());
    const layerElement =
        this.startCell_.getBaseElementAndMaybeCreateAllElements(
            this.getLayer_(), this.createStartCellContent_(), true);
    this.deleteWidget_.style.left = layerElement.offsetWidth + 'px';
    const deleteGesture = this.createNewGesture_();
    deleteGesture.mode_ = 'removing';
    deleteGesture.startCell_ = this.startCell_;
    deleteGesture.endCell_ = this.endCell_;
    deleteGesture.nonStartCells_ = this.nonStartCells_;
    const hoverWidgetDuringDeleteClassName =
        this.getHoverWidgetDuringDeleteClassName_();
    this.deleteWidget_.onmouseenter = () => {
      deleteGesture.startHover(this.startCell_);
      if (hoverWidgetDuringDeleteClassName && this.hoverWidget_) {
        this.hoverWidget_.classList.add(hoverWidgetDuringDeleteClassName);
      }
    };
    this.deleteWidget_.onmouseleave = () => {
      deleteGesture.stopHover();
      this.startCell_.showHighlight(
          this.getLayer_(), this.startCell_.getLayerContent(this.getLayer_()));
      if (hoverWidgetDuringDeleteClassName && this.hoverWidget_) {
        this.hoverWidget_.classList.remove(hoverWidgetDuringDeleteClassName);
      }
    };
    this.deleteWidget_.onmousedown = e => {
      //this.finishEditing_();
      e.stopPropagation();
    };
    this.deleteWidget_.onmouseup = e => {
      if (e.buttons == 0) {
        deleteGesture.startGesture();
        deleteGesture.stopGesture();
        state.opCenter.recordOperationComplete();
        this.stopHover();
        this.startHover(this.startCell_);
        e.stopPropagation();
      }
    };
  }

  getHoverWidgetDuringDeleteClassName_() { return null; }

  removeDeleteWidget_() {
    if (this.deleteWidget_) {
      this.deleteWidget_.parentElement.removeChild(this.deleteWidget_);
      this.deleteWidget_ = null;
    }
  }

  createResizeWidget_() {
    if (this.resizeWidget_) return;
    this.resizeWidget_ = createAndAppendDivWithClass(
        this.startCell_.gridElement, this.getResizeWidgetCssClassName_());
    const layerElement =
        this.startCell_.getBaseElementAndMaybeCreateAllElements(
            this.getLayer_(), this.createStartCellContent_(), true);
    this.resizeWidget_.style.left = layerElement.offsetWidth + 'px';
    this.resizeWidget_.style.top = layerElement.offsetHeight + 'px';
    this.resizeWidget_.onmousedown = e => {
      this.removeHoverWidget_();
      this.removeDeleteWidget_();
      this.removeMoveWidget_();
      this.removeResizeWidget_();
      this.anchorCell_ = this.startCell_;
      this.originalEndCell_ = this.endCell_;
      this.mode_ = 'resizing';
      e.stopPropagation();
    };
    this.resizeWidget_.onmouseup = () => {
      this.stopGesture();
    };
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
        this.startCell_.gridElement, this.getMoveWidgetCssClassName_());
    this.startCell_.getBaseElementAndMaybeCreateAllElements(
        this.getLayer_(), this.createStartCellContent_(), true);
    this.moveWidget_.onmousedown = e => {
      this.removeHoverWidget_();
      this.removeDeleteWidget_();
      this.removeResizeWidget_();
      this.removeMoveWidget_();
      this.anchorCell_ = this.startCell_;
      this.originalEndCell_ = this.endCell_ || this.startCell_;
      this.mode_ = 'moving';
      e.stopPropagation();
    };
    this.moveWidget_.onmouseup = () => {
      this.stopGesture();
    };
  }

  removeMoveWidget_() {
    if (this.moveWidget_) {
      this.moveWidget_.parentElement.removeChild(this.moveWidget_);
      this.moveWidget_ = null;
    }
  }

  cellsBelongToSameBox_(topLeftCell, bottomRightCell) {
    if (!topLeftCell || !bottomRightCell) return false;
    const content1 = topLeftCell.getLayerContent(this.getLayer_());
    const content2 = bottomRightCell.getLayerContent(this.getLayer_());
    if (!content1 || !content2) return false;
    if (!content2[ck.startCell]) return false;

    return content2[ck.startCell] == topLeftCell.key ||
        content2[ck.startCell] == content1[ck.startCell];
  }

  startEditing_() {
    if (!this.isEditable_()) return;
    this.finishEditing_();
    state.theMap.lockTiles();
    this.createDeleteWidget_();
    this.originalValue_ =
        this.startCell_.getVal(this.getLayer_(), this.getValueKey_());
    const layerElement =
        this.startCell_.getBaseElementAndMaybeCreateAllElements(
            this.getLayer_(), this.createStartCellContent_(), true);
    this.inputElement_ = this.createInputElement_();
    this.inputElement_.style.width = (layerElement.offsetWidth + 2) + 'px';
    this.inputElement_.style.height = (layerElement.offsetHeight + 2) + 'px';
    this.inputElement_.value =
        this.startCell_.hasLayerContent(this.getLayer_()) ?
          this.startCell_.getVal(this.getLayer_(), this.getValueKey_()) :
          this.getDefaultInputElementValue_();
    this.inputElement_.select();
    this.startCell_.gridElement.appendChild(this.inputElement_);
    this.inputElement_.onkeydown = e => {
      e.stopPropagation();
      if (this.isInputFinishingEvent_(e)) {
        this.finishEditing_(e);
      }
    };
    this.inputElement_.onkeyup = e => {
      e.stopPropagation();
      if (this.isInputFinishingEvent_(e)) {
        return;
      }
      this.apply_();
      this.setInputGeometry_(this.inputElement_, this.startCell_, null);
    };
    this.inputElement_.onmousedown = e => e.stopPropagation();
    this.inputElement_.onmouseup = e => e.stopPropagation();
    const content = this.startCell_.getLayerContent(this.getLayer_());
    this.setInputGeometry_(this.inputElement_, this.startCell_, content || {
      [ck.kind]: this.getKind_().id,
      [ck.variation]: this.getVariation_().id,
      [ck.startCell]: this.startCell_.key,
    });
    this.inputElement_.focus();
    this.inputElement_.select();
  }

  isInputFinishingEvent_(keyboardEvent) {
    return keyboardEvent.key == 'Escape' ||
        (keyboardEvent.key == 'Enter' && !keyboardEvent.shiftKey);
  }

  finishEditing_(keyboardEvent) {
    state.theMap.unlockTiles();
    let editWasInProgress = false;
    if (this.inputElement_) {
      this.inputElement_.parentElement.removeChild(this.inputElement_);
      this.inputElement_ = null;
      this.anchorCell_ = null;
      editWasInProgress = true;
    }
    this.stopHover();
    if (keyboardEvent && keyboardEvent.key == 'Escape') {
      // Revert this whole thing!
      this.mode_ = 'reverting';
      this.apply_();
    }
    state.opCenter.recordOperationComplete();
    return editWasInProgress;
  }

  isCellEligible_(cell) {
    return cell && cell.role == 'primary';
  }

  showHighlight_() {
    this.startCell_.showHighlight(
        this.getLayer_(), this.createStartCellContent_());
    this.nonStartCells_.forEach(nonStartCell => {
      nonStartCell.showHighlight(
          this.getLayer_(), this.createNonStartCellContent_());
    });
  }

  hideHighlight_() {
    this.startCell_.hideHighlight(this.getLayer_());
    this.nonStartCells_.forEach(nonStartCell => {
      nonStartCell.hideHighlight(this.getLayer_());
    });
  }

  apply_() {
    this.startCell_.setLayerContent(
        this.getLayer_(), this.createStartCellContent_(), true);
    this.nonStartCells_.forEach(nonStartCell => {
      nonStartCell.setLayerContent(
          this.getLayer_(), this.createNonStartCellContent_(), true);
    });
    // Finally, for resize / move gestures, remove content from cells that were
    // removed by this gesture.
    if (this.originalEndCell_) {
      this.anchorCell_.getPrimaryCellsInSquareTo(this.originalEndCell_)
          .forEach(cell => {
            if (cell != this.startCell_ &&
                !this.nonStartCells_.includes(cell)) {
              cell.setLayerContent(this.getLayer_(), null, true);
            }
          });
    }
  }

  createStartCellContent_() {
    let kind = this.startCell_.getVal(this.getLayer_(), ck.kind);
    let variation = this.startCell_.getVal(this.getLayer_(), ck.variation);
    const valueKey = this.getValueKey_();
    let value = valueKey == null ? undefined :
      this.startCell_.getVal(this.getLayer_(), this.getValueKey_());
    switch (this.mode_) {
      case 'removing':
        return null;
      case 'resizing':
      case 'moving':
        kind = this.anchorCell_.getVal(this.getLayer_(), ck.kind);
        variation = this.anchorCell_.getVal(this.getLayer_(), ck.variation);
        value = valueKey == null ? undefined :
          this.anchorCell_.getVal(this.getLayer_(), valueKey);
        break;
      case 'adding':
        kind = this.getKind_().id;
        variation = this.getVariation_().id;
        value = valueKey == null ? undefined : this.getDefaultContent_();
        // Intentional fallthrough.
      case 'editing':
        if (this.inputElement_) {
          value = this.inputElement_.value;
        }
        break;
      case 'reverting':
        value = this.originalValue_;
        break;
    }
    if (valueKey != null && !value) return null;
    const content = {
      [ck.kind]: kind == null ? this.getKind_().id : kind,
      [ck.variation]: variation == null ? this.getVariation_().id : variation,
    };
    if (valueKey != null) {
      content[valueKey] = value;
    }
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
        isDelete = this.inputElement_ && !this.inputElement_.value;
        break;
      case 'reverting':
        isDelete = !this.originalValue_;
        break;
    }
    return isDelete ? null : {
      [ck.kind]: this.getKind_().id,
      [ck.variation]: this.getVariation_().id,
      [ck.startCell]: this.startCell_.key,
    };
  }

  isShapeContent_(cell) {
    return this.layer_ == ct.elevation &&
        cell.isKind(ct.elevation, ct.elevation.passage);
  }

  createDelegatedGesture_(cell) {
    const content = cell.getLayerContent(this.layer_);
    const kind = this.layer_.children[content[ck.kind]];
    const variation = kind.children[content[ck.variation]];
    if (this.layer_ == ct.elevation && kind == ct.elevation.passage) {
      return new PassageGesture(this.layer_, kind, variation, 8);
    }
    return new ShapeGesture(this.layer_, kind, variation, 8);
  }
}
