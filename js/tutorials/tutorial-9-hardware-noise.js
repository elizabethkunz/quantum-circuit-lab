/* =========================================================================
   TUTORIAL 9: T1, T2, REDFIELD-STYLE RELAXATION, AND 1/f NOISE
   Hardware-style: spectral density, relaxation vs dephasing, Ramsey/echo
   ========================================================================= */

/*
Expected HTML ids/classes for this file:

Step 1
  t9-t1-slider             <input type="range">
  t9-t1-val                <span>
  t9-t1-plot               <svg>
  t9-t1-caption            <div>

Step 2
  t9-dephase-slider        <input type="range">
  t9-dephase-val           <span>
  t9-dephase-plot          <svg>
  t9-dephase-caption       <div>

Step 3
  t9-T1                    <input type="range">
  t9-Tphi                  <input type="range">
  t9-T1-val                <span>
  t9-Tphi-val              <span>
  t9-T2-val                <span>
  t9-t2-plot               <svg>
  t9-t2-caption            <div>

Step 4
  t9-spectrum-select       <select>
  t9-spectrum-svg          <svg>
  t9-spectrum-note         <div>
  t9-spectrum-run          <button>

Step 5
  t9-echo-select           <select>
  t9-echo-svg              <svg>
  t9-echo-note             <div>
  t9-echo-run              <button>

Step 6
  t9-device-buttons        buttons with [data-device]
  t9-device-out            <div>
*/

