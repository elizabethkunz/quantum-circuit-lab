/* =========================================================================
   STEP 1 — classical bit switch
   ========================================================================= */
(function initStep1() {
  const sw = document.getElementById('bit-switch');
  const val = document.getElementById('bit-value');
  let state = 0, flips = 0;
  sw.addEventListener('click', () => {
    state = 1 - state;
    val.textContent = state;
    sw.classList.toggle('on', state === 1);
    flips++;
    if (flips >= 2) markDone('t1-1');
  });
})();

/* =========================================================================
   BLOCH SPHERE — shared component
   ========================================================================= */
const blochInstances = {};

function createBloch(hostId, readoutId, options = {}) {
  const host = document.getElementById(hostId);
  if (!host) return null;

  // Qubit state: α|0⟩ + β|1⟩, stored as complex amplitudes.
  // Initial state = |0⟩ → α=1, β=0.
  let alpha = { re: 1, im: 0 };
  let beta  = { re: 0, im: 0 };

  // Camera rotation (viewer angles around x and y axes)
  let camRotX = -0.2;  // slight tilt down
  let camRotY = 0.4;   // slight turn

  // Derive Bloch-sphere coordinates (x,y,z) from (α,β).
  // Using the mixed-state-free pure-state formula:
  //   x = 2 Re(α* β),  y = 2 Im(α* β),  z = |α|² - |β|²
  function currentVec() {
    // α*β
    const aStarB_re =  alpha.re * beta.re + alpha.im * beta.im;
    const aStarB_im =  alpha.re * beta.im - alpha.im * beta.re;
    const x = 2 * aStarB_re;
    const y = 2 * aStarB_im;
    const z = (alpha.re*alpha.re + alpha.im*alpha.im)
            - (beta.re*beta.re  + beta.im*beta.im);
    return { x, y, z };
  }

  // Apply a 2x2 gate matrix to (α, β)
  function applyGate(g) {
    const newA = Cadd(Cmul(g[0][0], alpha), Cmul(g[0][1], beta));
    const newB = Cadd(Cmul(g[1][0], alpha), Cmul(g[1][1], beta));
    alpha = newA;
    beta = newB;
    draw();
    return { alpha, beta };
  }
  function Cmul(a,b) { return { re: a.re*b.re - a.im*b.im, im: a.re*b.im + a.im*b.re }; }
  function Cadd(a,b) { return { re: a.re+b.re, im: a.im+b.im }; }

  // Set to a named preset state
  function setPreset(name) {
    const S2 = 1/Math.SQRT2;
    switch(name) {
      case '0':  alpha = {re:1,im:0};  beta = {re:0,im:0}; break;
      case '1':  alpha = {re:0,im:0};  beta = {re:1,im:0}; break;
      case '+':  alpha = {re:S2,im:0}; beta = {re:S2,im:0}; break;
      case '-':  alpha = {re:S2,im:0}; beta = {re:-S2,im:0}; break;
      case '+i': alpha = {re:S2,im:0}; beta = {re:0,im:S2}; break;
      case '-i': alpha = {re:S2,im:0}; beta = {re:0,im:-S2}; break;
    }
    draw();
  }

  function reset() {
    alpha = {re:1,im:0}; beta = {re:0,im:0};
    draw();
  }

  // Project 3D (x,y,z) on the unit sphere to 2D SVG coordinates using current camera.
  // x-axis rotation first (pitch), then y-axis rotation (yaw).
  function project(x, y, z) {
    // Rotate around x-axis (tilt)
    let y1 = y * Math.cos(camRotX) - z * Math.sin(camRotX);
    let z1 = y * Math.sin(camRotX) + z * Math.cos(camRotX);
    let x1 = x;
    // Rotate around y-axis (turn)
    let x2 = x1 * Math.cos(camRotY) + z1 * Math.sin(camRotY);
    let z2 = -x1 * Math.sin(camRotY) + z1 * Math.cos(camRotY);
    let y2 = y1;
    // Orthographic: just drop z2 for screen coords
    return { sx: x2, sy: -y2, depth: z2 };  // depth>0 → in front
  }

  // Identify which named state we're closest to (for readout)
  function nearestState() {
    const v = currentVec();
    const states = {
      '|0⟩':  { x:0, y:0, z:1 },
      '|1⟩':  { x:0, y:0, z:-1 },
      '|+⟩':  { x:1, y:0, z:0 },
      '|−⟩':  { x:-1, y:0, z:0 },
      '|+i⟩': { x:0, y:1, z:0 },
      '|−i⟩': { x:0, y:-1, z:0 },
    };
    let best = null, bestDist = Infinity;
    for (const k in states) {
      const s = states[k];
      const d = (v.x-s.x)**2 + (v.y-s.y)**2 + (v.z-s.z)**2;
      if (d < bestDist) { bestDist = d; best = k; }
    }
    return { name: best, dist: Math.sqrt(bestDist) };
  }

  // Measurement probabilities  P(|0⟩) = |α|²,  P(|1⟩) = |β|²
  function measureProbs() {
    return {
      p0: alpha.re*alpha.re + alpha.im*alpha.im,
      p1: beta.re*beta.re + beta.im*beta.im
    };
  }

  function fmtC(c) {
    const r = Math.abs(c.re) < 1e-9 ? 0 : c.re;
    const i = Math.abs(c.im) < 1e-9 ? 0 : c.im;
    if (i === 0) return r.toFixed(3);
    if (r === 0) return `${i.toFixed(3)}i`;
    return `${r.toFixed(3)}${i>=0?'+':'−'}${Math.abs(i).toFixed(3)}i`;
  }

  // Draw the Bloch sphere SVG
  function draw() {
    const W = 320, H = 320, R = 120;
    const cx = W/2, cy = H/2;
    const v = currentVec();

    // Key points to draw: axis endpoints
    const axes = [
      { name:'|0⟩', x:0, y:0, z:1,  color:'var(--cyan)',    isPole:true },
      { name:'|1⟩', x:0, y:0, z:-1, color:'var(--mint)',    isPole:true },
      { name:'|+⟩', x:1, y:0, z:0,  color:'var(--cyan)',    isPole:false },
      { name:'|−⟩', x:-1,y:0, z:0,  color:'var(--cyan)',    isPole:false },
      { name:'|+i⟩',x:0, y:1, z:0,  color:'var(--magenta)', isPole:false },
      { name:'|−i⟩',x:0, y:-1,z:0,  color:'var(--magenta)', isPole:false },
    ];

    // Project axis endpoints
    const pAxes = axes.map(a => ({ ...a, p: project(a.x, a.y, a.z) }));

    // Equator circle points (project many and connect)
    const equator = [];
    for (let i = 0; i <= 64; i++) {
      const t = (i/64) * 2*Math.PI;
      equator.push(project(Math.cos(t), Math.sin(t), 0));
    }
    // Meridian (x-z) circle
    const meridianXZ = [];
    for (let i = 0; i <= 64; i++) {
      const t = (i/64) * 2*Math.PI;
      meridianXZ.push(project(Math.sin(t), 0, Math.cos(t)));
    }

    // Build path strings with front/back distinction
    function pathForCircle(points) {
      // Split into front (depth >= 0) and back (depth < 0) segments
      const front = []; const back = [];
      let curF = []; let curB = [];
      for (const p of points) {
        if (p.depth >= 0) {
          if (curB.length) { back.push(curB); curB = []; }
          curF.push(p);
        } else {
          if (curF.length) { front.push(curF); curF = []; }
          curB.push(p);
        }
      }
      if (curF.length) front.push(curF);
      if (curB.length) back.push(curB);
      const toPath = (segs) => segs.map(seg => 'M ' + seg.map(p => `${cx + p.sx*R} ${cy + p.sy*R}`).join(' L ')).join(' ');
      return { front: toPath(front), back: toPath(back) };
    }

    const eqPath = pathForCircle(equator);
    const mePath = pathForCircle(meridianXZ);

    // State vector endpoint
    const vp = project(v.x, v.y, v.z);
    const vx = cx + vp.sx * R;
    const vy = cy + vp.sy * R;
    const stateInFront = vp.depth >= 0;

    // Arrow color based on proximity to |0> or |1>
    const arrowColor = 'var(--mint)';

    let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <!-- back hemisphere glow -->
      <circle cx="${cx}" cy="${cy}" r="${R}" fill="var(--bg-0)" stroke="var(--line)" stroke-width="1" />
      <circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#bloch-glow-${hostId})" opacity="0.35" />
      <defs>
        <radialGradient id="bloch-glow-${hostId}" cx="50%" cy="40%" r="60%">
          <stop offset="0%" style="stop-color: var(--mint); stop-opacity: 0.1" />
          <stop offset="100%" stop-color="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>

      <!-- back equator & meridian (dashed/dim) -->
      <path d="${eqPath.back}" stroke="var(--line-bright)" stroke-width="1" fill="none" stroke-dasharray="2 3" opacity="0.5" />
      <path d="${mePath.back}" stroke="var(--line-bright)" stroke-width="1" fill="none" stroke-dasharray="2 3" opacity="0.5" />`;

    // Back-hemisphere axis labels (dim)
    pAxes.filter(a => a.p.depth < 0).forEach(a => {
      const ax = cx + a.p.sx * R;
      const ay = cy + a.p.sy * R;
      const off = labelOffset(a, a.p);
      svg += `<text x="${ax + off.dx}" y="${ay + off.dy}" fill="${a.color}" opacity="0.35" font-family="var(--mono)" font-size="11" text-anchor="middle">${a.name}</text>`;
    });

    // Front equator & meridian
    svg += `<path d="${eqPath.front}" stroke="var(--line-bright)" stroke-width="1" fill="none" />`;
    svg += `<path d="${mePath.front}" stroke="var(--line-bright)" stroke-width="1" fill="none" />`;

    // Arrow from center to state (only show if stateInFront)
    if (stateInFront) {
      svg += `<line x1="${cx}" y1="${cy}" x2="${vx}" y2="${vy}" stroke="${arrowColor}" stroke-width="2.5" stroke-linecap="round" />`;
      svg += `<circle cx="${vx}" cy="${vy}" r="6" fill="${arrowColor}" />`;
      svg += `<circle cx="${vx}" cy="${vy}" r="11" fill="none" stroke="${arrowColor}" stroke-width="1" opacity="0.4" />`;
    } else {
      // dim arrow if pointing back
      svg += `<line x1="${cx}" y1="${cy}" x2="${vx}" y2="${vy}" stroke="${arrowColor}" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.55" />`;
      svg += `<circle cx="${vx}" cy="${vy}" r="5" fill="${arrowColor}" opacity="0.55" />`;
    }

    // Front-hemisphere axis labels (bright)
    pAxes.filter(a => a.p.depth >= 0).forEach(a => {
      const ax = cx + a.p.sx * R;
      const ay = cy + a.p.sy * R;
      const off = labelOffset(a, a.p);
      svg += `<text x="${ax + off.dx}" y="${ay + off.dy}" fill="${a.color}" font-family="var(--mono)" font-size="11" text-anchor="middle" font-weight="500">${a.name}</text>`;
    });

    // Center dot
    svg += `<circle cx="${cx}" cy="${cy}" r="1.5" fill="var(--ink-dim)" />`;

    svg += `</svg>`;

    host.innerHTML = svg;

    // Update readout
    if (readoutId) {
      const readEl = document.getElementById(readoutId);
      const near = nearestState();
      const probs = measureProbs();
      const sp = (alpha.re*alpha.re+alpha.im*alpha.im > 0.99) ? 'definite |0⟩' :
                 (beta.re*beta.re+beta.im*beta.im > 0.99) ? 'definite |1⟩' :
                 'superposition';
      readEl.innerHTML = `
        <div><span class="rlabel">State</span> <span class="rval">α|0⟩ + β|1⟩</span></div>
        <div><span class="rlabel">α =</span> ${fmtC(alpha)}</div>
        <div><span class="rlabel">β =</span> ${fmtC(beta)}</div>
        <div><span class="rlabel">Nearest</span> <span class="rmini">${near.name}</span></div>
        <div><span class="rlabel">P(0) = </span> ${(probs.p0*100).toFixed(1)}%   <span class="rlabel">P(1) = </span> ${(probs.p1*100).toFixed(1)}%</div>
        <div><span class="rlabel">Type</span> ${sp}</div>
      `;
    }
  }

  function labelOffset(axis, p) {
    // push labels outward from sphere center along projected direction
    const len = Math.sqrt(p.sx*p.sx + p.sy*p.sy) || 1;
    const pad = 16;
    return { dx: (p.sx/len) * pad, dy: (p.sy/len) * pad + 4 };
  }

  // Drag to rotate view
  let dragging = false, dragStartX = 0, dragStartY = 0, startRotX = 0, startRotY = 0;
  host.addEventListener('pointerdown', (e) => {
    dragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    startRotX = camRotX;
    startRotY = camRotY;
    host.setPointerCapture(e.pointerId);
    if (options.onDrag) options.onDrag();
  });
  host.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    camRotY = startRotY + dx * 0.008;
    camRotX = Math.max(-Math.PI/2, Math.min(Math.PI/2, startRotX - dy * 0.008));
    draw();
  });
  host.addEventListener('pointerup', () => { dragging = false; });
  host.addEventListener('pointercancel', () => { dragging = false; });

  draw();

  return {
    draw,
    setPreset,
    applyGate,
    reset,
    getState: () => ({ alpha: {...alpha}, beta: {...beta} })
  };
}

