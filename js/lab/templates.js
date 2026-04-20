let activeTemplateCtx = null;  // name of currently loaded template

const TAG_MAP = {
  superposition: 'state-prep',
  hadamard: 'state-prep',
  identity: 'gates',
  basis: 'gates',
  pauli: 'gates',
  phase: 'interference',
  eigenstate: 'interference',
  'algorithm building block': 'algorithms',
  'bell state': 'entanglement',
  cnot: 'gates',
  nonlocality: 'entanglement',
  ghz: 'entanglement',
  multipartite: 'entanglement',
  sensing: 'hardware',
  cz: 'gates',
  'gate synthesis': 'compilation',
  hardware: 'hardware',
  teleportation: 'communication',
  protocol: 'communication',
  'deferred measurement': 'algorithms',
  oracle: 'algorithms',
  speedup: 'algorithms',
  deutsch: 'algorithms',
  communication: 'communication',
  'bell basis': 'communication',
  'deutsch–jozsa': 'algorithms',
  'exponential speedup': 'algorithms',
  'phase kickback': 'interference',
  'balanced oracle': 'algorithms',
  'bernstein–vazirani': 'algorithms',
  'secret string': 'algorithms',
  noise: 'noise',
  decoherence: 'noise',
  depolarizing: 'noise',
  'error accumulation': 'noise',
  benchmark: 'hardware',
  qec: 'qec',
  'repetition code': 'qec',
  'logical qubit': 'qec',
  ry: 'rotations',
  'no phase': 'state-prep',
  'amplitude encoding': 'qml',
  qml: 'qml',
  'euler angles': 'compilation',
  compilation: 'compilation',
  decomposition: 'compilation',
  vqe: 'variational',
  ansatz: 'variational',
  chemistry: 'variational',
  qaoa: 'variational',
  optimization: 'variational',
  maxcut: 'variational',
  hea: 'variational',
  'native gates': 'hardware',
  'barren plateaus': 'variational'
};

const TEMPLATE_REF = {
  superposition: 'ref-nc2000',
  'gate-identity': 'ref-nc2000',
  'phase-kickback': 'ref-dj1992',
  bell: 'ref-bell1964',
  ghz: 'ref-ghz1989',
  'cz-entangler': 'ref-nc2000',
  teleport: 'ref-teleport1993',
  deutsch: 'ref-deutsch1985',
  superdense: 'ref-superdense1992',
  'noisy-bell': 'ref-preskill2018',
  echo: 'ref-rb2011',
  'bitflip-encode': 'ref-shor1995',
  'ry-super': 'ref-nc2000',
  'biased-coin': 'ref-nc2000',
  'rot-chain': 'ref-nc2000',
  'dj-constant': 'ref-dj1992',
  'dj-balanced': 'ref-dj1992',
  bv: 'ref-bv1993',
  'ry-ansatz': 'ref-vqe2014',
  'qaoa-layer': 'ref-qaoa2014',
  hea: 'ref-kandala2017'
};

