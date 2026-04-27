/* =========================================================================
   TUTORIAL 5: DEUTSCH-JOZSA
   ========================================================================= */

/* ---- T5 Step 1: classical query count ---- */
(function initT5Step1() {
  const slider = document.getElementById('dj-n-slider');
  const valEl  = document.getElementById('dj-n-val');
  const chart  = document.getElementById('dj-classical-chart');
  const cmpEl  = document.getElementById('dj-query-compare');
  let interacted = false;

  function drawChart(n) {
    if (!chart) return;
    const ns = 'http://www.w3.org/2000/svg';
    chart.innerHTML = '';
    const W=360, H=100, pad=30;
    function mkEl(tag,attrs,text){const e=document.createElementNS(ns,tag);for(const[k,v] of Object.entries(attrs))e.setAttribute(k,v);if(text)e.textContent=text;return e;}
    chart.appendChild(mkEl('line',{x1:pad,y1:5,x2:pad,y2:H-20,stroke:'var(--line-bright)','stroke-width':1}));
    chart.appendChild(mkEl('line',{x1:pad,y1:H-20,x2:W-10,y2:H-20,stroke:'var(--line-bright)','stroke-width':1}));
    const ns2 = Math.pow(2,n-1)+1;
    const bars = [
      {label:'Classical', val:ns2, color:'var(--amber)'},
      {label:'Quantum',   val:1,   color:'var(--mint)'},
    ];
    const maxV = ns2;
    const bw = 60, gap = 30;
    bars.forEach((b,i) => {
      const bh = Math.max(4, (b.val/maxV)*(H-30));
      const x = pad+20 + i*(bw+gap);
      const y = H-20-bh;
      chart.appendChild(mkEl('rect',{x,y,width:bw,height:bh,fill:b.color,rx:2}));
      chart.appendChild(mkEl('text',{x:x+bw/2,y:y-3,'font-family':'var(--mono)','font-size':9,fill:b.color,'text-anchor':'middle'},b.val));
      chart.appendChild(mkEl('text',{x:x+bw/2,y:H-5,'font-family':'var(--mono)','font-size':9,fill:'var(--ink-faint)','text-anchor':'middle'},b.label));
    });
  }

  function update() {
    const n = parseInt(slider.value);
    if (valEl) valEl.textContent = n;
    const worst = Math.pow(2, n-1)+1;
    if (cmpEl) cmpEl.innerHTML = `<span style="color:var(--amber)">Classical worst case: ${worst} queries</span>  ·  <span style="color:var(--mint)">Quantum: 1 query</span>  ·  Speedup: ${worst}×`;
    drawChart(n);
    interacted = true;
    markDone('t5-1');
  }
  if (slider) slider.addEventListener('input', update);
  update();
})();

