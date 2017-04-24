class ImageGesture extends BoxGesture {
  constructor(layer, kind, variation, defaultImage, isEditable, imageHash) {
    super();
    this.layer_ = layer;
    this.kind_ = kind;
    this.variation_ = variation;
    this.defaultImage_ = defaultImage;
    this.isEditable__ = isEditable;
    this.imageHash_ = null;
    if (imageHash) {
      this.imageHash_ = imageHash;
    } else {
      const imagePath = 'public/app/' + defaultImage;
      const icon = gameIcons.find(gameIcon => gameIcon.path == imagePath);
      if (icon) this.imageHash_ = icon.hash;
    }
  }

  isEditable_() {
    return this.isEditable__;
  }

  createNewGesture_() {
    return new ImageGesture(
        this.layer_,
        this.kind_,
        this.variation_,
        this.defaultImage_,
        this.isEditable__);
  }

  getDefaultContent_() {
    return this.imageHash_ || this.defaultImage_;
  }

  getValueKey_() {
    return this.imageHash_ ? ck.imageHash : ck.image;
  }

  getLayer_() {
    return this.layer_;
  }

  getKind_() {
    return this.kind_;
  }

  getVariation_() {
    return this.variation_;
  }

  createInputElement_() {
    if (!this.isEditable_) return null;
    const element = document.createElement('textarea');
    element.className = 'image-cell-textarea';
    return element;
  }

  getDefaultInputElementValue_() {
    return '<url>';
  }

  getDeleteWidgetCssClassName_() {
    return 'image-delete-widget';
  }

  getResizeWidgetCssClassName_() {
    return 'image-resize-widget';
  }

  getHoverWidgetCssClassName_() {
    return this.isEditable_? 'image-hover-widget' : 'fixed-image-hover-widget';
  }

  getMoveWidgetCssClassName_() {
    return 'box-move-widget';
  }

  setInputGeometry_(inputElement, startCell, initialContent) {
    // Do nothing.
  }
}