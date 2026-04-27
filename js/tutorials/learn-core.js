/* ---------------- TAB SWITCHING ---------------- */
const TUTORIAL_STEPS_DONE_KEY = 'qclab-tutorial-steps-done';
const TUTORIAL_LAST_SUBTAB_KEY = 'qclab-tutorial-last-subtab';
const TUTORIAL_POSITIONS_KEY = 'qclab-tutorial-positions';
const EXPLORE_PRELOAD_SESSION_KEY = 'qclab-explore-preload';

function tutorialSubtabFromStepId(stepId) {
  const m = String(stepId).match(/^(t\d+)-/);
  return m ? m[1] : null;
}

function loadPositions() {
  try {
    const raw = localStorage.getItem(TUTORIAL_POSITIONS_KEY);
    if (!raw) return {};
    const o = JSON.parse(raw);
    return o && typeof o === 'object' ? o : {};
  } catch (e) {
    return {};
  }
}

function savePositions(pos) {
  try {
    localStorage.setItem(TUTORIAL_POSITIONS_KEY, JSON.stringify(pos));
  } catch (e) {}
}

function setPositionForStep(stepId) {
  const subt = tutorialSubtabFromStepId(stepId);
  if (!subt) return;
  const pos = loadPositions();
  pos[subt] = stepId;
  savePositions(pos);
}

function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  const homeView = document.getElementById('view-home');
  if (homeView) homeView.classList.toggle('active', tab === 'home');
  document.getElementById('view-lab').classList.toggle('active', tab === 'lab');
  document.getElementById('view-learn').classList.toggle('active', tab === 'learn');
  document.getElementById('view-templates').classList.toggle('active', tab === 'templates');
  const labsView = document.getElementById('view-labs');
  if (labsView) labsView.classList.toggle('active', tab === 'labs');
  const glossaryView = document.getElementById('view-glossary');
  if (glossaryView) glossaryView.classList.toggle('active', tab === 'glossary');
  document.getElementById('view-docs').classList.toggle('active', tab === 'docs');
  // When switching to Learn, redraw any bloch spheres to ensure correct layout
  if (tab === 'learn') {
    const activeSub = document.querySelector('.subtab.active[data-subtab]');
    if (activeSub && activeSub.dataset.subtab) {
      try { localStorage.setItem(TUTORIAL_LAST_SUBTAB_KEY, activeSub.dataset.subtab); } catch (e) {}
      const which = activeSub.dataset.subtab;
      const pos = loadPositions();
      if (!pos[which]) {
        const tutEl = document.getElementById('tut-' + which.slice(1));
        const first = tutEl && tutEl.querySelector('.step-card[data-step]');
        if (first) {
          pos[which] = first.dataset.step;
          savePositions(pos);
        }
      }
    }
    requestAnimationFrame(() => {
      Object.values(blochInstances).forEach(b => b && b.draw());
      document.querySelectorAll('.mini-circuit').forEach(c => {
        const fn = c._refreshLinks;
        if (fn) fn();
      });
    });
  }
  if (tab === 'home' && typeof window.refreshHomeTutorialResumeBanner === 'function') {
    requestAnimationFrame(() => window.refreshHomeTutorialResumeBanner());
  }
  if (tab === 'lab') {
    let preload;
    try { preload = sessionStorage.getItem(EXPLORE_PRELOAD_SESSION_KEY); } catch (e) {}
    if (preload) {
      try { sessionStorage.removeItem(EXPLORE_PRELOAD_SESSION_KEY); } catch (e) {}
      requestAnimationFrame(() => {
        if (typeof loadTemplate === 'function') loadTemplate(preload);
      });
    }
  }
  window.scrollTo({ top: 0, behavior: 'instant' });
}
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

function switchSubtab(which) {
  try { localStorage.setItem(TUTORIAL_LAST_SUBTAB_KEY, which); } catch (e) {}
  const pos = loadPositions();
  if (!pos[which]) {
    const tutEl = document.getElementById('tut-' + which.slice(1));
    const first = tutEl && tutEl.querySelector('.step-card[data-step]');
    if (first) {
      pos[which] = first.dataset.step;
      savePositions(pos);
    }
  }
  document.querySelectorAll('.subtab').forEach(b => b.classList.toggle('active', b.dataset.subtab === which));
  ['t1','t2','t3','t4','t5','t6','t7','t8','t9','t10','t11'].forEach(id => {
    const el = document.getElementById('tut-' + id.slice(1));
    if (el) el.style.display = which === id ? '' : 'none';
  });
  refreshTutorialProgressRails();
  if (which === 't1') {
    requestAnimationFrame(() => Object.values(blochInstances).forEach(b => b && b.draw()));
  }
  window.scrollTo({ top: 0, behavior: 'instant' });
}
document.querySelectorAll('.subtab').forEach(btn => {
  btn.addEventListener('click', () => switchSubtab(btn.dataset.subtab));
});

