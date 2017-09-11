const Status = {
  INITIALIZING:
      {text: 'Initializing...', icon: 'cloud_queue', type: 'unstable'},
  READY: {text: 'Ready', icon: 'cloud_done', type: 'good'},
  LOADING: {text: 'Loading...', icon: 'cloud_download', type: 'unstable'},
  LOADING_FAILED: {text: 'Loading failed', icon: 'cloud_off', type: 'bad'},
  SAVING: {text: 'Saving...', icon: 'cloud_upload', type: 'unstable'},
  SAVED: {text: 'Saved', icon: 'cloud_done', type: 'good'},
  SAVE_ERROR: {text: 'Save error', icon: 'cloud_off', type: 'bad'},
  UPDATING: {text: 'Updating...', icon: 'cloud_download', type: 'unstable'},
  UPDATE_ERROR: {text: 'Update error', icon: 'cloud_off', type: 'bad'},
  AUTH_ERROR:
      {text: 'Authentication error', icon: 'cloud_off', type: 'bad'},
};

function setStatus(status) {
  const statusIconParent = document.getElementById('statusIconParent');
  const statusIcon = document.getElementById('statusIcon');
  const className = 'status-' + status.type;
  [statusIconParent, statusIcon].forEach(element => {
    element.classList.remove('status-bad', 'status-unstable', 'status-good');
    element.classList.add(className);
  });
  statusIcon.title = status.text;
  statusIcon.innerHTML = `<img src="assets/ic_${status.icon}_white_24px.svg">`;
}
