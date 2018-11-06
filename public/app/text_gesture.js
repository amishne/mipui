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
    const startCellElement = startCell.getBaseElementAndMaybeCreateAllElements(
        this.getLayer_(), initialContent, false);
    if (!startCellElement) return;
    inputElement.style.fontSize = startCellElement.style.fontSize;
    if (startCell.textHeight) {
      const whitespace =
          startCellElement.scrollHeight - startCell.textHeight;
      inputElement.style.paddingTop = (whitespace / 2 + 1) + 'px';
    }
  }

  createStartCellContent_() {
    const content = super.createStartCellContent_();
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
