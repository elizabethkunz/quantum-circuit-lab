/* ==========================================================================
   ======================= TUTORIAL 2: ENTANGLEMENT =========================
   ========================================================================== */

/* --------------------------------------------------------------------------
   SHARED HELPERS
   -------------------------------------------------------------------------- */

/** Animated counter that counts up from 0 to `target` over ~600ms */
function animateCount(el, target, suffix) {
  if (!el) return;
  const start = performance.now();
  const dur = 600;
  function tick(now) {
    const t = Math.min((now - start) / dur, 1);
    el.textContent = Math.round(t * target) + (suffix || '');
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/** Pulse an element with a brief glow highlight */
function flashEl(el, color) {
  if (!el) return;
  color = color || 'var(--mint)';
  el.style.transition = 'box-shadow 0.1s';
  el.style.boxShadow = `0 0 0 2px ${color}`;
  setTimeout(() => { el.style.boxShadow = ''; }, 500);
}

/**
 * One mini Bloch disc (same look across T2 step 1 & CNOT visuals).
 * state: '0' | '1' | '+' | '-'  (computational poles or ± equator states)
 * opts: { sublabel, hArc: 'from0'|'from1'|null, phaseMark: '−'|null }
 */
function t2DrawMiniBlochDisc(svg, cx, cy, state, opts) {
  const ns = 'http://www.w3.org/2000/svg';
  const R = 26;
  opts = opts || {};
  const sublabel = opts.sublabel || '';
  const hArc = opts.hArc || null;
  const phaseMark = opts.phaseMark || null;

  function el(tag, attrs, text) {
    const e = document.createElementNS(ns, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (text !== undefined) e.textContent = text;
    return e;
  }

  svg.appendChild(el('ellipse', { cx, cy, rx: 30, ry: 30, fill: 'none', stroke: 'var(--line-bright)', 'stroke-width': 1 }));
  svg.appendChild(el('ellipse', { cx, cy, rx: 30, ry: 9, fill: 'none', stroke: 'var(--line)', 'stroke-width': 0.6, 'stroke-dasharray': '2 2', opacity: 0.85 }));
  svg.appendChild(el('text', { x: cx - 10, y: cy - 36, 'font-family': 'var(--mono)', 'font-size': 8, fill: 'var(--ink-faint)' }, '|0⟩'));
  svg.appendChild(el('text', { x: cx - 10, y: cy + 42, 'font-family': 'var(--mono)', 'font-size': 8, fill: 'var(--ink-faint)' }, '|1⟩'));

  let tipX = cx;
  let tipY = cy - R;
  let arrowColor = 'var(--cyan)';
  let ketLabel = '';
  let ketX = cx - 16;
  let ketY = cy - 14;

  if (state === '1') {
    tipY = cy + R;
  } else if (state === 'mixed') {
    // Maximally mixed state: Bloch vector = 0, drawn as a dot at the sphere centre.
    // Used for individual qubits inside an entangled pair (partial trace = I/2).
    svg.appendChild(el('circle', { cx, cy, r: 4, fill: 'var(--amber)', opacity: 0.85 }));
    svg.appendChild(el('circle', { cx, cy, r: 9, fill: 'none', stroke: 'var(--amber)', 'stroke-width': 1, opacity: 0.35 }));
    svg.appendChild(el('text', { x: cx - 12, y: cy + 18, 'font-family': 'var(--mono)', 'font-size': 7, fill: 'var(--amber)', 'letter-spacing': '0.05em' }, 'MIXED'));
    if (phaseMark) {
      svg.appendChild(el('text', { x: cx + 6, y: cy - 6, 'font-family': 'var(--mono)', 'font-size': 10, fill: 'var(--amber)' }, phaseMark));
    }
    if (sublabel) {
      svg.appendChild(el('text', { x: cx - 16, y: cy + 58, 'font-family': 'var(--mono)', 'font-size': 8, fill: 'var(--ink-faint)', 'letter-spacing': '0.06em' }, sublabel));
    }
    return; // skip the shared arrow/label rendering below
  } else if (state === '+') {
    tipX = cx + R * 0.85;
    tipY = cy;
    arrowColor = 'var(--mint)';
    ketLabel = '|+⟩';
    if (hArc === 'from0') {
      svg.appendChild(el('path', {
        d: `M ${cx} ${cy - R} A ${R} ${R} 0 0 1 ${tipX} ${tipY}`,
        fill: 'none',
        stroke: 'var(--mint)',
        'stroke-width': 1.2,
        opacity: 0.45,
        'stroke-dasharray': '3 2.5',
        'stroke-linecap': 'round'
      }));
      svg.appendChild(el('text', { x: cx + 4, y: cy - 14, 'font-family': 'var(--mono)', 'font-size': 7, fill: 'var(--mint)', 'letter-spacing': '0.04em' }, 'H'));
    }
  } else if (state === '-') {
    tipX = cx - R * 0.85;
    tipY = cy;
    arrowColor = 'var(--mint)';
    ketLabel = '|−⟩';
    if (hArc === 'from1') {
      svg.appendChild(el('path', {
        d: `M ${cx} ${cy + R} A ${R} ${R} 0 0 0 ${tipX} ${tipY}`,
        fill: 'none',
        stroke: 'var(--mint)',
        'stroke-width': 1.2,
        opacity: 0.45,
        'stroke-dasharray': '3 2.5',
        'stroke-linecap': 'round'
      }));
      svg.appendChild(el('text', { x: cx - 18, y: cy - 14, 'font-family': 'var(--mono)', 'font-size': 7, fill: 'var(--mint)', 'letter-spacing': '0.04em' }, 'H'));
    }
  }

  svg.appendChild(el('line', { x1: cx, y1: cy, x2: tipX, y2: tipY, stroke: arrowColor, 'stroke-width': 2.2, 'stroke-linecap': 'round' }));
  svg.appendChild(el('circle', { cx: tipX, cy: tipY, r: 3.6, fill: arrowColor }));

  if (ketLabel) {
    svg.appendChild(el('text', { x: ketX, y: ketY, 'font-family': 'var(--serif)', 'font-style': 'italic', 'font-size': 11, fill: 'var(--mint)' }, ketLabel));
  }
  if (phaseMark) {
    svg.appendChild(el('text', { x: tipX + 5, y: tipY - 5, 'font-family': 'var(--mono)', 'font-size': 10, fill: 'var(--amber)' }, phaseMark));
  }
  if (sublabel) {
    svg.appendChild(el('text', { x: cx - 16, y: cy + 58, 'font-family': 'var(--mono)', 'font-size': 8, fill: 'var(--ink-faint)', 'letter-spacing': '0.06em' }, sublabel));
  }
}

/** Dashed link between two Bloch discs (independence vs entanglement hint). */
function t2DrawBlochPairLink(svg, cxLeft, cxRight, cy, label, color) {
  const ns = 'http://www.w3.org/2000/svg';
  color = color || 'var(--line)';
  function el(tag, attrs, text) {
    const e = document.createElementNS(ns, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (text !== undefined) e.textContent = text;
    return e;
  }
  const mid = (cxLeft + cxRight) / 2;
  svg.appendChild(el('line', { x1: cxLeft + 32, y1: cy, x2: cxRight - 32, y2: cy, stroke: color, 'stroke-width': 1.2, 'stroke-dasharray': '3 3', opacity: 0.9 }));
  if (label) {
    svg.appendChild(el('text', { x: mid - (label.length > 10 ? 28 : 18), y: cy - 12, 'font-family': 'var(--mono)', 'font-size': 7, fill: color, 'letter-spacing': '0.05em' }, label));
  }
}

/* --------------------------------------------------------------------------
   T2 STEP 1 — Product state explorer
   NEW: animated qubit-pair icon display + plain-English "independence meter"
   -------------------------------------------------------------------------- */
(function initT2Step1() {
  const configs = {
    none: {
      probs: [1, 0, 0, 0],
      formula: '\\(|0\\rangle \\otimes |0\\rangle = |00\\rangle\\)',
      note: 'Both qubits definite. Product state.',
      plain: 'Both qubits are completely decided — like two coins already showing heads. There\'s only one possible result: 00.',
      blochCaption: 'Both arrows point to the north pole — each qubit is in |0⟩. No H means no motion on either sphere.',
      q0: 'definite',  // 'definite' | 'super'
      q1: 'definite',
      independent: true
    },
    h0: {
      // Simulator convention: q0 = LSB, so index 1 = |01⟩ has q0=1, q1=0.
      // H on q0 → amplitudes at |00⟩ (index 0) and |01⟩ (index 1).
      probs: [0.5, 0.5, 0, 0],
      formula: '\\(|0\\rangle_{q1} \\otimes (|0\\rangle+|1\\rangle)_{q0}/\\sqrt{2} = (|00\\rangle+|01\\rangle)/\\sqrt{2}\\)',
      note: 'q0 in superposition, q1 definite.',
      plain: 'Qubit 0 is in superposition — a genuine 50/50 blur. Qubit 1 is still decided (0). The two qubits act completely independently of each other.',
      blochCaption: 'H on q0 sweeps its arrow from |0⟩ (north) to |+⟩ on the equator. Qubit 1 stays at |0⟩ — its sphere is unchanged.',
      q0: 'super',
      q1: 'definite',
      independent: true
    },
    h1: {
      // H on q1 → amplitudes at |00⟩ (index 0) and |10⟩ (index 2, since q1=MSB).
      probs: [0.5, 0, 0.5, 0],
      formula: '\\((|0\\rangle+|1\\rangle)_{q1}/\\sqrt{2} \\otimes |0\\rangle_{q0} = (|00\\rangle+|10\\rangle)/\\sqrt{2}\\)',
      note: 'q1 in superposition, q0 definite.',
      plain: 'Now qubit 1 is blurry and qubit 0 is decided. Still independent — knowing qubit 0\'s result tells you nothing about qubit 1.',
      blochCaption: 'Same idea, swapped wires: q0 stays at |0⟩; H moves q1 along the quarter-arc to |+⟩.',
      q0: 'definite',
      q1: 'super',
      independent: true
    },
    hh: {
      probs: [0.25, 0.25, 0.25, 0.25],
      formula: '\\((|0\\rangle+|1\\rangle)/\\sqrt{2} \\otimes (|0\\rangle+|1\\rangle)/\\sqrt{2} = (|00\\rangle+|01\\rangle+|10\\rangle+|11\\rangle)/2\\)',
      note: 'Both in superposition. All four outcomes equally likely.',
      plain: 'Both qubits are blurry — all four outcomes equally likely. But they\'re still independent: each qubit makes its own random choice with no coordination.',
      blochCaption: 'Each sphere gets its own H-trajectory. The joint state is still a tensor product: two separate stories, not one linked arrow in 4D.',
      q0: 'super',
      q1: 'super',
      independent: true
    }
  };
  const seen = new Set();

  /* ── two mini Bloch discs + H trajectory (shared t2DrawMiniBlochDisc) ── */
  function drawProductBlochPair(cfg) {
    const svg = document.getElementById('t2-product-bloch-svg');
    if (!svg) return;
    svg.innerHTML = '';
    const cy = 58;
    t2DrawMiniBlochDisc(svg, 55, cy, cfg.q0 === 'super' ? '+' : '0', { sublabel: 'q0', hArc: cfg.q0 === 'super' ? 'from0' : null });
    t2DrawMiniBlochDisc(svg, 165, cy, cfg.q1 === 'super' ? '+' : '0', { sublabel: 'q1', hArc: cfg.q1 === 'super' ? 'from0' : null });
    const connColor = cfg.independent ? 'var(--line)' : 'var(--amber)';
    t2DrawBlochPairLink(svg, 55, 165, cy, 'INDEPENDENT', connColor);

    const cap = document.getElementById('t2-product-bloch-caption');
    if (cap && cfg.blochCaption) {
      cap.style.opacity = '0';
      cap.textContent = cfg.blochCaption;
      cap.style.transition = 'opacity 0.25s';
      setTimeout(() => { cap.style.opacity = '1'; }, 20);
    }
  }

  /* ── plain-English callout ── */
  function renderPlain(cfg) {
    let el = document.getElementById('t2-plain-explanation');
    if (!el) {
      // create it if the HTML doesn't have it yet
      const probs = document.getElementById('t2-product-probs');
      if (!probs) return;
      el = document.createElement('div');
      el.id = 't2-plain-explanation';
      el.style.cssText = 'margin-top:12px;padding:10px 14px;background:var(--bg-0);border-left:3px solid var(--mint);font-family:var(--serif);font-size:13px;color:var(--ink-dim);line-height:1.6;border-radius:0 4px 4px 0;';
      probs.parentNode.insertBefore(el, probs.nextSibling);
    }
    el.style.opacity = 0;
    el.textContent = cfg.plain;
    el.style.transition = 'opacity 0.3s';
    setTimeout(() => { el.style.opacity = 1; }, 20);
  }

  function renderProductProbs(cfg) {
    const labels = ['|00⟩', '|01⟩', '|10⟩', '|11⟩'];
    const el = document.getElementById('t2-product-probs');
    if (!el) return;
    el.innerHTML = '<div class="prob-list">' + cfg.probs.map((p, i) => {
      const pct = (p * 100).toFixed(0);
      const zero = p < 0.01 ? ' zero' : '';
      return `<div class="prob-row${zero}">
        <div class="prob-label">${labels[i]}</div>
        <div class="prob-bar-wrap"><div class="prob-bar" style="width:${p * 100}%;transition:width 0.5s ease"></div></div>
        <div class="prob-val">${pct}%</div>
      </div>`;
    }).join('') + '</div>';
    const fEl = document.getElementById('t2-product-formula');
    if (fEl) {
      fEl.innerHTML = `<div>${cfg.formula}</div>
        <div style="font-family:var(--mono);font-size:10px;color:var(--ink-faint);margin-top:8px;letter-spacing:0.05em">${cfg.note}</div>`;
    }
    drawProductBlochPair(cfg);
    renderPlain(cfg);
  }

  document.querySelectorAll('.t2-product-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.t2-product-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const key = btn.dataset.config;
      seen.add(key);
      renderProductProbs(configs[key]);
      if (seen.size >= 4) markDone('t2-1');
    });
  });
  renderProductProbs(configs['h0']);
})();


/* --------------------------------------------------------------------------
   T2 STEP 2 — CNOT: truth table + superposition + phase kickback
   NEW: animated gate animation on truth-table click, Bloch-sphere mini diagram
   for superposition part, improved kickback explainer with analogy
   -------------------------------------------------------------------------- */
(function initT2Step2() {

  /* ── Part A: Truth table with animated gate diagram ── */
  const ttData = [
    { ctrl: '|0⟩', tgt: '|0⟩', outC: '|0⟩', outT: '|0⟩', desc: 'Control = 0 → no flip. Target unchanged.', plain: 'Control is OFF (0), so nothing happens to the target. Like a switch that\'s not pressed.', blochCaption: 'Control sits at |0⟩ (north): the gate does nothing — both Bloch arrows stay put.' },
    { ctrl: '|0⟩', tgt: '|1⟩', outC: '|0⟩', outT: '|1⟩', desc: 'Control = 0 → no flip. Target unchanged.', plain: 'Control is still OFF. Even though the target starts as 1, it stays 1 — the gate does nothing.', blochCaption: 'Still idle. Target was already at the south pole |1⟩; no flip is applied.' },
    { ctrl: '|1⟩', tgt: '|0⟩', outC: '|1⟩', outT: '|1⟩', desc: 'Control = 1 → target flips: 0 → 1.', plain: 'Control is ON (1), so the target flips from 0 to 1. Think of it as: when the control light is on, flip the other switch.', blochCaption: 'Control |1⟩ (south) turns the gate on: the target’s arrow flips from north |0⟩ to south |1⟩. Control line never moves.' },
    { ctrl: '|1⟩', tgt: '|1⟩', outC: '|1⟩', outT: '|0⟩', desc: 'Control = 1 → target flips: 1 → 0.', plain: 'Control is ON again, so the target flips from 1 back to 0. The CNOT always flips the target when control=1.', blochCaption: 'Control stays |1⟩ (south); the target flips from south |1⟩ to north |0⟩ — joint state |11⟩ becomes |10⟩.' },
  ];
  const ttEl = document.getElementById('cnot-truth-table');
  let ttSeen = new Set();

  if (ttEl) {
    ['Input ctrl', 'Input tgt', 'Out ctrl', 'Out tgt'].forEach(h => {
      const hd = document.createElement('div');
      hd.style.cssText = 'font-family:var(--mono);font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:var(--ink-faint);padding:6px 10px;background:var(--bg-0);border:1px solid var(--line);text-align:center';
      hd.textContent = h; ttEl.appendChild(hd);
    });
    ttData.forEach((row, i) => {
      [row.ctrl, row.tgt, row.outC, row.outT].forEach((val, j) => {
        const cell = document.createElement('div');
        const isOut = j >= 2;
        cell.style.cssText = `font-family:var(--serif);font-style:italic;font-size:14px;padding:8px 10px;background:var(--bg-1);border:1px solid var(--line);text-align:center;cursor:pointer;transition:background 0.15s;color:${isOut ? 'var(--mint)' : 'var(--ink)'}`;
        cell.textContent = val; cell.dataset.row = i;
        cell.addEventListener('click', () => hlRow(i));
        cell.addEventListener('mouseenter', () => hlRow(i));
        ttEl.appendChild(cell);
      });
    });
  }

  /* Gate animation diagram injected below truth table (before Bloch strip) */
  function ensureGateDiagram() {
    let wrap = document.getElementById('cnot-gate-anim');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'cnot-gate-anim';
      wrap.style.cssText = 'margin-top:10px;display:flex;gap:12px;align-items:flex-start;';
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('id', 'cnot-gate-svg');
      svg.setAttribute('viewBox', '0 0 260 110');
      svg.setAttribute('width', '260');
      svg.setAttribute('height', '110');
      svg.style.flexShrink = '0';
      const descBox = document.createElement('div');
      descBox.id = 'cnot-tt-plain';
      descBox.style.cssText = 'font-family:var(--serif);font-size:12px;color:var(--ink-dim);line-height:1.65;padding-top:6px;max-width:200px;';
      wrap.appendChild(svg); wrap.appendChild(descBox);
      const blochAnchor = document.getElementById('cnot-tt-bloch-wrap');
      if (ttEl && ttEl.parentNode) {
        if (blochAnchor) ttEl.parentNode.insertBefore(wrap, blochAnchor);
        else ttEl.parentNode.insertBefore(wrap, ttEl.nextSibling);
      }
    }
  }
  ensureGateDiagram();

  function drawCnotTruthBloch(rowIdx) {
    const svg = document.getElementById('cnot-tt-bloch-svg');
    const cap = document.getElementById('cnot-tt-bloch-caption');
    if (!svg) return;
    const ns = 'http://www.w3.org/2000/svg';
    svg.innerHTML = '';
    svg.setAttribute('viewBox', '0 0 456 138');
    function el(tag, attrs, text) {
      const e = document.createElementNS(ns, tag);
      for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
      if (text !== undefined) e.textContent = text;
      return e;
    }
    const row = ttData[rowIdx];
    const k = s => (s === '|1⟩' ? '1' : '0');
    const cy = 76;
    svg.appendChild(el('text', { x: 108, y: 18, 'font-family': 'var(--mono)', 'font-size': 9, fill: 'var(--ink-faint)', 'letter-spacing': '0.12em' }, 'BEFORE'));
    svg.appendChild(el('text', { x: 348, y: 18, 'font-family': 'var(--mono)', 'font-size': 9, fill: 'var(--ink-faint)', 'letter-spacing': '0.12em' }, 'AFTER'));
    t2DrawMiniBlochDisc(svg, 58, cy, k(row.ctrl), { sublabel: 'ctrl' });
    t2DrawMiniBlochDisc(svg, 158, cy, k(row.tgt), { sublabel: 'tgt' });
    svg.appendChild(el('line', { x1: 228, y1: 36, x2: 228, y2: cy + 52, stroke: 'var(--line)', 'stroke-width': 1, 'stroke-dasharray': '3 3', opacity: 0.75 }));
    svg.appendChild(el('text', { x: 206, y: (cy + 34), 'font-family': 'var(--mono)', 'font-size': 8, fill: 'var(--mint)', 'letter-spacing': '0.08em' }, 'CNOT'));
    t2DrawMiniBlochDisc(svg, 298, cy, k(row.outC), { sublabel: 'ctrl' });
    t2DrawMiniBlochDisc(svg, 398, cy, k(row.outT), { sublabel: 'tgt' });
    if (cap && row.blochCaption) {
      cap.style.opacity = '0';
      cap.textContent = row.blochCaption;
      cap.style.transition = 'opacity 0.25s';
      setTimeout(() => { cap.style.opacity = '1'; }, 20);
    }
  }

  function drawGateAnim(rowIdx) {
    const svg = document.getElementById('cnot-gate-svg');
    if (!svg) return;
    const ns = 'http://www.w3.org/2000/svg';
    svg.innerHTML = '';
    const row = ttData[rowIdx];
    function el(tag, attrs, text) {
      const e = document.createElementNS(ns, tag);
      for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
      if (text !== undefined) e.textContent = text;
      return e;
    }
    // Wire lines
    svg.appendChild(el('line', { x1: 10, y1: 35, x2: 250, y2: 35, stroke: 'var(--line-bright)', 'stroke-width': 1.5 }));
    svg.appendChild(el('line', { x1: 10, y1: 75, x2: 250, y2: 75, stroke: 'var(--line-bright)', 'stroke-width': 1.5 }));
    // Labels
    svg.appendChild(el('text', { x: 4, y: 39, 'font-family': 'var(--mono)', 'font-size': 9, fill: 'var(--ink-faint)' }, 'ctrl'));
    svg.appendChild(el('text', { x: 4, y: 79, 'font-family': 'var(--mono)', 'font-size': 9, fill: 'var(--ink-faint)' }, 'tgt'));
    // Input states
    svg.appendChild(el('text', { x: 14, y: 31, 'font-family': 'var(--serif)', 'font-style': 'italic', 'font-size': 12, fill: 'var(--ink-dim)' }, row.ctrl));
    svg.appendChild(el('text', { x: 14, y: 71, 'font-family': 'var(--serif)', 'font-style': 'italic', 'font-size': 12, fill: 'var(--ink-dim)' }, row.tgt));
    // CNOT gate at center
    const cx = 130;
    const ctrlOn = row.ctrl === '|1⟩';
    svg.appendChild(el('circle', { cx, cy: 35, r: 5, fill: ctrlOn ? 'var(--mint)' : 'var(--bg-1)', stroke: 'var(--mint)', 'stroke-width': 1.5 }));
    svg.appendChild(el('line', { x1: cx, y1: 40, x2: cx, y2: 63, stroke: 'var(--mint)', 'stroke-width': 1.5 }));
    svg.appendChild(el('circle', { cx, cy: 75, r: 12, fill: 'none', stroke: 'var(--mint)', 'stroke-width': 1.5 }));
    svg.appendChild(el('text', { x: cx - 4, y: 79, 'font-family': 'var(--serif)', 'font-size': 14, fill: 'var(--mint)' }, '⊕'));
    // Output states
    const outColor = ctrlOn ? 'var(--amber)' : 'var(--mint)';
    svg.appendChild(el('text', { x: 150, y: 31, 'font-family': 'var(--serif)', 'font-style': 'italic', 'font-size': 12, fill: 'var(--mint)' }, row.outC));
    svg.appendChild(el('text', { x: 150, y: 71, 'font-family': 'var(--serif)', 'font-style': 'italic', 'font-size': 12, fill: outColor }, row.outT));
    if (ctrlOn) {
      // flip arrow on target wire
      svg.appendChild(el('path', { d: `M ${cx + 14},68 Q ${cx + 26},56 ${cx + 14},44`, fill: 'none', stroke: 'var(--amber)', 'stroke-width': 1, 'stroke-dasharray': '2 2' }));
      svg.appendChild(el('text', { x: cx + 30, y: 58, 'font-family': 'var(--mono)', 'font-size': 7.5, fill: 'var(--amber)', 'letter-spacing': '0.05em' }, 'FLIP!'));
    }
  }

  function hlRow(i) {
    if (!ttEl) return;
    ttEl.querySelectorAll('[data-row]').forEach(c => {
      c.style.background = parseInt(c.dataset.row) === i ? 'var(--bg-3)' : 'var(--bg-1)';
    });
    const d = document.getElementById('cnot-tt-desc'); if (d) d.textContent = ttData[i].desc;
    const pd = document.getElementById('cnot-tt-plain'); if (pd) { pd.style.opacity = 0; pd.textContent = ttData[i].plain; setTimeout(() => { pd.style.transition = 'opacity 0.3s'; pd.style.opacity = 1; }, 20); }
    drawGateAnim(i);
    drawCnotTruthBloch(i);
    ttSeen.add(i); checkAll();
  }
  if (ttData.length) hlRow(0);

  /* ── Part B: Superposition control with mini Bloch-sphere visualization ── */
  const states = {
    '0': { output: '|00⟩', note: 'Control is |0⟩ — CNOT does nothing. Target stays |0⟩.', entangled: false, plain: 'The control qubit is "definitely 0", so nothing happens. Like a key that isn\'t turned.', blochCaption: 'Product state in and out: both qubits stay at |0⟩ on their Bloch spheres.' },
    '1': { output: '|11⟩', note: 'Control is |1⟩ — CNOT flips the target. Definite outcome, no superposition.', entangled: false, plain: 'The control qubit is "definitely 1", so the target always flips. Still classical behaviour — we just know what happens.', blochCaption: 'Input |1⟩|0⟩: control stays south, target flips from north to south — same picture as the truth table, just shown as a pair.' },
    '+': { output: '\\((|00\\rangle + |11\\rangle)/\\sqrt{2}\\)', note: 'Control in superposition → CNOT spreads it to both qubits. Entanglement forms.', entangled: true, plain: 'Here\'s where it gets quantum. The control is blurry (both 0 and 1 at once). The CNOT spreads that blur to both qubits — they become linked. This is entanglement.', blochCaption: 'After CNOT the joint state is entangled. Each qubit\'s reduced density matrix is I/2 — maximally mixed — so there is no individual Bloch vector: the dot sits at the sphere centre. The dashed arc marks the correlation between the two qubits.' },
    '-': { output: '\\((|00\\rangle - |11\\rangle)/\\sqrt{2}\\)', note: 'Phase kickback signature: minus phase on whole state. Entangled with phase difference.', entangled: true, plain: 'Same probabilities as above, but with a hidden minus sign (the phase). Probabilities look identical, but this difference matters for interference in quantum algorithms.', blochCaption: 'Same reduced states as |Φ⁺⟩ — both qubits at the sphere centre (maximally mixed). The amber − mark records the relative phase between |00⟩ and |11⟩, invisible to individual-qubit measurements but governing interference in algorithms.' }
  };
  const superSeen = new Set();

  function drawCnotSuperBloch(key) {
    const svg = document.getElementById('t2-super-bloch-svg');
    const cap = document.getElementById('t2-super-bloch-caption');
    if (!svg) return;
    const ns = 'http://www.w3.org/2000/svg';
    svg.innerHTML = '';
    svg.setAttribute('viewBox', '0 0 456 138');
    function el(tag, attrs, text) {
      const e = document.createElementNS(ns, tag);
      for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
      if (text !== undefined) e.textContent = text;
      return e;
    }
    const cy = 76;
    const ctrlMap = { '0': '0', '1': '1', '+': '+', '-': '-' };
    const cs = ctrlMap[key] || '0';
    const hArc = key === '+' ? 'from0' : key === '-' ? 'from1' : null;

    svg.appendChild(el('text', { x: 108, y: 18, 'font-family': 'var(--mono)', 'font-size': 9, fill: 'var(--ink-faint)', 'letter-spacing': '0.12em' }, 'BEFORE'));
    svg.appendChild(el('text', { x: 348, y: 18, 'font-family': 'var(--mono)', 'font-size': 9, fill: 'var(--ink-faint)', 'letter-spacing': '0.12em' }, 'AFTER'));

    t2DrawMiniBlochDisc(svg, 58, cy, cs, { sublabel: 'ctrl', hArc });
    t2DrawMiniBlochDisc(svg, 158, cy, '0', { sublabel: 'tgt' });

    svg.appendChild(el('line', { x1: 228, y1: 36, x2: 228, y2: cy + 52, stroke: 'var(--line)', 'stroke-width': 1, 'stroke-dasharray': '3 3', opacity: 0.75 }));
    svg.appendChild(el('text', { x: 206, y: (cy + 34), 'font-family': 'var(--mono)', 'font-size': 8, fill: 'var(--mint)', 'letter-spacing': '0.08em' }, 'CNOT'));

    const ent = key === '+' || key === '-';
    if (!ent) {
      const oc = key === '0' ? '0' : '1';
      const ot = key === '0' ? '0' : '1';
      t2DrawMiniBlochDisc(svg, 298, cy, oc, { sublabel: 'ctrl' });
      t2DrawMiniBlochDisc(svg, 398, cy, ot, { sublabel: 'tgt' });
    } else {
      // Entangled output: each qubit's reduced density matrix is I/2 (maximally mixed).
      // The Bloch vector has length 0 — draw at the sphere centre, not the equator.
      t2DrawMiniBlochDisc(svg, 298, cy, 'mixed', { sublabel: 'ctrl' });
      t2DrawMiniBlochDisc(svg, 398, cy, 'mixed', { sublabel: 'tgt', phaseMark: key === '-' ? '−' : null });
      svg.appendChild(el('path', { d: `M ${298 + 32},${cy} Q ${348},${cy - 28} ${398 - 32},${cy}`, fill: 'none', stroke: 'var(--mint)', 'stroke-width': 1.4, 'stroke-dasharray': '3 2', opacity: 0.95 }));
      svg.appendChild(el('text', { x: 330, y: cy - 34, 'font-family': 'var(--mono)', 'font-size': 7, fill: 'var(--mint)', 'letter-spacing': '0.05em' }, 'LINKED'));
    }

    const s = states[key];
    if (cap && s && s.blochCaption) {
      cap.style.opacity = '0';
      cap.textContent = s.blochCaption;
      cap.style.transition = 'opacity 0.25s';
      setTimeout(() => { cap.style.opacity = '1'; }, 20);
    }
  }

  document.querySelectorAll('.cnot-ctrl-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cnot-ctrl-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const s = states[btn.dataset.ctrl];
      superSeen.add(btn.dataset.ctrl);
      const outEl = document.getElementById('cnot-result-state');
      const noteEl = document.getElementById('cnot-result-note');
      if (outEl) outEl.innerHTML = s.output + (s.entangled ? ' <span style="font-family:var(--mono);font-size:10px;color:var(--cyan);letter-spacing:0.1em;vertical-align:middle"> ← ENTANGLED</span>' : '');
      if (noteEl) noteEl.textContent = s.note;
      // plain explanation
      let pEl = document.getElementById('cnot-super-plain');
      if (!pEl && noteEl) {
        pEl = document.createElement('div');
        pEl.id = 'cnot-super-plain';
        pEl.style.cssText = 'margin-top:10px;padding:9px 13px;background:var(--bg-0);border-left:3px solid var(--cyan);font-family:var(--serif);font-size:12px;color:var(--ink-dim);line-height:1.65;border-radius:0 4px 4px 0;transition:opacity 0.3s;';
        noteEl.parentNode.insertBefore(pEl, noteEl.nextSibling);
      }
      if (pEl) { pEl.style.opacity = 0; pEl.textContent = s.plain; setTimeout(() => { pEl.style.opacity = 1; }, 20); }
      drawCnotSuperBloch(btn.dataset.ctrl);
      checkAll();
    });
  });
  const initB = document.querySelector('.cnot-ctrl-btn[data-ctrl="0"]'); if (initB) initB.click();

  /* ── Part C: Phase kickback with improved analogy ── */
  let kickbackSeen = false;
  const kickbackAnalogy = {
    minus: 'Think of phase kickback like a tuning fork. When you strike the target (which is already vibrating at the right frequency), the vibration travels back up to the control — it changes the control\'s "hidden" phase without flipping anything visibly. This invisible change is how quantum algorithms like Deutsch–Jozsa do their trick.',
    zero: 'With a normal |0⟩ target, the CNOT just does its usual job: flip the target if control=1. No phase travels backwards — the energy goes forward, not back.'
  };

  function updateKickback(tgt) {
    document.querySelectorAll('.kickback-tgt-btn').forEach(b => b.classList.toggle('active', b.dataset.tgt === tgt));
    const res = document.getElementById('kickback-result');
    if (tgt === 'minus') {
      if (res) res.innerHTML = '<b style="color:var(--mint)">Phase kickback active.</b><br>Target |−⟩ is a −1-eigenstate of X. Oracle-style control contributes a phase factor <code>(−1)<sup>f(x)</sup></code> on the control branch, not a target flip.<br><br>Control: |+⟩ → |−⟩ (phase flips). Target: |−⟩ unchanged.';
    } else {
      if (res) res.innerHTML = '<b style="color:var(--amber)">Normal CNOT — creates entanglement.</b><br>With control |+⟩ and target |0⟩, the CNOT produces a <b style="color:var(--mint)">Bell state</b> <span style="color:var(--ink-dim)">(maximally entangled two-qubit pure state;</span> here <span style="color:var(--cyan)">Φ⁺</span><span style="color:var(--ink-dim)">:</span> <code>(|00⟩+|11⟩)/√2</code><span style="color:var(--ink-dim)">)</span>. The target is flipped conditionally, entangling both qubits. Unlike the |−⟩ case, no global phase is written back to the control — but this is not a simple classical flip either.';
    }
    drawKickbackSVG(document.getElementById('kickback-svg'), tgt === 'minus');

    // analogy callout
    let aEl = document.getElementById('kickback-analogy');
    if (!aEl && res) {
      aEl = document.createElement('div');
      aEl.id = 'kickback-analogy';
      aEl.style.cssText = 'margin-top:12px;padding:10px 14px;background:var(--bg-0);border-left:3px solid var(--amber);font-family:var(--serif);font-size:12px;color:var(--ink-dim);line-height:1.65;border-radius:0 4px 4px 0;';
      const head = document.createElement('div');
      head.style.cssText = 'font-family:var(--mono);font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:var(--amber);margin-bottom:5px;';
      head.textContent = 'Analogy';
      aEl.prepend(head);
      res.parentNode.insertBefore(aEl, res.nextSibling);
    }
    if (aEl) {
      const head = aEl.querySelector('div');
      aEl.textContent = kickbackAnalogy[tgt];
      if (head) aEl.prepend(head);
    }
    kickbackSeen = true; checkAll();
  }

  function drawKickbackSVG(svg, kb) {
    if (!svg) return;
    const ns = 'http://www.w3.org/2000/svg';
    svg.innerHTML = '';
    function el(tag, attrs, text) { const e = document.createElementNS(ns, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); if (text !== undefined) e.textContent = text; return e; }
    svg.appendChild(el('line', { x1: 20, y1: 35, x2: 240, y2: 35, stroke: 'var(--line-bright)', 'stroke-width': 1 }));
    svg.appendChild(el('line', { x1: 20, y1: 75, x2: 240, y2: 75, stroke: 'var(--line-bright)', 'stroke-width': 1 }));
    svg.appendChild(el('text', { x: 5, y: 38, 'font-family': 'var(--mono)', 'font-size': 9, fill: 'var(--ink-faint)' }, 'q0'));
    svg.appendChild(el('text', { x: 5, y: 78, 'font-family': 'var(--mono)', 'font-size': 9, fill: 'var(--ink-faint)' }, 'q1'));
    svg.appendChild(el('text', { x: 22, y: 30, 'font-family': 'var(--serif)', 'font-style': 'italic', 'font-size': 11, fill: 'var(--ink-dim)' }, '|+⟩'));
    svg.appendChild(el('text', { x: 22, y: 90, 'font-family': 'var(--serif)', 'font-style': 'italic', 'font-size': 11, fill: 'var(--ink-dim)' }, kb ? '|−⟩' : '|0⟩'));
    svg.appendChild(el('circle', { cx: 130, cy: 35, r: 5, fill: 'var(--mint)' }));
    svg.appendChild(el('circle', { cx: 130, cy: 75, r: 12, fill: 'none', stroke: 'var(--mint)', 'stroke-width': 1.5 }));
    svg.appendChild(el('line', { x1: 130, y1: 40, x2: 130, y2: 63, stroke: 'var(--mint)', 'stroke-width': 1.5 }));
    svg.appendChild(el('text', { x: 126, y: 79, 'font-family': 'var(--serif)', 'font-size': 14, fill: 'var(--mint)' }, '⊕'));
    svg.appendChild(el('text', { x: 148, y: 30, 'font-family': 'var(--serif)', 'font-style': 'italic', 'font-size': 11, fill: kb ? 'var(--amber)' : 'var(--mint)' }, kb ? '|−⟩' : '(|00⟩+|11⟩)/√2'));
    svg.appendChild(el('text', { x: 148, y: 90, 'font-family': 'var(--serif)', 'font-style': 'italic', 'font-size': 11, fill: 'var(--mint-dim)' }, kb ? '|−⟩ (unchanged)' : '← entangled'));
    if (kb) {
      // kickback arrow: curved path going from target back up to control
      svg.appendChild(el('path', { d: 'M 115,70 Q 95,52 115,32', fill: 'none', stroke: 'var(--amber)', 'stroke-width': 1.5, 'stroke-dasharray': '3 2', 'marker-end': 'url(#arr)' }));
      const defs = el('defs', {});
      const marker = el('marker', { id: 'arr', markerWidth: 6, markerHeight: 6, refX: 3, refY: 3, orient: 'auto' });
      marker.appendChild(el('path', { d: 'M0,0 L6,3 L0,6 Z', fill: 'var(--amber)' }));
      defs.appendChild(marker); svg.appendChild(defs);
      svg.appendChild(el('text', { x: 55, y: 17, 'font-family': 'var(--mono)', 'font-size': 8, fill: 'var(--amber)', 'letter-spacing': '0.06em' }, 'phase kicks back ↑'));
    }
  }
  document.querySelectorAll('.kickback-tgt-btn').forEach(btn => { btn.addEventListener('click', () => updateKickback(btn.dataset.tgt)); });
  updateKickback('minus');

  function checkAll() {
    if (ttSeen.size >= 4 && superSeen.size >= 4 && kickbackSeen) markDone('t2-2');
  }
})();


