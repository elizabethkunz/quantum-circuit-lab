import { isFirebaseConfigReady } from "./firebase-config.js";
import { watchAuthState, loginWithEmail, signupWithEmail } from "./firebase-auth.js";

const params = new URLSearchParams(window.location.search);
const nextTarget = params.get("next") || "index.html";

const title = document.getElementById("auth-title");
const setupNote = document.getElementById("auth-setup-note");
const form = document.getElementById("auth-form");
const submitBtn = document.getElementById("auth-submit");
const errorEl = document.getElementById("auth-error");
const toggleLabel = document.getElementById("auth-toggle-label");
const toggleBtn = document.getElementById("auth-toggle-btn");
const passwordInput = document.getElementById("password");

let mode = "signin";

function setMode(nextMode) {
  mode = nextMode;
  const signup = mode === "signup";
  title.textContent = signup ? "Create Account" : "Login";
  submitBtn.textContent = signup ? "Create Account" : "Sign In";
  toggleLabel.textContent = signup ? "Already have an account?" : "Need an account?";
  toggleBtn.textContent = signup ? "Sign in" : "Create one";
  passwordInput.setAttribute("autocomplete", signup ? "new-password" : "current-password");
  errorEl.textContent = "";
}

function showError(err) {
  const code = err && err.code ? err.code : "";
  if (code.includes("invalid-credential")) errorEl.textContent = "Invalid email or password.";
  else if (code.includes("email-already-in-use")) errorEl.textContent = "That email is already in use.";
  else if (code.includes("weak-password")) errorEl.textContent = "Password must be at least 6 characters.";
  else if (code.includes("too-many-requests")) errorEl.textContent = "Too many attempts. Please wait and try again.";
  else if (code.includes("network-request-failed")) errorEl.textContent = "Network error. Check your connection.";
  else errorEl.textContent = err && err.message ? err.message : "Authentication failed.";
}

if (!isFirebaseConfigReady()) {
  setupNote.hidden = false;
  form.querySelectorAll("input,button").forEach((el) => { el.disabled = true; });
  toggleBtn.disabled = true;
} else {
  watchAuthState((user) => {
    if (user) window.location.replace(nextTarget);
  });
}

toggleBtn.addEventListener("click", () => {
  setMode(mode === "signin" ? "signup" : "signin");
});

form.addEventListener("submit", async (evt) => {
  evt.preventDefault();
  errorEl.textContent = "";
  submitBtn.disabled = true;
  const email = form.email.value.trim();
  const password = form.password.value;
  try {
    if (mode === "signin") await loginWithEmail(email, password);
    else await signupWithEmail(email, password);
    window.location.replace(nextTarget);
  } catch (err) {
    showError(err);
  } finally {
    submitBtn.disabled = false;
  }
});

