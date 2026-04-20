/* =========================================================================
   TUTORIAL 8: QUANTUM CHANNELS & CPTP MAPS
   OQS-style: density matrices, Kraus maps, dephasing, damping, depolarizing
   ========================================================================= */

/*
Expected HTML ids/classes for this file:

Step 1
  t8-map-select            <select>
  t8-lambda                <input type="range">
  t8-lambda-val            <span>
  t8-bloch-svg             <svg>
  t8-map-caption           <div>

Step 2
  t8-state-buttons         container with buttons [data-state]
  t8-state-readout         <div>
  t8-state-probs           <div>
  t8-state-coh             <div>

Step 3
  t8-kraus-select          <select>
  t8-kraus-gamma           <input type="range">
  t8-kraus-gamma-val       <span>
  t8-kraus-box             <div>
  t8-kraus-check           <div>

Step 4
  t8-unital-compare        <div>
  t8-unital-caption        <div>
  t8-unital-run            <button>

Step 5
  t8-compose-p             <input type="range">
  t8-compose-p-val         <span>
  t8-compose-run           <button>
  t8-compose-a-then-d      <div>
  t8-compose-d-then-a      <div>
  t8-compose-note          <div>

Step 6
  t8-summary-run           <button>
  t8-summary-grid          <div>
*/

