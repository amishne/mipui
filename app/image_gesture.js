class ImageGesture extends BoxGesture {
  constructor() {
    super();
  }

  createNewGesture_() {
    return new ImageGesture();
  }

  getDefaultContent_() {
    return 'assets/wyvern.svg';
  }

  getValueKey_() {
    return ck.image;
  }

  getLayer_() {
    return ct.images;
  }

  getKind_() {
    return this.getLayer_().image;
  }

  getVariation_() {
    return this.getKind_().background;
  }

  createInputElement_() {
    const element = document.createElement('textarea');
    element.className = 'image-cell-textarea';
    return element;
  }

  getDeleteWidgetCssClassName_() {
    return 'image-delete-widget';
  }

  getResizeWidgetCssClassName_() {
    return 'image-resize-widget';
  }

  getHoverWidgetCssClassName_() {
    return 'image-hover-widget';
  }

  getMoveWidgetCssClassName_() {
    return 'box-move-widget';
  }

  setInputGeometry_(inputElement, startCell, initialContent) {
    // Do nothing.
  }
}