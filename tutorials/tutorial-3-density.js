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

  const diagBg0 = `rgba(127,255,196,${0.05 + rho00 * 0.35})`;
  const diagBg1 = `rgba(127,255,196,${0.05 + rho11 * 0.35})`;
  const offBg   = offZero ? 'var(--bg-2)' : `rgba(111,212,224,${0.08 + offAmt * 0.4})`;

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

/* ---- T3 Step 2: decoherence slider on live 2×2 ρ ---- */
(function initT3Step2() {
  const slider = document.getElementById('t3-decohere-slider');
  const valEl  = document.getElementById('t3-decohere-val');
  let crossedThreshold = false, crossedFull = false;

  function update() {
    const t = parseInt(slider.value) / 100;   // 0 = pure |+>, 1 = mixture
    valEl.textContent = Math.round(t*100) + '%';

    // Interpolate: pure |+> has rho=[[0.5,0.5],[0.5,0.5]]
    //              mixture has rho=[[0.5,0],[0,0.5]]
    const offdiag = 0.5 * (1 - t);
    render2x2DM('t3-dm-live', 0.5, offdiag, 0, 0.5);

    // Purity = Tr(rho^2) = rho00^2 + rho11^2 + 2*|rho01|^2
    const purity = 0.5*0.5 + 0.5*0.5 + 2*offdiag*offdiag;

    const purEl = document.getElementById('t3-dm-purity');
    if (purEl) purEl.innerHTML = `\\(\\mathrm{Tr}(\\rho)=1.000\\)  ·  \\(\\mathrm{Tr}(\\rho^2)=${purity.toFixed(3)}\\)  ·  ${purity > 0.99 ? 'pure state' : purity < 0.51 ? 'maximally mixed' : 'partially mixed'}`;

    const expEl = document.getElementById('t3-dm-explain');
    if (expEl) {
      const diagNote = 'Diagonal entries (0.500, 0.500) = populations. Measuring in Z-basis gives 50% |0⟩, 50% |1⟩. These never change as decoherence increases.';
      const offNote = offdiag > 0.45
        ? 'Off-diagonals ≈ 0.500 — full coherence. X-basis measurement always gives |0⟩. This is the quantum superposition signature.'
        : offdiag > 0.1
          ? `Off-diagonals ≈ ${offdiag.toFixed(3)} — partially decohered. X-basis now shows some randomness.`
          : 'Off-diagonals ≈ 0 — no coherence left. Indistinguishable from a classical coin flip in any measurement basis.';
      expEl.innerHTML = `<b style="color:var(--phos)">Populations unchanged.</b><br>${diagNote}<br><br><b style="color:var(--cyan)">Coherences ${offdiag > 0.45 ? 'intact' : offdiag < 0.05 ? 'gone' : 'decaying'}.</b><br>${offNote}`;
    }

    if (t >= 0.3) crossedThreshold = true;
    if (t >= 0.99) crossedFull = true;
    if (crossedThreshold && crossedFull) markDone('t3-2');
  }

  slider.addEventListener('input', update);
  update();
})();

/* ---- T3 Step 3: coherence explorer ---- */
(function initT3Step3() {
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

  document.getElementById('coherence-z-run').addEventListener('click', () => {
    const s = states[cur];
    const jitter = () => (Math.random()-0.5)*0.04;
    renderHist('coherence-z-hist', Math.min(1,Math.max(0,s.z0+jitter())), Math.min(1,Math.max(0,s.z1+jitter())), 'neutral');
    seenBases.add(cur + '-Z');
    if (seenBases.size >= 6) markDone('t3-3');
  });

  document.getElementById('coherence-x-run').addEventListener('click', () => {
    const s = states[cur];
    const jitter = () => (Math.random()-0.5)*0.04;
    renderHist('coherence-x-hist', Math.min(1,Math.max(0,s.x0+jitter())), Math.min(1,Math.max(0,s.x1+jitter())), 'neutral');
    seenBases.add(cur + '-X');
    if (seenBases.size >= 6) markDone('t3-3');
  });

  updateCoherence('pure_plus');
})();

