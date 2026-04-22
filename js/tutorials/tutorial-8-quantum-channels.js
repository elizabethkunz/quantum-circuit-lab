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

  function drawBlochSphereProjection(svgId, inputVec, outputVec, azimuth = 0.95, elevation = 0.52) {
    const svg = document.getElementById(svgId);
    if (!svg) return;
    const ns = 'http://www.w3.org/2000/svg';
    svg.innerHTML = '';
    const W = 360, H = 220, cx = 180, cy = 114, R = 72;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    function mk(tag, attrs, text) {
      const e = document.createElementNS(ns, tag);
      Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
      if (text) e.textContent = text;
      return e;
    }

    function proj(v) {
      const ca = Math.cos(azimuth), sa = Math.sin(azimuth);
      const ce = Math.cos(elevation), se = Math.sin(elevation);
      const x1 = ca * v.x - sa * v.y;
      const y1 = sa * v.x + ca * v.y;
      const z1 = v.z;
      const y2 = ce * y1 - se * z1;
      const z2 = se * y1 + ce * z1;
      return { x: cx + R * x1, y: cy - R * y2, depth: z2 };
    }

    const back = 0.45 + 0.25 * Math.cos(elevation);
    svg.appendChild(mk('ellipse', { cx, cy, rx: R, ry: Math.max(20, R * back), fill: 'none', stroke: 'var(--line)', 'stroke-width': 1, opacity: 0.55 }));
    svg.appendChild(mk('circle', { cx, cy, r: R, fill: 'none', stroke: 'var(--line-bright)', 'stroke-width': 1.2, opacity: 0.85 }));

    const basis = [
      { name: 'x', v: { x: 1, y: 0, z: 0 } },
      { name: 'y', v: { x: 0, y: 1, z: 0 } },
      { name: 'z', v: { x: 0, y: 0, z: 1 } }
    ];
    basis.forEach(b => {
      const p = proj(b.v);
      svg.appendChild(mk('line', { x1: cx, y1: cy, x2: p.x, y2: p.y, stroke: 'var(--line)', 'stroke-width': 1, opacity: 0.8 }));
      svg.appendChild(mk('text', {
        x: p.x + 4, y: p.y - 4, fill: 'var(--ink-faint)', 'font-size': 10, 'font-family': 'var(--mono)'
      }, b.name));
    });

    const pin = proj(inputVec);
    const pout = proj(outputVec);
    svg.appendChild(mk('line', { x1: cx, y1: cy, x2: pin.x, y2: pin.y, stroke: 'var(--phos)', 'stroke-width': 3, 'stroke-linecap': 'round' }));
    svg.appendChild(mk('circle', { cx: pin.x, cy: pin.y, r: 4.4, fill: 'var(--phos)' }));
    svg.appendChild(mk('line', { x1: cx, y1: cy, x2: pout.x, y2: pout.y, stroke: 'var(--amber)', 'stroke-width': 3, 'stroke-linecap': 'round' }));
    svg.appendChild(mk('circle', { cx: pout.x, cy: pout.y, r: 4.4, fill: 'var(--amber)' }));
    svg.appendChild(mk('text', { x: 16, y: 24, fill: 'var(--phos)', 'font-size': 11, 'font-family': 'var(--mono)' }, 'input'));
    svg.appendChild(mk('text', { x: 16, y: 40, fill: 'var(--amber)', 'font-size': 11, 'font-family': 'var(--mono)' }, 'after channel'));
  }

  function blochRadius(v) {
    return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  }

  function djNoisyDistribution(n, functionType, channel, strength) {
    const N = Math.pow(2, n);
    const probs = new Array(N).fill(0);
    const idealIndex = functionType === 'constant' ? 0 : (N - 1);
    probs[idealIndex] = 1;

    const p = Math.max(0, Math.min(1, strength));
    const uniform = 1 / N;

    if (channel === 'depolarizing') {
      for (let i = 0; i < N; i++) probs[i] = (1 - p) * probs[i] + p * uniform;
      return probs;
    }

    if (channel === 'dephasing') {
      const q = 0.2 + 0.55 * p;
      for (let i = 0; i < N; i++) probs[i] = (1 - q) * probs[i] + q * uniform;
      return probs;
    }

    if (channel === 'amplitude') {
      const toGround = 0.18 + 0.7 * p;
      const toUniform = 0.15 * p;
      for (let i = 0; i < N; i++) probs[i] = (1 - toGround - toUniform) * probs[i] + toUniform * uniform;
      probs[0] += toGround;
      const s = probs.reduce((acc, v) => acc + v, 0);
      return probs.map(v => v / Math.max(s, 1e-12));
    }

    return probs;
  }

  window.t8Utils = {
    c, matMul, dagger, matAdd, applyKraus, channelKraus, applyChannel, rhoFromState,
    blochFromRho, probsHTML, rhoHTML, purity, drawBlochDisc, drawBlochSphereProjection,
    traceDistance2x2, blochRadius, djNoisyDistribution, fmt
  };
})();

