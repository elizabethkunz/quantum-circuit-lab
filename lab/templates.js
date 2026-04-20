let activeTemplateCtx = null;  // name of currently loaded template

function showContextCard(name) {
  const ctx = TEMPLATE_CONTEXT[name];
  if (!ctx) { hideContextCard(); return; }
  activeTemplateCtx = name;

  const card = document.getElementById('ctx-card');
  card.style.setProperty('--ctx-color', ctx.color);
  document.getElementById('ctx-eyebrow').textContent = ctx.eyebrow;
  document.getElementById('ctx-title').textContent = ctx.title;
  document.getElementById('ctx-why').innerHTML = ctx.why;

  const factsEl = document.getElementById('ctx-facts');
  factsEl.innerHTML = ctx.facts.map(f => `<span class="ctx-fact">${f}</span>`).join('');

  card.style.display = '';
}

function hideContextCard() {
  document.getElementById('ctx-card').style.display = 'none';
}

function dismissContextCard() {
  activeTemplateCtx = null;
  hideContextCard();
}

document.getElementById('ctx-dismiss').addEventListener('click', dismissContextCard);

function loadTemplate(name) {
  const ex = EXAMPLES[name];
  if (!ex) return;
  circuit.nQubits = ex.nQubits;
  circuit = ex.place(circuit);
  ensureColumns();
  render();

  // stash the template name so the run button can show the card
  activeTemplateCtx = name;

  // Apply noise preset if specified
  const noiseSlider = document.getElementById('noise-slider');
  if (noiseSlider) {
    noiseSlider.value = (ex.noisePreset || 0).toString();
    noiseSlider.dispatchEvent(new Event('input'));
  }

  // Hide any previous card visually (but keep activeTemplateCtx set)
  hideContextCard();

  // Switch to Lab view if we're not there
  switchTab('lab');
  toast('Template loaded · press Run');

  // auto-scroll to canvas
  setTimeout(() => {
    document.querySelector('.canvas-wrap').scrollIntoView({behavior:'smooth', block:'start'});
  }, 80);

  // auto-run after a beat
  setTimeout(() => document.getElementById('btn-run').click(), 600);
}

// Templates tab card handlers
document.querySelectorAll('.tpl-card').forEach(card => {
  card.addEventListener('click', () => {
    const name = card.dataset.template;
    loadTemplate(name);
  });
});

/* ---------------- INIT ---------------- */
ensureColumns();
render();
bindDrag();

// redraw ctrl links on resize
window.addEventListener('resize', () => {
  requestAnimationFrame(() => drawCtrlLinks());
});

/* ==========================================================================
   ========================== TUTORIAL / LEARN VIEW =========================
   ========================================================================== */
