/* =========================================================================
   TUTORIAL 7: GROVER SEARCH
   ========================================================================= */

/* ---- shared helpers ---- */
(function initT7Helpers() {
  if (window.__t7HelpersLoaded) return;
  window.__t7HelpersLoaded = true;

  window.t7GroverData = {
    N: 4,
    labels: ['|00⟩', '|01⟩', '|10⟩', '|11⟩'],
    targetIndex: 2,
  };

  window.t7Clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  window.t7RenderProbList = function renderProbList(id, probs, highlightIndex = null) {
    const el = document.getElementById(id);
    if (!el) return;
    const labels = window.t7GroverData.labels;
    el.innerHTML =
      '<div class="prob-list">' +
      labels
        .map((label, i) => {
          const p = probs[i] || 0;
          const pct = (p * 100).toFixed(0);
          const isHi = i === highlightIndex;
          return `
            <div class="prob-row${p < 0.01 ? ' zero' : ''}">
              <div class="prob-label" style="font-size:11px; ${isHi ? 'color:var(--phos);' : ''}">${label}</div>
              <div class="prob-bar-wrap">
                <div class="prob-bar" style="width:${p * 100}%; ${isHi ? 'background: linear-gradient(90deg, var(--phos), var(--magenta));' : ''}"></div>
              </div>
              <div class="prob-val">${pct}%</div>
            </div>
          `;
        })
        .join('') +
      '</div>';
  };

  window.t7GroverProbs = function groverProbs(iterations, N, targetIndex) {
    const theta = Math.asin(1 / Math.sqrt(N));
    const pTarget = Math.pow(Math.sin((2 * iterations + 1) * theta), 2);
    const pOther = (1 - pTarget) / (N - 1);
    const probs = new Array(N).fill(pOther);
    probs[targetIndex] = pTarget;
    return probs;
  };

  window.t7BestIteration = function bestIteration(N) {
    return Math.max(0, Math.round((Math.PI / 4) * Math.sqrt(N) - 0.5));
  };
})();

/* ---- T7 Step 1: classical vs quantum scaling ---- */
(function initT7Step1() {
  const slider = document.getElementById('grover-n-slider');
  const valEl = document.getElementById('grover-n-val');
  const chart = document.getElementById('grover-scaling-chart');
  const cmpEl = document.getElementById('grover-query-compare');
  const bestEl = document.getElementById('grover-best-iter');

  function drawChart(n) {
    if (!chart) return;
    const ns = 'http://www.w3.org/2000/svg';
    chart.innerHTML = '';

    const W = 420, H = 140, pad = 42;
    const N = Math.pow(2, n);
    const classical = Math.ceil(N / 2);
    const quantum = Math.max(1, Math.round(Math.sqrt(N)));
    const maxV = classical;

    function mkEl(tag, attrs, text) {
      const e = document.createElementNS(ns, tag);
      for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
      if (text) e.textContent = text;
      return e;
    }

    chart.appendChild(mkEl('line', { x1: pad, y1: 10, x2: pad, y2: H - 28, stroke: 'var(--line-bright)', 'stroke-width': 1 }));
    chart.appendChild(mkEl('line', { x1: pad, y1: H - 28, x2: W - 10, y2: H - 28, stroke: 'var(--line-bright)', 'stroke-width': 1 }));

    const bars = [
      { label: 'Classical', value: classical, color: 'var(--amber)' },
      { label: 'Grover', value: quantum, color: 'var(--phos)' },
    ];

    const bw = 90;
    const gap = 55;
    bars.forEach((b, i) => {
      const bh = Math.max(5, (b.value / maxV) * (H - 50));
      const x = pad + 32 + i * (bw + gap);
      const y = H - 28 - bh;

      chart.appendChild(mkEl('rect', {
        x, y, width: bw, height: bh, rx: 4,
        fill: b.color, opacity: 0.9
      }));
      chart.appendChild(mkEl('text', {
        x: x + bw / 2, y: y - 6,
        'font-family': 'var(--mono)', 'font-size': 10,
        fill: b.color, 'text-anchor': 'middle'
      }, String(b.value)));
      chart.appendChild(mkEl('text', {
        x: x + bw / 2, y: H - 10,
        'font-family': 'var(--mono)', 'font-size': 10,
        fill: 'var(--ink-faint)', 'text-anchor': 'middle'
      }, b.label));
    });

    chart.appendChild(mkEl('text', {
      x: W - 12, y: H - 35, 'font-family': 'var(--mono)',
      'font-size': 9, fill: 'var(--ink-faint)', 'text-anchor': 'end'
    }, `Search space: ${N} items`));
  }

  function update() {
    if (!slider) return;
    const n = parseInt(slider.value);
    const N = Math.pow(2, n);
    const classical = Math.ceil(N / 2);
    const grover = Math.max(1, Math.round(Math.sqrt(N)));
    const best = Math.max(1, Math.round((Math.PI / 4) * Math.sqrt(N)));

    if (valEl) valEl.textContent = n;
    if (cmpEl) {
      cmpEl.innerHTML =
        `<span style="color:var(--amber)">Classical average: ~${classical} checks</span> · ` +
        `<span style="color:var(--phos)">Grover: ~${grover} oracle calls</span> · ` +
        `Advantage grows like <b>√N</b>`;
    }
    if (bestEl) {
      bestEl.innerHTML = `For a search over <b>${N}</b> states, the sweet spot is about <b>${best}</b> Grover iteration${best === 1 ? '' : 's'}.`;
    }
    drawChart(n);
    markDone('t7-1');
  }

  if (slider) slider.addEventListener('input', update);
  update();
})();

