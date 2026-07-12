/* ==========================================================================
   Firebase — auth + optional cross-device sync of the local Store.
   Local (device-only) usage stays the default; signing in is opt-in and
   pulls/pushes the same data shape that store.js keeps in localStorage.
   Loaded as a module after store.js, so the global `Store` from store.js
   is already in scope (module scripts still resolve bare globals).
   ========================================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  updateProfile,
  deleteUser,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  EmailAuthProvider,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBb9A9ccrHGGcgsOs2DGe145KVy5bixLps",
  authDomain: "mybiblequest-fd7d2.firebaseapp.com",
  projectId: "mybiblequest-fd7d2",
  storageBucket: "mybiblequest-fd7d2.firebasestorage.app",
  messagingSenderId: "926921217841",
  appId: "1:926921217841:web:1a8e962d821bdcb07e8210",
  measurementId: "G-JXERSFY6NB",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const hasStore = typeof Store !== "undefined";

let pushTimer = null;
function flushPush(uid) {
  clearTimeout(pushTimer);
  pushTimer = null;
  setDoc(doc(db, "users", uid), Store._exportState()).then(() => {
    Auth.lastSyncedAt = Date.now();
    Auth._listeners.forEach((fn) => fn(Auth.currentUser));
  });
}
function schedulePush(uid) {
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => flushPush(uid), 800);
}

if (hasStore) {
  Store.onChange(() => {
    if (Auth.currentUser) schedulePush(Auth.currentUser.uid);
  });
  // This is a classic multi-page site, so every link click reloads the page —
  // flush any pending write before that happens instead of losing it to the
  // next page's pull-and-overwrite.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && pushTimer && Auth.currentUser) {
      flushPush(Auth.currentUser.uid);
    }
  });
}

function friendlyAuthError(err) {
  const map = {
    "auth/email-already-in-use": "That email already has an account — try signing in instead.",
    "auth/invalid-email": "That email address doesn't look right.",
    "auth/weak-password": "Password should be at least 6 characters.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/wrong-password": "Incorrect email or password.",
    "auth/user-not-found": "No account found with that email.",
    "auth/popup-closed-by-user": "Google sign-in was closed before finishing.",
    "auth/too-many-requests": "Too many attempts — please wait a moment and try again.",
    "auth/missing-email": "Enter your email above first.",
    "auth/operation-not-allowed": "That sign-in method isn't enabled for this project yet — enable it in the Firebase console under Authentication > Sign-in method.",
    "auth/configuration-not-found": "Authentication hasn't been set up for this project yet — open Authentication in the Firebase console and enable Email/Password and Google sign-in.",
    "auth/requires-recent-login": "For your security, please sign in again before doing this.",
  };
  return map[err.code] || "Something went wrong. Please try again.";
}

const Auth = {
  currentUser: null,
  lastSyncedAt: null,
  _listeners: [],

  onChange(fn) {
    this._listeners.push(fn);
    fn(this.currentUser);
  },

  async signUpWithEmail(email, password, displayName) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) await updateProfile(cred.user, { displayName });
      return { user: cred.user };
    } catch (err) {
      return { error: friendlyAuthError(err) };
    }
  },

  async signInWithEmail(email, password) {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      return { user: cred.user };
    } catch (err) {
      return { error: friendlyAuthError(err) };
    }
  },

  async signInWithGoogle() {
    try {
      const cred = await signInWithPopup(auth, new GoogleAuthProvider());
      return { user: cred.user };
    } catch (err) {
      return { error: friendlyAuthError(err) };
    }
  },

  async signOutUser() {
    await signOut(auth);
  },

  async sendPasswordReset(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return {};
    } catch (err) {
      return { error: friendlyAuthError(err) };
    }
  },

  async updateDisplayName(name) {
    try {
      await updateProfile(auth.currentUser, { displayName: name });
      this._listeners.forEach((fn) => fn(this.currentUser));
      return {};
    } catch (err) {
      return { error: friendlyAuthError(err) };
    }
  },

  syncNow() {
    if (!this.currentUser || !hasStore) return Promise.resolve();
    clearTimeout(pushTimer);
    return setDoc(doc(db, "users", this.currentUser.uid), Store._exportState()).then(() => {
      this.lastSyncedAt = Date.now();
      this._listeners.forEach((fn) => fn(this.currentUser));
    });
  },

  // Deleting the account also removes its cloud-synced document. If Firebase
  // requires a fresh login for this sensitive action, this re-authenticates
  // with the given password (email accounts) or a fresh Google popup, then
  // retries once, rather than surfacing a dead end to the user.
  async deleteAccount(password) {
    const user = auth.currentUser;
    try {
      await deleteDoc(doc(db, "users", user.uid)).catch(() => {});
      await deleteUser(user);
      return {};
    } catch (err) {
      if (err.code !== "auth/requires-recent-login") return { error: friendlyAuthError(err) };
      try {
        const isGoogle = user.providerData.some((p) => p.providerId === "google.com");
        if (isGoogle) {
          await reauthenticateWithPopup(user, new GoogleAuthProvider());
        } else if (password) {
          await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
        } else {
          return { error: "reauth-required" };
        }
        await deleteDoc(doc(db, "users", user.uid)).catch(() => {});
        await deleteUser(user);
        return {};
      } catch (err2) {
        return { error: friendlyAuthError(err2) };
      }
    }
  },
};

let initialAuthResolved = false;
onAuthStateChanged(auth, async (user) => {
  const isInitial = !initialAuthResolved;
  initialAuthResolved = true;
  Auth.currentUser = user;
  if (user && hasStore) {
    const snap = await getDoc(doc(db, "users", user.uid));
    const merged = snap.exists() ? Store._mergeState(snap.data()) : Store._exportState();
    Store._importState(merged);
    await setDoc(doc(db, "users", user.uid), merged);
    Auth.lastSyncedAt = Date.now();
    if (!isInitial && typeof showToast === "function") showToast("Synced across devices.", "default");
  }
  Auth._listeners.forEach((fn) => fn(user));
});

window.Auth = Auth;
