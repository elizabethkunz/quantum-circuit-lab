/**
 * Home landing tab: markup, wiring, and a small API for future features.
 * Edit HOME_LANDING_HTML for copy/layout; add helpers below and call from initHomeLanding().
 */
(function (global) {
  'use strict';

  const HOME_LANDING_HTML = `
    <section class="home-hero">
      <h1>Curious about <em>quantum</em>,<br/>starting from zero?</h1>
      <p class="home-lede">You do not need a background in physics or computing to use this site. Think of this page as a friendly lobby: a few pictures in words, one tiny interactive toy, and then a map of what you can explore when you are ready.</p>
      <div class="home-hero-actions">
        <button type="button" class="btn primary" onclick="switchTab('learn');switchSubtab('t1');">Begin Tutorial 1 →</button>
        <button type="button" class="btn" onclick="switchTab('lab')">Open the playground</button>
      </div>
    </section>

    <section class="home-section">
      <h2>Everyday digital information is made of clear-cut choices</h2>
      <p>Phones, laptops, and the cloud store data as long runs of simple decisions. At the lowest level, each piece is in one of two states, like a coin lying heads-up or tails-up on a table, not hovering in the air.</p>
      <p>Engineers call those states <b>0</b> and <b>1</b>. The important part for now is not the labels, but the idea: before you read the memory, the machine has already committed to one side or the other.</p>
    </section>

    <div class="home-demo-wrap">
      <div class="home-demo-label">Try it · one ordinary switch</div>
      <p style="font-size:14px;color:var(--ink-dim);margin:0 0 16px;line-height:1.55">Tap the square. It flips between <code>0</code> and <code>1</code>. This is the same kind of on-or-off choice ordinary computers repeat billions of times per second.</p>
      <div class="classical-bit">
        <div class="bit-switch" id="home-bit-switch" role="button" tabindex="0" aria-label="Toggle between 0 and 1">
          <div class="bit-glow"></div>
          <div class="bit-value" id="home-bit-value">0</div>
        </div>
        <div class="bit-hint">Click to flip</div>
      </div>
    </div>

    <section class="home-section">
      <h2>Quantum systems add a new kind of 'in-between'</h2>
      <p>In the quantum rules that describe atoms and light, a smallest unit of information can be prepared in blends of <code>0</code> and <code>1</code> until you deliberately ask a question by measuring. The answer then snaps to something definite, often in a way that looks random on its own.</p>
      <p>What is strange and useful is that <em>patterns</em> still show up when you compare many answers, especially when two or more units are prepared together. Those patterns power technologies people are building today, such as certain kinds of secure communication and chemistry simulations.</p>
      <div class="home-aside">You will meet the same ideas again in Tutorial 1 with a bit more vocabulary, then go deeper in the tutorials that follow.</div>
    </section>

    <section class="home-section">
      <h2>What this laboratory lets you do</h2>
      <p>Nothing here runs on a remote supercomputer behind a paywall. Your browser carries out small simulations so you can build toy circuits, press run, and watch outcome tables, plain-language explanations, and (when you are ready) denser math views.</p>
      <p>You can stay entirely on guided paths, only use the playground, or mix both. Scroll is never locked on this page, and the rest of the app works the same way: each top tab is a long page you can move through freely.</p>
    </section>

    <div class="home-cta-band">
      <p>When you want structure, Tutorial 1 walks from this classical switch toward a quantum sphere picture, gates, measurement, and a first taste of shared randomness between two lines.</p>
      <div class="home-cta-btns">
        <button type="button" class="btn primary" onclick="switchTab('learn');switchSubtab('t1');">Open Tutorial 1</button>
        <button type="button" class="btn" onclick="switchTab('lab')">Explore circuits instead</button>
      </div>
    </div>

    <section class="home-learn" id="what-you-learn">
      <h2>What you'll learn here</h2>
      <p class="home-learn-sub">Each area below is one tab along the top of the app. Pick what matches your mood: guided lessons, free-form building, curated examples, deeper investigations, or reading.</p>
      <div class="home-learn-grid">
        <button type="button" class="home-learn-card" onclick="switchTab('lab')">
          <div class="tag">02 · Explore</div>
          <h3>Build and run circuits</h3>
          <p>Drag operations onto wires, adjust qubit count, add noise, and compare probability, amplitude, and density views with a short narrative of what the circuit did.</p>
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
          <p>Longer question-driven pages such as Bell tests, BB84, surface-code decoding games, and teleportation scenarios.</p>
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

  function wireHomeBitSwitch() {
    const sw = document.getElementById('home-bit-switch');
    const val = document.getElementById('home-bit-value');
    if (!sw || !val) return;
    function flip() {
      sw.classList.toggle('on');
      val.textContent = sw.classList.contains('on') ? '1' : '0';
    }
    sw.addEventListener('click', flip);
    sw.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        flip();
      }
    });
  }

  /**
   * Mount home inner HTML once (unless force is true).
   * @param {{ force?: boolean }} [opts]
   */
  function initHomeLanding(opts) {
    const force = opts && opts.force;
    const root = document.getElementById('view-home');
    if (!root) return;
    if (!force && root.dataset.homeMounted === '1') return;
    root.innerHTML = HOME_LANDING_HTML;
    root.dataset.homeMounted = '1';
    wireHomeBitSwitch();
    if (typeof global.onHomeLandingMounted === 'function') {
      try {
        global.onHomeLandingMounted(root);
      } catch (e) {
        console.warn('onHomeLandingMounted', e);
      }
    }
  }

  function remountHomeLanding() {
    const root = document.getElementById('view-home');
    if (!root) return;
    delete root.dataset.homeMounted;
    initHomeLanding({ force: true });
  }

  global.HomeLanding = {
    init: initHomeLanding,
    remount: remountHomeLanding,
    /** Expose template for tests or build-time replacement. */
    getTemplate: function () {
      return HOME_LANDING_HTML;
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initHomeLanding();
    });
  } else {
    initHomeLanding();
  }
})(typeof window !== 'undefined' ? window : this);