/* =========================================================================
   STEP 2 — Bloch sphere explorer
   ========================================================================= */
(function initStep2() {
  const presetsVisited = new Set();
  const bloch = createBloch('bloch-1', 'bloch-1-readout', {
    onDrag: () => {
      presetsVisited.add('drag');
      if (presetsVisited.size >= 3) markDone('t1-2');
    }
  });
  blochInstances['bloch-1'] = bloch;
  document.querySelectorAll('[data-bloch="1"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const state = btn.dataset.state;
      bloch.setPreset(state);
      presetsVisited.add(state);
      if (presetsVisited.size >= 3) markDone('t1-2');
    });
  });
})();

/* =========================================================================
   STEP 3 — gate application on Bloch sphere
   ========================================================================= */
(function initStep3() {
  let gateApplications = 0;
  const gateHistory = [];
  const bloch = createBloch('bloch-2', 'bloch-2-readout');
  blochInstances['bloch-2'] = bloch;
  document.querySelectorAll('[data-bloch="2"]').forEach(btn => {
    if (btn.dataset.gate) {
      btn.addEventListener('click', () => {
        const g = GATES[btn.dataset.gate];
        bloch.applyGate(g);
        gateHistory.push(btn.dataset.gate);
        if (gateHistory.length > 24) gateHistory.shift();
        gateApplications++;
        if (gateApplications >= 4) markDone('t1-3');
      });
    }
  });
  document.querySelectorAll('.reset-gate-btn[data-bloch="2"]').forEach(btn => {
    btn.addEventListener('click', () => {
      bloch.reset();
      gateHistory.length = 0;
    });
  });

  const playBtn = document.getElementById('t1-gate-play');
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      if (!gateHistory.length) return;
      bloch.reset();
      let idx = 0;
      function step() {
        if (idx >= gateHistory.length) return;
        const gateName = gateHistory[idx++];
        if (GATES[gateName]) bloch.applyGate(GATES[gateName]);
        setTimeout(step, 360);
      }
      step();
    });
  }
})();

