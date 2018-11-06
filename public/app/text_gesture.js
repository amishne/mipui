class TextGesture extends BoxGesture {
  constructor(kind, variation, rotation) {
    super();
    this.kind_ = kind;
    this.variation_ = variation;
    this.rotation_ = rotation;
  }

  isEditable_() {
    return true;
  }

  getDefaultContent_() {
    return 'Text';
  }

  getValueKey_() {
    return ck.text;
  }

  getLayer_() {
    return ct.text;
  }

  getKind_() {
    return this.kind_;
  }

  getVariation_() {
    return this.variation_;
  }

  createInputElement_() {
    const element = document.createElement('textarea');
    element.className = 'text-cell-textarea';
    return element;
  }

  getDefaultInputElementValue_() {
    return 'Text';
  }

  getDeleteWidgetCssClassName_() {
    return 'text-delete-widget';
  }

  getResizeWidgetCssClassName_() {
    return 'text-resize-widget';
  }

  getHoverWidgetCssClassName_() {
    return 'text-hover-widget';
  }

  getMoveWidgetCssClassName_() {
    return 'box-move-widget';
  }

  createNewGesture_() {
    return new TextGesture();
  }

  setInputGeometry_(inputElement, startCell, initialContent) {
    if (this.rotation_ && !inputElement.style.transform) {
      const temp = inputElement.style.width;
      inputElement.style.width = inputElement.style.height;
      inputElement.style.height = temp;
      let offset = '0px';
      switch (this.rotation_) {
        case 'rotated-90':
          inputElement.style.transform = 'rotate(90deg)';
          offset = inputElement.style.height;
          break;
        case 'rotated-270':
          inputElement.style.transform = 'rotate(270deg)';
          offset = inputElement.style.width;
          break;
      }
      const halfOffset = Number.parseFloat(offset) / 2;
      inputElement.style.transformOrigin = `${halfOffset}px ${halfOffset}px`;
    }
    const startCellElement = startCell.getBaseElementAndMaybeCreateAllElements(
        this.getLayer_(), initialContent, false);
    if (!startCellElement) return;
    inputElement.style.fontSize = startCellElement.children[0].style.fontSize;
    if (startCell.textHeight) {
      const whitespace = !!this.rotation_ ?
        startCellElement.scrollWidth - startCell.textHeight :
        startCellElement.scrollHeight - startCell.textHeight;
      inputElement.style.paddingTop = (whitespace / 2 + 1) + 'px';
    }
  }

  createStartCellContent_() {
    const content = super.createStartCellContent_();
    if (!content) return content;
    if (this.rotation_) {
      if (this.rotation_ == 'rotated-90') {
        content[ck.transform] = 'r90';
      } else if (this.rotation_ == 'rotated-270') {
        content[ck.transform] = 'r270';
      }
    }
    return content;
  }
}
