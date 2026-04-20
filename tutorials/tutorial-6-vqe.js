/* =========================================================================
   TUTORIAL 6: VARIATIONAL QUANTUM EIGENSOLVER (VQE)
   ========================================================================= */

/* ---- shared tiny helpers ---- */
(function initT6Shared() {
  if (window.__t6VQEHelpersReady) return;
  window.__t6VQEHelpersReady = true;

  window.t6WrapTheta = function(theta) {
    const twoPi = Math.PI * 2;
    let t = theta % twoPi;
    if (t < 0) t += twoPi;
    return t;
  };

  // Simple 1-qubit Hamiltonian for a visual tutorial:
  // H = -0.7 Z - 0.4 X
  // Ansatz |psi(theta)> = R_y(theta)|0>
  // <Z> = cos(theta), <X> = sin(theta)
  // E(theta) = -0.7 cos(theta) - 0.4 sin(theta)
  window.t6Energy = function(theta) {
    return -0.7 * Math.cos(theta) - 0.4 * Math.sin(theta);
  };
  window.t6ExpectZ = function(theta) {
    return Math.cos(theta);
  };
  window.t6ExpectX = function(theta) {
    return Math.sin(theta);
  };
  window.t6GroundTheta = function() {
    return Math.atan2(0.4, 0.7);
  };
  window.t6GroundEnergy = function() {
    return -Math.sqrt(0.7 * 0.7 + 0.4 * 0.4);
  };
})();