/* =========================================================================
   MINI CIRCUIT RENDERER (read-only visual for tutorial steps)
   ========================================================================= */
function renderMiniCircuit(containerId, config) {
  // config = { nQubits, columns: Column[] }, where Column is same model as the Lab
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  const wires = document.createElement('div');
  wires.className = 'mini-wires';

  const nCols = config.columns.length;

  for (let q = config.nQubits - 1; q >= 0; q--) {
    const row = document.createElement('div');
    row.className = 'mini-wire-row';

    const label = document.createElement('div');
    label.className = 'mini-wire-label';
    label.innerHTML = `q<sub>${q}</sub>`;
    row.appendChild(label);

    const track = document.createElement('div');
    track.className = 'mini-track';
    const line = document.createElement('div');
    line.className = 'mini-line';
    track.appendChild(line);

    const slots = document.createElement('div');
    slots.className = 'mini-slots';

    for (let c = 0; c < nCols; c++) {
      const slot = document.createElement('div');
      slot.className = 'mini-slot';
      slot.dataset.col = c;
      slot.dataset.q = q;
      const entry = config.columns[c][q];
      if (entry) {
        const el = document.createElement('div');
        if (entry.type === 'single') {
          el.className = 'mini-gate';
          const g = entry.gate;
          if (g === 'RX' || g === 'RY' || g === 'RZ') {
            el.style.fontFamily = 'var(--mono)';
            el.style.fontSize = '9px';
            el.style.lineHeight = '1';
            el.style.color = 'var(--cyan)';
            el.style.borderColor = 'var(--cyan)';
            const sub = g[1].toLowerCase();
            const deg = entry.angleDeg !== undefined ? entry.angleDeg : 90;
            el.innerHTML = `R${sub}<br><span style="font-size:7px;color:var(--cyan)">${deg}°</span>`;
          } else {
            el.textContent = g;
          }
        } else if (entry.type === 'ctrl') {
          el.className = 'mini-gate ctrl-dot';
        } else if (entry.type === 'target') {
          el.className = entry.gate === 'X' ? 'mini-gate target-x' : 'mini-gate';
          el.textContent = entry.gate === 'X' ? '⊕' : entry.gate;
        } else if (entry.type === 'meas') {
          el.className = 'mini-gate meas'; el.textContent = '◎';
        }
        slot.appendChild(el);
      }
      slots.appendChild(slot);
    }
    track.appendChild(slots);
    row.appendChild(track);
    wires.appendChild(row);
  }

  container.appendChild(wires);

  // Draw ctrl links
  const refresh = () => {
    container.querySelectorAll('.mini-ctrl-link').forEach(e => e.remove());
    const containerRect = container.getBoundingClientRect();
    for (let c = 0; c < nCols; c++) {
      const col = config.columns[c];
      const ctrlQs = [], tgtQs = [];
      col.forEach((e, q) => {
        if (e && e.type === 'ctrl') ctrlQs.push(q);
        if (e && e.type === 'target') tgtQs.push(q);
      });
      if (ctrlQs.length && tgtQs.length) {
        const qA = Math.min(...ctrlQs, ...tgtQs);
        const qB = Math.max(...ctrlQs, ...tgtQs);
        const slotA = container.querySelector(`.mini-slot[data-col="${c}"][data-q="${qA}"]`);
        const slotB = container.querySelector(`.mini-slot[data-col="${c}"][data-q="${qB}"]`);
        if (slotA && slotB) {
          const rA = slotA.getBoundingClientRect();
          const rB = slotB.getBoundingClientRect();
          const link = document.createElement('div');
          link.className = 'mini-ctrl-link';
          const topY = Math.min(rA.top, rB.top) - containerRect.top + rA.height/2;
          const bottomY = Math.max(rA.top, rB.top) - containerRect.top + rA.height/2;
          link.style.top = topY + 'px';
          link.style.height = (bottomY - topY) + 'px';
          link.style.left = (rA.left - containerRect.left + rA.width/2) + 'px';
          link.style.transform = 'translateX(-50%)';
          container.appendChild(link);
        }
      }
    }
  };
  container._refreshLinks = refresh;
  requestAnimationFrame(refresh);
}

