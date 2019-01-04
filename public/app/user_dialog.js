class UserDialog extends Dialog {
  getAcceptButtonText_() {
    return null;
  }
  showDialogContent_() {
    createAndAppendDivWithClass(
        this.dialogElement_, 'firebaseui-auth-container');
  }
}
