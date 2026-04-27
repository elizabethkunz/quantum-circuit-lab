/* =========================================================================
   TUTORIAL 11: FROM CHIP TO CIRCUIT — experimental bring-up interactives
   Plain SVG + IIFE pattern (matches T9/T10). Host markup in index.html.
   ========================================================================= */

(function initT11Helpers() {
  if (window.__t11HelpersLoaded) return;
  window.__t11HelpersLoaded = true;

  const ns = 'http://www.w3.org/2000/svg';

  window.t11MkEl = function t11MkEl(tag, attrs, text) {
    const e = document.createElementNS(ns, tag);
    for (const [k, v] of Object.entries(attrs || {})) e.setAttribute(k, String(v));
    if (text != null) e.textContent = text;
    return e;
  };

  window.t11Clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  /** Abramowitz & Stegun 7.1.26: erf, then erfc = 1 - erf */
  window.t11Erfc = function t11Erfc(x) {
    const z = Math.abs(x);
    const t = 1 / (1 + 0.3275911 * z);
    const erfAbs = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z);
    const erfX = x < 0 ? -erfAbs : erfAbs;
    return 1 - erfX;
  };

  window.t11HslColormap = function t11HslColormap(t) {
    const u = window.t11Clamp(t, 0, 1);
    if (u < 0.5) {
      const s = u * 2;
      return `hsl(${220 - s * 40}, ${70 + s * 20}%, ${22 + s * 58}%)`;
    }
    const s = (u - 0.5) * 2;
    return `hsl(${180 - s * 120}, ${90 - s * 20}%, ${80 - s * 35}%)`;
  };

  window.t11Lcg = function t11Lcg(seed) {
    let s = seed >>> 0;
    return function rand() {
      s = (1664525 * s + 1013904223) >>> 0;
      return s / 4294967296;
    };
  };

  window.t11NormRand = function t11NormRand(rng) {
    const u = rng();
    const v = rng();
    return Math.sqrt(-2 * Math.log(u + 1e-12)) * Math.cos(2 * Math.PI * v);
  };

  /** Map screen coords into SVG user space (fixes viewBox / aspect-ratio skew). */
  window.t11ClientToSvg = function t11ClientToSvg(svg, clientX, clientY) {
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const m = svg.getScreenCTM();
    if (m) return pt.matrixTransform(m.inverse());
    const vb = svg.viewBox && svg.viewBox.baseVal;
    const w = vb && vb.width ? vb.width : 400;
    const h = vb && vb.height ? vb.height : 260;
    const r = svg.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return { x: 0, y: 0 };
    return {
      x: ((clientX - r.left) / r.width) * w,
      y: ((clientY - r.top) / r.height) * h
    };
  };
})();

/* ---- Step 1: punchout heatmap ---- */
(function initT11Step1() {
  const host = document.getElementById('t11-chip-punchout-host');
  const svg = document.getElementById('t11-punchout-svg');
  const powerSl = document.getElementById('t11-punchout-power');
  const freqLbl = document.getElementById('t11-punchout-freq-label');
  const cont = document.getElementById('t11-chip-continue-1');
  if (!host || !svg || !powerSl || !cont) return;

  const W = 400;
  const H = 220;
  const ml = 48;
  const mr = 12;
  const mt = 10;
  const mb = 36;
  const plotW = W - ml - mr;
  const plotH = H - mt - mb;

  const fMin = 4.5;
  const fMax = 5.5;
  const pMin = -40;
  const pMax = 0;
  const fR = 5.05;
  const chiGhz = 0.001;
  const pSat = -20;
  const gamma0 = 0.012;

  function fDipDbm(pDbm) {
    const t = Math.tanh((pDbm - pSat) / 7);
    return fR + chiGhz * (1 - t);
  }

  function lorentz(f, f0, g) {
    return 1 / (1 + Math.pow((f - f0) / g, 2));
  }

  function transmission(f, pDbm) {
    const fd = fDipDbm(pDbm);
    const pLin = Math.pow(10, (pDbm + 40) / 20);
    const broad = 1 + 0.015 * pLin * pLin;
    const g = gamma0 * Math.sqrt(broad);
    return window.t11Clamp(1 - 0.55 * lorentz(f, fd, g) / broad, 0.05, 1);
  }

  const nCol = 100;
  const nRow = 50;
  let identified = false;

  function xToF(clientX, clientY) {
    const { x: rx } = window.t11ClientToSvg(svg, clientX, clientY);
    return fMin + ((rx - ml) / plotW) * (fMax - fMin);
  }

  function paint() {
    svg.innerHTML = '';
    const mk = window.t11MkEl;

    for (let ri = 0; ri < nRow; ri++) {
      const pDbm = pMin + (ri / (nRow - 1)) * (pMax - pMin);
      for (let ci = 0; ci < nCol; ci++) {
        const f = fMin + (ci / (nCol - 1)) * (fMax - fMin);
        const T = transmission(f, pDbm);
        const x = ml + (ci / (nCol - 1)) * plotW;
        const y = mt + (ri / (nRow - 1)) * plotH;
        const rw = plotW / (nCol - 1) + 0.6;
        const rh = plotH / (nRow - 1) + 0.6;
        svg.appendChild(mk('rect', {
          x: x - rw / 2,
          y: y - rh / 2,
          width: rw,
          height: rh,
          fill: window.t11HslColormap(1 - T),
          'stroke-width': 0
        }));
      }
    }

    svg.appendChild(mk('text', {
      x: ml,
      y: H - 8,
      'font-family': 'var(--mono)',
      'font-size': 10,
      fill: 'var(--ink-faint)'
    }, 'frequency (GHz) →'));

    svg.appendChild(mk('text', {
      x: 10,
      y: mt + plotH / 2,
      'font-family': 'var(--mono)',
      'font-size': 10,
      fill: 'var(--ink-faint)',
      transform: `rotate(-90 10 ${mt + plotH / 2})`
    }, 'power (dBm) ↑'));

    const pSel = Number(powerSl.value);
    const rowFrac = (pSel - pMin) / (pMax - pMin);
    const yLine = mt + rowFrac * plotH;
    svg.appendChild(mk('line', {
      x1: ml,
      y1: yLine,
      x2: ml + plotW,
      y2: yLine,
      stroke: 'var(--magenta)',
      'stroke-width': 2,
      'stroke-dasharray': '6 4',
      opacity: 0.95
    }));

    const fd = fDipDbm(pSel);
    if (freqLbl) freqLbl.textContent = `Dip at ~${fd.toFixed(3)} GHz @ ${pSel.toFixed(0)} dBm (model)`;
  }

  powerSl.addEventListener('input', paint);

  svg.addEventListener('click', (ev) => {
    const pSel = Number(powerSl.value);
    if (pSel > -18) return;
    const { y: ry } = window.t11ClientToSvg(svg, ev.clientX, ev.clientY);
    const rowFrac = (pSel - pMin) / (pMax - pMin);
    const yLine = mt + rowFrac * plotH;
    if (Math.abs(ry - yLine) > plotH * 0.08) return;
    const fClick = xToF(ev.clientX, ev.clientY);
    const fd = fDipDbm(pSel);
    if (Math.abs(fClick - fd) < 0.025) {
      identified = true;
      cont.disabled = false;
      const hint = document.getElementById('t11-punchout-hint');
      if (hint) {
        hint.textContent = 'Mode identified — dispersive dip in the low-power row. Continue when ready.';
        hint.style.color = 'var(--mint)';
      }
    } else {
      const hint = document.getElementById('t11-punchout-hint');
      if (hint) {
        hint.textContent = 'Click closer to the dark vertical feature at the selected (low) power.';
        hint.style.color = 'var(--ink-faint)';
      }
    }
  });

  cont.disabled = true;
  cont.addEventListener('click', () => {
    if (identified) markDone('t11-1');
  });

  paint();
})();

