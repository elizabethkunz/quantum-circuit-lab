import { isFirebaseConfigReady } from "./firebase-config.js";

const authBtn = document.getElementById("auth-btn");
const LOGIN_GATE_SCROLL_PX = 140;

let userIsAuthenticated = false;
let loginGateEl = null;
let gateObserver = null;

function loginHref() {
  const next = encodeURIComponent(
    window.location.pathname + window.location.search + window.location.hash
  );
  return `login.html?next=${next}`;
}

function isHomeTabActive() {
  const v = document.getElementById("view-home");
  return !!(v && v.classList.contains("active"));
}

function getScrollY() {
  return (
    window.scrollY ||
    window.pageYOffset ||
    document.documentElement.scrollTop ||
    document.body.scrollTop ||
    0
  );
}

/** Gate only when Firebase is configured (real auth expected). */
function authGateEnabled() {
  return isFirebaseConfigReady();
}

function ensureLoginGate() {
  if (loginGateEl) return loginGateEl;
  loginGateEl = document.createElement("div");
  loginGateEl.className = "scroll-login-gate";
  loginGateEl.innerHTML = `
    <div class="scroll-login-gate-card">
      <h3>Login required</h3>
      <p>Sign in to continue past the intro and access the full Quantum Circuit Lab experience.</p>
      <div class="scroll-login-gate-actions">
        <a class="btn primary" href="${loginHref()}">Go to login</a>
        <button class="btn" type="button" data-gate-back-top>Back to top</button>
      </div>
    </div>
  `;
  document.body.appendChild(loginGateEl);
  const topBtn = loginGateEl.querySelector("[data-gate-back-top]");
  if (topBtn) {
    topBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      document.body.classList.remove("login-gate-active");
      loginGateEl.classList.remove("show");
    });
  }
  return loginGateEl;
}

function hideGate() {
  document.body.classList.remove("login-gate-active");
  if (loginGateEl) loginGateEl.classList.remove("show");
}

function showGate() {
  if (!authGateEnabled() || userIsAuthenticated || !isHomeTabActive()) {
    hideGate();
    return;
  }
  const gate = ensureLoginGate();
  gate.classList.add("show");
  document.body.classList.add("login-gate-active");
}

function evaluateGate() {
  if (!authGateEnabled() || userIsAuthenticated || !isHomeTabActive()) {
    hideGate();
    return;
  }
  if (getScrollY() > LOGIN_GATE_SCROLL_PX) {
    showGate();
  } else {
    hideGate();
  }
}

function attachSentinelObserver() {
  const sentinel = document.getElementById("home-auth-gate-sentinel");
  if (!sentinel || gateObserver) return;
  gateObserver = new IntersectionObserver(
    (entries) => {
      const hit = entries.some((e) => e.isIntersecting);
      if (!authGateEnabled() || userIsAuthenticated || !isHomeTabActive()) {
        hideGate();
        return;
      }
      if (hit) showGate();
      else if (getScrollY() <= LOGIN_GATE_SCROLL_PX) hideGate();
    },
    { root: null, threshold: 0, rootMargin: "0px 0px -8% 0px" }
  );
  gateObserver.observe(sentinel);
}

function tryAttachSentinelObserver() {
  attachSentinelObserver();
  if (!gateObserver) {
    const home = document.getElementById("view-home");
    if (!home || home.dataset.homeObserver === "1") return;
    home.dataset.homeObserver = "1";
    const mo = new MutationObserver(() => {
      if (document.getElementById("home-auth-gate-sentinel")) {
        mo.disconnect();
        delete home.dataset.homeObserver;
        attachSentinelObserver();
      }
    });
    mo.observe(home, { childList: true });
  }
}

function updateAuthButtonForUser(user) {
  if (!authBtn) return;
  if (!authGateEnabled()) {
    authBtn.textContent = "Setup Auth";
    return;
  }
  authBtn.textContent = user ? "Account" : "Login";
  authBtn.setAttribute(
    "aria-label",
    user ? "Open login page (signed in)" : "Open login page"
  );
}

async function initFirebaseAuthWatch() {
  if (!authGateEnabled()) return;
  try {
    const { watchAuthState } = await import("./firebase-auth.js");
    watchAuthState((user) => {
      userIsAuthenticated = !!user;
      updateAuthButtonForUser(user);
      if (user) hideGate();
      else evaluateGate();
    });
  } catch (e) {
    console.warn("Quantum Circuit Lab: Firebase auth module failed to load.", e);
  }
}

if (authBtn) {
  updateAuthButtonForUser(null);
}

tryAttachSentinelObserver();
window.addEventListener("scroll", evaluateGate, { passive: true });
window.addEventListener("resize", evaluateGate);
document.addEventListener("DOMContentLoaded", tryAttachSentinelObserver);

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    requestAnimationFrame(() => {
      hideGate();
      evaluateGate();
    });
  });
});

initFirebaseAuthWatch();
