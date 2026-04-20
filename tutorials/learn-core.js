/* ---------------- TAB SWITCHING ---------------- */
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.getElementById('view-lab').classList.toggle('active', tab === 'lab');
  document.getElementById('view-learn').classList.toggle('active', tab === 'learn');
  document.getElementById('view-templates').classList.toggle('active', tab === 'templates');
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
  ['t1','t2','t3','t4','t5','t6','t7','t8','t9'].forEach(id => {
    const el = document.getElementById('tut-' + id.slice(1));
    if (el) el.style.display = which === id ? '' : 'none';
  });
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
}

function unlockStep(stepId) {
  const card = document.querySelector(`[data-step="${stepId}"]`);
  if (!card) return;
  card.classList.remove('locked');
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
  const totals = { t1: 8, t2: 5, t3: 5, t4: 5, t5: 6, t6: 6, t7: 7, t8: 6, t9: 6 };
  const done = { t1: 0, t2: 0, t3: 0, t4: 0, t5: 0, t6: 0, t7: 0, t8: 0, t9: 0 };
  for (const id in stepProgress) {
    const prefix = id.slice(0, 2);
    if (done[prefix] !== undefined) done[prefix]++;
  }
  ['t1','t2','t3','t4','t5','t6','t7','t8','t9'].forEach(t => {
    const el = document.getElementById(t + '-progress');
    if (el) el.textContent = done[t] + ' / ' + totals[t];
  });
}