/* ---- T5 Step 2: circuit diagram ---- */
(function initT5Step2() {
  const steps = [
    { desc: 'Start: q0,q1 = |0⟩, ancilla q2 = |1⟩. All qubits definite, no superposition.' },
    { desc: 'After Hadamard on all qubits: q0,q1 enter equal superposition; ancilla becomes |−⟩ = (|0⟩−|1⟩)/√2. The system now simultaneously evaluates all 4 inputs.' },
    { desc: 'After oracle Uf: the oracle\'s output is imprinted as a phase via kickback through the ancilla. Constant functions leave the input register unchanged; balanced functions flip a phase.' },
    { desc: 'After final H on q0,q1: interference makes the input register collapse to |00⟩ for constant (constructive) or a state with at least one 1 for balanced (destructive). Measure and you have the answer.' },
  ];
  const seen = new Set();

  function drawDJCircuit(step) {
    const svg = document.getElementById('dj-circuit-diagram');
    if (!svg) return;
    const ns = 'http://www.w3.org/2000/svg';
    svg.innerHTML = '';
    function mkEl(tag,attrs,text){const e=document.createElementNS(ns,tag);for(const[k,v] of Object.entries(attrs))e.setAttribute(k,v);if(text)e.textContent=text;return e;}
    const W=560, qH=45;
    const qLabels=['q0 |0⟩','q1 |0⟩','q2 |1⟩'];
    // wires
    qLabels.forEach((l,i)=>{
      const y=30+i*qH;
      svg.appendChild(mkEl('text',{x:4,y:y+4,'font-family':'var(--mono)','font-size':9,fill:'var(--ink-faint)'},l));
      svg.appendChild(mkEl('line',{x1:70,y1:y,x2:W-20,y2:y,stroke:'var(--line-bright)','stroke-width':1}));
    });
    // H gates (step>=1: all qubits)
    if(step>=1){
      [0,1,2].forEach(i=>{
        const y=30+i*qH, x=90;
        svg.appendChild(mkEl('rect',{x:x-14,y:y-12,width:28,height:24,fill:'var(--bg-2)',stroke:'var(--mint)','stroke-width':1.5,rx:2}));
        svg.appendChild(mkEl('text',{x,y:y+5,'font-family':'var(--serif)','font-size':15,fill:'var(--mint)','text-anchor':'middle'},'H'));
      });
    }
    // Oracle box (step>=2)
    if(step>=2){
      svg.appendChild(mkEl('rect',{x:150,y:10,width:100,height:115,fill:'rgba(230,127,184,0.1)',stroke:'var(--magenta)','stroke-width':1.5,rx:3}));
      svg.appendChild(mkEl('text',{x:200,y:70,'font-family':'var(--serif)','font-style':'italic','font-size':13,fill:'var(--magenta)','text-anchor':'middle'},'U_f'));
      svg.appendChild(mkEl('text',{x:200,y:85,'font-family':'var(--mono)','font-size':8,fill:'var(--magenta)','text-anchor':'middle','letter-spacing':'0.05em'},'oracle'));
    }
    // Final H (step>=3: q0,q1 only)
    if(step>=3){
      [0,1].forEach(i=>{
        const y=30+i*qH, x=290;
        svg.appendChild(mkEl('rect',{x:x-14,y:y-12,width:28,height:24,fill:'var(--bg-2)',stroke:'var(--mint)','stroke-width':1.5,rx:2}));
        svg.appendChild(mkEl('text',{x,y:y+5,'font-family':'var(--serif)','font-size':15,fill:'var(--mint)','text-anchor':'middle'},'H'));
      });
      // Measurement
      [0,1].forEach(i=>{
        const y=30+i*qH, x=340;
        svg.appendChild(mkEl('rect',{x:x-14,y:y-12,width:28,height:24,fill:'var(--bg-2)',stroke:'var(--amber)','stroke-width':1.5,rx:2}));
        svg.appendChild(mkEl('text',{x,y:y+5,'font-family':'var(--mono)','font-size':11,fill:'var(--amber)','text-anchor':'middle'},'◎'));
      });
      // Output labels
      svg.appendChild(mkEl('text',{x:375,y:34,'font-family':'var(--serif)','font-style':'italic','font-size':12,fill:'var(--mint)'},'0 → constant'));
      svg.appendChild(mkEl('text',{x:375,y:79,'font-family':'var(--serif)','font-style':'italic','font-size':12,fill:'var(--amber)'},'1 → balanced'));
    }
  }

  document.querySelectorAll('.dj-circuit-step-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.dj-circuit-step-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const i = parseInt(btn.dataset.djstep);
      seen.add(i);
      drawDJCircuit(i);
      const desc = document.getElementById('dj-circuit-desc');
      if (desc) desc.textContent = steps[i].desc;
      if (seen.size >= 4) markDone('t5-2');
    });
  });
  drawDJCircuit(0);
  const d = document.getElementById('dj-circuit-desc'); if(d) d.textContent = steps[0].desc;
  const initBtn = document.querySelector('.dj-circuit-step-btn[data-djstep="0"]'); if(initBtn) initBtn.classList.add('active');
})();