const FACT_DETAILS = {
  superposition: {
    '50% |0⟩, 50% |1⟩ — every run': 'A single Hadamard on |0⟩ prepares (|0⟩+|1⟩)/√2, so Born probabilities are exactly 1/2 for each computational-basis outcome. This is the canonical one-qubit interference-ready state.',
    'Measurement destroys the superposition': 'Projective measurement in the Z basis maps the coherent state to a definite eigenstate, removing off-diagonal coherence in the post-measurement density matrix.',
    'Basis of quantum parallelism': 'Superposition allows one unitary to act on multiple basis components simultaneously, enabling interference-based extraction of global structure in oracle and variational algorithms.'
  },
  'gate-identity': {
    'Output: \\(|1\\rangle\\) with certainty': 'Applying HZH to |0⟩ is algebraically equivalent to X|0⟩, so the final state is |1⟩ up to global phase and measurement is deterministic in the ideal simulator.',
    '\\(Z\\) and \\(X\\) are related by a basis rotation': 'Conjugation by H changes basis: HZH = X and HXH = Z. This identity is a concrete instance of Pauli operators transforming under basis changes.',
    'Used in hardware-aware compilation': 'Compilers often rewrite logical gates into native-basis operations; identities like HZH=X are part of the rewrite rules minimizing calibration-sensitive gate counts.'
  },
  'phase-kickback': {
    'q0 always measures 1 (kickback)': 'With the target in |−⟩, the controlled operation imprints a relative phase on the control branch, and the final Hadamard converts that phase into a deterministic bit value on q0.',
    'q1 stays in |−⟩ (eigenstate)': 'Because |−⟩ is an eigenstate of X with eigenvalue −1, CNOT action on the target manifests as a phase factor rather than changing target measurement statistics.',
    'Core primitive for quantum algorithms': 'Phase kickback is the mechanism behind oracle-query speedups, phase estimation, and hidden-string recovery; it is one of the central algorithmic motifs in quantum computing.'
  },
  bell: {
    'Only |00⟩ or |11⟩ ever appear': 'The Bell state (|00⟩+|11⟩)/√2 has support only on correlated basis states, so ideal measurements never produce anti-correlated outcomes.',
    'Violates Bell inequalities': 'For suitable measurement settings, Bell states produce correlations that exceed any local hidden-variable bound, certifying nonclassical entanglement.',
    'Nobel Prize 2022 (Aspect, Clauser, Zeilinger)': 'The 2022 Nobel recognized foundational Bell-test experiments establishing entanglement and nonlocal correlations as experimentally real, not just formal predictions.'
  },
  ghz: {
    '\\(|000\\rangle + |111\\rangle\\) — all or nothing': 'The GHZ superposition correlates all qubits globally: outcomes are perfectly aligned in the computational basis, revealing multipartite coherence.',
    'Resource state for quantum sensing': 'Entangled GHZ probes can accumulate phase collectively, enabling enhanced sensitivity relative to independent probes in idealized metrological settings.',
    'Maximally entangled across 3 qubits': 'GHZ states represent genuine tripartite entanglement: the global state is pure while single-qubit reduced states are maximally mixed.'
  },
  'cz-entangler': {
    'Same Bell state as CNOT version': 'Conjugating CZ with Hadamards on the target reproduces CNOT action, so both constructions prepare equivalent Bell correlations.',
    'CZ is native on superconducting hardware': 'Many transmon platforms calibrate controlled-phase interactions directly, making CZ lower-overhead or higher-fidelity than synthesized alternatives.',
    'Relevant for circuit compilation & optimization': 'Hardware transpilation routinely swaps abstract CNOT-heavy circuits into CZ-based decompositions to satisfy connectivity and pulse-level constraints.'
  },
  teleport: {
    'q2 always equals the input state': 'After Bell-basis operations and feed-forward-equivalent corrections, the unknown input state is reconstructed on q2 while original local information is consumed.',
    'Requires pre-shared entanglement': 'Teleportation uses a previously distributed Bell pair as a nonclassical resource; without that shared entanglement, two classical bits are insufficient.',
    'Backbone of quantum networking': 'Teleportation is a core primitive for repeater chains, distributed architectures, and modular scaling where quantum states must be transferred across nodes.'
  },
  deutsch: {
    '1 query vs 2 classical': 'Deutsch\'s promise problem demonstrates that interference can extract global oracle properties with fewer queries than any deterministic classical strategy.',
    'q0 = 1 → balanced oracle detected': 'In this implementation, balanced-oracle phase patterns lead to destructive interference at |0⟩ and constructive interference at |1⟩ on the query qubit.',
    'First proven quantum speedup (1985)': 'Deutsch\'s result provided one of the earliest formal separations in query complexity, motivating the broader search for algorithmic quantum advantage.'
  },
  superdense: {
    '2 classical bits per 1 qubit sent': 'Superdense coding maps two classical bits to one of four Bell states; one transmitted qubit plus shared entanglement is sufficient for full two-bit recovery.',
    'Requires pre-shared Bell pair': 'The protocol consumes previously established entanglement. Channel capacity gain appears only when this nonlocal resource is available beforehand.',
    'Saturates the Holevo bound': 'Holevo\'s theorem limits accessible classical information from n qubits to at most n bits without shared entanglement. Superdense coding reaches the entanglement-assisted optimum for one transmitted qubit.'
  },
  'noisy-bell': {
    'Forbidden outcomes appear with noise': 'Depolarizing errors inject Pauli faults that leak amplitude into |01⟩ and |10⟩ sectors, directly degrading Bell-state parity signatures.',
    'Noise rate ~0.1–1% on best hardware today': 'State-of-the-art two-qubit gate infidelities are often in the sub-percent regime, but cumulative circuit depth still amplifies these errors significantly.',
    'Try cranking the slider to 10%': 'At elevated error rates, qualitative failure modes become obvious quickly and help build intuition for why error mitigation and correction are necessary.'
  },
  echo: {
    'Should always output |0⟩': 'X·X equals identity, so an ideal noiseless execution returns the initial basis state with unit probability.',
    'Used in randomized benchmarking': 'Echo-like inversion structures are common in benchmarking protocols because deviations from identity accumulate into measurable error rates.',
    'Try noise at 5%, 10%, 15%': 'Sweeping error probability demonstrates how gate infidelity composes across operations and how quickly nominally trivial circuits lose reliability.'
  },
  'bitflip-encode': {
    'Logical qubit encoded across 3 physical': 'Repetition-style encoding distributes logical information over correlated multi-qubit subspaces rather than storing it in one vulnerable carrier.',
    'Detects single bit-flip errors': 'Parity checks can identify which qubit flipped without directly measuring the encoded amplitudes, enabling correctable single-error events.',
    'Seed of the surface code': 'Modern fault-tolerant codes generalize this correlation-based protection into 2D stabilizer layouts with repeated syndrome extraction.'
  },
  'ry-super': {
    '50% \\(|0\\rangle\\), 50% \\(|1\\rangle\\) (like H)': 'Ry(90°)|0⟩ creates equal-amplitude population splitting in Z-basis readout, matching Hadamard probabilities though state phases differ.',
    'Real-valued amplitudes only': 'Pure Y-axis rotations can stay on great circles with real-valued state-vector components in the computational basis representation.',
    'Standard block for VQE / QAOA': 'Parameterized single-axis rotations are optimization variables in many ansatz families, giving continuous control over trial-state manifolds.'
  },
  'biased-coin': {
    '~25% \\(|1\\rangle\\) at \\(\\theta=60^\\circ\\)': 'For Ry(θ)|0⟩, the excited-state probability is sin²(θ/2); substituting θ=60° gives sin²(30°)=0.25.',
    '\\(\\cos^2(\\theta/2)\\) gives \\(P(|0\\rangle)\\)': 'Born probabilities follow directly from rotation amplitudes: α=cos(θ/2), β=sin(θ/2), so P(0)=|α|² and P(1)=|β|².',
    'Parameterized amplitude encoding': 'Adjustable rotation angles allow compact encoding of scalar parameters or probability biases into qubit amplitudes.'
  },
  'rot-chain': {
    'Euler-angle decomposition': 'Any SU(2) operation can be decomposed into chained axial rotations, typically in ZYZ or equivalent parameterizations used in transpilers.',
    'Produces X equivalent': 'The demonstrated angle sequence is an explicit constructive identity yielding X action up to an irrelevant global phase factor.',
    'Used by real compilers (Qiskit, Cirq)': 'Compiler backends reduce arbitrary one-qubit unitaries to native rotation sets with calibrated angles before scheduling and pulse synthesis.'
  },
  'dj-constant': {
    'Input register → \\(|00\\rangle\\) with certainty': 'For a constant oracle, all computational branches acquire the same phase, so the final Hadamards refocus amplitude onto the all-zero string.',
    'Oracle = identity (\\(f\\) is constant)': 'In this branch the query unitary contributes no input-dependent sign structure, modeling f(x)=0 for all x.',
    'Classical needs 3 queries; quantum needs 1': 'For n=2 Deutsch–Jozsa promises, deterministic classical confirmation may require multiple evaluations, while the quantum circuit extracts the property in one call.'
  },
  'dj-balanced': {
    'Input register → \\(|11\\rangle\\) with certainty': 'Balanced phase patterns produce destructive interference at |00⟩ and constructive support on nonzero strings, here yielding |11⟩ for this oracle.',
    'Oracle = two CNOTs (\\(f=x_0\\oplus x_1\\))': 'The ancilla-coupled CNOT pair implements parity dependence, encoding XOR structure into relative phase via kickback.',
    'Any non-zero output → balanced': 'Deutsch–Jozsa decision rule: observing any nonzero bit string on the input register certifies a balanced oracle under the promise.'
  },
  bv: {
    'Secret \\(s=101\\) recovered in 1 query': 'Bernstein–Vazirani imprints each secret bit into a measurable phase and decodes all bits simultaneously after a single oracle interaction.',
    'Classical needs \\(n\\) queries': 'A classical black-box strategy must probe each input dimension to reconstruct an n-bit hidden linear string in the worst case.',
    'Same phase-kickback mechanism as D-J': 'Both algorithms convert oracle truth-table structure into phase and then back into deterministic computational-basis information.'
  },
  'ry-ansatz': {
    'Parameterized Ry + CNOT + Ry': 'This layout combines local trainable rotations with entangling structure, giving a compact yet expressive variational layer.',
    'Core building block of VQE': 'Many VQE circuits stack repeated instances of this motif, evaluating expectation values while a classical loop updates angles.',
    'Tunable via classical optimizer': 'Gradient-based or gradient-free optimizers navigate parameter space to minimize measured cost under finite-shot and noise constraints.'
  },
  'qaoa-layer': {
    'Cost layer: CNOT · Rz · CNOT': 'This pattern implements effective ZZ-style phase accumulation associated with objective terms in Ising-form optimization mappings.',
    'Mixer layer: Rx on all qubits': 'The mixer drives transitions among computational states, preventing premature trapping and enabling exploration across candidate solutions.',
    'Applied to MaxCut, scheduling, TSP': 'QAOA has been adapted to many combinatorial formulations by encoding problem Hamiltonians and constraints into the cost operator.'
  },
  hea: {
    'Only native gates (Ry, Rz, CNOT)': 'Native-gate ansatze reduce decomposition overhead and can better align with calibration envelopes on specific hardware families.',
    'Used by IBM, Google, Rigetti': 'Hardware-efficient templates are widely used in NISQ experiments because they are straightforward to compile on superconducting architectures.',
    'Known issue: barren plateaus at depth': 'As depth increases, gradients can vanish exponentially in system size for many random initializations, making training unstable without mitigation strategies.'
  }
};

