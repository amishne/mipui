// Maximum number of operations stored in the undo stack.
const MAX_STORED_OPERATIONS = 10000;

// This class is responsible for synchronizing operations between clients, and
// for managing the undo stack.
//
// An overview of syncing:
//
// There are two things being listened to: full-map changes and changes to the
// number of the latest operation.
// In a full-map change, local ops are paused, the entire local map is replaced
// with the one incoming from the server, and then local ops are resumed.
// In a latest-operation change, locals ops are paused, all the operations that
// should be read from the server are loaded and applied in the correct order
// once they arrive, and then local ops are resumed.
//
// Incoming server changes may invalidate local ops.
class OperationCenter {
  constructor() {
    // Current-operation-related fields.

    this.currentOperation_ = new Operation();
    this.autoSaveTimerId_ = null;

    // Synchronization-related fields.

    // All operations performed locally that have not yet been sent to and
    // accepted by the database.
    this.pendingLocalOperations_ = [];
    // All operations performed remotely that have been accepted by the
    // database but not yet applied locally, keyed by number.
    this.incomingRemoteOperations_ = {};
    // The last-operation num for the fullMap stored in the database. This is
    // not necessarily even loaded, let alone applied, locally.
    this.lastFullMapNum_ = 0;
    // The operation we are currently sending, to avoid re-applying it when
    // read.
    this.opBeingSent_ = null;
    // Whether opBeingSent_ has been accepted.
    this.opBeingSentWasAccepted_ = false;

    // Undo-related fields.

    // All operations that have been performed on the state since the last
    // state load (or creation). Some may not yet be accepted.
    // * Once the size of this objects exceeds MAX_STORED_OPERATIONS,
    //   newly-added operations will wipe old operations.
    this.appliedOperations_ = [];
    // The index of the latest applied operation in this.appliedOperations_.
    // May be different from this.appliedOperations_.length-1 when operations
    // are undoed.
    // * This is independent between clients.
    this.latestAppliedOperationIndex_ = -1;
  }

  // Records that a cell change has just been performed, as part of a complete
  // op.
  // This is used for constructing the current operation, and this starts an
  // operation-completed timer.
  recordCellChange(key, layer, oldContent, newContent) {
    this.currentOperation_.addCellChange(key, layer, oldContent, newContent);
    this.recordChange_();
  }

  // Records that a property change has just been performed, as part of a
  // complete op.
  // This is used for constructing the current operation, and this starts an
  // operation-completed timer.
  recordPropertyChange(property, oldContent, newContent) {
    this.currentOperation_.addPropertyChange(property, oldContent, newContent);
    this.recordChange_();
  }

  // Records that a local change to the current operation has occured.
  // This is used for updating the current operation, and this starts an
  // operation-completed timer.
  recordChange_() {
    if (this.autoSaveTimerId_) {
      clearTimeout(this.autoSaveTimerId_);
    }
    this.autoSaveTimerId_ = setTimeout(() => {
      this.autoSaveTimerId_ = null;
      this.recordOperationComplete();
    }, 5000);
  }

  // Undoes the last operation performed, if any.
  undo() {
    // An undo forces completion of the current op.
    this.recordOperationComplete();
    // this.latestAppliedOperationIndex_ holds the index of the operation that
    // should be undoed. Get the op and then decremenet that index.
    const op = this.appliedOperations_[this.latestAppliedOperationIndex_];
    if (!op) return;
    this.latestAppliedOperationIndex_--;
    // Undo!
    op.undo();
    // For the server, an undo is just a new local op, which happens to be the
    // reverse of the op we just undoed.
    this.pendingLocalOperations_.push(op.reverse());
    this.startSendingPendingLocalOperations_();
  }

  // Redoes the last operation that was undoed, if any.
  redo() {
    // A redo forces completion of the current op.
    this.recordOperationComplete();
    // this.latestAppliedOperationIndex_ holds the index right below the index
    // of the operation that should be redoed. Get the op and then increment
    // that index.
    const op = this.appliedOperations_[this.latestAppliedOperationIndex_ + 1];
    if (!op) return;
    this.latestAppliedOperationIndex_++;
    // Redo!
    op.redo();
    // For the server, a redo is just a new local op.
    this.pendingLocalOperations_.push(op);
    this.startSendingPendingLocalOperations_();
  }

