/* ---------------- TAB SWITCHING ---------------- */
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  const homeView = document.getElementById('view-home');
  if (homeView) homeView.classList.toggle('active', tab === 'home');
  document.getElementById('view-lab').classList.toggle('active', tab === 'lab');
  document.getElementById('view-learn').classList.toggle('active', tab === 'learn');
  document.getElementById('view-templates').classList.toggle('active', tab === 'templates');
  const labsView = document.getElementById('view-labs');
  if (labsView) labsView.classList.toggle('active', tab === 'labs');
  document.getElementById('view-docs').classList.toggle('active', tab === 'docs');
  // When switching to Learn, redraw any bloch spheres to ensure correct layout
  if (tab === 'learn') {
    requestAnimationFrame(() => {
      Object.values(blochInstances).forEach(b => b && b.draw());
      document.querySelectorAll('.mini-circuit').forEach(c => {
        const fn = c._refreshLinks;
        if (fn) fn();
      });
    });
  }
  window.scrollTo({ top: 0, behavior: 'instant' });
}
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

function switchSubtab(which) {
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
function markDone(stepId) {
  const card = document.querySelector(`[data-step="${stepId}"]`);
  if (!card) return;
  card.classList.add('done');
  stepProgress[stepId] = true;
  const btn = card.querySelector('.step-next');
  if (btn) btn.disabled = false;
  updateProgressPills();
  refreshTutorialProgressRails();
}

function unlockStep(stepId) {
  const card = document.querySelector(`[data-step="${stepId}"]`);
  if (!card) return;
  card.classList.remove('locked');
  refreshTutorialProgressRails();
  setTimeout(() => {
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 120);
}

document.querySelectorAll('.step-next').forEach(btn => {
  btn.addEventListener('click', () => {
    const unlocks = btn.dataset.unlocks;
    if (unlocks) unlockStep(unlocks);
  });
});

function updateProgressPills() {
  const totals = { t1: 8, t2: 5, t3: 7, t4: 7, t5: 6, t6: 6, t7: 7, t8: 6, t9: 6, t10: 8, t11: 6 };
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
  ['tut-1', 'tut-2', 'tut-3', 'tut-4'].forEach(id => {
    const tutorialEl = document.getElementById(id);
    if (tutorialEl) createTutorialProgressRail(tutorialEl);
  });
  refreshTutorialProgressRails();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTutorialProgressRails);
} else {
  initTutorialProgressRails();
}