/* --------------------------------------------------------------------------
   T2 STEP 3 — Bell state builder
   NEW: animated "ball-and-wire" visual showing the two qubits, a before/after
   "independence test" bar, and a natural-language description of each stage
   -------------------------------------------------------------------------- */
(function initT2Step3() {
  const bellSteps = [
    {
      formula: '\\(|q1\\rangle|q0\\rangle = |0\\rangle|0\\rangle = |00\\rangle\\)',
      probs: [1, 0, 0, 0],
      desc: 'Both qubits start in |0⟩. The state is fully definite — no superposition, no entanglement.',
      plain: 'Imagine two coins, both showing heads. There\'s only one possible outcome: "00". Completely predictable, completely independent.',
      blochCaption: 'Both qubits at the north pole — a boring product state before any gates.',
      entangled: false,
      q0state: '|0⟩',
      q1state: '|0⟩',
      linked: false
    },
    {
      formula: '\\((|0\\rangle+|1\\rangle)/\\sqrt{2} \\otimes |0\\rangle = (|00\\rangle+|10\\rangle)/\\sqrt{2}\\)',
      probs: [0.5, 0, 0.5, 0],
      desc: 'Hadamard on q0 creates superposition. q0 is now 50/50, but the two qubits are still independent — this is a product state.',
      plain: 'After the Hadamard, q0 is in a genuine blur (50/50), but q1 is still definitely 0. The qubits are still independent — like one fair coin and one coin glued to heads.',
      blochCaption: 'Same picture as Step 1 “H on q0 only”: q0 moves to |+⟩ along the H arc; q1 stays |0⟩. Still independent.',
      entangled: false,
      q0state: '|+⟩',
      q1state: '|0⟩',
      linked: false
    },
    {
      formula: '\\((|00\\rangle + |11\\rangle)/\\sqrt{2}\\)',
      probs: [0.5, 0, 0, 0.5],
      desc: 'CNOT entangles. The target (q1) flips when q0=|1⟩. The two possible outcomes — |00⟩ and |11⟩ — are now locked together. This is a <b style="color:var(--mint)">Bell state</b> <span style="color:var(--ink-dim)">— a maximally entangled two-qubit pure state</span> <span style="color:var(--cyan)">(Bell pair;</span> <span style="color:var(--ink-dim)">here the Φ⁺ ket</span> <span style="font-family:var(--serif);font-style:italic;color:var(--mint)">(|00⟩+|11⟩)/√2</span><span style="color:var(--ink-dim)">).</span>',
      plain: 'The CNOT "links" the two qubits. Now if q0 is 0, q1 must be 0. If q0 is 1, q1 must be 1. They always agree — even though neither has a definite value on its own. This is entanglement.',
      blochCaption: 'Cartoon: equator arrows + “LINKED” mark a Bell/Bell-pair joint state — each qubit alone looks mixed; the story is in the correlation.',
      entangled: true,
      q0state: '?',
      q1state: '?',
      linked: true
    }
  ];
  const seen = new Set();

  /* ── Mini Bloch discs (same style as Steps 1–2) ── */
  function drawBellBloch(step) {
    const svg = document.getElementById('bell-bloch-svg');
    const cap = document.getElementById('bell-bloch-caption');
    if (!svg) return;
    const ns = 'http://www.w3.org/2000/svg';
    svg.innerHTML = '';
    svg.setAttribute('viewBox', '0 0 220 124');
    function el(tag, attrs, text) {
      const e = document.createElementNS(ns, tag);
      for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
      if (text !== undefined) e.textContent = text;
      return e;
    }
    const cy = 58;
    if (!step.linked) {
      const q0 = step.q0state === '|+⟩' ? '+' : '0';
      const q1 = step.q1state === '|+⟩' ? '+' : '0';
      t2DrawMiniBlochDisc(svg, 55, cy, q0, { sublabel: 'q0', hArc: q0 === '+' ? 'from0' : null });
      t2DrawMiniBlochDisc(svg, 165, cy, q1, { sublabel: 'q1', hArc: q1 === '+' ? 'from0' : null });
      t2DrawBlochPairLink(svg, 55, 165, cy, 'INDEPENDENT', 'var(--line)');
    } else {
      t2DrawMiniBlochDisc(svg, 55, cy, '+', { sublabel: 'q0', hArc: null });
      t2DrawMiniBlochDisc(svg, 165, cy, '+', { sublabel: 'q1', hArc: null });
      svg.appendChild(el('path', {
        d: `M ${55 + 32},${cy} Q ${110},${cy - 28} ${165 - 32},${cy}`,
        fill: 'none',
        stroke: 'var(--mint)',
        'stroke-width': 1.4,
        'stroke-dasharray': '3 2',
        opacity: 0.95
      }));
      svg.appendChild(el('text', { x: 92, y: cy - 34, 'font-family': 'var(--mono)', 'font-size': 7, fill: 'var(--mint)', 'letter-spacing': '0.05em' }, 'LINKED'));
    }
    if (cap && step.blochCaption) {
      cap.style.opacity = '0';
      cap.textContent = step.blochCaption;
      cap.style.transition = 'opacity 0.25s';
      setTimeout(() => { cap.style.opacity = '1'; }, 20);
    }
  }

  /* ── "Spooky test" bar: what % of outcomes match? ── */
  function renderMatchMeter(step) {
    let wrap = document.getElementById('bell-match-meter');
    if (!wrap) {
      const pEl = document.getElementById('bell-builder-probs');
      if (!pEl) return;
      wrap = document.createElement('div');
      wrap.id = 'bell-match-meter';
      wrap.style.cssText = 'margin-top:12px;';
      pEl.parentNode.insertBefore(wrap, pEl.nextSibling);
    }
    const matchPct = step.entangled ? 100 : (() => {
      const p = step.probs;
      // outcomes that agree: 00, 11
      return Math.round((p[0] + p[3]) * 100);
    })();
    wrap.innerHTML = `
      <div style="font-family:var(--mono);font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:var(--ink-faint);margin-bottom:5px;">
        "Always agree" test — what fraction of outcomes have matching qubits?
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="flex:1;height:8px;background:var(--bg-2);border-radius:4px;overflow:hidden;">
          <div id="bell-match-bar" style="height:100%;width:0%;background:${matchPct === 100 ? 'var(--mint)' : 'var(--cyan)'};border-radius:4px;transition:width 0.6s ease;"></div>
        </div>
        <div id="bell-match-label" style="font-family:var(--mono);font-size:11px;color:${matchPct === 100 ? 'var(--mint)' : 'var(--ink-dim)'};width:50px;text-align:right;">${matchPct}%</div>
      </div>
      <div style="font-family:var(--serif);font-size:11px;color:var(--ink-faint);margin-top:4px;">${matchPct === 100 ? '🔗 Perfect correlation — this is what makes a Bell pair special' : matchPct > 50 ? 'Partially correlated — some matching, but not entangled' : 'No special correlation — qubits are independent'}</div>
    `;
    setTimeout(() => { const b = document.getElementById('bell-match-bar'); if (b) b.style.width = matchPct + '%'; }, 50);
  }

  function renderBellStep(i) {
    const s = bellSteps[i];
    const fEl = document.getElementById('bell-state-formula');
    const dEl = document.getElementById('bell-step-desc');
    if (fEl) fEl.textContent = s.formula;
    if (dEl) dEl.innerHTML = s.desc;

    // plain explanation
    let pEl = document.getElementById('bell-step-plain');
    if (!pEl && dEl) {
      pEl = document.createElement('div');
      pEl.id = 'bell-step-plain';
      pEl.style.cssText = 'margin-top:8px;padding:9px 13px;background:var(--bg-0);border-left:3px solid var(--mint);font-family:var(--serif);font-size:12px;color:var(--ink-dim);line-height:1.65;border-radius:0 4px 4px 0;transition:opacity 0.3s;';
      dEl.parentNode.insertBefore(pEl, dEl.nextSibling);
    }
    if (pEl) { pEl.style.opacity = 0; pEl.textContent = s.plain; setTimeout(() => { pEl.style.opacity = 1; }, 20); }

    const labels = ['|00⟩', '|01⟩', '|10⟩', '|11⟩'];
    const pObEl = document.getElementById('bell-builder-probs');
    if (pObEl) pObEl.innerHTML = '<div class="prob-list">' + s.probs.map((p, j) => {
      const pct = (p * 100).toFixed(0);
      return `<div class="prob-row${p < 0.01 ? ' zero' : ''}">
        <div class="prob-label">${labels[j]}</div>
        <div class="prob-bar-wrap"><div class="prob-bar" style="width:${p * 100}%;transition:width 0.5s ease;"></div></div>
        <div class="prob-val">${pct}%</div>
      </div>`;
    }).join('') + '</div>';

    drawBellBloch(s);
    renderMatchMeter(s);
    seen.add(i);
    if (seen.size >= 3) markDone('t2-3');
  }

  document.querySelectorAll('.bell-step-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.bell-step-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderBellStep(parseInt(btn.dataset.bellStep));
    });
  });
  renderBellStep(0);
})();


