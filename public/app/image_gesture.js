class ImageGesture extends StaticBoxGesture {
  constructor(layer, kind, variation, image, imageHash) {
    super();
    this.layer_ = layer;
    this.kind_ = kind;
    this.variation_ = variation;
    this.image_ = image;
    this.imageHash_ = null;
    if (imageHash) {
      this.imageHash_ = imageHash;
    } else {
      const imagePath = 'public/app/' + image;
      const icon = gameIcons.find(gameIcon => gameIcon.path == imagePath);
      if (icon) this.imageHash_ = icon.hash;
    }

    this.valueKey_ = this.imageHash_ ? ck.imageHash : ck.image;
    this.imagePath_ = this.imageHash_ || this.image_;
  }

  setVariation(variation) {
    this.variation_ = variation;
  }

  createNewGesture_() {
    return new ImageGesture(
        this.layer_,
        this.kind_,
        this.variation_,
        this.image_,
        this.imageHash_);
  }

  getDefaultContent_() {
    return this.imagePath_;
  }

  getValueKey_() {
    return this.valueKey_;
  }
}