/* Run a config (not the live Lab circuit). Returns probability vector. */
function simulateConfig(config, noise = 0, shots = 1024) {
  const n = config.nQubits;
  const runOnceCfg = () => {
    let state = new Array(1<<n).fill(0).map(() => ({re:0,im:0}));
    state[0] = {re:1,im:0};
    for (let c = 0; c < config.columns.length; c++) {
      const col = config.columns[c];
      const processed = new Set();
      for (let q = 0; q < n; q++) {
        const e = col[q];
        if (!e || processed.has(q)) continue;
        if (e.type === 'ctrl') {
          const target = e.partner;
          const tgt = col[target];
          if (tgt && tgt.type === 'target') {
            state = applyControlled(state, GATES[tgt.gate], q, target, n);
            processed.add(q); processed.add(target);
            if (noise > 0) {
              if (Math.random() < noise) state = applySingle(state, randomPauli(), q, n);
              if (Math.random() < noise) state = applySingle(state, randomPauli(), target, n);
            }
          }
        }
      }
      for (let q = 0; q < n; q++) {
        if (processed.has(q)) continue;
        const e = col[q];
        if (!e) continue;
        if (e.type === 'single') {
          let mtx;
          if (e.gate === 'RX') mtx = makeRxGate(e.angleDeg || 90);
          else if (e.gate === 'RY') mtx = makeRyGate(e.angleDeg || 90);
          else if (e.gate === 'RZ') mtx = makeRzGate(e.angleDeg || 90);
          else mtx = GATES[e.gate];
          state = applySingle(state, mtx, q, n);
          if (noise > 0 && Math.random() < noise) state = applySingle(state, randomPauli(), q, n);
        }
      }
    }
    return state;
  };
  if (noise === 0) {
    const state = runOnceCfg();
    return state.map(a => a.re*a.re + a.im*a.im);
  }
  // shot-based
  const dim = 1 << n;
  const counts = new Array(dim).fill(0);
  for (let s = 0; s < shots; s++) {
    const state = runOnceCfg();
    const ps = state.map(a => a.re*a.re + a.im*a.im);
    let r = Math.random(), cum = 0;
    for (let i = 0; i < dim; i++) {
      cum += ps[i];
      if (r <= cum) { counts[i]++; break; }
    }
  }
  return counts.map(c => c / shots);
}

