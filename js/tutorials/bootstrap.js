/* =========================================================================
   TIMELINE v2 — horizontal interactive
   ========================================================================= */
(function () {
  var dataEl = document.getElementById('tl2-data');
  var trackOuter = document.getElementById('tl2-track-outer');
  var trackWrap = document.getElementById('tl2-track-wrap');
  var detailEl = document.getElementById('tl2-detail');
  var progressEl = document.getElementById('tl2-progress');
  if (!dataEl || !trackWrap || !detailEl) return;

  /* ---- Collect data from hidden tl-entry elements ---- */
  var entries = Array.from(dataEl.querySelectorAll('.tl-entry'));
  if (!entries.length) return;

  var data = entries.map(function (entry) {
    var dotEl    = entry.querySelector('.tl-dot');
    var yearEl   = entry.querySelector('.tl-year');
    var titleEl  = entry.querySelector('.tl-title');
    var authorsEl = entry.querySelector('.tl-authors');
    var bodyEl   = entry.querySelector('.tl-body');
    var linkEl   = bodyEl ? bodyEl.querySelector('.tl-link') : null;

    /* Clone body and strip the link out so it lives in the footer instead */
    var bodyClone = bodyEl ? bodyEl.cloneNode(true) : null;
    var cloneLink = bodyClone ? bodyClone.querySelector('.tl-link') : null;
    if (cloneLink) cloneLink.remove();

    return {
      color:      dotEl    ? dotEl.style.background  : 'var(--mint)',
      year:       yearEl   ? yearEl.textContent.trim() : '',
      yearNum:    yearEl   ? parseInt(yearEl.textContent, 10) : 0,
      title:      titleEl  ? titleEl.textContent.trim() : '',
      authorsHTML: authorsEl ? authorsEl.innerHTML : '',
      bodyHTML:   bodyClone ? bodyClone.innerHTML : '',
      linkHref:   linkEl   ? linkEl.getAttribute('href') : '',
      linkText:   linkEl   ? linkEl.textContent.trim() : 'Read →',
    };
  });

  /* ---- Calculate proportional horizontal positions ---- */
  var YEAR_MIN = 1960, YEAR_MAX = 2025;
  var PAD_L = 7, PAD_R = 7;   /* percent padding at each edge */
  var PLOT_W = 100 - PAD_L - PAD_R;
  var MIN_GAP = 5.5;           /* minimum percent gap between adjacent nodes */

  function rawPct(year) {
    return PAD_L + (year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN) * PLOT_W;
  }

  var positions = data.map(function (d) { return rawPct(d.yearNum); });

  /* Enforce minimum spacing left-to-right */
  for (var i = 1; i < positions.length; i++) {
    if (positions[i] - positions[i - 1] < MIN_GAP) {
      positions[i] = positions[i - 1] + MIN_GAP;
    }
  }

  /* If nudging pushed the last node past the right pad boundary, shift all back */
  var overflow = positions[positions.length - 1] - (100 - PAD_R);
  if (overflow > 0) {
    for (var j = 0; j < positions.length; j++) {
      positions[j] -= overflow * (j + 1) / positions.length;
    }
  }

  /* Wide enough inner track that percent positions separate into distinct hit targets */
  function applyTrackMinWidth() {
    var n = data.length;
    var minNodePx = 54;
    var edgePx = 40;
    var minPx = Math.max(360, (n - 1) * minNodePx + 2 * edgePx);
    if (trackOuter && trackOuter.clientWidth) {
      minPx = Math.max(minPx, trackOuter.clientWidth);
    }
    trackWrap.style.minWidth = 'max(100%, ' + minPx + 'px)';
  }
  applyTrackMinWidth();
  window.addEventListener('resize', applyTrackMinWidth);

  /* Alternating sides: even = above axis, odd = below */
  var sides = data.map(function (_, i) { return i % 2 === 0 ? 'above' : 'below'; });

  /* ---- Build node buttons in the track ---- */
  data.forEach(function (d, i) {
    var node = document.createElement('button');
    node.className = 'tl2-node tl2-' + sides[i];
    node.style.left = positions[i].toFixed(1) + '%';
    node.style.zIndex = String(10 + i);
    node.style.setProperty('--nc', d.color);
    node.setAttribute('aria-label', d.year + ': ' + d.title);
    node.dataset.idx = String(i);

    var yearSpan = document.createElement('span');
    yearSpan.className = 'tl2-node-year';
    yearSpan.textContent = d.year;

    var stem = document.createElement('span');
    stem.className = 'tl2-node-stem';

    var dot = document.createElement('span');
    dot.className = 'tl2-node-dot';
    dot.style.background = d.color;

    if (sides[i] === 'above') {
      node.appendChild(yearSpan);
      node.appendChild(stem);
      node.appendChild(dot);
    } else {
      node.appendChild(dot);
      node.appendChild(stem);
      node.appendChild(yearSpan);
    }

    node.addEventListener('click', function () { selectEntry(i); });
    trackWrap.appendChild(node);
  });

  /* ---- Render detail panel ---- */
  var activeIdx = -1;

  function selectEntry(idx) {
    if (idx < 0 || idx >= data.length) return;
    activeIdx = idx;
    var d = data[idx];

    /* Update node active states */
    trackWrap.querySelectorAll('.tl2-node').forEach(function (n) {
      n.classList.toggle('tl2-active', parseInt(n.dataset.idx, 10) === idx);
    });

    /* Advance the progress fill to this node's position */
    if (progressEl) {
      progressEl.style.width = positions[idx].toFixed(1) + '%';
      progressEl.style.backgroundColor = d.color;
    }

    var activeNode = trackWrap.querySelector('.tl2-node[data-idx="' + idx + '"]');
    if (activeNode && trackOuter && typeof activeNode.scrollIntoView === 'function') {
      activeNode.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }

    /* Update the detail card border accent */
    detailEl.style.borderColor = '';
    void detailEl.offsetWidth; /* force reflow so transition fires */
    detailEl.style.borderColor = '';

    var prevDisabled = idx === 0 ? ' disabled' : '';
    var nextDisabled = idx === data.length - 1 ? ' disabled' : '';

    detailEl.innerHTML =
      '<div class="tl2-detail-header">' +
        '<div class="tl2-detail-year" style="color:' + d.color + '">' + d.year + '</div>' +
        '<div class="tl2-detail-title">' + escHtml(d.title) + '</div>' +
      '</div>' +
      '<div class="tl2-detail-authors">' + d.authorsHTML + '</div>' +
      '<div class="tl2-detail-body">' + d.bodyHTML + '</div>' +
      '<div class="tl2-detail-footer">' +
        '<div class="tl2-nav">' +
          '<button class="tl2-nav-btn" id="tl2-prev"' + prevDisabled + '>← prev</button>' +
          '<span class="tl2-nav-counter">' + (idx + 1) + ' / ' + data.length + '</span>' +
          '<button class="tl2-nav-btn" id="tl2-next"' + nextDisabled + '>next →</button>' +
        '</div>' +
        (d.linkHref
          ? '<a href="' + d.linkHref + '" target="_blank" rel="noopener" class="tl2-detail-link">' + escHtml(d.linkText) + '</a>'
          : '') +
      '</div>';

    var prevBtn = document.getElementById('tl2-prev');
    var nextBtn = document.getElementById('tl2-next');
    if (prevBtn) prevBtn.addEventListener('click', function () { selectEntry(activeIdx - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { selectEntry(activeIdx + 1); });
  }

  function escHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* Keyboard navigation when focus is inside the timeline */
  document.addEventListener('keydown', function (e) {
    var focused = document.activeElement;
    if (!trackWrap.contains(focused) && !detailEl.contains(focused)) return;
    if (e.key === 'ArrowLeft'  && activeIdx > 0)               { selectEntry(activeIdx - 1); e.preventDefault(); }
    if (e.key === 'ArrowRight' && activeIdx < data.length - 1) { selectEntry(activeIdx + 1); e.preventDefault(); }
  });

  /* Select the first entry on load */
  selectEntry(0);
})();


updateProgressPills();
