let firebaseUi = null;
let uiConfig = null;

function login() {
  //if (ui.isPendingRedirect()) {
  firebaseUi.start('.firebaseui-auth-container', uiConfig);
  //}
}

function userChanged(user) {
  state.user = user;
//  document.getElementById('userStatus').textContent =
//      /*user.isAnonymous ? 'Logged out' : */user.uid;
//  if (state.dialog) state.dialog.cancel();
//  if (state.user == user) return;
  state.user = user;
  if (state.getMid() && !state.getSecret()) {
    // Populate secret from the user, if it's there.
    const secretPath = `/users/${user.uid}/secrets/${state.getMid()}`;
    firebase.database().ref(secretPath).once('value').then(data => {
      const secret = data.val();
      debug('secret = ' + secret);
      if (secret) state.setSecret(secret, false, () => {});
    }).catch(err => {
      // Do nothing.
    });
  } else if (state.getMid() && state.getSecret()) {
    // Copy the secret into the new user.
    state.setSecret(state.getSecret(), true, () => {});
  }
}

function initAuth(callback) {
  let data = null;
  // FirebaseUI config.
  uiConfig = {
    callbacks: {
      signInSuccessWithAuthResult: (authResult, redirectUrl) => {
        userChanged(firebase.auth().currentUser.uid);
        return false;
      },
      signInFailure: error => {
        // For merge conflicts, the error.code will be
        // 'firebaseui/anonymous-upgrade-merge-conflict'.
        if (error.code != 'firebaseui/anonymous-upgrade-merge-conflict') {
          return Promise.resolve();
        }
        // The credential the user tried to sign in with.
        const cred = error.credential;
        // If using Firebase Realtime Database. The anonymous user data has to
        // be copied to the non-anonymous user.
        const app = firebase.app();
        // Save anonymous user data first.
        const anonymousUser = firebase.auth().currentUser;
        return app.database().ref('users/' + firebase.auth().currentUser.uid)
            .once('value')
            .then(snapshot => {
              data = snapshot.val();
              debug('saving data:');
              debug(data);
              // This will trigger onAuthStateChanged listener which
              // could trigger a redirect to another page.
              // Ensure the upgrade flow is not interrupted by that callback
              // and that this is given enough time to complete before
              // redirection.
              return firebase.auth().signInWithCredential(cred);
            })
            // Original Anonymous Auth instance now has the new user.
            //.then(user => app.database().ref('users/' + user.uid).set(data))
            // Delete anonymous user.
            .then(() => anonymousUser.delete())
            .then(() => {
              // Clear data in case a new user signs in, and the state change
              // triggers.
              data = null;
              // FirebaseUI will reset and the UI cleared when this promise
              // resolves.
              // signInSuccessWithAuthResult will not run. Successful sign-in
              // logic has to be run explicitly.
              // TODO run logic!
              userChanged(firebase.auth().currentUser);
            });
      },
    },
    signInOptions: [
      firebase.auth.GoogleAuthProvider.PROVIDER_ID,
      firebase.auth.EmailAuthProvider.PROVIDER_ID,
      firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID,
    ],
    autoUpgradeAnonymousUsers: true,
    signInFlow: 'popup',
    tosUrl: () => {
      window.open('../docs/terms_of_service.html', '_blank');
    },
    privacyPolicyUrl: () => {
      window.open('../docs/privacy_policy.html', '_blank');
    },
  };

  // Initialize the FirebaseUI Widget using Firebase.
  firebaseUi = new firebaseui.auth.AuthUI(firebase.auth());
  if (firebase.auth().currentUser) {
    userChanged(firebase.auth().currentUser);
    return;
  }
  firebase.auth().signInAnonymously()
      .then(user => { userChanged(user); callback(); })
      .catch(() => setStatus(Status.AUTH_ERROR));
}
