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
  AUTH_ERROR: 'Authentication error',
};

function setStatus(status) {
  const statusIcon = document.getElementById('status-icon');
  const statusText = document.getElementById('status-text');
  const setClass = (className) => {
    [statusIcon, statusText].forEach(element => {
      element.classList
          .remove('status-error', 'status-unstable', 'status-good');
      element.classList.add(className);
    });
  };
  statusText.textContent = status;
  switch(status) {
    // No work can be done in these cases:
    case Status.INITIALIZING:
    case Status.LOADING:
    case Status.LOADING_FAILED:
      setClass('status-error');
      break;
    // Something's still progress or not quite right, but work can be done:
    case Status.UNSAVED:
    case Status.SAVING:
    case Status.UPDATING:
    case Status.UPDATE_ERROR:
    case Status.AUTH_ERROR:
      setClass('status-unstable');
      break;
    // Everything's good:
    case Status.READY:
    case Status.SAVED:
      setClass('status-good');
      break;
  }
}