/* ---- T7 Step 2: amplitude rotation visualizer ---- */
(function initT7Step2() {
  const stepBtns = document.querySelectorAll('.grover-rot-step-btn');
  const descEl = document.getElementById('grover-rot-desc');
  const svg = document.getElementById('grover-rotation-diagram');

  const steps = [
    {
      title: 'Uniform superposition',
      desc: 'After Hadamards, every basis state has equal amplitude. In the reduced 2D picture, the state starts close to the unmarked direction |r⟩ and only slightly toward the marked state |w⟩.'
    },
    {
      title: 'Oracle phase flip',
      desc: 'The oracle flips the sign of the marked amplitude. This is not yet a measurement advantage — it sets up interference for the next step.'
    },
    {
      title: 'Diffusion step',
      desc: 'The diffusion operator reflects all amplitudes about their average. Together with the oracle reflection, this rotates the state toward |w⟩.'
    },
    {
      title: 'After one Grover iteration',
      desc: 'Now the marked state has much larger probability. Repeating the pair of reflections rotates even closer to |w⟩ — but too many iterations overshoot.'
    }
  ];

  function draw(step) {
    if (!svg) return;
    const ns = 'http://www.w3.org/2000/svg';
    svg.innerHTML = '';

    const W = 420, H = 280, cx = 210, cy = 200, R = 110;

    function mkEl(tag, attrs, text) {
      const e = document.createElementNS(ns, tag);
      for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
      if (text) e.textContent = text;
      return e;
    }

    function pol(r, a) {
      return { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) };
    }

    const theta = Math.asin(1 / Math.sqrt(4)); // N = 4 tutorial picture
    const angles = [
      theta,
      -theta,
      3 * theta,
      3 * theta
    ];

    const a = angles[step];

    // axes
    svg.appendChild(mkEl('line', { x1: cx - 130, y1: cy, x2: cx + 130, y2: cy, stroke: 'var(--line-bright)', 'stroke-width': 1 }));
    svg.appendChild(mkEl('line', { x1: cx, y1: cy + 30, x2: cx, y2: cy - 130, stroke: 'var(--line-bright)', 'stroke-width': 1 }));

    // labels
    svg.appendChild(mkEl('text', {
      x: cx + 122, y: cy + 16, 'font-family': 'var(--serif)',
      'font-size': 15, fill: 'var(--ink-faint)', 'text-anchor': 'end'
    }, '|r⟩ (unmarked subspace)'));

    svg.appendChild(mkEl('text', {
      x: cx + 8, y: cy - 118, 'font-family': 'var(--serif)',
      'font-size': 15, fill: 'var(--phos)'
    }, '|w⟩'));

    // guide arc
    svg.appendChild(mkEl('circle', {
      cx, cy, r: R, fill: 'none',
      stroke: 'var(--line-bright)', 'stroke-width': 1,
      opacity: 0.25
    }));

    // reflection / rotation decorations
    if (step >= 1) {
      svg.appendChild(mkEl('line', {
        x1: cx + 10, y1: cy - 112, x2: cx + 115, y2: cy + 5,
        stroke: 'var(--magenta)', 'stroke-width': 1.5, 'stroke-dasharray': '4 4', opacity: 0.8
      }));
      svg.appendChild(mkEl('text', {
        x: cx + 88, y: cy - 54, 'font-family': 'var(--mono)',
        'font-size': 10, fill: 'var(--magenta)'
      }, 'oracle reflection'));
    }

    if (step >= 2) {
      svg.appendChild(mkEl('line', {
        x1: cx - 115, y1: cy + 35, x2: cx + 115, y2: cy - 35,
        stroke: 'var(--amber)', 'stroke-width': 1.5, 'stroke-dasharray': '4 4', opacity: 0.75
      }));
      svg.appendChild(mkEl('text', {
        x: cx - 105, y: cy - 48, 'font-family': 'var(--mono)',
        'font-size': 10, fill: 'var(--amber)'
      }, 'diffusion reflection'));
    }

    // state vector
    const p = pol(R, a);
    svg.appendChild(mkEl('line', {
      x1: cx, y1: cy, x2: p.x, y2: p.y,
      stroke: 'var(--phos)', 'stroke-width': 4, 'stroke-linecap': 'round'
    }));
    svg.appendChild(mkEl('circle', {
      cx: p.x, cy: p.y, r: 6, fill: 'var(--phos)'
    }));

    // angle marker
    const arcR = 36;
    const startAng = 0;
    const endAng = a;
    const p1 = pol(arcR, startAng);
    const p2 = pol(arcR, endAng);
    const largeArc = Math.abs(endAng - startAng) > Math.PI ? 1 : 0;
    const sweep = endAng >= startAng ? 0 : 1;
    svg.appendChild(mkEl('path', {
      d: `M ${p1.x} ${p1.y} A ${arcR} ${arcR} 0 ${largeArc} ${sweep} ${p2.x} ${p2.y}`,
      fill: 'none', stroke: 'var(--cyan)', 'stroke-width': 2
    }));

    svg.appendChild(mkEl('text', {
      x: 20, y: 28, 'font-family': 'var(--serif)',
      'font-size': 17, fill: 'var(--ink)'
    }, steps[step].title));
  }

  stepBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      stepBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const i = parseInt(btn.dataset.groverstep);
      draw(i);
      if (descEl) descEl.textContent = steps[i].desc;
      if (i >= 3) markDone('t7-2');
    });
  });

  draw(0);
  if (descEl) descEl.textContent = steps[0].desc;
  const initBtn = document.querySelector('.grover-rot-step-btn[data-groverstep="0"]');
  if (initBtn) initBtn.classList.add('active');
})();

