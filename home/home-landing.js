/**
 * Home landing tab — immersive interactive edition.
 * Uses the site's own CSS variables and class conventions throughout.
 * New interactive elements get scoped styles via #home-extra-styles.
 */
(function (global) {
  'use strict';

  function cssRGB(varName, fallback) {
    var raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    return raw || fallback;
  }

  function rgbaVar(varName, alpha, fallback) {
    return 'rgba(' + cssRGB(varName, fallback) + ',' + alpha + ')';
  }

  /* ─── Scoped styles for new interactive elements only ───────────────────── */
  /* All colors reference the site's existing CSS variables. */
  const HOME_EXTRA_CSS = `
  /* ── standardized "Continue in tutorial" CTAs ────────────────────────── */
  .home-continue {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    margin-top: 1.25rem;
    padding: 0.55rem 0.95rem 0.55rem 0.75rem;
    background: var(--bg-0);
    border: 1px solid var(--line-bright);
    border-left: 2px solid var(--phos);
    border-radius: 3px;
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 0.08em;
    color: var(--ink-dim);
    text-decoration: none;
    cursor: pointer;
    transition: background 0.18s, border-color 0.18s, transform 0.18s, box-shadow 0.2s;
  }
  .home-continue:hover,
  .home-continue:focus-visible {
    background: var(--bg-2);
    border-color: var(--phos-dim);
    border-left-color: var(--phos);
    color: var(--phos);
    box-shadow: 0 0 16px rgba(var(--phos-rgb), 0.12);
    outline: none;
    transform: translateX(2px);
  }
  .home-continue-tag {
    font-size: 9px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--cyan);
    border-right: 1px solid var(--line);
    padding-right: 0.6rem;
  }
  .home-continue:hover .home-continue-tag { color: var(--phos); }
  .home-continue-arrow {
    margin-left: 0.15rem;
    transition: transform 0.2s;
  }
  .home-continue:hover .home-continue-arrow { transform: translateX(3px); }

  /* ── hero particle canvas ── */
  #home-hero-canvas {
    position: absolute; inset: 0; width: 100%; height: 100%;
    pointer-events: none; opacity: 0.5;
  }

  /* ── hero wave-function layer (scroll-reactive) ── */
  #home-hero-waves {
    position: absolute; inset: 0; width: 100%; height: 100%;
    pointer-events: none; opacity: 0.55;
  }
  #home-hero-waves .wf-path {
    fill: none;
    stroke-width: 1.4;
    stroke-linecap: round;
    filter: drop-shadow(0 0 6px currentColor);
  }
  #home-hero-waves .wf-0 { color: rgba(var(--phos-rgb), 0.85); stroke: currentColor; }
  #home-hero-waves .wf-1 { color: rgba(var(--cyan-rgb), 0.75); stroke: currentColor; }
  #home-hero-waves .wf-2 { color: rgba(var(--magenta-rgb), 0.55); stroke: currentColor; stroke-dasharray: 2 5; }

  /* ── hero floating spin arrows ── */
  .home-hero-arrows {
    position: absolute; inset: 0; pointer-events: none; z-index: 0;
  }
  .home-hero-arrow {
    position: absolute;
    font-family: var(--serif);
    font-size: 22px;
    color: var(--phos);
    opacity: 0.55;
    text-shadow: 0 0 12px rgba(var(--phos-rgb), 0.5);
    animation: heroArrowBob 4s ease-in-out infinite;
    will-change: transform, opacity;
    user-select: none;
  }
  .home-hero-arrow.down { color: rgba(var(--magenta-rgb), 0.85); text-shadow: 0 0 12px rgba(var(--magenta-rgb), 0.45); }
  .home-hero-arrow.cyan { color: rgba(var(--cyan-rgb), 0.8); text-shadow: 0 0 12px rgba(var(--cyan-rgb), 0.4); }
  @keyframes heroArrowBob {
    0%,100% { transform: translateY(0) rotate(var(--tilt, 0deg)); opacity: 0.4; }
    50%     { transform: translateY(-10px) rotate(var(--tilt, 0deg)); opacity: 0.7; }
  }

  /* ── hero section ── */
  .home-hero-wrap {
    position: relative; overflow: hidden;
    padding: 5rem 2rem 4rem;
    border-bottom: 1px solid var(--line);
    min-height: 72vh;
    display: flex;
    align-items: center;
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
  .home-floating-arrows {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
  }
  .home-floating-arrow {
    position: absolute;
    font-family: var(--serif);
    font-size: 18px;
    color: var(--phos);
    opacity: 0.2;
    text-shadow: 0 0 10px rgba(var(--phos-rgb), 0.22);
    user-select: none;
    will-change: transform, opacity;
    animation: homeFloatArrow 8s ease-in-out infinite;
  }
  .home-floating-arrow.down { transform: rotate(180deg); }
  .home-floating-arrow.cyan { color: rgba(var(--cyan-rgb), 0.62); text-shadow: 0 0 10px rgba(var(--cyan-rgb), 0.22); }
  .home-floating-arrow.magenta { color: rgba(var(--magenta-rgb), 0.55); text-shadow: 0 0 10px rgba(var(--magenta-rgb), 0.2); }
  .home-floating-arrow.amber { color: rgba(var(--amber-rgb), 0.52); text-shadow: 0 0 10px rgba(var(--amber-rgb), 0.2); }
  @keyframes homeFloatArrow {
    0%, 100% { transform: translateY(0px) rotate(var(--rot, 0deg)); opacity: 0.14; }
    50%      { transform: translateY(-12px) rotate(var(--rot, 0deg)); opacity: 0.28; }
  }
  .home-eyebrow {
    font-family: var(--mono); font-size: 10px;
    letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--phos); opacity: 0.7; margin-bottom: 1.25rem;
  }

  /* ── scroll-reveal (per-block; triggers as each block enters view) ── */
  .home-reveal {
    opacity: 0; transform: translateY(20px);
    transition: opacity 0.75s cubic-bezier(0.22, 1, 0.36, 1), transform 0.75s cubic-bezier(0.22, 1, 0.36, 1);
    will-change: opacity, transform;
  }
  .home-reveal.visible { opacity: 1; transform: none; will-change: auto; }
  .home-hero-inner .home-reveal:nth-child(1) { transition-delay: 0s; }
  .home-hero-inner .home-reveal:nth-child(2) { transition-delay: 0.08s; }
  .home-hero-inner .home-reveal:nth-child(3) { transition-delay: 0.16s; }
  .home-hero-inner .home-reveal:nth-child(4) { transition-delay: 0.24s; }
  .home-hero-inner .home-reveal:nth-child(5) { transition-delay: 0.32s; }
  .home-learn-grid .home-reveal:nth-child(1) { transition-delay: 0s; }
  .home-learn-grid .home-reveal:nth-child(2) { transition-delay: 0.05s; }
  .home-learn-grid .home-reveal:nth-child(3) { transition-delay: 0.1s; }
  .home-learn-grid .home-reveal:nth-child(4) { transition-delay: 0.15s; }
  .home-learn-grid .home-reveal:nth-child(5) { transition-delay: 0.2s; }

  /* ── Bell state formula box ── */
  .home-bell-formula-box {
    margin-top: 1.25rem;
    padding: 1rem 1.15rem 1.1rem;
    background: var(--bg-0);
    border: 1px solid var(--line-bright);
    border-radius: 4px;
    border-left: 2px solid var(--cyan);
  }
  .home-bell-formula-label {
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--ink-faint);
    margin-bottom: 0.65rem;
  }
  .home-bell-formula-katex {
    font-family: var(--serif);
    font-size: 1.05rem;
    color: var(--ink);
    line-height: 1.5;
  }

  /* ── Home gate gallery (palette-style icons) ── */
  .home-gate-gallery {
    width: 100%;
    margin-top: 0.35rem;
    padding-top: 0.85rem;
    border-top: 1px dashed var(--line);
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }
  .home-gate-gallery-label {
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ink-faint);
    align-self: flex-start;
  }
  .home-gate-card {
    display: grid;
    grid-template-columns: 52px 1fr;
    gap: 0.85rem;
    align-items: center;
    padding: 0.55rem 0.65rem;
    background: var(--bg-0);
    border: 1px solid var(--line);
    border-radius: 3px;
    transition: border-color 0.15s, box-shadow 0.15s;
    cursor: pointer;
    text-align: left;
    font: inherit;
    color: inherit;
    width: 100%;
    box-sizing: border-box;
  }
  .home-gate-card:focus-visible {
    outline: 2px solid var(--cyan);
    outline-offset: 2px;
  }
  .home-gate-card:hover {
    border-color: var(--phos-dim);
    box-shadow: 0 0 14px rgba(var(--phos-rgb), 0.08);
  }
  .home-gate-card-reset .home-gate-icon {
    font-family: var(--mono);
    font-size: 17px;
  }
  .home-gate-icon {
    width: 48px; height: 48px;
    display: flex; align-items: center; justify-content: center;
    background: var(--bg-2);
    border: 1px solid var(--line);
    font-family: var(--serif);
    font-weight: 500;
    font-size: 20px;
    color: var(--ink);
    user-select: none;
  }
  .home-gate-card:hover .home-gate-icon {
    border-color: var(--phos);
    color: var(--phos);
    box-shadow: 0 0 10px rgba(var(--phos-rgb), 0.15);
  }
  .home-gate-card-body .home-gate-card-name {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--cyan);
    margin-bottom: 0.25rem;
  }
  .home-gate-card-body p {
    font-size: 0.82rem;
    line-height: 1.55;
    color: var(--ink-dim);
    margin: 0;
  }

  /* ── Classical lamp vs quantum “dimmer” (between 01 and 02) ── */
  .home-lamp-bridge .home-lamp-pair {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.25rem;
    width: 100%;
    max-width: 520px;
    margin: 0 auto;
  }
  .home-lamp-pane {
    background: var(--bg-0);
    border: 1px solid var(--line);
    border-radius: 6px;
    padding: 1rem 1rem 1.15rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.85rem;
  }
  .home-lamp-col-label {
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ink-faint);
    align-self: flex-start;
  }
  .home-lamp-switch {
    width: 44px; height: 72px;
    border-radius: 4px;
    border: 1px solid var(--line-bright);
    background: linear-gradient(180deg, var(--bg-2) 0%, var(--bg-0) 100%);
    cursor: pointer;
    position: relative;
    padding: 0;
    transition: border-color 0.15s, box-shadow 0.2s;
  }
  .home-lamp-switch::after {
    content: '';
    position: absolute;
    left: 5px; right: 5px;
    top: 8px;
    height: 28px;
    border-radius: 2px;
    background: var(--line-bright);
    box-shadow: inset 0 1px 2px rgba(var(--ink-rgb), 0.2);
    transition: top 0.18s ease, background 0.18s;
  }
  .home-lamp-switch.on {
    border-color: var(--phos-dim);
    box-shadow: 0 0 16px rgba(var(--phos-rgb), 0.12);
  }
  .home-lamp-switch.on::after {
    top: 36px;
    background: var(--phos);
    box-shadow: 0 0 12px rgba(var(--phos-rgb), 0.45);
  }
  .home-lamp-fixture {
    width: 72px; height: 72px;
    border-radius: 50%;
    border: 1px solid var(--line);
    display: flex;
    align-items: center;
    justify-content: center;
    background: radial-gradient(circle at 30% 25%, rgba(var(--line-bright-rgb), 0.45), var(--bg-1));
  }
  .home-lamp-bulb {
    width: 44px; height: 44px;
    border-radius: 50%;
    background: radial-gradient(circle at 32% 28%, rgba(90, 105, 100, 0.55), rgba(48, 56, 54, 0.98));
    border: 1px solid var(--line-bright);
    transition: background 0.2s, box-shadow 0.25s, border-color 0.2s;
    box-shadow:
      inset 0 0 14px rgba(111, 212, 224, 0.06),
      0 0 10px rgba(111, 212, 224, 0.08);
  }
  .home-lamp-bulb.on {
    background: radial-gradient(circle at 32% 28%, #fffef0, rgba(255,220,120,0.95));
    border-color: rgba(255, 210, 120, 0.85);
    box-shadow:
      inset 0 0 8px rgba(255, 255, 240, 0.35),
      0 0 22px rgba(255, 210, 120, 0.55),
      0 0 48px rgba(255, 184, 101, 0.35);
  }
  /* Quantum bulb: core fill and halo both track --q-glow (set from the slider in JS). */
  .home-lamp-bulb-q {
    --q-glow: 0.35;
    background: radial-gradient(
      circle at 32% 26%,
      rgba(245, 255, 252, calc(0.12 + 0.78 * var(--q-glow))) 0%,
      rgba(160, 248, 220, calc(0.1 + 0.72 * var(--q-glow))) 28%,
      rgba(90, 210, 195, calc(0.08 + 0.55 * var(--q-glow))) 52%,
      rgba(42, 78, 74, calc(0.82 - 0.45 * var(--q-glow))) 100%
    );
    border-color: rgba(140, 235, 230, calc(0.28 + 0.62 * var(--q-glow)));
    box-shadow:
      inset 0 0 16px rgba(255, 255, 255, calc(0.05 + 0.28 * var(--q-glow))),
      0 0 calc(10px + 42px * var(--q-glow)) rgba(127, 255, 196, calc(0.22 + 0.58 * var(--q-glow))),
      0 0 calc(4px + 28px * var(--q-glow)) rgba(160, 240, 255, calc(0.15 + 0.35 * var(--q-glow)));
    transition: box-shadow 0.12s ease-out, border-color 0.12s ease-out;
  }
  .home-lamp-scale {
    width: 100%;
    display: flex;
    justify-content: space-between;
    font-family: var(--mono);
    font-size: 8px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-faint);
    margin-top: 0.15rem;
  }
  .home-lamp-q-slider {
    width: 100%;
    accent-color: var(--cyan);
    margin: 0.25rem 0 0;
  }
  .home-lamp-hint {
    font-size: 0.78rem;
    line-height: 1.5;
    color: var(--ink-faint);
    text-align: center;
    margin: 0;
    padding: 0 0.25rem;
  }
  @media (max-width: 680px) {
    .home-lamp-bridge .home-lamp-pair { grid-template-columns: 1fr; }
  }

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
    background: rgba(var(--phos-rgb), 0.08);
    border-color: var(--phos-dim); color: var(--phos);
  }
  .home-coin.zero {
    background: rgba(var(--magenta-rgb), 0.08);
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
    background: rgba(var(--magenta-rgb), 0.07);
    box-shadow: 0 0 14px rgba(var(--magenta-rgb), 0.12);
  }
  .home-bell-orb.result-1 {
    border-color: var(--phos); color: var(--phos);
    background: rgba(var(--phos-rgb), 0.07);
    box-shadow: 0 0 14px rgba(var(--phos-rgb), 0.12);
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

  /* ── 3D spin Bloch panel (replaces 2D spin box) ── */
  .home-spin3d-wrap {
    display: flex; flex-direction: column; align-items: center; gap: 1rem;
    padding: 1.75rem; background: var(--bg-1);
    border: 1px solid var(--line); border-radius: 6px;
    position: relative;
  }
  #home-spin3d-canvas {
    display: block;
    cursor: grab;
    border-radius: 50%;
  }
  #home-spin3d-canvas:active { cursor: grabbing; }
  .home-spin3d-collapse-ripple {
    position: absolute;
    pointer-events: none;
    left: 50%; top: 50%;
    width: 30px; height: 30px;
    border-radius: 50%;
    transform: translate(-50%, -50%) scale(1);
    border: 2px solid var(--phos);
    opacity: 0;
  }
  .home-spin3d-collapse-ripple.go {
    animation: spinRipple 0.9s ease-out forwards;
  }
  @keyframes spinRipple {
    0%   { transform: translate(-50%, -50%) scale(0.4); opacity: 0.85; }
    100% { transform: translate(-50%, -50%) scale(5);   opacity: 0; }
  }

  /* ── Applications icon cards with hover reveal ── */
  .home-apps-section {
    padding: 4rem 2rem; max-width: 1040px; margin: 0 auto;
    border-bottom: 1px solid var(--line);
  }
  .home-apps-intro {
    max-width: 640px; margin: 0 0 2.25rem;
  }
  .home-apps-section .analysis-head,
  .home-apps-intro {
    max-width: 960px;
    margin-left: auto;
    margin-right: auto;
  }
  .home-apps-intro { margin-top: 0; margin-bottom: 2.25rem; }
  .home-apps-intro p {
    font-size: 0.98rem; line-height: 1.75; color: var(--ink-dim); margin: 0;
  }
  .home-apps-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    max-width: 960px;
    margin: 0 auto;
  }
  .home-app-card {
    position: relative;
    min-height: 250px;
    border: 1px solid var(--line);
    border-radius: 6px;
    background: linear-gradient(165deg, var(--bg-2), var(--bg-1));
    overflow: hidden;
    cursor: pointer;
    transition: border-color 0.22s, box-shadow 0.22s;
  }
  .home-app-card:hover,
  .home-app-card.show-details {
    border-color: var(--phos-dim);
    box-shadow: 0 0 18px rgba(var(--phos-rgb), 0.1);
  }
  .home-app-head {
    position: absolute;
    left: 1.05rem;
    right: 1.05rem;
    top: 1.15rem;
    z-index: 1;
  }
  .home-app-icon {
    width: 46px; height: 46px;
    display: flex; align-items: center; justify-content: center;
    border: 1px solid var(--line-bright);
    border-radius: 4px;
    background: var(--bg-0);
    margin-bottom: 0.85rem;
    transition: border-color 0.25s, box-shadow 0.25s;
  }
  .home-app-card:hover .home-app-icon {
    border-color: var(--phos);
    box-shadow: 0 0 12px rgba(var(--phos-rgb), 0.25);
  }
  .home-app-icon svg { width: 24px; height: 24px; stroke: var(--phos); fill: none; stroke-width: 1.5; }
  .home-app-title {
    font-family: var(--serif);
    font-size: 1.18rem;
    line-height: 1.25;
    color: var(--ink);
    margin: 0 0 0.35rem;
  }
  .home-app-kicker {
    font-family: var(--mono);
    font-size: 8px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(var(--cyan-rgb), 0.9);
    display: inline-block;
    padding: 0.2rem 0.45rem;
    border: 1px solid rgba(var(--cyan-rgb), 0.45);
    border-radius: 999px;
    background: rgba(var(--cyan-rgb), 0.12);
  }
  .home-app-reveal {
    position: absolute;
    left: 0; right: 0; bottom: 0;
    padding: 0.95rem 1rem 1rem;
    border-top: 1px solid rgba(var(--phos-rgb), 0.24);
    background: linear-gradient(to top, rgba(var(--bg-0-rgb, 10, 14, 12), 0.98), rgba(var(--bg-0-rgb, 10, 14, 12), 0.9) 65%, rgba(var(--bg-0-rgb, 10, 14, 12), 0.06));
    transform: translateY(68%);
    transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .home-app-card:hover .home-app-reveal,
  .home-app-card.show-details .home-app-reveal {
    transform: translateY(0);
  }
  .home-app-reveal .home-app-kicker { display: none; }
  .home-app-reveal p {
    font-size: 0.85rem;
    line-height: 1.6;
    color: var(--ink-dim);
    margin: 0 0 0.65rem;
  }
  .home-app-open {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.08em;
    color: var(--phos-dim);
    text-decoration: none;
  }
  .home-app-hint {
    position: absolute;
    font-family: var(--mono); font-size: 8px;
    letter-spacing: 0.12em;
    color: rgba(var(--cyan-rgb), 0.78);
    right: 1rem; bottom: 0.9rem;
    opacity: 0.95;
    border: 1px solid rgba(var(--cyan-rgb), 0.35);
    border-radius: 999px;
    padding: 0.18rem 0.45rem;
    background: rgba(var(--cyan-rgb), 0.12);
  }
  .home-app-card:hover .home-app-hint,
  .home-app-card.show-details .home-app-hint { opacity: 0; }
  @media (max-width: 860px) {
    .home-apps-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 520px) {
    .home-apps-grid { grid-template-columns: 1fr; }
  }

  /* ── Schrödinger's cat section ── */
  .home-cat-section {
    padding: 4rem 2rem; max-width: 960px; margin: 0 auto;
    border-bottom: 1px solid var(--line);
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2.75rem;
    align-items: center;
  }
  .home-cat-text p { font-size: 0.95rem; line-height: 1.75; color: var(--ink-dim); margin-bottom: 0.9rem; }
  .home-cat-stage {
    position: relative;
    width: 100%;
    aspect-ratio: 1 / 1;
    max-width: 320px;
    margin: 0 auto;
    border: 1px solid var(--line-bright);
    border-radius: 6px;
    background:
      linear-gradient(180deg, rgba(var(--line-bright-rgb), 0.32) 0%, var(--bg-1) 100%);
    overflow: hidden;
  }
  .home-cat-box-lid {
    position: absolute; left: 0; right: 0; top: 0; height: 34%;
    background: linear-gradient(180deg, rgba(var(--line-bright-rgb), 0.65) 0%, var(--bg-2) 100%);
    border-bottom: 1px solid var(--line-bright);
    transform-origin: top center;
    transition: transform 0.8s cubic-bezier(0.4, 1.4, 0.5, 1);
    z-index: 3;
    display: flex; align-items: center; justify-content: center;
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--ink-faint);
  }
  .home-cat-stage.open .home-cat-box-lid {
    transform: rotateX(-115deg);
  }
  .home-cat-layer {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    transition: opacity 0.7s ease;
  }
  .home-cat-layer svg { width: 72%; height: 72%; }
  .home-cat-layer.alive {
    opacity: 0.7;
    animation: catBreathe 3.8s ease-in-out infinite;
  }
  .home-cat-layer.dead {
    opacity: 0.55;
    transform: translate(4px, 4px);
  }
  @keyframes catBreathe {
    0%,100% { transform: scale(1); }
    50%     { transform: scale(1.02); }
  }
  .home-cat-stage.superposition .home-cat-layer.alive { animation: catSuperposeA 2.4s ease-in-out infinite; }
  .home-cat-stage.superposition .home-cat-layer.dead  { animation: catSuperposeB 2.4s ease-in-out infinite; }
  @keyframes catSuperposeA {
    0%,100% { opacity: 0.75; }
    50%     { opacity: 0.15; }
  }
  @keyframes catSuperposeB {
    0%,100% { opacity: 0.15; }
    50%     { opacity: 0.75; }
  }
  .home-cat-stage.resolved-alive .home-cat-layer.alive { opacity: 0.95; animation: catBreathe 3.8s ease-in-out infinite; }
  .home-cat-stage.resolved-alive .home-cat-layer.dead  { opacity: 0; animation: none; }
  .home-cat-stage.resolved-dead  .home-cat-layer.dead  { opacity: 0.92; animation: none; }
  .home-cat-stage.resolved-dead  .home-cat-layer.alive { opacity: 0; animation: none; }

  .home-cat-state-label {
    position: absolute; bottom: 0.65rem; left: 50%; transform: translateX(-50%);
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink-faint);
    z-index: 4;
    white-space: nowrap;
  }
  .home-cat-stage.resolved-alive .home-cat-state-label { color: var(--phos); }
  .home-cat-stage.resolved-dead  .home-cat-state-label { color: var(--magenta); }

  .home-cat-btns {
    display: flex; gap: 0.6rem; flex-wrap: wrap; margin-top: 1.1rem;
    justify-content: center;
  }
  @media (max-width: 680px) {
    .home-cat-section { grid-template-columns: 1fr; padding: 2.5rem 1.25rem; gap: 1.75rem; }
    .home-apps-section { padding: 2.5rem 1.25rem; }
  }

  /* ── responsive ── */
  @media (max-width: 680px) {
    .home-chapter { grid-template-columns: 1fr; padding: 2.5rem 1.25rem; }
    .home-chapter.flip { direction: ltr; }
    .home-hero-wrap { padding: 3rem 1.25rem 2.5rem; min-height: auto; }
    .home-floating-arrow { font-size: 15px; opacity: 0.14; }
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
  <div class="home-floating-arrows" id="home-floating-arrows" aria-hidden="true"></div>

  <!-- ══ HERO ══════════════════════════════════════════════════════════════ -->
  <section class="home-hero-wrap">
    <canvas id="home-hero-canvas" aria-hidden="true"></canvas>
    <svg id="home-hero-waves" aria-hidden="true" preserveAspectRatio="none">
      <path class="wf-path wf-2" id="wf-envelope" d=""></path>
      <path class="wf-path wf-1" id="wf-wave-1" d=""></path>
      <path class="wf-path wf-0" id="wf-wave-0" d=""></path>
    </svg>
    <div class="home-hero-arrows" aria-hidden="true">
      <span class="home-hero-arrow"      style="left:8%;  top:22%; --tilt: -4deg; animation-delay: 0s;">↑</span>
      <span class="home-hero-arrow down" style="left:15%; top:68%; --tilt:  6deg; animation-delay: -1.2s;">↓</span>
      <span class="home-hero-arrow cyan" style="right:10%;top:18%; --tilt: -8deg; animation-delay: -0.6s;">↑</span>
      <span class="home-hero-arrow down" style="right:16%;top:62%; --tilt:  3deg; animation-delay: -2.0s;">↓</span>
      <span class="home-hero-arrow cyan" style="right:4%; top:40%; --tilt:  0deg; animation-delay: -1.6s; font-size:16px;">↑</span>
      <span class="home-hero-arrow"      style="left:3%;  top:48%; --tilt:  9deg; animation-delay: -2.4s; font-size:16px;">↓</span>
    </div>
    <div class="home-hero-inner">
      <div class="home-eyebrow home-reveal">Quantum &amp; Lab · Interactive introduction</div>
      <h1 class="home-reveal">Quantum systems compute in ways<br/>that feel <em>impossible.</em></h1>
      <p class="home-reveal">Quantum ideas can feel strange at first. This page gives a quick, visual path from everyday bits to superposition, measurement, and entanglement.</p>
      <div class="home-hero-actions home-reveal">
        <button type="button" class="btn primary" onclick="switchTab('learn');switchSubtab('t1');">Begin Tutorial 1 →</button>
        <button type="button" class="btn" onclick="switchTab('lab')">Open circuit lab</button>
      </div>
    </div>
  </section>

  <!-- ══ 01: CLASSICAL BIT ═════════════════════════════════════════════════ -->
  <div class="home-chapter">
    <div class="home-chapter-text home-reveal">
      <span class="home-chapter-kicker">01 · The ordinary bit</span>
      <h2>Everything digital is a very fast <em>choice.</em></h2>
      <p>Classical computers store information as <strong>0 or 1</strong> — like a switch that is already off or on.</p>
      <p>That reliability is powerful, but it also sets a limit that qubits can go beyond.</p>
      <div class="rules" style="margin-top:1.25rem">
        <strong>Try it.</strong> Notice how the switch is always definite, even before you look. We are about to shatter that assumption.
      </div>
      <a href="#" class="home-continue" onclick="switchTab('learn');switchSubtab('t1');return false;">
        <span class="home-continue-tag">Tutorial 1</span>
        <span>Go deeper on bits &amp; qubits</span>
        <span class="home-continue-arrow">→</span>
      </a>
    </div>
    <div class="home-chapter-visual home-reveal">
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

  <!-- ══ Interlude: lamp vs quantum “dimmer” (between 01 and 02) ═══════════ -->
  <div class="home-chapter home-lamp-bridge">
    <div class="home-chapter-text home-reveal">
      <span class="home-chapter-kicker">Interlude · Between off and on</span>
      <h2>A lamp is only dark or bright — a qubit can <em>shade</em> the gap.</h2>
      <p>A classical bit is like a wall switch: fully off or fully on.</p>
      <p>A qubit can sit <strong>between</strong> \\(|0\\rangle\\) and \\(|1\\rangle\\). That extra space is what quantum algorithms use before measurement forces a 0 or 1.</p>
      <p class="rules" style="margin-top:1rem"><strong>Try both.</strong> Flip the classical switch: only pitch black or full glow. Drag the quantum slider: the bulb ramps through a continuum of “how much \\(|1\\rangle\\)‑ness” the state is carrying — a toy picture of how superposition sits between the extremes.</p>
    </div>
    <div class="home-chapter-visual home-reveal">
      <div class="home-lamp-pair">
        <div class="home-lamp-pane">
          <div class="home-lamp-col-label">Classical</div>
          <button type="button" class="home-lamp-switch" id="home-lamp-class-toggle" aria-pressed="false" aria-label="Toggle classical lamp"></button>
          <div class="home-lamp-fixture" aria-hidden="true">
            <div class="home-lamp-bulb" id="home-lamp-class-bulb"></div>
          </div>
          <p class="home-lamp-hint">Off or on — nothing in between survives as a stored bit.</p>
        </div>
        <div class="home-lamp-pane">
          <div class="home-lamp-col-label">Quantum intuition</div>
          <label for="home-lamp-q-slider" class="home-panel-label" style="align-self:stretch;margin:0">Amplitude toward \\(|1\\rangle\\) (toy brightness)</label>
          <input type="range" class="home-lamp-q-slider" id="home-lamp-q-slider" min="0" max="100" value="38" aria-valuemin="0" aria-valuemax="100" aria-valuenow="38" />
          <div class="home-lamp-scale"><span>\\(|0\\rangle\\) — dark</span><span>\\(|1\\rangle\\) — bright</span></div>
          <div class="home-lamp-fixture" aria-hidden="true">
            <div class="home-lamp-bulb home-lamp-bulb-q" id="home-lamp-q-bulb"></div>
          </div>
          <p class="home-lamp-hint">Brightness here stands in for how strongly the state points toward \\(|1\\rangle\\); phase is another knob the sphere will show next.</p>
        </div>
      </div>
    </div>
  </div>

  <!-- ══ 02: BLOCH SPHERE ══════════════════════════════════════════════════ -->
  <div class="home-chapter flip">
    <div class="home-chapter-text home-reveal">
      <span class="home-chapter-kicker">02 · The quantum bit</span>
      <h2>A qubit lives on the surface of a <em>sphere.</em></h2>
      <p>A qubit state can be drawn on the <strong>Bloch sphere</strong>: north is \\(|0\\rangle\\), south is \\(|1\\rangle\\), and points in between are superpositions.</p>
      <p>States on the equator can all look 50/50 when measured, but differ in <strong>phase</strong> — and phase drives interference.</p>
      <div class="rules" style="margin-top:1.25rem">
        Drag the sphere to rotate your view, or click a preset. Notice that |+⟩ and |−⟩ look equally mixed but are fundamentally different states.
      </div>
      <a href="#" class="home-continue" onclick="switchTab('learn');switchSubtab('t1');return false;">
        <span class="home-continue-tag">Tutorial 1</span>
        <span>Phase, amplitudes &amp; the sphere</span>
        <span class="home-continue-arrow">→</span>
      </a>
    </div>
    <div class="home-chapter-visual home-reveal">
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
        <div class="home-state-text" id="home-bloch-state">\\(|\\psi\\rangle = |0\\rangle\\)</div>
      </div>
    </div>
  </div>

  <div class="home-mini-quote home-reveal">"If quantum mechanics hasn't profoundly shocked you, you haven't understood it yet." <b>— Niels Bohr</b></div>

  <!-- ══ 03: SPIN MEASUREMENT ═══════════════════════════════════════════════ -->
  <div class="home-section-full" id="home-spin-section">
    <div class="analysis-head home-reveal">
      <h3>Measurement turns spin superposition into a definite result.</h3>
      <div class="num">03 · Superposition</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:2.5rem;align-items:center">
      <div class="home-reveal">
        <p style="font-size:0.95rem;color:var(--ink-dim);line-height:1.75;margin-bottom:0.9rem">
          Spin gives a concrete qubit model. Prepare \\(|+\\rangle\\), measure along z, and you get 50/50 outcomes: up \\(|0\\rangle\\) or down \\(|1\\rangle\\).
        </p>
        <p style="font-size:0.95rem;color:var(--ink-dim);line-height:1.75;margin-bottom:0.9rem">
          The result is not pre-written. Measurement forces the state to pick one outcome.
        </p>
        <p style="font-size:0.95rem;color:var(--ink-dim);line-height:1.75">
          Try repeated measurements and watch random shots settle into stable statistics.
        </p>
        <a href="#" class="home-continue" onclick="switchTab('learn');switchSubtab('t2');return false;">
          <span class="home-continue-tag">Tutorial 2</span>
          <span>Entanglement &amp; measurement</span>
          <span class="home-continue-arrow">→</span>
        </a>
      </div>
      <div class="home-spin3d-wrap home-reveal">
        <div class="home-panel-label" style="align-self:flex-start">Electron spin vector</div>
        <canvas id="home-spin3d-canvas" width="280" height="280" aria-label="Electron rendered as a glowing orb with a spin vector piercing through it"></canvas>
        <div class="home-spin3d-collapse-ripple" id="home-spin3d-ripple" aria-hidden="true"></div>
        <div class="home-spin-state" id="home-spin-state">\\(|\\psi\\rangle = |+\\rangle = (|0\\rangle + |1\\rangle)/\\sqrt{2}\\)</div>
        <div class="home-spin-btns">
          <button class="btn" id="home-spin-super-btn">Prepare \\(|+\\rangle\\)</button>
          <button class="btn primary" id="home-spin-measure-btn">Measure along z</button>
        </div>
      </div>
    </div>
  </div>

  <div class="home-mini-quote home-reveal">"Nature isn't classical... and if you want to make a simulation of nature, you'd better make it quantum mechanical." <b>— Richard Feynman</b></div>

  <!-- ══ 04: GATES ARE ROTATIONS ═══════════════════════════════════════════ -->
  <div class="home-chapter">
    <div class="home-chapter-text home-reveal">
      <span class="home-chapter-kicker">04 · Quantum gates</span>
      <h2>Gates are <em>rotations</em> of the sphere.</h2>
      <p>Classical NOT flips 0 to 1. Quantum gates are <strong>rotations</strong> on the Bloch sphere.</p>
      <p>The <strong>H gate</strong> moves \\(|0\\rangle\\) to an equal superposition, which appears everywhere in quantum algorithms.</p>
      <p>Try gate sequences below. Order matters: H then X is different from X then H.</p>
      <a href="#" class="home-continue" onclick="switchTab('learn');switchSubtab('t1');return false;">
        <span class="home-continue-tag">Tutorial 1</span>
        <span>Build intuition for gate dynamics</span>
        <span class="home-continue-arrow">→</span>
      </a>
    </div>
    <div class="home-chapter-visual home-reveal">
      <div class="home-panel">
        <div class="home-panel-label">Apply gates · start at |0⟩</div>
        <canvas id="home-gate-canvas" width="240" height="240" aria-label="Bloch sphere showing gate operations"></canvas>
        <div class="home-gate-gallery">
          <div class="home-gate-gallery-label">Apply gates</div>
          <button type="button" class="home-gate-card" data-gate="H">
            <div class="home-gate-icon" aria-hidden="true">H</div>
            <div class="home-gate-card-body">
              <div class="home-gate-card-name">Hadamard</div>
              <p>Maps the poles to the equator, creating equal superpositions used in algorithms and measurement bases.</p>
            </div>
          </button>
          <button type="button" class="home-gate-card" data-gate="X">
            <div class="home-gate-icon" aria-hidden="true">X</div>
            <div class="home-gate-card-body">
              <div class="home-gate-card-name">Pauli-X</div>
              <p>A π rotation about the x-axis — the quantum NOT that swaps |0⟩ and |1⟩ amplitudes on the Bloch sphere.</p>
            </div>
          </button>
          <button type="button" class="home-gate-card" data-gate="Y">
            <div class="home-gate-icon" aria-hidden="true">Y</div>
            <div class="home-gate-card-body">
              <div class="home-gate-card-name">Pauli-Y</div>
              <p>A π rotation about the y-axis that mixes |0⟩ and |1⟩ while inserting a relative phase between the components.</p>
            </div>
          </button>
          <button type="button" class="home-gate-card home-gate-card-reset" data-gate="RESET">
            <div class="home-gate-icon" aria-hidden="true">↻</div>
            <div class="home-gate-card-body">
              <div class="home-gate-card-name">Reset</div>
              <p>Return to \\(|0\\rangle\\) and clear the gate history.</p>
            </div>
          </button>
        </div>
        <div class="home-gate-history" id="home-gate-history">No gates applied yet</div>
        <div class="home-state-text" id="home-gate-state">State: |0⟩</div>
      </div>
    </div>
  </div>

  <!-- ══ 05: MEASUREMENT COIN FLIP ═════════════════════════════════════════ -->
  <div class="home-coin-section">
    <div class="analysis-head home-reveal">
      <h3>Measurement projects \\(|+\\rangle\\) to \\(|0\\rangle\\) or \\(|1\\rangle\\).</h3>
      <div class="num">05 · Measurement</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:2.5rem;align-items:start">
      <div class="home-reveal">
        <p style="font-size:0.95rem;color:var(--ink-dim);line-height:1.75;margin-bottom:0.9rem">
          Measuring \\(|+\\rangle\\) gives either \\(0\\) or \\(1\\), each with 50% chance.
        </p>
        <p style="font-size:0.95rem;color:var(--ink-dim);line-height:1.75;margin-bottom:0.9rem">
          Each shot is random, but the long-run average converges to 50/50.
        </p>
        <a href="#" class="home-continue" onclick="switchTab('learn');switchSubtab('t1');return false;">
          <span class="home-continue-tag">Tutorial 1</span>
          <span>Measurement foundations</span>
          <span class="home-continue-arrow">→</span>
        </a>
        <div style="margin-top:1.15rem;display:flex;gap:0.6rem;flex-wrap:wrap">
          <button class="btn primary" id="home-flip-btn">Measure one qubit</button>
          <button class="btn" id="home-flip-10-btn">Measure × 10</button>
          <button class="btn" id="home-flip-reset-btn">Clear</button>
        </div>
        <div class="home-coin-stats" id="home-coin-stats"></div>
      </div>
      <div class="home-reveal">
        <div class="home-panel" style="margin-bottom:1rem">
          <div class="home-panel-label">Bloch sphere view (starts at \\(|+\\rangle\\))</div>
          <canvas id="home-measure-bloch-canvas" width="200" height="200" aria-label="Bloch sphere showing plus state and collapsed measurement state"></canvas>
          <div class="home-state-text" id="home-measure-bloch-state">\\(|\\psi\\rangle = |+\\rangle\\)</div>
        </div>
        <div class="home-panel-label" style="margin-bottom:0.5rem">Results — each circle is one shot</div>
        <div class="home-coin-row" id="home-coin-row"></div>
        <div style="display:flex;gap:1rem;margin-top:0.5rem">
          <span style="font-family:var(--mono);font-size:10px;color:var(--phos)">■ \\(|1\\rangle\\)</span>
          <span style="font-family:var(--mono);font-size:10px;color:var(--magenta)">■ \\(|0\\rangle\\)</span>
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
  <div class="home-section-full">
    <div class="analysis-head home-reveal">
      <h3>Two qubits, one shared fate.</h3>
      <div class="num">06 · Entanglement</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:2.5rem;align-items:start">
      <div class="home-reveal">
        <p style="font-size:0.95rem;color:var(--ink-dim);line-height:1.75;margin-bottom:0.9rem">
          Bell tests compare correlations between distant measurements. Classical hidden-variable models have a hard limit.
        </p>
        <p style="font-size:0.95rem;color:var(--ink-dim);line-height:1.75;margin-bottom:0.9rem">
          Bell states can exceed that limit, showing behavior classical rules cannot explain.
        </p>
        <p style="font-size:0.95rem;color:var(--ink-dim);line-height:1.75;margin-bottom:0.9rem">
          Here you first see the Bell-pair signature, then jump to labs for full Bell/CHSH experiments.
        </p>
        <div class="home-bell-formula-box" id="home-bell-formula-box">
          <div class="home-bell-formula-label">Bell state (maximally entangled)</div>
          <div class="home-bell-formula-katex">\\(|\\Phi^+\\rangle = \\dfrac{|00\\rangle + |11\\rangle}{\\sqrt{2}}\\)</div>
        </div>
        <a href="#" class="home-continue" onclick="switchTab('labs');return false;">
          <span class="home-continue-tag">Lab</span>
          <span>Recreate the bell tests</span>
          <span class="home-continue-arrow">→</span>
        </a>
      </div>
      <div class="home-panel home-reveal">
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

  <div class="home-mini-quote home-reveal">"The result of an observation may reasonably depend not only on the state of the system but also on the complete disposition of the apparatus." <b>— John S. Bell</b></div>

  <!-- ══ 07: APPLICATIONS (hover-reveal icon cards) ═════════════════════════ -->
  <section class="home-apps-section">
    <div class="analysis-head home-reveal">
      <h3>What all this can actually do.</h3>
      <div class="num">07 · Applications</div>
    </div>
    <div class="home-apps-intro home-reveal">
      <p>These ideas are practical tools, not just theory. Hover a card to see where each one shows up.</p>
    </div>
    <div class="home-apps-grid">
      <article class="home-app-card home-reveal" aria-label="Application: Grover search">
        <div class="home-app-head">
          <div class="home-app-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M5 5h14v14H5z"/><path d="M9 9h6v6H9z"/><path d="M12 3v4M21 12h-4M12 21v-4M3 12h4"/></svg>
          </div>
          <div class="home-app-title">Cryptography</div>
        </div>
        <div class="home-app-reveal">
          <p>Grover speeds up brute-force search, which is why post-quantum cryptography matters.</p>
          <a href="#" class="home-app-open" onclick="switchTab('learn');switchSubtab('t7');return false;">Open Tutorial 7 →</a>
        </div>
        <span class="home-app-hint">hover ↑</span>
      </article>

      <article class="home-app-card home-reveal" aria-label="Application: VQE chemistry">
        <div class="home-app-head">
          <div class="home-app-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><circle cx="7" cy="9" r="2.2"/><circle cx="17" cy="9" r="2.2"/><circle cx="12" cy="17" r="2.2"/><path d="M8.8 10.3L11 15.2M15.2 10.3L13 15.2M9 9h6"/></svg>
          </div>
          <div class="home-app-title">Chemistry</div>
        </div>
        <div class="home-app-reveal">
          <p>VQE uses tunable circuits to estimate molecular energies.</p>
          <a href="#" class="home-app-open" onclick="switchTab('learn');switchSubtab('t6');return false;">Open Tutorial 6 →</a>
        </div>
        <span class="home-app-hint">hover ↑</span>
      </article>

      <article class="home-app-card home-reveal" aria-label="Application: QAOA optimization">
        <div class="home-app-head">
          <div class="home-app-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M3 20h18"/><path d="M5 20V9M10 20V6M15 20V12M20 20V4"/></svg>
          </div>
          <div class="home-app-title">Optimization</div>
        </div>
        <div class="home-app-reveal">
          <p>QAOA alternates two simple steps to bias outcomes toward better solutions.</p>
          <a href="#" class="home-app-open" onclick="switchTab('templates');return false;">Open QAOA template →</a>
        </div>
        <span class="home-app-hint">hover ↑</span>
      </article>

      <article class="home-app-card home-reveal" aria-label="Application: VQE ansatz in machine learning">
        <div class="home-app-head">
          <div class="home-app-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><circle cx="5" cy="7" r="1.7"/><circle cx="5" cy="17" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="7" r="1.7"/><circle cx="19" cy="17" r="1.7"/><path d="M6.5 7.7l4 3.6M6.5 16.3l4-3.6M13.5 11.3l4-3.6M13.5 12.7l4 3.6"/></svg>
          </div>
          <div class="home-app-title">Machine learning</div>
        </div>
        <div class="home-app-reveal">
          <p>The same tunable circuits can also be used as trainable quantum ML models.</p>
          <a href="#" class="home-app-open" onclick="switchTab('learn');switchSubtab('t6');return false;">Open ansatz tutorial →</a>
        </div>
        <span class="home-app-hint">hover ↑</span>
      </article>

      <article class="home-app-card home-reveal" aria-label="Application: GHZ sensing template">
        <div class="home-app-head">
          <div class="home-app-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/><path d="M12 12l5-3" stroke-linecap="round"/></svg>
          </div>
          <div class="home-app-title">Sensing</div>
        </div>
        <div class="home-app-reveal">
          <p>Entangled GHZ states can improve phase sensitivity in sensing tasks.</p>
          <a href="#" class="home-app-open" onclick="switchTab('templates');return false;">Open GHZ template →</a>
        </div>
        <span class="home-app-hint">hover ↑</span>
      </article>

      <article class="home-app-card home-reveal" aria-label="Application: Teleportation lab">
        <div class="home-app-head">
          <div class="home-app-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/><circle cx="12" cy="12" r="2"/><path d="M7.4 7.4l3.2 3.2M16.6 7.4l-3.2 3.2M7.4 16.6l3.2-3.2M16.6 16.6l-3.2-3.2"/></svg>
          </div>
          <div class="home-app-title">Networks</div>
        </div>
        <div class="home-app-reveal">
          <p>Teleportation-style protocols move quantum states across network links.</p>
          <a href="#" class="home-app-open" onclick="switchTab('labs');return false;">Open teleportation lab →</a>
        </div>
        <span class="home-app-hint">hover ↑</span>
      </article>
    </div>
  </section>

  <!-- ══ WHAT'S NEXT ════════════════════════════════════════════════════════ -->
  <div class="home-pullquote home-reveal" style="margin-top:0">
    You have now seen the core ingredients: bits vs qubits, superposition, measurement, gate dynamics, and entanglement. The sections below extend each thread into deeper, fully interactive study.
  </div>

  <section class="analysis-section home-learn-wrap" id="what-you-learn">
    <div class="analysis-head home-reveal">
      <h3>Where to go next</h3>
      <div class="num">Next steps</div>
    </div>
    <p class="home-learn-sub home-reveal">Each card maps to a major part of the platform.</p>
    <div class="home-learn-grid">
      <button type="button" class="home-learn-card home-reveal" onclick="switchTab('lab')">
        <div class="tag">02 · Explore</div>
        <h3>Build and run circuits</h3>
        <p>Build circuits, add noise, and compare probability, amplitude, and density views.</p>
        <div class="go">Go to Explore →</div>
      </button>
      <button type="button" class="home-learn-card home-reveal" onclick="switchTab('learn');switchSubtab('t1');">
        <div class="tag">03 · Tutorials</div>
        <h3>Step-by-step interactives</h3>
        <p>Nine guided modules from basics to algorithms, noise, and hardware behavior.</p>
        <div class="go">Go to Tutorials →</div>
      </button>
      <button type="button" class="home-learn-card home-reveal" onclick="switchTab('templates')">
        <div class="tag">04 · Template library</div>
        <h3>Ready-made circuits</h3>
        <p>Open ready-made circuits and tweak them in the playground.</p>
        <div class="go">Open templates →</div>
      </button>
      <button type="button" class="home-learn-card home-reveal" onclick="switchTab('labs')">
        <div class="tag">05 · Labs</div>
        <h3>Open-ended investigations</h3>
        <p>Longer interactive investigations: Bell tests, BB84, surface-code decoding, and teleportation.</p>
        <div class="go">Browse labs →</div>
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

    /* scroll-reactive wave-function SVG paths */
    var svg   = document.getElementById('home-hero-waves');
    var path0 = document.getElementById('wf-wave-0');
    var path1 = document.getElementById('wf-wave-1');
    var pathE = document.getElementById('wf-envelope');
    var scrollPhase = 0;

    function queueScrollUpdate() {
      var hero = canvas.parentElement;
      if (!hero) return;
      var r = hero.getBoundingClientRect();
      var vh = window.innerHeight || 800;
      // range from 0 (hero fully in view at top) to ~1 as it scrolls up
      var u = (-r.top) / Math.max(1, r.height * 0.85);
      scrollPhase = Math.max(-0.2, Math.min(1.4, u));
    }
    window.addEventListener('scroll', queueScrollUpdate, { passive: true });
    queueScrollUpdate();

    function resize() {
      const wrap = canvas.parentElement;
      W = canvas.width  = wrap ? wrap.offsetWidth  : window.innerWidth;
      H = canvas.height = wrap ? wrap.offsetHeight : 340;
      if (svg) {
        svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
        svg.setAttribute('width', W);
        svg.setAttribute('height', H);
      }
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

    /* Build an SVG path string for a travelling wave packet. */
    function buildWave(cy, amp, freq, phase, envWidth) {
      var steps = 96;
      var d = '';
      var cx = W * 0.52;
      for (var i = 0; i <= steps; i++) {
        var x = (i / steps) * W;
        var env = Math.exp(-Math.pow((x - cx) / envWidth, 2));
        var y = cy + amp * env * Math.sin(freq * (x / W) * Math.PI * 2 + phase);
        d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
      }
      return d;
    }
    function buildEnvelope(cy, amp, envWidth) {
      var steps = 96;
      var top = '', bot = '';
      var cx = W * 0.52;
      for (var i = 0; i <= steps; i++) {
        var x = (i / steps) * W;
        var env = Math.exp(-Math.pow((x - cx) / envWidth, 2));
        top += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + (cy - amp * env).toFixed(1) + ' ';
        bot += 'L' + (W - x).toFixed(1) + ' ' + (cy + amp * Math.exp(-Math.pow(((W - x) - cx) / envWidth, 2))).toFixed(1) + ' ';
      }
      return top + bot;
    }

    var t = 0;
    function draw() {
      ctx.clearRect(0, 0, W, H);
      t += 0.016;
      particles.forEach(function (p) {
        p.x = (p.x + p.vx + W) % W;
        p.y = (p.y + p.vy + H) % H;
        var alpha = 0.22 + 0.32 * Math.sin(t * p.speed * 60 + p.phase);
        var col = (p.phase < 1.0) ? rgbaVar('--phos-rgb', alpha, '127,255,196')
                : (p.phase < 2.1) ? rgbaVar('--cyan-rgb', alpha, '111,212,224')
                :                   rgbaVar('--magenta-rgb', alpha, '230,127,184');
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
      });

      /* Update wave-function SVG paths. Scroll shifts phase & spreads envelope
         (wave-packet delocalisation as you move down the page). */
      if (path0 && path1 && pathE) {
        var centerY = H * 0.58;
        var baseAmp = Math.min(42, H * 0.09);
        var scrollAmp = baseAmp * (1 - Math.min(1, scrollPhase * 0.6));
        var env = Math.max(140, W * 0.28 * (1 + scrollPhase * 1.4));
        var freq = 5.2 - scrollPhase * 2.2;
        var phaseA = t * 1.3 - scrollPhase * 3.4;
        var phaseB = t * 1.1 + Math.PI / 2 + scrollPhase * 2.2;
        path0.setAttribute('d', buildWave(centerY, scrollAmp,       freq, phaseA, env));
        path1.setAttribute('d', buildWave(centerY, scrollAmp * 0.7, freq * 1.4, phaseB, env * 0.85));
        pathE.setAttribute('d', buildEnvelope(centerY, scrollAmp * 1.05, env));
      }

      requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('resize', queueScrollUpdate);
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

  /* ─── Classical lamp vs quantum “dimmer” (interlude) ─────────────────────── */
  function wireHomeLampBridge() {
    var toggle = document.getElementById('home-lamp-class-toggle');
    var bulb = document.getElementById('home-lamp-class-bulb');
    var slider = document.getElementById('home-lamp-q-slider');
    var qBulb = document.getElementById('home-lamp-q-bulb');
    if (!toggle || !slider || !qBulb) return;

    function syncClassical() {
      var on = toggle.getAttribute('aria-pressed') === 'true';
      toggle.classList.toggle('on', on);
      if (bulb) bulb.classList.toggle('on', on);
    }

    toggle.addEventListener('click', function () {
      var on = toggle.getAttribute('aria-pressed') !== 'true';
      toggle.setAttribute('aria-pressed', on ? 'true' : 'false');
      syncClassical();
    });

    function syncQuantum() {
      var raw = parseInt(slider.value, 10);
      if (isNaN(raw)) raw = 0;
      raw = Math.max(0, Math.min(100, raw));
      slider.setAttribute('aria-valuenow', String(raw));
      qBulb.style.setProperty('--q-glow', String(raw / 100));
    }

    slider.addEventListener('input', syncQuantum);
    syncQuantum();
    syncClassical();
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

      // sphere fill + rim — explicit bright colors so the sphere reads on near-black UI
      var bg = ctx.createRadialGradient(CX - R * 0.22, CY - R * 0.3, R * 0.1, CX, CY, R * 1.08);
      bg.addColorStop(0, rgbaVar('--cyan-rgb', 0.38, '111,212,224'));
      bg.addColorStop(0.45, rgbaVar('--cyan-rgb', 0.16, '111,212,224'));
      bg.addColorStop(0.78, rgbaVar('--line-bright-rgb', 0.12, '54,80,68'));
      bg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2); ctx.fill();

      ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2);
      ctx.strokeStyle = rgbaVar('--cyan-rgb', 0.95, '111,212,224');
      ctx.lineWidth = 2;
      ctx.globalAlpha = 1;
      ctx.stroke();
      ctx.beginPath(); ctx.arc(CX, CY, R - 1.3, 0, Math.PI * 2);
      ctx.strokeStyle = rgbaVar('--cyan-rgb', 0.35, '111,212,224');
      ctx.lineWidth = 1;
      ctx.stroke();

      // equator
      ctx.beginPath(); ctx.setLineDash([3, 4]);
      for (var i = 0; i <= 64; i++) {
        var a = (i / 64) * Math.PI * 2;
        var p = proj(Math.cos(a), Math.sin(a), 0);
        i === 0 ? ctx.moveTo(p.sx, p.sy) : ctx.lineTo(p.sx, p.sy);
      }
      ctx.strokeStyle = rgbaVar('--cyan-rgb', 0.72, '111,212,224');
      ctx.lineWidth = 1.15;
      ctx.globalAlpha = 1;
      ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 1;

      // meridian
      ctx.beginPath();
      for (var j = 0; j <= 64; j++) {
        var b = (j / 64) * Math.PI * 2;
        var q = proj(Math.cos(b), 0, Math.sin(b));
        j === 0 ? ctx.moveTo(q.sx, q.sy) : ctx.lineTo(q.sx, q.sy);
      }
      ctx.strokeStyle = rgbaVar('--magenta-rgb', 0.68, '230,127,184');
      ctx.lineWidth = 1.05;
      ctx.globalAlpha = 1;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // x / y reference axes (drawn under the state vector)
      var axes = [
        { d:[0,0, 0.95], lbl:'|0⟩', col:rgbaVar('--cyan-rgb', 1, '111,212,224'), line:rgbaVar('--cyan-rgb', 0.98, '111,212,224'), pole: true },
        { d:[0,0,-0.88], lbl:'|1⟩', col:rgbaVar('--phos-rgb', 1, '127,255,196'), line:rgbaVar('--phos-rgb', 0.95, '127,255,196'), pole: true },
        { d:[0.9,0,0], lbl:'x', col:rgbaVar('--magenta-rgb', 0.95, '230,127,184'), line:rgbaVar('--magenta-rgb', 0.88, '230,127,184'), pole: false },
        { d:[0,0.9,0], lbl:'y', col:rgbaVar('--amber-rgb', 0.95, '255,184,101'), line:rgbaVar('--amber-rgb', 0.88, '255,184,101'), pole: false },
      ];
      axes.filter(function (ax) { return !ax.pole; }).forEach(function (ax) {
        var o = proj(0,0,0), e = proj(ax.d[0],ax.d[1],ax.d[2]);
        ctx.beginPath(); ctx.moveTo(o.sx,o.sy); ctx.lineTo(e.sx,e.sy);
        ctx.strokeStyle = ax.line; ctx.lineWidth = 1.25;
        ctx.globalAlpha = 0.88;
        ctx.stroke();
        ctx.font = '11px var(--mono)'; ctx.fillStyle = ax.col;
        ctx.globalAlpha = 0.95;
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
      grd.addColorStop(0, rgbaVar('--phos-rgb', 0.55, '127,255,196'));
      grd.addColorStop(1, rgbaVar('--phos-rgb', 0, '127,255,196'));
      ctx.fillStyle = grd; ctx.beginPath();
      ctx.arc(tp.sx,tp.sy,15,0,Math.PI*2); ctx.fill();

      // shaft
      ctx.beginPath(); ctx.moveTo(o.sx,o.sy); ctx.lineTo(tp.sx,tp.sy);
      ctx.strokeStyle = rgbaVar('--phos-rgb', 0.95, '127,255,196');
      ctx.lineWidth = 2.35;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 1;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // arrowhead
      var dx = tp.sx-o.sx, dy = tp.sy-o.sy, len = Math.sqrt(dx*dx+dy*dy)||1;
      var ux = dx/len, uy = dy/len;
      ctx.beginPath();
      ctx.moveTo(tp.sx,tp.sy);
      ctx.lineTo(tp.sx-ux*9+(-uy)*4.5, tp.sy-uy*9+ux*4.5);
      ctx.lineTo(tp.sx-ux*9-(-uy)*4.5, tp.sy-uy*9-ux*4.5);
      ctx.closePath();
      ctx.fillStyle = rgbaVar('--phos-rgb', 0.98, '127,255,196');
      ctx.fill();

      // tip dot
      ctx.beginPath(); ctx.arc(tp.sx,tp.sy,4,0,Math.PI*2);
      ctx.fillStyle = rgbaVar('--ink-rgb', 0.98, '212,228,219');
      ctx.fill();

      // |0⟩, |1⟩ poles on top of glow + state arrow
      axes.filter(function (ax) { return ax.pole; }).forEach(function (ax) {
        var o = proj(0,0,0), e = proj(ax.d[0],ax.d[1],ax.d[2]);
        ctx.beginPath(); ctx.moveTo(o.sx,o.sy); ctx.lineTo(e.sx,e.sy);
        ctx.strokeStyle = ax.line;
        ctx.lineWidth = 2.4;
        ctx.globalAlpha = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(e.sx, e.sy, 6, 0, Math.PI * 2);
        ctx.fillStyle = ax.col;
        ctx.globalAlpha = 1;
        ctx.fill();
        ctx.strokeStyle = 'rgba(30, 70, 75, 0.55)';
        ctx.lineWidth = 1.25;
        ctx.stroke();

        var lx = e.sx + 6, ly = e.sy + 5;
        ctx.font = 'bold 12px var(--mono)';
        ctx.textBaseline = 'alphabetic';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(18, 42, 46, 0.55)';
        ctx.strokeText(ax.lbl, lx, ly);
        ctx.fillStyle = ax.col;
        ctx.fillText(ax.lbl, lx, ly);
        ctx.globalAlpha = 1;
      });
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
        setTimeout(function () {
          if (stateEl) stateEl.textContent = stateLabel(th, ph);
          if (typeof global.scheduleMathRender === 'function') global.scheduleMathRender(stateEl || document.body);
        }, 450);
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
      if      (g==='X') rotX(PI);
      else if (g==='Y') rotY(PI);
      else if (g==='H'){rotY(PI/2);rotX(PI);}
      return [Math.acos(Math.max(-1,Math.min(1,z))), Math.atan2(y,x)];
    }

    function onGateActivate(btn) {
      var g = btn.dataset.gate;
      if (g==='RESET') {
        state=[0,0]; history=[];
        sphere.animateTo(0,0);
        if (histEl) histEl.innerHTML='No gates applied yet';
        if (stateEl) stateEl.textContent='State: |0⟩';
        if (typeof global.scheduleMathRender === 'function') global.scheduleMathRender(stateEl || document.body);
        return;
      }
      state = applyGate(g, state[0], state[1]);
      history.push(g);
      sphere.animateTo(state[0], state[1]);
      if (histEl) histEl.innerHTML = history.map(function(gg){return '<span class="gh-gate">'+gg+'</span>';}).join(' → ');
      if (stateEl) stateEl.textContent = stateLabel(state[0], state[1]);
      if (typeof global.scheduleMathRender === 'function') global.scheduleMathRender(stateEl || document.body);
    }

    document.querySelectorAll('.home-gate-card[data-gate]').forEach(function (btn) {
      btn.addEventListener('click', function () { onGateActivate(btn); });
      btn.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onGateActivate(btn); }
      });
    });
  }

  /* ─── Electron spin superposition demo — 3D Bloch-style ───────────────── */
  function initSpinDemo() {
    var canvas = document.getElementById('home-spin3d-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var W = canvas.width, H = canvas.height;
    var CX = W / 2, CY = H / 2;
    var ORB_R = W * 0.26;

    var state = 'plus';
    var spinAngle = 0;          // 0 = right, -PI/2 = up, PI/2 = down
    var targetAngle = spinAngle;
    var precessing = true;
    var pulse = 0;

    function drawHead(px, py, ux, uy, col) {
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px - ux * 11 + (-uy) * 5, py - uy * 11 + ux * 5);
      ctx.lineTo(px - ux * 11 - (-uy) * 5, py - uy * 11 - ux * 5);
      ctx.closePath();
      ctx.fillStyle = col;
      ctx.fill();
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      var orb = ctx.createRadialGradient(CX - ORB_R * 0.3, CY - ORB_R * 0.35, ORB_R * 0.12, CX, CY, ORB_R * 1.2);
      orb.addColorStop(0, rgbaVar('--cyan-rgb', 0.58, '111,212,224'));
      orb.addColorStop(0.42, rgbaVar('--cyan-rgb', 0.26, '111,212,224'));
      orb.addColorStop(0.85, rgbaVar('--line-bright-rgb', 0.24, '54,80,68'));
      orb.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = orb;
      ctx.beginPath(); ctx.arc(CX, CY, ORB_R, 0, Math.PI * 2); ctx.fill();

      ctx.beginPath(); ctx.arc(CX, CY, ORB_R, 0, Math.PI * 2);
      ctx.strokeStyle = rgbaVar('--cyan-rgb', 0.95, '111,212,224');
      ctx.lineWidth = 2;
      ctx.stroke();

      if (state === 'plus') {
        ctx.beginPath();
        ctx.arc(CX, CY, ORB_R + 7 + 2.8 * Math.sin(performance.now() * 0.004), 0, Math.PI * 2);
        ctx.strokeStyle = rgbaVar('--phos-rgb', 0.22, '127,255,196');
        ctx.lineWidth = 1.1;
        ctx.stroke();
      }

      var len = ORB_R * 1.08;
      var ux = Math.cos(spinAngle);
      var uy = Math.sin(spinAngle);
      var tip = { x: CX + ux * len, y: CY + uy * len };
      var tail = { x: CX - ux * len, y: CY - uy * len };
      var shaftCol = (state === '1') ? rgbaVar('--magenta-rgb', 0.96, '230,127,184') : rgbaVar('--phos-rgb', 0.96, '127,255,196');

      ctx.beginPath();
      ctx.moveTo(tail.x, tail.y);
      ctx.lineTo(tip.x, tip.y);
      ctx.strokeStyle = shaftCol;
      ctx.lineWidth = 3.2;
      ctx.lineCap = 'round';
      ctx.stroke();

      var dx = tip.x - tail.x, dy = tip.y - tail.y;
      var vlen = Math.sqrt(dx * dx + dy * dy) || 1;
      var vx = dx / vlen, vy = dy / vlen;
      drawHead(tip.x, tip.y, vx, vy, shaftCol);
      drawHead(tail.x, tail.y, -vx, -vy, shaftCol);

      ctx.beginPath();
      ctx.arc(CX, CY, 4 + pulse * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = rgbaVar('--ink-rgb', 0.94, '212,228,219');
      ctx.fill();
      if (pulse > 0) pulse = Math.max(0, pulse - 0.05);
    }

    function frame() {
      if (precessing && state === 'plus') {
        spinAngle += 0.028;
      } else {
        spinAngle += (targetAngle - spinAngle) * 0.17;
      }
      draw();
      requestAnimationFrame(frame);
    }

    var stateEl = document.getElementById('home-spin-state');
    function setStateText(text, settled) {
      if (!stateEl) return;
      stateEl.textContent = text;
      stateEl.classList.toggle('settled', !!settled);
      if (typeof global.scheduleMathRender === 'function') global.scheduleMathRender(stateEl);
    }

    document.getElementById('home-spin-super-btn').addEventListener('click', function () {
      state = 'plus';
      precessing = true;
      targetAngle = spinAngle;
      setStateText('\\(|\\psi\\rangle = |+\\rangle = (|0\\rangle + |1\\rangle)/\\sqrt{2}\\)', false);
    });
    document.getElementById('home-spin-measure-btn').addEventListener('click', function () {
      var up = Math.random() > 0.5;
      precessing = false;
      state = up ? '0' : '1';
      targetAngle = up ? (-Math.PI / 2) : (Math.PI / 2);
      pulse = 1;
      setStateText(
        up ? '\\(|\\psi\\rangle \\to |0\\rangle\\) (spin up)' : '\\(|\\psi\\rangle \\to |1\\rangle\\) (spin down)',
        true
      );
    });

    frame();
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
      if (measureStateEl) measureStateEl.textContent = '\\(|\\psi\\rangle = |+\\rangle\\)';
      if (typeof global.scheduleMathRender === 'function') global.scheduleMathRender(document.getElementById('home-measure-bloch-state') || document.body);
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

    document.getElementById('home-flip-btn').addEventListener('click',function(){ var r=Math.random()>0.5?'1':'0'; addCoin(r); if(measureSphere){ if(r==='1'){measureSphere.animateTo(Math.PI,0); if(measureStateEl) measureStateEl.textContent='\\(|\\psi\\rangle \\to |1\\rangle\\)';} else {measureSphere.animateTo(0,0); if(measureStateEl) measureStateEl.textContent='\\(|\\psi\\rangle \\to |0\\rangle\\)';}} if (typeof global.scheduleMathRender === 'function') global.scheduleMathRender(measureStateEl || document.body); });
    document.getElementById('home-flip-10-btn').addEventListener('click',function(){ var r='0'; for(var i=0;i<10;i++){ r=Math.random()>0.5?'1':'0'; addCoin(r);} if(measureSphere){ if(r==='1'){measureSphere.animateTo(Math.PI,0); if(measureStateEl) measureStateEl.textContent='\\(|\\psi\\rangle \\to |1\\rangle\\)';} else {measureSphere.animateTo(0,0); if(measureStateEl) measureStateEl.textContent='\\(|\\psi\\rangle \\to |0\\rangle\\)';}} if (typeof global.scheduleMathRender === 'function') global.scheduleMathRender(measureStateEl || document.body); });
    document.getElementById('home-flip-reset-btn').addEventListener('click',function(){
      row.innerHTML=''; counts={'0':0,'1':0};
      if(stats) stats.textContent='';
      if(measureSphere){measureSphere.animateTo(Math.PI/2,0); if(measureStateEl) measureStateEl.textContent='\\(|\\psi\\rangle = |+\\rangle\\)';}
      if (typeof global.scheduleMathRender === 'function') global.scheduleMathRender(measureStateEl || document.body);
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

  /* ─── Applications cards (tap-to-reveal on touch) ─────────────────────── */
  function wireAppsCards() {
    document.querySelectorAll('.home-app-card').forEach(function (card) {
      if (!card.hasAttribute('tabindex')) card.setAttribute('tabindex', '0');
      card.addEventListener('click', function () {
        card.classList.toggle('show-details');
      });
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.classList.toggle('show-details');
        }
      });
    });
  }

  /* ─── Floating background arrows across page ───────────────────────────── */
  function initFloatingArrows() {
    var root = document.getElementById('home-floating-arrows');
    if (!root) return;

    function spawn() {
      root.innerHTML = '';
      var w = Math.max(900, window.innerWidth || 1200);
      var h = Math.max(700, window.innerHeight || 900);
      var count = Math.max(26, Math.floor((w * h) / 52000));
      var palettes = ['', 'cyan', 'magenta', 'amber'];
      for (var i = 0; i < count; i++) {
        var el = document.createElement('span');
        var col = palettes[(i + Math.floor(Math.random() * 4)) % 4];
        el.className = 'home-floating-arrow' + (col ? (' ' + col) : '');
        if (Math.random() > 0.52) el.classList.add('down');
        el.textContent = '↑';
        var x = Math.random() * 98;
        var y = Math.random() * 98;
        var rot = (Math.random() * 20 - 10).toFixed(1) + 'deg';
        var delay = (-Math.random() * 8).toFixed(2) + 's';
        var dur = (6.2 + Math.random() * 4.6).toFixed(2) + 's';
        var size = (14 + Math.random() * 12).toFixed(1) + 'px';
        el.style.left = x + '%';
        el.style.top = y + '%';
        el.style.setProperty('--rot', rot);
        el.style.animationDelay = delay;
        el.style.animationDuration = dur;
        el.style.fontSize = size;
        root.appendChild(el);
      }
    }

    spawn();
    window.addEventListener('resize', spawn, { passive: true });
  }

  /* ─── Schrödinger's cat — open the box ──────────────────────────────── */
  function wireSchrodingerCat() {
    var stage = document.getElementById('home-cat-stage');
    var label = document.getElementById('home-cat-state-label');
    var openBtn = document.getElementById('home-cat-open-btn');
    var resetBtn = document.getElementById('home-cat-reset-btn');
    if (!stage || !openBtn || !resetBtn) return;

    function reset() {
      stage.classList.remove('open', 'resolved-alive', 'resolved-dead');
      stage.classList.add('superposition');
      if (label) {
        label.textContent = '\\(|\\text{cat}\\rangle = (|\\text{alive}\\rangle + |\\text{not}\\rangle)/\\sqrt{2}\\)';
        if (typeof global.scheduleMathRender === 'function') global.scheduleMathRender(label);
      }
    }

    function open() {
      var alive = Math.random() > 0.5;
      stage.classList.remove('superposition');
      stage.classList.add('open');
      stage.classList.add(alive ? 'resolved-alive' : 'resolved-dead');
      if (label) {
        label.textContent = alive
          ? '\\(|\\text{cat}\\rangle \\to |\\text{alive}\\rangle\\) — ok, phew.'
          : '\\(|\\text{cat}\\rangle \\to |\\text{not}\\rangle\\) — oh.';
        if (typeof global.scheduleMathRender === 'function') global.scheduleMathRender(label);
      }
    }

    openBtn.addEventListener('click', open);
    resetBtn.addEventListener('click', reset);
    reset();
  }


  function initScrollReveal() {
    if (!window.IntersectionObserver) return;
    document.querySelectorAll('.home-reveal').forEach(function (el) {
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { el.classList.add('visible'); obs.unobserve(el); }
        });
      }, { threshold: [0, 0.06, 0.12], rootMargin: '0px 0px -5% 0px' });
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
      initFloatingArrows();
      wireClassicalBit();
      wireHomeLampBridge();
      wireBlochSphere();
      wireGateBloch();
      initSpinDemo();
      initCoinFlip();
      initBell();
      wireAppsCards();
      wireSchrodingerCat();
      initScrollReveal();
      if (typeof global.scheduleMathRender === 'function') global.scheduleMathRender(root);
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