/* ---- Step 2: qubit spectroscopy ---- */
(function initT11Step2() {
  const svg = document.getElementById('t11-spec-svg');
  const lbl = document.getElementById('t11-spec-f01-label');
  const cont = document.getElementById('t11-chip-continue-2');
  const lowP = document.getElementById('t11-spec-power-low');
  const highP = document.getElementById('t11-spec-power-high');
  if (!svg || !cont) return;

  const W = 400;
  const H = 200;
  const ml = 44;
  const mr = 14;
  const mt = 14;
  const mb = 32;
  const plotW = W - ml - mr;
  const plotH = H - mt - mb;

  const fMin = 4.95;
  const fMax = 5.35;
  const f01 = 5.23;
  const f02h = 5.08;
  let highDrive = false;
  let found = false;

  function trace(f) {
    const g1 = 0.003;
    const g2 = 0.004;
    let y = 1;
    y -= 0.22 / (1 + Math.pow((f - f01) / g1, 2));
    if (highDrive) y -= 0.08 / (1 + Math.pow((f - f02h) / g2, 2));
    return y;
  }

  function draw() {
    svg.innerHTML = '';
    const mk = window.t11MkEl;
    const pts = [];
    const n = 200;
    for (let i = 0; i <= n; i++) {
      const f = fMin + (i / n) * (fMax - fMin);
      const y = trace(f);
      const px = ml + ((f - fMin) / (fMax - fMin)) * plotW;
      const py = mt + plotH - y * plotH;
      pts.push(`${px},${py}`);
    }
    svg.appendChild(mk('polyline', {
      points: pts.join(' '),
      fill: 'none',
      stroke: 'var(--mint)',
      'stroke-width': 2
    }));

    svg.appendChild(mk('text', {
      x: ml,
      y: H - 6,
      'font-family': 'var(--mono)',
      'font-size': 10,
      fill: 'var(--ink-faint)'
    }, 'probe frequency (GHz)'));

    svg.appendChild(mk('text', {
      x: 8,
      y: mt + plotH / 2,
      'font-family': 'var(--mono)',
      'font-size': 10,
      fill: 'var(--ink-faint)',
      transform: `rotate(-90 8 ${mt + plotH / 2})`
    }, 'S21 (arb.)'));

    if (found) {
      const px = ml + ((f01 - fMin) / (fMax - fMin)) * plotW;
      const py = mt + plotH - trace(f01) * plotH;
      svg.appendChild(mk('circle', { cx: px, cy: py, r: 7, fill: 'none', stroke: 'var(--magenta)', 'stroke-width': 2 }));
      svg.appendChild(mk('text', {
        x: px + 10,
        y: py - 10,
        'font-family': 'var(--mono)',
        'font-size': 11,
        fill: 'var(--magenta)'
      }, '\u03c9\u2080\u2081'));
    }

    if (lbl) {
      if (found) lbl.textContent = `Marked ω₀₁ ≈ ${f01.toFixed(2)} GHz`;
      else lbl.textContent = highDrive ? 'High drive: watch for extra structure near 5.08 GHz (toy two-photon).' : 'Low drive: click the deepest dip to mark ω₀₁.';
    }
  }

  function setHigh(h) {
    highDrive = h;
    if (lowP) lowP.checked = !h;
    if (highP) highP.checked = h;
    found = false;
    cont.disabled = true;
    draw();
  }

  if (lowP) lowP.addEventListener('change', () => setHigh(false));
  if (highP) highP.addEventListener('change', () => setHigh(true));

  svg.addEventListener('click', (ev) => {
    if (found) return;
    const { x: rx } = window.t11ClientToSvg(svg, ev.clientX, ev.clientY);
    const f = fMin + ((rx - ml) / plotW) * (fMax - fMin);
    if (Math.abs(f - f01) <= 0.03) {
      found = true;
      cont.disabled = false;
      draw();
    }
  });

  cont.disabled = true;
  cont.addEventListener('click', () => {
    if (found) markDone('t11-2');
  });

  setHigh(false);
})();