  // Records that a local operation has been completed.
  // This updates the undo stack and sends the op to the server.
  recordOperationComplete() {
    if (this.currentOperation_.length == 0) return;
    this.currentOperation_.markComplete(true);
    this.addLocalOperation_(this.currentOperation_);
    this.currentOperation_ = new Operation();
    if (this.autoSaveTimerId_) {
      clearTimeout(this.autoSaveTimerId_);
      this.autoSaveTimerId_ = null;
    }
  }

  setStatus_(status) {
    this.status_ = status;
    setStatus(status);
  }

  // Starts listening for full-map changes, replacing the current map if a
  // change is detected.
  // This should be called once a map mid is known.
  startListeningForMap() {
    if (!state.getMid()) return;
    const mapPath = `/maps/${state.getMid()}/payload/fullMap`;
    firebase.database().ref(mapPath).on('value', fullMapRef => {
      if (!fullMapRef) return;
      const fullMap = fullMapRef.val();
      if (!fullMap) return;
      // Check if our map is the same (or newer!)
      if (fullMap.lastOpNum <= state.getLastOpNum()) return;

      // If there's a valid incoming full map change, first update the status
      // and break the current op so that it could properly be re-applied.
      this.setStatus_(Status.UPDATING);
      this.recordOperationComplete();
      // Replace the current map with the incoming one.
      state.load(fullMap);
      this.lastFullMapNum_ = fullMap.lastOpNum;
      // Update the status (TODO is that correct? Shouldn't we wait for the
      // local ops to be re-applied?)
      this.setStatus_(Status.READY);
    });
  }

  // Starts listening for operations performed on the map.
  // This should be called once a map mid is known.
  startListeningForOperations() {
    if (!state.getMid()) return;
    // Listening for latestOperation/i is sufficient to detect any ops on the
    // server.
    const latestOpIdentityPath =
        `/maps/${state.getMid()}/payload/latestOperation/i`;
    firebase.database().ref(latestOpIdentityPath).on('value', identityRef => {
      if (!identityRef) return;
      const identity = identityRef.val();
      if (!identity) return;

      // Handle the incoming op.
      // The op might be originating from this client, so check its number and
      // fingerprint.
      const num = typeof identity.n !== 'undefined' ? identity.n : -1;
      const fingerprint = typeof identity.f !== 'undefined' ? identity.f : -1;
      if (num < state.getLastOpNum()) {
        // This should never happen, since it means the local map is newer than
        // the server's map. Just skip this update, but notify in the status
        // that something is wrong.
        this.setStatus_(Status.UPDATE_ERROR);
      } else if (
        this.opBeingSent_ &&
            this.opBeingSent_.num == num &&
            this.opBeingSent_.fingerprint == fingerprint) {
        // This is caused by our own incomplete sendOp_().
        this.opBeingSentWasAccepted_ = true;
        state.setLastOpNum(num);
      } else if (num == state.getLastOpNum()) {
        // This is caused by our last completed sendOp_(), so do nothing.
      } else {
        // There's a legit incoming change!
        this.setStatus_(Status.UPDATING);
        // Seeing 'num' as the latest operation means that we need to read
        // all the numbers from the latest one we know to that num.
        let fromNum = this.lastFullMapNum_ + 1;
        this.lastFullMapNum_ = num;
        this.loadOperations_(fromNum, num);
      }
    });
  }

  // Loads all the operations with numbers from fromNum to toNum.
  loadOperations_(fromNum, toNum) {
    debug(`Loading operations ${fromNum} to ${toNum}...`);
    let i = fromNum;
    for (; i < toNum; i++) {
      this.loadOperation_(i, false);
    }
    this.loadOperation_(i, true);
  }

  loadOperation_(num, isLast) {
    debug(`Loading operation ${num}...`);
    if (this.opBeingSentWasAccepted_ && num == this.opBeingSent_.num) {
      // This is a local op.
      debug(`Skipping loading operation ${num} since it's local.`);
      return;
    }
    if (this.incomingRemoteOperations_[num]) {
      // The operation has already been loaded, do nothing.
      debug(`Operation ${num} already loaded.`);
      return;
    }
    const path = `/maps/${state.getMid()}/payload/operations/${num}`;
    firebase.database().ref(path).on('value', opDataRef => {
      if (!opDataRef) return;
      const opData = opDataRef.val();
      if (!opData) return;

      // The data is ready! Stop listening.
      firebase.database().ref(path).off('value');
      // And read it.
      const op = new Operation(opData);
      this.addRemoteOperation_(num, op);
    });
  }

