/* =========================================================================
   TUTORIAL 10: PULSES, NOT GATES — HOW A REAL QUBIT GETS CONTROLLED
   ========================================================================= */

/* ---- shared helpers ---- */
(function initT10Helpers() {
  if (window.__t10HelpersLoaded) return;
  window.__t10HelpersLoaded = true;

  window.t10Clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  // SVG helper — same pattern as other tutorials
  window.t10MkEl = function mkEl(tag, attrs, text) {
    const ns = 'http://www.w3.org/2000/svg';
    const e = document.createElementNS(ns, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (text) e.textContent = text;
    return e;
  };

  /* ----- shared Bloch disk renderer (x–z slice) -----
     We show a 2D slice of the Bloch sphere because every pulse effect we
     care about in this tutorial is a rotation about the x-axis (real
     amplitude drive) or z-axis (detuning / free precession). A full 3D
     sphere would obscure the point. Bloch vector is (x, z) in that slice.
  */
  window.t10DrawBlochDisk = function drawBlochDisk(svg, bloch, opts = {}) {
    if (!svg) return;
    svg.innerHTML = '';
    const mkEl = window.t10MkEl;
    const W = opts.W || 220, H = opts.H || 220;
    const cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 18;

    // disk
    svg.appendChild(mkEl('circle', {
      cx, cy, r: R, fill: 'none',
      stroke: 'var(--line-bright)', 'stroke-width': 1.25, opacity: 0.6
    }));
    // axes
    svg.appendChild(mkEl('line', {
      x1: cx - R, y1: cy, x2: cx + R, y2: cy,
      stroke: 'var(--line-bright)', 'stroke-width': 1, opacity: 0.45
    }));
    svg.appendChild(mkEl('line', {
      x1: cx, y1: cy - R, x2: cx, y2: cy + R,
      stroke: 'var(--line-bright)', 'stroke-width': 1, opacity: 0.45
    }));

    // pole labels
    svg.appendChild(mkEl('text', {
      x: cx, y: cy - R - 4, 'font-family': 'var(--mono)',
      'font-size': 11, fill: 'var(--ink-faint)', 'text-anchor': 'middle'
    }, '|0⟩'));
    svg.appendChild(mkEl('text', {
      x: cx, y: cy + R + 14, 'font-family': 'var(--mono)',
      'font-size': 11, fill: 'var(--ink-faint)', 'text-anchor': 'middle'
    }, '|1⟩'));
    svg.appendChild(mkEl('text', {
      x: cx + R + 4, y: cy + 4, 'font-family': 'var(--mono)',
      'font-size': 11, fill: 'var(--ink-faint)', 'text-anchor': 'start'
    }, '|+⟩'));
    svg.appendChild(mkEl('text', {
      x: cx - R - 4, y: cy + 4, 'font-family': 'var(--mono)',
      'font-size': 11, fill: 'var(--ink-faint)', 'text-anchor': 'end'
    }, '|−⟩'));

    // bloch vector (bloch.x along horizontal, bloch.z along vertical; +z is up = |0⟩)
    const bx = window.t10Clamp(bloch.x, -1, 1);
    const bz = window.t10Clamp(bloch.z, -1, 1);
    const vx = cx + bx * R;
    const vy = cy - bz * R;

    // shaft
    svg.appendChild(mkEl('line', {
      x1: cx, y1: cy, x2: vx, y2: vy,
      stroke: 'var(--mint)', 'stroke-width': 3.5, 'stroke-linecap': 'round'
    }));
    svg.appendChild(mkEl('circle', {
      cx: vx, cy: vy, r: 6,
      fill: 'var(--mint)', stroke: 'var(--bg-0)', 'stroke-width': 2
    }));

    // purity ring (length of bloch vector)
    const r = Math.sqrt(bx * bx + bz * bz);
    if (r < 0.98 && opts.showPurity !== false) {
      svg.appendChild(mkEl('circle', {
        cx, cy, r: r * R, fill: 'none',
        stroke: 'var(--magenta)', 'stroke-width': 1, 'stroke-dasharray': '3 4', opacity: 0.6
      }));
    }

    if (opts.label) {
      svg.appendChild(mkEl('text', {
        x: 12, y: 18, 'font-family': 'var(--mono)',
        'font-size': 11, fill: 'var(--ink-faint)'
      }, opts.label));
    }
  };

  /* Given an x-rotation by angle θ applied to |0⟩, the Bloch vector is
     (sin θ, 0, cos θ) in the x–z slice.
  */
  window.t10BlochFromXRot = function blochFromXRot(theta) {
    return { x: Math.sin(theta), z: Math.cos(theta) };
  };
})();

/* ---- T10 Step 1: a gate is a pulse (amplitude × duration = rotation angle) ---- */
(function initT10Step1() {
  const ampSlider = document.getElementById('t10-pulse-amp');
  const durSlider = document.getElementById('t10-pulse-dur');
  const ampVal = document.getElementById('t10-pulse-amp-val');
  const durVal = document.getElementById('t10-pulse-dur-val');
  const pulseSvg = document.getElementById('t10-pulse-envelope');
  const blochSvg = document.getElementById('t10-pulse-bloch');
  const readoutEl = document.getElementById('t10-pulse-readout');
  const seen = new Set();
  let animTheta = 0;
  let animFrame = null;

  // θ = Ω * t  (in units where Ω=1 ↔ amp=1.0, t=π gives π rotation)
  function thetaFromControls() {
    if (!ampSlider || !durSlider) return 0;
    const amp = parseFloat(ampSlider.value); // 0..1
    const dur = parseFloat(durSlider.value); // 0..2π
    return amp * dur;
  }

  function drawPulse() {
    if (!pulseSvg) return;
    const mkEl = window.t10MkEl;
    pulseSvg.innerHTML = '';
    const W = 380, H = 130, padL = 36, padR = 14, padT = 14, padB = 28;
    const innerW = W - padL - padR;
    const innerH = H - padT - padB;

    const amp = parseFloat(ampSlider.value);
    const dur = parseFloat(durSlider.value);

    // axes
    pulseSvg.appendChild(mkEl('line', {
      x1: padL, y1: H - padB, x2: W - padR, y2: H - padB,
      stroke: 'var(--line-bright)', 'stroke-width': 1
    }));
    pulseSvg.appendChild(mkEl('line', {
      x1: padL, y1: padT, x2: padL, y2: H - padB,
      stroke: 'var(--line-bright)', 'stroke-width': 1
    }));

    // pulse as a filled rectangle (square envelope for now)
    const maxDur = 2 * Math.PI;
    const pulseW = (dur / maxDur) * innerW;
    const pulseH = amp * innerH;
    const x = padL;
    const y = H - padB - pulseH;
    pulseSvg.appendChild(mkEl('rect', {
      x, y, width: pulseW, height: pulseH,
      fill: 'var(--amber)', opacity: 0.8, rx: 2
    }));

    // area highlight text
    pulseSvg.appendChild(mkEl('text', {
      x: padL + pulseW / 2, y: y - 6,
      'font-family': 'var(--mono)', 'font-size': 10,
      fill: 'var(--amber)', 'text-anchor': 'middle'
    }, `area = Ω·t = ${(amp * dur).toFixed(2)}`));

    // axis labels
    pulseSvg.appendChild(mkEl('text', {
      x: W - padR, y: H - 10, 'font-family': 'var(--mono)',
      'font-size': 10, fill: 'var(--ink-faint)', 'text-anchor': 'end'
    }, 'time →'));
    pulseSvg.appendChild(mkEl('text', {
      x: 10, y: padT + 10, 'font-family': 'var(--mono)',
      'font-size': 10, fill: 'var(--ink-faint)'
    }, 'amplitude Ω'));

    // reference marks: π-pulse area
    const piArea = Math.PI;
    pulseSvg.appendChild(mkEl('text', {
      x: W - padR, y: padT + 12, 'font-family': 'var(--mono)',
      'font-size': 10, fill: 'var(--mint)', 'text-anchor': 'end'
    }, `π-pulse target: area = π ≈ ${piArea.toFixed(2)}`));
  }

  function update() {
    if (!ampSlider || !durSlider) return;
    const amp = parseFloat(ampSlider.value);
    const dur = parseFloat(durSlider.value);
    if (ampVal) ampVal.textContent = amp.toFixed(2);
    if (durVal) durVal.textContent = dur.toFixed(2);

    const theta = thetaFromControls();

    drawPulse();
    if (animFrame) cancelAnimationFrame(animFrame);
    const startTheta = animTheta;
    const start = performance.now();
    const duration = 260;
    function tick(now) {
      const u = Math.min(1, (now - start) / duration);
      animTheta = startTheta + (theta - startTheta) * u;
      const b = window.t10BlochFromXRot(animTheta);
      window.t10DrawBlochDisk(blochSvg, b, { label: `θ = ${animTheta.toFixed(2)} rad` });
      if (u < 1) {
        animFrame = requestAnimationFrame(tick);
      } else {
        animFrame = null;
      }
    }
    animFrame = requestAnimationFrame(tick);

    // classify: near |0⟩, equator, |1⟩
    const p1 = Math.sin(theta / 2) ** 2;
    if (readoutEl) {
      let msg;
      if (Math.abs(theta - Math.PI) < 0.08) {
        msg = `<b style="color:var(--mint)">π-pulse.</b> This is a calibrated X gate — the qubit has flipped to |1⟩. P(|1⟩) = ${(p1 * 100).toFixed(0)}%.`;
      } else if (Math.abs(theta - Math.PI / 2) < 0.08) {
        msg = `<b style="color:var(--cyan)">π/2-pulse.</b> The qubit sits on the equator — equal superposition. P(|1⟩) = ${(p1 * 100).toFixed(0)}%.`;
      } else {
        msg = `Bloch vector at angle θ = ${theta.toFixed(2)} rad from |0⟩. P(|1⟩) = ${(p1 * 100).toFixed(0)}%.`;
      }
      readoutEl.innerHTML = msg + ` <span style="color:var(--ink-faint)">Notice: doubling Ω and halving t gives the same θ — only the <b>area</b> matters. In plain language: stronger-for-shorter and weaker-for-longer can do the same rotation if the total "push" is equal.</span>`;
    }

    // record that user reached ≈π and tried at least 3 distinct area classes
    if (Math.abs(theta - Math.PI) < 0.1) seen.add('pi');
    if (theta < 0.3) seen.add('zero');
    if (Math.abs(theta - Math.PI / 2) < 0.2) seen.add('halfpi');
    if (seen.size >= 2 && seen.has('pi')) markDone('t10-1');
  }

  if (ampSlider) ampSlider.addEventListener('input', update);
  if (durSlider) durSlider.addEventListener('input', update);
  update();
})();

/* ---- T10 Step 2: Rabi oscillations — find the π-pulse ---- */
(function initT10Step2() {
  const svg = document.getElementById('t10-rabi-curve');
  const runBtn = document.getElementById('t10-rabi-run');
  const ampSlider = document.getElementById('t10-rabi-amp');
  const ampVal = document.getElementById('t10-rabi-amp-val');
  const foundEl = document.getElementById('t10-rabi-found');
  let pickedTime = null;
  const tries = new Set();
  const W = 460; const H = 230; const padL = 44; const padR = 16; const padT = 18; const padB = 32;
  const innerW = W - padL - padR;
  const tMax = 3 * Math.PI;
  /** Reused so draw() can clear the SVG without stacking duplicate click listeners. */
  let rabiClickLayer = null;

  // P(|1⟩) vs pulse duration at given amplitude
  function rabi(t, amp) {
    const theta = amp * t;
    return Math.sin(theta / 2) ** 2;
  }

  function draw() {
    if (!svg) return;
    const mkEl = window.t10MkEl;
    svg.innerHTML = '';
    const innerH = H - padT - padB;
    const amp = parseFloat(ampSlider.value);

    function xMap(t) { return padL + (t / tMax) * innerW; }
    function yMap(p) { return padT + (1 - p) * innerH; }

    // axes
    svg.appendChild(mkEl('line', { x1: padL, y1: padT, x2: padL, y2: H - padB, stroke: 'var(--line-bright)', 'stroke-width': 1 }));
    svg.appendChild(mkEl('line', { x1: padL, y1: H - padB, x2: W - padR, y2: H - padB, stroke: 'var(--line-bright)', 'stroke-width': 1 }));

    // labels
    svg.appendChild(mkEl('text', {
      x: 10, y: padT + 10, 'font-family': 'var(--mono)',
      'font-size': 10, fill: 'var(--ink-faint)'
    }, 'P(|1⟩)'));
    svg.appendChild(mkEl('text', {
      x: W - padR, y: H - 12, 'font-family': 'var(--mono)',
      'font-size': 10, fill: 'var(--ink-faint)', 'text-anchor': 'end'
    }, 'pulse duration (units of 1/Ω)'));

    // y ticks
    [0, 0.5, 1].forEach(v => {
      svg.appendChild(mkEl('text', {
        x: padL - 6, y: yMap(v) + 4, 'font-family': 'var(--mono)',
        'font-size': 10, fill: 'var(--ink-faint)', 'text-anchor': 'end'
      }, v.toFixed(v === 0.5 ? 1 : 0)));
    });

    // curve
    let d = '';
    const samples = 240;
    for (let i = 0; i <= samples; i++) {
      const t = (i / samples) * tMax;
      const p = rabi(t, amp);
      const X = xMap(t), Y = yMap(p);
      d += i === 0 ? `M ${X} ${Y}` : ` L ${X} ${Y}`;
    }
    svg.appendChild(mkEl('path', {
      d, fill: 'none', stroke: 'var(--mint)', 'stroke-width': 2.5, 'stroke-linecap': 'round'
    }));

    // The first zero-crossing (= P(1) peak) is the π-pulse: θ = π → amp·t = π
    const piTime = Math.PI / amp;
    if (piTime < tMax) {
      svg.appendChild(mkEl('line', {
        x1: xMap(piTime), y1: padT, x2: xMap(piTime), y2: H - padB,
        stroke: 'var(--amber)', 'stroke-width': 1.25, 'stroke-dasharray': '4 5', opacity: 0.8
      }));
      svg.appendChild(mkEl('text', {
        x: xMap(piTime) + 6, y: padT + 14, 'font-family': 'var(--mono)',
        'font-size': 10, fill: 'var(--amber)'
      }, `π-pulse at t ≈ ${piTime.toFixed(2)}`));
    }

    // tick labels along x
    for (let j = 0; j <= 3; j++) {
      const t = j * Math.PI;
      svg.appendChild(mkEl('text', {
        x: xMap(t), y: H - 14, 'font-family': 'var(--mono)',
        'font-size': 10, fill: 'var(--ink-faint)', 'text-anchor': 'middle'
      }, j === 0 ? '0' : (j === 1 ? 'π' : j + 'π')));
    }

    // marker for user's guess
    if (pickedTime !== null) {
      const p = rabi(pickedTime, amp);
      svg.appendChild(mkEl('circle', {
        cx: xMap(pickedTime), cy: yMap(p), r: 6,
        fill: 'var(--magenta)', stroke: 'var(--bg-0)', 'stroke-width': 2
      }));
      svg.appendChild(mkEl('text', {
        x: xMap(pickedTime), y: yMap(p) - 10, 'font-family': 'var(--mono)',
        'font-size': 10, fill: 'var(--magenta)', 'text-anchor': 'middle'
      }, `P = ${(p * 100).toFixed(0)}%`));
    }

    // click-to-pick: one overlay, single listener (re-appended after each full redraw)
    if (!rabiClickLayer) {
      rabiClickLayer = mkEl('rect', {
        x: padL, y: padT, width: innerW, height: innerH,
        fill: 'transparent', style: 'cursor:crosshair;'
      });
      rabiClickLayer.addEventListener('click', (evt) => {
        if (!ampSlider) return;
        const rect = svg.getBoundingClientRect();
        const xPx = evt.clientX - rect.left - padL;
        const t = (xPx / innerW) * tMax;
        pickedTime = window.t10Clamp(t, 0, tMax);
        tries.add(parseFloat(pickedTime.toFixed(1)));
        draw();
        updateFound();
      });
    } else {
      rabiClickLayer.setAttribute('x', String(padL));
      rabiClickLayer.setAttribute('y', String(padT));
      rabiClickLayer.setAttribute('width', String(innerW));
      rabiClickLayer.setAttribute('height', String(innerH));
    }
    svg.appendChild(rabiClickLayer);
  }

  function updateFound() {
    if (!foundEl) return;
    const amp = parseFloat(ampSlider.value);
    const piTime = Math.PI / amp;
    if (pickedTime === null) {
      foundEl.innerHTML = `Click anywhere on the curve to <b>pick a pulse duration</b>. Your job: find the spot where P(|1⟩) = 100% — that's your calibrated π-pulse. This is what an experimental "Rabi scan" looks like before any fancy optimization.`;
      return;
    }
    const err = Math.abs(pickedTime - piTime);
    if (err < 0.15) {
      foundEl.innerHTML = `<b style="color:var(--mint)">Calibrated.</b> You found the π-pulse at t ≈ ${pickedTime.toFixed(2)} (units of 1/Ω). <span style="color:var(--ink-faint)">This is day 1 of every superconducting qubit lab: sweep duration, fit the sinusoid, pick the first peak. Once this point is known, every X-style gate built from this channel becomes much more reliable.</span>`;
      markDone('t10-2');
    } else if (err < 0.5) {
      foundEl.innerHTML = `Close — you're at P(|1⟩) = ${(rabi(pickedTime, amp) * 100).toFixed(0)}%. The true π-pulse is at t ≈ ${piTime.toFixed(2)} (units of 1/Ω).`;
    } else {
      foundEl.innerHTML = `Not quite. You're at P(|1⟩) = ${(rabi(pickedTime, amp) * 100).toFixed(0)}%. Try clicking nearer the first peak of the curve.`;
    }
  }

  if (ampSlider) {
    ampSlider.addEventListener('input', () => {
      if (ampVal) ampVal.textContent = parseFloat(ampSlider.value).toFixed(2);
      pickedTime = null;
      draw();
      updateFound();
    });
  }
  if (runBtn) {
    runBtn.addEventListener('click', () => {
      // "auto-calibrate" button: drop the marker on the true π-pulse
      const amp = parseFloat(ampSlider.value);
      pickedTime = Math.PI / amp;
      tries.add(parseFloat(pickedTime.toFixed(1)));
      draw();
      updateFound();
    });
  }
  draw();
  updateFound();
})();

/* ---- T10 Step 3: detuning — off-resonance drive ---- */
(function initT10Step3() {
  const svg = document.getElementById('t10-detune-curve');
  const detuneSlider = document.getElementById('t10-detune');
  const detuneVal = document.getElementById('t10-detune-val');
  const descEl = document.getElementById('t10-detune-desc');
  const seen = new Set();

  // Rabi with detuning: generalized Rabi frequency Ω' = sqrt(Ω² + δ²)
  // P(|1⟩)(t) = (Ω²/Ω'²) sin²(Ω' t / 2)
  function detunedRabi(t, omega, delta) {
    const omegaP = Math.sqrt(omega * omega + delta * delta);
    const amp = (omega * omega) / (omegaP * omegaP);
    return amp * Math.sin(omegaP * t / 2) ** 2;
  }

  function draw() {
    if (!svg) return;
    const mkEl = window.t10MkEl;
    svg.innerHTML = '';
    const W = 460, H = 230, padL = 44, padR = 16, padT = 18, padB = 32;
    const innerW = W - padL - padR;
    const innerH = H - padT - padB;
    const tMax = 4 * Math.PI;
    const omega = 1.0;
    const delta = parseFloat(detuneSlider.value);

    function xMap(t) { return padL + (t / tMax) * innerW; }
    function yMap(p) { return padT + (1 - p) * innerH; }

    svg.appendChild(mkEl('line', { x1: padL, y1: padT, x2: padL, y2: H - padB, stroke: 'var(--line-bright)', 'stroke-width': 1 }));
    svg.appendChild(mkEl('line', { x1: padL, y1: H - padB, x2: W - padR, y2: H - padB, stroke: 'var(--line-bright)', 'stroke-width': 1 }));

    svg.appendChild(mkEl('text', {
      x: 10, y: padT + 10, 'font-family': 'var(--mono)',
      'font-size': 10, fill: 'var(--ink-faint)'
    }, 'P(|1⟩)'));
    svg.appendChild(mkEl('text', {
      x: W - padR, y: H - 12, 'font-family': 'var(--mono)',
      'font-size': 10, fill: 'var(--ink-faint)', 'text-anchor': 'end'
    }, 'time'));

    // reference (on-resonance) curve, faint
    let d0 = '';
    const samples = 260;
    for (let i = 0; i <= samples; i++) {
      const t = (i / samples) * tMax;
      const p = detunedRabi(t, omega, 0);
      const X = xMap(t), Y = yMap(p);
      d0 += i === 0 ? `M ${X} ${Y}` : ` L ${X} ${Y}`;
    }
    svg.appendChild(mkEl('path', {
      d: d0, fill: 'none', stroke: 'var(--line-bright)', 'stroke-width': 1.25,
      'stroke-dasharray': '4 5', opacity: 0.65
    }));

    // live (detuned) curve
    let d = '';
    for (let i = 0; i <= samples; i++) {
      const t = (i / samples) * tMax;
      const p = detunedRabi(t, omega, delta);
      const X = xMap(t), Y = yMap(p);
      d += i === 0 ? `M ${X} ${Y}` : ` L ${X} ${Y}`;
    }
    svg.appendChild(mkEl('path', {
      d, fill: 'none', stroke: 'var(--mint)', 'stroke-width': 2.5, 'stroke-linecap': 'round'
    }));

    // ceiling line: max P at this detuning
    const maxP = (omega * omega) / (omega * omega + delta * delta);
    svg.appendChild(mkEl('line', {
      x1: padL, y1: yMap(maxP), x2: W - padR, y2: yMap(maxP),
      stroke: 'var(--amber)', 'stroke-width': 1, 'stroke-dasharray': '3 4', opacity: 0.7
    }));
    svg.appendChild(mkEl('text', {
      x: W - padR - 4, y: yMap(maxP) - 4, 'font-family': 'var(--mono)',
      'font-size': 10, fill: 'var(--amber)', 'text-anchor': 'end'
    }, `ceiling: ${(maxP * 100).toFixed(0)}%`));

    [0, 0.5, 1].forEach(v => {
      svg.appendChild(mkEl('text', {
        x: padL - 6, y: yMap(v) + 4, 'font-family': 'var(--mono)',
        'font-size': 10, fill: 'var(--ink-faint)', 'text-anchor': 'end'
      }, v.toFixed(v === 0.5 ? 1 : 0)));
    });
  }

  function update() {
    if (!detuneSlider) return;
    const delta = parseFloat(detuneSlider.value);
    if (detuneVal) detuneVal.textContent = delta.toFixed(2);

    const maxP = 1 / (1 + delta * delta);
    if (descEl) {
      if (Math.abs(delta) < 0.05) {
        if (!descEl.querySelector('#fn-t10-1')) {
          descEl.innerHTML = `<b style="color:var(--mint)">On resonance.</b> Clean Rabi. P(|1⟩) reaches 100% at the π-pulse. "On resonance" simply means your microwave tone matches the qubit transition frequency.<a id="fnref-t10-1" class="expert-fn-ref" href="#fn-t10-1"><sup>[E1]</sup></a><br><span id="fn-t10-1" style="display:block;margin-top:6px;color:var(--ink-faint)">[E1] This description is exact for an ideal two-level system. Real superconducting qubits — transmons in particular — are weakly anharmonic: the |1⟩→|2⟩ transition sits only 100–300 MHz below the |0⟩→|1⟩ transition, close enough that a resonant drive also has partial spectral overlap with the leakage transition. So "on resonance with the qubit" does not mean "off resonance with everything else." This is why detuning alone is insufficient to suppress leakage on transmons, and why pulse shaping (Step 6) is necessary even when your drive frequency is perfectly calibrated.</span>`;
        }
      } else if (Math.abs(delta) < 1.0) {
        descEl.innerHTML = `<b style="color:var(--amber)">Small detuning.</b> Oscillations are <i>faster</i> (generalized Rabi Ω' = √(Ω² + δ²)) but don't reach the top — the ceiling is ${(maxP * 100).toFixed(0)}%. So you can still wiggle the qubit, but you cannot fully flip it with this mistuned drive.`;
      } else {
        descEl.innerHTML = `<b style="color:var(--magenta)">Large detuning.</b> The drive is almost useless — the qubit barely moves. Ceiling: ${(maxP * 100).toFixed(0)}%. <span style="color:var(--ink-faint)">Qubit frequency drift is an engineering crisis precisely because of this: your calibrated pulse can stop behaving like the intended gate.</span>`;
      }
    }

    seen.add(delta < -0.3 ? 'neg' : (delta > 0.3 ? 'pos' : 'zero'));
    draw();
    if (seen.size >= 2) markDone('t10-3');
  }

  if (detuneSlider) detuneSlider.addEventListener('input', update);
  update();
})();

/* ---- T10 Step 4: Ramsey sequence — fringes + T2* envelope ---- */
(function initT10Step4() {
  const svg = document.getElementById('t10-ramsey-curve');
  const tauSlider = document.getElementById('t10-ramsey-tau');
  const tauVal = document.getElementById('t10-ramsey-tau-val');
  const t2sSlider = document.getElementById('t10-ramsey-t2s');
  const t2sVal = document.getElementById('t10-ramsey-t2s-val');
  const descEl = document.getElementById('t10-ramsey-desc');
  const seen = new Set();

  // Ramsey: π/2 → free precess τ with detuning δ → π/2 → measure
  // P(|1⟩) = 0.5 * (1 - cos(δτ) * exp(-τ/T2*))
  const delta = 2.0; // fixed small detuning to make fringes visible
  function ramsey(tau, T2s) {
    const env = Math.exp(-tau / T2s);
    return 0.5 * (1 - Math.cos(delta * tau) * env);
  }

  function draw() {
    if (!svg) return;
    const mkEl = window.t10MkEl;
    svg.innerHTML = '';
    const W = 460, H = 230, padL = 44, padR = 16, padT = 18, padB = 32;
    const innerW = W - padL - padR;
    const innerH = H - padT - padB;
    const tauMax = 8;
    const T2s = parseFloat(t2sSlider.value);
    const tau = parseFloat(tauSlider.value);

    function xMap(t) { return padL + (t / tauMax) * innerW; }
    function yMap(p) { return padT + (1 - p) * innerH; }

    svg.appendChild(mkEl('line', { x1: padL, y1: padT, x2: padL, y2: H - padB, stroke: 'var(--line-bright)', 'stroke-width': 1 }));
    svg.appendChild(mkEl('line', { x1: padL, y1: H - padB, x2: W - padR, y2: H - padB, stroke: 'var(--line-bright)', 'stroke-width': 1 }));

    svg.appendChild(mkEl('text', {
      x: 10, y: padT + 10, 'font-family': 'var(--mono)',
      'font-size': 10, fill: 'var(--ink-faint)'
    }, 'P(|1⟩)'));
    svg.appendChild(mkEl('text', {
      x: W - padR, y: H - 12, 'font-family': 'var(--mono)',
      'font-size': 10, fill: 'var(--ink-faint)', 'text-anchor': 'end'
    }, 'wait time τ'));
    svg.appendChild(mkEl('text', {
      x: W - padR, y: padT + 14, 'font-family': 'var(--mono)',
      'font-size': 10, fill: 'var(--ink-faint)', 'text-anchor': 'end'
    }, `fixed detuning δ = ${delta.toFixed(1)} (arb. units)`));

    // envelope (upper/lower)
    let dUp = '', dLo = '';
    const samples = 320;
    for (let i = 0; i <= samples; i++) {
      const t = (i / samples) * tauMax;
      const env = Math.exp(-t / T2s);
      const up = 0.5 + 0.5 * env;
      const lo = 0.5 - 0.5 * env;
      dUp += i === 0 ? `M ${xMap(t)} ${yMap(up)}` : ` L ${xMap(t)} ${yMap(up)}`;
      dLo += i === 0 ? `M ${xMap(t)} ${yMap(lo)}` : ` L ${xMap(t)} ${yMap(lo)}`;
    }
    svg.appendChild(mkEl('path', {
      d: dUp, fill: 'none', stroke: 'var(--magenta)', 'stroke-width': 1.25,
      'stroke-dasharray': '3 4', opacity: 0.75
    }));
    svg.appendChild(mkEl('path', {
      d: dLo, fill: 'none', stroke: 'var(--magenta)', 'stroke-width': 1.25,
      'stroke-dasharray': '3 4', opacity: 0.75
    }));
    svg.appendChild(mkEl('text', {
      x: xMap(tauMax * 0.55), y: yMap(0.5 + 0.5 * Math.exp(-tauMax * 0.55 / T2s)) - 6,
      'font-family': 'var(--mono)', 'font-size': 10, fill: 'var(--magenta)'
    }, `envelope ~ exp(−τ/T2*)`));

    // fringes
    let d = '';
    for (let i = 0; i <= samples; i++) {
      const t = (i / samples) * tauMax;
      const p = ramsey(t, T2s);
      d += i === 0 ? `M ${xMap(t)} ${yMap(p)}` : ` L ${xMap(t)} ${yMap(p)}`;
    }
    svg.appendChild(mkEl('path', {
      d, fill: 'none', stroke: 'var(--mint)', 'stroke-width': 2.3, 'stroke-linecap': 'round'
    }));

    // marker at current τ
    const pMark = ramsey(tau, T2s);
    svg.appendChild(mkEl('line', {
      x1: xMap(tau), y1: padT, x2: xMap(tau), y2: H - padB,
      stroke: 'var(--amber)', 'stroke-width': 1.25, 'stroke-dasharray': '4 5', opacity: 0.75
    }));
    svg.appendChild(mkEl('circle', {
      cx: xMap(tau), cy: yMap(pMark), r: 6,
      fill: 'var(--amber)', stroke: 'var(--bg-0)', 'stroke-width': 2
    }));
    svg.appendChild(mkEl('text', {
      x: xMap(tau) + 8, y: yMap(pMark) - 8, 'font-family': 'var(--mono)',
      'font-size': 10, fill: 'var(--amber)'
    }, `τ = ${tau.toFixed(2)} → P = ${(pMark * 100).toFixed(0)}%`));

    [0, 0.5, 1].forEach(v => {
      svg.appendChild(mkEl('text', {
        x: padL - 6, y: yMap(v) + 4, 'font-family': 'var(--mono)',
        'font-size': 10, fill: 'var(--ink-faint)', 'text-anchor': 'end'
      }, v.toFixed(v === 0.5 ? 1 : 0)));
    });
  }

  function update() {
    if (!tauSlider || !t2sSlider) return;
    if (tauVal) tauVal.textContent = parseFloat(tauSlider.value).toFixed(2);
    if (t2sVal) t2sVal.textContent = parseFloat(t2sSlider.value).toFixed(2);
    seen.add(parseFloat(t2sSlider.value).toFixed(1));
    draw();

    if (descEl) {
      descEl.innerHTML =
        `Ramsey is a pulse triple: <b>π/2 → wait τ → π/2 → measure</b>. ` +
        `A first π/2 pulse tips the state from the pole to the equator; during the wait, it precesses around z because of tiny frequency drift. ` +
        `The second π/2 converts that hidden phase angle into a measurable population fringe. ` +
        `<b style="color:var(--magenta)">The envelope decay rate is exactly T2* — the thing you met abstractly in Tutorial 9.</b>`;
    }
    if (seen.size >= 2) markDone('t10-4');
  }

  if (tauSlider) tauSlider.addEventListener('input', update);
  if (t2sSlider) t2sSlider.addEventListener('input', update);
  update();
})();

/* ---- T10 Step 5: Hahn echo — one extra π-pulse refocuses drift ---- */
(function initT10Step5() {
  const svg = document.getElementById('t10-echo-curve');
  const descEl = document.getElementById('t10-echo-desc');
  const seqSvg = document.getElementById('t10-echo-seq');
  const palette = document.getElementById('t10-builder-palette');
  const timeline = document.getElementById('t10-builder-timeline');
  const runBtn = document.getElementById('t10-builder-run');
  const clearBtn = document.getElementById('t10-builder-clear');
  const slots = timeline ? Array.from(timeline.querySelectorAll('.t10-drop-slot')) : [];
  const built = new Array(slots.length).fill(null);
  let seenRamsey = false;
  let seenEcho = false;
  let mode = 'ramsey';

  // Ramsey envelope decays as exp(-τ/T2*) because slow frequency drift dephases.
  // Echo inserts a π-pulse at τ/2 — slow drift is refocused. Residual decay is
  // from fast (non-refocusable) noise only: exp(-τ/T2) with T2 > T2*.
  const T2s = 2.0;   // Ramsey time
  const T2  = 6.0;   // Echo (T2) — longer
  const delta = 2.0;

  function ramsey(tau) { return 0.5 * (1 - Math.cos(delta * tau) * Math.exp(-tau / T2s)); }
  function echo(tau)   { return 0.5 * (1 - Math.exp(-tau / T2)); } // refocused: no fringe, slower decay

  function draw() {
    if (!svg) return;
    const mkEl = window.t10MkEl;
    svg.innerHTML = '';
    const W = 460, H = 220, padL = 44, padR = 16, padT = 18, padB = 32;
    const innerW = W - padL - padR;
    const innerH = H - padT - padB;
    const tauMax = 10;

    function xMap(t) { return padL + (t / tauMax) * innerW; }
    function yMap(p) { return padT + (1 - p) * innerH; }

    svg.appendChild(mkEl('line', { x1: padL, y1: padT, x2: padL, y2: H - padB, stroke: 'var(--line-bright)', 'stroke-width': 1 }));
    svg.appendChild(mkEl('line', { x1: padL, y1: H - padB, x2: W - padR, y2: H - padB, stroke: 'var(--line-bright)', 'stroke-width': 1 }));

    svg.appendChild(mkEl('text', {
      x: 10, y: padT + 10, 'font-family': 'var(--mono)',
      'font-size': 10, fill: 'var(--ink-faint)'
    }, 'P(|1⟩)'));
    svg.appendChild(mkEl('text', {
      x: W - padR, y: H - 12, 'font-family': 'var(--mono)',
      'font-size': 10, fill: 'var(--ink-faint)', 'text-anchor': 'end'
    }, 'total wait τ'));

    const samples = 320;

    // Ramsey (always shown faint for reference)
    let dR = '';
    for (let i = 0; i <= samples; i++) {
      const t = (i / samples) * tauMax;
      const p = ramsey(t);
      dR += i === 0 ? `M ${xMap(t)} ${yMap(p)}` : ` L ${xMap(t)} ${yMap(p)}`;
    }
    svg.appendChild(mkEl('path', {
      d: dR, fill: 'none',
      stroke: mode === 'echo' ? 'var(--line-bright)' : 'var(--mint)',
      'stroke-width': mode === 'echo' ? 1.5 : 2.3,
      'stroke-linecap': 'round',
      opacity: mode === 'echo' ? 0.55 : 1
    }));

    if (mode === 'echo') {
      let dE = '';
      for (let i = 0; i <= samples; i++) {
        const t = (i / samples) * tauMax;
        const p = echo(t);
        dE += i === 0 ? `M ${xMap(t)} ${yMap(p)}` : ` L ${xMap(t)} ${yMap(p)}`;
      }
      svg.appendChild(mkEl('path', {
        d: dE, fill: 'none', stroke: 'var(--cyan)', 'stroke-width': 2.5, 'stroke-linecap': 'round'
      }));
      svg.appendChild(mkEl('text', {
        x: W - padR - 4, y: padT + 14, 'font-family': 'var(--mono)',
        'font-size': 10, fill: 'var(--cyan)', 'text-anchor': 'end'
      }, 'echo: refocused, decays as T2'));
    } else {
      svg.appendChild(mkEl('text', {
        x: W - padR - 4, y: padT + 14, 'font-family': 'var(--mono)',
        'font-size': 10, fill: 'var(--mint)', 'text-anchor': 'end'
      }, 'Ramsey: fringes under T2* envelope'));
    }

    [0, 0.5, 1].forEach(v => {
      svg.appendChild(mkEl('text', {
        x: padL - 6, y: yMap(v) + 4, 'font-family': 'var(--mono)',
        'font-size': 10, fill: 'var(--ink-faint)', 'text-anchor': 'end'
      }, v.toFixed(v === 0.5 ? 1 : 0)));
    });
  }

  function drawSequence() {
    if (!seqSvg) return;
    const mkEl = window.t10MkEl;
    seqSvg.innerHTML = '';
    const W = 460, H = 80, padL = 30, padR = 14, mid = H / 2;
    const innerW = W - padL - padR;

    // time axis
    seqSvg.appendChild(mkEl('line', {
      x1: padL, y1: mid, x2: W - padR, y2: mid,
      stroke: 'var(--line-bright)', 'stroke-width': 1
    }));

    // pulse markers
    function pulseMark(xFrac, label, color, width = 8, height = 26) {
      const x = padL + xFrac * innerW;
      seqSvg.appendChild(mkEl('rect', {
        x: x - width / 2, y: mid - height / 2,
        width, height, rx: 2,
        fill: color, opacity: 0.9
      }));
      seqSvg.appendChild(mkEl('text', {
        x, y: mid - height / 2 - 6,
        'font-family': 'var(--mono)', 'font-size': 10,
        fill: color, 'text-anchor': 'middle'
      }, label));
    }

    pulseMark(0.02, 'π/2', 'var(--amber)');
    if (mode === 'echo') {
      pulseMark(0.5, 'π', 'var(--magenta)', 10, 34);
    }
    pulseMark(0.98, 'π/2', 'var(--amber)');

    // readout marker
    seqSvg.appendChild(mkEl('text', {
      x: W - padR, y: mid + 22, 'font-family': 'var(--mono)',
      'font-size': 10, fill: 'var(--ink-faint)', 'text-anchor': 'end'
    }, 'measure →'));

    seqSvg.appendChild(mkEl('text', {
      x: padL, y: mid + 22, 'font-family': 'var(--mono)',
      'font-size': 10, fill: 'var(--ink-faint)'
    }, mode === 'echo' ? 'Hahn echo sequence' : 'Ramsey sequence'));
  }

  function updateDesc() {
    if (!descEl) return;
    if (mode !== 'echo') {
      descEl.innerHTML =
        `<b style="color:var(--mint)">Ramsey (echo off).</b> Fringes damp under the T2* envelope. ` +
        `Every slow frequency wobble shows up as dephasing, so phase errors add rather than cancel.`;
    } else {
      descEl.innerHTML =
        `<b style="color:var(--cyan)">Hahn echo on.</b> The middle π-pulse flips the Bloch vector, ` +
        `so whatever phase drift accumulated in the first half gets <i>undone</i> in the second half. ` +
        `Slow drift cancels; only fast (non-refocusable) noise is left. Coherence envelope now decays as T2, which is longer than T2*.<a id="fnref-t10-2" class="expert-fn-ref" href="#fn-t10-2"><sup>[E2]</sup></a> In short: echo acts like a rewind for slow errors, but not for rapid random kicks. ` +
        `<span id="fn-t10-2" style="display:block;margin-top:6px;color:var(--ink-faint)">[E2] The simplified model here shows T2 echo decay as a clean exponential, which is accurate when the residual noise is white (flat spectral density). In practice, superconducting qubits are dominated by 1/f noise — flux noise and charge noise whose power spectral density grows at low frequencies. For 1/f noise, the echo acts as a high-pass filter: it suppresses noise components slower than roughly 1/τ, where τ is the total free-precession time. This means the effective T2 measured by echo can itself depend on τ — longer wait times sample lower-frequency noise that the echo can no longer refocus, so the decay is not a pure exponential. This is why experimentalists fit echo decay curves carefully and why more sophisticated pulse sequences (CPMG, dynamical decoupling) use many refocusing pulses to push the high-pass filter cutoff even lower.</span> ` +
        `<span style="color:var(--ink-faint)">This is why published device cards report both T2* (Ramsey) and T2 (echo).</span>`;
    }
  }

  function classifySequence() {
    const compact = built.filter(Boolean);
    const sig = compact.join(',');
    if (sig === 'pi2,wait,pi2') return 'ramsey';
    if (sig === 'pi2,wait,pi,wait,pi2') return 'echo';
    return 'invalid';
  }

  function refreshTimeline() {
    slots.forEach((slot, i) => {
      slot.innerHTML = '';
      const token = built[i];
      if (!token) {
        slot.textContent = `slot ${i + 1}`;
        return;
      }
      const block = document.createElement('div');
      block.className = 'slot-block';
      block.textContent = token === 'pi2' ? 'π/2' : (token === 'pi' ? 'π' : 'wait');
      block.title = 'Click to remove';
      block.addEventListener('click', () => {
        built[i] = null;
        refreshTimeline();
      });
      slot.appendChild(block);
    });
  }

  function setupDnD() {
    if (!palette || !timeline) return;
    palette.querySelectorAll('[data-block]').forEach(btn => {
      btn.addEventListener('dragstart', (evt) => {
        evt.dataTransfer.setData('t10-block', btn.dataset.block);
      });
    });

    slots.forEach(slot => {
      slot.addEventListener('dragover', (evt) => {
        evt.preventDefault();
        slot.classList.add('drop-target');
      });
      slot.addEventListener('dragleave', () => slot.classList.remove('drop-target'));
      slot.addEventListener('drop', (evt) => {
        evt.preventDefault();
        slot.classList.remove('drop-target');
        const block = evt.dataTransfer.getData('t10-block');
        if (!block) return;
        built[parseInt(slot.dataset.slot, 10)] = block;
        refreshTimeline();
      });
    });
  }

  if (runBtn) {
    runBtn.addEventListener('click', () => {
      const kind = classifySequence();
      if (kind === 'invalid') {
        if (descEl) {
          descEl.innerHTML = `<b style="color:var(--amber)">Not a known sequence yet.</b> Build either <code>π/2 → wait → π/2</code> for Ramsey or <code>π/2 → wait → π → wait → π/2</code> for Hahn echo.`;
        }
        return;
      }
      mode = kind === 'echo' ? 'echo' : 'ramsey';
      draw();
      drawSequence();
      updateDesc();
      if (kind === 'ramsey') seenRamsey = true;
      if (kind === 'echo') seenEcho = true;
      if (seenRamsey && seenEcho) markDone('t10-5');
    });
  }
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      for (let i = 0; i < built.length; i++) built[i] = null;
      refreshTimeline();
    });
  }

  setupDnD();
  refreshTimeline();
  draw();
  drawSequence();
  updateDesc();
})();