/* ---- Step 3: IQ plane ---- */
(function initT11Step3() {
  const svg = document.getElementById('t11-iq-svg');
  const snrSl = document.getElementById('t11-iq-snr');
  const rotSl = document.getElementById('t11-iq-rotation');
  const modeAvg = document.getElementById('t11-iq-mode-avg');
  const modeShot = document.getElementById('t11-iq-mode-shot');
  const fidEl = document.getElementById('t11-iq-fidelity');
  const cont = document.getElementById('t11-chip-continue-3');
  if (!svg || !snrSl || !rotSl || !cont) return;

  const W = 380;
  const H = 320;
  const pad = 36;
  const plotSz = Math.min(W, H) - pad * 2;
  const cx0 = W / 2;
  const cy0 = H / 2;
  const scale = plotSz / 2.2;

  let shots0 = [];
  let shots1 = [];
  let threshold = 0;
  let dragging = false;
  let averageMode = false;
  let snrTouched = false;
  const nShot = 150;
  const seed = 20250427;

  function rot(I, Q, ang) {
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    return { I: I * c - Q * s, Q: I * s + Q * c };
  }

  function regen() {
    const snr = Number(snrSl.value);
    const rng = window.t11Lcg(seed);
    const sigma = 0.12;
    const D = snr * sigma;
    shots0 = [];
    shots1 = [];
    for (let i = 0; i < nShot; i++) {
      const i0 = -D / 2 + sigma * window.t11NormRand(rng);
      const q0 = sigma * window.t11NormRand(rng);
      const i1 = D / 2 + sigma * window.t11NormRand(rng);
      const q1 = sigma * window.t11NormRand(rng);
      shots0.push({ I: i0, Q: q0 });
      shots1.push({ I: i1, Q: q1 });
    }
  }

  function drawThresholdGutter() {
    const mk = window.t11MkEl;
    const ang = (Number(rotSl.value) * Math.PI) / 180;
    const xTh = cx0 + threshold * scale * Math.cos(ang);
    const yTh = cy0 + threshold * scale * Math.sin(ang);
    const len = plotSz * 0.75;
    const nx = -Math.sin(ang);
    const ny = Math.cos(ang);
    svg.appendChild(mk('line', {
      x1: xTh - nx * len,
      y1: yTh - ny * len,
      x2: xTh + nx * len,
      y2: yTh + ny * len,
      stroke: 'var(--magenta)',
      'stroke-width': 2,
      'stroke-dasharray': '5 4',
      opacity: 0.9
    }));
  }

  function classify(I) {
    return I < threshold ? 0 : 1;
  }

  function fidelityFromDots() {
    const ang = (Number(rotSl.value) * Math.PI) / 180;
    let c = 0;
    let tot = 0;
    for (const p of shots0) {
      tot++;
      const r = rot(p.I, p.Q, ang);
      if (classify(r.I) === 0) c++;
    }
    for (const p of shots1) {
      tot++;
      const r = rot(p.I, p.Q, ang);
      if (classify(r.I) === 1) c++;
    }
    return tot ? c / tot : 0;
  }

  function theoreticalFA(snr) {
    const sigma = 0.12;
    const D = snr * sigma;
    return 1 - 0.5 * window.t11Erfc(D / (2 * sigma * Math.sqrt(2)));
  }

  function paint() {
    svg.innerHTML = '';
    const mk = window.t11MkEl;
    const ang = (Number(rotSl.value) * Math.PI) / 180;

    svg.appendChild(mk('line', {
      x1: pad,
      y1: cy0,
      x2: W - pad,
      y2: cy0,
      stroke: 'var(--line-bright)',
      'stroke-width': 1,
      opacity: 0.35
    }));
    svg.appendChild(mk('line', {
      x1: cx0,
      y1: pad,
      x2: cx0,
      y2: H - pad,
      stroke: 'var(--line-bright)',
      'stroke-width': 1,
      opacity: 0.35
    }));
    svg.appendChild(mk('text', {
      x: W - pad - 4,
      y: cy0 - 6,
      'font-family': 'var(--mono)',
      'font-size': 10,
      fill: 'var(--ink-faint)',
      'text-anchor': 'end'
    }, 'I'));
    svg.appendChild(mk('text', {
      x: cx0 + 6,
      y: pad + 12,
      'font-family': 'var(--mono)',
      'font-size': 10,
      fill: 'var(--ink-faint)'
    }, 'Q'));

    const drawCloud = (pts, color, isAvg) => {
      if (isAvg) {
        let sI = 0;
        let sQ = 0;
        for (const p of pts) {
          const r = rot(p.I, p.Q, ang);
          sI += r.I;
          sQ += r.Q;
        }
        const n = pts.length;
        const mI = sI / n;
        const mQ = sQ / n;
        const px = cx0 + mI * scale;
        const py = cy0 - mQ * scale;
        svg.appendChild(mk('ellipse', {
          cx: px,
          cy: py,
          rx: 10,
          ry: 10,
          fill: color,
          opacity: 0.85,
          stroke: 'var(--bg-0)',
          'stroke-width': 2
        }));
        return;
      }
      for (const p of pts) {
        const r = rot(p.I, p.Q, ang);
        const px = cx0 + r.I * scale;
        const py = cy0 - r.Q * scale;
        const tr = classify(r.I);
        const mis = (pts === shots0 && tr === 1) || (pts === shots1 && tr === 0);
        svg.appendChild(mk('circle', {
          cx: px,
          cy: py,
          r: 2.2,
          fill: mis ? 'var(--ink-faint)' : color,
          opacity: mis ? 0.45 : 0.78
        }));
      }
    };

    if (averageMode) {
      drawCloud(shots0, 'var(--mint)', true);
      drawCloud(shots1, '#e8a045', true);
    } else {
      drawCloud(shots0, 'var(--mint)', false);
      drawCloud(shots1, '#e8a045', false);
    }

    drawThresholdGutter();

    const snr = Number(snrSl.value);
    const fNum = fidelityFromDots();
    const fTh = theoreticalFA(snr);
    if (fidEl) {
      fidEl.textContent = `${(100 * fNum).toFixed(1)}% assignment (dots) · ${(100 * fTh).toFixed(1)}% ideal symmetric`;
    }

    const D = snr * 0.12;
    const tol = 0.15 * (D / 2);
    const okTh = Math.abs(threshold) <= tol;
    if (okTh && snrTouched) cont.disabled = false;
    else cont.disabled = true;
  }

  snrSl.addEventListener('input', () => {
    snrTouched = true;
    regen();
    paint();
  });
  rotSl.addEventListener('input', paint);

  if (modeAvg) modeAvg.addEventListener('change', () => {
    if (modeAvg.checked) averageMode = true;
    paint();
  });
  if (modeShot) modeShot.addEventListener('change', () => {
    if (modeShot.checked) averageMode = false;
    paint();
  });

  function clientToThreshold(clientX, clientY) {
    const { x: rx, y: ry } = window.t11ClientToSvg(svg, clientX, clientY);
    const Iraw = (rx - cx0) / scale;
    const Qraw = -(ry - cy0) / scale;
    const ang = (Number(rotSl.value) * Math.PI) / 180;
    return Iraw * Math.cos(ang) - Qraw * Math.sin(ang);
  }

  svg.addEventListener('pointerdown', (ev) => {
    dragging = true;
    svg.setPointerCapture(ev.pointerId);
    threshold = clientToThreshold(ev.clientX, ev.clientY);
    paint();
  });
  svg.addEventListener('pointermove', (ev) => {
    if (!dragging) return;
    threshold = clientToThreshold(ev.clientX, ev.clientY);
    paint();
  });
  svg.addEventListener('pointerup', () => { dragging = false; });
  svg.addEventListener('pointercancel', () => { dragging = false; });

  cont.addEventListener('click', () => markDone('t11-3'));

  regen();
  paint();
})();