  // Adds a new local operation. Expected to be called immediately after that
  // operation was performed on the state. The operation is assumed to not yet
  // be accepted.
  addLocalOperation_(op) {
    this.addOperation_(op);
    this.pendingLocalOperations_.push(op);
    this.startSendingPendingLocalOperations_();
  }

  // Stores a remote operation locally, and apply it if it's the next one to be
  // applied.
  addRemoteOperation_(num, op) {
    // Store it locally.
    debug(`Loaded remote operation ${num}.`);
    this.incomingRemoteOperations_[num] = op;
    // If it's the next operation we should apply, apply it!
    if (num == state.getLastOpNum() + 1) {
      this.applyRemoteOperation_(num, op);
    }
  }

  // Applies a remote operation locally.
  // This might cancel some of the pending local ops.
  applyRemoteOperation_(num, op) {
    debug(`Applying remote operation ${num}...`);
    // Stop the current operation.
    this.recordOperationComplete();
    // A remote operation is ready and loaded. Since it's remote, it hasn't
    // been locally applied yet nor added to the undo stack, but since it may
    // invalidate pending operations, before we add and apply it we temporarily
    // undo and then try to re-apply the pending local ops.
    this.stopSendingPendingLocalOperations_();
    this.undoPendingOperations_();
    this.addOperation_(op);
    op.redo();
    state.setLastOpNum(num);
    debug(`Remote operation ${num} applied:`);
    debug(op);
    delete this.incomingRemoteOperations_[num];
    // If there's another remote operation waiting, apply it; otherwise redo
    // pending ops that were undoed.
    const nextRemoteOperation = this.incomingRemoteOperations_[num + 1];
    if (nextRemoteOperation) {
      // A remote operation is next up again, and it was already loaded.
      this.applyRemoteOperation_(num + 1, nextRemoteOperation);
    } else {
      this.redoPendingOperations_();
      if (num >= this.lastFullMapNum_) {
        // This means we applied all the remote ops that we know of. Mark the
        // status as ready and resume sending local pending ops.
        this.setStatus_(Status.READY);
        // But first flush out the first pending operation, if it was accepted.
        if (this.opBeingSentWasAccepted_ &&
            this.pendingLocalOperations_.length > 0) {
          this.pendingLocalOperations_.shift();
        }
        this.startSendingPendingLocalOperations_();
      }
    }
  }

  // Undoes all the current pending local ops.
  // It's done by undoing the operations one-by-one, starting from the last
  // one.
  undoPendingOperations_() {
    const lastOpToRedo = this.pendingLocalOperations_.length - 1;
    // The first op might have already been sent and accepted.
    const firstOpToRedo = this.opBeingSentWasAccepted_ ? 1 : 0;
    for (let i = lastOpToRedo; i >= firstOpToRedo; i--) {
      this.pendingLocalOperations_[i].undo();
    }
  }

  // Redoes all the current pending local ops.
  // Operations that are not legal to redo are skipped.
  redoPendingOperations_() {
    const newPendingLocalOperations = [];
    // We apply the pending ops one-by-one as long as they are legal to apply.
    for (let i = 0; i < this.pendingLocalOperations_.length; i++) {
      const op = this.pendingLocalOperations_[i];
      if (i == 0 && this.opBeingSentWasAccepted_) {
        // If op 0 has already been accepted, it means it has not been undoed -
        // so just add it and continue.
        newPendingLocalOperations.push(op);
        continue;
      }
      if (op.isLegalToRedo()) {
        op.redo();
        newPendingLocalOperations.push(op);
      } else {
        // Operations that are now illegal to redo are considered "conflicting
        // operations". Report them and skip adding/applying them.
        debug(`Pending op #${i} in conflict`);
        debug(op);
      }
    }
    this.pendingLocalOperations_ = newPendingLocalOperations;
  }

