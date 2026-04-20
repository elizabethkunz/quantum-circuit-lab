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
      stroke: 'var(--phos)',
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
      stroke: 'var(--phos)',
      'stroke-width': 2.6
    }));
    svg.appendChild(mk('path', {
      d: pathFromPoints(makePts(f2)),
      fill: 'none',
      stroke: 'var(--amber)',
      'stroke-width': 2.6
    }));

    svg.appendChild(mk('text', { x: 16, y: 18, fill: 'var(--phos)', 'font-size': 11, 'font-family': 'var(--mono)' }, labels[0]));
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
      stroke: 'var(--phos)',
      'stroke-width': 2.4
    }));

    const qx = 40 + qFreq * (W - 60);
    svg.appendChild(mk('line', { x1: qx, y1: 18, x2: qx, y2: H - 28, stroke: 'var(--amber)', 'stroke-width': 1.5, 'stroke-dasharray': '4 4' }));
    svg.appendChild(mk('text', { x: qx + 4, y: 24, fill: 'var(--amber)', 'font-size': 11, 'font-family': 'var(--mono)' }, 'ωq'));
    svg.appendChild(mk('text', { x: 20, y: 20, fill: 'var(--ink-faint)', 'font-size': 11, 'font-family': 'var(--mono)' }, 'S(ω)'));
    svg.appendChild(mk('text', { x: W - 8, y: H - 8, fill: 'var(--ink-faint)', 'font-size': 11, 'font-family': 'var(--mono)', 'text-anchor': 'end' }, 'frequency'));
  }

  window.t9Utils = { fmt, drawCurve, drawTwoCurves, drawSpectrum, spectrumValue };
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

    t9Utils.drawCurve('t9-t1-plot', t => Math.exp(-5 * t / T1 * 4), {
      yLabel: 'P(|1⟩)',
      xLabel: 'time'
    });

    if (cap) {
      const halfLife = Math.log(2) * T1;
      const at20 = Math.exp(-20 / T1);
      cap.innerHTML = `
        <b>T1 = energy relaxation time.</b> Start in |1⟩ and the excited-state population decays exponentially back toward |0⟩.
        <br><span style="color:var(--ink-faint)">
          In an OQS picture, this is driven by bath noise near the qubit transition frequency.
        </span>
        <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--line);font-family:var(--mono);font-size:11px;color:var(--ink-dim)">
          50% lifetime: ${t9Utils.fmt(halfLife, 2)} μs · P(|1⟩) at 20 μs: ${t9Utils.fmt(at20, 3)}
        </div>
      `;
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

    t9Utils.drawCurve('t9-dephase-plot', t => Math.exp(-5 * t / Tphi * 4), {
      yLabel: '|ρ01|',
      xLabel: 'time'
    });

    if (cap) {
      const at20 = Math.exp(-20 / Tphi);
      const at40 = Math.exp(-40 / Tphi);
      cap.innerHTML = `
        <b>Pure dephasing</b> does not move population from |1⟩ to |0⟩.
        It scrambles phase, so superpositions lose contrast even when the average energy stays the same.
        <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--line);font-family:var(--mono);font-size:11px;color:var(--ink-dim)">
          |ρ<sub>01</sub>| at 20 μs: ${t9Utils.fmt(at20, 3)} · at 40 μs: ${t9Utils.fmt(at40, 3)}
        </div>
      `;
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

    t9Utils.drawTwoCurves(
      't9-t2-plot',
      tt => Math.exp(-6 * tt / T1 * 4),
      tt => Math.exp(-6 * tt / T2 * 4),
      ['population decay ~ T1', 'coherence decay ~ T2']
    );

    if (cap) {
      const r1 = 1 / (2 * T1);
      const rPhi = 1 / Tphi;
      const relaxPct = (100 * r1) / (r1 + rPhi);
      const dephasePct = 100 - relaxPct;
      const limiter = relaxPct > dephasePct ? 'relaxation-limited' : 'dephasing-limited';
      cap.innerHTML = `
        <b>Key relation:</b> 1/T<sub>2</sub> = 1/(2T<sub>1</sub>) + 1/T<sub>ϕ</sub><br>
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

/* ---- T9 Step 5: Ramsey vs echo ---- */
(function initT9Step5() {
  const sel = document.getElementById('t9-echo-select');
  const run = document.getElementById('t9-echo-run');
  const note = document.getElementById('t9-echo-note');
  if (!sel || !run) return;

  run.addEventListener('click', () => {
    const kind = sel.value;

    let ramsey, echo, txt;
    if (kind === 'oneoverf') {
      ramsey = t => Math.exp(-8 * t * t);
      echo = t => Math.exp(-4.2 * t * t);
      txt = 'For slow 1/f-like noise, echo refocuses some of the drift, so coherence lasts noticeably longer.';
    } else if (kind === 'white') {
      ramsey = t => Math.exp(-5.5 * t);
      echo = t => Math.exp(-5.1 * t);
      txt = 'For fast, memoryless noise, echo helps much less. There is not much slow drift to refocus.';
    } else {
      ramsey = t => Math.exp(-5.7 * t) * (0.72 + 0.28 * Math.cos(24 * t));
      echo = t => Math.exp(-5.0 * t);
      txt = 'Structured noise can create beating or distortion in Ramsey. Echo often smooths that out if the noise is slow enough.';
    }

    t9Utils.drawTwoCurves('t9-echo-svg', ramsey, echo, ['Ramsey', 'Echo']);

    if (note) {
      const probe = 0.5;
      const ramseyProbe = Math.max(0, ramsey(probe));
      const echoProbe = Math.max(0, echo(probe));
      const gain = echoProbe / Math.max(ramseyProbe, 1e-6);
      note.innerHTML = `
        ${txt}<br>
        <span style="color:var(--ink-faint)">
          This is why experimental papers often quote both T<sub>2</sub><sup>*</sup> (Ramsey) and T<sub>2</sub><sup>echo</sup>.
        </span>
        <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--line);font-family:var(--mono);font-size:11px;color:var(--ink-dim)">
          Mid-sequence signal at t=0.5: Ramsey ${t9Utils.fmt(ramseyProbe, 3)} · Echo ${t9Utils.fmt(echoProbe, 3)} · Echo gain ${t9Utils.fmt(gain, 2)}x
        </div>
      `;
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
    `,
    flux: `
      <b>Flux-tunable device intuition</b><br>
      Flux tuning is powerful, but it exposes the qubit more directly to low-frequency flux noise, which often shows up as dephasing away from sweet spots.
    `,
    generic: `
      <b>Big picture</b><br>
      T1 is often limited by dissipation channels and spectral weight near the qubit frequency.
      T2 is often limited by both T1 and slow wandering from low-frequency noise sources.
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