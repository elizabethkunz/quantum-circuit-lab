/* =========================================================================
   T4 STEP 5: SURFACE CODE GRID + OVERHEAD CHART
   ========================================================================= */
(function initT4Step4() {
  // 3×3 surface code: 9 data qubits, 4 Z-stabilisers, 4 X-stabilisers (simplified)
  let errors = new Set(); // qubit indices 0-8
  let corrected = false, injected = false;

  const ns = 'http://www.w3.org/2000/svg';
  function mkEl(tag, attrs) {
    const e = document.createElementNS(ns, tag);
    for (const [k,v] of Object.entries(attrs)) e.setAttribute(k,v);
    return e;
  }

  function drawSurface() {
    const svg = document.getElementById('surface-code-svg');
    if (!svg) return;
    svg.innerHTML = '';
    const gap = 60, off = 30;
    // Draw stabiliser faces (Z=amber, X=cyan alternating)
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        const cx = off + c*gap + gap/2, cy = off + r*gap + gap/2;
        const isZ = (r+c)%2 === 0;
        // Check if any adjacent data qubit has error
        const adj = [r*3+c, r*3+c+1, (r+1)*3+c, (r+1)*3+c+1];
        const excited = adj.some(i => errors.has(i));
        const color = excited ? 'var(--red)' : (isZ ? 'rgba(224,133,208,0.18)' : 'rgba(111,212,224,0.18)');
        const strokeColor = excited ? 'var(--red)' : (isZ ? 'var(--amber)' : 'var(--cyan)');
        const rect = mkEl('rect', {x: off+c*gap+2, y: off+r*gap+2, width:gap-4, height:gap-4,
          fill: color, stroke: strokeColor, 'stroke-width': excited?2:1, rx:2});
        svg.appendChild(rect);
        if (excited) {
          const t = mkEl('text', {x:cx, y:cy+3, 'font-family':'var(--mono)', 'font-size':9,
            fill:'var(--red)', 'text-anchor':'middle', 'letter-spacing':'0.06em'});
          t.textContent = isZ?'Z⚠':'X⚠'; svg.appendChild(t);
        } else {
          const t = mkEl('text', {x:cx, y:cy+3, 'font-family':'var(--mono)', 'font-size':9,
            fill: isZ?'var(--amber)':'var(--cyan)', 'text-anchor':'middle'});
          t.textContent = isZ?'Z':'X'; svg.appendChild(t);
        }
      }
    }
    // Draw data qubits
    for (let q = 0; q < 9; q++) {
      const row = Math.floor(q/3), col = q%3;
      const qx = off + col*gap, qy = off + row*gap;
      const hasErr = errors.has(q);
      const g = mkEl('g', {class:'surface-qubit', transform:`translate(${qx},${qy})`});
      const circle = mkEl('circle', {cx:0, cy:0, r:10,
        fill: hasErr?'var(--red)':'var(--bg-0)',
        stroke: hasErr?'var(--red)':'var(--mint)',
        'stroke-width': hasErr?2:1.5});
      const label = mkEl('text', {x:0, y:4, 'font-family':'var(--mono)', 'font-size':9,
        fill: hasErr?'var(--ink)':'var(--mint)', 'text-anchor':'middle'});
      label.textContent = hasErr ? '✕' : q;
      g.appendChild(circle); g.appendChild(label);
      g.addEventListener('click', () => {
        if (errors.has(q)) errors.delete(q); else errors.add(q);
        corrected = false; updateStatus(); drawSurface();
        injected = true;
      });
      svg.appendChild(g);
    }
  }

  function renderSyndromeSidebar(hasErrors) {
    let aside = document.getElementById('t4-syndrome-aside');
    if (!aside) {
      aside = document.createElement('div');
      aside.id = 't4-syndrome-aside';
      aside.style.cssText = 'margin-top:12px;padding:10px 14px;background:var(--bg-0);' +
        'border-left:3px solid var(--mint);font-family:var(--serif);font-size:12px;' +
        'color:var(--ink-dim);line-height:1.65;border-radius:0 4px 4px 0;transition:opacity 0.3s;';
      const st = document.getElementById('surface-code-status');
      if (st) st.parentNode.insertBefore(aside, st.nextSibling);
    }
    aside.style.opacity = 0;
    aside.textContent = hasErrors
      ? 'The highlighted face(s) are stabiliser violations — think of them as parity-check alarms. ' +
        'They tell you something is wrong and roughly where, without ever revealing the quantum data stored on the ' +
        'physical qubits. That non-destructive readout is the hook quantum error correction relies on.'
      : 'All stabilisers return +1 — every face sees even parity of errors on the qubits that touch it. ' +
        'The logical subspace is consistent. (This toy grid does not measure logical Pauli; it only shows syndrome patterns.)';
    setTimeout(() => { aside.style.opacity = 1; }, 20);
  }

  function updateStatus() {
    const st = document.getElementById('surface-code-status');
    const syn = document.getElementById('surface-syndrome-row');
    const cb = document.getElementById('surface-correct-btn');
    if (errors.size === 0) {
      if (st) st.innerHTML = '<span style="color:var(--mint)">No errors.</span> All stabilisers check out — the logical qubit is intact.';
      if (syn) syn.textContent = '';
      if (cb) cb.disabled = true;
    } else {
      const qlist = [...errors].map(i=>`q${i}`).join(', ');
      if (st) st.innerHTML = `<span style="color:var(--red)">Error detected on ${qlist}.</span><br>Highlighted stabiliser(s) report parity violations (syndrome). Identify the qubit, then press <em>Correct</em> to apply the inverse.`;
      if (syn) syn.textContent = `Syndrome: stabiliser violation at face(s) adjacent to ${qlist}`;
      if (cb) cb.disabled = false;
    }
    renderSyndromeSidebar(errors.size > 0);
    if (injected && errors.size === 0 && corrected) markDone('t4-5');
  }

  const injectBtn = document.getElementById('surface-inject-btn');
  if (injectBtn) injectBtn.addEventListener('click', () => {
    errors.add(Math.floor(Math.random()*9));
    corrected = false; injected = true;
    updateStatus(); drawSurface();
  });

  const correctBtn = document.getElementById('surface-correct-btn');
  if (correctBtn) correctBtn.addEventListener('click', () => {
    errors.clear(); corrected = true;
    updateStatus(); drawSurface();
  });

  const resetBtn = document.getElementById('surface-reset-btn');
  if (resetBtn) resetBtn.addEventListener('click', () => {
    errors.clear(); corrected = false;
    updateStatus(); drawSurface();
  });

  // Overhead chart
  function drawOverhead() {
    const svg = document.getElementById('overhead-chart');
    if (!svg) return;
    svg.innerHTML = '';
    const W=500, H=160, padL=52, padB=30, padT=16, padR=20;
    const dists = [3,5,7,9,11,15,21];
    const qubits = dists.map(d => 2*d*d - 1);
    const maxQ = qubits[qubits.length-1];
    const xScale = (W-padL-padR)/(dists.length-1);
    const yScale = (H-padT-padB)/maxQ;

    // Axes
    const axisColor = 'var(--line-bright)';
    function line(x1,y1,x2,y2,color,sw){const l=document.createElementNS(ns,'line');l.setAttribute('x1',x1);l.setAttribute('y1',y1);l.setAttribute('x2',x2);l.setAttribute('y2',y2);l.setAttribute('stroke',color||axisColor);l.setAttribute('stroke-width',sw||1);svg.appendChild(l);}
    function text(x,y,t,attrs){const el=document.createElementNS(ns,'text');el.setAttribute('x',x);el.setAttribute('y',y);el.textContent=t;for(const[k,v] of Object.entries(attrs||{}))el.setAttribute(k,v);svg.appendChild(el);}
    line(padL, padT, padL, H-padB);
    line(padL, H-padB, W-padR, H-padB);
    // Y axis labels
    [0,200,400,600,800].forEach(v => {
      const y = H-padB - v*yScale;
      if(y>padT) { line(padL-4,y,padL,y); text(padL-6,y+3,v,{'font-family':'var(--mono)','font-size':8,fill:'var(--ink-faint)','text-anchor':'end'}); }
    });
    text(8, H/2, 'Physical qubits', {'font-family':'var(--mono)','font-size':8,fill:'var(--ink-faint)','text-anchor':'middle',transform:`rotate(-90,8,${H/2})`});
    // Plot line
    let pathD = '';
    dists.forEach((d,i) => {
      const x = padL + i*xScale;
      const y = H - padB - qubits[i]*yScale;
      pathD += (i===0?'M':'L') + x + ' ' + y;
    });
    const path = document.createElementNS(ns,'path');
    path.setAttribute('d', pathD); path.setAttribute('stroke','var(--amber)');
    path.setAttribute('stroke-width', 2); path.setAttribute('fill','none');
    svg.appendChild(path);
    // Points
    dists.forEach((d,i) => {
      const x = padL + i*xScale, y = H-padB - qubits[i]*yScale;
      const c = document.createElementNS(ns,'circle');
      c.setAttribute('cx',x); c.setAttribute('cy',y); c.setAttribute('r',4);
      c.setAttribute('fill','var(--amber)'); svg.appendChild(c);
      text(x, H-padB+12, 'd='+d, {'font-family':'var(--mono)','font-size':8,fill:'var(--ink-faint)','text-anchor':'middle'});
    });
    text(W/2, H-1, 'Code distance d', {'font-family':'var(--mono)','font-size':8,fill:'var(--ink-faint)','text-anchor':'middle'});
  }

  drawSurface(); updateStatus(); drawOverhead();
})();
