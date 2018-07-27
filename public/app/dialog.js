class Dialog {
  constructor() {
    this.overlay_ = null;
    this.acceptButton_ = null;
    this.dialogElement_ = null;
  }

  show() {
    this.overlay_ = createAndAppendDivWithClass(document.body, 'modal-overlay');
    state.dialog = this;
    this.dialogElement_ =
        createAndAppendDivWithClass(this.overlay_, 'modal-dialog');
    this.showDialogContent_();
    const dialogButtons =
      createAndAppendDivWithClass(this.dialogElement_, 'modal-dialog-line');
    this.acceptButton_ = document.createElement('button');
    this.acceptButton_.className =
        'modal-dialog-button modal-dialog-accept-button';
    dialogButtons.appendChild(this.acceptButton_);
    this.acceptButton_.textContent = this.getAcceptButtonText_();
    this.acceptButton_.onclick = () => this.accept();
    const cancelButton = document.createElement('button');
    dialogButtons.appendChild(cancelButton);
    cancelButton.className = 'modal-dialog-button modal-dialog-cancel-button';
    cancelButton.textContent = 'Cancel';
    cancelButton.onclick = () => this.cancel();
  }

  async accept() {
    this.acceptButton_.textContent = this.getActivatedAcceptButtonText_();
    this.acceptButton_.disabled = 1;
    await this.act_();
    this.close_();
  }

  cancel() {
    this.close_();
  }

  close_() {
    this.overlay_.parentElement.removeChild(this.overlay_);
    state.dialog = null;
  }

  getAcceptButtonText_() {
    throw new Error('Missing accept button text.');
  }
  getActivatedAcceptButtonText_() {
    throw new Error('Missing activated accept button text.');
  }
  showDialogContent_() {
    throw new Error('Missing dialog content.');
  }
  async act_() {
    throw new Error('Missing act logic.');
  }
}
