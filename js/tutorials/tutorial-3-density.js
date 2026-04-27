/* ==========================================================================
   ====================== TUTORIAL 3: DENSITY MATRICES ======================
   ========================================================================== */

/* ---- Shared density matrix 2×2 renderer ---- */
function render2x2DM(containerId, rho00, rho01re, rho01im, rho11, opts) {
  // rho = [[rho00, rho01], [conj(rho01), rho11]]
  // opts: { colorClass: 'superpos'|'mixture'|'' }
  const el = document.getElementById(containerId);
  if (!el) return;
  const cls = (opts && opts.colorClass) || '';
  const offAmt = Math.sqrt(rho01re*rho01re + rho01im*rho01im);
  const offZero = offAmt < 0.02;
  const offStr = rho01im === 0
    ? rho01re.toFixed(3)
    : (rho01re.toFixed(2) + (rho01im >= 0 ? '+' : '') + rho01im.toFixed(2) + 'i');
  const conjStr = rho01im === 0
    ? rho01re.toFixed(3)
    : (rho01re.toFixed(2) + (rho01im >= 0 ? '−' : '+') + Math.abs(rho01im).toFixed(2) + 'i');

  const diagBg0 = `rgba(var(--mint-rgb), ${0.05 + rho00 * 0.35})`;
  const diagBg1 = `rgba(var(--mint-rgb), ${0.05 + rho11 * 0.35})`;
  const offBg   = offZero ? 'var(--bg-2)' : `rgba(var(--cyan-rgb), ${0.08 + offAmt * 0.4})`;

  el.innerHTML = `<div class="dm-2x2">
    <div class="dm-2x2-corner"></div>
    <div class="dm-2x2-head">⟨0|</div>
    <div class="dm-2x2-head">⟨1|</div>
    <div class="dm-2x2-row-head">|0⟩</div>
    <div class="dm-2x2-cell diag" style="background:${diagBg0}">
      <div class="cell-main">${rho00.toFixed(3)}</div>
      <div class="cell-sub">population</div>
    </div>
    <div class="dm-2x2-cell offdiag${offZero?' zero-ish':''}" style="background:${offBg}">
      <div class="cell-main">${offStr}</div>
      <div class="cell-sub">coherence</div>
    </div>
    <div class="dm-2x2-row-head">|1⟩</div>
    <div class="dm-2x2-cell offdiag${offZero?' zero-ish':''}" style="background:${offBg}">
      <div class="cell-main">${conjStr}</div>
      <div class="cell-sub">coherence*</div>
    </div>
    <div class="dm-2x2-cell diag" style="background:${diagBg1}">
      <div class="cell-main">${rho11.toFixed(3)}</div>
      <div class="cell-sub">population</div>
    </div>
  </div>`;
}

/* ---- Histogram bar chart renderer ---- */
function renderHist(containerId, p0, p1, barClass, label0, label1) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = [
    [label0 || '|0⟩', p0, barClass],
    [label1 || '|1⟩', p1, barClass]
  ].map(([lbl, p, cls]) => `
    <div class="hist-bar-row">
      <div class="h-label">${lbl}</div>
      <div class="hist-bar-wrap"><div class="hist-bar ${cls}" style="width:${(p*100).toFixed(0)}%"></div></div>
      <div class="hist-val${cls==='mixture'?' amber':cls==='neutral'?' neutral':''}">${(p*100).toFixed(0)}%</div>
    </div>`).join('');
}