/* ---- T5 Step 3: run constant vs balanced ---- */
(function initT5Step3() {
  // Simple mini circuit drawer
  function drawMini(containerId, gates, nQ) {
    const el = document.getElementById(containerId); if(!el) return;
    const ns='http://www.w3.org/2000/svg';
    const svg=document.createElementNS(ns,'svg');
    svg.setAttribute('viewBox','0 0 300 '+(nQ*44+10));
    svg.style.width='100%'; svg.style.maxWidth='300px';
    function mkEl(tag,attrs,text){const e=document.createElementNS(ns,tag);for(const[k,v] of Object.entries(attrs))e.setAttribute(k,v);if(text)e.textContent=text;return e;}
    for(let q=0;q<nQ;q++){
      const y=25+q*44;
      svg.appendChild(mkEl('text',{x:4,y:y+3,'font-family':'var(--mono)','font-size':8,fill:'var(--ink-faint)'},'q'+q));
      svg.appendChild(mkEl('line',{x1:28,y1:y,x2:290,y2:y,stroke:'var(--line-bright)','stroke-width':1}));
    }
    gates.forEach(g=>{
      const y=25+g.q*44;
      svg.appendChild(mkEl('rect',{x:g.x-12,y:y-11,width:24,height:22,fill:'var(--bg-2)',stroke:g.color||'var(--mint)','stroke-width':1.5,rx:2}));
      svg.appendChild(mkEl('text',{x:g.x,y:y+4,'font-family':'var(g.f||--serif)','font-size':11,fill:g.color||'var(--mint)','text-anchor':'middle'},g.label));
    });
    el.innerHTML=''; el.appendChild(svg);
  }

  function runDJConst(containerId, verdictId) {
    // Constant oracle: output always |00⟩
    renderMiniProbs(containerId, {0:1,1:0,2:0,3:0});
    const v=document.getElementById(verdictId);
    if(v) { v.innerHTML='<b style="color:var(--mint)">All-zero output → CONSTANT</b><br>Interference cancels all non-zero terms.'; }
    markDone('t5-3');
  }
  function runDJBal(containerId, verdictId) {
    // Balanced oracle: output has at least one 1 → |10⟩ for CNOT-based oracle
    renderMiniProbs(containerId, {0:0,1:0,2:1,3:0});
    const v=document.getElementById(verdictId);
    if(v) { v.innerHTML='<b style="color:var(--amber)">Non-zero output → BALANCED</b><br>Interference amplifies the non-zero term.'; }
  }
  function renderMiniProbs(id, probs) {
    const el = document.getElementById(id); if(!el) return;
    const labels=['|00⟩','|01⟩','|10⟩','|11⟩'];
    const total = Object.values(probs).reduce((a,b)=>a+b,0);
    el.innerHTML='<div class="prob-list">'+labels.map((l,i)=>{
      const p=probs[i]||0, pct=(p*100).toFixed(0);
      return `<div class="prob-row${p<0.01?' zero':''}">
        <div class="prob-label" style="font-size:11px">${l}</div>
        <div class="prob-bar-wrap"><div class="prob-bar" style="width:${p*100}%"></div></div>
        <div class="prob-val">${pct}%</div></div>`;
    }).join('')+'</div>';
  }

  // Draw mini circuits
  drawMini('dj-const-circuit',[
    {q:0,x:50,label:'H'},{q:1,x:50,label:'H'},{q:2,x:50,label:'H'},
    {q:2,x:160,label:'I',color:'var(--ink-faint)'},
    {q:0,x:250,label:'H'},{q:1,x:250,label:'H'},{q:0,x:290,label:'◎',color:'var(--amber)'},{q:1,x:290,label:'◎',color:'var(--amber)'}
  ], 3);
  drawMini('dj-bal-circuit',[
    {q:0,x:50,label:'H'},{q:1,x:50,label:'H'},{q:2,x:50,label:'H'},
    {q:0,x:160,label:'●',color:'var(--mint)'},{q:2,x:160,label:'⊕',color:'var(--mint)'},
    {q:0,x:250,label:'H'},{q:1,x:250,label:'H'},{q:0,x:290,label:'◎',color:'var(--amber)'},{q:1,x:290,label:'◎',color:'var(--amber)'}
  ], 3);

  const constBtn = document.getElementById('dj-const-run');
  const balBtn   = document.getElementById('dj-bal-run');
  if(constBtn) constBtn.addEventListener('click', () => runDJConst('dj-const-probs','dj-const-verdict'));
  if(balBtn)   balBtn.addEventListener('click',   () => runDJBal('dj-bal-probs','dj-bal-verdict'));
})();

