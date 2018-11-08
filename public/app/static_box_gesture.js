class StaticBoxGesture extends BoxGesture {
  constructor(layer, kind, variation) {
    super();
    this.layer_ = layer;
    this.kind_ = kind;
    this.variation_ = variation;
  }

  setVariation(variation) {
    this.variation_ = variation;
  }

  isEditable_() {
    return false;
  }

  createNewGesture_() {
    return new StaticBoxGesture(
        this.layer_,
        this.kind_,
        this.variation_);
  }

  getDefaultContent_() {
    return undefined;
  }

  getValueKey_() {
    return null;
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
    return null;
  }

  getDefaultInputElementValue_() {
    return null;
  }

  getDeleteWidgetCssClassName_() {
    return 'image-delete-widget';
  }

  getResizeWidgetCssClassName_() {
    return 'image-resize-widget';
  }

  getHoverWidgetCssClassName_() {
    const classNames = [];
    classNames.push(
        this.isEditable_ ? 'image-hover-widget' : 'fixed-image-hover-widget');
    if (this.kind_ == ct.elevation.spiral) {
      switch (this.variation_) {
        case ct.elevation.spiral.generic:
          break;
        case ct.elevation.spiral.rotated90:
          //classNames.push('rotated-90');
          break;
        case ct.elevation.spiral.rotated180:
          //classNames.push('rotated-180');
          break;
        case ct.elevation.spiral.rotated270:
          //classNames.push('rotated-270');
          break;
      }
    }
    return classNames.join(' ');
  }

  getMoveWidgetCssClassName_() {
    return 'box-move-widget';
  }

  setInputGeometry_(inputElement, startCell, initialContent) {
    // Do nothing.
  }
}