/* ---- T3 Step 1: two kinds of 50/50 ---- */
(function initT3Step1() {
  let superBasis = 'Z', mixBasis = 'Z';
  const runsNeeded = new Set();

  function runSuper() {
    // Pure |+>: Z-basis → 50/50; X-basis → always 0
    const n = 200;
    if (superBasis === 'Z') {
      const ones = Math.round(n * (0.48 + Math.random()*0.04));
      renderHist('hist-super', (n-ones)/n, ones/n, 'superpos');
    } else {
      // X-basis on |+>: always |0>
      const noise = Math.round(Math.random()*4);
      renderHist('hist-super', (n-noise)/n, noise/n, 'superpos');
    }
    runsNeeded.add('super-' + superBasis);
    if (runsNeeded.size >= 3) markDone('t3-1');
  }

  function runMix() {
    // Classical mixture: both bases give 50/50
    const n = 200;
    const ones = Math.round(n * (0.46 + Math.random()*0.08));
    renderHist('hist-mix', (n-ones)/n, ones/n, 'mixture');
    runsNeeded.add('mix-' + mixBasis);
    if (runsNeeded.size >= 3) markDone('t3-1');
  }

  document.querySelectorAll('.basis-btn[data-side="super"]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.basis-btn[data-side="super"]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      superBasis = btn.dataset.basis;
      renderHist('hist-super', 0, 0, 'superpos');
    });
  });
  document.querySelectorAll('.basis-btn[data-side="mix"]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.basis-btn[data-side="mix"]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      mixBasis = btn.dataset.basis;
      renderHist('hist-mix', 0, 0, 'mixture');
    });
  });
  document.getElementById('run-super-200').addEventListener('click', runSuper);
  document.getElementById('run-mix-200').addEventListener('click', runMix);

  // Initial empty histograms
  renderHist('hist-super', 0, 0, 'superpos');
  renderHist('hist-mix', 0, 0, 'mixture');
})();

