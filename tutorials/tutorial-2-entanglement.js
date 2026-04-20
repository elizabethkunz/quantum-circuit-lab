/* ==========================================================================
   ======================= TUTORIAL 2: ENTANGLEMENT =========================
   ========================================================================== */

/* ---- T2 Step 1: product state explorer ---- */
(function initT2Step1() {
  const configs = {
    none: { probs: [1,0,0,0], formula: '\\(|0\\rangle \\otimes |0\\rangle = |00\\rangle\\)', note: 'Both qubits definite. Product state.' },
    h0:   { probs: [0.5,0,0.5,0], formula: '\\((|0\\rangle+|1\\rangle)/\\sqrt{2} \\otimes |0\\rangle = (|00\\rangle+|10\\rangle)/\\sqrt{2}\\)', note: 'q0 in superposition, q1 definite.' },
    h1:   { probs: [0.5,0.5,0,0], formula: '\\(|0\\rangle \\otimes (|0\\rangle+|1\\rangle)/\\sqrt{2} = (|00\\rangle+|01\\rangle)/\\sqrt{2}\\)', note: 'q1 in superposition, q0 definite.' },
    hh:   { probs: [0.25,0.25,0.25,0.25], formula: '\\((|0\\rangle+|1\\rangle)/\\sqrt{2} \\otimes (|0\\rangle+|1\\rangle)/\\sqrt{2} = (|00\\rangle+|01\\rangle+|10\\rangle+|11\\rangle)/2\\)', note: 'Both in superposition. All four outcomes equally likely.' }
  };
  const seen = new Set();
  let current = 'h0';

  function renderProductProbs(cfg) {
    const labels = ['|00⟩','|01⟩','|10⟩','|11⟩'];
    const el = document.getElementById('t2-product-probs');
    if (!el) return;
    el.innerHTML = '<div class="prob-list">' + cfg.probs.map((p,i) => {
      const pct = (p*100).toFixed(0);
      const zero = p < 0.01 ? ' zero' : '';
      return `<div class="prob-row${zero}">
        <div class="prob-label">${labels[i]}</div>
        <div class="prob-bar-wrap"><div class="prob-bar" style="width:${p*100}%"></div></div>
        <div class="prob-val">${pct}%</div>
      </div>`;
    }).join('') + '</div>';
    const fEl = document.getElementById('t2-product-formula');
    if (fEl) { fEl.innerHTML = `<div>${cfg.formula}</div><div style="font-family:var(--mono);font-size:10px;color:var(--ink-faint);margin-top:8px;letter-spacing:0.05em">${cfg.note}</div>`; }
  }

  document.querySelectorAll('.t2-product-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.t2-product-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      current = btn.dataset.config;
      seen.add(current);
      renderProductProbs(configs[current]);
      if (seen.size >= 4) markDone('t2-1');
    });
  });
  renderProductProbs(configs['h0']);
})();

