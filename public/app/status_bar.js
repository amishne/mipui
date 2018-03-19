const STATUS_BAR_HEIGHT = 20;

class StatusBar {
  constructor(heightFromBottom, color) {
    const parent = document.getElementById('mapContainer') || document.body;
    this.element_ = createAndAppendDivWithClass(parent, 'status-bar');
    this.element_.style.bottom = (heightFromBottom + 1) * STATUS_BAR_HEIGHT;
    if (color) this.element_.style.color = color;
  }

  showMessage(text) {
    this.element_.innerHTML = text;
    this.element_.style.visibility = 'visible';
  }

  showProgress(text, curr, total) {
    this.showMessage(text);
    const progress =
        createAndAppendDivWithClass(this.element_, 'status-bar-progress');
    progress.style.width = 100 * cuur / total;
    progress.style.paddingRight = 100 * (1 - cuur / total);
  }

  hideMessage() {
    this.element_.style.visibility = 'hidden';
    this.element_.innerHTML = '';
  }
}
