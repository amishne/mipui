class EraseGesture extends Gesture {
  constructor(layers) {
    super();
    this.requiredGestureLayers_ =
        [ct.elevation, ct.gmoverlay, ct.images, ct.mask, ct.text];
    this.layers_ = layers;
    this.requiredGestures_ = this.layers_
        .filter(layer => this.requiredGestureLayers_.includes(layer))
        .map(layer => new SimpleEraseGesture(layer));
    this.gestures_ = [];
  }

  startHover(cell) {
    if (!cell) return;
    this.gestures_ = this.createGestures_(cell);
    this.gestures_.forEach(gesture => gesture.startHover(cell));
  }

  stopHover() {
    this.gestures_.forEach(gesture => gesture.stopHover());
    this.gestures_ = [];
  }

  startGesture() {
    super.startGesture();
    this.gestures_.forEach(gesture => gesture.startGesture());
  }

  continueGesture(cell) {
    // We can't continue the gesture, because we don't necessarily have all the
    // right gestures for the next cell.
    this.stopGesture();
    this.gestures_ = this.createGestures_(cell);
    this.gestures_.forEach(gesture => gesture.startHover(cell));
    this.gestures_.forEach(gesture => gesture.startGesture(cell));
  }

  stopGesture() {
    super.stopGesture();
    this.gestures_.forEach(gesture => gesture.stopGesture());
    this.gestures_ = [];
    state.opCenter.recordOperationComplete();
  }

  createGestures_(cell) {
    return this.layers_
        .filter(layer => cell.hasLayerContent(layer))
        .map(layer => this.createGestureForLayer_(layer, cell))
        .filter(gesture => !!gesture)
        .concat(this.requiredGestures_);
  }

  createGestureForLayer_(layer, cell) {
    const cellContent = cell.getLayerContent(layer);
    const kind = cellContent ? layer.children[cellContent[ck.kind]] : null;
    const variation = kind ? kind.children[cellContent[ck.variation]] : null;
    switch (layer) {
      case ct.floors:
        return new ShapeGesture(
            ct.floors, ct.floors.pit, ct.floors.pit.square, 8);
      case ct.walls:
        return new WallGesture(1, true);
      case ct.separators:
        return new SeparatorGesture(null, null, false);
      case ct.shapes:
        return new ShapeGesture(layer, kind, variation, 16);
      case ct.elevation:
        if (kind == ct.elevation.passage) {
          return new PassageGesture(
              ct.elevation, ct.elevation.passage, variation, 8);
        }
        break;
    }
    return null;
  }
}