/* ---- T2 Step 2: enhanced CNOT — truth table + superposition + phase kickback ---- */
(function initT2Step2() {
  // ---- Part A: Truth table ----
  const ttData = [
    { ctrl:'|0⟩', tgt:'|0⟩', outC:'|0⟩', outT:'|0⟩', desc:'Control = 0 → no flip. Target unchanged.' },
    { ctrl:'|0⟩', tgt:'|1⟩', outC:'|0⟩', outT:'|1⟩', desc:'Control = 0 → no flip. Target unchanged.' },
    { ctrl:'|1⟩', tgt:'|0⟩', outC:'|1⟩', outT:'|1⟩', desc:'Control = 1 → target flips: 0 → 1.' },
    { ctrl:'|1⟩', tgt:'|1⟩', outC:'|1⟩', outT:'|0⟩', desc:'Control = 1 → target flips: 1 → 0.' },
  ];
  const ttEl = document.getElementById('cnot-truth-table');
  let ttSeen = new Set();
  if (ttEl) {
    ['Input ctrl','Input tgt','Out ctrl','Out tgt'].forEach(h => {
      const hd = document.createElement('div');
      hd.style.cssText = 'font-family:var(--mono);font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:var(--ink-faint);padding:6px 10px;background:var(--bg-0);border:1px solid var(--line);text-align:center';
      hd.textContent = h; ttEl.appendChild(hd);
    });
    ttData.forEach((row, i) => {
      [row.ctrl, row.tgt, row.outC, row.outT].forEach((val, j) => {
        const cell = document.createElement('div');
        cell.style.cssText = 'font-family:var(--serif);font-style:italic;font-size:14px;padding:8px 10px;background:var(--bg-1);border:1px solid var(--line);text-align:center;cursor:pointer;transition:background 0.15s;color:' + (j >= 2 ? 'var(--phos)' : 'var(--ink)');
        cell.textContent = val; cell.dataset.row = i;
        cell.addEventListener('click', () => hlRow(i));
        cell.addEventListener('mouseenter', () => hlRow(i));
        ttEl.appendChild(cell);
      });
    });
  }
  function hlRow(i) {
    if (!ttEl) return;
    ttEl.querySelectorAll('[data-row]').forEach(c => { c.style.background = parseInt(c.dataset.row)===i?'var(--bg-3)':'var(--bg-1)'; });
    const d = document.getElementById('cnot-tt-desc'); if(d) d.textContent = ttData[i].desc;
    ttSeen.add(i); checkAll();
  }
  if (ttData.length) hlRow(0);

  // ---- Part B: Superposition control ----
  const states = {
    '0': { output:'|00⟩', note:'Control is |0⟩ — CNOT does nothing. Target stays |0⟩.', entangled:false },
    '1': { output:'|11⟩', note:'Control is |1⟩ — CNOT flips the target. Definite outcome, no superposition.', entangled:false },
    '+': { output:'\\((|00\\rangle + |11\\rangle)/\\sqrt{2}\\)', note:'Control in superposition → CNOT spreads it to both qubits. Entanglement forms.', entangled:true },
    '-': { output:'\\((|00\\rangle - |11\\rangle)/\\sqrt{2}\\)', note:'Phase kickback signature: minus phase on whole state. Entangled with phase difference.', entangled:true }
  };
  const superSeen = new Set();
  document.querySelectorAll('.cnot-ctrl-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cnot-ctrl-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const s = states[btn.dataset.ctrl]; superSeen.add(btn.dataset.ctrl);
      const outEl = document.getElementById('cnot-result-state');
      const noteEl = document.getElementById('cnot-result-note');
      if (outEl) outEl.innerHTML = s.output + (s.entangled?' <span style="font-family:var(--mono);font-size:10px;color:var(--cyan);letter-spacing:0.1em;vertical-align:middle"> ← ENTANGLED</span>':'');
      if (noteEl) noteEl.textContent = s.note;
      checkAll();
    });
  });
  const initB = document.querySelector('.cnot-ctrl-btn[data-ctrl="0"]'); if(initB) initB.click();

  // ---- Part C: Phase kickback ----
  let kickbackSeen = false;
  function updateKickback(tgt) {
    document.querySelectorAll('.kickback-tgt-btn').forEach(b => b.classList.toggle('active', b.dataset.tgt===tgt));
    const res = document.getElementById('kickback-result');
    if (tgt === 'minus') {
      if(res) res.innerHTML = '<b style="color:var(--phos)">Phase kickback active.</b><br>Target |−⟩ is a −1-eigenstate of X. CNOT encodes the oracle as a <em>phase</em> on the control, not a flip of the target.<br><br>Control: |+⟩ → |−⟩ (phase flips). Target: |−⟩ unchanged.';
    } else {
      if(res) res.innerHTML = '<b style="color:var(--amber)">Normal CNOT.</b><br>Target |0⟩ → flips to |1⟩ when control=|1⟩. No phase kickback.';
    }
    drawKickbackSVG(document.getElementById('kickback-svg'), tgt==='minus');
    kickbackSeen = true; checkAll();
  }
  function drawKickbackSVG(svg, kb) {
    if(!svg) return;
    const ns='http://www.w3.org/2000/svg';
    svg.innerHTML='';
    function el(tag,attrs,text){const e=document.createElementNS(ns,tag);for(const[k,v] of Object.entries(attrs))e.setAttribute(k,v);if(text)e.textContent=text;return e;}
    svg.appendChild(el('line',{x1:20,y1:35,x2:240,y2:35,stroke:'var(--line-bright)','stroke-width':1}));
    svg.appendChild(el('line',{x1:20,y1:75,x2:240,y2:75,stroke:'var(--line-bright)','stroke-width':1}));
    svg.appendChild(el('text',{x:5,y:38,'font-family':'var(--mono)','font-size':9,fill:'var(--ink-faint)'},'q0'));
    svg.appendChild(el('text',{x:5,y:78,'font-family':'var(--mono)','font-size':9,fill:'var(--ink-faint)'},'q1'));
    svg.appendChild(el('text',{x:22,y:30,'font-family':'var(--serif)','font-style':'italic','font-size':11,fill:'var(--ink-dim)'},'|+⟩'));
    svg.appendChild(el('text',{x:22,y:90,'font-family':'var(--serif)','font-style':'italic','font-size':11,fill:'var(--ink-dim)'},kb?'|−⟩':'|0⟩'));
    svg.appendChild(el('circle',{cx:130,cy:35,r:5,fill:'var(--phos)'}));
    svg.appendChild(el('circle',{cx:130,cy:75,r:12,fill:'none',stroke:'var(--phos)','stroke-width':1.5}));
    svg.appendChild(el('line',{x1:130,y1:40,x2:130,y2:63,stroke:'var(--phos)','stroke-width':1.5}));
    svg.appendChild(el('text',{x:126,y:79,'font-family':'var(--serif)','font-size':14,fill:'var(--phos)'},'⊕'));
    svg.appendChild(el('text',{x:148,y:30,'font-family':'var(--serif)','font-style':'italic','font-size':11,fill:kb?'var(--amber)':'var(--phos)'},kb?'|−⟩':'(|00⟩+|11⟩)/√2'));
    svg.appendChild(el('text',{x:148,y:90,'font-family':'var(--serif)','font-style':'italic','font-size':11,fill:'var(--phos-dim)'},kb?'|−⟩ (unchanged)':'|1⟩ or |0⟩'));
    if(kb) svg.appendChild(el('text',{x:55,y:17,'font-family':'var(--mono)','font-size':8,fill:'var(--amber)','letter-spacing':'0.06em'},'phase kicks back ↑'));
  }
  document.querySelectorAll('.kickback-tgt-btn').forEach(btn => { btn.addEventListener('click', ()=>updateKickback(btn.dataset.tgt)); });
  updateKickback('minus');

  function checkAll() {
    if(ttSeen.size>=4 && superSeen.size>=4 && kickbackSeen) markDone('t2-2');
  }
})();