(function tutorial9Helpers() {
  if (window.t9Utils) return;

  function fmt(x, d = 2) {
    return Number(x).toFixed(d).replace(/\.00$/, '');
  }

  function drawAxes(svg, W, H, padX = 36, padY = 24) {
    const ns = 'http://www.w3.org/2000/svg';
    function mk(tag, attrs, text) {
      const e = document.createElementNS(ns, tag);
      Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
      if (text) e.textContent = text;
      return e;
    }
    svg.appendChild(mk('line', { x1: padX, y1: H - padY, x2: W - 12, y2: H - padY, stroke: 'var(--line-bright)', 'stroke-width': 1.2 }));
    svg.appendChild(mk('line', { x1: padX, y1: 12, x2: padX, y2: H - padY, stroke: 'var(--line-bright)', 'stroke-width': 1.2 }));
    return mk;
  }

  function pathFromPoints(points) {
    return points.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ');
  }

  function drawCurve(svgId, f, opts = {}) {
    const svg = document.getElementById(svgId);
    if (!svg) return;
    const ns = 'http://www.w3.org/2000/svg';
    svg.innerHTML = '';
    const W = opts.W || 360, H = opts.H || 210;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const mk = drawAxes(svg, W, H);

    const padX = 36, padY = 24;
    const points = [];
    for (let i = 0; i <= 120; i++) {
      const t = i / 120;
      const x = padX + t * (W - padX - 18);
      const yv = f(t);
      const y = (H - padY) - yv * (H - padY - 18);
      points.push([x, y]);
    }

    svg.appendChild(mk('path', {
      d: pathFromPoints(points),
      fill: 'none',
      stroke: 'var(--mint)',
      'stroke-width': 2.6,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round'
    }));

    svg.appendChild(mk('text', { x: W - 14, y: H - 8, fill: 'var(--ink-faint)', 'font-size': 11, 'font-family': 'var(--mono)', 'text-anchor': 'end' }, opts.xLabel || 'time'));
    svg.appendChild(mk('text', { x: 10, y: 18, fill: 'var(--ink-faint)', 'font-size': 11, 'font-family': 'var(--mono)' }, opts.yLabel || 'value'));
  }

  function drawTwoCurves(svgId, f1, f2, labels) {
    const svg = document.getElementById(svgId);
    if (!svg) return;
    const ns = 'http://www.w3.org/2000/svg';
    svg.innerHTML = '';
    const W = 360, H = 210;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const mk = drawAxes(svg, W, H);

    const padX = 36, padY = 24;
    const makePts = f => {
      const pts = [];
      for (let i = 0; i <= 140; i++) {
        const t = i / 140;
        const x = padX + t * (W - padX - 18);
        const yv = f(t);
        const y = (H - padY) - yv * (H - padY - 18);
        pts.push([x, y]);
      }
      return pts;
    };

    svg.appendChild(mk('path', {
      d: pathFromPoints(makePts(f1)),
      fill: 'none',
      stroke: 'var(--mint)',
      'stroke-width': 2.6
    }));
    svg.appendChild(mk('path', {
      d: pathFromPoints(makePts(f2)),
      fill: 'none',
      stroke: 'var(--amber)',
      'stroke-width': 2.6
    }));

    svg.appendChild(mk('text', { x: 16, y: 18, fill: 'var(--mint)', 'font-size': 11, 'font-family': 'var(--mono)' }, labels[0]));
    svg.appendChild(mk('text', { x: 16, y: 34, fill: 'var(--amber)', 'font-size': 11, 'font-family': 'var(--mono)' }, labels[1]));
    svg.appendChild(mk('text', { x: W - 14, y: H - 8, fill: 'var(--ink-faint)', 'font-size': 11, 'font-family': 'var(--mono)', 'text-anchor': 'end' }, 'time'));
  }

  function spectrumValue(kind, w) {
    if (kind === 'white') return 0.55;
    if (kind === 'oneoverf') return Math.min(0.95, 0.09 / Math.max(w, 0.02));
    if (kind === 'narrowband') return 0.12 + 0.7 * Math.exp(-Math.pow((w - 0.62) / 0.08, 2));
    if (kind === 'ohmicish') return 0.9 * w * Math.exp(-2.2 * w);
    return 0;
  }

  function drawSpectrum(svgId, kind, qFreq = 0.72) {
    const svg = document.getElementById(svgId);
    if (!svg) return;
    const ns = 'http://www.w3.org/2000/svg';
    svg.innerHTML = '';
    const W = 360, H = 220;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const mk = drawAxes(svg, W, H, 40, 28);

    const pts = [];
    for (let i = 1; i <= 160; i++) {
      const xN = i / 160;
      const w = 0.02 + 0.98 * xN;
      const y = spectrumValue(kind, w);

      const x = 40 + xN * (W - 60);
      const yy = (H - 28) - y * (H - 50);
      pts.push([x, yy]);
    }

    svg.appendChild(mk('path', {
      d: pathFromPoints(pts),
      fill: 'none',
      stroke: 'var(--mint)',
      'stroke-width': 2.4
    }));

    const qx = 40 + qFreq * (W - 60);
    svg.appendChild(mk('line', { x1: qx, y1: 18, x2: qx, y2: H - 28, stroke: 'var(--amber)', 'stroke-width': 1.5, 'stroke-dasharray': '4 4' }));
    svg.appendChild(mk('text', { x: qx + 4, y: 24, fill: 'var(--amber)', 'font-size': 11, 'font-family': 'var(--mono)' }, 'ωq'));
    svg.appendChild(mk('text', { x: 20, y: 20, fill: 'var(--ink-faint)', 'font-size': 11, 'font-family': 'var(--mono)' }, 'S(ω)'));
    svg.appendChild(mk('text', { x: W - 8, y: H - 8, fill: 'var(--ink-faint)', 'font-size': 11, 'font-family': 'var(--mono)', 'text-anchor': 'end' }, 'frequency'));
  }

  function drawPopulationMeter(containerId, pExcited) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const pE = Math.max(0, Math.min(1, pExcited));
    const pG = 1 - pE;
    el.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;">
        <div style="border:1px solid var(--line);border-radius:8px;padding:8px;background:var(--bg-2);">
          <div style="font-family:var(--mono);font-size:10px;color:var(--ink-faint);">Excited |1⟩</div>
          <div style="height:10px;background:var(--line);border-radius:999px;margin-top:6px;overflow:hidden;">
            <div style="height:100%;width:${100 * pE}%;background:linear-gradient(90deg,var(--amber),var(--magenta));"></div>
          </div>
          <div style="font-family:var(--mono);font-size:11px;color:var(--amber);margin-top:5px;">${fmt(100 * pE, 1)}%</div>
        </div>
        <div style="border:1px solid var(--line);border-radius:8px;padding:8px;background:var(--bg-2);">
          <div style="font-family:var(--mono);font-size:10px;color:var(--ink-faint);">Ground |0⟩</div>
          <div style="height:10px;background:var(--line);border-radius:999px;margin-top:6px;overflow:hidden;">
            <div style="height:100%;width:${100 * pG}%;background:linear-gradient(90deg,var(--cyan),var(--mint));"></div>
          </div>
          <div style="font-family:var(--mono);font-size:11px;color:var(--mint);margin-top:5px;">${fmt(100 * pG, 1)}%</div>
        </div>
      </div>
    `;
  }

  function drawPhaseDial(svgId, coherence, phase = 0.8) {
    const svg = document.getElementById(svgId);
    if (!svg) return;
    const ns = 'http://www.w3.org/2000/svg';
    svg.innerHTML = '';
    const W = 230, H = 160, cx = 80, cy = 84, R = 52;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    function mk(tag, attrs, text) {
      const e = document.createElementNS(ns, tag);
      Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
      if (text) e.textContent = text;
      return e;
    }
    const coh = Math.max(0, Math.min(1, coherence));
    const tipX = cx + R * coh * Math.cos(phase);
    const tipY = cy - R * coh * Math.sin(phase);
    svg.appendChild(mk('circle', { cx, cy, r: R, fill: 'none', stroke: 'var(--line-bright)', 'stroke-width': 1.2 }));
    svg.appendChild(mk('line', { x1: cx - R - 6, y1: cy, x2: cx + R + 6, y2: cy, stroke: 'var(--line)', 'stroke-width': 1 }));
    svg.appendChild(mk('line', { x1: cx, y1: cy - R - 6, x2: cx, y2: cy + R + 6, stroke: 'var(--line)', 'stroke-width': 1 }));
    svg.appendChild(mk('line', { x1: cx, y1: cy, x2: tipX, y2: tipY, stroke: 'var(--mint)', 'stroke-width': 3, 'stroke-linecap': 'round' }));
    svg.appendChild(mk('circle', { cx: tipX, cy: tipY, r: 4.2, fill: 'var(--mint)' }));
    svg.appendChild(mk('text', { x: 148, y: 62, fill: 'var(--ink-faint)', 'font-size': 10, 'font-family': 'var(--mono)' }, '|ρ01|'));
    svg.appendChild(mk('text', { x: 148, y: 80, fill: 'var(--mint)', 'font-size': 16, 'font-family': 'var(--mono)' }, fmt(coh, 3)));
    svg.appendChild(mk('text', { x: 148, y: 102, fill: 'var(--ink-dim)', 'font-size': 10, 'font-family': 'var(--mono)' }, coh < 0.35 ? 'phase mostly scrambled' : 'phase still trackable'));
  }

  function drawPulseSequence(svgId, kind, probe) {
    const svg = document.getElementById(svgId);
    if (!svg) return;
    const ns = 'http://www.w3.org/2000/svg';
    svg.innerHTML = '';
    const W = 340, H = 132;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    function mk(tag, attrs, text) {
      const e = document.createElementNS(ns, tag);
      Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
      if (text) e.textContent = text;
      return e;
    }
    svg.appendChild(mk('line', { x1: 24, y1: 86, x2: W - 16, y2: 86, stroke: 'var(--line-bright)', 'stroke-width': 1.2 }));
    svg.appendChild(mk('rect', { x: 36, y: 58, width: 22, height: 28, rx: 4, fill: 'var(--mint)', opacity: 0.95 }));
    svg.appendChild(mk('text', { x: 47, y: 52, fill: 'var(--mint)', 'font-size': 10, 'text-anchor': 'middle', 'font-family': 'var(--mono)' }, 'π/2'));
    if (kind === 'oneoverf') {
      svg.appendChild(mk('rect', { x: 152, y: 50, width: 24, height: 36, rx: 4, fill: 'var(--amber)', opacity: 0.95 }));
      svg.appendChild(mk('text', { x: 164, y: 44, fill: 'var(--amber)', 'font-size': 10, 'text-anchor': 'middle', 'font-family': 'var(--mono)' }, 'π'));
    }
    svg.appendChild(mk('rect', { x: 272, y: 58, width: 22, height: 28, rx: 4, fill: 'var(--mint)', opacity: 0.95 }));
    svg.appendChild(mk('text', { x: 283, y: 52, fill: 'var(--mint)', 'font-size': 10, 'text-anchor': 'middle', 'font-family': 'var(--mono)' }, 'π/2'));
    const px = 36 + Math.max(0, Math.min(1, probe)) * 258;
    svg.appendChild(mk('line', { x1: px, y1: 24, x2: px, y2: 96, stroke: 'var(--magenta)', 'stroke-width': 1.5, 'stroke-dasharray': '4 4' }));
    svg.appendChild(mk('text', { x: px + 5, y: 22, fill: 'var(--magenta)', 'font-size': 10, 'font-family': 'var(--mono)' }, 'probe t'));
    svg.appendChild(mk('text', { x: 20, y: 114, fill: 'var(--ink-faint)', 'font-size': 10, 'font-family': 'var(--mono)' }, kind === 'oneoverf' ? 'Echo sequence refocuses slow drift' : 'Ramsey-like free precession'));
  }

  // Lightweight channel backend used by Tutorial 9 visuals.
  // rho = { p0, p1, re01, im01 } for a single-qubit density matrix.
  function applyAmplitudeDamping(rho, gamma) {
    const g = Math.max(0, Math.min(1, gamma));
    const s = Math.sqrt(1 - g);
    const p1 = (1 - g) * rho.p1;
    const p0 = 1 - p1;
    return { p0, p1, re01: s * rho.re01, im01: s * rho.im01 };
  }

  function applyPureDephasing(rho, lambda) {
    const l = Math.max(0, Math.min(1, lambda));
    return { p0: rho.p0, p1: rho.p1, re01: l * rho.re01, im01: l * rho.im01 };
  }

  window.t9Utils = {
    fmt, drawCurve, drawTwoCurves, drawSpectrum, spectrumValue,
    drawPopulationMeter, drawPhaseDial, drawPulseSequence,
    applyAmplitudeDamping, applyPureDephasing
  };
})();

/* ---- T9 Step 1: T1 relaxation ---- */
(function initT9Step1() {
  const slider = document.getElementById('t9-t1-slider');
  const val = document.getElementById('t9-t1-val');
  const cap = document.getElementById('t9-t1-caption');
  if (!slider) return;

  function update() {
    const T1 = parseFloat(slider.value);
    if (val) val.textContent = `${T1} μs`;

    t9Utils.drawCurve('t9-t1-plot', t => {
      const tau = 20 * t;
      const gamma = 1 - Math.exp(-tau / T1);
      const out = t9Utils.applyAmplitudeDamping({ p0: 0, p1: 1, re01: 0, im01: 0 }, gamma);
      return out.p1;
    }, {
      yLabel: 'P(|1⟩)',
      xLabel: 'time'
    });

    if (cap) {
      const halfLife = Math.log(2) * T1;
      const at20 = Math.exp(-20 / T1);
      const probeT = 20;
      cap.innerHTML = `
        <b>T1 = energy relaxation time.</b> Start in |1⟩ and the excited-state population decays exponentially back toward |0⟩.
        <br><span style="color:var(--ink-faint)">
          In an OQS picture, this is an amplitude-damping channel driven by bath noise near the qubit transition frequency.
        </span>
        <div id="t9-t1-meter"></div>
        <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--line);font-family:var(--mono);font-size:11px;color:var(--ink-dim)">
          50% lifetime: ${t9Utils.fmt(halfLife, 2)} μs · P(|1⟩) at ${probeT} μs: ${t9Utils.fmt(at20, 3)}
        </div>
      `;
      t9Utils.drawPopulationMeter('t9-t1-meter', at20);
    }
    markDone('t9-1');
  }

  slider.addEventListener('input', update);
  update();
})();

/* ---- T9 Step 2: pure dephasing ---- */
(function initT9Step2() {
  const slider = document.getElementById('t9-dephase-slider');
  const val = document.getElementById('t9-dephase-val');
  const cap = document.getElementById('t9-dephase-caption');
  if (!slider) return;

  function update() {
    const Tphi = parseFloat(slider.value);
    if (val) val.textContent = `${Tphi} μs`;

    t9Utils.drawCurve('t9-dephase-plot', t => {
      const tau = 20 * t;
      const lambda = Math.exp(-tau / Tphi);
      const out = t9Utils.applyPureDephasing({ p0: 0.5, p1: 0.5, re01: 0.5, im01: 0 }, lambda);
      return Math.hypot(out.re01, out.im01) * 2;
    }, {
      yLabel: '|ρ01|',
      xLabel: 'time'
    });

    if (cap) {
      const at20 = Math.exp(-20 / Tphi);
      const at40 = Math.exp(-40 / Tphi);
      cap.innerHTML = `
        <b>Pure dephasing</b> does not move population from |1⟩ to |0⟩.
        It scrambles phase, so superpositions lose contrast even when the average energy stays the same.
        <div style="margin-top:8px;">
          <svg id="t9-dephase-dial" style="width:100%;max-width:250px;height:auto;"></svg>
        </div>
        <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--line);font-family:var(--mono);font-size:11px;color:var(--ink-dim)">
          |ρ<sub>01</sub>| at 20 μs: ${t9Utils.fmt(at20, 3)} · at 40 μs: ${t9Utils.fmt(at40, 3)}
        </div>
      `;
      t9Utils.drawPhaseDial('t9-dephase-dial', at20);
    }
    markDone('t9-2');
  }

  slider.addEventListener('input', update);
  update();
})();

/* ---- T9 Step 3: T2 relation ---- */
(function initT9Step3() {
  const t1 = document.getElementById('t9-T1');
  const tphi = document.getElementById('t9-Tphi');
  const t1v = document.getElementById('t9-T1-val');
  const tphiv = document.getElementById('t9-Tphi-val');
  const t2v = document.getElementById('t9-T2-val');
  const cap = document.getElementById('t9-t2-caption');
  if (!t1 || !tphi) return;

  function update() {
    const T1 = parseFloat(t1.value);
    const Tphi = parseFloat(tphi.value);
    const T2 = 1 / (1 / (2 * T1) + 1 / Tphi);

    if (t1v) t1v.textContent = `${T1} μs`;
    if (tphiv) tphiv.textContent = `${Tphi} μs`;
    if (t2v) t2v.textContent = `${t9Utils.fmt(T2, 2)} μs`;

    // Normalized abscissa tt ∈ [0,1] on the plot (not literal μs on the tick marks).
    // We plot exp(−(tt/T) · k) with k = 6·4: ~6 e-folds of “story” across the width, 4× stretch so T1 vs T2 stay visually distinct (schematic).
    const T2_PLOT_EFOLDS = 6;
    const T2_PLOT_EMPH = 4;
    const t2PlotK = T2_PLOT_EFOLDS * T2_PLOT_EMPH;
    t9Utils.drawTwoCurves(
      't9-t2-plot',
      tt => Math.exp(-t2PlotK * tt / T1),
      tt => Math.exp(-t2PlotK * tt / T2),
      ['population decay ~ T1', 'coherence decay ~ T2']
    );

    if (cap) {
      const r1 = 1 / (2 * T1);
      const rPhi = 1 / Tphi;
      const relaxPct = (100 * r1) / (r1 + rPhi);
      const dephasePct = 100 - relaxPct;
      const limiter = relaxPct > dephasePct ? 'relaxation-limited' : 'dephasing-limited';
      cap.innerHTML = `
        <b>Key relation:</b> 1/T<sub>2</sub> = 1/(2T<sub>1</sub>) + 1/T<sub>ϕ</sub><a id="fnref-t9-1" class="expert-fn-ref" href="#fn-t9-1"><sup>[E1]</sup></a><br>
        <span style="color:var(--ink-faint)">
          Relaxation alone already hurts phase coherence, and any extra low-frequency phase noise makes T2 even shorter.
        </span>
        <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--line);font-family:var(--mono);font-size:11px;">
          Contribution to 1/T<sub>2</sub>: relaxation ${t9Utils.fmt(relaxPct, 1)}% · pure dephasing ${t9Utils.fmt(dephasePct, 1)}%<br>
          Regime: <span style="color:var(--cyan)">${limiter}</span>
        </div>
      `;
    }
    markDone('t9-3');
  }

  t1.addEventListener('input', update);
  tphi.addEventListener('input', update);
  update();
})();

/* ---- T9 Step 4: spectral density intuition ---- */
(function initT9Step4() {
  const sel = document.getElementById('t9-spectrum-select');
  const run = document.getElementById('t9-spectrum-run');
  const note = document.getElementById('t9-spectrum-note');
  if (!sel || !run) return;

  let qFreq = 0.72;

  function renderSpectrum() {
    const kind = sel.value;
    t9Utils.drawSpectrum('t9-spectrum-svg', kind, qFreq);

    const text = {
      white: 'Nearly flat noise puts weight at many frequencies. If it is present near ωq, it can drive relaxation efficiently.',
      oneoverf: '1/f noise is strongest near zero frequency. It is a classic source of slow frequency wandering and dephasing.',
      narrowband: 'A sharp spectral feature near the qubit frequency can enhance relaxation strongly at one specific transition.',
      ohmicish: 'An Ohmic-like bath weights higher frequencies differently and is the kind of spectrum often used in Redfield-style models.'
    };

    const low = t9Utils.spectrumValue(kind, 0.04);
    const atQ = t9Utils.spectrumValue(kind, qFreq);
    const ratio = atQ / Math.max(low, 1e-6);
    const tendency = ratio > 1.2 ? 'more relaxation-prone at this ωq' : (ratio < 0.8 ? 'more dephasing-prone at this ωq' : 'mixed regime');

    if (note) {
      note.innerHTML = `
        ${text[kind]}<br>
        <span style="color:var(--ink-faint)">
          Hardware summary: noise near ω ≈ 0 mainly dephases; noise near ω ≈ ω<sub>q</sub> mainly relaxes.
        </span>
        <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--line);font-family:var(--mono);font-size:11px;color:var(--ink-dim)">
          Probe ω<sub>q</sub>:
          <input id="t9-spectrum-wq" type="range" min="0.1" max="0.95" step="0.01" value="${qFreq}" style="width:130px;vertical-align:middle;accent-color:var(--amber)" />
          <span id="t9-spectrum-wq-val" style="color:var(--amber)">${t9Utils.fmt(qFreq, 2)}</span><br>
          S(near 0): ${t9Utils.fmt(low, 3)} · S(ω<sub>q</sub>): ${t9Utils.fmt(atQ, 3)} · Regime: <span style="color:var(--cyan)">${tendency}</span>
        </div>
      `;
      const wq = document.getElementById('t9-spectrum-wq');
      const wqVal = document.getElementById('t9-spectrum-wq-val');
      if (wq) {
        wq.addEventListener('input', () => {
          qFreq = parseFloat(wq.value);
          if (wqVal) wqVal.textContent = t9Utils.fmt(qFreq, 2);
          renderSpectrum();
        });
      }
    }
    markDone('t9-4');
  }

  run.addEventListener('click', renderSpectrum);
  sel.addEventListener('change', renderSpectrum);

  renderSpectrum();
})();

/* ---- T9 Step 5: Ramsey vs echo (fringes with drift) ---- */
(function initT9Step5() {
  const sel = document.getElementById('t9-echo-select');
  const run = document.getElementById('t9-echo-run');
  const note = document.getElementById('t9-echo-note');
  if (!sel || !run) return;

  run.addEventListener('click', () => {
    const kind = sel.value;
    let probe = 0.5;

    let cfg;
    if (kind === 'oneoverf') {
      cfg = { TphiFast: 0.38, T1: 0.95, deltaBase: 58, sigmaSlow: 10, txt: 'For slow 1/f-like noise, Ramsey fringes wash out quickly from drift; echo cancels much of that slow component.' };
    } else if (kind === 'white') {
      cfg = { TphiFast: 0.33, T1: 0.85, deltaBase: 42, sigmaSlow: 1.5, txt: 'For fast, memoryless noise, both Ramsey and echo decay similarly because there is little slow drift to refocus.' };
    } else {
      cfg = { TphiFast: 0.30, T1: 0.9, deltaBase: 50, sigmaSlow: 5, txt: 'Structured noise gives visibly distorted Ramsey fringes; echo suppresses the slow wandering term and smooths the decay.' };
    }

    // Same shot ensemble as Ramsey: static detuning (deltaBase) + per-shot inhomogeneous drift. Ramsey keeps full (δ+ε) in the fringe phase.
    function ramseySignal(tNorm) {
      const nAvg = 25;
      let acc = 0;
      for (let k = 0; k < nAvg; k++) {
        const drift = cfg.sigmaSlow * Math.sin(0.7 * (k + 1));
        const phase = (cfg.deltaBase + drift) * tNorm;
        const dephase = Math.exp(-tNorm / cfg.TphiFast);
        const relax = Math.exp(-tNorm / (2 * cfg.T1));
        acc += 0.5 * (1 + dephase * relax * Math.cos(phase));
      }
      return acc / nAvg;
    }

    // Hahn-style echo: same τ ensemble; phase uses only the residual inhomogeneous part after refocusing δ (first order). Slightly looser Tφ on the echo envelope to mimic refocusing of the fast dephasing channel (1.55 ≈ old schematic 1.8).
    function echoSignal(tNorm) {
      const nAvg = 25;
      let acc = 0;
      const echoTphiScale = 1.55;
      for (let k = 0; k < nAvg; k++) {
        const drift = cfg.sigmaSlow * Math.sin(0.7 * (k + 1));
        const phaseEcho = drift * tNorm;
        const dephase = Math.exp(-tNorm / (cfg.TphiFast * echoTphiScale));
        const relax = Math.exp(-tNorm / (2 * cfg.T1));
        acc += 0.5 * (1 + dephase * relax * Math.cos(phaseEcho));
      }
      return acc / nAvg;
    }

    t9Utils.drawTwoCurves('t9-echo-svg', ramseySignal, echoSignal, ['Ramsey fringes', 'Echo (refocused)']);

    if (note) {
      function renderProbePanel() {
        const ramseyProbe = Math.max(0, ramseySignal(probe));
        const echoProbe = Math.max(0, echoSignal(probe));
        const gain = echoProbe / Math.max(ramseyProbe, 1e-6);
        note.innerHTML = `
          ${cfg.txt}<br>
          <span style="color:var(--ink-faint)">
            This reproduces the common experimental shape: oscillatory Ramsey fringes under a decaying envelope, with echo extending coherence by refocusing slow drift.
          </span>
          <div style="margin-top:8px;border:1px solid var(--line);border-radius:10px;padding:8px;background:var(--bg-2);">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-family:var(--mono);font-size:11px;color:var(--ink-dim);">
              Probe time
              <input id="t9-echo-probe" type="range" min="0.05" max="0.95" step="0.01" value="${probe}" style="width:140px;accent-color:var(--magenta)" />
              <span id="t9-echo-probe-val" style="color:var(--magenta)">${t9Utils.fmt(probe, 2)}</span>
            </div>
            <svg id="t9-echo-pulses" style="width:100%;max-width:340px;height:auto;margin-top:8px;"></svg>
          </div>
          <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--line);font-family:var(--mono);font-size:11px;color:var(--ink-dim)">
            Signal at t=${t9Utils.fmt(probe, 2)}: Ramsey ${t9Utils.fmt(ramseyProbe, 3)} · Echo ${t9Utils.fmt(echoProbe, 3)} · Echo gain ${t9Utils.fmt(gain, 2)}x
          </div>
        `;
        t9Utils.drawPulseSequence('t9-echo-pulses', kind, probe);
        const probeSlider = document.getElementById('t9-echo-probe');
        const probeVal = document.getElementById('t9-echo-probe-val');
        if (probeSlider) {
          probeSlider.addEventListener('input', () => {
            probe = parseFloat(probeSlider.value);
            if (probeVal) probeVal.textContent = t9Utils.fmt(probe, 2);
            renderProbePanel();
          });
        }
      }

      renderProbePanel();
    }
    markDone('t9-5');
  });
})();

/* ---- T9 Step 6: device-level intuition ---- */
(function initT9Step6() {
  const wrap = document.getElementById('t9-device-buttons');
  const out = document.getElementById('t9-device-out');
  if (!wrap || !out) return;

  const cards = {
    transmon: `
      <b>Transmon-style intuition</b><br>
      Usually engineered to suppress charge noise strongly, but still sensitive to dielectric loss, quasiparticles, Purcell loss, and flux noise if tunable.
      In Step 1, when you dragged T1 toward the <i>shorter</i> end (e.g. a few μs), you were in a regime where dielectric and surface loss often dominate—exactly the story these chips are tuned to fight with materials and purcell filters.
    `,
    flux: `
      <b>Flux-tunable device intuition</b><br>
      Flux tuning is powerful, but it exposes the qubit more directly to low-frequency flux noise, which often shows up as dephasing away from sweet spots.
      That lines up with Step 2: pushing pure dephasing T<sub>ϕ</sub> shorter mimics what happens when you leave a flux sweet spot—T2 drops even if T1 still looks “okay.”
    `,
    generic: `
      <b>Big picture</b><br>
      T1 is often limited by dissipation channels and spectral weight near the qubit frequency.
      T2 is often limited by both T1 and slow wandering from low-frequency noise sources.
      Step 3’s sliders made that explicit: 1/T<sub>2</sub> = 1/(2T<sub>1</sub>) + 1/T<sub>ϕ</sub> is the same decomposition you use when reading vendor spec sheets.
    `,
    compare: `
      <b>T1 vs T2 tradeoffs (rule-of-thumb)</b><br>
      <div style="margin-top:8px;overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;font-family:var(--mono);font-size:12px">
          <thead>
            <tr style="border-bottom:1px solid var(--line)">
              <th style="text-align:left;padding:4px 8px 4px 0">Archetype</th>
              <th style="text-align:left;padding:4px 8px">T1 (typ. trend)</th>
              <th style="text-align:left;padding:4px 8px">T2 (typ. limiter)</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style="padding:6px 8px 4px 0;vertical-align:top">Transmon (fixed freq.)</td><td style="padding:4px 8px;vertical-align:top">Often strong (10–100+ μs in good films)</td><td style="padding:4px 8px;vertical-align:top">T<sub>ϕ</sub> from 1/f flux &amp; photon shot; echo helps</td></tr>
            <tr><td style="padding:4px 8px 4px 0;vertical-align:top">Flux-tunable / tunable coupler</td><td style="padding:4px 8px;vertical-align:top">Competitive, but can trade off with control wiring</td><td style="padding:4px 8px;vertical-align:top">Extra flux — often T2 &lt; T1/2 at non-sweet spots</td></tr>
            <tr><td style="padding:4px 8px 0 0;vertical-align:top">“Generic” multi-q</td><td style="padding:4px 8px;vertical-align:top">Varies with packaging &amp; line</td><td style="padding:4px 8px;vertical-align:top">Crosstalk + readout + bath — use Steps 1–3 as a mental dashboard</td></tr>
          </tbody>
        </table>
      </div>
      <div style="margin-top:8px;color:var(--ink-faint);font-size:13px">Numbers are <i>archetype-level</i> trends, not benchmarks; use them to know what to re-check first when a device’s T1 and T2 disagree.</div>
    `
  };

  let seen = new Set();

  wrap.querySelectorAll('[data-device]').forEach(btn => {
    btn.addEventListener('click', () => {
      wrap.querySelectorAll('[data-device]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      out.innerHTML = cards[btn.dataset.device];
      seen.add(btn.dataset.device);
      if (seen.size >= 2) markDone('t9-6');
    });
  });

  const first = wrap.querySelector('[data-device]');
  if (first) {
    first.classList.add('active');
    out.innerHTML = cards[first.dataset.device];
  }
})();