/* ---- Step 4: chevron ---- */
(function initT11Step4() {
  const svg = document.getElementById('t11-chevron-svg');
  const omegaSl = document.getElementById('t11-chevron-detune');
  const piLbl = document.getElementById('t11-chevron-pi-label');
  const cont = document.getElementById('t11-chip-continue-4');
  if (!svg || !omegaSl || !cont) return;

  const W = 400;
  const H = 280;
  const ml = 50;
  const mr = 14;
  const mt = 12;
  const mb = 40;
  const plotW = W - ml - mr;
  const plotH = H - mt - mb;

  const tauMaxNs = 200;
  const dMinMHz = -40;
  const dMaxMHz = 40;
  const nTau = 80;
  const nDel = 50;

  let marked = false;
  let markTau = null;
  let markDel = null;

  function p1(tauNs, deltaMHz, omegaRadPerNs) {
    const deltaRadPerNs = 2 * Math.PI * deltaMHz * 1e-3;
    const Om = omegaRadPerNs;
    const De = deltaRadPerNs;
    const w = Math.sqrt(Om * Om + De * De);
    if (w < 1e-9) return 0;
    const r = Om / w;
    return r * r * Math.pow(Math.sin(w * tauNs / 2), 2);
  }

  function omegaNow() {
    return Number(omegaSl.value);
  }

  function tauPiNs() {
    return Math.PI / omegaNow();
  }

  function draw() {
    svg.innerHTML = '';
    const mk = window.t11MkEl;
    const Om = omegaNow();
    const tpi = tauPiNs();

    for (let j = 0; j < nDel; j++) {
      const dMHz = dMinMHz + (j / (nDel - 1)) * (dMaxMHz - dMinMHz);
      for (let i = 0; i < nTau; i++) {
        const tau = (i / (nTau - 1)) * tauMaxNs;
        const p = p1(tau, dMHz, Om);
        const x = ml + (i / (nTau - 1)) * plotW;
        const y = mt + (j / (nDel - 1)) * plotH;
        const rw = plotW / (nTau - 1) + 0.5;
        const rh = plotH / (nDel - 1) + 0.5;
        svg.appendChild(mk('rect', {
          x: x - rw / 2,
          y: y - rh / 2,
          width: rw,
          height: rh,
          fill: window.t11HslColormap(p),
          'stroke-width': 0
        }));
      }
    }

    const y0 = mt + ((0 - dMinMHz) / (dMaxMHz - dMinMHz)) * plotH;
    svg.appendChild(mk('line', {
      x1: ml,
      y1: y0,
      x2: ml + plotW,
      y2: y0,
      stroke: 'var(--magenta)',
      'stroke-width': 1,
      'stroke-dasharray': '4 4',
      opacity: 0.7
    }));

    const iPi = (tpi / tauMaxNs) * (nTau - 1);
    const xPi = ml + (iPi / (nTau - 1)) * plotW;
    svg.appendChild(mk('line', {
      x1: xPi,
      y1: mt,
      x2: xPi,
      y2: mt + plotH,
      stroke: 'var(--mint)',
      'stroke-width': 1,
      'stroke-dasharray': '4 4',
      opacity: 0.6
    }));

    if (marked && markTau != null && markDel != null) {
      const xi = ml + (markTau / tauMaxNs) * plotW;
      const dj = (markDel - dMinMHz) / (dMaxMHz - dMinMHz);
      const yj = mt + dj * plotH;
      svg.appendChild(mk('circle', { cx: xi, cy: yj, r: 8, fill: 'none', stroke: 'var(--magenta)', 'stroke-width': 2 }));
    }

    svg.appendChild(mk('text', {
      x: ml,
      y: H - 8,
      'font-family': 'var(--mono)',
      'font-size': 10,
      fill: 'var(--ink-faint)'
    }, 'pulse duration τ (ns) →'));

    svg.appendChild(mk('text', {
      x: 8,
      y: mt + plotH / 2,
      'font-family': 'var(--mono)',
      'font-size': 10,
      fill: 'var(--ink-faint)',
      transform: `rotate(-90 8 ${mt + plotH / 2})`
    }, 'Δ (MHz)'));

    if (piLbl) piLbl.textContent = `On-resonance π-time ≈ ${tpi.toFixed(1)} ns (Ω = ${Om.toFixed(4)} rad/ns)`;

    const insetX = ml + plotW - 108;
    const insetY = mt + 6;
    const insetW = 100;
    const insetH = 56;
    svg.appendChild(mk('rect', {
      x: insetX,
      y: insetY,
      width: insetW,
      height: insetH,
      fill: 'var(--bg-0)',
      stroke: 'var(--line)',
      'stroke-width': 1,
      rx: 4,
      opacity: 0.92
    }));
    const ptsR = [];
    const nr = 40;
    for (let i = 0; i <= nr; i++) {
      const tau = (i / nr) * tauMaxNs;
      const p = p1(tau, 0, Om);
      const ix = insetX + 8 + (i / nr) * (insetW - 16);
      const iy = insetY + insetH - 8 - p * (insetH - 16);
      ptsR.push(`${ix},${iy}`);
    }
    svg.appendChild(mk('polyline', {
      points: ptsR.join(' '),
      fill: 'none',
      stroke: 'var(--mint)',
      'stroke-width': 1.5
    }));
    svg.appendChild(mk('text', {
      x: insetX + 4,
      y: insetY + 11,
      'font-family': 'var(--mono)',
      'font-size': 8,
      fill: 'var(--ink-faint)'
    }, 'P1 vs tau, D=0'));
  }

  function clickHandler(ev) {
    const { x: rx, y: ry } = window.t11ClientToSvg(svg, ev.clientX, ev.clientY);
    const tau = window.t11Clamp(((rx - ml) / plotW) * tauMaxNs, 0, tauMaxNs);
    const dj = window.t11Clamp(
      dMinMHz + ((ry - mt) / plotH) * (dMaxMHz - dMinMHz),
      dMinMHz,
      dMaxMHz
    );
    const Om = omegaNow();
    const tpi = tauPiNs();
    const nearRes = Math.abs(dj) < 14;
    const nearPiTime = Math.abs(tau - tpi) < 26;
    const onFirstLobe = p1(tau, dj, Om) > 0.82;
    if (nearRes && (nearPiTime || (Math.abs(dj) < 6 && onFirstLobe))) {
      marked = true;
      markTau = tau;
      markDel = dj;
      cont.disabled = false;
      draw();
    }
  }

  svg.addEventListener('click', clickHandler);
  omegaSl.addEventListener('input', () => {
    marked = false;
    markTau = null;
    markDel = null;
    cont.disabled = true;
    draw();
  });

  cont.disabled = true;
  cont.addEventListener('click', () => {
    if (marked) markDone('t11-4');
  });

  draw();
})();