/* ---- T2 Step 3: Bell state builder ---- */
(function initT2Step3() {
  const bellSteps = [
    {
      formula: '\\(|q1\\rangle|q0\\rangle = |0\\rangle|0\\rangle = |00\\rangle\\)',
      probs: [1,0,0,0],
      desc: 'Both qubits start in |0⟩. The state is fully definite — no superposition, no entanglement.'
    },
    {
      formula: '\\((|0\\rangle+|1\\rangle)/\\sqrt{2} \\otimes |0\\rangle = (|00\\rangle+|10\\rangle)/\\sqrt{2}\\)',
      probs: [0.5,0,0.5,0],
      desc: 'Hadamard on q0 creates superposition. q0 is now 50/50, but the two qubits are still independent — this is a product state.'
    },
    {
      formula: '\\((|00\\rangle + |11\\rangle)/\\sqrt{2}\\)',
      probs: [0.5,0,0,0.5],
      desc: 'CNOT entangles. The target (q1) flips when q0=|1⟩. The two possible outcomes — |00⟩ and |11⟩ — are now locked together. This is a Bell state.'
    }
  ];
  const seen = new Set();

  function renderBellStep(i) {
    const s = bellSteps[i];
    const fEl = document.getElementById('bell-state-formula');
    const dEl = document.getElementById('bell-step-desc');
    if (fEl) fEl.textContent = s.formula;
    if (dEl) dEl.textContent = s.desc;
    const labels = ['|00⟩','|01⟩','|10⟩','|11⟩'];
    const pEl = document.getElementById('bell-builder-probs');
    if (pEl) pEl.innerHTML = '<div class="prob-list">' + s.probs.map((p,j) => {
      const pct = (p*100).toFixed(0);
      return `<div class="prob-row${p<0.01?' zero':''}">
        <div class="prob-label">${labels[j]}</div>
        <div class="prob-bar-wrap"><div class="prob-bar" style="width:${p*100}%"></div></div>
        <div class="prob-val">${pct}%</div>
      </div>`;
    }).join('') + '</div>';
    seen.add(i);
    if (seen.size >= 3) markDone('t2-3');
  }

  document.querySelectorAll('.bell-step-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.bell-step-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderBellStep(parseInt(btn.dataset.bellStep));
    });
  });
  renderBellStep(0);
})();