/* ---- T7 Step 3: clickable oracle / marked item selector ---- */
(function initT7Step3() {
  const grid = document.getElementById('grover-oracle-grid');
  const runBtn = document.getElementById('grover-oracle-run');
  const explainEl = document.getElementById('grover-oracle-explain');
  const probsEl = 'grover-oracle-probs';
  const verdictEl = document.getElementById('grover-oracle-verdict');
  let selected = window.t7GroverData.targetIndex;

  function renderGrid(flash = false) {
    if (!grid) return;
    const labels = window.t7GroverData.labels;
    grid.innerHTML = labels.map((label, i) => {
      const active = i === selected;
      return `
        <button class="grover-grid-cell ${active ? 'active' : ''}" data-gidx="${i}"
          style="
            min-width:72px; min-height:62px; margin:6px; border-radius:10px;
            border:1px solid var(--line-bright);
            background:${active ? (flash ? 'rgba(66, 245, 194, 0.18)' : 'rgba(66,245,194,0.10)') : 'var(--bg-2)'};
            color:${active ? 'var(--phos)' : 'var(--ink)'};
            box-shadow:none;
            font-family:var(--mono);
            cursor:pointer;
          ">
          <div style="font-size:12px; opacity:.8;">database item</div>
          <div style="font-size:18px; margin-top:4px;">${label}</div>
        </button>
      `;
    }).join('');

    grid.querySelectorAll('.grover-grid-cell').forEach(btn => {
      btn.addEventListener('click', () => {
        selected = parseInt(btn.dataset.gidx);
        window.t7GroverData.targetIndex = selected;
        renderGrid(false);
        if (explainEl) {
          explainEl.innerHTML = `Marked item set to <b style="color:var(--phos)">${window.t7GroverData.labels[selected]}</b>. The oracle will flip the phase of this state only.`;
        }
      });
    });
  }

  function runOracleDemo() {
    renderGrid(true);
    const probsBefore = [0.25, 0.25, 0.25, 0.25];
    const probsAfter = [0.25, 0.25, 0.25, 0.25]; // probabilities same right after phase flip
    window.t7RenderProbList(probsEl, probsAfter, selected);

    if (verdictEl) {
      verdictEl.innerHTML =
        `<b style="color:var(--magenta)">Oracle applied:</b> the marked state's <i>phase</i> flipped, ` +
        `but its probability did <b>not</b> change yet. Grover's power comes from what the ` +
        `diffusion step does with that phase information.`;
    }

    if (explainEl) {
      explainEl.innerHTML =
        `This is the subtle part of Grover: right after the oracle, the bars still look flat. ` +
        `The state <b style="color:var(--phos)">${window.t7GroverData.labels[selected]}</b> is "special" in phase, not yet in probability.`;
    }

    markDone('t7-3');
  }

  renderGrid(false);
  if (runBtn) runBtn.addEventListener('click', runOracleDemo);
})();

