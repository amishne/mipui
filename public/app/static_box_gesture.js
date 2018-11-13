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
    switch (this.layer_) {
      case ct.elevation: return 'hover-widget stairs-hover-widget';
      case ct.images: return 'hover-widget image-hover-widget';
      case ct.text: return 'hover-widget text-hover-widget';
    }
  }

  getHoverWidgetDuringDeleteClassName_() {
    switch (this.layer_) {
      case ct.elevation: return 'stairs-hover-widget-during-delete';
      case ct.images: return 'image-hover-widget-during-delete';
      case ct.text: return 'text-hover-widget-during-delete';
    }
  }

  getMoveWidgetCssClassName_() {
    return 'box-move-widget';
  }

  setInputGeometry_(inputElement, startCell, initialContent) {
    // Do nothing.
  }
}