/* ---- Step 5: readout calibration — overlaid 1D marginals (experimental style) ---- */
(function initT11Step5() {
  const svg = document.getElementById('t11-pop-svg');
  const delaySl = document.getElementById('t11-pop-t1delay');
  const cont = document.getElementById('t11-chip-continue-5');
  const c00 = document.getElementById('t11-pop-c00');
  const c01 = document.getElementById('t11-pop-c01');
  const c10 = document.getElementById('t11-pop-c10');
  const c11 = document.getElementById('t11-pop-c11');
  const fRoEl = document.getElementById('t11-pop-f-ro');
  if (!svg || !delaySl || !cont) return;

  const W = 400;
  const H = 260;
  const ml = 48;
  const mr = 14;
  const mt = 22;
  const mb = 44;
  const plotW = W - ml - mr;
  const plotH = H - mt - mb;

  const mu0 = 2.15;
  const mu1 = 8.35;
  const sigma = 0.78;
  const t1Us = 1.5;
  const nSamples = 500;
  const seed = 998244353;

  let threshold = 5.25;
  let dragging = false;
  let delayTouched = false;
  let threshTouched = false;

  function samplePrep0(rng) {
    return mu0 + sigma * window.t11NormRand(rng);
  }

  function samplePrep1(rng, delayUs) {
    const pExc = Math.exp(-delayUs / t1Us);
    if (rng() < pExc) return mu1 + sigma * window.t11NormRand(rng);
    return mu0 + sigma * window.t11NormRand(rng);
  }

  function classify(x) {
    return x < threshold ? 0 : 1;
  }

  function buildHistograms() {
    const rng = window.t11Lcg(seed);
    const delay = Number(delaySl.value);
    const a0 = [];
    const a1 = [];
    for (let i = 0; i < nSamples; i++) a0.push(samplePrep0(rng));
    for (let i = 0; i < nSamples; i++) a1.push(samplePrep1(rng, delay));

    const xMin = 0;
    const xMax = 11.5;
    const nBin = 28;
    const bw = (xMax - xMin) / nBin;
    const h0 = new Array(nBin).fill(0);
    const h1 = new Array(nBin).fill(0);
    for (const x of a0) {
      const b = window.t11Clamp(Math.floor((x - xMin) / bw), 0, nBin - 1);
      h0[b]++;
    }
    for (const x of a1) {
      const b = window.t11Clamp(Math.floor((x - xMin) / bw), 0, nBin - 1);
      h1[b]++;
    }

    let n00 = 0;
    let n01 = 0;
    for (const x of a0) {
      if (classify(x) === 0) n00++;
      else n01++;
    }
    let n10 = 0;
    let n11 = 0;
    for (const x of a1) {
      if (classify(x) === 0) n10++;
      else n11++;
    }
    const inv = 1 / nSamples;
    const cm = { n00: n00 * inv, n01: n01 * inv, n10: n10 * inv, n11: n11 * inv };
    const fRo = 0.5 * (cm.n00 + cm.n11);
    return { h0, h1, nBin, bw, xMin, xMax, cm, fRo };
  }

  function xToPx(x, xMin, xMax) {
    return ml + ((x - xMin) / (xMax - xMin)) * plotW;
  }

  function paint() {
    svg.innerHTML = '';
    const mk = window.t11MkEl;
    const { h0, h1, nBin, bw, xMin, xMax, cm, fRo } = buildHistograms();
    const maxC = Math.max(8, ...h0, ...h1);
    const yBase = mt + plotH;

    svg.appendChild(mk('line', {
      x1: ml,
      y1: yBase,
      x2: ml + plotW,
      y2: yBase,
      stroke: 'var(--line-bright)',
      'stroke-width': 1,
      opacity: 0.45
    }));
    svg.appendChild(mk('line', {
      x1: ml,
      y1: mt,
      x2: ml,
      y2: yBase,
      stroke: 'var(--line-bright)',
      'stroke-width': 1,
      opacity: 0.45
    }));

    const pts0 = [];
    const pts1 = [];
    for (let b = 0; b < nBin; b++) {
      const xc = xMin + (b + 0.5) * bw;
      const px = xToPx(xc, xMin, xMax);
      const hh0 = (h0[b] / maxC) * (plotH - 6);
      const hh1 = (h1[b] / maxC) * (plotH - 6);
      const xL = xToPx(xMin + b * bw, xMin, xMax);
      const xR = xToPx(xMin + (b + 1) * bw, xMin, xMax);
      const binW = Math.max(1.2, xR - xL - 0.5);
      svg.appendChild(mk('rect', {
        x: xL + 0.25,
        y: yBase - hh0,
        width: binW * 0.48,
        height: hh0,
        fill: 'var(--mint)',
        opacity: 0.42
      }));
      svg.appendChild(mk('rect', {
        x: xL + 0.25 + binW * 0.5,
        y: yBase - hh1,
        width: binW * 0.48,
        height: hh1,
        fill: '#e8a045',
        opacity: 0.42
      }));
      pts0.push(`${px},${yBase - hh0}`);
      pts1.push(`${px},${yBase - hh1}`);
    }

    svg.appendChild(mk('polyline', {
      points: pts0.join(' '),
      fill: 'none',
      stroke: 'var(--mint)',
      'stroke-width': 2,
      opacity: 0.95
    }));
    svg.appendChild(mk('polyline', {
      points: pts1.join(' '),
      fill: 'none',
      stroke: '#e8a045',
      'stroke-width': 2,
      opacity: 0.95
    }));

    const tx = xToPx(threshold, xMin, xMax);
    svg.appendChild(mk('line', {
      x1: tx,
      y1: mt,
      x2: tx,
      y2: yBase,
      stroke: 'var(--magenta)',
      'stroke-width': 2,
      'stroke-dasharray': '5 4'
    }));

    svg.appendChild(mk('text', {
      x: ml + plotW / 2,
      y: H - 10,
      'font-family': 'var(--mono)',
      'font-size': 10,
      fill: 'var(--ink-faint)',
      'text-anchor': 'middle'
    }, 'Integrated quadrature (a.u.) — IQ projected onto readout axis'));

    svg.appendChild(mk('text', {
      x: 10,
      y: mt + plotH / 2,
      'font-family': 'var(--mono)',
      'font-size': 9,
      fill: 'var(--ink-faint)',
      transform: `rotate(-90 10 ${mt + plotH / 2})`
    }, 'counts / bin'));

    svg.appendChild(mk('text', {
      x: ml + 4,
      y: mt + 12,
      'font-family': 'var(--mono)',
      'font-size': 10,
      fill: 'var(--mint)'
    }, '|0> prep'));
    svg.appendChild(mk('text', {
      x: ml + 72,
      y: mt + 12,
      'font-family': 'var(--mono)',
      'font-size': 10,
      fill: '#e8a045'
    }, '|1> prep'));

    if (c00) c00.textContent = (100 * cm.n00).toFixed(1) + '%';
    if (c01) c01.textContent = (100 * cm.n01).toFixed(1) + '%';
    if (c10) c10.textContent = (100 * cm.n10).toFixed(1) + '%';
    if (c11) c11.textContent = (100 * cm.n11).toFixed(1) + '%';
    if (fRoEl) fRoEl.textContent = `Readout fidelity F_RO ≈ ${(100 * fRo).toFixed(1)}% (equal priors, toy counts)`;

    if (delayTouched && threshTouched) cont.disabled = false;
    else cont.disabled = true;
  }

  function clientToThreshold(clientX) {
    const { x: rx } = window.t11ClientToSvg(svg, clientX, 0);
    const xMin = 0;
    const xMax = 11.5;
    return window.t11Clamp(xMin + ((rx - ml) / plotW) * (xMax - xMin), xMin + 0.2, xMax - 0.2);
  }

  delaySl.addEventListener('pointerdown', () => {
    delayTouched = true;
    paint();
  });
  delaySl.addEventListener('input', () => {
    delayTouched = true;
    paint();
  });

  svg.addEventListener('pointerdown', (ev) => {
    dragging = true;
    svg.setPointerCapture(ev.pointerId);
    threshold = clientToThreshold(ev.clientX);
    threshTouched = true;
    paint();
  });
  svg.addEventListener('pointermove', (ev) => {
    if (!dragging) return;
    threshold = clientToThreshold(ev.clientX);
    paint();
  });
  svg.addEventListener('pointerup', () => { dragging = false; });
  svg.addEventListener('pointercancel', () => { dragging = false; });

  cont.addEventListener('click', () => markDone('t11-5'));

  paint();
})();