/* ---- T10 Step 6: pulse shape — square vs Gaussian, and leakage ---- */
(function initT10Step6() {
  const svg = document.getElementById('t10-shape-envelope');
  const specSvg = document.getElementById('t10-shape-spectrum');
  const shapeBtns = document.querySelectorAll('.t10-shape-btn');
  const leakEl = document.getElementById('t10-shape-leak');
  const descEl = document.getElementById('t10-shape-desc');
  let shape = 'square';
  const seen = new Set();

  // Toy leakage model: sharper pulses in time have broader spectra, so they
  // excite the qubit's |1⟩↔|2⟩ transition more. We report a relative
  // leakage score that's higher for "sharper" pulses.
  const leakScore = {
    square: 0.85,
    gaussian: 0.15,
    derag: 0.04  // DRAG-like: Gaussian with phase correction
  };

  const shapeDesc = {
    square: {
      title: 'Square pulse',
      body: 'Simple to describe, simple to implement — constant amplitude for a fixed duration. But the sharp on/off edges have broad frequency content, which drives unwanted transitions (especially |1⟩→|2⟩ leakage on transmons). Rarely used on real hardware except for rough bring-up or diagnostics.'
    },
    gaussian: {
      title: 'Gaussian pulse',
      body: 'A smooth bell curve of amplitude. Same total area (same rotation angle), but the spectrum is narrow — far less off-resonant excitation. This is the default on most modern platforms because it is a good reliability/complexity tradeoff.'
    },
    derag: {
      title: 'DRAG pulse',
      body: 'A Gaussian envelope plus a carefully tuned out-of-phase correction that cancels the leading leakage term to the |2⟩ state. Standard technique on superconducting qubits — used by IBM, Google, Rigetti. Think of it as "anti-leakage steering" added on top of a Gaussian pulse.'
    }
  };

  function envelope(t, width) {
    // t in [0, 1]; width of pulse centered at 0.5
    if (shape === 'square') {
      return (t > 0.1 && t < 0.9) ? 1 : 0;
    }
    if (shape === 'gaussian') {
      const sigma = 0.15;
      return Math.exp(-((t - 0.5) ** 2) / (2 * sigma * sigma));
    }
    if (shape === 'derag') {
      const sigma = 0.15;
      // show primary Gaussian; DRAG correction is a quadrature component, hard to show in 1D envelope
      return Math.exp(-((t - 0.5) ** 2) / (2 * sigma * sigma));
    }
    return 0;
  }

  function draw() {
    if (!svg) return;
    const mkEl = window.t10MkEl;
    svg.innerHTML = '';
    const W = 460, H = 180, padL = 40, padR = 16, padT = 18, padB = 28;
    const innerW = W - padL - padR;
    const innerH = H - padT - padB;

    function xMap(t) { return padL + t * innerW; }
    function yMap(v) { return padT + (1 - v) * innerH; }

    svg.appendChild(mkEl('line', { x1: padL, y1: padT, x2: padL, y2: H - padB, stroke: 'var(--line-bright)', 'stroke-width': 1 }));
    svg.appendChild(mkEl('line', { x1: padL, y1: H - padB, x2: W - padR, y2: H - padB, stroke: 'var(--line-bright)', 'stroke-width': 1 }));

    svg.appendChild(mkEl('text', {
      x: 10, y: padT + 10, 'font-family': 'var(--mono)',
      'font-size': 10, fill: 'var(--ink-faint)'
    }, 'Ω(t)'));
    svg.appendChild(mkEl('text', {
      x: W - padR, y: H - 10, 'font-family': 'var(--mono)',
      'font-size': 10, fill: 'var(--ink-faint)', 'text-anchor': 'end'
    }, 'time'));

    // envelope curve
    let d = '';
    const samples = 240;
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const v = envelope(t);
      const X = xMap(t), Y = yMap(v);
      d += i === 0 ? `M ${X} ${Y}` : ` L ${X} ${Y}`;
    }
    svg.appendChild(mkEl('path', {
      d, fill: 'none',
      stroke: shape === 'square' ? 'var(--amber)' : (shape === 'gaussian' ? 'var(--cyan)' : 'var(--mint)'),
      'stroke-width': 2.5, 'stroke-linecap': 'round'
    }));

    // DRAG quadrature component (derivative, scaled small) for visual
    if (shape === 'derag') {
      let dQ = '';
      for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        const sigma = 0.15;
        const g = Math.exp(-((t - 0.5) ** 2) / (2 * sigma * sigma));
        const gp = -((t - 0.5) / (sigma * sigma)) * g; // derivative
        const v = 0.5 + 0.15 * gp;
        const X = xMap(t), Y = yMap(v);
        dQ += i === 0 ? `M ${X} ${Y}` : ` L ${X} ${Y}`;
      }
      svg.appendChild(mkEl('path', {
        d: dQ, fill: 'none', stroke: 'var(--magenta)', 'stroke-width': 1.5,
        'stroke-dasharray': '4 4', opacity: 0.8
      }));
      svg.appendChild(mkEl('text', {
        x: W - padR - 4, y: padT + 14, 'font-family': 'var(--mono)',
        'font-size': 10, fill: 'var(--magenta)', 'text-anchor': 'end'
      }, 'DRAG quadrature (cancels leakage)'));
    }
  }

  function drawSpectrum() {
    if (!specSvg) return;
    const mkEl = window.t10MkEl;
    specSvg.innerHTML = '';
    const W = 460, H = 180, padL = 40, padR = 16, padT = 18, padB = 28;
    const innerW = W - padL - padR;
    const innerH = H - padT - padB;
    function xMap(f) { return padL + f * innerW; }
    function yMap(v) { return padT + (1 - v) * innerH; }

    specSvg.appendChild(mkEl('line', { x1: padL, y1: padT, x2: padL, y2: H - padB, stroke: 'var(--line-bright)', 'stroke-width': 1 }));
    specSvg.appendChild(mkEl('line', { x1: padL, y1: H - padB, x2: W - padR, y2: H - padB, stroke: 'var(--line-bright)', 'stroke-width': 1 }));
    specSvg.appendChild(mkEl('text', {
      x: 10, y: padT + 10, 'font-family': 'var(--mono)', 'font-size': 10, fill: 'var(--ink-faint)'
    }, '|S(f)|'));
    specSvg.appendChild(mkEl('text', {
      x: W - padR, y: H - 10, 'font-family': 'var(--mono)', 'font-size': 10, fill: 'var(--ink-faint)', 'text-anchor': 'end'
    }, 'relative frequency'));

    const N = 96;
    const spectrum = [];
    for (let k = 0; k < N; k++) {
      const f = k / (N - 1); // normalized frequency
      let v;
      if (shape === 'square') {
        v = Math.abs(Math.sin(8 * f) / (1 + 8 * f)) * 1.4 + 0.15 * Math.exp(-f * 0.8);
      } else if (shape === 'gaussian') {
        v = Math.exp(-18 * f * f);
      } else {
        // DRAG-like: gaussian core + derivative-weighted suppression of sidelobes
        v = 0.85 * Math.exp(-20 * f * f) + 0.05 * Math.exp(-90 * (f - 0.2) * (f - 0.2));
      }
      spectrum.push(v);
    }
    const max = Math.max(...spectrum);
    let d = '';
    spectrum.forEach((raw, i) => {
      const f = i / (N - 1);
      const v = raw / max;
      const X = xMap(f);
      const Y = yMap(v);
      d += i === 0 ? `M ${X} ${Y}` : ` L ${X} ${Y}`;
    });
    specSvg.appendChild(mkEl('path', {
      d, fill: 'none',
      stroke: shape === 'square' ? 'var(--amber)' : (shape === 'gaussian' ? 'var(--cyan)' : 'var(--mint)'),
      'stroke-width': 2.3, 'stroke-linecap': 'round'
    }));

    [0, 0.5, 1].forEach(v => {
      specSvg.appendChild(mkEl('text', {
        x: padL - 6, y: yMap(v) + 4, 'font-family': 'var(--mono)', 'font-size': 10,
        fill: 'var(--ink-faint)', 'text-anchor': 'end'
      }, v.toFixed(v === 0.5 ? 1 : 0)));
    });
  }

  function updateLeak() {
    if (!leakEl) return;
    const score = leakScore[shape];
    const pct = (score * 100).toFixed(0);
    const color = score > 0.5 ? 'var(--magenta)' : (score > 0.1 ? 'var(--amber)' : 'var(--mint)');
    leakEl.innerHTML = `Relative leakage to |2⟩: <b style="color:${color}">${pct}%</b> <span style="color:var(--ink-faint)">(toy score; real leakage depends on chip & calibration).</span>`;
  }

  function updateDesc() {
    if (!descEl) return;
    const s = shapeDesc[shape];
    let extra = '';
    if (shape === 'derag') {
      extra = ` <div style="margin-top:8px;color:var(--ink-faint)"><b>Why the derivative shape appears:</b> DRAG comes from perturbation theory: the leading leakage amplitude is proportional to the time-derivative of the drive envelope. Adding a quadrature correction proportional to dΩ/dt cancels that leakage term to first order.</div>`;
    }
    descEl.innerHTML = `<b>${s.title}.</b> ${s.body}${extra}`;
  }

  shapeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      shapeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      shape = btn.dataset.t10shape;
      seen.add(shape);
      draw();
      drawSpectrum();
      updateLeak();
      updateDesc();
      if (seen.size >= 2) markDone('t10-6');
    });
  });

  // initial: make the first button active if none is
  if (shapeBtns.length && !document.querySelector('.t10-shape-btn.active')) {
    shapeBtns[0].classList.add('active');
    shape = shapeBtns[0].dataset.t10shape || 'square';
  }
  draw();
  drawSpectrum();
  updateLeak();
  updateDesc();
})();