/* ---- T2 Step 4: Bell collapse + CHSH ---- */
(function initT2Step4() {
  // Part A: spooky collapse
  const grid = document.getElementById('t2-collapse-grid');
  const shotEl = document.getElementById('t2-collapse-shot');
  const countEl = document.getElementById('t2-collapse-count');
  let measurements = 0, chshDone = false;
  function checkDone(){ if(measurements>=10 && chshDone) markDone('t2-4'); }
  function measure() {
    const o = Math.random()<0.5?0:1;
    const cell = document.createElement('div');
    cell.className='pair-cell match'; cell.textContent=`${o}${o}`; grid.appendChild(cell);
    shotEl.textContent=`q0=${o}, q1=${o}`; shotEl.style.color=o===0?'var(--cyan)':'var(--amber)';
    measurements++; countEl.textContent=`${measurements} measurement${measurements===1?'':'s'}`;
    checkDone();
  }
  const mb = document.getElementById('t2-measure-btn'); if(mb) mb.addEventListener('click', measure);
  const rb = document.getElementById('t2-collapse-reset');
  if(rb) rb.addEventListener('click',()=>{ measurements=0; grid.innerHTML=''; shotEl.textContent='—'; shotEl.style.color='var(--phos)'; countEl.textContent='0 measurements'; });

  // Part B: CHSH
  const alphaSlider = document.getElementById('chsh-alpha');
  const betaSlider  = document.getElementById('chsh-beta');
  const alphaVal    = document.getElementById('chsh-alpha-val');
  const betaVal     = document.getElementById('chsh-beta-val');
  if(alphaSlider) alphaSlider.addEventListener('input',()=>{ alphaVal.textContent=alphaSlider.value+'°'; });
  if(betaSlider)  betaSlider.addEventListener('input',()=>{ betaVal.textContent=betaSlider.value+'°'; });

  const chshBtn = document.getElementById('chsh-run-btn');
  if(chshBtn) chshBtn.addEventListener('click', ()=>{
    const alpha = parseInt(alphaSlider.value) * Math.PI/180;
    const beta  = parseInt(betaSlider.value)  * Math.PI/180;
    // CHSH E(a,b) = -cos(a-b) for singlet state
    // C = E(a,b) - E(a,b') + E(a',b) + E(a',b')
    // Use a=alpha, b=beta, a'=alpha+pi/2, b'=beta+pi/4
    const ap = alpha + Math.PI/2, bp = beta + Math.PI/4;
    function E(x,y){ return -Math.cos(x-y) + (Math.random()-0.5)*0.06; }
    const chsh = Math.abs(E(alpha,beta) - E(alpha,bp) + E(ap,beta) + E(ap,bp));
    const pct = Math.min(100, (chsh/2.828)*100);
    const barFill = document.getElementById('chsh-bar-fill');
    const barLabel = document.getElementById('chsh-bar-label');
    const valEl    = document.getElementById('chsh-value');
    const verdict  = document.getElementById('chsh-verdict');
    if(barFill) barFill.style.width = pct+'%';
    if(barLabel) barLabel.textContent = chsh.toFixed(3);
    if(valEl) valEl.textContent = chsh.toFixed(3);
    const classical = chsh <= 2.0;
    if(verdict) {
      verdict.textContent = classical ? '≤ 2 — classical' : '> 2 — quantum!';
      verdict.style.color = classical ? 'var(--amber)' : 'var(--phos)';
    }
    // draw bar: classical = amber, quantum = phos
    if(barFill) barFill.style.background = classical ? 'linear-gradient(90deg,var(--amber),var(--amber-dim))' : 'linear-gradient(90deg,var(--phos-dim),var(--phos))';
    chshDone = true; checkDone();
  });
})();

/* ---- T2 Step 5: reading step — unlock on subtab entry handled via wrap-card ---- */
(function initT2Step5() {
  // Automatically mark done when reached (last step, no interaction required)
  const card = document.querySelector('[data-step="t2-5"]');
  if (card) {
    const obs = new MutationObserver(() => {
      if (!card.classList.contains('locked')) { markDone('t2-5'); obs.disconnect(); }
    });
    obs.observe(card, { attributes: true, attributeFilter: ['class'] });
  }
})();