/* ---- Step 6: run the X gate — theory vs experiment ---- */
(function initT11Step6() {
  const svg      = document.getElementById('t11-run-svg');
  const runBtn   = document.getElementById('t11-run-btn');
  const clearBtn = document.getElementById('t11-run-clear');
  const driftSl  = document.getElementById('t11-run-drift');
  const driftLbl = document.getElementById('t11-run-drift-label');
  const shotLbl  = document.getElementById('t11-run-shot-count');
  const resultEl = document.getElementById('t11-run-result');
  const cont     = document.getElementById('t11-chip-continue-6');
  if (!svg || !runBtn || !cont) return;

  const W = 380;
  const H = 300;
  const cx0 = W / 2;
  const cy0 = H / 2;
  const pad = 38;
  const plotSz = Math.min(W, H) - pad * 2;
  const scale = plotSz / 2.4;

  const sigma   = 0.12;
  const snr     = 2.2;
  const D       = snr * sigma;
  const thIQ    = 0;
  const t1Us    = 1.5;
  const tGateNs = 40;
  const nShot   = 60;

  const pRO1 = 1 - 0.5 * window.t11Erfc((D / 2) / (sigma * Math.sqrt(2)));
  const pRO0 = 0.5 * window.t11Erfc((D / 2) / (sigma * Math.sqrt(2)));

  let allShots = [];
  let runCount = 0;
  let hadRun = false;

  function driftNow() { return driftSl ? Number(driftSl.value) : 0; }

  /* P(qubit ends up excited after X gate with this drift + T1 decay)
     Total rotation θ = π·(1 + d/100)
     P(|1⟩) = sin²(θ/2) = sin²(π/2·(1+d/100))
             = cos²(π·d/200)   [since sin(π/2+x)=cos(x)]
     Then modulate by T1 gate decay.                                     */
  function pExcited(driftPct) {
    const extra  = Math.PI * driftPct / 200;
    const pRot   = Math.cos(extra) * Math.cos(extra);
    const pT1    = Math.exp(-tGateNs * 1e-3 / t1Us);
    return pRot * pT1;
  }

  function pAssign1Theory(driftPct) {
    const pe = pExcited(driftPct);
    return pe * pRO1 + (1 - pe) * pRO0;
  }

  /* Shot categories (stayed = qubit physically in |1⟩ after gate):
       stayed=T assigned=1 → correct                  green
       stayed=T assigned=0 → SPAM readout error        red
       stayed=F assigned=1 → T1/drift failure+SPAM     amber
       stayed=F assigned=0 → T1/drift failure correct  grey-orange */
  function shotColor(stayed, assigned) {
    if (stayed && assigned === 1) return 'var(--mint)';
    if (stayed && assigned === 0) return '#e04444';
    if (!stayed && assigned === 1) return '#c89020';
    return '#a05828';
  }

  function generateShots(driftPct, seed) {
    const rng = window.t11Lcg(seed);
    const pe  = pExcited(driftPct);
    const shots = [];
    for (let i = 0; i < nShot; i++) {
      const stayed   = rng() < pe;
      const Imu      = stayed ? D / 2 : -D / 2;
      const I        = Imu + sigma * window.t11NormRand(rng);
      const Q        = sigma * window.t11NormRand(rng);
      const assigned = I > thIQ ? 1 : 0;
      shots.push({ I, Q, assigned, stayed });
    }
    return shots;
  }

  function paint() {
    svg.innerHTML = '';
    const mk = window.t11MkEl;

    svg.appendChild(mk('line', { x1: pad, y1: cy0, x2: W - pad, y2: cy0,
      stroke: 'var(--line-bright)', 'stroke-width': 1, opacity: 0.3 }));
    svg.appendChild(mk('line', { x1: cx0, y1: pad, x2: cx0, y2: H - pad,
      stroke: 'var(--line-bright)', 'stroke-width': 1, opacity: 0.3 }));
    svg.appendChild(mk('text', { x: W - pad - 4, y: cy0 - 6,
      'font-family': 'var(--mono)', 'font-size': 10, fill: 'var(--ink-faint)', 'text-anchor': 'end' }, 'I'));
    svg.appendChild(mk('text', { x: cx0 + 6, y: pad + 12,
      'font-family': 'var(--mono)', 'font-size': 10, fill: 'var(--ink-faint)' }, 'Q'));

    const refRng = window.t11Lcg(20250427);
    for (let i = 0; i < 120; i++) {
      const I0 = -D / 2 + sigma * window.t11NormRand(refRng);
      const Q0 = sigma * window.t11NormRand(refRng);
      svg.appendChild(mk('circle', { cx: cx0 + I0 * scale, cy: cy0 - Q0 * scale,
        r: 2, fill: 'var(--mint)', opacity: 0.16 }));
    }
    for (let i = 0; i < 120; i++) {
      const I1 = D / 2 + sigma * window.t11NormRand(refRng);
      const Q1 = sigma * window.t11NormRand(refRng);
      svg.appendChild(mk('circle', { cx: cx0 + I1 * scale, cy: cy0 - Q1 * scale,
        r: 2, fill: '#e8a045', opacity: 0.16 }));
    }

    const lx0 = cx0 - D / 2 * scale;
    const lx1 = cx0 + D / 2 * scale;
    const ly   = cy0 - plotSz * 0.34;
    svg.appendChild(mk('text', { x: lx0, y: ly, 'font-family': 'var(--mono)',
      'font-size': 9, fill: 'var(--mint)', opacity: 0.5, 'text-anchor': 'middle' }, '|0> ref'));
    svg.appendChild(mk('text', { x: lx1, y: ly, 'font-family': 'var(--mono)',
      'font-size': 9, fill: '#e8a045', opacity: 0.5, 'text-anchor': 'middle' }, '|1> ref'));

    const tx = cx0 + thIQ * scale;
    svg.appendChild(mk('line', { x1: tx, y1: pad, x2: tx, y2: H - pad,
      stroke: 'var(--magenta)', 'stroke-width': 2, 'stroke-dasharray': '5 4', opacity: 0.8 }));
    svg.appendChild(mk('text', { x: tx + 5, y: pad + 12, 'font-family': 'var(--mono)',
      'font-size': 9, fill: 'var(--magenta)', opacity: 0.8 }, 'threshold'));

    for (const s of allShots) {
      const px = cx0 + s.I * scale;
      const py = cy0 - s.Q * scale;
      svg.appendChild(mk('circle', { cx: px, cy: py, r: 3.2,
        fill: shotColor(s.stayed, s.assigned), opacity: 0.9,
        stroke: 'var(--bg-0)', 'stroke-width': 1 }));
    }

    /* Compact legend */
    [
      ['var(--mint)', 'correct (in |1>, read 1)'],
      ['#e04444',     'SPAM error (in |1>, read 0)'],
      ['#c89020',     'T1/drift + mis-read (in |0>, read 1)'],
      ['#a05828',     'T1/drift (in |0>, read 0)']
    ].forEach(([col, txt], i) => {
      const lx = pad + 4;
      const lyi = H - 60 + i * 13;
      svg.appendChild(mk('circle', { cx: lx, cy: lyi, r: 4, fill: col }));
      svg.appendChild(mk('text', { x: lx + 10, y: lyi + 4, 'font-family': 'var(--mono)',
        'font-size': 8, fill: col }, txt));
    });

    const drift = driftNow();
    if (driftLbl) driftLbl.textContent = `${drift > 0 ? '+' : ''}${drift}%`;

    if (allShots.length > 0) {
      const correct  = allShots.filter(s =>  s.stayed && s.assigned === 1).length;
      const spam     = allShots.filter(s =>  s.stayed && s.assigned === 0).length;
      const t1lucky  = allShots.filter(s => !s.stayed && s.assigned === 1).length;
      const t1caught = allShots.filter(s => !s.stayed && s.assigned === 0).length;
      const n        = allShots.length;
      const pMeas    = correct / n;
      const pTh      = pAssign1Theory(drift);
      const sigma1   = Math.sqrt(pTh * (1 - pTh) / n);
      const dRot     = (1 - Math.cos(Math.PI * drift / 200) ** 2) * 100;
      const dT1      = (1 - Math.exp(-tGateNs * 1e-3 / t1Us)) * 100;
      const dSPAM    = (1 - pRO1) * 100;

      if (resultEl) {
        resultEl.innerHTML =
          `<table style="border-collapse:collapse;width:100%;max-width:500px">` +
          `<tr><td style="padding:2px 10px 2px 0;color:var(--ink)">Circuit-layer ideal</td>` +
          `<td style="text-align:right;color:var(--ink)">100.0%</td><td></td></tr>` +
          `<tr><td style="color:var(--ink-faint)">&minus; T\u2081 decay during gate&nbsp;(${tGateNs}\u00a0ns / ${t1Us}\u00a0\u00b5s)</td>` +
          `<td style="text-align:right;color:#e04444">&minus;${dT1.toFixed(1)}%</td>` +
          `<td style="padding-left:12px;color:var(--ink-faint);font-size:11px">${t1caught + t1lucky}\u00a0shots affected</td></tr>` +
          `<tr><td style="color:var(--ink-faint)">&minus; Pulse drift&nbsp;(Rabi rate off by ${drift > 0 ? '+' : ''}${drift}%)</td>` +
          `<td style="text-align:right;color:#e04444">&minus;${dRot.toFixed(1)}%</td>` +
          `<td style="padding-left:12px;color:var(--ink-faint);font-size:11px">visible at &gt;10%</td></tr>` +
          `<tr><td style="color:var(--ink-faint)">&minus; Readout SPAM&nbsp;(SNR\u00a02.2 from Step\u00a03)</td>` +
          `<td style="text-align:right;color:#e04444">&minus;${dSPAM.toFixed(1)}%</td>` +
          `<td style="padding-left:12px;color:var(--ink-faint);font-size:11px">${spam}\u00a0misread</td></tr>` +
          `<tr style="border-top:1px solid var(--line)"><td style="padding-top:4px;color:var(--ink)">Predicted P(assign\u00a0|1\u27e9)</td>` +
          `<td style="text-align:right;padding-top:4px;color:var(--ink)">${(100 * pTh).toFixed(1)}%</td><td></td></tr>` +
          `<tr><td style="color:var(--mint)"><b>Measured&nbsp;(${n}\u00a0shots)</b></td>` +
          `<td style="text-align:right"><b style="color:var(--mint)">${correct}/${n} = ${(100 * pMeas).toFixed(1)}%</b></td>` +
          `<td style="padding-left:12px;color:var(--ink-faint);font-size:11px">\u00b1${(100 * sigma1).toFixed(1)}%\u00a0(1\u03c3 shot noise)</td></tr>` +
          `</table>`;
      }
      if (shotLbl) shotLbl.textContent = `${n} total shots`;
    } else {
      if (resultEl) resultEl.innerHTML = '';
      if (shotLbl) shotLbl.textContent = '';
    }
  }

  runBtn.addEventListener('click', () => {
    runCount++;
    const newShots = generateShots(driftNow(), 1234567 + runCount * 9973);
    allShots = allShots.concat(newShots);
    hadRun = true;
    cont.disabled = false;
    paint();
  });

  if (clearBtn) clearBtn.addEventListener('click', () => {
    allShots = [];
    runCount = 0;
    hadRun = false;
    cont.disabled = true;
    paint();
  });

  if (driftSl) driftSl.addEventListener('input', () => {
    allShots = [];
    runCount = 0;
    hadRun = false;
    cont.disabled = true;
    paint();
  });

  cont.addEventListener('click', () => {
    if (hadRun) markDone('t11-6');
  });

  paint();
})();