/* ---- T3 Step 2: populations / coherences — animated decoherence ---- */
(function initT3Step2CoherenceAnim() {
  const blochSvg = document.getElementById('t3-coh-anim-bloch');
  const graphSvg = document.getElementById('t3-coh-anim-graph');
  const readout = document.getElementById('t3-coh-anim-readout');
  const scrub = document.getElementById('t3-coh-scrub');
  const playBtn = document.getElementById('t3-coh-play');
  const resetBtn = document.getElementById('t3-coh-reset');
  if (!blochSvg || !graphSvg || !scrub) return;

  let animId = null;
  let doneCriteria = false;

  function coherenceAtPhase(u) {
    return 0.5 * Math.exp(-4 * Math.max(0, Math.min(1, u)));
  }

  function tryMarkDone(u, fromPlay) {
    if (doneCriteria) return;
    const scrubNearEnd = parseInt(scrub.value, 10) >= 975;
    if (u >= 0.97 || scrubNearEnd || fromPlay) {
      doneCriteria = true;
      markDone('t3-2');
    }
  }

  function draw(u) {
    u = Math.max(0, Math.min(1, u));
    const rho01 = coherenceAtPhase(u);
    const bx = 2 * rho01;

    const ns = 'http://www.w3.org/2000/svg';
    const cx = 80, cy = 80, R = 52;
    blochSvg.innerHTML = '';
    function bel(tag, a, t) {
      const e = document.createElementNS(ns, tag);
      for (const [k, v] of Object.entries(a)) e.setAttribute(k, v);
      if (t !== undefined) e.textContent = t;
      return e;
    }
    blochSvg.appendChild(bel('ellipse', { cx, cy, rx: R, ry: R, fill: 'none', stroke: 'var(--line-bright)', 'stroke-width': 1 }));
    blochSvg.appendChild(bel('ellipse', { cx, cy, rx: R, ry: 15, fill: 'none', stroke: 'var(--line)', 'stroke-width': 0.6, 'stroke-dasharray': '2 2', opacity: 0.85 }));
    blochSvg.appendChild(bel('text', { x: cx - 12, y: cy - R - 6, 'font-family': 'var(--mono)', 'font-size': 9, fill: 'var(--ink-faint)' }, '|0⟩'));
    blochSvg.appendChild(bel('text', { x: cx - 12, y: cy + R + 16, 'font-family': 'var(--mono)', 'font-size': 9, fill: 'var(--ink-faint)' }, '|1⟩'));
    const tipX = cx + R * 0.9 * bx;
    const tipY = cy;
    blochSvg.appendChild(bel('line', { x1: cx, y1: cy, x2: tipX, y2: tipY, stroke: 'var(--amber)', 'stroke-width': 2.4, 'stroke-linecap': 'round' }));
    blochSvg.appendChild(bel('circle', { cx: tipX, cy: tipY, r: 4, fill: 'var(--amber)' }));
    blochSvg.appendChild(bel('circle', { cx, cy, r: 2, fill: 'var(--ink-faint)' }));

    const W = 260, H = 130, pl = 40, pr = 10, pt = 16, pb = 26;
    const gw = W - pl - pr, gh = H - pt - pb;
    graphSvg.innerHTML = '';
    function gel(tag, a, t) {
      const e = document.createElementNS(ns, tag);
      for (const [k, v] of Object.entries(a)) e.setAttribute(k, v);
      if (t !== undefined) e.textContent = t;
      return e;
    }
    const x0 = pl, y0 = H - pb, x1 = pl + gw, y1 = pt;
    graphSvg.appendChild(gel('line', { x1: x0, y1: y0, x2: x1, y2: y0, stroke: 'var(--line)', 'stroke-width': 1 }));
    graphSvg.appendChild(gel('line', { x1: x0, y1: y0, x2: x0, y2: y1, stroke: 'var(--line)', 'stroke-width': 1 }));
    graphSvg.appendChild(gel('text', { x: x1 - 4, y: y0 + 18, 'font-family': 'var(--mono)', 'font-size': 8, fill: 'var(--ink-faint)', 'text-anchor': 'end' }, 'time →'));
    graphSvg.appendChild(gel('text', { x: 8, y: y1 + 3, 'font-family': 'var(--mono)', 'font-size': 8, fill: 'var(--ink-faint)' }, '|ρ01|'));

    let d = '';
    const n = 40;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const c = coherenceAtPhase(t);
      const px = x0 + t * gw;
      const py = y0 - (c / 0.5) * gh;
      d += (i === 0 ? 'M ' : ' L ') + px + ' ' + py;
    }
    graphSvg.appendChild(gel('path', { d, fill: 'none', stroke: 'var(--mint)', 'stroke-width': 1.8, 'stroke-linecap': 'round' }));
    const pxu = x0 + u * gw;
    const pyu = y0 - (rho01 / 0.5) * gh;
    graphSvg.appendChild(gel('circle', { cx: pxu, cy: pyu, r: 5, fill: 'var(--amber)', stroke: 'var(--bg-1)', 'stroke-width': 1 }));

    if (readout) {
      readout.innerHTML = `ρ<sub>00</sub>=ρ<sub>11</sub>=0.500 · |ρ<sub>01</sub>|=${rho01.toFixed(3)} <span style="color:var(--ink-faint)">(coherence decays; populations fixed)</span>`;
    }

    tryMarkDone(u, false);
  }

  function setFromScrub() {
    draw(parseInt(scrub.value, 10) / 1000);
  }

  scrub.addEventListener('input', () => {
    if (animId) { cancelAnimationFrame(animId); animId = null; }
    setFromScrub();
  });

  if (playBtn) {
    playBtn.addEventListener('click', () => {
      if (animId) cancelAnimationFrame(animId);
      const start = performance.now();
      const dur = 3400;
      function tick(now) {
        const w = Math.min(1, (now - start) / dur);
        scrub.value = String(Math.round(w * 1000));
        draw(w);
        if (w < 1) animId = requestAnimationFrame(tick);
        else {
          animId = null;
          tryMarkDone(1, true);
        }
      }
      animId = requestAnimationFrame(tick);
    });
  }
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (animId) cancelAnimationFrame(animId);
      animId = null;
      scrub.value = '0';
      draw(0);
    });
  }

  scrub.value = '0';
  draw(0);
})();