function formatBasisLabelN(i, n) {
  let s = '';
  for (let q = n-1; q >= 0; q--) s += ((i>>q)&1);
  return '|' + s + '⟩';
}

function renderMiniProbs(containerId, probs, n, maxShow = 6) {
  const el = document.getElementById(containerId);
  const entries = probs.map((p,i) => ({p,i})).sort((a,b) => b.p - a.p);
  const show = entries.slice(0, maxShow);
  el.innerHTML = '<div class="prob-list">' + show.map(({i,p}) => {
    const pct = (p*100).toFixed(1);
    const zero = p < 0.005 ? ' zero' : '';
    return `<div class="prob-row${zero}">
      <div class="prob-label">${formatBasisLabelN(i,n)}</div>
      <div class="prob-bar-wrap"><div class="prob-bar" style="width:${Math.max(p*100, p>0.001?1:0)}%"></div></div>
      <div class="prob-val">${pct}%</div>
    </div>`;
  }).join('') + '</div>';
}

/* =========================================================================
   STEP 4 — coin flip circuit (single H + measure)
   ========================================================================= */
(function initStep4() {
  const cfg = {
    nQubits: 1,
    columns: [
      [null],
      [{type:'single',gate:'H'}],
      [null],
      [{type:'meas'}],
      [null],
    ]
  };
  renderMiniCircuit('mini-coin-circuit', cfg);

  const history = [];
  const shotEl = document.getElementById('mini-coin-shot');
  const histEl = document.getElementById('mini-coin-history');

  document.getElementById('mini-coin-run').addEventListener('click', () => {
    // H on |0> → |+> → measure
    const r = Math.random() < 0.5 ? 0 : 1;
    shotEl.textContent = r;
    shotEl.style.color = r === 0 ? 'var(--cyan)' : 'var(--amber)';
    history.push(r);
    histEl.innerHTML = history.slice(-40).map(x => `<span class="h${x}">${x}</span>`).join(' ');
    if (history.length >= 5) markDone('t1-4');
  });
  document.getElementById('mini-coin-reset').addEventListener('click', () => {
    history.length = 0;
    shotEl.textContent = '—';
    shotEl.style.color = 'var(--mint)';
    histEl.innerHTML = '';
  });
})();

/* =========================================================================
   STEP 5 — two Hadamards (product state, uniform over 4 outcomes)
   ========================================================================= */
(function initStep5() {
  const cfg = {
    nQubits: 2,
    columns: [
      [null, null],
      [{type:'single',gate:'H'}, {type:'single',gate:'H'}],
      [null, null],
      [{type:'meas'}, {type:'meas'}],
      [null, null],
    ]
  };
  renderMiniCircuit('mini-two-circuit', cfg);
  let runCount = 0;

  document.getElementById('mini-two-run').addEventListener('click', () => {
    const probs = simulateConfig(cfg, 0);
    renderMiniProbs('mini-two-probs', probs, 2, 4);
    runCount++;
    if (runCount >= 1) markDone('t1-5');
  });
})();

/* =========================================================================
   STEP 6 — Bell pair, show paired outcomes
   ========================================================================= */
(function initStep6() {
  const cfg = {
    nQubits: 2,
    columns: [
      [null, null],
      [{type:'single',gate:'H'}, null],
      [{type:'ctrl',partner:1}, {type:'target',gate:'X',partner:0}],
      [null, null],
      [{type:'meas'}, {type:'meas'}],
      [null, null],
    ]
  };
  renderMiniCircuit('mini-bell-circuit', cfg);

  document.getElementById('mini-bell-run').addEventListener('click', () => {
    const pairGrid = document.getElementById('mini-bell-pairs');
    // 20 shots, each a fresh simulation
    pairGrid.innerHTML = '';
    for (let i = 0; i < 20; i++) {
      // Bell state: 50% 00, 50% 11
      const r = Math.random() < 0.5 ? 0 : 3; // |00> or |11>
      const b1 = (r >> 1) & 1;
      const b0 = r & 1;
      const cell = document.createElement('div');
      cell.className = 'pair-cell ' + (b0 === b1 ? 'match' : 'mismatch');
      cell.textContent = `${b1}${b0}`;
      pairGrid.appendChild(cell);
    }
    markDone('t1-6');
  });
})();