/* ---- T6 Step 1: move through the energy landscape ---- */
(function initT6Step1() {
  const slider = document.getElementById('vqe-theta-slider');
  const thetaVal = document.getElementById('vqe-theta-val');
  const energyVal = document.getElementById('vqe-energy-val');
  const stateEl = document.getElementById('vqe-state-readout');
  const chart = document.getElementById('vqe-landscape');
  if (!slider || !chart) return;

  let touched = false;

  function drawLandscape(theta) {
    const ns = 'http://www.w3.org/2000/svg';
    chart.innerHTML = '';
    const W = 420, H = 180, padL = 36, padR = 16, padT = 12, padB = 30;
    const xMin = 0, xMax = Math.PI * 2;
    const yMin = -0.92, yMax = 0.92;
    const xScale = x => padL + ((x - xMin) / (xMax - xMin)) * (W - padL - padR);
    const yScale = y => H - padB - ((y - yMin) / (yMax - yMin)) * (H - padT - padB);
    function mk(tag, attrs, text) {
      const el = document.createElementNS(ns, tag);
      for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
      if (text != null) el.textContent = text;
      return el;
    }

    chart.appendChild(mk('line', { x1: padL, y1: yScale(0), x2: W - padR, y2: yScale(0), stroke: 'var(--line)', 'stroke-width': 1 }));
    chart.appendChild(mk('line', { x1: padL, y1: padT, x2: padL, y2: H - padB, stroke: 'var(--line-bright)', 'stroke-width': 1 }));
    chart.appendChild(mk('line', { x1: padL, y1: H - padB, x2: W - padR, y2: H - padB, stroke: 'var(--line-bright)', 'stroke-width': 1 }));

    [0, Math.PI/2, Math.PI, 3*Math.PI/2, 2*Math.PI].forEach((t, i) => {
      const labels = ['0', 'π/2', 'π', '3π/2', '2π'];
      chart.appendChild(mk('line', {
        x1: xScale(t), y1: H - padB, x2: xScale(t), y2: H - padB + 5,
        stroke: 'var(--line-bright)', 'stroke-width': 1
      }));
      chart.appendChild(mk('text', {
        x: xScale(t), y: H - 8, 'font-family': 'var(--mono)', 'font-size': 9,
        fill: 'var(--ink-faint)', 'text-anchor': 'middle'
      }, labels[i]));
    });

    [-0.8, -0.4, 0, 0.4, 0.8].forEach(v => {
      chart.appendChild(mk('line', { x1: padL - 4, y1: yScale(v), x2: padL, y2: yScale(v), stroke: 'var(--line-bright)', 'stroke-width': 1 }));
      chart.appendChild(mk('text', {
        x: padL - 8, y: yScale(v) + 3, 'font-family': 'var(--mono)', 'font-size': 8,
        fill: 'var(--ink-faint)', 'text-anchor': 'end'
      }, v.toFixed(1)));
    });

    let d = '';
    for (let i = 0; i <= 160; i++) {
      const t = (i / 160) * (Math.PI * 2);
      const x = xScale(t);
      const y = yScale(window.t6Energy(t));
      d += (i === 0 ? 'M ' : ' L ') + x + ' ' + y;
    }
    chart.appendChild(mk('path', {
      d,
      fill: 'none',
      stroke: 'var(--phos)',
      'stroke-width': 2
    }));

    const gt = window.t6GroundTheta();
    chart.appendChild(mk('circle', {
      cx: xScale(gt), cy: yScale(window.t6GroundEnergy()), r: 4,
      fill: 'var(--amber)'
    }));
    chart.appendChild(mk('text', {
      x: xScale(gt) + 8, y: yScale(window.t6GroundEnergy()) - 8,
      'font-family': 'var(--mono)', 'font-size': 9, fill: 'var(--amber)'
    }, 'true minimum'));

    chart.appendChild(mk('circle', {
      cx: xScale(theta), cy: yScale(window.t6Energy(theta)), r: 5,
      fill: 'var(--cyan)'
    }));
  }

  function update() {
    const theta = parseFloat(slider.value);
    const e = window.t6Energy(theta);
    if (thetaVal) thetaVal.textContent = theta.toFixed(2) + ' rad';
    if (energyVal) energyVal.textContent = e.toFixed(3);
    if (stateEl) {
      const z = window.t6ExpectZ(theta);
      const x = window.t6ExpectX(theta);
      stateEl.innerHTML = `<span class="rlabel">⟨Z⟩</span> <span class="rval">${z.toFixed(3)}</span><br>` +
                          `<span class="rlabel">⟨X⟩</span> <span class="rval">${x.toFixed(3)}</span><br>` +
                          `<span class="rlabel">idea</span> <span class="rmini">The ansatz angle moves the state around the Bloch sphere. VQE just keeps adjusting that angle until the measured energy is as low as possible.</span>`;
    }
    drawLandscape(theta);
    if (!touched) touched = true;
    if (touched) markDone('t6-1');
  }

  slider.addEventListener('input', update);
  update();
})();