/* ---- T3 Step 3: statistical mixture toy only ---- */
(function initT3Step3MixtureOnly() {
  const mixSlider = document.getElementById('t3-mix-p-slider');
  const mixValEl = document.getElementById('t3-mix-p-val');
  if (!mixSlider) return;

  function updateMixtureVis() {
    const p = parseInt(mixSlider.value, 10) / 100;
    if (mixValEl) mixValEl.textContent = String(Math.round(p * 100));
    render2x2DM('t3-mix-dm', p, 0, 0, 1 - p, { colorClass: 'mixture' });
    const vis = document.getElementById('t3-mix-ensemble-vis');
    if (vis) {
      const h0 = Math.max(10, p * 110);
      const h1 = Math.max(10, (1 - p) * 110);
      vis.innerHTML = `
        <div style="display:flex;gap:18px;align-items:flex-end;min-height:120px;padding:8px 4px 0;font-family:var(--mono);font-size:10px;color:var(--ink-dim)">
          <div style="flex:1;text-align:center">
            <div style="height:${h0}px;background:var(--cyan);border-radius:4px 4px 0 0;transition:height 0.15s;opacity:0.92"></div>
            <div style="margin-top:8px;font-family:var(--serif);font-style:italic">|0⟩</div>
            <div style="color:var(--mint)">${(p * 100).toFixed(0)}%</div>
          </div>
          <div style="flex:1;text-align:center">
            <div style="height:${h1}px;background:var(--magenta);border-radius:4px 4px 0 0;transition:height 0.15s;opacity:0.92"></div>
            <div style="margin-top:8px;font-family:var(--serif);font-style:italic">|1⟩</div>
            <div style="color:var(--mint)">${((1 - p) * 100).toFixed(0)}%</div>
          </div>
        </div>`;
    }
    const note = document.getElementById('t3-mix-compare-note');
    if (note) {
      if (Math.abs(p - 0.5) < 0.02) {
        note.innerHTML = '<b style="color:var(--mint)">Same Z populations as |+⟩</b> — but this ρ is a <b>classical mixture</b>: strictly diagonal. Step&nbsp;4 shows a <em>pure</em> |+⟩ with the same diagonal but nonzero coherences — a different state.';
      } else if (p < 0.04) {
        note.textContent = 'Ensemble is almost entirely |1⟩ — still a classical mixture (no coherences), not a superposition.';
      } else if (p > 0.96) {
        note.textContent = 'Ensemble is almost entirely |0⟩ — same structure: diagonal ρ only.';
      } else {
        note.textContent = 'Asymmetric classical lottery: populations reflect p, coherences stay exactly zero.';
      }
    }
  }

  mixSlider.addEventListener('input', () => {
    updateMixtureVis();
    markDone('t3-3');
  });
  updateMixtureVis();
})();

/* ---- T3 Step 4: general ρ — coherence erasure slider ---- */
(function initT3Step4GeneralDensity() {
  const slider = document.getElementById('t3-decohere-slider');
  const valEl = document.getElementById('t3-decohere-val');
  if (!slider || !valEl) return;
  let crossedThreshold = false, crossedFull = false;

  function checkStepDone() {
    if (crossedThreshold && crossedFull) markDone('t3-4');
  }

  function update() {
    const t = parseInt(slider.value, 10) / 100;
    valEl.textContent = Math.round(t * 100) + '%';

    const offdiag = 0.5 * (1 - t);
    render2x2DM('t3-dm-live', 0.5, offdiag, 0, 0.5);

    const purity = 0.5 * 0.5 + 0.5 * 0.5 + 2 * offdiag * offdiag;

    const purEl = document.getElementById('t3-dm-purity');
    if (purEl) purEl.innerHTML = `\\(\\mathrm{Tr}(\\rho)=1.000\\)  ·  \\(\\mathrm{Tr}(\\rho^2)=${purity.toFixed(3)}\\)  ·  ${purity > 0.99 ? 'pure (rank 1)' : purity < 0.51 ? 'maximally mixed qubit' : 'partially mixed'}`;

    const expEl = document.getElementById('t3-dm-explain');
    if (expEl) {
      const contrast = '<b style="color:var(--amber)">vs Step&nbsp;3.</b> The classical ensemble there used <b>only diagonal</b> ρ (weighted |0⟩⟨0| and |1⟩⟨1|). Here we start from <b>one</b> rank-1 pure state |+⟩⟨+| with off-diagonals ±½, then <em>erase</em> coherence until the matrix matches the <b>same ½,½ diagonal</b> as the p&nbsp;=&nbsp;½ mixture — <b>same entries, different meaning</b>: superposition path vs classical lottery.';
      const diagNote = 'Diagonal entries stay 0.500, 0.500 = Z populations unchanged.';
      const offNote = offdiag > 0.45
        ? 'Off-diagonals ≈ 0.500 — full quantum coherence (pure |+⟩).'
        : offdiag > 0.1
          ? `Off-diagonals ≈ ${offdiag.toFixed(3)} — coherence partly lost.`
          : 'Off-diagonals ≈ 0 — matches Step&nbsp;3’s maximally mixed <b>diagonal</b>, but you arrived via dephasing a superposition, not a classical coin.';
      expEl.innerHTML = `${contrast}<br><br><b style="color:var(--mint)">Populations fixed.</b> ${diagNote}<br><br><b style="color:var(--cyan)">Coherences ${offdiag > 0.45 ? 'intact' : offdiag < 0.05 ? 'gone' : 'decaying'}.</b><br>${offNote}`;
    }

    if (t >= 0.3) crossedThreshold = true;
    if (t >= 0.99) crossedFull = true;
    checkStepDone();
  }

  slider.addEventListener('input', update);
  update();
})();