/* ---- Step 7: error budget — waterfall + dual Bloch disk ---- */
(function initT11Step7() {
  const wfSvg    = document.getElementById('t11-budget-waterfall');
  const bSvg     = document.getElementById('t11-budget-bloch');
  const driftSl  = document.getElementById('t11-budget-drift');
  const driftLbl = document.getElementById('t11-budget-drift-lbl');
  const bdEl     = document.getElementById('t11-budget-breakdown');
  const cont     = document.getElementById('t11-chip-continue-7');
  if (!wfSvg || !bSvg || !cont) return;

  const sigma   = 0.12;
  const D       = 2.2 * sigma;
  const t1Us    = 1.5;
  const tGateNs = 40;
  const pRO1    = 1 - 0.5 * window.t11Erfc((D / 2) / (sigma * Math.sqrt(2)));

  /* --- Waterfall chart (340×220) --- */
  const WF_W = 340;
  const WF_H = 220;
  const wfMl = 42;
  const wfMr = 10;
  const wfMt = 18;
  const wfMb = 38;
  const wfW  = WF_W - wfMl - wfMr;
  const wfH  = WF_H - wfMt - wfMb;
  const stages = ['Ideal', 'T\u2081\ndecay', 'Pulse\ndrift', 'Read-out\nSPAM', 'Final'];
  const nStages = stages.length;
  const barW = wfW / nStages * 0.55;
  const barGap = wfW / nStages;

  function wfValues(driftPct) {
    const p0 = 1.0;
    const pT1 = Math.exp(-tGateNs * 1e-3 / t1Us);
    const extra = Math.PI * driftPct / 200;
    const pDrift = Math.cos(extra) * Math.cos(extra);
    const p1 = p0;
    const p2 = p0 * pT1;
    const p3 = p0 * pT1 * pDrift;
    const pe  = p3;
    const p4  = pe * pRO1 + (1 - pe) * (1 - pRO1);
    return [p0, p2, p3, p4, p4];
  }

  function drawWaterfall(drift) {
    wfSvg.innerHTML = '';
    const mk = window.t11MkEl;
    const vals = wfValues(drift);

    /* Y axis */
    wfSvg.appendChild(mk('line', {
      x1: wfMl, y1: wfMt, x2: wfMl, y2: wfMt + wfH,
      stroke: 'var(--line-bright)', 'stroke-width': 1, opacity: 0.4
    }));
    for (let pct of [0, 25, 50, 75, 100]) {
      const y = wfMt + wfH - (pct / 100) * wfH;
      wfSvg.appendChild(mk('line', {
        x1: wfMl - 4, y1: y, x2: wfMl + wfW, y2: y,
        stroke: 'var(--line-bright)', 'stroke-width': 0.5, opacity: 0.2
      }));
      wfSvg.appendChild(mk('text', {
        x: wfMl - 6, y: y + 4, 'font-family': 'var(--mono)',
        'font-size': 9, fill: 'var(--ink-faint)', 'text-anchor': 'end'
      }, pct + '%'));
    }

    vals.forEach((v, i) => {
      const x = wfMl + i * barGap + (barGap - barW) / 2;
      const hBar = v * wfH;
      const yBar = wfMt + wfH - hBar;
      const isLast = i === nStages - 1;
      /* Lost portion (red) above bar */
      if (i > 0 && vals[i] < vals[i - 1]) {
        const hLost = (vals[i - 1] - vals[i]) * wfH;
        wfSvg.appendChild(mk('rect', {
          x, y: yBar - hLost, width: barW, height: hLost,
          fill: '#e04444', opacity: 0.55, rx: 2
        }));
      }
      /* Bar */
      wfSvg.appendChild(mk('rect', {
        x, y: yBar, width: barW, height: hBar,
        fill: isLast ? 'var(--mint)' : '#4a8fa8', opacity: isLast ? 0.9 : 0.7, rx: 2
      }));
      /* Value label */
      wfSvg.appendChild(mk('text', {
        x: x + barW / 2, y: yBar - 3,
        'font-family': 'var(--mono)', 'font-size': 9,
        fill: isLast ? 'var(--mint)' : 'var(--ink-faint)',
        'text-anchor': 'middle'
      }, (v * 100).toFixed(0) + '%'));

      /* X label (multi-line via dy) */
      const lparts = stages[i].split('\n');
      lparts.forEach((part, pi) => {
        wfSvg.appendChild(mk('text', {
          x: x + barW / 2,
          y: wfMt + wfH + 14 + pi * 11,
          'font-family': 'var(--mono)',
          'font-size': 9,
          fill: 'var(--ink-faint)',
          'text-anchor': 'middle'
        }, part));
      });

      /* Connector to next bar */
      if (i < nStages - 2) {
        const nx = wfMl + (i + 1) * barGap + (barGap - barW) / 2;
        const yRight = wfMt + wfH - vals[i] * wfH;
        wfSvg.appendChild(mk('line', {
          x1: x + barW, y1: yRight, x2: nx, y2: yRight,
          stroke: 'var(--line-bright)', 'stroke-width': 1, 'stroke-dasharray': '3 3', opacity: 0.4
        }));
      }
    });
  }

  /* --- Dual Bloch disk (210×210) --- */
  function drawDualBloch(drift) {
    bSvg.innerHTML = '';
    const mk = window.t11MkEl;
    const W = 210;
    const H = 210;
    const cx = W / 2;
    const cy = H / 2;
    const R  = 78;

    /* Disk */
    bSvg.appendChild(mk('circle', { cx, cy, r: R, fill: 'none',
      stroke: 'var(--line-bright)', 'stroke-width': 1.2, opacity: 0.55 }));
    bSvg.appendChild(mk('line', { x1: cx - R, y1: cy, x2: cx + R, y2: cy,
      stroke: 'var(--line-bright)', 'stroke-width': 0.8, opacity: 0.3 }));
    bSvg.appendChild(mk('line', { x1: cx, y1: cy - R, x2: cx, y2: cy + R,
      stroke: 'var(--line-bright)', 'stroke-width': 0.8, opacity: 0.3 }));

    /* Pole labels */
    [['|0\u27e9', cx, cy - R - 5, 'middle'],
     ['|1\u27e9', cx, cy + R + 14, 'middle'],
     ['|+\u27e9',  cx + R + 5, cy + 4, 'start'],
     ['|\u2212\u27e9', cx - R - 5, cy + 4, 'end']].forEach(([lbl, lx, ly, anc]) => {
      bSvg.appendChild(mk('text', { x: lx, y: ly, 'font-family': 'var(--mono)',
        'font-size': 10, fill: 'var(--ink-faint)', 'text-anchor': anc }, lbl));
    });

    /* Ideal π rotation → |1⟩: x=0, z=-1 (south pole) */
    const ixI = cx + 0 * R;
    const iyI = cy - (-1) * R;
    bSvg.appendChild(mk('line', { x1: cx, y1: cy, x2: ixI, y2: iyI,
      stroke: '#555', 'stroke-width': 2, 'stroke-dasharray': '4 3', opacity: 0.6 }));
    bSvg.appendChild(mk('circle', { cx: ixI, cy: iyI, r: 5, fill: '#555', opacity: 0.5 }));
    bSvg.appendChild(mk('text', { x: ixI + 8, y: iyI + 3, 'font-family': 'var(--mono)',
      'font-size': 9, fill: '#888' }, 'ideal'));

    /* Real rotation */
    const theta = Math.PI * (1 + drift / 100);
    const bx = Math.sin(theta);
    const bz = Math.cos(theta);
    const vx = cx + bx * R;
    const vy = cy - bz * R;
    bSvg.appendChild(mk('line', { x1: cx, y1: cy, x2: vx, y2: vy,
      stroke: 'var(--mint)', 'stroke-width': 3, 'stroke-linecap': 'round' }));
    bSvg.appendChild(mk('circle', { cx: vx, cy: vy, r: 7,
      fill: 'var(--mint)', stroke: 'var(--bg-0)', 'stroke-width': 2 }));

    /* T1 inward dashed ring */
    const pT1   = Math.exp(-tGateNs * 1e-3 / t1Us);
    const rT1   = Math.sqrt(pT1) * R;
    bSvg.appendChild(mk('circle', { cx, cy, r: rT1, fill: 'none',
      stroke: '#e04444', 'stroke-width': 1, 'stroke-dasharray': '3 4', opacity: 0.55 }));

    /* Angle annotation */
    const deg = (theta * 180 / Math.PI).toFixed(0);
    bSvg.appendChild(mk('text', { x: 6, y: 14, 'font-family': 'var(--mono)',
      'font-size': 9, fill: 'var(--ink-faint)' }, '\u03b8 = ' + deg + '\u00b0'));
    bSvg.appendChild(mk('text', { x: 6, y: 25, 'font-family': 'var(--mono)',
      'font-size': 8, fill: '#e04444', opacity: 0.7 }, 'red ring: T\u2081 purity'));
  }

  function updateBreakdown(drift) {
    if (!bdEl) return;
    const vals   = wfValues(drift);
    const dT1    = (1 - vals[1]) * 100;
    const dDrift = (vals[1] - vals[2]) * 100;
    const dSPAM  = (vals[2] - vals[3]) * 100;
    bdEl.innerHTML =
      `<b>T\u2081 contribution:</b> ${dT1.toFixed(2)}% &nbsp;\u2014&nbsp; ` +
      `gate time ${tGateNs}\u00a0ns / T\u2081 = ${t1Us}\u00a0\u00b5s &rarr; P(decay) = ${dT1.toFixed(2)}%<br>` +
      `<b>Pulse drift:</b> ${dDrift.toFixed(1)}% &nbsp;\u2014&nbsp; ` +
      `\u03a9 off by ${drift > 0 ? '+' : ''}${drift}% &rarr; rotation = ${(180 * (1 + drift / 100)).toFixed(0)}\u00b0 instead of 180\u00b0<br>` +
      `<b>Readout SPAM:</b> ${dSPAM.toFixed(1)}% &nbsp;\u2014&nbsp; ` +
      `P(assign 1 | state 1) = ${(100 * pRO1).toFixed(1)}% with SNR\u00a02.2<br>` +
      `<b>Total gap from ideal:</b> ${((1 - vals[3]) * 100).toFixed(1)}% &nbsp;` +
      `<b>Final P(assign\u00a0|1\u27e9) = ${(100 * vals[3]).toFixed(1)}%</b>`;
  }

  function redraw() {
    const drift = driftSl ? Number(driftSl.value) : 0;
    if (driftLbl) driftLbl.textContent = `${drift > 0 ? '+' : ''}${drift}%`;
    drawWaterfall(drift);
    drawDualBloch(drift);
    updateBreakdown(drift);
  }

  if (driftSl) driftSl.addEventListener('input', redraw);

  cont.addEventListener('click', () => markDone('t11-7'));

  redraw();
})();

/* ---- Step 8 finish wiring ---- */
(function initT11ChipScaffold() {
  const finish = document.getElementById('t11-chip-finish');
  if (finish) {
    finish.addEventListener('click', () => markDone('t11-8'));
  }
})();