/* ---- T6 Step 2: sample energies manually ---- */
(function initT6Step2() {
  const buttons = document.querySelectorAll('.vqe-sample-btn');
  const table = document.getElementById('vqe-sample-table');
  const verdict = document.getElementById('vqe-sample-verdict');
  if (!buttons.length || !table) return;

  const seen = new Set();
  const sampled = [];

  function render() {
    if (!sampled.length) {
      table.innerHTML = '<div class="placeholder-output" style="padding:18px 0">Take a few samples across the landscape.</div>';
      return;
    }
    const best = sampled.reduce((a, b) => b.energy < a.energy ? b : a, sampled[0]);
    table.innerHTML = `
      <table class="amp-table">
        <thead>
          <tr><th>θ</th><th class="num">⟨Z⟩</th><th class="num">⟨X⟩</th><th class="num">Energy</th></tr>
        </thead>
        <tbody>
          ${sampled.map(row => `
            <tr${row.theta === best.theta ? ' style="background:rgba(127,255,196,0.05)"' : ''}>
              <td class="basis">${row.label}</td>
              <td class="num">${row.z.toFixed(3)}</td>
              <td class="num">${row.x.toFixed(3)}</td>
              <td class="num ${row.energy === best.energy ? 'mag big' : ''}">${row.energy.toFixed(3)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>`;
    if (verdict) {
      verdict.innerHTML = `<b style="color:var(--phos)">Current best sample:</b> θ = ${best.label}, energy = ${best.energy.toFixed(3)}. ` +
        `This is the core VQE idea: try parameters, estimate energy, keep the lowest one.`;
    }
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const theta = parseFloat(btn.dataset.theta);
      const key = btn.dataset.key || btn.dataset.theta;
      seen.add(key);
      if (!sampled.some(s => s.key === key)) {
        sampled.push({
          key,
          theta,
          label: btn.dataset.label || theta.toFixed(2),
          z: window.t6ExpectZ(theta),
          x: window.t6ExpectX(theta),
          energy: window.t6Energy(theta)
        });
      }
      btn.classList.add('active');
      render();
      if (seen.size >= 3) markDone('t6-2');
    });
  });

  render();
})();

/* ---- T6 Step 3: run a tiny optimizer ---- */
(function initT6Step3() {
  const runBtn = document.getElementById('vqe-opt-run');
  const traceEl = document.getElementById('vqe-opt-trace');
  const verdict = document.getElementById('vqe-opt-verdict');
  const chart = document.getElementById('vqe-opt-chart');
  if (!runBtn || !traceEl || !chart) return;

  function optimize() {
    let theta = 4.8; // intentionally not near the minimum
    let step = 0.9;
    const rows = [];
    for (let i = 0; i < 8; i++) {
      const here = window.t6Energy(theta);
      const left = window.t6Energy(theta - step);
      const right = window.t6Energy(theta + step);
      let move = 'stay';
      if (left < here && left <= right) {
        theta = theta - step;
        move = 'left';
      } else if (right < here) {
        theta = theta + step;
        move = 'right';
      }
      theta = window.t6WrapTheta(theta);
      const energy = window.t6Energy(theta);
      rows.push({ iter: i + 1, theta, step, move, energy });
      step *= 0.65;
    }
    return rows;
  }

  function renderChart(rows) {
    const ns = 'http://www.w3.org/2000/svg';
    chart.innerHTML = '';
    const W = 420, H = 150, padL = 32, padR = 16, padT = 12, padB = 24;
    function mk(tag, attrs, text) {
      const el = document.createElementNS(ns, tag);
      for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
      if (text != null) el.textContent = text;
      return el;
    }
    const minE = Math.min(window.t6GroundEnergy(), ...rows.map(r => r.energy)) - 0.02;
    const maxE = Math.max(...rows.map(r => r.energy)) + 0.02;
    const xScale = i => padL + (i / Math.max(1, rows.length - 1)) * (W - padL - padR);
    const yScale = e => H - padB - ((e - minE) / (maxE - minE)) * (H - padT - padB);

    chart.appendChild(mk('line', { x1: padL, y1: padT, x2: padL, y2: H - padB, stroke: 'var(--line-bright)', 'stroke-width': 1 }));
    chart.appendChild(mk('line', { x1: padL, y1: H - padB, x2: W - padR, y2: H - padB, stroke: 'var(--line-bright)', 'stroke-width': 1 }));
    chart.appendChild(mk('line', {
      x1: padL, y1: yScale(window.t6GroundEnergy()), x2: W - padR, y2: yScale(window.t6GroundEnergy()),
      stroke: 'var(--amber)', 'stroke-width': 1, 'stroke-dasharray': '4 4'
    }));

    let d = '';
    rows.forEach((r, i) => {
      const x = xScale(i), y = yScale(r.energy);
      d += (i === 0 ? 'M ' : ' L ') + x + ' ' + y;
    });
    chart.appendChild(mk('path', { d, fill: 'none', stroke: 'var(--phos)', 'stroke-width': 2 }));

    rows.forEach((r, i) => {
      const x = xScale(i), y = yScale(r.energy);
      chart.appendChild(mk('circle', { cx: x, cy: y, r: 4, fill: 'var(--cyan)' }));
      chart.appendChild(mk('text', {
        x, y: H - 8, 'font-family': 'var(--mono)', 'font-size': 8, fill: 'var(--ink-faint)', 'text-anchor': 'middle'
      }, String(i + 1)));
    });
  }

  runBtn.addEventListener('click', () => {
    const rows = optimize();
    const finalRow = rows[rows.length - 1];
    traceEl.innerHTML = `
      <table class="amp-table">
        <thead><tr><th>iter</th><th class="num">θ</th><th class="num">step</th><th class="num">move</th><th class="num">energy</th></tr></thead>
        <tbody>
          ${rows.map(r => `
            <tr>
              <td class="basis">${r.iter}</td>
              <td class="num">${r.theta.toFixed(3)}</td>
              <td class="num">${r.step.toFixed(3)}</td>
              <td class="num">${r.move}</td>
              <td class="num ${r === finalRow ? 'mag big' : ''}">${r.energy.toFixed(3)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>`;
    renderChart(rows);
    if (verdict) {
      const err = finalRow.energy - window.t6GroundEnergy();
      verdict.innerHTML = `<b style="color:var(--phos)">Optimizer result:</b> θ ≈ ${finalRow.theta.toFixed(3)}, E ≈ ${finalRow.energy.toFixed(3)}. ` +
        `The exact ground energy is ${window.t6GroundEnergy().toFixed(3)}, so the optimizer is off by only ${err.toFixed(3)}.`;
    }
    markDone('t6-3');
  });
})();

/* ---- T6 Step 4: compare ansatz choices ---- */
(function initT6Step4() {
  const buttons = document.querySelectorAll('.vqe-ansatz-btn');
  const out = document.getElementById('vqe-ansatz-results');
  const verdict = document.getElementById('vqe-ansatz-verdict');
  if (!buttons.length || !out) return;

  const seen = new Set();

  function bestForMode(mode) {
    if (mode === 'good') {
      const theta = window.t6GroundTheta();
      return {
        label: 'Flexible R_y(θ)|0⟩ ansatz',
        theta,
        energy: window.t6Energy(theta),
        explain: 'Because the circuit can sweep smoothly through the Bloch sphere, it can actually reach the true ground state for this Hamiltonian.'
      };
    }
    if (mode === 'z-only') {
      const candidates = [0, Math.PI];
      const bestTheta = candidates.reduce((a, b) => window.t6Energy(a) < window.t6Energy(b) ? a : b);
      return {
        label: 'Restricted basis-only ansatz',
        theta: bestTheta,
        energy: window.t6Energy(bestTheta),
        explain: 'This ansatz can only choose between |0⟩ and |1⟩. It cannot represent the tilted superposition that the true ground state needs.'
      };
    }
    const theta = Math.PI / 2;
    return {
      label: 'Overly rigid fixed-angle ansatz',
      theta,
      energy: window.t6Energy(theta),
      explain: 'If your ansatz is too rigid, no optimizer can save you. The search loop can only optimize over states the circuit is capable of preparing.'
    };
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      seen.add(mode);
      document.querySelectorAll('.vqe-ansatz-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const res = bestForMode(mode);
      out.innerHTML = `
        <table class="amp-table">
          <thead><tr><th>Model</th><th class="num">Best θ</th><th class="num">Energy</th></tr></thead>
          <tbody>
            <tr>
              <td class="basis">${res.label}</td>
              <td class="num">${res.theta.toFixed(3)}</td>
              <td class="num mag big">${res.energy.toFixed(3)}</td>
            </tr>
            <tr>
              <td class="basis">Exact ground state</td>
              <td class="num">${window.t6GroundTheta().toFixed(3)}</td>
              <td class="num">${window.t6GroundEnergy().toFixed(3)}</td>
            </tr>
          </tbody>
        </table>`;
      if (verdict) {
        const gap = res.energy - window.t6GroundEnergy();
        verdict.innerHTML = `<b style="color:${gap < 0.02 ? 'var(--phos)' : 'var(--amber)'}">Ansatz lesson:</b> ${res.explain} ` +
          `Energy gap to exact ground state: ${gap.toFixed(3)}.`;
      }
      if (seen.size >= 2) markDone('t6-4');
    });
  });
})();