(function tutorial8Helpers() {
  if (window.t8Utils) return;

  const fmt = (x, d = 3) => {
    const n = Math.abs(x) < 1e-12 ? 0 : x;
    return Number(n).toFixed(d).replace(/\.000$/, '');
  };

  function c(re, im = 0) { return { re, im }; }
  function cAdd(a, b) { return c(a.re + b.re, a.im + b.im); }
  function cSub(a, b) { return c(a.re - b.re, a.im - b.im); }
  function cMul(a, b) { return c(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re); }
  function cConj(a) { return c(a.re, -a.im); }
  function cScale(a, s) { return c(a.re * s, a.im * s); }
  function cAbs2(a) { return a.re * a.re + a.im * a.im; }

  function matMul(A, B) {
    return [
      [
        cAdd(cMul(A[0][0], B[0][0]), cMul(A[0][1], B[1][0])),
        cAdd(cMul(A[0][0], B[0][1]), cMul(A[0][1], B[1][1]))
      ],
      [
        cAdd(cMul(A[1][0], B[0][0]), cMul(A[1][1], B[1][0])),
        cAdd(cMul(A[1][0], B[0][1]), cMul(A[1][1], B[1][1]))
      ]
    ];
  }

  function dagger(A) {
    return [
      [cConj(A[0][0]), cConj(A[1][0])],
      [cConj(A[0][1]), cConj(A[1][1])]
    ];
  }

  function matAdd(A, B) {
    return [
      [cAdd(A[0][0], B[0][0]), cAdd(A[0][1], B[0][1])],
      [cAdd(A[1][0], B[1][0]), cAdd(A[1][1], B[1][1])]
    ];
  }

  function matScale(A, s) {
    return [
      [cScale(A[0][0], s), cScale(A[0][1], s)],
      [cScale(A[1][0], s), cScale(A[1][1], s)]
    ];
  }

  function applyKraus(rho, Ks) {
    let out = [[c(0), c(0)], [c(0), c(0)]];
    Ks.forEach(K => {
      const term = matMul(matMul(K, rho), dagger(K));
      out = matAdd(out, term);
    });
    return out;
  }

  function blochFromRho(rho) {
    return {
      x: 2 * rho[0][1].re,
      y: -2 * rho[0][1].im,
      z: rho[0][0].re - rho[1][1].re
    };
  }

  function rhoFromState(name) {
    const states = {
      '0': [[c(1), c(0)], [c(0), c(0)]],
      '1': [[c(0), c(0)], [c(0), c(1)]],
      '+': [[c(0.5), c(0.5)], [c(0.5), c(0.5)]],
      '-': [[c(0.5), c(-0.5)], [c(-0.5), c(0.5)]],
      '+i': [[c(0.5), c(0, -0.5)], [c(0, 0.5), c(0.5)]],
      'mixed': [[c(0.5), c(0)], [c(0), c(0.5)]]
    };
    return states[name];
  }

  function purity(rho) {
    const r2 = matMul(rho, rho);
    return r2[0][0].re + r2[1][1].re;
  }

  function channelKraus(kind, p) {
    if (kind === 'dephasing') {
      return [
        [[c(Math.sqrt(1 - p)), c(0)], [c(0), c(Math.sqrt(1 - p))]],
        [[c(Math.sqrt(p)), c(0)], [c(0), c(-Math.sqrt(p))]]
      ];
    }
    if (kind === 'amplitude') {
      return [
        [[c(1), c(0)], [c(0), c(Math.sqrt(1 - p))]],
        [[c(0), c(Math.sqrt(p))], [c(0), c(0)]]
      ];
    }
    if (kind === 'depolarizing') {
      const s0 = Math.sqrt(Math.max(0, 1 - p));
      const s = Math.sqrt(Math.max(0, p / 3));
      return [
        [[c(s0), c(0)], [c(0), c(s0)]],
        [[c(0), c(s)], [c(s), c(0)]],               // X
        [[c(0), c(0, -s)], [c(0, s), c(0)]],       // Y
        [[c(s), c(0)], [c(0), c(-s)]]              // Z
      ];
    }
    return [
      [[c(1), c(0)], [c(0), c(1)]]
    ];
  }

  function applyChannel(kind, p, rho) {
    if (kind === 'identity') return rho;
    return applyKraus(rho, channelKraus(kind, p));
  }

  function traceDistance2x2(rhoA, rhoB) {
    const d00 = rhoA[0][0].re - rhoB[0][0].re;
    const d11 = rhoA[1][1].re - rhoB[1][1].re;
    const d01re = rhoA[0][1].re - rhoB[0][1].re;
    const d01im = rhoA[0][1].im - rhoB[0][1].im;
    const frob = Math.sqrt(d00 * d00 + d11 * d11 + 2 * (d01re * d01re + d01im * d01im));
    return 0.5 * frob;
  }

  function probsHTML(rho) {
    const p0 = Math.max(0, Math.min(1, rho[0][0].re));
    const p1 = Math.max(0, Math.min(1, rho[1][1].re));
    return `
      <div class="prob-list">
        <div class="prob-row">
          <div class="prob-label">|0⟩</div>
          <div class="prob-bar-wrap"><div class="prob-bar" style="width:${100 * p0}%"></div></div>
          <div class="prob-val">${Math.round(100 * p0)}%</div>
        </div>
        <div class="prob-row">
          <div class="prob-label">|1⟩</div>
          <div class="prob-bar-wrap"><div class="prob-bar" style="width:${100 * p1}%"></div></div>
          <div class="prob-val">${Math.round(100 * p1)}%</div>
        </div>
      </div>
    `;
  }

  function rhoHTML(rho) {
    const a = rho[0][0], b = rho[0][1], d = rho[1][1];
    const off = `${fmt(b.re, 2)} ${b.im >= 0 ? '+' : '−'} ${fmt(Math.abs(b.im), 2)}i`;
    return `
      <div style="font-family:var(--mono); font-size:12px; line-height:1.6">
        ρ = [ ${fmt(a.re,2)} , ${off} ; ${fmt(b.re,2)} ${(-b.im) >= 0 ? '+' : '−'} ${fmt(Math.abs(b.im),2)}i , ${fmt(d.re,2)} ]
      </div>
    `;
  }

  function drawBlochDisc(svgId, inputVec, outputVec, labelTop, labelBottom) {
    const svg = document.getElementById(svgId);
    if (!svg) return;
    const ns = 'http://www.w3.org/2000/svg';
    svg.innerHTML = '';
    const W = 360, H = 220, cx = 180, cy = 110, R = 75;

    function mk(tag, attrs, text) {
      const e = document.createElementNS(ns, tag);
      Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
      if (text) e.textContent = text;
      return e;
    }

    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    svg.appendChild(mk('circle', { cx, cy, r: R, fill: 'none', stroke: 'var(--line-bright)', 'stroke-width': 1.3 }));
    svg.appendChild(mk('line', { x1: cx - R - 10, y1: cy, x2: cx + R + 10, y2: cy, stroke: 'var(--line)', 'stroke-width': 1 }));
    svg.appendChild(mk('line', { x1: cx, y1: cy - R - 10, x2: cx, y2: cy + R + 10, stroke: 'var(--line)', 'stroke-width': 1 }));

    svg.appendChild(mk('text', { x: cx + R + 16, y: cy + 4, fill: 'var(--ink-faint)', 'font-size': 11, 'font-family': 'var(--mono)' }, 'x'));
    svg.appendChild(mk('text', { x: cx - 4, y: cy - R - 16, fill: 'var(--ink-faint)', 'font-size': 11, 'font-family': 'var(--mono)' }, 'z'));

    const ix = cx + inputVec.x * R;
    const iz = cy - inputVec.z * R;
    const ox = cx + outputVec.x * R;
    const oz = cy - outputVec.z * R;

    svg.appendChild(mk('line', { x1: cx, y1: cy, x2: ix, y2: iz, stroke: 'var(--phos)', 'stroke-width': 3, 'stroke-linecap': 'round' }));
    svg.appendChild(mk('circle', { cx: ix, cy: iz, r: 4.5, fill: 'var(--phos)' }));

    svg.appendChild(mk('line', { x1: cx, y1: cy, x2: ox, y2: oz, stroke: 'var(--amber)', 'stroke-width': 3, 'stroke-linecap': 'round' }));
    svg.appendChild(mk('circle', { cx: ox, cy: oz, r: 4.5, fill: 'var(--amber)' }));

    svg.appendChild(mk('text', { x: 16, y: 24, fill: 'var(--phos)', 'font-size': 12, 'font-family': 'var(--mono)' }, labelTop));
    svg.appendChild(mk('text', { x: 16, y: 42, fill: 'var(--amber)', 'font-size': 12, 'font-family': 'var(--mono)' }, labelBottom));
  }

  window.t8Utils = {
    c, matMul, dagger, matAdd, applyKraus, channelKraus, applyChannel, rhoFromState,
    blochFromRho, probsHTML, rhoHTML, purity, drawBlochDisc, traceDistance2x2, fmt
  };
})();