  // Adds an operation to the applied operation array.
  // If there's no more room, the oldest stored operation will be dropped.
  addOperation_(op) {
    if (op.length == 0) {
      return;
    }

    this.appliedOperations_ =
        this.appliedOperations_
          .slice(0, this.latestAppliedOperationIndex_ + 1)
          .concat(op);
    this.latestAppliedOperationIndex_ = this.appliedOperations_.length - 1;
    if (this.appliedOperations_.length > MAX_STORED_OPERATIONS) {
      this.appliedOperations_.shift;
      this.latestAppliedOperationIndex_--;
    }
  }

  // Sends all the pending local ops as long as they are legal.
  startSendingPendingLocalOperations_() {
    if (this.pendingLocalOperations_.length == 0) {
      // If there are none pending, just stop. The next time a local op will
      // be added this method will be called again.
      this.stopSendingPendingLocalOperations_();
      return;
    }
    if (this.isCurrentlyProcessingPendingOperations_) {
      // We're in the middle of sending local pending ops, do nothing.
      return;
    }
    return this.sendPendingLocalOperations_();
  }

  // Sends the next pending local op. This is similar to
  // this.startSendingPendingLocalOperations_, except that this is called after
  // a local op was successfully sent.
  continueSendingPendingLocalOperations_() {
    if (this.pendingLocalOperations_.length == 0) {
      this.stopSendingPendingLocalOperations_();
      // This means we sent at least one op (since we're in
      // continueSendingPendingLocalOperations_) and no more ops are pending -
      // a successful save!
      this.setStatus_(Status.SAVED);
      return;
    }
    if (!this.isCurrentlyProcessingPendingOperations_) {
      // If this.isCurrentlyProcessingPendingOperations_ is false it means that
      // there's an incoming remote op; stop processing local ops for now, they
      // will resume after the remote ops are all processed.
      return;
    }
    return this.sendPendingLocalOperations_();
  }

  // Sends the first pending local op to the server.
  sendPendingLocalOperations_() {
    this.isCurrentlyProcessingPendingOperations_ = true;
    this.setStatus_(Status.SAVING);
    this.sendOp_(this.pendingLocalOperations_[0]);
  }

  // Signals that we should stop processing local ops.
  stopSendingPendingLocalOperations_() {
    this.isCurrentlyProcessingPendingOperations_ = false;
  }

  connectToExistingMap(mid, secret, callback) {
    if (!mid) return;
    if (state.getMid() != mid) state.setMid(mid);
    if (secret && state.getSecret() != secret) {
      state.setSecret(secret, () => {
        this.connectToExistingMap(mid, secret, callback);
      });
      return;
    }
    Array.from(document.getElementsByClassName('disabled-in-read-only-mode'))
      .forEach(element => {
        element.classList[secret ? 'remove' : 'add']('disabled-menu-item');
      });
    Array.from(document.querySelector('.disabled-in-read-only-mode textarea'))
      .forEach(element => {
        element.readonly = !secret;
      });
    this.startListeningForMap();
    this.startListeningForOperations();
    this.readMetadata_();
    callback();
  }

  createAndConnectToNewMapOnServer(callback) {
    state.setupNewMid(() => {
      const data = {
        payload: {},
        metadata: {
          created: firebase.database.ServerValue.TIMESTAMP
        },
        secret: state.getSecret()
      };
      firebase.database().ref(`/maps/${state.getMid()}`).set(data, error => {
        setStatus(Status.AUTH_ERROR);
      }).then(() => {
        this.connectToExistingMap(state.getMid(), state.getSecret(), callback);
      });
    });
  }

  readMetadata_() {
    const mid = state.getMid();
    firebase.database().ref(`/maps/${mid}/metadata`).once('value')
      .then(data => {
        state.metadata = data.val();
        this.updateMetadata_();
      });
  }

  updateMetadata_() {
    if (!state.metadata) return;
    if (state.metadata.created) {
      document.getElementById('createdOn').textContent =
          new Date(state.metadata.created).toUTCString();
    }
  }

  fork() {
    this.createAndConnectToNewMapOnServer(() => {
      this.rewrite_(state.getLastOpNum());
    });
  }