/* ---------------- STEP UNLOCKING ---------------- */
const stepProgress = {};   // step id → true when done
function loadStepProgressFromStorage() {
  try {
    const raw = localStorage.getItem(TUTORIAL_STEPS_DONE_KEY);
    if (!raw) return;
    const obj = JSON.parse(raw);
    if (obj && typeof obj === 'object') Object.assign(stepProgress, obj);
  } catch (e) {}
}

function saveStepProgressToStorage() {
  try {
    localStorage.setItem(TUTORIAL_STEPS_DONE_KEY, JSON.stringify(stepProgress));
  } catch (e) {}
}

/** Restore unlocked steps after refresh: furthest saved cursor per tutorial + explicit markDone keys. */
function applyAllTutorialPersistence() {
  loadStepProgressFromStorage();
  const positions = loadPositions();

  document.querySelectorAll('.tutorial').forEach(tutorialEl => {
    const tid = tutorialEl.id || '';
    if (!/^tut-\d+$/.test(tid)) return;
    const num = tid.split('-')[1];
    const subt = 't' + num;
    const cards = Array.from(tutorialEl.querySelectorAll('.step-card[data-step]'));
    if (!cards.length) return;

    let targetIdx = -1;
    const posId = positions[subt];
    if (posId) {
      const j = cards.findIndex(c => c.dataset.step === posId);
      if (j >= 0) targetIdx = Math.max(targetIdx, j);
    }
    cards.forEach((card, i) => {
      if (stepProgress[card.dataset.step]) targetIdx = Math.max(targetIdx, i);
    });

    if (targetIdx < 0) return;

    for (let i = 0; i <= targetIdx; i++) {
      cards[i].classList.remove('locked');
      const sid = cards[i].dataset.step;
      const treatAsDone = stepProgress[sid] || i < targetIdx;
      if (treatAsDone) {
        cards[i].classList.add('done');
        stepProgress[sid] = true;
        const b = cards[i].querySelector('.step-next');
        if (b) b.disabled = false;
      }
    }
  });

  saveStepProgressToStorage();
  updateProgressPills();
  refreshTutorialProgressRails();
}

function markDone(stepId) {
  const card = document.querySelector(`[data-step="${stepId}"]`);
  if (!card) return;
  card.classList.add('done');
  stepProgress[stepId] = true;
  setPositionForStep(stepId);
  const btn = card.querySelector('.step-next');
  if (btn) btn.disabled = false;
  saveStepProgressToStorage();
  updateProgressPills();
  refreshTutorialProgressRails();
}

function unlockStep(stepId) {
  const card = document.querySelector(`[data-step="${stepId}"]`);
  if (!card) return;
  setPositionForStep(stepId);
  card.classList.remove('locked');
  refreshTutorialProgressRails();
  setTimeout(() => {
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 120);
}

document.querySelectorAll('.step-next').forEach(btn => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.step-card');
    const curId = card && card.dataset.step;
    if (curId) {
      stepProgress[curId] = true;
      saveStepProgressToStorage();
    }
    const unlocks = btn.dataset.unlocks;
    if (unlocks) unlockStep(unlocks);
    updateProgressPills();
    refreshTutorialProgressRails();
  });
});

function updateProgressPills() {
  const totals = { t1: 8, t2: 5, t3: 7, t4: 7, t5: 6, t6: 6, t7: 7, t8: 6, t9: 7, t10: 8, t11: 8 };
  const done = { t1: 0, t2: 0, t3: 0, t4: 0, t5: 0, t6: 0, t7: 0, t8: 0, t9: 0, t10: 0, t11: 0 };
  for (const id in stepProgress) {
    const prefix = id.split('-')[0];
    if (done[prefix] !== undefined) done[prefix]++;
  }
  ['t1','t2','t3','t4','t5','t6','t7','t8','t9','t10','t11'].forEach(t => {
    const el = document.getElementById(t + '-progress');
    if (el) el.textContent = done[t] + ' / ' + totals[t];
  });
}

function createTutorialProgressRail(tutorialEl) {
  const tutorialId = tutorialEl.id; // tut-1, tut-2, ...
  if (!tutorialId) return;
  const tutorialNum = tutorialId.split('-')[1];
  const stepCards = Array.from(tutorialEl.querySelectorAll('.step-card[data-step]'));
  if (!stepCards.length) return;

  const existing = tutorialEl.querySelector('.tutorial-progress-rail');
  if (existing) existing.remove();

  const rail = document.createElement('nav');
  rail.className = 'tutorial-progress-rail';
  rail.setAttribute('aria-label', `Tutorial ${tutorialNum} progress`);
  rail.dataset.tutorial = `t${tutorialNum}`;

  stepCards.forEach((card, idx) => {
    const stepNum = String(idx + 1).padStart(2, '0');
    const title = (card.querySelector('.step-head h2') || {}).textContent || `Step ${stepNum}`;
    const stepId = card.dataset.step;

    const stepEl = document.createElement('div');
    stepEl.className = 'tutorial-progress-step';
    stepEl.dataset.stepRef = stepId;
    const dot = document.createElement('div');
    dot.className = 'tutorial-progress-dot';
    dot.textContent = stepNum;
    const label = document.createElement('div');
    label.className = 'tutorial-progress-label';
    label.title = title;
    label.textContent = title;
    stepEl.appendChild(dot);
    stepEl.appendChild(label);
    rail.appendChild(stepEl);

    if (idx < stepCards.length - 1) {
      const connector = document.createElement('div');
      connector.className = 'tutorial-progress-connector';
      rail.appendChild(connector);
    }
  });

  const sourceBlock = tutorialEl.querySelector('.tutorial-sources');
  if (sourceBlock && sourceBlock.parentNode === tutorialEl) {
    sourceBlock.insertAdjacentElement('afterend', rail);
  } else {
    tutorialEl.insertBefore(rail, tutorialEl.firstChild);
  }
}

