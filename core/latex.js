/* Site-wide LaTeX rendering (KaTeX auto-render). */
(function initLatexRendering() {
  let rafScheduled = false;

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

  window.addEventListener('load', () => {
    scheduleRender(document.body);

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type !== 'childList') continue;
        if (m.addedNodes && m.addedNodes.length > 0) {
          scheduleRender(document.body);
          return;
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  });
})();