function normalizeFact(templateName, fact, idx) {
  if (fact && typeof fact === 'object' && fact.summary && fact.detail) return fact;
  const summary = String(fact || `Fact ${idx + 1}`);
  let detail = FACT_DETAILS[templateName]?.[summary] ||
    'This observation highlights a key behavior of the selected circuit. Expand multiple facts to connect implementation details with the underlying quantum-information principle.';
  const ref = TEMPLATE_REF[templateName];
  if (ref && !detail.includes('ctx-cite')) {
    detail += ` <a href="#${ref}" class="ctx-cite" data-doc-ref="${ref}">[source]</a>`;
  }
  return { summary, detail };
}

function renderFactDropdowns(templateName, facts) {
  return (facts || []).map((fact, idx) => {
    const item = normalizeFact(templateName, fact, idx);
    return `
      <div class="ctx-fact-dropdown" data-fact-idx="${idx}">
        <button class="ctx-fact-toggle" type="button" aria-expanded="false">
          <span>${item.summary}</span>
          <span class="ctx-fact-chevron">▾</span>
        </button>
        <div class="ctx-fact-body">${item.detail}</div>
      </div>
    `;
  }).join('');
}

function applyContextVariation(variation) {
  if (!variation || !variation.action) return;
  const action = variation.action;

  if (action.type === 'set-noise') {
    const noiseSlider = document.getElementById('noise-slider');
    if (noiseSlider) {
      noiseSlider.value = String(action.value);
      noiseSlider.dispatchEvent(new Event('input'));
    }
    document.getElementById('btn-run').click();
    return;
  }

  if (action.type === 'set-gate-angle') {
    const col = action.col;
    const qubit = action.qubit;
    const angleDeg = action.angleDeg;
    if (!circuit.columns[col] || !circuit.columns[col][qubit]) return;
    const entry = circuit.columns[col][qubit];
    if (!entry || entry.type !== 'single') return;
    if (action.gate && entry.gate !== action.gate) return;
    entry.angleDeg = angleDeg;
    render();
    document.getElementById('btn-run').click();
  }
}

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
  factsEl.innerHTML = renderFactDropdowns(name, ctx.facts);

  const actionsEl = document.getElementById('ctx-actions');
  if (ctx.variations && ctx.variations.length) {
    actionsEl.classList.add('active');
    actionsEl.innerHTML = `
      <div class="ctx-actions-label">Compare common variations</div>
      <div class="ctx-actions-row">
        ${ctx.variations.map((v, idx) => `<button class="ctx-action-btn" data-variation-idx="${idx}">${v.label}</button>`).join('')}
      </div>
    `;
  } else {
    actionsEl.classList.remove('active');
    actionsEl.innerHTML = '';
  }

  card.style.display = '';
  if (window.scheduleMathRender) window.scheduleMathRender(card);
}