/* ---- T8 Step 1: map acting on a state ---- */
(function initT8Step1() {
  const mapSel = document.getElementById('t8-map-select');
  const slider = document.getElementById('t8-lambda');
  const valEl = document.getElementById('t8-lambda-val');
  const caption = document.getElementById('t8-map-caption');
  if (!mapSel || !slider) return;

  function update() {
    const kind = mapSel.value;
    const p = parseFloat(slider.value);
    const rhoIn = t8Utils.rhoFromState('+');
    const rhoOut = t8Utils.applyChannel(kind, p, rhoIn);
    const vin = t8Utils.blochFromRho(rhoIn);
    const vout = t8Utils.blochFromRho(rhoOut);
    t8Utils.drawBlochDisc('t8-bloch-svg', vin, vout, 'input: |+⟩', 'output');

    if (valEl) valEl.textContent = `${Math.round(100 * p)}%`;

    const channelNotes = {
      identity: 'A unitary or identity map just moves the state without throwing information away.',
      dephasing: 'Dephasing kills off-diagonal coherence but leaves Z-basis populations alone.',
      amplitude: 'Amplitude damping is not just shrinkage: it pulls the Bloch ball toward |0⟩, the lower-energy state.',
      depolarizing: 'Depolarizing noise shrinks the state toward the center isotropically: everything gets more mixed.'
    };

    if (caption) {
      caption.innerHTML = `
        ${channelNotes[kind]}<br>
        <span style="color:var(--ink-faint)">
          Purity: ${t8Utils.fmt(t8Utils.purity(rhoOut), 3)} ·
          x = ${t8Utils.fmt(vout.x, 2)}, z = ${t8Utils.fmt(vout.z, 2)}
        </span>
      `;
    }
    markDone('t8-1');
  }

  mapSel.addEventListener('change', update);
  slider.addEventListener('input', update);
  update();
})();