/* ---- T6 Step 5: shot noise in the cost function ---- */
(function initT6Step5() {
  const slider = document.getElementById('vqe-shots-slider');
  const shotsVal = document.getElementById('vqe-shots-val');
  const runBtn = document.getElementById('vqe-shots-run');
  const exactEl = document.getElementById('vqe-shots-exact');
  const measEl = document.getElementById('vqe-shots-measured');
  const verdict = document.getElementById('vqe-shots-verdict');
  if (!slider || !runBtn) return;

  const seen = new Set();
  const theta = window.t6GroundTheta() + 0.18; // near minimum, to show noisy ambiguity

  function gaussian() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function updateLabel() {
    if (shotsVal) shotsVal.textContent = String(parseInt(slider.value, 10));
  }

  function renderBarList(el, rows) {
    if (!el) return;
    el.innerHTML = '<div class="prob-list">' + rows.map(r => {
      const width = Math.min(100, Math.max(0, ((r.value + 1) / 2) * 100));
      return `<div class="prob-row${Math.abs(r.value) < 0.01 ? ' zero' : ''}">
        <div class="prob-label" style="font-size:11px">${r.label}</div>
        <div class="prob-bar-wrap"><div class="prob-bar" style="width:${width}%"></div></div>
        <div class="prob-val">${r.value.toFixed(3)}</div>
      </div>`;
    }).join('') + '</div>';
  }

  runBtn.addEventListener('click', () => {
    const shots = parseInt(slider.value, 10);
    seen.add(shots);
    const exactZ = window.t6ExpectZ(theta);
    const exactX = window.t6ExpectX(theta);
    const exactE = window.t6Energy(theta);

    const sigma = 0.9 / Math.sqrt(shots);
    const measZ = Math.max(-1, Math.min(1, exactZ + gaussian() * sigma));
    const measX = Math.max(-1, Math.min(1, exactX + gaussian() * sigma));
    const measE = -0.7 * measZ - 0.4 * measX;

    renderBarList(exactEl, [
      { label: 'exact ⟨Z⟩', value: exactZ },
      { label: 'exact ⟨X⟩', value: exactX },
      { label: 'exact E', value: exactE }
    ]);
    renderBarList(measEl, [
      { label: 'measured ⟨Z⟩', value: measZ },
      { label: 'measured ⟨X⟩', value: measX },
      { label: 'estimated E', value: measE }
    ]);

    if (verdict) {
      const err = Math.abs(measE - exactE);
      if (shots >= 512) {
        verdict.innerHTML = `<b style="color:var(--phos)">High-shot estimate:</b> the measured energy is very stable (error ${err.toFixed(3)}). The optimizer sees a smooth cost landscape.`;
      } else if (shots >= 128) {
        verdict.innerHTML = `<b style="color:var(--amber)">Moderate-shot estimate:</b> the optimizer can still work, but the landscape is visibly noisy (error ${err.toFixed(3)}).`;
      } else {
        verdict.innerHTML = `<b style="color:var(--red)">Low-shot estimate:</b> measurement noise can blur which parameter setting is actually better (error ${err.toFixed(3)}).`;
      }
    }

    if (seen.size >= 3) markDone('t6-5');
  });

  slider.addEventListener('input', updateLabel);
  updateLabel();
})();

/* ---- T6 Step 6: auto-done on unlock ---- */
(function initT6Step6() {
  const card = document.querySelector('[data-step="t6-6"]');
  if (card) {
    const obs = new MutationObserver(() => {
      if (!card.classList.contains('locked')) {
        markDone('t6-6');
        obs.disconnect();
      }
    });
    obs.observe(card, { attributes: true, attributeFilter: ['class'] });
  }
})();