/* ---- T10 Step 7: from pulses back to circuits — X · X echo, pulse-by-pulse ---- */
(function initT10Step7() {
  const errSlider = document.getElementById('t10-rebuild-err');
  const errVal = document.getElementById('t10-rebuild-err-val');
  const runBtn = document.getElementById('t10-rebuild-run');
  const svg = document.getElementById('t10-rebuild-bars');
  const descEl = document.getElementById('t10-rebuild-desc');
  const tries = new Set();

  /* Model: each X gate is a π-pulse with per-pulse infidelity ε. After two
     such pulses, the nominal state is |0⟩ again (X·X = I). But with error
     per gate, the P(|0⟩) at the end is roughly (1 − 2ε) for small ε; we use
     the exact two-gate depolarising form for continuity with Tutorial 4.
  */
  function xxOutcomes(epsilon) {
    // Depolarising approximation per pulse: with prob ε, the gate applies a
    // uniformly-random Pauli instead of the intended X. After two such
    // pulses starting from |0⟩:
    //   ideal path (1-ε)^2 → |0⟩
    //   one error (2ε(1-ε)) → uniform mixture over {|0⟩,|1⟩}
    //   two errors (ε^2) → uniform mixture over {|0⟩,|1⟩}
    const p0ideal = (1 - epsilon) ** 2;
    const pMix = 1 - p0ideal;
    const p0 = p0ideal + pMix * 0.5;
    const p1 = pMix * 0.5;
    return { p0, p1 };
  }

  function drawBars() {
    if (!svg) return;
    const mkEl = window.t10MkEl;
    svg.innerHTML = '';
    const W = 380, H = 180, padL = 40, padR = 14, padT = 14, padB = 32;
    const innerH = H - padT - padB;
    const epsilon = parseFloat(errSlider.value) / 100;
    const { p0, p1 } = xxOutcomes(epsilon);

    function yMap(p) { return padT + (1 - p) * innerH; }
    function barX(i) { return padL + i * 130 + 30; }

    // axes
    svg.appendChild(mkEl('line', { x1: padL, y1: padT, x2: padL, y2: H - padB, stroke: 'var(--line-bright)', 'stroke-width': 1 }));
    svg.appendChild(mkEl('line', { x1: padL, y1: H - padB, x2: W - padR, y2: H - padB, stroke: 'var(--line-bright)', 'stroke-width': 1 }));

    [0, 0.5, 1].forEach(v => {
      svg.appendChild(mkEl('text', {
        x: padL - 6, y: yMap(v) + 4, 'font-family': 'var(--mono)',
        'font-size': 10, fill: 'var(--ink-faint)', 'text-anchor': 'end'
      }, v.toFixed(v === 0.5 ? 1 : 0)));
    });

    const bars = [
      { label: '|0⟩', p: p0, color: 'var(--mint)' },
      { label: '|1⟩', p: p1, color: 'var(--magenta)' }
    ];
    bars.forEach((b, i) => {
      const bw = 82;
      const bh = Math.max(2, b.p * innerH);
      const x = barX(i);
      const y = H - padB - bh;
      svg.appendChild(mkEl('rect', {
        x, y, width: bw, height: bh, rx: 4,
        fill: b.color, opacity: 0.9
      }));
      svg.appendChild(mkEl('text', {
        x: x + bw / 2, y: y - 5, 'font-family': 'var(--mono)',
        'font-size': 11, fill: b.color, 'text-anchor': 'middle'
      }, `${(b.p * 100).toFixed(1)}%`));
      svg.appendChild(mkEl('text', {
        x: x + bw / 2, y: H - 12, 'font-family': 'var(--mono)',
        'font-size': 11, fill: 'var(--ink-faint)', 'text-anchor': 'middle'
      }, b.label));
    });

    svg.appendChild(mkEl('text', {
      x: W - padR, y: padT + 12, 'font-family': 'var(--mono)',
      'font-size': 10, fill: 'var(--ink-faint)', 'text-anchor': 'end'
    }, `ε = ${(epsilon * 100).toFixed(1)}% per pulse`));
  }

  function update() {
    if (!errSlider) return;
    const epsilon = parseFloat(errSlider.value);
    if (errVal) errVal.textContent = `${epsilon.toFixed(1)}%`;
    tries.add(Math.round(epsilon));
    drawBars();

    if (descEl) {
      const { p0 } = xxOutcomes(epsilon / 100);
      if (epsilon < 0.5) {
        descEl.innerHTML = `<b style="color:var(--mint)">Pulse infidelity ${epsilon.toFixed(1)}%</b> → X·X returns |0⟩ with ${(p0 * 100).toFixed(1)}% probability. Basically indistinguishable from a perfect gate at this scale.`;
      } else if (epsilon < 3) {
        descEl.innerHTML = `<b style="color:var(--amber)">Pulse infidelity ${epsilon.toFixed(1)}%</b> → ${(p0 * 100).toFixed(1)}%. This is where many current devices operate, though leading systems are pushing toward 0.1-0.5%, and it is why calibration loops run continuously.`;
      } else {
        descEl.innerHTML = `<b style="color:var(--magenta)">Pulse infidelity ${epsilon.toFixed(1)}%</b> → only ${(p0 * 100).toFixed(1)}%. Above a few percent per pulse, even two-gate circuits stop resembling their algorithmic spec. <span style="color:var(--ink-faint)">This is the same X·X echo you ran in Tutorial 4 — now you know the "noise slider" is pulse infidelity and why tiny per-pulse errors matter once many gates are chained.</span>`;
      }
    }

    if (tries.size >= 3) markDone('t10-7');
  }

  if (errSlider) errSlider.addEventListener('input', update);
  if (runBtn) runBtn.addEventListener('click', update);
  update();
})();

/* ---- auto-done unlock observer (final recap card) ---- */
(function initT10FinalUnlock() {
  const card = document.querySelector('[data-step="t10-8"]');
  if (card) {
    const obs = new MutationObserver(() => {
      if (!card.classList.contains('locked')) {
        markDone('t10-8');
        obs.disconnect();
      }
    });
    obs.observe(card, { attributes: true, attributeFilter: ['class'] });
  }
})();
