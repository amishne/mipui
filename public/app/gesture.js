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
    let count = 0;
    state.theMap.tiles.forEach(tile => {
      count += tile.hideHighlight() ? 1 : 0;
    });
    if (count > 0) {
      debug(`Deactivating ${count} tiles stuck on 'highlight' lock.`);
    }
  }
}
