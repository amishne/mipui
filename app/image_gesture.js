class ImageGesture extends TextGesture {
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

  getTextareaCssClassName_() {
    return 'image-cell-textarea';
  }

  getDeleteWidgetCssClassName_() {
    return 'image-delete-widget';
  }

  getResizeWidgetCssClassName_() {
    return 'image-resize-widget';
  }
}