/* ---- T7 Step 4: iteration slider + amplification ---- */
(function initT7Step4() {
  const slider = document.getElementById('grover-iter-slider');
  const valEl = document.getElementById('grover-iter-val');
  const explainEl = document.getElementById('grover-iter-explain');
  const targetBadge = document.getElementById('grover-iter-target');
  const viz = document.getElementById('grover-iter-viz');

  function renderIterationViz(iterations, targetIndex) {
    if (!viz) return;
    const labels = window.t7GroverData.labels;
    const probs = window.t7GroverProbs(iterations, 4, targetIndex);

    viz.innerHTML = `
      <div style="display:grid; grid-template-columns:repeat(4, minmax(60px,1fr)); gap:10px; margin-top:10px;">
        ${labels.map((label, i) => {
          const p = probs[i];
          const h = 30 + p * 120;
          const active = i === targetIndex;
          const glow = active ? `box-shadow:0 0 ${10 + 30 * p}px rgba(66,245,194,${0.12 + 0.45 * p});` : '';
          return `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:flex-end;">
              <div style="
                width:52px;
                height:${h}px;
                border-radius:10px 10px 4px 4px;
                background:${active ? 'linear-gradient(180deg, var(--phos), var(--magenta))' : 'linear-gradient(180deg, var(--line-bright), var(--line))'};
                opacity:${active ? 1 : 0.75};
                ${glow}
                transition:all .2s ease;
              "></div>
              <div style="font-family:var(--mono); font-size:12px; margin-top:8px; color:${active ? 'var(--phos)' : 'var(--ink)'}">${label}</div>
              <div style="font-family:var(--mono); font-size:11px; color:var(--ink-faint)">${(p * 100).toFixed(0)}%</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function update() {
    if (!slider) return;
    const k = parseInt(slider.value);
    const targetIndex = window.t7GroverData.targetIndex;
    const probs = window.t7GroverProbs(k, 4, targetIndex);
    const p = probs[targetIndex];

    if (valEl) valEl.textContent = k;
    if (targetBadge) {
      targetBadge.innerHTML = `Marked item: <b style="color:var(--phos)">${window.t7GroverData.labels[targetIndex]}</b>`;
    }

    window.t7RenderProbList('grover-iter-probs', probs, targetIndex);
    renderIterationViz(k, targetIndex);

    if (explainEl) {
      if (k === 0) {
        explainEl.textContent = 'No Grover iterations yet: every state is equally likely.';
      } else if (k === 1) {
        explainEl.textContent = `After 1 iteration, the marked item jumps to ${(p * 100).toFixed(0)}% probability — this is the sweet spot for a 4-item search.`;
      } else {
        explainEl.textContent = `After ${k} iterations, the algorithm begins to overshoot. Grover is a rotation, not a monotonic process.`;
      }
    }

    if (k >= 1) markDone('t7-4');
  }

  if (slider) slider.addEventListener('input', update);
  update();
})();

/* ---- T7 Step 5: overshoot curve ---- */
(function initT7Step5() {
  const svg = document.getElementById('grover-overshoot-curve');
  const markerBtn = document.getElementById('grover-overshoot-next');
  const descEl = document.getElementById('grover-overshoot-desc');
  let currentK = 0;

  function drawCurve(k) {
    if (!svg) return;
    const ns = 'http://www.w3.org/2000/svg';
    svg.innerHTML = '';

    const W = 430, H = 240, padL = 44, padB = 34, padT = 18, padR = 18;
    const innerW = W - padL - padR;
    const innerH = H - padT - padB;

    function mkEl(tag, attrs, text) {
      const e = document.createElementNS(ns, tag);
      for (const [kk, vv] of Object.entries(attrs)) e.setAttribute(kk, vv);
      if (text) e.textContent = text;
      return e;
    }

    function xMap(x) { return padL + (x / 6) * innerW; }
    function yMap(y) { return padT + (1 - y) * innerH; }

    svg.appendChild(mkEl('line', { x1: padL, y1: padT, x2: padL, y2: H - padB, stroke: 'var(--line-bright)', 'stroke-width': 1 }));
    svg.appendChild(mkEl('line', { x1: padL, y1: H - padB, x2: W - padR, y2: H - padB, stroke: 'var(--line-bright)', 'stroke-width': 1 }));

    svg.appendChild(mkEl('text', {
      x: 16, y: padT + 8, 'font-family': 'var(--mono)',
      'font-size': 10, fill: 'var(--ink-faint)'
    }, 'P(marked)'));

    svg.appendChild(mkEl('text', {
      x: W - 8, y: H - 10, 'font-family': 'var(--mono)',
      'font-size': 10, fill: 'var(--ink-faint)', 'text-anchor': 'end'
    }, 'iterations'));

    // curve
    let d = '';
    for (let i = 0; i <= 120; i++) {
      const x = (6 * i) / 120;
      const p = Math.pow(Math.sin((2 * x + 1) * Math.asin(1 / 2)), 2); // N=4
      const X = xMap(x);
      const Y = yMap(p);
      d += i === 0 ? `M ${X} ${Y}` : ` L ${X} ${Y}`;
    }

    svg.appendChild(mkEl('path', {
      d,
      fill: 'none',
      stroke: 'var(--phos)',
      'stroke-width': 3,
      'stroke-linecap': 'round'
    }));

    // best iteration line at k=1
    const xBest = xMap(1);
    svg.appendChild(mkEl('line', {
      x1: xBest, y1: padT, x2: xBest, y2: H - padB,
      stroke: 'var(--amber)', 'stroke-width': 1.5, 'stroke-dasharray': '5 5'
    }));
    svg.appendChild(mkEl('text', {
      x: xBest + 6, y: padT + 16, 'font-family': 'var(--mono)',
      'font-size': 10, fill: 'var(--amber)'
    }, 'best for N=4'));

    // marker
    const pK = Math.pow(Math.sin((2 * k + 1) * Math.asin(1 / 2)), 2);
    svg.appendChild(mkEl('circle', {
      cx: xMap(k), cy: yMap(pK), r: 6,
      fill: 'var(--magenta)', stroke: 'var(--bg)', 'stroke-width': 2
    }));

    // x labels
    for (let j = 0; j <= 6; j++) {
      svg.appendChild(mkEl('text', {
        x: xMap(j), y: H - 14, 'font-family': 'var(--mono)',
        'font-size': 10, fill: 'var(--ink-faint)', 'text-anchor': 'middle'
      }, String(j)));
    }

    // y labels
    [0, 0.5, 1].forEach(v => {
      svg.appendChild(mkEl('text', {
        x: 30, y: yMap(v) + 4, 'font-family': 'var(--mono)',
        'font-size': 10, fill: 'var(--ink-faint)', 'text-anchor': 'end'
      }, v.toFixed(v === 0.5 ? 1 : 0)));
    });

    if (descEl) {
      if (k === 0) {
        descEl.textContent = 'At 0 iterations, the marked state is only 25% likely.';
      } else if (k === 1) {
        descEl.textContent = 'At 1 iteration, the marked state reaches 100% probability in the ideal N = 4 case.';
      } else {
        descEl.textContent = `At ${k} iterations, Grover has overshot. The success probability has dropped back to ${(pK * 100).toFixed(0)}%.`;
      }
    }
  }

  if (markerBtn) {
    markerBtn.addEventListener('click', () => {
      currentK = (currentK + 1) % 5;
      drawCurve(currentK);
      if (currentK >= 2) markDone('t7-5');
    });
  }

  drawCurve(0);
})();

/* ---- T7 Step 6: noise and robustness ---- */
(function initT7Step6() {
  const slider = document.getElementById('grover-noise-slider');
  const valEl = document.getElementById('grover-noise-val');
  const runBtn = document.getElementById('grover-noise-run');
  const summaryEl = document.getElementById('grover-noise-summary');
  let seen = new Set();

  function noisyGroverProbs(noisePct, targetIndex) {
    const ideal = window.t7GroverProbs(1, 4, targetIndex); // best case for N=4
    const eps = noisePct / 100;
    const uniform = [0.25, 0.25, 0.25, 0.25];
    return ideal.map((p, i) => (1 - eps) * p + eps * uniform[i]);
  }

  function run() {
    if (!slider) return;
    const noise = parseFloat(slider.value);
    const targetIndex = window.t7GroverData.targetIndex;

    seen.add(Math.round(noise));
    const ideal = window.t7GroverProbs(1, 4, targetIndex);
    const noisy = noisyGroverProbs(noise, targetIndex);

    window.t7RenderProbList('grover-noise-ideal-probs', ideal, targetIndex);
    window.t7RenderProbList('grover-noise-noisy-probs', noisy, targetIndex);

    const success = noisy[targetIndex] * 100;
    if (summaryEl) {
      if (noise < 10) {
        summaryEl.innerHTML = `<b style="color:var(--phos)">Still strong:</b> the marked item remains the dominant outcome at ${success.toFixed(0)}%.`;
      } else if (noise < 35) {
        summaryEl.innerHTML = `<b style="color:var(--amber)">Degrading:</b> Grover still helps, but the amplification is getting washed out by noise. Success is ${success.toFixed(0)}%.`;
      } else {
        summaryEl.innerHTML = `<b style="color:var(--red)">Weak advantage:</b> the output is drifting back toward a nearly uniform distribution. Success is only ${success.toFixed(0)}%.`;
      }
    }

    if (seen.size >= 3) markDone('t7-6');
  }

  if (slider) {
    slider.addEventListener('input', () => {
      if (valEl) valEl.textContent = `${parseFloat(slider.value).toFixed(0)}%`;
    });
  }
  if (runBtn) runBtn.addEventListener('click', run);
  run();
})();

/* ---- auto-done unlock observer (optional final card) ---- */
(function initT7FinalUnlock() {
  const card = document.querySelector('[data-step="t7-7"]');
  if (card) {
    const obs = new MutationObserver(() => {
      if (!card.classList.contains('locked')) {
        markDone('t7-7');
        obs.disconnect();
      }
    });
    obs.observe(card, { attributes: true, attributeFilter: ['class'] });
  }
})();