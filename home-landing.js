/**
 * Home landing tab — immersive interactive edition.
 * Uses the site's own CSS variables and class conventions throughout.
 * New interactive elements get scoped styles via #home-extra-styles.
 */
(function (global) {
  'use strict';

  /* ─── Scoped styles for new interactive elements only ───────────────────── */
  /* All colors reference the site's existing CSS variables. */
  const HOME_EXTRA_CSS = `
  /* ── hero particle canvas ── */
  #home-hero-canvas {
    position: absolute; inset: 0; width: 100%; height: 100%;
    pointer-events: none; opacity: 0.5;
  }

  /* ── hero section ── */
  .home-hero-wrap {
    position: relative; overflow: hidden;
    padding: 5rem 2rem 4rem;
    border-bottom: 1px solid var(--line);
  }
  .home-hero-inner {
    position: relative; z-index: 1;
    max-width: 680px;
  }
  .home-hero-wrap h1 {
    font-family: var(--serif);
    font-weight: 300;
    font-size: clamp(1.95rem, 4.2vw, 3rem);
    line-height: 1.1; margin-bottom: 1rem;
    letter-spacing: -0.02em;
  }
  .home-hero-wrap p {
    font-size: 1.02rem; line-height: 1.75;
    color: var(--ink-dim); margin-bottom: 2rem; max-width: 560px;
  }
  .home-hero-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
  .home-eyebrow {
    font-family: var(--mono); font-size: 10px;
    letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--phos); opacity: 0.7; margin-bottom: 1.25rem;
  }

  /* ── scroll-reveal ── */
  .home-reveal {
    opacity: 0; transform: translateY(22px);
    transition: opacity 0.65s ease, transform 0.65s ease;
  }
  .home-reveal.visible { opacity: 1; transform: none; }

  /* ── two-column chapter layout ── */
  .home-chapter {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 3rem; align-items: center;
    padding: 4rem 2rem;
    max-width: 960px; margin: 0 auto;
    border-bottom: 1px solid var(--line);
  }
  .home-chapter.flip { direction: rtl; }
  .home-chapter.flip > * { direction: ltr; }
  .home-chapter-kicker {
    font-family: var(--mono); font-size: 9px;
    letter-spacing: 0.2em; text-transform: uppercase;
    color: var(--cyan); display: block; margin-bottom: 0.7rem; opacity: 0.8;
  }
  .home-chapter h2 {
    font-family: var(--serif);
    font-style: italic;
    font-weight: 400;
    font-size: clamp(1.35rem, 2.65vw, 1.85rem);
    line-height: 1.2; margin-bottom: 0.9rem;
  }
  .home-chapter p {
    font-size: 0.95rem; line-height: 1.75;
    color: var(--ink-dim); margin-bottom: 0.9rem;
  }
  .home-chapter strong { color: var(--ink); }
  .home-chapter em { color: var(--phos); font-style: italic; }
  .home-chapter-visual {
    display: flex; flex-direction: column;
    align-items: center; gap: 1rem;
  }

  /* ── panel wrapper (shared by all demos) ── */
  .home-panel {
    width: 100%; background: var(--bg-1);
    border: 1px solid var(--line);
    border-radius: 6px; padding: 1.5rem;
    display: flex; flex-direction: column; align-items: center; gap: 1rem;
  }
  .home-panel-label {
    font-family: var(--mono); font-size: 9px;
    letter-spacing: 0.16em; text-transform: uppercase;
    color: var(--ink-faint); align-self: flex-start;
  }

  /* ── Bloch sphere canvas ── */
  #home-bloch-canvas, #home-gate-canvas {
    cursor: grab; display: block; border-radius: 50%;
  }
  #home-bloch-canvas:active, #home-gate-canvas:active { cursor: grabbing; }
  .home-bloch-presets {
    display: flex; flex-wrap: wrap; gap: 0.4rem; justify-content: center;
  }
  .home-preset {
    font-family: var(--mono); font-size: 11px;
    padding: 0.25rem 0.7rem; border-radius: 3px;
    border: 1px solid var(--line-bright);
    background: transparent; color: var(--ink-dim);
    cursor: pointer; transition: background 0.15s, color 0.15s;
  }
  .home-preset:hover, .home-preset.active {
    background: var(--bg-2); color: var(--phos); border-color: var(--phos-dim);
  }
  .home-state-text {
    font-family: var(--mono); font-size: 11px;
    color: var(--cyan); text-align: center; min-height: 1.4em;
  }

  /* ── gate buttons ── */
  .home-gate-btns {
    display: flex; flex-wrap: wrap; gap: 0.4rem; justify-content: center;
  }
  .home-gate-btn {
    font-family: var(--mono); font-size: 12px; font-weight: 500;
    padding: 0.3rem 0.75rem; border-radius: 3px;
    border: 1px solid var(--line-bright);
    background: var(--bg-0); color: var(--ink);
    cursor: pointer; transition: background 0.12s, border-color 0.12s;
  }
  .home-gate-btn:hover { background: var(--bg-2); border-color: var(--cyan); color: var(--cyan); }
  .home-gate-btn.reset { color: var(--ink-dim); border-style: dashed; }
  .home-gate-history {
    font-family: var(--mono); font-size: 10px;
    color: var(--ink-faint); text-align: center; min-height: 1.4em;
  }
  .home-gate-history .gh-gate { color: var(--phos); }

  /* ── spin measurement visual (replaces cat) ── */
  .home-spin-wrap {
    display: flex; flex-direction: column; align-items: center; gap: 1rem;
    padding: 1.75rem; background: var(--bg-1);
    border: 1px solid var(--line); border-radius: 6px;
  }
  #home-spin-canvas { display: block; border: 1px solid var(--line); background: var(--bg-0); }
  .home-spin-state {
    font-family: var(--mono); font-size: 11px;
    color: var(--cyan); text-align: center; min-height: 1.4em;
    transition: color 0.35s;
  }
  .home-spin-state.settled { color: var(--phos); }
  .home-spin-btns { display: flex; gap: 0.75rem; flex-wrap: wrap; justify-content: center; }
  .home-mini-quote {
    max-width: 860px; margin: 0 auto 1.2rem; padding: 0.55rem 1rem 0.75rem;
    font-family: var(--serif); font-style: italic; font-size: 0.95rem;
    color: var(--ink-faint); border-left: 2px solid var(--line-bright);
  }
  .home-mini-quote b { color: var(--ink-dim); font-weight: 400; }

  /* ── coin flip ── */
  .home-coin-section {
    background: var(--bg-1);
    border-left: 2px solid var(--cyan);
    padding: 3.5rem 2rem; border-bottom: 1px solid var(--line);
    max-width: 960px; margin: 0 auto;
  }
  .home-coin-row {
    display: flex; flex-wrap: wrap; gap: 5px;
    min-height: 46px; margin: 1.25rem 0;
  }
  .home-coin {
    width: 38px; height: 38px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-family: var(--mono); font-size: 0.95rem; font-weight: 500;
    border: 1px solid var(--line-bright);
    background: var(--bg-1);
    animation: coinPop 0.18s ease-out;
  }
  .home-coin.one {
    background: rgba(127,255,196,0.08);
    border-color: var(--phos-dim); color: var(--phos);
  }
  .home-coin.zero {
    background: rgba(180,100,255,0.08);
    border-color: var(--magenta); color: var(--magenta);
    opacity: 0.75;
  }
  .home-coin-stats {
    font-family: var(--mono); font-size: 10px; color: var(--ink-faint); margin-top: 0.5rem;
  }
  @keyframes coinPop {
    from { transform: scale(0.4); opacity: 0; }
    to   { transform: scale(1);   opacity: 1; }
  }

  /* ── Bell demo ── */
  .home-bell-qubits {
    display: flex; align-items: center; justify-content: center; gap: 0; margin: 1rem 0;
  }
  .home-bell-orb {
    width: 60px; height: 60px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-family: var(--mono); font-size: 1.05rem;
    border: 1.5px solid var(--line-bright);
    background: var(--bg-0); color: var(--ink-dim);
    transition: all 0.45s;
  }
  .home-bell-orb.result-0 {
    border-color: var(--magenta); color: var(--magenta);
    background: rgba(180,100,255,0.07);
    box-shadow: 0 0 14px rgba(180,100,255,0.12);
  }
  .home-bell-orb.result-1 {
    border-color: var(--phos); color: var(--phos);
    background: rgba(127,255,196,0.07);
    box-shadow: 0 0 14px rgba(127,255,196,0.12);
  }
  .home-bell-wire {
    width: 52px; height: 2px;
    background: linear-gradient(to right, var(--magenta), var(--phos));
    opacity: 0; transition: opacity 0.6s; position: relative; overflow: hidden;
  }
  .home-bell-wire.active { opacity: 0.5; }
  .home-bell-wire::after {
    content: ''; position: absolute;
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--cyan); top: -3px; left: -8px;
    animation: wireTravel 1.5s linear infinite; opacity: 0;
  }
  .home-bell-wire.active::after { opacity: 1; }
  @keyframes wireTravel {
    from { left: -8px; opacity: 0.9; }
    to   { left: 100%; opacity: 0; }
  }
  .home-bell-bars { width: 100%; margin-top: 1rem; }
  .home-bell-row {
    display: flex; align-items: center; gap: 0.6rem; margin-bottom: 6px;
  }
  .home-bell-key {
    font-family: var(--mono); font-size: 10px; color: var(--ink-faint); width: 32px; flex-shrink: 0;
  }
  .home-bell-track {
    flex: 1; height: 16px; background: var(--bg-0);
    border: 1px solid var(--line); border-radius: 2px; overflow: hidden;
  }
  .home-bell-fill {
    height: 100%; width: 0; border-radius: 2px; transition: width 0.55s ease-out;
  }
  .home-bell-fill.corr { background: var(--phos); opacity: 0.65; }
  .home-bell-fill.anti { background: var(--magenta); opacity: 0.4; }
  .home-bell-pct {
    font-family: var(--mono); font-size: 10px; color: var(--ink-faint);
    width: 28px; text-align: right; flex-shrink: 0;
  }
  .home-bell-run-row { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 1rem; }
  .home-bell-note { font-size: 0.84rem; color: var(--ink-dim); line-height: 1.6; margin-top: 0.75rem; }

  /* ── full-width section ── */
  .home-section-full {
    padding: 4rem 2rem; max-width: 960px; margin: 0 auto;
    border-bottom: 1px solid var(--line);
  }
  .home-section-full .analysis-head { margin-bottom: 1.5rem; }

  /* ── pullquote ── */
  .home-pullquote-lg {
    max-width: 700px; margin: 0 auto;
    padding: 3rem 2rem;
    font-size: clamp(1.05rem, 2.4vw, 1.38rem);
    font-style: italic; color: var(--ink-dim);
    line-height: 1.65; text-align: center;
    border-bottom: 1px solid var(--line);
  }
  .home-pullquote-lg em { color: var(--phos); font-style: normal; }

  /* ── responsive ── */
  @media (max-width: 680px) {
    .home-chapter { grid-template-columns: 1fr; padding: 2.5rem 1.25rem; }
    .home-chapter.flip { direction: ltr; }
    .home-hero-wrap { padding: 3rem 1.25rem 2.5rem; }
    .home-coin-section {
    background: var(--bg-1);
    border-left: 2px solid var(--cyan); padding: 2.5rem 1.25rem; }
    .home-section-full { padding: 2.5rem 1.25rem; }
    .home-section-full > div[style*="grid"] { display: block !important; }
    .home-section-full > div[style*="grid"] > * + * { margin-top: 2rem; }
  }
  `;

  /* ─── HTML ──────────────────────────────────────────────────────────────── */
  const HOME_LANDING_HTML = `
  <style id="home-extra-styles">${HOME_EXTRA_CSS}</style>

  <!-- ══ HERO ══════════════════════════════════════════════════════════════ -->
  <section class="home-hero-wrap">
    <canvas id="home-hero-canvas" aria-hidden="true"></canvas>
    <div class="home-hero-inner">
      <div class="home-eyebrow">Quantum &amp; Lab · Interactive introduction</div>
      <h1>The universe computes in ways<br/>that feel <em>impossible.</em></h1>
      <p>Quantum theory can feel counterintuitive at first, but it is one of the most precise frameworks in science. This page is a guided journey — from the ordinary switch in your phone, through superposition and spin measurement, to two particles sharing correlations across distance. Nothing is locked: scroll freely and interact as you go.</p>
      <div class="home-hero-actions">
        <button type="button" class="btn primary" onclick="switchTab('learn');switchSubtab('t1');">Begin Tutorial 1 →</button>
        <button type="button" class="btn" onclick="switchTab('lab')">Open circuit lab</button>
      </div>
    </div>
  </section>

  <!-- ══ 01: CLASSICAL BIT ═════════════════════════════════════════════════ -->
  <div class="home-chapter home-reveal">
    <div class="home-chapter-text">
      <span class="home-chapter-kicker">01 · The ordinary bit</span>
      <h2>Everything digital is a very fast <em>choice.</em></h2>
      <p><a href="#" onclick="switchTab('learn');switchSubtab('t1');return false;" style="font-family:var(--mono);font-size:10px;letter-spacing:0.08em;color:var(--phos-dim);text-decoration:none;">→ Go deeper in Tutorial 1</a></p>
      <p>Your phone, laptop, and modern data centers all store information as long chains of the same elementary decision: <strong>0 or 1</strong>. Off or on — like a switch that has already committed to one side.</p>
      <p>Before you read it, a classical bit is <em>already</em> in a definite state. That reliability powers classical computing — and also marks a boundary that quantum systems can move beyond.</p>
      <div class="rules" style="margin-top:1.25rem">
        <strong>Try it.</strong> Notice how the switch is always definite, even before you look. We are about to shatter that assumption.
      </div>
    </div>
    <div class="home-chapter-visual">
      <div class="home-panel">
        <div class="home-panel-label">One classical bit</div>
        <div class="classical-bit">
          <div class="bit-switch" id="home-bit-switch" role="button" tabindex="0" aria-label="Toggle between 0 and 1">
            <div class="bit-glow"></div>
            <div class="bit-value" id="home-bit-value">0</div>
          </div>
          <div class="bit-hint">Click to flip</div>
        </div>
        <p style="font-size:0.82rem;color:var(--ink-faint);text-align:center;margin:0;line-height:1.55">
          This is the entire vocabulary of classical computing — repeated a billion times a second.
        </p>
      </div>
    </div>
  </div>

  <div class="home-mini-quote home-reveal">"Computation is, in a very real sense, the evolution of physical law." <b>— David Deutsch</b></div>

  <!-- ══ 02: BLOCH SPHERE ══════════════════════════════════════════════════ -->
  <div class="home-chapter flip home-reveal">
    <div class="home-chapter-text">
      <span class="home-chapter-kicker">02 · The quantum bit</span>
      <h2>A qubit lives on the surface of a <em>sphere.</em></h2>
      <p>A qubit — the quantum analogue of a bit — need not commit to one value before measurement. Its pure states map to points on the surface of the <strong>Bloch sphere</strong>: the north pole is \(|0\\rangle\), the south pole is \(|1\\rangle\), and points in between represent coherent superpositions.</p>
      <p>The equator is especially important: these states can all yield 50/50 outcomes in the computational basis, yet they differ by <strong>phase</strong>. That phase is invisible to a single measurement, but it governs interference and algorithmic advantage.</p>
      <div class="rules" style="margin-top:1.25rem">
        Drag the sphere to rotate your view, or click a preset. Notice that |+⟩ and |−⟩ look equally mixed but are fundamentally different states.
      </div>
    </div>
    <div class="home-chapter-visual">
      <div class="home-panel">
        <div class="home-panel-label">Bloch sphere — drag to rotate view</div>
        <canvas id="home-bloch-canvas" width="260" height="260" aria-label="Interactive Bloch sphere showing qubit state"></canvas>
        <div class="home-bloch-presets">
          <button class="home-preset active" data-theta="0" data-phi="0">|0⟩</button>
          <button class="home-preset" data-theta="3.14159" data-phi="0">|1⟩</button>
          <button class="home-preset" data-theta="1.5708" data-phi="0">|+⟩</button>
          <button class="home-preset" data-theta="1.5708" data-phi="3.14159">|−⟩</button>
          <button class="home-preset" data-theta="1.5708" data-phi="1.5708">|+i⟩</button>
          <button class="home-preset" data-theta="1.5708" data-phi="-1.5708">|−i⟩</button>
        </div>
        <div class="home-state-text" id="home-bloch-state">\(|\psi\\rangle = |0\\rangle\)</div>
      </div>
    </div>
  </div>

  <div class="home-mini-quote home-reveal">"If quantum mechanics hasn't profoundly shocked you, you haven't understood it yet." <b>— Niels Bohr</b></div>

  <!-- ══ 03: SPIN MEASUREMENT ═══════════════════════════════════════════════ -->
  <div class="home-section-full home-reveal">
    <div class="analysis-head">
      <h3>Measurement turns spin superposition into a definite result.</h3>
      <div class="num">03 · Superposition</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:2.5rem;align-items:center">
      <div>
        <p style="font-size:0.95rem;color:var(--ink-dim);line-height:1.75;margin-bottom:0.9rem">
          Electron spin gives a concrete physical model for qubits. In many platforms, \(|0\\rangle\) and \(|1\\rangle\) correspond to two measurable spin orientations. If the spin is prepared in \(|+\\rangle = (|0\\rangle + |1\\rangle)/\sqrt{2}\) and measured along the z-axis, outcomes are 50/50: \(|0\\rangle\) (up) or \(|1\\rangle\) (down).
        </p>
        <p style="font-size:0.95rem;color:var(--ink-dim);line-height:1.75;margin-bottom:0.9rem">
          There is <strong>no hidden pre-written answer</strong>. Measurement projects \(|\psi\\rangle\) onto an eigenstate of the chosen observable. That postulate is central to every protocol in the rest of this lab.
        </p>
        <p style="font-size:0.95rem;color:var(--ink-dim);line-height:1.75">
          Use the panel to prepare \(|+\\rangle\), measure repeatedly, and watch individual outcomes collapse while ensemble statistics converge.
        </p>
        <p><a href="#" onclick="switchTab('learn');switchSubtab('t2');return false;" style="font-family:var(--mono);font-size:10px;letter-spacing:0.08em;color:var(--phos-dim);text-decoration:none;">→ Entanglement and measurement in Tutorial 2</a></p>
      </div>
      <div class="home-spin-wrap">
        <canvas id="home-spin-canvas" width="360" height="185" aria-label="Electron spin superposition and measurement"></canvas>
        <div class="home-spin-state" id="home-spin-state">\(|\psi\\rangle = |+\\rangle = (|0\\rangle + |1\\rangle)/\sqrt{2}\)</div>
        <div class="home-spin-btns">
          <button class="btn" id="home-spin-super-btn">Prepare \(|+\\rangle\)</button>
          <button class="btn primary" id="home-spin-measure-btn">Measure along z</button>
        </div>
      </div>
    </div>
  </div>

  <div class="home-mini-quote home-reveal">"Nature isn't classical... and if you want to make a simulation of nature, you'd better make it quantum mechanical." <b>— Richard Feynman</b></div>

  <!-- ══ 04: GATES ARE ROTATIONS ═══════════════════════════════════════════ -->
  <div class="home-chapter home-reveal">
    <div class="home-chapter-text">
      <span class="home-chapter-kicker">04 · Quantum gates</span>
      <h2>Gates are <em>rotations</em> of the sphere.</h2>
      <p><a href="#" onclick="switchTab('learn');switchSubtab('t1');return false;" style="font-family:var(--mono);font-size:10px;letter-spacing:0.08em;color:var(--phos-dim);text-decoration:none;">→ Gate intuition in Tutorial 1</a></p>
      <p>In classical computing, a NOT gate flips 0 to 1. In quantum computing, single-qubit gates act as <strong>rotations</strong> on the Bloch sphere, moving the state vector continuously through Hilbert space.</p>
      <p>The <strong>H gate</strong> (Hadamard) is foundational: it maps \(|0\\rangle\) from the pole to equatorial superposition, preparing states used across algorithms, metrology, and communication protocols.</p>
      <p>Apply gates in sequence below. Order matters: H then X is not the same transformation as X then H. This non-commutativity is one of the defining structural differences from classical logic.</p>
    </div>
    <div class="home-chapter-visual">
      <div class="home-panel">
        <div class="home-panel-label">Apply gates · start at |0⟩</div>
        <canvas id="home-gate-canvas" width="240" height="240" aria-label="Bloch sphere showing gate operations"></canvas>
        <div class="home-gate-btns">
          <button class="home-gate-btn" data-gate="H">H</button>
          <button class="home-gate-btn" data-gate="X">X</button>
          <button class="home-gate-btn" data-gate="Y">Y</button>
          <button class="home-gate-btn" data-gate="Z">Z</button>
          <button class="home-gate-btn" data-gate="S">S</button>
          <button class="home-gate-btn" data-gate="T">T</button>
          <button class="home-gate-btn reset" data-gate="RESET">↻ Reset</button>
        </div>
        <div class="home-gate-history" id="home-gate-history">No gates applied yet</div>
        <div class="home-state-text" id="home-gate-state">State: |0⟩</div>
      </div>
    </div>
  </div>

  <!-- ══ 05: MEASUREMENT COIN FLIP ═════════════════════════════════════════ -->
  <div class="home-coin-section home-reveal">
    <div class="analysis-head">
      <h3>Measurement projects \(|+\\rangle\) to \(|0\\rangle\) or \(|1\\rangle\).</h3>
      <div class="num">05 · Measurement</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:2.5rem;align-items:start">
      <div>
        <p style="font-size:0.95rem;color:var(--ink-dim);line-height:1.75;margin-bottom:0.9rem">
          When you measure a qubit in \(|+\\rangle\) — the state H prepares from \(|0\\rangle\) — each shot yields either \(0\) or \(1\). Individual outcomes are intrinsically random, while long-run frequencies obey exact quantum probabilities: \(P(0)=P(1)=1/2\).
        </p>
        <p style="font-size:0.95rem;color:var(--ink-dim);line-height:1.75;margin-bottom:0.9rem">
          Click to measure a fresh \(|+\\rangle\) state each time. The circles track shot-by-shot outcomes, while the Bloch panel shows post-measurement projection.
        </p>
        <p><a href="#" onclick="switchTab('learn');switchSubtab('t1');return false;" style="font-family:var(--mono);font-size:10px;letter-spacing:0.08em;color:var(--phos-dim);text-decoration:none;">→ Measurement foundations in Tutorial 1</a></p>
        <div style="margin-top:1.15rem;display:flex;gap:0.6rem;flex-wrap:wrap">
          <button class="btn primary" id="home-flip-btn">Measure one qubit</button>
          <button class="btn" id="home-flip-10-btn">Measure × 10</button>
          <button class="btn" id="home-flip-reset-btn">Clear</button>
        </div>
        <div class="home-coin-stats" id="home-coin-stats"></div>
      </div>
      <div>
        <div class="home-panel" style="margin-bottom:1rem">
          <div class="home-panel-label">Bloch sphere view (starts at \(|+\\rangle\))</div>
          <canvas id="home-measure-bloch-canvas" width="200" height="200" aria-label="Bloch sphere showing plus state and collapsed measurement state"></canvas>
          <div class="home-state-text" id="home-measure-bloch-state">\(|\psi\\rangle = |+\\rangle\)</div>
        </div>
        <div class="home-panel-label" style="margin-bottom:0.5rem">Results — each circle is one shot</div>
        <div class="home-coin-row" id="home-coin-row"></div>
        <div style="display:flex;gap:1rem;margin-top:0.5rem">
          <span style="font-family:var(--mono);font-size:10px;color:var(--phos)">■ \(|1\\rangle\)</span>
          <span style="font-family:var(--mono);font-size:10px;color:var(--magenta)">■ \(|0\\rangle\)</span>
        </div>
      </div>
    </div>
  </div>

  <div class="home-mini-quote home-reveal">"I think I can safely say that nobody understands quantum mechanics." <b>— Richard Feynman</b></div>

  <!-- ══ PULLQUOTE ══════════════════════════════════════════════════════════ -->
  <div class="home-pullquote-lg home-reveal">
    Einstein called entanglement <em>"spooky action at a distance"</em> and spent years trying to prove it was wrong. Experiments confirmed in 2022 that it's real — and it's the engine behind quantum cryptography and the power of quantum computing.
  </div>

  <!-- ══ 06: ENTANGLEMENT / BELL STATES ════════════════════════════════════ -->
  <div class="home-section-full home-reveal">
    <div class="analysis-head">
      <h3>Two qubits, one shared fate.</h3>
      <div class="num">06 · Entanglement</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:2.5rem;align-items:start">
      <div>
        <p style="font-size:0.95rem;color:var(--ink-dim);line-height:1.75;margin-bottom:0.9rem">
          Entanglement is a uniquely quantum correlation structure. Two qubits can be prepared in a joint state where measuring one constrains the other, even when the systems are widely separated.
        </p>
        <p style="font-size:0.95rem;color:var(--ink-dim);line-height:1.75;margin-bottom:0.9rem">
          A canonical example is the <strong>Bell state</strong> \(|\Phi^+\\rangle = (|00\\rangle + |11\\rangle)/\sqrt{2}\). Measurements yield correlated pairs (both 0 or both 1), while neither subsystem carries an independent pre-assigned classical bit.
        </p>
        <p style="font-size:0.95rem;color:var(--ink-dim);line-height:1.75">
          Run the experiment. The \(|01\\rangle\) and \(|10\\rangle\) bars stay near zero, while \(|00\\rangle\) and \(|11\\rangle\) dominate — a direct signature of Bell-pair correlations.
        </p>
      </div>
      <div class="home-panel">
        <div class="home-panel-label">Bell state experiment · |Φ+⟩</div>
        <div class="home-bell-qubits">
          <div style="display:flex;flex-direction:column;align-items:center;gap:0.5rem">
            <div class="home-bell-orb" id="home-orb-a">?</div>
            <span style="font-family:var(--mono);font-size:9px;color:var(--ink-faint)">Qubit A</span>
          </div>
          <div class="home-bell-wire" id="home-bell-wire"></div>
          <div style="display:flex;flex-direction:column;align-items:center;gap:0.5rem">
            <div class="home-bell-orb" id="home-orb-b">?</div>
            <span style="font-family:var(--mono);font-size:9px;color:var(--ink-faint)">Qubit B</span>
          </div>
        </div>
        <div class="home-bell-bars">
          <div class="home-bell-row">
            <span class="home-bell-key">|00⟩</span>
            <div class="home-bell-track"><div class="home-bell-fill corr" id="home-bar-00"></div></div>
            <span class="home-bell-pct" id="home-pct-00">—</span>
          </div>
          <div class="home-bell-row">
            <span class="home-bell-key">|01⟩</span>
            <div class="home-bell-track"><div class="home-bell-fill anti" id="home-bar-01"></div></div>
            <span class="home-bell-pct" id="home-pct-01">—</span>
          </div>
          <div class="home-bell-row">
            <span class="home-bell-key">|10⟩</span>
            <div class="home-bell-track"><div class="home-bell-fill anti" id="home-bar-10"></div></div>
            <span class="home-bell-pct" id="home-pct-10">—</span>
          </div>
          <div class="home-bell-row">
            <span class="home-bell-key">|11⟩</span>
            <div class="home-bell-track"><div class="home-bell-fill corr" id="home-bar-11"></div></div>
            <span class="home-bell-pct" id="home-pct-11">—</span>
          </div>
        </div>
        <div class="home-bell-run-row">
          <button class="btn" id="home-bell-1-btn">Run 1 shot</button>
          <button class="btn primary" id="home-bell-100-btn">Run 100 shots</button>
          <button class="btn" id="home-bell-reset-btn">Reset</button>
        </div>
        <p class="home-bell-note" id="home-bell-note">Run the experiment. Watch which outcomes appear.</p>
      </div>
    </div>
  </div>

  <div class="home-mini-quote home-reveal">"Those who are not shocked when they first come across quantum theory cannot possibly have understood it." <b>— Niels Bohr</b></div>

  <!-- ══ WHAT'S NEXT ════════════════════════════════════════════════════════ -->
  <div class="home-pullquote home-reveal" style="margin-top:0">
    You have now seen the core ingredients: bits vs qubits, superposition, measurement, gate dynamics, and entanglement. The sections below extend each thread into deeper, fully interactive study.
  </div>

  <div class="wrap-up home-reveal">
    <button type="button" class="wrap-card" onclick="switchTab('learn');switchSubtab('t1');">
      <div class="wrap-tag">03 · Tutorials</div>
      <div class="wrap-title">Step-by-step interactives</div>
      <div class="wrap-desc">Nine modules from single-qubit intuition through algorithms, noise channels, and hardware timescales — with checkpoints that unlock the next step.</div>
      <div class="wrap-cta">Open Tutorial 1 →</div>
    </button>
    <button type="button" class="wrap-card alt" onclick="switchTab('lab')">
      <div class="wrap-tag">02 · Explore</div>
      <div class="wrap-title">Build your own circuits</div>
      <div class="wrap-desc">Drag gates, run the simulator, add noise, and read the plain-English trace — the main laboratory bench.</div>
      <div class="wrap-cta">Open Explore →</div>
    </button>
  </div>

  <section class="analysis-section home-learn-wrap home-reveal" id="what-you-learn">
    <div class="analysis-head">
      <h3>What you'll learn here</h3>
      <div class="num">05 + refs</div>
    </div>
    <p class="home-learn-sub">Each card matches a tab along the top of the app.</p>
    <div class="home-learn-grid">
      <button type="button" class="home-learn-card" onclick="switchTab('lab')">
        <div class="tag">02 · Explore</div>
        <h3>Build and run circuits</h3>
        <p>Drag operations onto wires, adjust qubit count, add noise, and compare probability, amplitude, and density views with a short narrative.</p>
        <div class="go">Go to Explore →</div>
      </button>
      <button type="button" class="home-learn-card" onclick="switchTab('learn');switchSubtab('t1');">
        <div class="tag">03 · Tutorials</div>
        <h3>Step-by-step interactives</h3>
        <p>Nine modules from single-qubit intuition through algorithms, noise channels, and hardware timescales, each with checks that unlock the next step.</p>
        <div class="go">Go to Tutorials →</div>
      </button>
      <button type="button" class="home-learn-card" onclick="switchTab('templates')">
        <div class="tag">04 · Template library</div>
        <h3>Ready-made circuits</h3>
        <p>Load Bell states, algorithms, and diagnostics into the playground instantly, then tweak them.</p>
        <div class="go">Open templates →</div>
      </button>
      <button type="button" class="home-learn-card" onclick="switchTab('labs')">
        <div class="tag">05 · Labs</div>
        <h3>Open-ended investigations</h3>
        <p>Longer question-driven pages — Bell tests, BB84, surface-code decoding games, and teleportation scenarios.</p>
        <div class="go">Browse labs →</div>
      </button>
      <button type="button" class="home-learn-card" onclick="switchTab('docs')">
        <div class="tag">06 · References</div>
        <h3>Papers and notes</h3>
        <p>Curated citations and short context for where the on-screen claims come from.</p>
        <div class="go">Open references →</div>
      </button>
    </div>
  </section>
  `;

  /* ─── Particle starfield on hero canvas ─────────────────────────────────── */
  function initHeroCanvas() {
    const canvas = document.getElementById('home-hero-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, particles;

    function resize() {
      const wrap = canvas.parentElement;
      W = canvas.width  = wrap ? wrap.offsetWidth  : window.innerWidth;
      H = canvas.height = wrap ? wrap.offsetHeight : 340;
      particles = Array.from({ length: 110 }, function () {
        return {
          x: Math.random() * W,
          y: Math.random() * H,
          r: Math.random() * 1.1 + 0.2,
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.007 + 0.003,
          vx: (Math.random() - 0.5) * 0.1,
          vy: (Math.random() - 0.5) * 0.07,
        };
      });
    }

    var t = 0;
    function draw() {
      ctx.clearRect(0, 0, W, H);
      t += 0.016;
      particles.forEach(function (p) {
        p.x = (p.x + p.vx + W) % W;
        p.y = (p.y + p.vy + H) % H;
        var alpha = 0.22 + 0.32 * Math.sin(t * p.speed * 60 + p.phase);
        var col = (p.phase < 1.0) ? ('rgba(127,255,196,' + alpha + ')')
                : (p.phase < 2.1) ? ('rgba(100,220,255,' + alpha + ')')
                :                   ('rgba(200,150,255,' + alpha + ')');
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
      });
      requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    draw();
  }

  /* ─── Classical bit ──────────────────────────────────────────────────────── */
  function wireClassicalBit() {
    var sw  = document.getElementById('home-bit-switch');
    var val = document.getElementById('home-bit-value');
    if (!sw || !val) return;
    function flip() {
      sw.classList.toggle('on');
      val.textContent = sw.classList.contains('on') ? '1' : '0';
    }
    sw.addEventListener('click', flip);
    sw.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); }
    });
  }

  /* ─── Bloch sphere renderer (reusable) ───────────────────────────────────── */
  function createBlochRenderer(canvasId) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    var ctx = canvas.getContext('2d');
    var W = canvas.width, H = canvas.height;
    var CX = W / 2, CY = H / 2, R = W * 0.37;

    var theta = 0, phi = 0;
    var viewPitch = 0.38, viewYaw = 0.55;
    var dragging = false, lastMX = 0, lastMY = 0;
    var animId = null;

    function proj(vx, vy, vz) {
      var x1 = vx * Math.cos(viewYaw) - vy * Math.sin(viewYaw);
      var y1 = vx * Math.sin(viewYaw) + vy * Math.cos(viewYaw);
      var y2 = y1 * Math.cos(viewPitch) - vz * Math.sin(viewPitch);
      var x2 = x1;
      return { sx: CX + x2 * R, sy: CY - y2 * R };
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // sphere circle + glow
      var bg = ctx.createRadialGradient(CX - R * 0.22, CY - R * 0.3, R * 0.12, CX, CY, R * 1.05);
      bg.addColorStop(0, 'rgba(111,212,224,0.25)');
      bg.addColorStop(0.55, 'rgba(127,255,196,0.07)');
      bg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2); ctx.fill();

      ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2);
      ctx.strokeStyle = 'var(--cyan)'; ctx.lineWidth = 1.2;
      ctx.globalAlpha = 0.72; ctx.stroke(); ctx.globalAlpha = 1;

      // equator
      ctx.beginPath(); ctx.setLineDash([3, 4]);
      for (var i = 0; i <= 64; i++) {
        var a = (i / 64) * Math.PI * 2;
        var p = proj(Math.cos(a), Math.sin(a), 0);
        i === 0 ? ctx.moveTo(p.sx, p.sy) : ctx.lineTo(p.sx, p.sy);
      }
      ctx.strokeStyle = 'var(--cyan)'; ctx.lineWidth = 0.95;
      ctx.globalAlpha = 0.45; ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 1;

      // meridian
      ctx.beginPath();
      for (var j = 0; j <= 64; j++) {
        var b = (j / 64) * Math.PI * 2;
        var q = proj(Math.cos(b), 0, Math.sin(b));
        j === 0 ? ctx.moveTo(q.sx, q.sy) : ctx.lineTo(q.sx, q.sy);
      }
      ctx.strokeStyle = 'var(--magenta)'; ctx.lineWidth = 0.9;
      ctx.globalAlpha = 0.35; ctx.stroke(); ctx.globalAlpha = 1;

      // axes
      var axes = [
        { d:[0,0, 0.95], lbl:'|0⟩', col:'var(--cyan)',    a:0.8 },
        { d:[0,0,-0.88],  lbl:'|1⟩', col:'var(--phos)',    a:0.5 },
        { d:[0.9,0,0],    lbl:'x',   col:'var(--magenta)', a:0.4 },
        { d:[0,0.9,0],    lbl:'y',   col:'var(--amber)',   a:0.4 },
      ];
      axes.forEach(function (ax) {
        var o = proj(0,0,0), e = proj(ax.d[0],ax.d[1],ax.d[2]);
        ctx.beginPath(); ctx.moveTo(o.sx,o.sy); ctx.lineTo(e.sx,e.sy);
        ctx.strokeStyle = ax.col; ctx.lineWidth = 1;
        ctx.globalAlpha = ax.a; ctx.stroke();

        // Highlight |0> and |1> as the classical anchor states.
        if (ax.lbl === '|0⟩' || ax.lbl === '|1⟩') {
          ctx.save();
          ctx.globalAlpha = 0.95;
          ctx.shadowColor = ax.col;
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(e.sx, e.sy, 4.2, 0, Math.PI * 2);
          ctx.fillStyle = ax.col;
          ctx.fill();
          ctx.restore();
        }

        ctx.font = '11px var(--mono)'; ctx.fillStyle = ax.col;
        ctx.globalAlpha = (ax.lbl === '|0⟩' || ax.lbl === '|1⟩') ? 1 : ax.a * 0.9;
        ctx.fillText(ax.lbl, e.sx+4, e.sy+4);
        ctx.globalAlpha = 1;
      });

      // state vector
      var vx = Math.sin(theta)*Math.cos(phi);
      var vy = Math.sin(theta)*Math.sin(phi);
      var vz = Math.cos(theta);
      var o  = proj(0,0,0), tp = proj(vx,vy,vz);

      // glow
      var grd = ctx.createRadialGradient(tp.sx,tp.sy,0,tp.sx,tp.sy,15);
      grd.addColorStop(0,'rgba(127,255,196,0.45)');
      grd.addColorStop(1,'rgba(127,255,196,0)');
      ctx.fillStyle = grd; ctx.beginPath();
      ctx.arc(tp.sx,tp.sy,15,0,Math.PI*2); ctx.fill();

      // shaft
      ctx.beginPath(); ctx.moveTo(o.sx,o.sy); ctx.lineTo(tp.sx,tp.sy);
      ctx.strokeStyle = 'var(--phos)'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
      ctx.globalAlpha = 0.9; ctx.stroke(); ctx.globalAlpha = 1;

      // arrowhead
      var dx = tp.sx-o.sx, dy = tp.sy-o.sy, len = Math.sqrt(dx*dx+dy*dy)||1;
      var ux = dx/len, uy = dy/len;
      ctx.beginPath();
      ctx.moveTo(tp.sx,tp.sy);
      ctx.lineTo(tp.sx-ux*9+(-uy)*4.5, tp.sy-uy*9+ux*4.5);
      ctx.lineTo(tp.sx-ux*9-(-uy)*4.5, tp.sy-uy*9-ux*4.5);
      ctx.closePath(); ctx.fillStyle = 'var(--phos)'; ctx.fill();

      // tip dot
      ctx.beginPath(); ctx.arc(tp.sx,tp.sy,4,0,Math.PI*2);
      ctx.fillStyle = 'var(--ink)'; ctx.fill();
    }

    function lerp(a, b, t) { return a + (b-a)*t; }
    function animateTo(th, ph) {
      if (animId) cancelAnimationFrame(animId);
      var tStart = theta, pStart = phi;
      var dp = ph - pStart;
      while (dp >  Math.PI) dp -= 2*Math.PI;
      while (dp < -Math.PI) dp += 2*Math.PI;
      var pEnd = pStart + dp;
      function step() {
        theta = lerp(theta, th, 0.13);
        phi   = lerp(phi, pEnd, 0.13);
        draw();
        if (Math.abs(th-theta)>0.004 || Math.abs(pEnd-phi)>0.004) {
          animId = requestAnimationFrame(step);
        }
      }
      step();
    }

    // drag
    canvas.addEventListener('mousedown', function (e) { dragging=true; lastMX=e.clientX; lastMY=e.clientY; });
    window.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      viewYaw   += (e.clientX-lastMX)*0.011;
      viewPitch += (e.clientY-lastMY)*0.011;
      viewPitch  = Math.max(-1.4,Math.min(1.4,viewPitch));
      lastMX=e.clientX; lastMY=e.clientY; draw();
    });
    window.addEventListener('mouseup', function () { dragging=false; });
    canvas.addEventListener('touchstart', function (e) {
      if (e.touches.length===1) { dragging=true; lastMX=e.touches[0].clientX; lastMY=e.touches[0].clientY; }
    }, { passive:true });
    window.addEventListener('touchmove', function (e) {
      if (!dragging||e.touches.length!==1) return;
      viewYaw   += (e.touches[0].clientX-lastMX)*0.011;
      viewPitch += (e.touches[0].clientY-lastMY)*0.011;
      viewPitch  = Math.max(-1.4,Math.min(1.4,viewPitch));
      lastMX=e.touches[0].clientX; lastMY=e.touches[0].clientY; draw();
    }, { passive:true });
    window.addEventListener('touchend', function () { dragging=false; });

    draw();
    return { draw: draw, animateTo: animateTo };
  }

  /* ─── Bloch state label ──────────────────────────────────────────────────── */
  function stateLabel(theta, phi) {
    var eps = 0.07, PI = Math.PI;
    function norm(n) { while (n>PI) n-=2*PI; while (n<-PI) n+=2*PI; return n; }
    if (theta < eps)      return '|ψ⟩ = |0⟩';
    if (theta > PI-eps)   return '|ψ⟩ = |1⟩';
    if (Math.abs(theta-PI/2) < eps) {
      var pn = norm(phi);
      if (Math.abs(pn) < eps)                    return '|ψ⟩ = |+⟩ = (|0⟩+|1⟩)/√2';
      if (Math.abs(Math.abs(pn)-PI) < eps)        return '|ψ⟩ = |−⟩ = (|0⟩−|1⟩)/√2';
      if (Math.abs(pn-PI/2) < eps)               return '|ψ⟩ = |+i⟩ = (|0⟩+i|1⟩)/√2';
      if (Math.abs(pn+PI/2) < eps)               return '|ψ⟩ = |−i⟩ = (|0⟩−i|1⟩)/√2';
    }
    return '|ψ⟩ = '+Math.cos(theta/2).toFixed(2)+'|0⟩ + e^(iφ)·'+Math.sin(theta/2).toFixed(2)+'|1⟩';
  }

  /* ─── Wire explore Bloch sphere ──────────────────────────────────────────── */
  function wireBlochSphere() {
    var sphere  = createBlochRenderer('home-bloch-canvas');
    if (!sphere) return;
    var stateEl = document.getElementById('home-bloch-state');
    var presets = document.querySelectorAll('.home-preset');
    presets.forEach(function (btn) {
      btn.addEventListener('click', function () {
        presets.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var th = parseFloat(btn.dataset.theta);
        var ph = parseFloat(btn.dataset.phi);
        sphere.animateTo(th, ph);
        setTimeout(function () { if (stateEl) stateEl.textContent = stateLabel(th, ph); }, 450);
      });
    });
  }

  /* ─── Wire gate Bloch sphere ─────────────────────────────────────────────── */
  function wireGateBloch() {
    var sphere  = createBlochRenderer('home-gate-canvas');
    if (!sphere) return;
    var histEl  = document.getElementById('home-gate-history');
    var stateEl = document.getElementById('home-gate-state');
    var state   = [0, 0];
    var history = [];
    var PI = Math.PI;

    function applyGate(g, th, ph) {
      var x = Math.sin(th)*Math.cos(ph), y = Math.sin(th)*Math.sin(ph), z = Math.cos(th);
      function rotX(a){var c=Math.cos(a),s=Math.sin(a),ny=c*y-s*z,nz=s*y+c*z;y=ny;z=nz;}
      function rotY(a){var c=Math.cos(a),s=Math.sin(a),nx=c*x+s*z,nz=-s*x+c*z;x=nx;z=nz;}
      function rotZ(a){var c=Math.cos(a),s=Math.sin(a),nx=c*x-s*y,ny=s*x+c*y;x=nx;y=ny;}
      if      (g==='X') rotX(PI);
      else if (g==='Y') rotY(PI);
      else if (g==='Z') rotZ(PI);
      else if (g==='H'){rotY(PI/2);rotX(PI);}
      else if (g==='S') rotZ(PI/2);
      else if (g==='T') rotZ(PI/4);
      return [Math.acos(Math.max(-1,Math.min(1,z))), Math.atan2(y,x)];
    }

    document.querySelectorAll('.home-gate-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var g = btn.dataset.gate;
        if (g==='RESET') {
          state=[0,0]; history=[];
          sphere.animateTo(0,0);
          if (histEl) histEl.innerHTML='No gates applied yet';
          if (stateEl) stateEl.textContent='State: |0⟩';
          return;
        }
        state = applyGate(g, state[0], state[1]);
        history.push(g);
        sphere.animateTo(state[0], state[1]);
        if (histEl) histEl.innerHTML = history.map(function(g){return '<span class="gh-gate">'+g+'</span>';}).join(' → ');
        if (stateEl) stateEl.textContent = stateLabel(state[0], state[1]);
      });
    });
  }

  /* ─── Electron spin superposition demo ─────────────────────────────────── */
  function initSpinDemo() {
    var canvas = document.getElementById('home-spin-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var W = canvas.width, H = canvas.height;
    var state = 'plus';

    function drawArrow(x, y, len, ang, col) {
      var ex = x + len * Math.cos(ang), ey = y + len * Math.sin(ang);
      ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - 8 * Math.cos(ang - 0.45), ey - 8 * Math.sin(ang - 0.45));
      ctx.lineTo(ex - 8 * Math.cos(ang + 0.45), ey - 8 * Math.sin(ang + 0.45));
      ctx.closePath(); ctx.fill();
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(16,22,19,0.95)';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'var(--line-bright)';
      ctx.strokeRect(18, 18, W - 36, H - 36);

      // left: preparation axis x
      ctx.font = '10px var(--mono)';
      ctx.fillStyle = 'var(--ink-faint)';
      ctx.fillText('prepare', 46, 36);
      ctx.fillText('measure z', 226, 36);

      ctx.beginPath(); ctx.arc(92, 102, 38, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(111,212,224,0.55)'; ctx.stroke();
      drawArrow(92, 102, 30, 0, 'var(--cyan)');
      ctx.fillStyle = 'var(--cyan)'; ctx.fillText('|+>', 114, 105);

      // right measurement outcomes
      ctx.beginPath(); ctx.arc(268, 72, 24, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(127,255,196,0.65)'; ctx.stroke();
      ctx.beginPath(); ctx.arc(268, 132, 24, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(230,127,184,0.65)'; ctx.stroke();
      ctx.fillStyle = 'var(--phos)'; ctx.fillText('|0>', 258, 76);
      ctx.fillStyle = 'var(--magenta)'; ctx.fillText('|1>', 258, 136);

      if (state === 'plus') {
        drawArrow(150, 102, 72, -0.28, 'rgba(255,184,101,0.85)');
        drawArrow(150, 102, 72, 0.28, 'rgba(255,184,101,0.55)');
      } else if (state === '0') {
        drawArrow(150, 102, 72, -0.52, 'var(--phos)');
      } else {
        drawArrow(150, 102, 72, 0.52, 'var(--magenta)');
      }
    }

    var stateEl = document.getElementById('home-spin-state');
    document.getElementById('home-spin-super-btn').addEventListener('click', function () {
      state = 'plus';
      draw();
      if (stateEl) {
        stateEl.textContent = '\(|\psi\\rangle = |+\\rangle = (|0\\rangle + |1\\rangle)/\sqrt{2}\)';
        stateEl.classList.remove('settled');
      }
    });
    document.getElementById('home-spin-measure-btn').addEventListener('click', function () {
      state = (Math.random() > 0.5) ? '0' : '1';
      draw();
      if (stateEl) {
        stateEl.textContent = state === '0' ? '\(|\psi\\rangle \\to |0\\rangle\) (spin up)' : '\(|\psi\\rangle \\to |1\\rangle\) (spin down)';
        stateEl.classList.add('settled');
      }
    });
    draw();
  }

  /* ─── Quantum coin flip ──────────────────────────────────────────────────── */
  function initCoinFlip() {
    var row   = document.getElementById('home-coin-row');
    var stats = document.getElementById('home-coin-stats');
    if (!row) return;
    var counts = {'0':0,'1':0};
    var measureSphere = createBlochRenderer('home-measure-bloch-canvas');
    var measureStateEl = document.getElementById('home-measure-bloch-state');
    if (measureSphere) {
      measureSphere.animateTo(Math.PI/2, 0); // |+>
      if (measureStateEl) measureStateEl.textContent = '\(|\psi\\rangle = |+\\rangle\)';
    }

    function addCoin(result) {
      var coin=document.createElement('div');
      coin.className='home-coin '+(result==='1'?'one':'zero');
      coin.textContent=result;
      row.appendChild(coin);
      if (row.children.length>42) row.removeChild(row.firstChild);
      counts[result]++;
      var total=counts['0']+counts['1'];
      if(stats) stats.textContent=total+' shots · |1⟩: '+counts['1']+' ('+Math.round(counts['1']/total*100)+'%) · |0⟩: '+counts['0']+' ('+Math.round(counts['0']/total*100)+'%)';
    }

    document.getElementById('home-flip-btn').addEventListener('click',function(){ var r=Math.random()>0.5?'1':'0'; addCoin(r); if(measureSphere){ if(r==='1'){measureSphere.animateTo(Math.PI,0); if(measureStateEl) measureStateEl.textContent='\(|\psi\\rangle \\to |1\\rangle\)';} else {measureSphere.animateTo(0,0); if(measureStateEl) measureStateEl.textContent='\(|\psi\\rangle \\to |0\\rangle\)';}} });
    document.getElementById('home-flip-10-btn').addEventListener('click',function(){ var r='0'; for(var i=0;i<10;i++){ r=Math.random()>0.5?'1':'0'; addCoin(r);} if(measureSphere){ if(r==='1'){measureSphere.animateTo(Math.PI,0); if(measureStateEl) measureStateEl.textContent='\(|\psi\\rangle \\to |1\\rangle\)';} else {measureSphere.animateTo(0,0); if(measureStateEl) measureStateEl.textContent='\(|\psi\\rangle \\to |0\\rangle\)';}} });
    document.getElementById('home-flip-reset-btn').addEventListener('click',function(){
      row.innerHTML=''; counts={'0':0,'1':0};
      if(stats) stats.textContent='';
      if(measureSphere){measureSphere.animateTo(Math.PI/2,0); if(measureStateEl) measureStateEl.textContent='\(|\psi\\rangle = |+\\rangle\)';}
    });
  }

  /* ─── Bell state experiment ──────────────────────────────────────────────── */
  function initBell() {
    var orbA=document.getElementById('home-orb-a');
    var orbB=document.getElementById('home-orb-b');
    var wire=document.getElementById('home-bell-wire');
    var noteEl=document.getElementById('home-bell-note');
    if (!orbA) return;

    var counts={'00':0,'01':0,'10':0,'11':0}, total=0;

    function updateBars() {
      ['00','01','10','11'].forEach(function(k){
        var pct=total>0?counts[k]/total:0;
        var bar=document.getElementById('home-bar-'+k);
        var lbl=document.getElementById('home-pct-'+k);
        if(bar) bar.style.width=(pct*100).toFixed(1)+'%';
        if(lbl) lbl.textContent=total>0?Math.round(pct*100)+'%':'—';
      });
    }

    function runShots(n) {
      wire.classList.add('active');
      for(var i=0;i<n;i++){ counts[Math.random()>0.5?'00':'11']++; total++; }
      var last=Math.random()>0.5?'00':'11';
      orbA.textContent=last[0]; orbB.textContent=last[1];
      orbA.className='home-bell-orb result-'+last[0];
      orbB.className='home-bell-orb result-'+last[1];
      updateBars();
      if(noteEl){
        if(total>=10){
          noteEl.innerHTML='After <strong>'+total+' shots</strong>: only |00⟩ and |11⟩ appear. The qubits always agree, even though each is individually random.';
        } else {
          noteEl.textContent=total+' shot'+(total>1?'s':'')+' recorded.';
        }
      }
    }

    document.getElementById('home-bell-1-btn').addEventListener('click',function(){runShots(1);});
    document.getElementById('home-bell-100-btn').addEventListener('click',function(){runShots(100);});
    document.getElementById('home-bell-reset-btn').addEventListener('click',function(){
      ['00','01','10','11'].forEach(function(k){counts[k]=0;}); total=0;
      orbA.textContent='?'; orbB.textContent='?';
      orbA.className='home-bell-orb'; orbB.className='home-bell-orb';
      wire.classList.remove('active');
      updateBars();
      if(noteEl) noteEl.textContent='Run the experiment. Watch which outcomes appear.';
    });
  }

  /* ─── Scroll reveal ──────────────────────────────────────────────────────── */
  function initScrollReveal() {
    if (!window.IntersectionObserver) return;
    document.querySelectorAll('.home-reveal').forEach(function (el) {
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { el.classList.add('visible'); obs.unobserve(el); }
        });
      }, { threshold: 0.07 });
      obs.observe(el);
    });
  }

  /* ─── Init ──────────────────────────────────────────────────────────────── */
  function initHomeLanding(opts) {
    var force = opts && opts.force;
    var root  = document.getElementById('view-home');
    if (!root) return;
    if (!force && root.dataset.homeMounted === '1') return;

    var oldStyle = document.getElementById('home-extra-styles');
    if (oldStyle) oldStyle.remove();

    root.innerHTML = HOME_LANDING_HTML;
    root.dataset.homeMounted = '1';

    requestAnimationFrame(function () {
      initHeroCanvas();
      wireClassicalBit();
      wireBlochSphere();
      wireGateBloch();
      initSpinDemo();
      initCoinFlip();
      initBell();
      initScrollReveal();
    });

    if (typeof global.onHomeLandingMounted === 'function') {
      try { global.onHomeLandingMounted(root); } catch (e) { console.warn('onHomeLandingMounted', e); }
    }
  }

  function remountHomeLanding() {
    var root = document.getElementById('view-home');
    if (!root) return;
    delete root.dataset.homeMounted;
    initHomeLanding({ force: true });
  }

  global.HomeLanding = {
    init: initHomeLanding,
    remount: remountHomeLanding,
    getTemplate: function () { return HOME_LANDING_HTML; },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { initHomeLanding(); });
  } else {
    initHomeLanding();
  }

})(typeof window !== 'undefined' ? window : this);
