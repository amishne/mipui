class TextGesture extends BoxGesture {
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
    return this.getLayer_().text;
  }

  getVariation_() {
    return this.getKind_().standard;
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
    const startCellElement =
        startCell.getOrCreateLayerElement(this.getLayer_(), initialContent);
    if (!startCellElement) return;
    inputElement.style.fontSize = startCellElement.style.fontSize;
    if (startCell.textHeight) {
      const whitespace =
          startCellElement.scrollHeight - startCell.textHeight;
      inputElement.style.paddingTop = (whitespace / 2 + 1) + 'px';
    }
  }
}