function hideContextCard() {
  document.getElementById('ctx-card').style.display = 'none';
}

function dismissContextCard() {
  activeTemplateCtx = null;
  hideContextCard();
}

document.getElementById('ctx-dismiss').addEventListener('click', dismissContextCard);
document.getElementById('ctx-actions').addEventListener('click', (e) => {
  const btn = e.target.closest('.ctx-action-btn');
  if (!btn || !activeTemplateCtx) return;
  const ctx = TEMPLATE_CONTEXT[activeTemplateCtx];
  if (!ctx || !ctx.variations) return;
  const idx = parseInt(btn.dataset.variationIdx, 10);
  if (!Number.isFinite(idx) || !ctx.variations[idx]) return;
  applyContextVariation(ctx.variations[idx]);
});

document.getElementById('ctx-facts').addEventListener('click', (e) => {
  const btn = e.target.closest('.ctx-fact-toggle');
  if (!btn) return;
  const row = btn.closest('.ctx-fact-dropdown');
  if (!row) return;
  const isOpen = row.classList.contains('open');
  row.classList.toggle('open');
  btn.setAttribute('aria-expanded', String(!isOpen));
});

function openDocRef(refId) {
  if (!refId) return;
  switchTab('docs');
  setTimeout(() => {
    const el = document.getElementById(refId);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.classList.add('docs-entry-flash');
    setTimeout(() => el.classList.remove('docs-entry-flash'), 1300);
  }, 40);
}

