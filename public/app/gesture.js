class Gesture {
  startHover(cell) {}
  stopHover() {}
  startGesture() {
    state.theMap.lockTiles();
  }
  continueGesture(cell) {}
  stopGesture() {
    state.theMap.unlockTiles();
  }
  onUnselect() {
    state.theMap.unlockTiles();
    this.stopHover();
  }
}
