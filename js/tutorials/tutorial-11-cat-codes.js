/* =========================================================================
   TUTORIAL 11: CAT CODES (BOSONIC ENCODING)
   1D Gaussian line model (pedagogical stand-in for one quadrature in phase
   space). Not a full continuous-variable simulation.
   =========================================================================

   HTML ids this file binds:

   Step 1:  t11-mot-loss, t11-mot-cv, t11-mot-hint, t11-1-next
   Step 2:  t11-coh-alpha, t11-coh-alpha-val, t11-coh-plot, t11-coh-caption, t11-2-next
   Step 3:  t11-cat-b-even, t11-cat-b-odd, t11-cat-alpha, t11-cat-alpha-val, t11-cat-plot,
            t11-cat-readout, t11-cat-caption, t11-3-next
   Step 4:  t11-loss, t11-loss-val, t11-loss-alpha, t11-loss-alpha-val, t11-loss-plot,
            t11-loss-readout, t11-4-next
   Step 5:  t11-parity-truth, t11-parity-loss, t11-parity-loss-val, t11-parity-alpha,
            t11-parity-alpha-val, t11-parity-pred, t11-parity-btn, t11-parity-log, t11-5-next
   ========================================================================= */

(function tutorial11() {
  const SIGMA = 0.58;
  const XMIN = -8;
  const XMAX = 8;
  const N = 800;
  const dx = (XMAX - XMIN) / N;

  const xGrid = (function buildGrid() {
    const a = new Float64Array(N);
    for (let i = 0; i < N; i++) a[i] = XMIN + (i + 0.5) * dx;
    return a;
  })();

  function gaussAmp(mu) {
    const s = SIGMA;
    const out = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      const x = xGrid[i] - mu;
      out[i] = Math.exp(-(x * x) / (2 * s * s));
    }
    return normalizeAmp(out);
  }

  function normalizeAmp(amp) {
    let w = 0;
    for (let i = 0; i < N; i++) w += amp[i] * amp[i] * dx;
    const n = Math.sqrt(w) || 1;
    for (let i = 0; i < N; i++) amp[i] /= n;
    return amp;
  }

  function evenCat(alpha) {
    const a = new Float64Array(N);
    const p = gaussAmp(alpha);
    const m = gaussAmp(-alpha);
    for (let i = 0; i < N; i++) a[i] = p[i] + m[i];
    return normalizeAmp(a);
  }

  function oddCat(alpha) {
    const a = new Float64Array(N);
    const p = gaussAmp(alpha);
    const m = gaussAmp(-alpha);
    for (let i = 0; i < N; i++) a[i] = p[i] - m[i];
    return normalizeAmp(a);
  }

  function singleLobe(a) {
    return gaussAmp(a);
  }

  function inner(ua, ub) {
    let s = 0;
    for (let i = 0; i < N; i++) s += ua[i] * ub[i] * dx;
    return s;
  }

  function psiAt(psi, x) {
    const j = (x - XMIN) / dx - 0.5;
    const j0 = Math.floor(j);
    const t = j - j0;
    if (j0 < 0 || j0 >= N - 1) return 0;
    return (1 - t) * psi[j0] + t * psi[j0 + 1];
  }

  /**
   * Cartoon "P(even)" = ||psi_s||^2 with psi_s(x)=(psi(x)+psi(-x))/2 for real psi.
   * Stands in for photon-number parity weight in the tutorial text.
   */
  function probSymmetricPart(psi) {
    let ssum = 0;
    for (let i = 0; i < N; i++) {
      const x = xGrid[i];
      const ps = 0.5 * (psi[i] + psiAt(psi, -x));
      ssum += ps * ps * dx;
    }
    return ssum;
  }

  function pdfFromPsi(psi) {
    const p = new Float64Array(N);
    for (let i = 0; i < N; i++) p[i] = psi[i] * psi[i];
    return p;
  }

  function mixPdf(fracA, pA, pB) {
    const p = new Float64Array(N);
    for (let i = 0; i < N; i++) p[i] = (1 - fracA) * pA[i] + fracA * pB[i];
    const sum = p.reduce((u, v) => u + v, 0) * dx;
    for (let i = 0; i < N; i++) p[i] /= sum;
    return p;
  }

  function maxContrast(p) {
    let min = 1e9, max = 0;
    for (let i = 0; i < N; i++) {
      if (p[i] < min) min = p[i];
      if (p[i] > max) max = p[i];
    }
    return { min, max, contrast: max > 1e-12 ? (max - min) / max : 0 };
  }

  const ns = 'http://www.w3.org/2000/svg';
  function mk(tag, attrs) {
    const e = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
    return e;
  }

  function pathLine(points) {
    return points.map((p, i) => (i ? 'L' : 'M') + p[0] + ',' + p[1]).join(' ');
  }

  function drawLinePlot(svgId, series, labels) {
    const svg = document.getElementById(svgId);
    if (!svg) return;
    const W = 400, H = 200, padL = 36, padR = 12, padB = 24, padT = 10;
    const plotW = W - padL - padR;
    const plotH = H - padB - padT;
    svg.innerHTML = '';
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    let ymax = 0.05;
    series.forEach(s => s.y.forEach(v => { if (v > ymax) ymax = v; }));
    if (ymax < 0.1) ymax = 0.1;
    const x0 = XMIN, x1 = XMAX;
    const toX = (x) => padL + ((x - x0) / (x1 - x0)) * plotW;
    const toY = (y) => padT + plotH * (1 - y / ymax);

    svg.appendChild(mk('line', { x1: padL, y1: padT + plotH, x2: W - padR, y2: padT + plotH, stroke: 'var(--line-bright)', 'stroke-width': 1.2 }));
    svg.appendChild(mk('line', { x1: padL, y1: padT, x2: padL, y2: padT + plotH, stroke: 'var(--line-bright)', 'stroke-width': 1.2 }));

    const colors = ['var(--mint)', 'var(--amber)', 'var(--magenta)'];
    series.forEach((s, si) => {
      const pts = [];
      for (let i = 0; i < N; i += 2) {
        const x = xGrid[i];
        pts.push([toX(x), toY(s.y[i])]);
      }
      svg.appendChild(mk('path', {
        d: pathLine(pts),
        fill: 'none',
        stroke: colors[si % colors.length],
        'stroke-width': 2.2,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
      }));
    });

    if (labels) {
      labels.forEach((text, i) => {
        const t = mk('text', { x: padL + 4, y: padT + 12 + i * 14, fill: colors[i % colors.length], 'font-size': 10, 'font-family': 'var(--mono)' });
        t.textContent = text;
        svg.appendChild(t);
      });
    }
  }

  /* --- Step 1 --- */
  (function step1() {
    const a = { loss: false, cv: false };
    const loss = document.getElementById('t11-mot-loss');
    const cv = document.getElementById('t11-mot-cv');
    const next = document.getElementById('t11-1-next');
    const hint = document.getElementById('t11-mot-hint');
    if (!loss || !cv) return;

    function refresh() {
      loss.style.borderColor = a.loss ? 'var(--mint)' : 'var(--line)';
      loss.style.boxShadow = a.loss ? '0 0 0 1px var(--mint-dim)' : 'none';
      cv.style.borderColor = a.cv ? 'var(--cyan)' : 'var(--line)';
      cv.style.boxShadow = a.cv ? '0 0 0 1px rgba(111,212,224,0.4)' : 'none';
      if (a.loss && a.cv) {
        if (hint) { hint.textContent = 'You have both pieces of the picture. Continue when ready.'; hint.style.color = 'var(--mint)'; }
        if (next) next.disabled = false;
        markDone('t11-1');
      }
    }
    loss.addEventListener('click', () => { a.loss = true; refresh(); });
    cv.addEventListener('click', () => { a.cv = true; refresh(); });
  })();

  /* --- Step 2 --- */
  (function step2() {
    const slider = document.getElementById('t11-coh-alpha');
    const valEl = document.getElementById('t11-coh-alpha-val');
    const cap = document.getElementById('t11-coh-caption');
    const next = document.getElementById('t11-2-next');
    if (!slider) return;
    const seen = { small: false, wide: false };

    function draw() {
      const a = parseFloat(slider.value);
      if (valEl) valEl.textContent = a.toFixed(2);
      if (a < 1.2) seen.small = true;
      if (a > 2.2) seen.wide = true;
      const p1 = pdfFromPsi(gaussAmp(a));
      const p2 = pdfFromPsi(gaussAmp(-a));
      drawLinePlot('t11-coh-plot', [
        { y: p1 },
        { y: p2 }
      ], ['|ψ_α|²', '|ψ_−α|²']);
      if (cap) {
        const ov = inner(gaussAmp(a), gaussAmp(-a));
        cap.innerHTML = `With larger α, the two bumps separate and the overlap <span style="color:var(--amber)">⟨α|−α⟩ ≈ ${ov.toExponential(2)}</span> in this model. That is the “macroscopic distinguishability” cat codes use.`;
      }
      if (seen.small && seen.wide) {
        markDone('t11-2');
        if (next) next.disabled = false;
      }
    }
    slider.addEventListener('input', draw);
    draw();
  })();

  /* --- Step 3 --- */
  (function step3() {
    const bEven = document.getElementById('t11-cat-b-even');
    const bOdd = document.getElementById('t11-cat-b-odd');
    const slider = document.getElementById('t11-cat-alpha');
    const valEl = document.getElementById('t11-cat-alpha-val');
    const ro = document.getElementById('t11-cat-readout');
    const cap = document.getElementById('t11-cat-caption');
    const next = document.getElementById('t11-3-next');
    if (!slider) return;
    let mode = 'even';
    const used = { even: false, odd: false, movedAlpha: false };
    let lastA = parseFloat(slider.value);

    function setMode(m) {
      mode = m;
      used[m] = true;
      bEven && bEven.classList.toggle('active', m === 'even');
      bOdd && bOdd.classList.toggle('active', m === 'odd');
    }
    bEven && bEven.addEventListener('click', () => { setMode('even'); draw(); });
    bOdd && bOdd.addEventListener('click', () => { setMode('odd'); draw(); });

    function draw() {
      const a = parseFloat(slider.value);
      if (Math.abs(a - lastA) > 0.02) used.movedAlpha = true;
      lastA = a;
      if (valEl) valEl.textContent = a.toFixed(2);
      const p = evenCat(a);
      const m = oddCat(a);
      const psi = mode === 'even' ? p : m;
      const pdf = pdfFromPsi(psi);
      const ov = inner(p, m);
      drawLinePlot('t11-cat-plot', [{ y: pdf }], [mode === 'even' ? 'even |cat+⟩' : 'odd |cat−⟩']);
      if (ro) {
        ro.textContent = `|⟨cat+|cat−⟩| = ${Math.abs(ov).toExponential(3)}  (closer to 0 ⇒ better orthogonal logical states)`;
      }
      if (cap) {
        cap.textContent = mode === 'even'
          ? 'Even superposition: constructive interference in the middle (probability builds between the two lobes).'
          : 'Odd superposition: destructive interference: a dip at the origin (when α is not too small).';
      }
      if (used.even && used.odd && used.movedAlpha) {
        markDone('t11-3');
        if (next) next.disabled = false;
      }
    }
    slider.addEventListener('input', draw);
    setMode('even');
    draw();
  })();

  /* --- Step 4 --- */
  (function step4() {
    const lossS = document.getElementById('t11-loss');
    const lossVal = document.getElementById('t11-loss-val');
    const aS = document.getElementById('t11-loss-alpha');
    const aVal = document.getElementById('t11-loss-alpha-val');
    const out = document.getElementById('t11-loss-readout');
    const next = document.getElementById('t11-4-next');
    if (!lossS) return;
    const touched = { loss: false, alpha: false };

    function draw() {
      const lam = parseFloat(lossS.value);
      const a = parseFloat(aS.value);
      if (lossVal) lossVal.textContent = lam.toFixed(2);
      if (aVal) aVal.textContent = a.toFixed(2);
      if (lam > 0.05) touched.loss = true;
      if (aS) touched.alpha = true;

      const pCat = pdfFromPsi(evenCat(a));
      const pL = pdfFromPsi(singleLobe(a));
      const mix = mixPdf(lam, pCat, pL);
      const pure = pdfFromPsi(evenCat(a));
      const F = (1 - lam) + lam * (inner(evenCat(a), singleLobe(a)) ** 2);
      const c0 = maxContrast(pure);
      const c1 = maxContrast(mix);
      drawLinePlot('t11-loss-plot', [
        { y: pure },
        { y: mix }
      ], ['λ=0 (ideal even cat)', 'mixed (λ>0)']);
      if (out) {
        out.innerHTML = `Fidelity to the pure even cat: <b style="color:var(--mint)">${(F * 100).toFixed(1)}%</b> &nbsp;|&nbsp; Fringe contrast (toy) drops from <span style="color:var(--amber)">${(c0.contrast * 100).toFixed(0)}%</span> → <span style="color:var(--magenta)">${(c1.contrast * 100).toFixed(0)}%</span> in this 1D PDF.`;
      }
      if (touched.loss && lam >= 0.12) {
        markDone('t11-4');
        if (next) next.disabled = false;
      }
    }
    lossS.addEventListener('input', draw);
    aS && aS.addEventListener('input', draw);
    draw();
  })();

  /* --- Step 5 --- */
  (function step5() {
    const truth = document.getElementById('t11-parity-truth');
    const lossS = document.getElementById('t11-parity-loss');
    const lossVal = document.getElementById('t11-parity-loss-val');
    const aS = document.getElementById('t11-parity-alpha');
    const aVal = document.getElementById('t11-parity-alpha-val');
    const pred = document.getElementById('t11-parity-pred');
    const btn = document.getElementById('t11-parity-btn');
    const log = document.getElementById('t11-parity-log');
    const next = document.getElementById('t11-5-next');
    if (!btn) return;
    const outcomes = new Set();
    let measureCount = 0;

    function expectedProbs() {
      const lam = parseFloat(lossS.value);
      const a = parseFloat(aS.value);
      const pe = evenCat(a);
      const po = oddCat(a);
      const lobe = singleLobe(a);
      const pLobe = probSymmetricPart(lobe);
      const evenTruth = !truth || truth.value === 'even';
      const pPlus = evenTruth
        ? (1 - lam) * probSymmetricPart(pe) + lam * pLobe
        : (1 - lam) * probSymmetricPart(po) + lam * pLobe;
      return { pPlus, pMinus: 1 - pPlus };
    }

    function updatePred() {
      const a = parseFloat(aS.value);
      const lam = parseFloat(lossS.value);
      if (lossVal) lossVal.textContent = lam.toFixed(2);
      if (aVal) aVal.textContent = a.toFixed(2);
      const { pPlus, pMinus } = expectedProbs();
      if (pred) {
        pred.innerHTML = `For the current mixture, the symmetric-weight (stand-in) probabilities are approximately <b>P(+1) ≈ ${(pPlus * 100).toFixed(1)}%</b>, <b>P(−1) ≈ ${(pMinus * 100).toFixed(1)}%</b>. The next click <em>realizes</em> one draw from that distribution (after a random “which branch” of the mixture).`;
      }
    }

    [truth, lossS, aS].forEach(el => el && el.addEventListener('input', updatePred));

    btn.addEventListener('click', () => {
      const lam = parseFloat(lossS.value);
      const a = parseFloat(aS.value);
      const evenPrep = !truth || truth.value === 'even';
      let psi;
      if (Math.random() < 1 - lam) {
        psi = evenPrep ? evenCat(a) : oddCat(a);
      } else {
        psi = singleLobe(a);
      }
      const pPlus = probSymmetricPart(psi);
      const bit = Math.random() < pPlus ? 1 : -1;
      measureCount++;
      outcomes.add(bit);
      if (log) log.textContent = `Outcome: ${bit === 1 ? '+1' : '−1'}  (cumulative: ${[...outcomes].sort().join(', ') || '—'})`;
      updatePred();
      if (outcomes.has(1) && outcomes.has(-1)) {
        markDone('t11-5');
        if (next) next.disabled = false;
      } else if (measureCount >= 4) {
        markDone('t11-5');
        if (next) next.disabled = false;
      }
    });

    updatePred();
  })();
})();