/* ---- T3 Step 5: coherence explorer ---- */
(function initT3Step5CoherenceExplorer() {
  const states = {
    pure_plus:  { rho00: 0.5, r01re: 0.5,  r01im: 0,    rho11: 0.5, z0: 0.5,  z1: 0.5,  x0: 1.0,  x1: 0.0  },
    pure_minus: { rho00: 0.5, r01re:-0.5,  r01im: 0,    rho11: 0.5, z0: 0.5,  z1: 0.5,  x0: 0.0,  x1: 1.0  },
    mixture:    { rho00: 0.5, r01re: 0,    r01im: 0,    rho11: 0.5, z0: 0.5,  z1: 0.5,  x0: 0.5,  x1: 0.5  },
    partial:    { rho00: 0.5, r01re: 0.25, r01im: 0,    rho11: 0.5, z0: 0.5,  z1: 0.5,  x0: 0.75, x1: 0.25 }
  };
  let cur = 'pure_plus';
  const seenBases = new Set();

  function updateCoherence(name) {
    cur = name;
    document.querySelectorAll('.coherence-state-btn').forEach(b => b.classList.toggle('active', b.dataset.cstate === name));
    const s = states[name];
    render2x2DM('coherence-dm', s.rho00, s.r01re, s.r01im, s.rho11);
    renderHist('coherence-z-hist', 0, 0, 'neutral');
    renderHist('coherence-x-hist', 0, 0, 'neutral');
  }

  document.querySelectorAll('.coherence-state-btn').forEach(btn => {
    btn.addEventListener('click', () => updateCoherence(btn.dataset.cstate));
  });

  const zRun = document.getElementById('coherence-z-run');
  const xRun = document.getElementById('coherence-x-run');
  if (zRun) zRun.addEventListener('click', () => {
    const s = states[cur];
    const jitter = () => (Math.random()-0.5)*0.04;
    renderHist('coherence-z-hist', Math.min(1,Math.max(0,s.z0+jitter())), Math.min(1,Math.max(0,s.z1+jitter())), 'neutral');
    seenBases.add(cur + '-Z');
    if (seenBases.size >= 6) markDone('t3-5');
  });

  if (xRun) xRun.addEventListener('click', () => {
    const s = states[cur];
    const jitter = () => (Math.random()-0.5)*0.04;
    renderHist('coherence-x-hist', Math.min(1,Math.max(0,s.x0+jitter())), Math.min(1,Math.max(0,s.x1+jitter())), 'neutral');
    seenBases.add(cur + '-X');
    if (seenBases.size >= 6) markDone('t3-5');
  });

  updateCoherence('pure_plus');
})();

