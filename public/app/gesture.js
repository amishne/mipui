class Gesture {
  startHover(cell) {}
  stopHover() {}
  startGesture() {}
  continueGesture(cell) {}
  stopGesture() {}
  onUnselect() {
    this.stopHover();
  }
}