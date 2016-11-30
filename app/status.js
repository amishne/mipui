const Status = {
  INITIALIZING: 'Initializing...',
  READY: 'Ready',
  LOADING: 'Loading...',
  UNSAVED: 'Unsaved',
  SAVING: 'Saving...',
  SAVED: 'Saved',
  UPDATING: 'Updating...',
  LOADING_FAILED: 'Loading failed',
};

function setStatus(status) {
  const element = document.getElementById('status');
  element.textContent = status;
  switch(status) {
    case Status.INITIALIZING:
      element.className = 'status-initializing';
      break;
    case Status.READY:
      element.className = 'status-ready';
      break;
    case Status.LOADING:
      element.className = 'status-loading';
      break;
    case Status.UNSAVED:
      element.className = 'status-unsaved';
      break;
    case Status.SAVING:
      element.className = 'status-saving';
      break;
    case Status.SAVED:
      element.className = 'status-saved';
      break;
    case Status.UPDATING:
      element.className = 'status-updating';
      break;
    case Status.LOADING_FAILED:
      element.className = 'status-loading-failed';
  }
}