document.addEventListener('click', (e) => {
  const cite = e.target.closest('.tpl-cite, .ctx-cite');
  if (!cite) return;
  e.preventDefault();
  e.stopPropagation();
  openDocRef(cite.dataset.docRef || cite.getAttribute('href')?.replace('#', ''));
});

function normalizeTemplateTags() {
  document.querySelectorAll('.tpl-card').forEach(card => {
    const tagEls = Array.from(card.querySelectorAll('.tpl-tag'));
    const normalized = [];
    tagEls.forEach(el => {
      const raw = el.textContent.trim().toLowerCase();
      const mapped = TAG_MAP[raw] || raw.replace(/\s+/g, '-');
      if (!normalized.includes(mapped)) normalized.push(mapped);
    });
    card.dataset.tags = normalized.join(',');
    const wrap = card.querySelector('.tpl-tags');
    if (wrap) {
      wrap.innerHTML = normalized.map(tag => `<span class="tpl-tag">${tag}</span>`).join('');
    }
  });
}

function initTemplateTagFilter() {
  normalizeTemplateTags();
  const row = document.getElementById('template-tag-filter');
  if (!row) return;

  const cards = Array.from(document.querySelectorAll('.tpl-card'));
  const tags = new Set();
  cards.forEach(card => (card.dataset.tags || '').split(',').filter(Boolean).forEach(t => tags.add(t)));
  const ordered = ['all', ...Array.from(tags).sort()];
  row.innerHTML = ordered.map(tag => `<button class="tpl-filter-btn ${tag === 'all' ? 'active' : ''}" data-filter-tag="${tag}">${tag}</button>`).join('');

  row.addEventListener('click', (e) => {
    const btn = e.target.closest('.tpl-filter-btn');
    if (!btn) return;
    const selected = btn.dataset.filterTag;
    row.querySelectorAll('.tpl-filter-btn').forEach(b => b.classList.toggle('active', b === btn));
    cards.forEach(card => {
      const tags = (card.dataset.tags || '').split(',').filter(Boolean);
      const visible = selected === 'all' || tags.includes(selected);
      card.style.display = visible ? '' : 'none';
    });
    document.querySelectorAll('.tpl-grid').forEach(grid => {
      const anyVisible = Array.from(grid.querySelectorAll('.tpl-card')).some(c => c.style.display !== 'none');
      grid.style.display = anyVisible ? '' : 'none';
    });
    document.querySelectorAll('.tpl-section-head').forEach(head => {
      const section = head.closest('.tpl-section');
      const grid = section?.querySelector('.tpl-grid');
      if (!grid) return;
      head.style.display = grid.style.display === 'none' ? 'none' : '';
    });
  });
}