/* =========================================================================
   STEP 7 — Bell pair with noise slider
   ========================================================================= */
(function initStep7() {
  const slider = document.getElementById('t1-noise-slider');
  const valEl  = document.getElementById('t1-noise-val');
  const usedLevels = new Set();

  slider.addEventListener('input', () => {
    valEl.textContent = parseFloat(slider.value).toFixed(1) + '%';
  });

  const cfg = {
    nQubits: 2,
    columns: [
      [null, null],
      [{type:'single',gate:'H'}, null],
      [{type:'ctrl',partner:1}, {type:'target',gate:'X',partner:0}],
      [null, null],
    ]
  };

  function renderDensityNote(noiseProb) {
    const host = document.getElementById('mini-noise-probs');
    if (!host) return;
    const f = Math.max(0.25, 1 - 0.75 * noiseProb); // toy Werner-like fidelity trend
    let note = document.getElementById('t1-noise-rho-note');
    if (!note) {
      note = document.createElement('div');
      note.id = 't1-noise-rho-note';
      note.style.cssText = 'margin-top:8px;padding-top:8px;border-top:1px solid var(--line);font-family:var(--mono);font-size:11px;color:var(--ink-dim);line-height:1.5';
      host.parentElement.appendChild(note);
    }
    note.innerHTML = `Density-view intuition: this is no longer a pure Bell state; a Werner-like fidelity trend is <span style="color:var(--amber)">F ≈ ${f.toFixed(3)}</span>. ` +
      `As F drops, off-diagonal Bell coherence terms shrink and |01⟩, |10⟩ populations rise.`;
  }

  document.getElementById('mini-noise-run').addEventListener('click', () => {
    const p = parseFloat(slider.value) / 100;
    const probs = simulateConfig(cfg, p, 1024);
    renderMiniProbs('mini-noise-probs', probs, 2, 4);
    renderDensityNote(p);
    usedLevels.add(slider.value);
    if (usedLevels.size >= 2) markDone('t1-7');
  });
})();

/* =========================================================================
   STEP 8 — wrap-up cards navigate to Lab or Tutorial 2
   ========================================================================= */
document.querySelectorAll('.wrap-card').forEach(card => {
  card.addEventListener('click', () => {
    const dest = card.dataset.go;
    if (dest === 'lab') switchTab('lab');
    else if (dest === 't1') { switchTab('learn'); switchSubtab('t1'); }
    else if (dest === 't2') { switchTab('learn'); switchSubtab('t2'); }
    else if (dest === 't3') { switchTab('learn'); switchSubtab('t3'); }
    else if (dest === 't4') { switchTab('learn'); switchSubtab('t4'); }
    else if (dest === 't5') { switchTab('learn'); switchSubtab('t5'); }
    else if (dest === 't6') { switchTab('learn'); switchSubtab('t6'); }
    else if (dest === 't7') { switchTab('learn'); switchSubtab('t7'); }
    else if (dest === 't8') { switchTab('learn'); switchSubtab('t8'); }
    else if (dest === 't9') { switchTab('learn'); switchSubtab('t9'); }
    else if (dest === 't10') { switchTab('learn'); switchSubtab('t10'); }
  });
});

/* =========================================================================
   TUTORIAL 4
   ========================================================================= */

/* Step t4-1: X·X under noise */
(function initT4Step1() {
  const slider = document.getElementById('t4-noise-slider');
  const valEl  = document.getElementById('t4-noise-val');
  const usedLevels = new Set();

  slider.addEventListener('input', () => {
    valEl.textContent = parseFloat(slider.value).toFixed(1) + '%';
  });

  const cfg = {
    nQubits: 1,
    columns: [
      [null],
      [{type:'single',gate:'X'}],
      [{type:'single',gate:'X'}],
      [null],
    ]
  };

  function renderNoiseNote(p, probs) {
    let note = document.getElementById('t4-xx-noise-note');
    if (!note) {
      note = document.createElement('div');
      note.id = 't4-xx-noise-note';
      note.style.cssText = 'margin-top:10px;padding:9px 13px;background:var(--bg-0);' +
        'border-left:3px solid var(--amber);font-family:var(--serif);font-size:12px;' +
        'color:var(--ink-dim);line-height:1.65;border-radius:0 4px 4px 0;transition:opacity 0.3s;';
      const probsEl = document.getElementById('t4-xx-probs');
      if (probsEl) probsEl.parentNode.insertBefore(note, probsEl.nextSibling);
    }
    const p0 = probs[0] != null ? probs[0] : 0;
    note.style.opacity = 0;
    note.textContent = p < 0.01
      ? 'At 0% noise the two X gates cancel perfectly: |0⟩ → |1⟩ → |0⟩. You should see 100% probability on |0⟩ above.'
      : `At ${(p*100).toFixed(1)}% noise, each X gate can suffer a random Pauli error. The two X operations no longer cancel cleanly — P(|0⟩) is about ${(p0*100).toFixed(1)}% in this run. This is the core problem quantum error correction must solve.`;
    setTimeout(() => { note.style.opacity = 1; }, 20);
  }

  document.getElementById('t4-xx-run').addEventListener('click', () => {
    const p = parseFloat(slider.value) / 100;
    const probs = simulateConfig(cfg, p, 1024);
    renderMiniProbs('t4-xx-probs', probs, 1, 2);
    renderNoiseNote(p, probs);
    usedLevels.add(slider.value);
    if (usedLevels.size >= 2) markDone('t4-1');
  });
})();