  // Sends an operation to the server.
  sendOp_(op) {
    if (!state.getMid()) {
      // First-ever operation!
      this.createAndConnectToNewMapOnServer(() => {
        this.sendOp_(op);
      });
      return;
    }
    // Assign the next available number to the operation. If the operation could
    // not be accepted with this number, it will need to be re-sent.
    op.num = state.getLastOpNum() + 1;
    // op.fingerprint, this.opBeingSent_ and this.opBeingSentWasAccepted_ are
    // used to check whether an incoming operation with the same number that we
    // just assigned is actually this very operation.
    op.fingerprint = Math.floor(Math.random() * 1000);
    this.opBeingSent_ = op;
    this.opBeingSentWasAccepted_ = false;

    const latestOperationPath =
        `/maps/${state.getMid()}/payload/latestOperation`;
    firebase.database().ref(latestOperationPath).transaction(currData => {
      // This condition enforces the linear constraint on operations.
      if (!currData || !currData.i || currData.i.n + 1 == op.num) {
        return op.data;
      }
    }, (error, committed, snapshot) => {
      this.opBeingSent_ = null;
      this.opBeingSentWasAccepted_ = false;
      if (error) {
        this.handleOperationSendError_(op, error);
      } else if (!committed) {
        this.handleOperationSendFailure_(op);
      } else {
        this.handleOperationSendSuccess_(op);
      }
    }, false /* suppress updates on intermediate states */);
  }

  // Handles a successful operation.
  handleOperationSendSuccess_(op) {
    debug('Local operation accepted');
    debug(op);
    this.pendingLocalOperations_.shift();
    if (state.getLastOpNum() < op.num) {
      state.setLastOpNum(op.num);
    }
    // Immediately try updating with the next pending operation (if any).
    this.continueSendingPendingLocalOperations_();
    // And concurrently, actually write the operation in its place.
    const opPath = `/maps/${state.getMid()}/payload/operations/${op.num}`;
    firebase.database().ref(opPath).set(op.data, error => {
      this.rewriteIfRequired_();
    });
  }

  // Handles a failed operation send.
  handleOperationSendFailure_(op) {
    // Failure means that other operations were executed concurrently remotely
    // and were accepted before op. So we have to wait until all remote
    // operations are applied, then retry.
    if (state.getLastOpNum() < op.num) {
      // No new incoming operation; just stop waiting until there is one.
      this.stopSendingPendingLocalOperations_();
    } else {
      // There was at least one remote operation after the send failure, so it
      // must have triggered a re-send. Do nothing and let that re-send carry
      // through.
    }
  }

  // Handles an error encountered when sending an operation.
  handleOperationSendError_(op, err) {
    // Not much to do here. Just hope that by the next time we send an
    // operation, the problem will be resolved. Meanwhile stop sending local
    // operations to avoid repeating the error.
    this.setStatus_(Status.SAVE_ERROR);
    this.stopSendingPendingLocalOperations_();
  }

  // Rewrites the full map on the server if it's determined to be this client's
  // responsibility.
  rewriteIfRequired_() {
    // Don't rewrite if there are still operations to send, either in progress:
    if (this.isCurrentlyProcessingPendingOperations_) return;
    // or waiting:
    if (this.pendingLocalOperations_.length > 0) return;

    const lastOpNum = state.getLastOpNum();
    // Don't rewrite if the lastFullMapNum_ isn't more than 10 operations out-
    // of-date.
    if (lastOpNum - this.lastFullMapNum_ <= 10) return;

    // To minimize two clients trying to rewrite precisely at the same time,
    // there's some basic requirement on the current operation num.
    if (lastOpNum % 3 != 0) return;

    this.rewrite_(lastOpNum);
  }

  // Rewrites the full map on the server to be up-to-date to 'num'.
  rewrite_(num) {
    debug(`Rewriting map to operation ${num}...`);
    const snapshot = JSON.parse(JSON.stringify(state.pstate_));
    const payloadPath = `/maps/${state.getMid()}/payload`;
    firebase.database().ref(payloadPath).transaction(currData => {
      if (currData) {
        // Verify the current fullMap isn't the same or newer.
        if (currData.fullMap && currData.fullMap.lastOpNum >= num) return;
        // Verify the latest operation is the current one.
        if (currData.latestOperation && currData.latestOperation.i.n != num) {
          return;
        }
      }

      // Override the entire payload :-)
      return {
        fullMap: snapshot
      };
    }, (error, committed, snapshot) => {
      if (!error && committed) {
        debug(`Rewriting map to operation ${num} complete.`);
        this.lastFullMapNum_ = num;
      }
    }, false /* suppress updates on intermediate states */);
  }
}