function refreshTutorialProgressRails() {
  document.querySelectorAll('.tutorial').forEach(tutorialEl => {
    if (!tutorialEl.querySelector('.tutorial-progress-rail')) return;

    const stepCards = Array.from(tutorialEl.querySelectorAll('.step-card[data-step]'));
    const steps = Array.from(tutorialEl.querySelectorAll('.tutorial-progress-step'));
    const connectors = Array.from(tutorialEl.querySelectorAll('.tutorial-progress-connector'));

    let activeIndex = stepCards.findIndex(card => !stepProgress[card.dataset.step]);
    if (activeIndex < 0) activeIndex = stepCards.length - 1;

    steps.forEach((stepEl, idx) => {
      const card = stepCards[idx];
      if (!card) return;
      const unlocked = !card.classList.contains('locked');
      const done = !!stepProgress[card.dataset.step];
      stepEl.classList.toggle('unlocked', unlocked);
      stepEl.classList.toggle('done', done);
      stepEl.classList.toggle('active', unlocked && idx === activeIndex && tutorialEl.style.display !== 'none');
    });

    connectors.forEach((conn, idx) => {
      const currentDone = stepCards[idx] && stepProgress[stepCards[idx].dataset.step];
      conn.classList.toggle('lit', !!currentDone);
    });
  });
}

function initTutorialProgressRails() {
  ['tut-1', 'tut-2', 'tut-3', 'tut-4', 'tut-6', 'tut-7', 'tut-8'].forEach(id => {
    const tutorialEl = document.getElementById(id);
    if (tutorialEl) createTutorialProgressRail(tutorialEl);
  });
  refreshTutorialProgressRails();
}

/** Resume banner on the home page — uses persisted step progress and last-opened tutorial. */
function getTutorialResumeSummary() {
  loadStepProgressFromStorage();
  let last;
  try { last = localStorage.getItem(TUTORIAL_LAST_SUBTAB_KEY); } catch (e) {}
  if (!last || !/^t\d+$/.test(last)) last = 't1';
  const num = last.slice(1);
  const tutEl = document.getElementById('tut-' + num);
  if (!tutEl) return null;
  const cards = Array.from(tutEl.querySelectorAll('.step-card[data-step]'));
  if (!cards.length) return null;

  const positions = loadPositions();
  let stepId = positions[last];
  let stepIdx = stepId ? cards.findIndex(c => c.dataset.step === stepId) : -1;

  if (stepIdx < 0) {
    stepIdx = cards.findIndex(c => !stepProgress[c.dataset.step]);
    if (stepIdx < 0) stepIdx = cards.length - 1;
    stepId = cards[stepIdx].dataset.step;
  }

  const stepNum = stepIdx + 1;
  const activeCard = cards[stepIdx] || cards[0];
  const h2 = activeCard && activeCard.querySelector('.step-head h2');
  const stepTitle = h2 ? h2.textContent.trim().replace(/\s+/g, ' ') : ('Step ' + stepNum);
  return {
    subtab: last,
    tutorialNum: parseInt(num, 10),
    stepNum,
    stepId: activeCard.dataset.step,
    stepTitle
  };
}

function shouldShowTutorialResumeBanner() {
  try {
    if (localStorage.getItem(TUTORIAL_LAST_SUBTAB_KEY)) return true;
    const raw = localStorage.getItem(TUTORIAL_STEPS_DONE_KEY);
    if (raw) {
      const o = JSON.parse(raw);
      if (o && typeof o === 'object' && Object.keys(o).length) return true;
    }
    const pr = localStorage.getItem(TUTORIAL_POSITIONS_KEY);
    if (pr) {
      const o = JSON.parse(pr);
      if (o && typeof o === 'object' && Object.keys(o).length) return true;
    }
  } catch (e) {}
  return false;
}

/** From the home page: open Explore with the Bell-pair template preloaded (session flag consumed in switchTab). */
function openExploreWithBellFromHome() {
  try { sessionStorage.setItem(EXPLORE_PRELOAD_SESSION_KEY, 'bell'); } catch (e) {}
  switchTab('lab');
}

function initLearnTutorialPersistence() {
  applyAllTutorialPersistence();
  initTutorialProgressRails();
  refreshTutorialProgressRails();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLearnTutorialPersistence);
} else {
  initLearnTutorialPersistence();
}