/* ---- T3 Step 4: Bloch ball ---- */
(function initT3Step4() {
  const slider = document.getElementById('bloch-ball-slider');
  const valEl  = document.getElementById('bloch-ball-decohere-val');
  let reachedFull = false;

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

    const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${cx}" cy="${cy}" r="${R}" fill="var(--bg-0)" stroke="var(--line)" stroke-width="1"/>
      <circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#bb-glow)" opacity="0.3"/>
      <defs>
        <radialGradient id="bb-glow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="rgba(127,255,196,0.1)"/>
          <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
        </radialGradient>
      </defs>
      <path d="${pathFor(eq,false)}" stroke="var(--line-bright)" stroke-width="1" fill="none" stroke-dasharray="2 3" opacity="0.5"/>
      <path d="${pathFor(mer,false)}" stroke="var(--line-bright)" stroke-width="1" fill="none" stroke-dasharray="2 3" opacity="0.5"/>
      <path d="${pathFor(eq,true)}" stroke="var(--line-bright)" stroke-width="1" fill="none"/>
      <path d="${pathFor(mer,true)}" stroke="var(--line-bright)" stroke-width="1" fill="none"/>
      <!-- pole labels -->
      <text x="${cx}" y="${cy-R-8}" fill="var(--phos)" font-family="var(--mono)" font-size="11" text-anchor="middle">|0⟩</text>
      <text x="${cx}" y="${cy+R+16}" fill="var(--phos)" font-family="var(--mono)" font-size="11" text-anchor="middle">|1⟩</text>
      <!-- Bloch vector -->
      <line x1="${cx}" y1="${cy}" x2="${vsx}" y2="${vsy}"
            stroke="var(--amber)" stroke-width="${2.5*(0.3+0.7*(1-t))}" stroke-linecap="round" opacity="${alpha}"/>
      <!-- vector endpoint: circle size shrinks with purity -->
      <circle cx="${vsx}" cy="${vsy}" r="${3 + blochLen*6}" fill="var(--amber)" opacity="${alpha}"/>
      ${blochLen < 0.05 ? `<circle cx="${cx}" cy="${cy}" r="5" fill="var(--red)" opacity="0.9"/>
        <text x="${cx+8}" y="${cy-6}" fill="var(--red)" font-family="var(--mono)" font-size="10">centre</text>` : ''}
      <circle cx="${cx}" cy="${cy}" r="2" fill="var(--ink-faint)"/>
    </svg>`;

    const host = document.getElementById('bloch-ball-svg');
    if (host) host.innerHTML = svg;

    const readEl = document.getElementById('bloch-ball-readout');
    if (readEl) readEl.innerHTML = `
      <div><span style="color:var(--ink-faint)">Bloch vector r = </span><span style="color:var(--amber)">${blochLen.toFixed(3)}</span></div>
      <div><span style="color:var(--ink-faint)">\\(\\mathrm{Tr}(\\rho^2)=\\)</span><span style="color:var(--phos)">${purity.toFixed(3)}</span></div>
      <div><span style="color:var(--ink-faint)">State type: </span>${blochLen > 0.98 ? '<span style="color:var(--phos)">pure (surface)</span>' : blochLen < 0.02 ? '<span style="color:var(--red)">maximally mixed (centre)</span>' : '<span style="color:var(--amber)">mixed (interior)</span>'}</div>
      <div style="margin-top:8px;font-size:10px;color:var(--ink-faint)">T₂ decay moves the vector from surface → centre</div>`;
  }

  slider.addEventListener('input', () => {
    const t = parseInt(slider.value)/100;
    valEl.textContent = Math.round(t*100) + '%';
    drawBlochBall(t);
    if (t >= 0.99) { reachedFull = true; markDone('t3-4'); }
  });

  // T3-5 auto-done on unlock
  const card5 = document.querySelector('[data-step="t3-5"]');
  if (card5) {
    const obs = new MutationObserver(() => {
      if (!card5.classList.contains('locked')) { markDone('t3-5'); obs.disconnect(); }
    });
    obs.observe(card5, { attributes: true, attributeFilter: ['class'] });
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
