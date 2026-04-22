/* Site-wide LaTeX rendering (KaTeX auto-render). */
(function initLatexRendering() {
  let rafScheduled = false;
  let lateInitTries = 0;
  const MAX_LATE_INIT_TRIES = 40;

  function renderMath(root) {
    if (!window.renderMathInElement) return;
    try {
      window.renderMathInElement(root || document.body, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '\\[', right: '\\]', display: true },
          { left: '\\(', right: '\\)', display: false }
        ],
        throwOnError: false
      });
    } catch (_) {
      // Keep UI resilient if any malformed expression is present.
    }
  }

  function scheduleRender(root) {
    if (rafScheduled) return;
    rafScheduled = true;
    requestAnimationFrame(() => {
      rafScheduled = false;
      renderMath(root || document.body);
    });
  }

  window.scheduleMathRender = scheduleRender;

  function bootstrapWhenReady() {
    if (window.renderMathInElement) {
      scheduleRender(document.body);
      return;
    }
    if (lateInitTries >= MAX_LATE_INIT_TRIES) return;
    lateInitTries += 1;
    setTimeout(bootstrapWhenReady, 100);
  }

  window.addEventListener('load', () => {
    bootstrapWhenReady();

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'childList' && m.addedNodes && m.addedNodes.length > 0) {
          scheduleRender(document.body);
          return;
        }
        if (m.type === 'characterData') {
          scheduleRender(document.body);
          return;
        }
      }
    });

    observer.observe(document.body, { childList: true, characterData: true, subtree: true });
  });
})();