/* Step t4-2: reading step + no-cloning diagram */
(function initT4Step2() {
  const btn = document.querySelector('[data-step="t4-2"] .step-next');
  if (btn) btn.addEventListener('click', () => markDone('t4-2'));

  const svg = document.getElementById('t4-noclone-svg');
  if (!svg) return;
  const ns = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, text) {
    const e = document.createElementNS(ns, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (text !== undefined) e.textContent = text;
    return e;
  }
  svg.innerHTML = '';
  const defs = el('defs', {});
  const m = el('marker', { id: 't4noclone-arr', markerWidth: 6, markerHeight: 6, refX: 4, refY: 3, orient: 'auto' });
  m.appendChild(el('path', { d: 'M0,0 L6,3 L0,6 Z', fill: 'var(--line-bright)' }));
  defs.appendChild(m);
  svg.appendChild(defs);
  const panels = [
    { x: 8,  title: 'Clone |0⟩',  ok: true,  in: '|0⟩',  out: '|0⟩|0⟩', sub: 'OK' },
    { x: 192, title: 'Clone |1⟩',  ok: true,  in: '|1⟩',  out: '|1⟩|1⟩', sub: 'OK' },
    { x: 376, title: 'Clone |+⟩', ok: false, in: '|+⟩', out: 'not |+⟩|+⟩', sub: 'FORBIDDEN' }
  ];
  panels.forEach(p => {
    svg.appendChild(el('rect', { x: p.x, y: 6, width: 168, height: 118, fill: 'var(--bg-0)', stroke: 'var(--line)', 'stroke-width': 1, rx: 4 }));
    svg.appendChild(el('text', { x: p.x + 84, y: 22, 'font-family': 'var(--mono)', 'font-size': 8, fill: 'var(--ink-faint)', 'text-anchor': 'middle', 'letter-spacing': '0.08em' }, p.title));
    svg.appendChild(el('text', { x: p.x + 20, y: 52, 'font-family': 'var(--serif)', 'font-style': 'italic', 'font-size': 13, fill: 'var(--ink-dim)' }, p.in));
    svg.appendChild(el('path', { d: `M ${p.x + 58} 48 L ${p.x + 100} 48`, stroke: 'var(--line-bright)', 'stroke-width': 1.2, 'marker-end': 'url(#t4noclone-arr)' }));
    const outX = p.ok ? p.x + 80 : p.x + 84;
    svg.appendChild(el('text', { x: outX, y: 78, 'font-family': 'var(--serif)', 'font-style': 'italic', 'font-size': 11, fill: p.ok ? 'var(--mint)' : 'var(--red)', 'text-anchor': 'middle' }, p.out));
    const subColor = p.ok ? 'var(--mint)' : 'var(--red)';
    svg.appendChild(el('text', { x: p.x + 84, y: 108, 'font-family': 'var(--mono)', 'font-size': 8, fill: subColor, 'text-anchor': 'middle', 'letter-spacing': '0.12em' }, p.sub));
  });
})();

/* Step t4-3: genuine repetition + superposition block encoding (3-qubit) */
(function initT4Step3() {
  let mode = 'L0';
  let errQ = 'none';
  let runCount = 0;

  function S(g) { return { type: 'single', gate: g }; }
  function buildColumns() {
    const base = {
      L0: [
        [null, null, null],
      ],
      L1: [
        [S('X'), S('X'), S('X')],
      ],
      super: [
        [null, null, null],
        [S('H'), null, null],
        [{ type: 'ctrl', partner: 1 }, { type: 'target', gate: 'X', partner: 0 }, null],
        [{ type: 'ctrl', partner: 2 }, null, { type: 'target', gate: 'X', partner: 0 }],
        [null, null, null],
      ],
    }[mode];
    const cols = base.map(c => c.slice());
    if (errQ !== 'none') {
      const q = parseInt(errQ, 10);
      const errCol = [null, null, null];
      errCol[q] = S('X');
      cols.push(errCol);
    }
    return cols;
  }

  function currentCfg() {
    return { nQubits: 3, columns: buildColumns() };
  }

  function renderRepcodeCircuit() {
    renderMiniCircuit('mini-repcode-circuit', currentCfg());
  }

  function renderRepcodeNote() {
    let note = document.getElementById('t4-repcode-note');
    if (!note) {
      note = document.createElement('div');
      note.id = 't4-repcode-note';
      note.style.cssText = 'margin-top:10px;padding:9px 13px;background:var(--bg-0);' +
        'border-left:3px solid var(--cyan);font-family:var(--serif);font-size:12px;' +
        'color:var(--ink-dim);line-height:1.65;border-radius:0 4px 4px 0;transition:opacity 0.3s;';
      const probsEl = document.getElementById('mini-repcode-probs');
      if (probsEl) probsEl.parentNode.insertBefore(note, probsEl.nextSibling);
    }
    const eq = (mode) => {
      if (mode === 'L0') return 'Logical 0: three physical |0⟩ qubits (|000⟩). A classical repetition of “0”.';
      if (mode === 'L1') return 'Logical 1: three |1⟩ qubits (|111⟩). Same idea as classical triple redundancy, implemented with X gates.';
      return 'Superposition block: H on the control, then CNOTs copy the |0⟩/|1⟩ amplitudes onto the other two lines — the state (|000⟩+|111⟩)/√2, not a tensor product of three separate |+⟩.';
    };
    const er = errQ === 'none'
      ? ' No injected error — outcomes stay in the code space (for L0/L1) or a superposition of the two valid patterns (super mode).'
      : ` A bit flip on q${errQ} moves you off the intended codeword; with one error you can still spot the mismatch (majority on each classical pattern) and would flip that wire back.`;
    note.style.opacity = 0;
    note.textContent = eq(mode) + er;
    setTimeout(() => { note.style.opacity = 1; }, 20);
  }

  function syncModeButtons() {
    document.querySelectorAll('.t4-repcode-mode').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-t4-repcode') === mode);
    });
  }
  function syncErrButtons() {
    document.querySelectorAll('.t4-repcode-err').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-err') === errQ);
    });
  }

  document.querySelectorAll('.t4-repcode-mode').forEach(b => {
    b.addEventListener('click', () => {
      mode = b.getAttribute('data-t4-repcode');
      syncModeButtons();
      renderRepcodeCircuit();
    });
  });
  document.querySelectorAll('.t4-repcode-err').forEach(b => {
    b.addEventListener('click', () => {
      errQ = b.getAttribute('data-err') || 'none';
      syncErrButtons();
      renderRepcodeCircuit();
    });
  });

  syncModeButtons();
  syncErrButtons();
  renderRepcodeCircuit();
  renderRepcodeNote();

  const runBtn = document.getElementById('mini-repcode-run');
  if (runBtn) {
    runBtn.addEventListener('click', () => {
      const probs = simulateConfig(currentCfg(), 0);
      renderMiniProbs('mini-repcode-probs', probs, 3, 8);
      renderRepcodeNote();
      runCount++;
      if (runCount >= 2) markDone('t4-3');
    });
  }
})();