/* ---- T8 Step 1: map acting on a state ---- */
(function initT8Step1() {
  const mapSel = document.getElementById('t8-map-select');
  const slider = document.getElementById('t8-lambda');
  const valEl = document.getElementById('t8-lambda-val');
  const caption = document.getElementById('t8-map-caption');
  if (!mapSel || !slider) return;
  let viewAz = 0.95;

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
        <div style="margin-top:8px;border-top:1px solid var(--line);padding-top:8px;">
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-family:var(--mono);font-size:11px;color:var(--ink-dim);">
            Bloch sphere view
            <input id="t8-bloch-view" type="range" min="0.2" max="1.6" step="0.02" value="${viewAz}" style="width:130px;accent-color:var(--cyan);" />
            <span id="t8-bloch-view-val" style="color:var(--cyan)">${t8Utils.fmt(viewAz, 2)}</span>
            <span style="color:var(--ink-faint)">|r|: ${t8Utils.fmt(t8Utils.blochRadius(vout), 3)}</span>
          </div>
          <svg id="t8-bloch-sphere-svg" style="width:100%;max-width:360px;height:auto;margin-top:8px;"></svg>
        </div>
      `;
      function renderSphere() {
        t8Utils.drawBlochSphereProjection('t8-bloch-sphere-svg', vin, vout, viewAz, 0.52);
      }
      renderSphere();
      const view = document.getElementById('t8-bloch-view');
      const viewVal = document.getElementById('t8-bloch-view-val');
      if (view) {
        view.addEventListener('input', () => {
          viewAz = parseFloat(view.value);
          if (viewVal) viewVal.textContent = t8Utils.fmt(viewAz, 2);
          renderSphere();
        });
      }
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
          Symmetric shrinkage toward the maximally mixed state.<a id="fnref-t8-2" class="expert-fn-ref" href="#fn-t8-2"><sup>[E2]</sup></a>
        </div>
        <div class="glass-card">
          <b>CPTP map</b><br>
          The general quantum version of a physically allowed noisy update rule (for initially system-environment uncorrelated states).
        </div>
      </div>
      <div class="glass-card" style="margin-top:12px;">
        <b>Lindblad perspective</b><br>
        For Markovian dynamics, a Lindblad generator is the infinitesimal version of a CPTP channel semigroup: finite-time channels come from integrating that generator.
      </div>
      <div class="glass-card" style="margin-top:12px;padding:12px;">
        <b>Cross-tutorial lab: Deutsch-Jozsa under channels</b><br>
        <span style="color:var(--ink-faint);">
          Ideal DJ gives a deterministic bitstring pattern. Here you can see how different channel families blur that decision for 2-3 input qubits.
        </span>
        <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:8px;">
          <label style="font-family:var(--mono);font-size:10px;color:var(--ink-faint);">
            n qubits
            <select id="t8-dj-n" class="analysis-select" style="margin-left:6px;">
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
          </label>
          <label style="font-family:var(--mono);font-size:10px;color:var(--ink-faint);">
            Function type
            <select id="t8-dj-func" class="analysis-select" style="margin-left:6px;">
              <option value="constant">Constant f(x)</option>
              <option value="balanced">Balanced f(x)</option>
            </select>
          </label>
          <label style="font-family:var(--mono);font-size:10px;color:var(--ink-faint);">
            Channel
            <select id="t8-dj-chan" class="analysis-select" style="margin-left:6px;">
              <option value="dephasing">Dephasing</option>
              <option value="amplitude">Amplitude damping</option>
              <option value="depolarizing">Depolarizing</option>
            </select>
          </label>
          <label style="font-family:var(--mono);font-size:10px;color:var(--ink-faint);">
            Noise strength
            <input id="t8-dj-p" type="range" min="0" max="1" step="0.05" value="0.3" style="width:140px;vertical-align:middle;accent-color:var(--magenta);" />
            <span id="t8-dj-p-val" style="color:var(--magenta);">30%</span>
          </label>
        </div>
        <div id="t8-dj-circuit" style="margin-top:8px;"></div>
        <div id="t8-dj-bars" style="margin-top:8px;"></div>
        <div id="t8-dj-note" style="margin-top:8px;font-family:var(--mono);font-size:11px;color:var(--ink-dim);"></div>
      </div>
    `;

    const nSel = document.getElementById('t8-dj-n');
    const fSel = document.getElementById('t8-dj-func');
    const cSel = document.getElementById('t8-dj-chan');
    const pSlider = document.getElementById('t8-dj-p');
    const pVal = document.getElementById('t8-dj-p-val');
    const circuit = document.getElementById('t8-dj-circuit');
    const bars = document.getElementById('t8-dj-bars');
    const note = document.getElementById('t8-dj-note');

    function labelBits(i, n) {
      return `|${i.toString(2).padStart(n, '0')}⟩`;
    }

    function barsHTML(probs, n, focusIndex) {
      const maxShow = probs.length <= 8 ? probs.length : 8;
      let html = `<div style="display:grid;grid-template-columns:repeat(${maxShow},minmax(36px,1fr));gap:6px;align-items:end;">`;
      for (let i = 0; i < maxShow; i++) {
        const p = probs[i];
        const h = 24 + 92 * p;
        const hi = i === focusIndex;
        html += `
          <div style="display:flex;flex-direction:column;align-items:center;">
            <div style="width:100%;max-width:42px;height:${h}px;border-radius:8px 8px 4px 4px;background:${hi ? 'linear-gradient(180deg,var(--phos),var(--magenta))' : 'linear-gradient(180deg,var(--line-bright),var(--line))'};opacity:${hi ? 1 : 0.8};"></div>
            <div style="font-family:var(--mono);font-size:10px;color:${hi ? 'var(--phos)' : 'var(--ink-faint)'};margin-top:5px;">${labelBits(i, n)}</div>
            <div style="font-family:var(--mono);font-size:10px;color:var(--ink-dim);">${Math.round(100 * p)}%</div>
          </div>
        `;
      }
      html += '</div>';
      return html;
    }

    function renderDJ() {
      if (!nSel || !fSel || !cSel || !pSlider) return;
      const n = parseInt(nSel.value);
      const funcType = fSel.value;
      const chan = cSel.value;
      const p = parseFloat(pSlider.value);
      if (pVal) pVal.textContent = `${Math.round(100 * p)}%`;

      const N = Math.pow(2, n);
      const focusIndex = funcType === 'constant' ? 0 : (N - 1);
      const probs = t8Utils.djNoisyDistribution(n, funcType, chan, p);
      const focusProb = probs[focusIndex];
      const leakage = 1 - focusProb;
      const verdict = funcType === 'constant'
        ? 'all-zero outcome expected (constant)'
        : 'non-zero outcome expected (balanced)';

      if (circuit) {
        circuit.innerHTML = `
          <div style="border:1px solid var(--line);border-radius:10px;padding:8px;background:var(--bg-2);font-family:var(--mono);font-size:11px;color:var(--ink-dim);">
            ${'q'.repeat(n).split('').map((_, i) => `q${i}: |0⟩ --H-- U<sub>f</sub> --H-- M`).join('<br>')}
            <div style="margin-top:6px;color:var(--ink-faint);">Interpretation rule: ${verdict}</div>
          </div>
        `;
      }
      if (bars) bars.innerHTML = barsHTML(probs, n, focusIndex);
      if (note) {
        note.innerHTML = `
          Focus state ${labelBits(focusIndex, n)}: <span style="color:var(--amber)">${t8Utils.fmt(100 * focusProb, 1)}%</span>
          · leakage to wrong signatures: <span style="color:var(--cyan)">${t8Utils.fmt(100 * leakage, 1)}%</span>
          <br><span style="color:var(--ink-faint);">
            Dephasing mainly erodes interference, depolarizing randomizes toward uniform, and amplitude damping biases toward low-energy bitstrings.
          </span>
        `;
      }
    }

    [nSel, fSel, cSel, pSlider].forEach(el => {
      if (el) el.addEventListener('input', renderDJ);
      if (el) el.addEventListener('change', renderDJ);
    });
    renderDJ();
    markDone('t8-6');
  });
})();