/* ---- T8 Step 2: same channel, different input states ---- */
(function initT8Step2() {
  const wrap = document.getElementById('t8-state-buttons');
  const out = document.getElementById('t8-state-readout');
  const probs = document.getElementById('t8-state-probs');
  const coh = document.getElementById('t8-state-coh');
  if (!wrap) return;

  let activeChannel = 'dephasing';
  let activeStrength = 0.5;
  let seen = new Set();

  function render(stateName) {
    const rhoIn = t8Utils.rhoFromState(stateName);
    const rhoPrimary = t8Utils.applyChannel(activeChannel, activeStrength, rhoIn);
    const rhoReference = t8Utils.applyChannel('depolarizing', activeStrength, rhoIn);

    const cIn = Math.hypot(rhoIn[0][1].re, rhoIn[0][1].im);
    const cPrimary = Math.hypot(rhoPrimary[0][1].re, rhoPrimary[0][1].im);
    const cRef = Math.hypot(rhoReference[0][1].re, rhoReference[0][1].im);

    if (out) {
      out.innerHTML = `
        <b>Input state:</b> ${stateName === 'mixed' ? 'maximally mixed' : `|${stateName}⟩`}<br>
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:8px 0 4px;">
          <label style="font-family:var(--mono);font-size:10px;color:var(--ink-faint)">
            Primary channel
            <select id="t8-state-channel" class="analysis-select" style="max-width:190px;margin-left:6px;">
              <option value="dephasing" ${activeChannel === 'dephasing' ? 'selected' : ''}>Dephasing</option>
              <option value="amplitude" ${activeChannel === 'amplitude' ? 'selected' : ''}>Amplitude damping</option>
              <option value="depolarizing" ${activeChannel === 'depolarizing' ? 'selected' : ''}>Depolarizing</option>
            </select>
          </label>
          <label style="font-family:var(--mono);font-size:10px;color:var(--ink-faint)">
            Strength
            <input id="t8-state-strength" type="range" min="0" max="1" step="0.05" value="${activeStrength}" style="width:120px;vertical-align:middle;accent-color:var(--cyan)" />
            <span id="t8-state-strength-val" style="color:var(--cyan)">${Math.round(100 * activeStrength)}%</span>
          </label>
        </div>
        <span style="color:var(--ink-faint)">
          Compare a selected channel against depolarizing at the same strength.
        </span>
      `;

      const chSel = document.getElementById('t8-state-channel');
      const str = document.getElementById('t8-state-strength');
      const strVal = document.getElementById('t8-state-strength-val');
      if (chSel) {
        chSel.addEventListener('change', () => {
          activeChannel = chSel.value;
          render(stateName);
        });
      }
      if (str) {
        str.addEventListener('input', () => {
          activeStrength = parseFloat(str.value);
          if (strVal) strVal.textContent = `${Math.round(100 * activeStrength)}%`;
          render(stateName);
        });
      }
    }

    if (probs) {
      probs.innerHTML = `
        <div class="mini-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div><b>After ${activeChannel}</b>${t8Utils.probsHTML(rhoPrimary)}</div>
          <div><b>After depolarizing (reference)</b>${t8Utils.probsHTML(rhoReference)}</div>
        </div>
      `;
    }

    if (coh) {
      const delta = t8Utils.traceDistance2x2(rhoPrimary, rhoReference);
      coh.innerHTML = `
        <div style="display:grid; gap:8px;">
          <div><b>Coherence |ρ₀₁|</b></div>
          <div>Input: <span style="color:var(--phos)">${t8Utils.fmt(cIn, 3)}</span></div>
          <div>After ${activeChannel}: <span style="color:var(--amber)">${t8Utils.fmt(cPrimary, 3)}</span></div>
          <div>After depolarizing: <span style="color:var(--amber)">${t8Utils.fmt(cRef, 3)}</span></div>
          <div style="padding-top:4px;border-top:1px solid var(--line)">
            Separation metric (1/2||ρ₁−ρ₂||<sub>F</sub>): <span style="color:var(--cyan)">${t8Utils.fmt(delta, 3)}</span>
          </div>
        </div>
      `;
    }

    seen.add(stateName);
    if (seen.size >= 3) markDone('t8-2');
  }

  wrap.querySelectorAll('[data-state]').forEach(btn => {
    btn.addEventListener('click', () => {
      wrap.querySelectorAll('[data-state]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      render(btn.dataset.state);
    });
  });

  const first = wrap.querySelector('[data-state]');
  if (first) {
    first.classList.add('active');
    render(first.dataset.state);
  }
})();

/* ---- T8 Step 3: Kraus operators and trace preservation ---- */
(function initT8Step3() {
  const sel = document.getElementById('t8-kraus-select');
  const slider = document.getElementById('t8-kraus-gamma');
  const val = document.getElementById('t8-kraus-gamma-val');
  const box = document.getElementById('t8-kraus-box');
  const check = document.getElementById('t8-kraus-check');
  if (!sel || !slider) return;

  function renderMatrix(K) {
    return `
      <div style="font-family:var(--mono); font-size:12px; line-height:1.5">
        [ ${t8Utils.fmt(K[0][0].re,2)} , ${t8Utils.fmt(K[0][1].re,2)} ; ${t8Utils.fmt(K[1][0].re,2)} , ${t8Utils.fmt(K[1][1].re,2)} ]
      </div>
    `;
  }

  function update() {
    const kind = sel.value;
    const p = parseFloat(slider.value);
    if (val) val.textContent = `${Math.round(100 * p)}%`;

    const Ks = t8Utils.channelKraus(kind, p);
    if (box) {
      box.innerHTML = Ks.map((K, i) => `
        <div style="padding:8px 0; border-top:${i ? '1px solid var(--line)' : 'none'}">
          <b>K${i}</b>${renderMatrix(K)}
        </div>
      `).join('');
    }

    let sum = [[t8Utils.c(0), t8Utils.c(0)], [t8Utils.c(0), t8Utils.c(0)]];
    Ks.forEach(K => {
      sum = t8Utils.matAdd(sum, t8Utils.matMul(t8Utils.dagger(K), K));
    });

    if (check) {
      check.innerHTML = `
        <b>Trace-preserving check:</b><br>
        Σ K†K = [ ${t8Utils.fmt(sum[0][0].re,2)} , ${t8Utils.fmt(sum[0][1].re,2)} ; ${t8Utils.fmt(sum[1][0].re,2)} , ${t8Utils.fmt(sum[1][1].re,2)} ]<br>
        <span style="color:var(--ink-faint)">For a CPTP map, this should equal the identity.</span>
      `;
    }
    markDone('t8-3');
  }

  sel.addEventListener('change', update);
  slider.addEventListener('input', update);
  update();
})();

/* ---- T8 Step 4: unital vs non-unital ---- */
(function initT8Step4() {
  const run = document.getElementById('t8-unital-run');
  const out = document.getElementById('t8-unital-compare');
  const cap = document.getElementById('t8-unital-caption');
  if (!run || !out) return;

  run.addEventListener('click', () => {
    const rhoCenter = t8Utils.rhoFromState('mixed');
    const rhoDep = t8Utils.applyChannel('depolarizing', 0.45, rhoCenter);
    const rhoAmp = t8Utils.applyChannel('amplitude', 0.45, rhoCenter);

    out.innerHTML = `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
        <div>
          <b>Depolarizing on I/2</b>
          ${t8Utils.rhoHTML(rhoDep)}
          <div style="color:var(--ink-faint); margin-top:6px;">The maximally mixed state stays put.</div>
        </div>
        <div>
          <b>Amplitude damping on I/2</b>
          ${t8Utils.rhoHTML(rhoAmp)}
          <div style="color:var(--ink-faint); margin-top:6px;">The state is pushed upward toward |0⟩.</div>
        </div>
      </div>
    `;

    if (cap) {
      cap.innerHTML = `
        <b>Key distinction:</b> dephasing and depolarizing are <i>unital</i> channels; amplitude damping is not.
        It does not just erase information — it also carries a preferred physical direction, set by energy relaxation.
      `;
    }
    markDone('t8-4');
  });
})();

/* ---- T8 Step 5: composing channels ---- */
(function initT8Step5() {
  const slider = document.getElementById('t8-compose-p');
  const val = document.getElementById('t8-compose-p-val');
  const run = document.getElementById('t8-compose-run');
  const aThenD = document.getElementById('t8-compose-a-then-d');
  const dThenA = document.getElementById('t8-compose-d-then-a');
  const note = document.getElementById('t8-compose-note');
  if (!slider || !run) return;

  function updateVal() {
    if (val) val.textContent = `${Math.round(100 * parseFloat(slider.value))}%`;
  }

  run.addEventListener('click', () => {
    const p = parseFloat(slider.value);
    const rho0 = t8Utils.rhoFromState('+i');

    const rhoAD = t8Utils.applyChannel('dephasing', p, t8Utils.applyChannel('amplitude', p, rho0));
    const rhoDA = t8Utils.applyChannel('amplitude', p, t8Utils.applyChannel('dephasing', p, rho0));

    if (aThenD) aThenD.innerHTML = `<b>Amplitude → dephasing</b>${t8Utils.rhoHTML(rhoAD)}`;
    if (dThenA) dThenA.innerHTML = `<b>Dephasing → amplitude</b>${t8Utils.rhoHTML(rhoDA)}`;

    const diff = t8Utils.traceDistance2x2(rhoAD, rhoDA);
    const commutativity = Math.max(0, 1 - 2 * diff);

    if (note) {
      note.innerHTML = `
        Channel composition is how open-system dynamics are built up in practice: one noisy process, then another.
        <br><span style="color:var(--ink-faint)">
          Here the two outputs are ${diff < 1e-6 ? 'numerically identical' : 'distinct'}.
          The larger point is that noisy evolution is generally not a single “random gate mistake” — it is a map acting on ρ.
        </span>
        <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--line);font-family:var(--mono);font-size:11px;">
          Order sensitivity (trace-distance proxy): <span style="color:var(--amber)">${t8Utils.fmt(diff, 3)}</span><br>
          Commutativity score: <span style="color:var(--cyan)">${Math.round(100 * commutativity)}%</span>
        </div>
      `;
    }
    markDone('t8-5');
  });

  slider.addEventListener('input', updateVal);
  updateVal();
})();

/* ---- T8 Step 6: summary table ---- */
(function initT8Step6() {
  const run = document.getElementById('t8-summary-run');
  const grid = document.getElementById('t8-summary-grid');
  if (!run || !grid) return;

  run.addEventListener('click', () => {
    grid.innerHTML = `
      <div style="display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px;">
        <div class="glass-card">
          <b>Dephasing</b><br>
          Leaves populations alone in the Z basis, kills phase coherence.
        </div>
        <div class="glass-card">
          <b>Amplitude damping</b><br>
          Models relaxation from |1⟩ toward |0⟩; non-unital and energy-directed.
        </div>
        <div class="glass-card">
          <b>Depolarizing</b><br>
          Symmetric shrinkage toward the maximally mixed state.
        </div>
        <div class="glass-card">
          <b>CPTP map</b><br>
          The general quantum version of a physically allowed noisy update rule.
        </div>
      </div>
    `;
    markDone('t8-6');
  });
})();