/* Step t4-4: surface code intro schematic + markDone on Next (see initT4Step4SurfaceIntro) */
/* Step t4-5: surface code grid + overhead — tutorial-4-noise-qec.js */

(function initT4Step4SurfaceIntro() {
  const btn = document.querySelector('[data-step="t4-4"] .step-next');
  if (btn) btn.addEventListener('click', () => markDone('t4-4'));

  const svg = document.getElementById('t4-surface-intro-svg');
  if (!svg) return;
  const ns = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, text) {
    const e = document.createElementNS(ns, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (text !== undefined) e.textContent = text;
    return e;
  }
  svg.innerHTML = '';
  const gap = 50;
  const off = 36;
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      const isZ = (r + c) % 2 === 0;
      const color = isZ ? 'rgba(224,133,208,0.22)' : 'rgba(111,212,224,0.22)';
      const stroke = isZ ? 'var(--amber)' : 'var(--cyan)';
      svg.appendChild(el('rect', {
        x: off + c * gap + 2, y: off + r * gap + 2, width: gap - 4, height: gap - 4,
        fill: color, stroke, 'stroke-width': 1, rx: 2
      }));
      const cx = off + c * gap + gap / 2;
      const cy = off + r * gap + gap / 2;
      svg.appendChild(el('text', {
        x: cx, y: cy + 3, 'font-family': 'var(--mono)', 'font-size': 9,
        fill: isZ ? 'var(--amber)' : 'var(--cyan)', 'text-anchor': 'middle'
      }, isZ ? 'Z' : 'X'));
    }
  }
  for (let q = 0; q < 9; q++) {
    const row = Math.floor(q / 3);
    const col = q % 3;
    const qx = off + col * gap;
    const qy = off + row * gap;
    const g = el('g', { transform: `translate(${qx},${qy})` });
    g.appendChild(el('circle', { cx: 0, cy: 0, r: 8, fill: 'var(--bg-0)', stroke: 'var(--mint)', 'stroke-width': 1.5 }));
    g.appendChild(el('text', {
      x: 0, y: 3, 'font-family': 'var(--mono)', 'font-size': 8,
      fill: 'var(--mint)', 'text-anchor': 'middle'
    }, String(q)));
    svg.appendChild(g);
  }
  svg.appendChild(el('text', {
    x: 180, y: 158, 'font-family': 'var(--mono)', 'font-size': 8, fill: 'var(--ink-faint)',
    'text-anchor': 'middle', 'letter-spacing': '0.06em'
  }, 'nine data qubits, four face checks (compare Step 5)'));
})();

/* Step t4-6: wrap-up — mark done when the card unlocks (reading-only) */
(function initT4Step6Wrap() {
  const card = document.querySelector('[data-step="t4-6"]');
  if (!card) return;
  const obs = new MutationObserver(() => {
    if (!card.classList.contains('locked')) { markDone('t4-6'); obs.disconnect(); }
  });
  obs.observe(card, { attributes: true, attributeFilter: ['class'] });
})();

/* ---------------- Initial render passes ---------------- */
// make sure mini ctrl links get drawn even if hidden at first
window.addEventListener('resize', () => {
  document.querySelectorAll('.mini-circuit').forEach(c => {
    if (c._refreshLinks) c._refreshLinks();
  });
});