/* ---- T3 Step 6: Bloch ball + purity strip ---- */
(function initT3Step6BlochPurity() {
  const slider = document.getElementById('bloch-ball-slider');
  const valEl = document.getElementById('bloch-ball-decohere-val');
  const playBtn = document.getElementById('t3-bloch-play');
  const resetBtn = document.getElementById('t3-bloch-reset');
  if (!slider || !valEl) return;
  let animFrame = null;

  function drawBlochBall(t) {
    // t=0: pure |+> on equator surface; t=1: centre (maximally mixed)
    // Bloch vector for |+>: (1,0,0). Scale by (1-t).
    const bx = (1 - t), by = 0, bz = 0;
    const blochLen = 1 - t;
    const purity = 0.5 + 0.5 * blochLen * blochLen;   // Tr(rho^2) = (1+r^2)/2

    const W = 280, H = 280, R = 110, cx = W/2, cy = H/2;
    // Simple orthographic with slight perspective tilt
    const camX = -0.2, camY = 0.4;

    function proj(x, y, z) {
      let y1 = y*Math.cos(camX) - z*Math.sin(camX);
      let z1 = y*Math.sin(camX) + z*Math.cos(camX);
      let x2 = x*Math.cos(camY) + z1*Math.sin(camY);
      let z2 = -x*Math.sin(camY) + z1*Math.cos(camY);
      let y2 = y1;
      return { sx: x2, sy: -y2, depth: z2 };
    }

    // Equator and meridian paths
    const nPts = 64;
    function circlePts(fn) {
      return Array.from({length: nPts+1}, (_,i) => {
        const a = (i/nPts)*2*Math.PI;
        return proj(...fn(a));
      });
    }
    const eq  = circlePts(a => [Math.cos(a), Math.sin(a), 0]);
    const mer = circlePts(a => [Math.sin(a), 0, Math.cos(a)]);

    function pathFor(pts, front) {
      let segs = [], cur = [];
      pts.forEach(p => {
        if ((p.depth >= 0) === front) { cur.push(p); }
        else { if (cur.length) segs.push(cur); cur = []; }
      });
      if (cur.length) segs.push(cur);
      return segs.map(s => 'M ' + s.map(p => `${cx+p.sx*R} ${cy+p.sy*R}`).join(' L ')).join(' ');
    }

    // Project the Bloch vector endpoint
    const vp = proj(bx, by, bz);
    const vsx = cx + vp.sx*R, vsy = cy + vp.sy*R;

    // Color the vector: amber at surface, fade to red at centre
    const alpha = 0.4 + (1-t)*0.6;

    const uid = 'bb-' + Math.random().toString(36).slice(2, 8);
    const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${cx}" cy="${cy}" r="${R}" fill="var(--bg-0)" stroke="var(--line)" stroke-width="1"/>
      <circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#${uid}-glow)" opacity="0.3"/>
      <defs>
        <radialGradient id="${uid}-glow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="var(--mint)" stop-opacity="0.1"/>
          <stop offset="100%" stop-color="var(--mint)" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <path d="${pathFor(eq,false)}" stroke="var(--line-bright)" stroke-width="1" fill="none" stroke-dasharray="2 3" opacity="0.5"/>
      <path d="${pathFor(mer,false)}" stroke="var(--line-bright)" stroke-width="1" fill="none" stroke-dasharray="2 3" opacity="0.5"/>
      <path d="${pathFor(eq,true)}" stroke="var(--mint)" stroke-width="1.2" fill="none" opacity="0.35"/>
      <path d="${pathFor(mer,true)}" stroke="var(--line-bright)" stroke-width="1" fill="none"/>
      <text x="${cx + R + 6}" y="${cy + 4}" fill="var(--ink-faint)" font-family="var(--mono)" font-size="9">|r|=${blochLen.toFixed(2)} (surface=1)</text>
      <text x="${cx}" y="${cy-R-8}" fill="var(--mint)" font-family="var(--mono)" font-size="11" text-anchor="middle">|0⟩</text>
      <text x="${cx}" y="${cy+R+16}" fill="var(--mint)" font-family="var(--mono)" font-size="11" text-anchor="middle">|1⟩</text>
      <line x1="${cx}" y1="${cy}" x2="${vsx}" y2="${vsy}"
            stroke="var(--amber)" stroke-width="${2.5*(0.3+0.7*(1-t))}" stroke-linecap="round" opacity="${alpha}"/>
      <circle cx="${vsx}" cy="${vsy}" r="${3 + blochLen*6}" fill="var(--amber)" opacity="${alpha}"/>
      ${blochLen < 0.05 ? `<circle cx="${cx}" cy="${cy}" r="5" fill="var(--red)" opacity="0.9"/>
        <text x="${cx+8}" y="${cy-6}" fill="var(--red)" font-family="var(--mono)" font-size="10">r→0</text>` : ''}
      <circle cx="${cx}" cy="${cy}" r="2" fill="var(--ink-faint)"/>
    </svg>`;

    const host = document.getElementById('bloch-ball-svg');
    if (host) host.innerHTML = svg;

    const purityNorm = Math.max(0, Math.min(1, 2 * purity - 1));
    const barEl = document.getElementById('t3-purity-bar-fill');
    if (barEl) barEl.style.transform = `scaleX(${Math.max(0.02, purityNorm)})`;

    const readEl = document.getElementById('bloch-ball-readout');
    if (readEl) readEl.innerHTML = `
      <div><span style="color:var(--ink-faint)">|r| = </span><span style="color:var(--amber)">${blochLen.toFixed(3)}</span>
        <span style="color:var(--ink-faint)"> · </span><span style="color:var(--ink-faint)">qubit purity </span><span style="color:var(--mint)">P = (1+|r|²)/2 = ${purity.toFixed(3)}</span></div>
      <div><span style="color:var(--ink-faint)">Region: </span>${blochLen > 0.98 ? '<span style="color:var(--mint)">on the sphere (pure)</span>' : blochLen < 0.02 ? '<span style="color:var(--red)">origin (maximally mixed)</span>' : '<span style="color:var(--amber)">inside the ball (mixed)</span>'}</div>
      <div style="margin-top:8px;font-size:10px;color:var(--ink-faint)">The strip above is the same P: amber ← mixed, mint ← pure.</div>`;
  }

  slider.addEventListener('input', () => {
    const t = parseInt(slider.value, 10) / 100;
    valEl.textContent = Math.round(t * 100) + '%';
    drawBlochBall(t);
    if (t >= 0.99) markDone('t3-6');
  });

  if (playBtn) {
    playBtn.addEventListener('click', () => {
      if (animFrame) cancelAnimationFrame(animFrame);
      const start = performance.now();
      const durationMs = 1800;
      function tick(now) {
        const u = Math.min(1, (now - start) / durationMs);
        const t = u;
        slider.value = String(Math.round(t * 100));
        valEl.textContent = Math.round(t * 100) + '%';
        drawBlochBall(t);
        if (u < 1) animFrame = requestAnimationFrame(tick);
        else {
          markDone('t3-6');
          animFrame = null;
        }
      }
      animFrame = requestAnimationFrame(tick);
    });
  }
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (animFrame) cancelAnimationFrame(animFrame);
      animFrame = null;
      slider.value = '0';
      valEl.textContent = '0%';
      drawBlochBall(0);
    });
  }

  const cardWrap = document.querySelector('[data-step="t3-7"]');
  if (cardWrap) {
    const obs = new MutationObserver(() => {
      if (!cardWrap.classList.contains('locked')) { markDone('t3-7'); obs.disconnect(); }
    });
    obs.observe(cardWrap, { attributes: true, attributeFilter: ['class'] });
  }

  drawBlochBall(0);
})();


/* =========================================================================
   ROTATION ANGLE SLIDER
   ========================================================================= */
(function initRotSlider() {
  const slider = document.getElementById('rot-angle-slider');
  const valEl  = document.getElementById('rot-angle-val');
  if (!slider) return;
  slider.addEventListener('input', () => {
    rotAngleDeg = parseInt(slider.value);
    if (valEl) valEl.textContent = rotAngleDeg + '°';
  });
})();