/* --------------------------------------------------------------------------
   T2 STEP 4 — Bell collapse + CHSH
   NEW: "spooky distance" animated collapse graphic, running correlation
   tracker with tally marks, improved CHSH gauge with classical/quantum zones
   -------------------------------------------------------------------------- */
(function initT2Step4() {
  /* ── Part A: spooky collapse with animated pair display ── */
  const grid = document.getElementById('t2-collapse-grid');
  const shotEl = document.getElementById('t2-collapse-shot');
  const countEl = document.getElementById('t2-collapse-count');
  let measurements = 0, chshDone = false;

  // running tally: [count00, count11]
  let tally = [0, 0];

  function checkDone() { if (measurements >= 10 && chshDone) markDone('t2-4'); }

  /* Correlation tally bar */
  function ensureTally() {
    let tallyEl = document.getElementById('t2-tally-bar');
    if (!tallyEl && grid) {
      tallyEl = document.createElement('div');
      tallyEl.id = 't2-tally-bar';
      tallyEl.style.cssText = 'margin-top:14px;';
      tallyEl.innerHTML = `
        <div style="font-family:var(--mono);font-size:8.5px;letter-spacing:0.1em;text-transform:uppercase;color:var(--ink-faint);margin-bottom:4px;">Running correlation — always 00 or 11, never 01 or 10</div>
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;">
          <div style="font-family:var(--mono);font-size:10px;color:var(--cyan);width:36px;">00</div>
          <div style="flex:1;height:7px;background:var(--bg-2);border-radius:3px;overflow:hidden;">
            <div id="tally-00-bar" style="height:100%;width:0%;background:var(--cyan);border-radius:3px;transition:width 0.4s;"></div>
          </div>
          <div id="tally-00-count" style="font-family:var(--mono);font-size:10px;color:var(--cyan);width:22px;text-align:right;">0</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;">
          <div style="font-family:var(--mono);font-size:10px;color:var(--amber);width:36px;">11</div>
          <div style="flex:1;height:7px;background:var(--bg-2);border-radius:3px;overflow:hidden;">
            <div id="tally-11-bar" style="height:100%;width:0%;background:var(--amber);border-radius:3px;transition:width 0.4s;"></div>
          </div>
          <div id="tally-11-count" style="font-family:var(--mono);font-size:10px;color:var(--amber);width:22px;text-align:right;">0</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          <div style="font-family:var(--mono);font-size:10px;color:var(--ink-faint);width:36px;">01/10</div>
          <div style="flex:1;height:7px;background:var(--bg-2);border-radius:3px;overflow:hidden;">
            <div id="tally-mismatch-bar" style="height:100%;width:0%;background:var(--line);border-radius:3px;"></div>
          </div>
          <div id="tally-mismatch-count" style="font-family:var(--mono);font-size:10px;color:var(--ink-faint);width:22px;text-align:right;">0</div>
        </div>
        <div id="t2-tally-note" style="font-family:var(--serif);font-size:11px;color:var(--ink-faint);margin-top:6px;font-style:italic;"></div>
      `;
      grid.parentNode.insertBefore(tallyEl, grid.nextSibling);
    }
  }
  ensureTally();

  function updateTally(outcome) {
    if (outcome === 0) tally[0]++; else tally[1]++;
    const total = tally[0] + tally[1];
    const bar00 = document.getElementById('tally-00-bar');
    const bar11 = document.getElementById('tally-11-bar');
    const cnt00 = document.getElementById('tally-00-count');
    const cnt11 = document.getElementById('tally-11-count');
    const noteEl = document.getElementById('t2-tally-note');
    if (bar00) bar00.style.width = (tally[0] / total * 100) + '%';
    if (bar11) bar11.style.width = (tally[1] / total * 100) + '%';
    if (cnt00) cnt00.textContent = tally[0];
    if (cnt11) cnt11.textContent = tally[1];
    if (noteEl && total >= 5) noteEl.textContent = `${total} measurements, 0 mismatches. The qubits always agree — that\'s entanglement.`;
  }

  function measure() {
    const o = Math.random() < 0.5 ? 0 : 1;
    const cell = document.createElement('div');
    cell.className = 'pair-cell match';
    cell.textContent = `${o}${o}`;
    // brief pop animation
    cell.style.transform = 'scale(0.6)';
    cell.style.transition = 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)';
    grid.appendChild(cell);
    requestAnimationFrame(() => { cell.style.transform = 'scale(1)'; });
    if (shotEl) { shotEl.textContent = `q0=${o}, q1=${o}`; shotEl.style.color = o === 0 ? 'var(--cyan)' : 'var(--amber)'; }
    measurements++;
    if (countEl) countEl.textContent = `${measurements} measurement${measurements === 1 ? '' : 's'}`;
    updateTally(o);
    checkDone();
  }
  const mb = document.getElementById('t2-measure-btn'); if (mb) mb.addEventListener('click', measure);
  const rb = document.getElementById('t2-collapse-reset');
  if (rb) rb.addEventListener('click', () => {
    measurements = 0; tally = [0, 0]; grid.innerHTML = '';
    if (shotEl) { shotEl.textContent = '—'; shotEl.style.color = 'var(--mint)'; }
    if (countEl) countEl.textContent = '0 measurements';
    ['tally-00-bar', 'tally-11-bar', 'tally-mismatch-bar'].forEach(id => { const b = document.getElementById(id); if (b) b.style.width = '0%'; });
    ['tally-00-count', 'tally-11-count', 'tally-mismatch-count'].forEach(id => { const c = document.getElementById(id); if (c) c.textContent = '0'; });
    const n = document.getElementById('t2-tally-note'); if (n) n.textContent = '';
  });

  /* ── Part B: CHSH with zone gauge ── */
  const alphaSlider = document.getElementById('chsh-alpha');
  const betaSlider = document.getElementById('chsh-beta');
  const alphaVal = document.getElementById('chsh-alpha-val');
  const betaVal = document.getElementById('chsh-beta-val');
  if (alphaSlider) alphaSlider.addEventListener('input', () => { alphaVal.textContent = alphaSlider.value + '°'; });
  if (betaSlider) betaSlider.addEventListener('input', () => { betaVal.textContent = betaSlider.value + '°'; });

  /* Zone gauge: insert after CHSH bar if not present */
  function ensureZoneGauge() {
    if (document.getElementById('chsh-zone-gauge')) return;
    const verdict = document.getElementById('chsh-verdict');
    if (!verdict) return;
    const gauge = document.createElement('div');
    gauge.id = 'chsh-zone-gauge';
    gauge.style.cssText = 'margin-top:14px;';
    gauge.innerHTML = `
      <div style="font-family:var(--mono);font-size:8.5px;letter-spacing:0.1em;text-transform:uppercase;color:var(--ink-faint);margin-bottom:6px;">Where does your result land?</div>
      <div style="position:relative;height:32px;border-radius:4px;overflow:hidden;background:var(--bg-2);">
        <div style="position:absolute;left:0;top:0;height:100%;width:${(2/2.828)*100}%;background:linear-gradient(90deg,var(--bg-3),var(--amber-dim));opacity:0.6;"></div>
        <div style="position:absolute;left:${(2/2.828)*100}%;top:0;height:100%;right:0;background:linear-gradient(90deg,var(--mint-dim),var(--mint));opacity:0.6;"></div>
        <div style="position:absolute;left:${(2/2.828)*100}%;top:0;bottom:0;width:1.5px;background:var(--line-bright);"></div>
        <div style="position:absolute;left:4px;top:50%;transform:translateY(-50%);font-family:var(--mono);font-size:8px;color:var(--ink-dim);letter-spacing:0.06em;">CLASSICAL ≤2</div>
        <div style="position:absolute;right:4px;top:50%;transform:translateY(-50%);font-family:var(--mono);font-size:8px;color:var(--mint);letter-spacing:0.06em;">QUANTUM 2√2</div>
        <div id="chsh-zone-needle" style="position:absolute;top:0;bottom:0;width:2px;background:white;border-radius:1px;transform:translateX(-50%);transition:left 0.5s ease;left:0%;"></div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:3px;">
        <div style="font-family:var(--mono);font-size:8px;color:var(--ink-faint);">0</div>
        <div style="font-family:var(--mono);font-size:8px;color:var(--amber);">2.000</div>
        <div style="font-family:var(--mono);font-size:8px;color:var(--mint);">2.828</div>
      </div>
      <div id="chsh-zone-label" style="font-family:var(--serif);font-size:11px;color:var(--ink-dim);margin-top:5px;font-style:italic;min-height:16px;"></div>
    `;
    verdict.parentNode.insertBefore(gauge, verdict.nextSibling);
  }
  ensureZoneGauge();

  const chshBtn = document.getElementById('chsh-run-btn');
  if (chshBtn) chshBtn.addEventListener('click', () => {
    const alpha = parseInt(alphaSlider.value) * Math.PI / 180;
    const beta = parseInt(betaSlider.value) * Math.PI / 180;
    // α′ = α + 90°, β′ = β + 90°. With E(x,y) = −cos(x−y) this gives
    // S = −2cos(u) + 2sin(u)  (u = α−β), max |S| = 2√2 at u = 135°.
    // Tip: set α ≈ 135°, β ≈ 0° (or any α−β ≈ 135°) to reach the quantum limit.
    const ap = alpha + Math.PI / 2, bp = beta + Math.PI / 2;
    function E(x, y) { return -Math.cos(x - y) + (Math.random() - 0.5) * 0.06; }
    const chsh = Math.abs(E(alpha, beta) - E(alpha, bp) + E(ap, beta) + E(ap, bp));
    const pct = Math.min(100, (chsh / 2.828) * 100);
    const barFill = document.getElementById('chsh-bar-fill');
    const barLabel = document.getElementById('chsh-bar-label');
    const valEl = document.getElementById('chsh-value');
    const verdict = document.getElementById('chsh-verdict');
    if (barFill) { barFill.style.width = pct + '%'; }
    if (barLabel) barLabel.textContent = chsh.toFixed(3);
    if (valEl) valEl.textContent = chsh.toFixed(3);
    const classical = chsh <= 2.0;
    if (verdict) { verdict.textContent = classical ? '≤ 2 — classical' : '> 2 — quantum!'; verdict.style.color = classical ? 'var(--amber)' : 'var(--mint)'; }
    if (barFill) barFill.style.background = classical ? 'linear-gradient(90deg,var(--amber),var(--amber-dim))' : 'linear-gradient(90deg,var(--mint-dim),var(--mint))';
    // zone gauge needle
    const needle = document.getElementById('chsh-zone-needle');
    const zoneLabel = document.getElementById('chsh-zone-label');
    if (needle) needle.style.left = pct + '%';
    if (zoneLabel) zoneLabel.textContent = classical
      ? 'This result could be explained by a classical hidden-variable model. Try α − β ≈ 135° to push into the quantum zone.'
      : `This result (${chsh.toFixed(3)} > 2) cannot be explained classically — it\'s genuinely quantum. The Tsirelson bound 2√2 ≈ 2.828 is reached when α − β = 135°.`;
    flashEl(needle, classical ? 'var(--amber)' : 'var(--mint)');
    chshDone = true; checkDone();
  });
})();


/* --------------------------------------------------------------------------
   T2 STEP 5 — Summary reading step
   (auto-unlock on view, as before)
   -------------------------------------------------------------------------- */
(function initT2Step5() {
  const card = document.querySelector('[data-step="t2-5"]');
  if (card) {
    const obs = new MutationObserver(() => {
      if (!card.classList.contains('locked')) { markDone('t2-5'); obs.disconnect(); }
    });
    obs.observe(card, { attributes: true, attributeFilter: ['class'] });
  }
})();
