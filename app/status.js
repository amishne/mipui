const Status = {
  INITIALIZING: 'Initializing...',
  READY: 'Ready',
  LOADING: 'Loading...',
  LOADING_FAILED: 'Loading failed',
  UNSAVED: 'Unsaved',
  SAVING: 'Saving...',
  SAVED: 'Saved',
  SAVE_ERROR: 'Save error',
  UPDATING: 'Updating...',
  UPDATE_ERROR: 'Update error',
};

function setStatus(status) {
  const element = document.getElementById('status');
  element.textContent = status;
  switch(status) {
    // No work can be done in these cases:
    case Status.INITIALIZING:
    case Status.LOADING:
    case Status.LOADING_FAILED:
      element.className = 'status-error';
      break;
    // Something's still progress or not quite right, but work can be done:
    case Status.UNSAVED:
    case Status.SAVING:
    case Status.UPDATING:
      element.className = 'status-unstable';
      break;
    // Everything's good:
    case Status.READY:
    case Status.SAVED:
      element.className = 'status-good';
      break;
  }
}