/* ---- T5 Step 4: oracle chooser ---- */
(function initT5Step4() {
  const oracles = {
    'const0': { result:{0:1,1:0,2:0,3:0}, type:'constant', explain:'f(x)=0 always → all-zero output.' },
    'const1': { result:{0:1,1:0,2:0,3:0}, type:'constant', explain:'f(x)=1 always → same output as f=0 for D-J (global phase).' },
    'bal-id': { result:{0:0,1:0,2:1,3:0}, type:'balanced', explain:'f(x)=x₀ → non-zero qubit 0 output.' },
    'bal-not':{ result:{0:0,1:0,2:1,3:0}, type:'balanced', explain:'f(x)=¬x₀ → same output qubit pattern, different phase.' },
    'bal-xor':{ result:{0:0,1:0,2:1,3:1}, type:'balanced', explain:'f(x)=x₀⊕x₁ → both output qubits non-zero.' },
    'mystery':null,
  };
  let cur='const0', seen=new Set(), mysteryOracle=null;
  function pickMystery(){
    const pool=['const0','const1','bal-id','bal-not','bal-xor'];
    return pool[Math.floor(Math.random()*pool.length)];
  }

  function renderProbs(id, probs) {
    const el=document.getElementById(id); if(!el) return;
    const labels=['|00⟩','|01⟩','|10⟩','|11⟩'];
    el.innerHTML='<div class="prob-list">'+labels.map((l,i)=>{
      const p=probs[i]||0, pct=(p*100).toFixed(0);
      return `<div class="prob-row${p<0.01?' zero':''}">
        <div class="prob-label" style="font-size:11px">${l}</div>
        <div class="prob-bar-wrap"><div class="prob-bar" style="width:${p*100}%"></div></div>
        <div class="prob-val">${pct}%</div></div>`;
    }).join('')+'</div>';
  }

  document.querySelectorAll('.dj-oracle-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('.dj-oracle-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active'); cur=btn.dataset.oracle;
      if(cur==='mystery') mysteryOracle=pickMystery();
      const vEl=document.getElementById('dj-oracle-verdict');
      const xEl=document.getElementById('dj-oracle-explain');
      if(vEl) vEl.textContent='Press ▶ Run D-J to evaluate.';
      if(xEl) xEl.textContent='';
      document.getElementById('dj-oracle-probs').innerHTML='';
    });
  });

  const runBtn=document.getElementById('dj-oracle-run');
  if(runBtn) runBtn.addEventListener('click',()=>{
    const key = cur==='mystery' ? mysteryOracle : cur;
    const o = oracles[key];
    renderProbs('dj-oracle-probs', o.result);
    const vEl=document.getElementById('dj-oracle-verdict');
    const xEl=document.getElementById('dj-oracle-explain');
    if(vEl) {
      const isConst = o.type==='constant';
      if(cur==='mystery'){
        vEl.innerHTML = `<b style="color:var(--mint)">The oracle was ${isConst?'CONSTANT':'BALANCED'}.</b> D-J determined this in 1 shot.`;
      } else {
        vEl.innerHTML = isConst
          ? '<b style="color:var(--mint)">CONSTANT</b> — output register is all zeros.'
          : '<b style="color:var(--amber)">BALANCED</b> — output register has at least one 1.';
      }
    }
    if(xEl) xEl.textContent = o.explain;
    seen.add(cur);
    if(seen.size>=4 && seen.has('mystery')) markDone('t5-4');
  });
})();

