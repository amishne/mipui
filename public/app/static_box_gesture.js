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
    switch (this.layer_) {
      case ct.elevation: return 'delete-widget stairs-delete-widget';
      case ct.images: return 'delete-widget image-delete-widget';
      case ct.text: return 'delete-widget text-delete-widget';
    }
  }

  getResizeWidgetCssClassName_() {
    switch (this.layer_) {
      case ct.elevation: return 'resize-widget stairs-resize-widget';
      case ct.images: return 'resize-widget image-resize-widget';
      case ct.text: return 'resize-widget text-resize-widget';
    }
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
    switch (this.layer_) {
      case ct.elevation: return 'move-widget stairs-move-widget';
      case ct.images: return 'move-widget image-move-widget';
      case ct.text: return 'move-widget text-move-widget';
    }
  }

  setInputGeometry_(inputElement, startCell, initialContent) {
    // Do nothing.
  }
}
