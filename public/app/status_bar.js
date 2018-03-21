const STATUS_BAR_HEIGHT = 20;

class StatusBar {
  constructor(heightFromBottom, color) {
    const parent = document.getElementById('mapContainer') || document.body;
    this.element_ = createAndAppendDivWithClass(parent, 'status-bar');
    this.element_.style.bottom = (heightFromBottom + 1) * STATUS_BAR_HEIGHT;
    if (color) this.element_.style.color = color;
    this.progressCounter_ = 0;
    this.progressTotal_ = 0;
  }

  showMessage(text) {
    this.element_.innerHTML = text;
    this.element_.style.visibility = 'visible';
  }

  showProgress(text, total) {
    this.progressTotal_ = total;
    this.showProgress_(text, 0, total);
  }

  resetProgress() {
    this.progressCounter_ = 0;
    this.progressTotal_ = 0;
    this.hideMessage();
  }

  incrementProgress(text) {
    if (this.progressTotal_ == 0) return;
    this.progressCounter_++;
    this.showProgress_(text, this.progressCounter_, this.progressTotal_);
  }

  showProgress_(text, curr, total) {
    if (curr >= total) {
      this.resetProgress();
    }
    this.showMessage(text);
    const progress =
        createAndAppendDivWithClass(this.element_, 'status-bar-progress');
    progress.style.width = 100 * curr / total;
    progress.style.borderRightWidth = 100 * (1 - curr / total);
  }

  hideMessage() {
    this.element_.style.visibility = 'hidden';
    this.element_.innerHTML = '';
  }
}