/* ---- T5 Step 5: noise comparison ---- */
(function initT5Step5() {
  const slider = document.getElementById('dj-noise-slider');
  const valEl  = document.getElementById('dj-noise-val');
  let levelsSeen = new Set();

  function renderProbs(id, probs) {
    const el=document.getElementById(id); if(!el) return;
    const labels=['|00⟩','|01⟩','|10⟩','|11⟩'];
    el.innerHTML='<div class="prob-list">'+labels.map((l,i)=>{
      const p=probs[i]||0, pct=(p*100).toFixed(0);
      return `<div class="prob-row${p<0.01?' zero':''}">
        <div class="prob-label" style="font-size:11px">${l}</div>
        <div class="prob-bar-wrap"><div class="prob-bar" style="width:${p*100}%"></div></div>
        <div class="prob-val">${pct}%</div></div>`;
    }).join('')+'</div>';
  }

  function runBoth() {
    const noiseLevel = parseFloat(slider.value)/100;
    levelsSeen.add(Math.round(noiseLevel*100));

    // Ideal balanced oracle: always |10⟩
    const idealProbs = {0:0, 1:0, 2:1, 3:0};
    renderProbs('dj-noise-ideal-probs', idealProbs);
    const iV=document.getElementById('dj-noise-ideal-verdict');
    if(iV) iV.textContent = 'Balanced oracle detected. Answer: BALANCED (certain).';

    // Noisy: smear the result
    const p = noiseLevel;
    const noise = p*1.2; // depolarize model simplified
    const noisyProbs = {};
    noisyProbs[0] = noise * 0.3;
    noisyProbs[1] = noise * 0.25;
    noisyProbs[2] = Math.max(0, 1 - noise*1.5);
    noisyProbs[3] = noise * 0.2;
    // normalize
    const tot = Object.values(noisyProbs).reduce((a,b)=>a+b,0);
    for(const k in noisyProbs) noisyProbs[k]/=tot;
    renderProbs('dj-noise-noisy-probs', noisyProbs);
    const nV=document.getElementById('dj-noise-noisy-verdict');
    const confidence = noisyProbs[2]*100;
    if(nV) nV.textContent = confidence > 70 ? `Probably balanced (${confidence.toFixed(0)}% confidence).` : `Ambiguous — noise has degraded the answer (${confidence.toFixed(0)}% confidence on |10⟩).`;

    // Classical comparison
    const classicalOk = noiseLevel < 0.05;
    const cEl=document.getElementById('dj-classical-results');
    if(cEl) {
      const q0 = noiseLevel<0.01?'0':noiseLevel<0.05?'0 (likely)':'0 or 1 (noisy)';
      const q1 = noiseLevel<0.01?'1':noiseLevel<0.05?'1 (likely)':'0 or 1 (noisy)';
      cEl.innerHTML = `Query 1: f(00) = 0 <br>Query 2: f(10) = 1 <br>→ <b style="color:${classicalOk?'var(--mint)':'var(--red)'}">Answer: ${classicalOk?'BALANCED (certain)':'Uncertain due to noise'}</b>`;
    }
    const qvEl=document.getElementById('dj-quantum-vs-classical');
    if(qvEl) {
      if(noiseLevel < 0.02) {
        qvEl.innerHTML = '<b style="color:var(--mint)">Quantum advantage clear.</b> Both agree, but quantum needed 1 query vs classical 2.';
      } else if(noiseLevel < 0.1) {
        qvEl.innerHTML = '<b style="color:var(--amber)">Quantum degrading.</b> Classical still accurate with 2 queries. Quantum advantage is eroding.';
      } else {
        qvEl.innerHTML = '<b style="color:var(--red)">Both struggling.</b> At this noise level, both quantum and classical are unreliable. Quantum\'s advantage evaporates.';
      }
    }
    if(levelsSeen.size >= 3) markDone('t5-5');
  }

  if(slider) slider.addEventListener('input', () => {
    if(valEl) valEl.textContent = parseFloat(slider.value).toFixed(1)+'%';
  });
  const runBtn = document.getElementById('dj-noise-run');
  if(runBtn) runBtn.addEventListener('click', runBoth);
  runBoth(); // init
})();

/* ---- T5 Step 6: auto-done on unlock ---- */
(function initT5Step6() {
  const card = document.querySelector('[data-step="t5-6"]');
  if (card) {
    const obs = new MutationObserver(() => {
      if (!card.classList.contains('locked')) { markDone('t5-6'); obs.disconnect(); }
    });
    obs.observe(card, { attributes: true, attributeFilter: ['class'] });
  }
})();