function normalizeReferenceColumns() {
  const headings = Array.from(document.querySelectorAll('h3'));
  const leftHeader = headings.find(h => h.textContent.trim() === 'Cited in tutorials');
  const rightHeader = headings.find(h => h.textContent.trim() === 'Cited in the Lab & simulator');
  if (!leftHeader || !rightHeader) return;

  const leftCol = leftHeader.parentElement;
  const rightCol = rightHeader.parentElement;
  if (!leftCol || !rightCol) return;

  const tutorialRefIds = [
    'ref-kitaev2003',
    'ref-fowler2012',
    'ref-grover1996',
    'ref-kraus1983',
    'ref-lindblad1976',
    'ref-redfield1957',
    'ref-hahn1950',
    'ref-ramsey1950'
  ];

  tutorialRefIds.forEach(id => {
    const entries = Array.from(document.querySelectorAll(`#${id}`));
    if (!entries.length) return;
    const entry = entries[0];
    if (entry.parentElement !== leftCol) leftCol.appendChild(entry);
    for (let i = 1; i < entries.length; i++) entries[i].remove();
  });
}

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
initTemplateTagFilter();
normalizeReferenceColumns();

// redraw ctrl links on resize
window.addEventListener('resize', () => {
  requestAnimationFrame(() => drawCtrlLinks());
});

/* ==========================================================================
   ========================== TUTORIAL / LEARN VIEW =========================
   ========================================================================== */
