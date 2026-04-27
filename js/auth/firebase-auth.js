import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { firebaseConfig, isFirebaseConfigReady } from "./firebase-config.js";

let auth = null;

export function getFirebaseAuth() {
  if (!isFirebaseConfigReady()) return null;
  if (auth) return auth;
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  return auth;
}

export function watchAuthState(callback) {
  const instance = getFirebaseAuth();
  if (!instance) return () => {};
  return onAuthStateChanged(instance, callback);
}

export async function loginWithEmail(email, password) {
  const instance = getFirebaseAuth();
  if (!instance) throw new Error("Firebase config is missing.");
  return signInWithEmailAndPassword(instance, email, password);
}

export async function signupWithEmail(email, password) {
  const instance = getFirebaseAuth();
  if (!instance) throw new Error("Firebase config is missing.");
  return createUserWithEmailAndPassword(instance, email, password);
}

export async function logoutCurrentUser() {
  const instance = getFirebaseAuth();
  if (!instance) return;
  return signOut(instance);
}

