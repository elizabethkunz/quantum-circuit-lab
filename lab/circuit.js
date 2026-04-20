/* =======================================================================
   CIRCUIT MODEL
   circuit = {
     nQubits: int,
     columns: Array<Column>,
   }
   Column is an array of length nQubits; each entry is one of:
     null | {type:'single', gate:'H'|'X'|...} | 
     {type:'ctrl', partner:number} |
     {type:'target', gate:'X'|'Z', partner:number} |
     {type:'meas'}
   ======================================================================= */

let circuit = { nQubits: 2, columns: [] };
const MIN_COLUMNS = 8;
const MAX_QUBITS = 5;
const MIN_QUBITS = 1;

function ensureColumns() {
  // ensure at least MIN_COLUMNS empty trailing columns so user can keep dragging
  let trailingEmpty = 0;
  for (let i = circuit.columns.length - 1; i >= 0; i--) {
    if (circuit.columns[i].every(c => c === null)) trailingEmpty++;
    else break;
  }
  const needed = Math.max(MIN_COLUMNS, circuit.columns.length + 2);
  while (circuit.columns.length < needed || trailingEmpty < 2) {
    circuit.columns.push(new Array(circuit.nQubits).fill(null));
    trailingEmpty++;
  }
  // trim too-many trailing empties
  while (circuit.columns.length > MIN_COLUMNS) {
    const last = circuit.columns[circuit.columns.length - 1];
    const secondLast = circuit.columns[circuit.columns.length - 2];
    if (last.every(c => c === null) && secondLast.every(c => c === null)) {
      circuit.columns.pop();
    } else break;
  }
}

function resizeQubits(n) {
  circuit.nQubits = n;
  circuit.columns = circuit.columns.map(col => {
    if (col.length < n) {
      return [...col, ...new Array(n - col.length).fill(null)];
    } else if (col.length > n) {
      // dropping qubits — remove any gates referencing them
      const trimmed = col.slice(0, n);
      return trimmed.map(entry => {
        if (entry && (entry.type === 'ctrl' || entry.type === 'target')) {
          if (entry.partner >= n) return null;
        }
        return entry;
      });
    }
    return col;
  });
  ensureColumns();
  render();
}

/* ---------------- RENDER ---------------- */
function render() {
  ensureColumns();
  const container = document.getElementById('circuit');
  container.innerHTML = '';

  if (circuit.columns.length === 0 || circuit.nQubits === 0) {
    container.innerHTML = '<div class="empty-hint">Your circuit is empty.<span class="mono">Drag a gate onto a wire to begin</span></div>';
    return;
  }

  const wires = document.createElement('div');
  wires.className = 'wires';

  for (let q = circuit.nQubits - 1; q >= 0; q--) {
    const row = document.createElement('div');
    row.className = 'wire-row';

    const label = document.createElement('div');
    label.className = 'wire-label';
    label.innerHTML = `q<sub>${q}</sub> <span class="state">|0⟩</span>`;
    row.appendChild(label);

    const track = document.createElement('div');
    track.className = 'wire-track';
    const line = document.createElement('div');
    line.className = 'wire-line';
    track.appendChild(line);

    const slots = document.createElement('div');
    slots.className = 'slots';

    for (let c = 0; c < circuit.columns.length; c++) {
      const slot = document.createElement('div');
      slot.className = 'slot';
      slot.dataset.col = c;
      slot.dataset.qubit = q;

      slot.addEventListener('dragover', (e) => { e.preventDefault(); slot.classList.add('drop-target'); });
      slot.addEventListener('dragleave', () => slot.classList.remove('drop-target'));
      slot.addEventListener('drop', (e) => {
        e.preventDefault();
        slot.classList.remove('drop-target');
        const gate = e.dataTransfer.getData('gate');
        if (gate) placeGate(gate, q, c);
      });

      const entry = circuit.columns[c][q];
      if (entry) {
        const el = renderGate(entry, q, c);
        slot.appendChild(el);
      }

      slots.appendChild(slot);
    }

    track.appendChild(slots);
    row.appendChild(track);
    wires.appendChild(row);
  }

  container.appendChild(wires);

  // Draw control-target connector lines
  requestAnimationFrame(() => drawCtrlLinks());
}

function renderGate(entry, q, c) {
  if (entry.type === 'single') {
    const el = document.createElement('div');
    el.className = 'placed';
    const g = entry.gate;
    if (g === 'RX' || g === 'RY' || g === 'RZ') {
      el.classList.add('rot');
      el.style.fontSize = '10px';
      const sub = g[1].toLowerCase();
      el.textContent = `R${sub}`;
      const deg = entry.angleDeg !== undefined ? entry.angleDeg : 90;
      el.title = `R${sub}(${deg}°) — click to remove`;
      const small = document.createElement('div');
      small.style.cssText = 'font-family:var(--mono);font-size:8px;color:var(--cyan);position:absolute;bottom:2px;left:0;right:0;text-align:center;line-height:1';
      small.textContent = deg + '°';
      el.appendChild(small);
    } else {
      el.textContent = g;
    }
    el.addEventListener('click', () => removeGate(q, c));
    const x = document.createElement('button');
    x.className = 'x-btn'; x.textContent = '×';
    x.onclick = (e) => { e.stopPropagation(); removeGate(q, c); };
    el.appendChild(x);
    return el;
  }
  if (entry.type === 'ctrl') {
    const el = document.createElement('div');
    el.className = 'placed ctrl-dot';
    el.title = 'Control qubit · click to remove';
    el.addEventListener('click', () => removePair(q, c));
    return el;
  }
  if (entry.type === 'target') {
    const el = document.createElement('div');
    if (entry.gate === 'X') {
      el.className = 'placed target-x';
      el.textContent = '⊕';
    } else {
      el.className = 'placed';
      el.textContent = entry.gate;
    }
    el.title = 'Target · click to remove';
    el.addEventListener('click', () => removePair(q, c));
    return el;
  }
  if (entry.type === 'meas') {
    const el = document.createElement('div');
    el.className = 'placed meas';
    el.textContent = '◎';
    el.addEventListener('click', () => removeGate(q, c));
    const x = document.createElement('button');
    x.className = 'x-btn'; x.textContent = '×';
    x.onclick = (e) => { e.stopPropagation(); removeGate(q, c); };
    el.appendChild(x);
    return el;
  }
  return document.createElement('div');
}

function drawCtrlLinks() {
  // remove previous
  document.querySelectorAll('.ctrl-link').forEach(el => el.remove());

  const circuitEl = document.getElementById('circuit');
  const circuitRect = circuitEl.getBoundingClientRect();

  for (let c = 0; c < circuit.columns.length; c++) {
    const col = circuit.columns[c];
    const ctrlQs = [];
    const tgtQs = [];
    col.forEach((e, q) => {
      if (e && e.type === 'ctrl') ctrlQs.push(q);
      if (e && e.type === 'target') tgtQs.push(q);
    });
    if (ctrlQs.length && tgtQs.length) {
      const qA = Math.min(...ctrlQs, ...tgtQs);
      const qB = Math.max(...ctrlQs, ...tgtQs);
      const slotA = document.querySelector(`.slot[data-col="${c}"][data-qubit="${qA}"]`);
      const slotB = document.querySelector(`.slot[data-col="${c}"][data-qubit="${qB}"]`);
      if (slotA && slotB) {
        const rA = slotA.getBoundingClientRect();
        const rB = slotB.getBoundingClientRect();
        const link = document.createElement('div');
        link.className = 'ctrl-link';
        const topY = Math.min(rA.top, rB.top) - circuitRect.top + rA.height/2;
        const bottomY = Math.max(rA.top, rB.top) - circuitRect.top + rA.height/2;
        link.style.top = topY + 'px';
        link.style.height = (bottomY - topY) + 'px';
        link.style.left = (rA.left - circuitRect.left + rA.width/2) + 'px';
        link.style.transform = 'translateX(-50%)';
        circuitEl.appendChild(link);
      }
    }
  }
}

/* ---------------- PLACE / REMOVE ---------------- */
function placeGate(gate, qubit, col) {
  ensureColumns();
  // column exists
  if (!circuit.columns[col]) return;
  const existing = circuit.columns[col][qubit];

  if (gate === 'CNOT' || gate === 'CZ') {
    // Need a partner qubit. Place control on `qubit`, target on the nearest free qubit.
    let target = -1;
    // prefer adjacent
    const candidates = [];
    for (let q = 0; q < circuit.nQubits; q++) {
      if (q !== qubit) candidates.push(q);
    }
    candidates.sort((a,b) => Math.abs(a-qubit) - Math.abs(b-qubit));
    for (const q of candidates) {
      if (circuit.columns[col][q] === null) { target = q; break; }
    }
    if (target === -1) { toast('No free qubit in this column for a 2-qubit gate.', true); return; }
    if (existing !== null) { toast('Slot is occupied.', true); return; }

    circuit.columns[col][qubit] = { type: 'ctrl', partner: target };
    circuit.columns[col][target] = { type: 'target', gate: gate === 'CNOT' ? 'X' : 'Z', partner: qubit };
    ensureColumns();
    render();
    return;
  }

  if (existing !== null) { toast('Slot occupied — click to remove first.', true); return; }

  if (gate === 'M') {
    circuit.columns[col][qubit] = { type: 'meas' };
  } else if (gate === 'RX' || gate === 'RY' || gate === 'RZ') {
    circuit.columns[col][qubit] = { type: 'single', gate, angleDeg: rotAngleDeg };
  } else {
    circuit.columns[col][qubit] = { type: 'single', gate };
  }
  ensureColumns();
  render();
}

function removeGate(q, c) {
  const e = circuit.columns[c][q];
  if (!e) return;
  if (e.type === 'ctrl' || e.type === 'target') {
    removePair(q, c);
    return;
  }
  circuit.columns[c][q] = null;
  ensureColumns();
  render();
}

function removePair(q, c) {
  const e = circuit.columns[c][q];
  if (!e) return;
  circuit.columns[c][e.partner] = null;
  circuit.columns[c][q] = null;
  ensureColumns();
  render();
}

/* ---------------- SIMULATE ---------------- */
/* =======================================================================
   SIMULATION with optional depolarizing noise.
   Model: after each gate, with probability p, apply a uniformly random
   non-identity Pauli (X, Y, or Z) on each qubit the gate acted on.
   When p=0 we run the exact simulator once. When p>0 we run N shots,
   each with fresh random errors, and report the empirical distribution.
   ======================================================================= */
const SHOTS = 1024;

function randomPauli() {
  const r = Math.floor(Math.random() * 3);
  return r === 0 ? GATES.X : r === 1 ? GATES.Y : GATES.Z;
}

// Run circuit once and return the final state vector.
// If noise p > 0, inject random Paulis stochastically.
function runOnce(p) {
  let state = initState(circuit.nQubits);
  for (let c = 0; c < circuit.columns.length; c++) {
    const col = circuit.columns[c];
    const processed = new Set();
    // two-qubit gates first
    for (let q = 0; q < circuit.nQubits; q++) {
      const e = col[q];
      if (!e || processed.has(q)) continue;
      if (e.type === 'ctrl') {
        const target = e.partner;
        const tgtEntry = col[target];
        if (tgtEntry && tgtEntry.type === 'target') {
          const gateName = tgtEntry.gate;
          state = applyControlled(state, GATES[gateName], q, target, circuit.nQubits);
          processed.add(q); processed.add(target);
          if (p > 0) {
            if (Math.random() < p) state = applySingle(state, randomPauli(), q, circuit.nQubits);
            if (Math.random() < p) state = applySingle(state, randomPauli(), target, circuit.nQubits);
          }
        }
      }
    }
    // single-qubit gates
    for (let q = 0; q < circuit.nQubits; q++) {
      if (processed.has(q)) continue;
      const e = col[q];
      if (!e) continue;
      if (e.type === 'single') {
        let gateMatrix;
        if (e.gate === 'RX') gateMatrix = makeRxGate(e.angleDeg || 90);
        else if (e.gate === 'RY') gateMatrix = makeRyGate(e.angleDeg || 90);
        else if (e.gate === 'RZ') gateMatrix = makeRzGate(e.angleDeg || 90);
        else gateMatrix = GATES[e.gate];
        state = applySingle(state, gateMatrix, q, circuit.nQubits);
        if (p > 0 && Math.random() < p) {
          state = applySingle(state, randomPauli(), q, circuit.nQubits);
        }
      }
      // 'meas' markers don't alter the state here — we sample at the end
    }
  }
  return state;
}

// Sample a basis state index from a state vector's probability distribution
function sampleOutcome(state) {
  const probs = probabilities(state);
  const r = Math.random();
  let cum = 0;
  for (let i = 0; i < probs.length; i++) {
    cum += probs[i];
    if (r <= cum) return i;
  }
  return probs.length - 1;
}

function simulate() {
  const p = currentNoise(); // 0..0.10
  const trace = [];

  const hasGates = circuit.columns.some(col => col.some(e => e !== null));
  if (!hasGates) {
    const state = initState(circuit.nQubits);
    return {
      probs: probabilities(state),
      state,
      density: densityFromPure(state),
      trace: [{kind:'empty'}],
      noise: p,
      shots: 0
    };
  }

  // Build trace (order-preserving description of what the circuit does,
  // independent of any particular stochastic realization).
  for (let c = 0; c < circuit.columns.length; c++) {
    const col = circuit.columns[c];
    const processed = new Set();
    for (let q = 0; q < circuit.nQubits; q++) {
      const e = col[q];
      if (!e || processed.has(q)) continue;
      if (e.type === 'ctrl') {
        const target = e.partner;
        const tgtEntry = col[target];
        if (tgtEntry && tgtEntry.type === 'target') {
          trace.push({ kind: 'controlled', gate: tgtEntry.gate === 'X' ? 'CNOT' : 'CZ', control: q, target });
          processed.add(q); processed.add(target);
        }
      }
    }
    for (let q = 0; q < circuit.nQubits; q++) {
      if (processed.has(q)) continue;
      const e = col[q];
      if (!e) continue;
      if (e.type === 'single') {
        trace.push({ kind: 'single', gate: e.gate, qubit: q, angleDeg: e.angleDeg });
      } else if (e.type === 'meas') {
        trace.push({ kind: 'meas', qubit: q });
      }
    }
  }

  // p = 0: run once, report exact results
  if (p === 0) {
    const state = runOnce(0);
    return {
      probs: probabilities(state),
      state,
      density: densityFromPure(state),
      trace,
      noise: 0,
      shots: 0
    };
  }

  // p > 0: shot-based sampling. Each shot: fresh run with random errors.
  // Collect outcome counts AND accumulate the true mixed-state density matrix
  // ρ = (1/N) Σᵢ |ψᵢ⟩⟨ψᵢ|  where each |ψᵢ⟩ is a particular stochastic realization.
  const dim = 1 << circuit.nQubits;
  const counts = new Array(dim).fill(0);
  // Accumulate density matrix as 2D array of complex numbers
  const density = Array.from({length: dim}, () => Array.from({length: dim}, () => ({re:0, im:0})));

  for (let s = 0; s < SHOTS; s++) {
    const state = runOnce(p);
    // sample for outcome histogram
    const outcome = sampleOutcome(state);
    counts[outcome]++;
    // accumulate |ψ><ψ|  (add, then divide by SHOTS at the end)
    for (let i = 0; i < dim; i++) {
      for (let j = 0; j < dim; j++) {
        // |ψ><ψ|_{ij} = ψᵢ ψⱼ*
        const a = state[i];
        const b = state[j];
        // a * conj(b) = (a.re*b.re + a.im*b.im) + i(a.im*b.re - a.re*b.im)
        density[i][j].re += a.re*b.re + a.im*b.im;
        density[i][j].im += a.im*b.re - a.re*b.im;
      }
    }
  }
  // Average
  for (let i = 0; i < dim; i++) {
    for (let j = 0; j < dim; j++) {
      density[i][j].re /= SHOTS;
      density[i][j].im /= SHOTS;
    }
  }
  const probs = counts.map(c => c / SHOTS);
  // For the "Amplitudes" view under noise, we return the noiseless state for reference —
  // the true state is mixed and can't be written as a single amplitude vector.
  const idealState = runOnce(0);
  return { probs, state: idealState, density, trace, noise: p, shots: SHOTS, counts, mixed: true };
}

/* Build the density matrix |ψ⟩⟨ψ| from a pure state vector. */
function densityFromPure(state) {
  const dim = state.length;
  const rho = Array.from({length: dim}, () => Array.from({length: dim}, () => ({re:0, im:0})));
  for (let i = 0; i < dim; i++) {
    for (let j = 0; j < dim; j++) {
      const a = state[i];
      const b = state[j];
      rho[i][j].re = a.re*b.re + a.im*b.im;
      rho[i][j].im = a.im*b.re - a.re*b.im;
    }
  }
  return rho;
}

/* ---------------- RENDER OUTPUT ---------------- */
function formatBasisLabel(i, n) {
  let s = '';
  for (let q = n - 1; q >= 0; q--) {
    s += ((i >> q) & 1);
  }
  return '|' + s + '⟩';
}

// Global reference to the last simulation result + current output view mode.
let lastResult = null;
let currentView = 'probs'; // 'probs' | 'amps' | 'density'

function renderOutput() {
  if (!lastResult) {
    document.getElementById('prob-output').innerHTML = '<div class="placeholder-output">Build a circuit and press run to see the outcome distribution.</div>';
    return;
  }
  const n = circuit.nQubits;
  // Update panel title
  const title = document.getElementById('output-panel-title');
  if (currentView === 'probs')   title.textContent = 'Measurement probabilities';
  if (currentView === 'amps')    title.textContent = 'State vector amplitudes';
  if (currentView === 'density') title.textContent = 'Density matrix ρ';

  if (currentView === 'probs')   renderProbabilities(lastResult, n);
  else if (currentView === 'amps')    renderAmplitudes(lastResult, n);
  else if (currentView === 'density') renderDensityMatrix(lastResult, n);
}

function renderProbabilities(result, n) {
  const el = document.getElementById('prob-output');
  const { probs, noise, shots } = result;
  const entries = probs.map((p, i) => ({ i, p }));
  entries.sort((a,b) => b.p - a.p);

  const nonzero = entries.filter(e => e.p > 1e-9);
  const display = nonzero.length > 0 ? entries.slice(0, Math.min(8, entries.length)) : entries.slice(0, Math.min(4, entries.length));

  const html = '<div class="prob-list">' + display.map(({i, p}) => {
    const pct = (p * 100).toFixed(1);
    const zero = p < 1e-9 ? ' zero' : '';
    return `<div class="prob-row${zero}">
      <div class="prob-label">${formatBasisLabel(i, n)}</div>
      <div class="prob-bar-wrap"><div class="prob-bar" style="width:${Math.max(p*100, p > 1e-9 ? 1 : 0)}%"></div></div>
      <div class="prob-val">${pct}%</div>
    </div>`;
  }).join('') + '</div>';

  const hidden = entries.length - display.length;
  const note = hidden > 0 ? `<div style="font-family:var(--mono);font-size:10px;color:var(--ink-faint);margin-top:12px;letter-spacing:0.1em">+ ${hidden} states with &lt; 0.1% probability</div>` : '';

  el.innerHTML = html + note;
  updateShotsLabel(result);
}

function updateShotsLabel(result) {
  const label = document.getElementById('shots-label');
  if (result.noise > 0) {
    label.innerHTML = `<span style="color:var(--amber)">${result.shots} shots · ${(result.noise*100).toFixed(1)}% depolarizing noise</span>`;
  } else {
    label.textContent = 'exact · noise off';
  }
}

/* --------- Amplitude table view --------- */
function renderAmplitudes(result, n) {
  const el = document.getElementById('prob-output');
  const dim = 1 << n;
  const state = result.state;
  const parts = [];

  if (result.noise > 0) {
    parts.push(`<div class="view-note">Noise is active. The system is in a <b>mixed state</b>, which can't be written as a single amplitude vector. The table below shows the <em>ideal</em> (noise-free) amplitudes for reference. Use <b>Density ρ</b> for the true mixed state.</div>`);
  }

  parts.push(`<table class="amp-table">
    <thead>
      <tr>
        <th>Basis</th>
        <th class="num">Re(α)</th>
        <th class="num">Im(α)</th>
        <th class="num">|α|</th>
        <th class="num">|α|²</th>
        <th class="num">arg (deg)</th>
      </tr>
    </thead>
    <tbody>`);

  for (let i = 0; i < dim; i++) {
    const a = state[i];
    const mag = Math.sqrt(a.re*a.re + a.im*a.im);
    const mag2 = mag*mag;
    const phase = (Math.atan2(a.im, a.re) * 180 / Math.PI);
    const tiny = mag < 1e-6;
    const bigMag = mag > 0.3 ? ' big' : '';
    const reFmt = fmtNum(a.re);
    const imFmt = fmtNum(a.im);
    const magFmt = fmtNum(mag);
    const mag2Fmt = fmtNum(mag2);
    const phaseFmt = tiny ? '—' : phase.toFixed(1) + '°';

    parts.push(`<tr class="${tiny ? 'tiny' : ''}">
      <td class="basis">${formatBasisLabel(i, n)}</td>
      <td class="num${Math.abs(a.re) < 1e-9 ? ' zero' : ''}">${reFmt}</td>
      <td class="num${Math.abs(a.im) < 1e-9 ? ' zero' : ''}">${imFmt}</td>
      <td class="num mag${bigMag}">${magFmt}</td>
      <td class="num">${mag2Fmt}</td>
      <td class="num phase">${phaseFmt}</td>
    </tr>`);
  }

  parts.push(`</tbody></table>`);

  // Dimension note
  parts.push(`<div style="font-family:var(--mono);font-size:10px;color:var(--ink-faint);margin-top:14px;letter-spacing:0.1em">dim ℋ = 2<sup>${n}</sup> = ${dim} · Σ|α|² = ${fmtNum(state.reduce((s,a) => s + a.re*a.re + a.im*a.im, 0))}</div>`);

  el.innerHTML = parts.join('');
  updateShotsLabel(result);
}

function fmtNum(x) {
  if (Math.abs(x) < 1e-9) return '0.000';
  if (Math.abs(x) >= 10) return x.toFixed(2);
  return x.toFixed(3);
}

/* --------- Density matrix view --------- */
function renderDensityMatrix(result, n) {
  const el = document.getElementById('prob-output');
  const dim = 1 << n;

  if (n > 4) {
    el.innerHTML = `<div class="placeholder-output large">
      <div style="font-family:var(--serif);font-style:italic;font-size:16px;color:var(--ink-dim);margin-bottom:8px">Density matrix not shown for ${n} qubits (${dim}×${dim}).</div>
      <div style="font-family:var(--mono);font-size:11px;color:var(--ink-faint);letter-spacing:0.05em;max-width:46ch;margin:0 auto">Use 4 or fewer qubits to inspect ρ, or switch to Probs / Amplitudes.</div>
    </div>`;
    updateShotsLabel(result);
    return;
  }

  const rho = result.density;
  // Find max magnitude for color normalization
  let maxMag = 0;
  for (let i = 0; i < dim; i++) {
    for (let j = 0; j < dim; j++) {
      const m = Math.sqrt(rho[i][j].re*rho[i][j].re + rho[i][j].im*rho[i][j].im);
      if (m > maxMag) maxMag = m;
    }
  }
  if (maxMag === 0) maxMag = 1;

  const parts = [];
  if (result.noise > 0) {
    parts.push(`<div class="view-note">Noise is on. ρ was averaged over ${result.shots} stochastic realizations; off-diagonal (coherence) entries decay toward zero as noise grows.</div>`);
  } else {
    parts.push(`<div style="font-family:var(--mono);font-size:10px;color:var(--ink-faint);letter-spacing:0.1em;margin-bottom:12px">Pure state: ρ = |ψ⟩⟨ψ| · Tr(ρ²) = 1.000</div>`);
  }

  // Build grid
  parts.push(`<div class="dm-wrap"><div class="dm-grid" style="grid-template-columns: auto repeat(${dim}, 28px);">`);

  // Column headers
  parts.push(`<div class="dm-col-head"></div>`);
  for (let j = 0; j < dim; j++) {
    parts.push(`<div class="dm-col-head">${formatBasisLabel(j, n)}</div>`);
  }

  // Rows
  for (let i = 0; i < dim; i++) {
    parts.push(`<div class="dm-row-head">${formatBasisLabel(i, n)}</div>`);
    for (let j = 0; j < dim; j++) {
      const z = rho[i][j];
      const mag = Math.sqrt(z.re*z.re + z.im*z.im);
      const t = mag / maxMag;   // 0..1
      const color = densityColor(t, i === j);
      const tooltipVal = cellTooltip(z);
      const display = mag < 0.01 ? '' : mag.toFixed(2).replace(/^0/, '').replace('.00','');
      parts.push(`<div class="dm-cell" style="background:${color};color:${mag>0.3 ? 'var(--bg-0)' : 'var(--ink)'};">${display}<div class="cell-val">${tooltipVal}</div></div>`);
    }
  }

  parts.push(`</div>`);

  // Legend
  parts.push(`<div class="dm-legend">
    <span>|ρ<sub>ij</sub>|</span>
    <span>0</span>
    <div class="dm-legend-bar"></div>
    <span>${maxMag.toFixed(2)}</span>
  </div>`);

  // Trace and purity
  let trace = 0;
  for (let i = 0; i < dim; i++) trace += rho[i][i].re;
  // purity Tr(ρ²) = Σᵢⱼ |ρᵢⱼ|²
  let purity = 0;
  for (let i = 0; i < dim; i++) for (let j = 0; j < dim; j++) {
    const z = rho[i][j];
    purity += z.re*z.re + z.im*z.im;
  }
  parts.push(`<div style="font-family:var(--mono);font-size:10px;color:var(--ink-faint);letter-spacing:0.1em;text-align:center;margin-top:12px">
    Tr(ρ) = ${trace.toFixed(3)} · Tr(ρ²) = ${purity.toFixed(3)} ${purity < 0.99 ? '· <span style="color:var(--amber)">mixed state</span>' : '· pure state'}
  </div>`);

  parts.push(`</div>`);

  el.innerHTML = parts.join('');
  updateShotsLabel(result);
}

function densityColor(t, isDiagonal) {
  // t ∈ [0,1]. Use a palette that works with the dark theme: fade from bg-2 to phosphor green.
  // Diagonal entries (populations) get phosphor; off-diagonals (coherences) get a subtle cyan tint.
  if (t < 0.01) return 'var(--bg-2)';
  const r = isDiagonal ? 127 : 111;
  const g = isDiagonal ? 255 : 212;
  const b = isDiagonal ? 196 : 224;
  // blend from bg-2 (#161e1a = 22,30,26) to (r,g,b) as t goes 0→1
  const mix = (a, b, t) => Math.round(a + (b - a) * t);
  const R = mix(22, r, t);
  const G = mix(30, g, t);
  const B = mix(26, b, t);
  return `rgb(${R},${G},${B})`;
}

function cellTooltip(z) {
  const re = Math.abs(z.re) < 1e-9 ? 0 : z.re;
  const im = Math.abs(z.im) < 1e-9 ? 0 : z.im;
  if (re === 0 && im === 0) return '0';
  if (im === 0) return re.toFixed(4);
  if (re === 0) return `${im.toFixed(4)}i`;
  return `${re.toFixed(4)}${im >= 0 ? ' + ' : ' − '}${Math.abs(im).toFixed(4)}i`;
}

function renderNarrative(result, n) {
  const el = document.getElementById('narrative');
  const { trace, probs, noise } = result;

  if (trace.length === 0 || (trace.length === 1 && trace[0].kind === 'empty')) {
    el.innerHTML = '<p>Your circuit is empty. With no gates applied, every qubit stays in its starting state <code>|0⟩</code>, and the outcome is always <code>|' + '0'.repeat(n) + '⟩</code> with certainty.</p>';
    return;
  }

  const paragraphs = [];
  paragraphs.push(`<p><span class="step">Step 0</span>All ${n} qubit${n>1?'s':''} start in the <code>|0⟩</code> state — the quantum equivalent of switched off.</p>`);

  let step = 1;
  for (const t of trace) {
    let text = '';
    if (t.kind === 'single') {
      const g = t.gate;
      if (g === 'H') {
        text = `A <b>Hadamard</b> gate lands on <code>q${t.qubit}</code>. This qubit is now in an equal superposition — <span class="punch">both 0 and 1 simultaneously</span>, with equal weight.`;
      } else if (g === 'X') {
        text = `An <b>X</b> gate flips <code>q${t.qubit}</code>. If it was 0 it's now 1, if it was 1 it's now 0 — this is just the quantum NOT.`;
      } else if (g === 'Y') {
        text = `A <b>Y</b> gate rotates <code>q${t.qubit}</code> around the Y-axis of the Bloch sphere, flipping the bit and adding an imaginary phase.`;
      } else if (g === 'Z') {
        text = `A <b>Z</b> gate applies a 180° phase to the 1-component of <code>q${t.qubit}</code>. Invisible to measurement alone, but it matters once this qubit interferes with others.`;
      } else if (g === 'S') {
        text = `An <b>S</b> gate applies a 90° phase to the 1-component of <code>q${t.qubit}</code>.`;
      } else if (g === 'T') {
        text = `A <b>T</b> gate applies a 45° phase to <code>q${t.qubit}</code> — the finest-grained phase in the standard gate set.`;
      } else if (g === 'RX') {
        const deg = t.angleDeg !== undefined ? t.angleDeg : 90;
        text = `An <b>Rₓ(${deg}°)</b> gate rotates <code>q${t.qubit}</code> by ${deg}° around the x-axis of the Bloch sphere. At 180° this is identical to X; at 90° it creates a y-axis superposition.`;
      } else if (g === 'RY') {
        const deg = t.angleDeg !== undefined ? t.angleDeg : 90;
        text = `An <b>R_y(${deg}°)</b> gate rotates <code>q${t.qubit}</code> by ${deg}° around the y-axis. Unlike Rₓ, this has no imaginary components — it maps |0⟩ to a real superposition cos(θ/2)|0⟩ + sin(θ/2)|1⟩.`;
      } else if (g === 'RZ') {
        const deg = t.angleDeg !== undefined ? t.angleDeg : 90;
        text = `An <b>R_z(${deg}°)</b> gate rotates <code>q${t.qubit}</code> by ${deg}° around the z-axis — a pure phase rotation. Like Z, S, and T, it's invisible to a Z-basis measurement but rotates interference patterns.`;
      }
    } else if (t.kind === 'controlled') {
      if (t.gate === 'CNOT') {
        text = `A <b>CNOT</b> fires between control <code>q${t.control}</code> and target <code>q${t.target}</code>. The target flips <em>only if</em> the control is 1 — but if the control is in superposition, this binds the two qubits together. <span class="punch">This is where entanglement is born.</span>`;
      } else {
        text = `A <b>CZ</b> (controlled-Z) between <code>q${t.control}</code> and <code>q${t.target}</code>. The phase of the target flips only when the control is 1 — another way to entangle.`;
      }
    } else if (t.kind === 'meas') {
      text = `<b>Measurement</b> on <code>q${t.qubit}</code>. The qubit is forced to commit — whatever superposition it was in collapses to a definite 0 or 1, with probabilities set by the earlier gates.`;
    }
    if (text) {
      paragraphs.push(`<p><span class="step">Step ${step}</span>${text}</p>`);
      step++;
    }
  }

  // Closing interpretation based on result
  const closing = interpretResult(probs, n, noise);
  paragraphs.push(`<p><span class="step">Result</span>${closing}</p>`);

  // Noise commentary, if applicable
  if (noise > 0) {
    const gateCount = trace.filter(t => t.kind === 'single' || t.kind === 'controlled').length;
    paragraphs.push(`<p><span class="step">Noise</span>Every gate has a <code>${(noise*100).toFixed(1)}%</code> chance of misfiring — randomly applying an unwanted X, Y, or Z error. Across ${gateCount} gate${gateCount===1?'':'s'} and ${result.shots} shots, you're seeing the <span class="punch">smeared</span> version of your ideal circuit. This is roughly what today's real quantum hardware looks like before error correction kicks in.</p>`);
  }

  el.innerHTML = paragraphs.join('');
}

function interpretResult(probs, n, noise = 0) {
  const eps = noise > 0 ? 0.01 : 1e-6;             // ignore sampling noise floor
  const tol = noise > 0 ? 0.06 : 1e-4;             // how close to 50/50 is "balanced"

  const nonzero = probs
    .map((p, i) => ({ i, p }))
    .filter(x => x.p > eps)
    .sort((a,b) => b.p - a.p);

  if (nonzero.length === 0) return `Every outcome came up with near-zero probability — unlikely unless the circuit is unusual.`;

  if (nonzero.length === 1) {
    return `Every measurement will yield <code>${formatBasisLabel(nonzero[0].i, n)}</code> with certainty. The circuit produced a single classical outcome.`;
  }

  // Teleportation signature: exactly 4 outcomes, each ~25%, with one qubit always 0 or always 1.
  // (Generalized: detect "k outcomes uniformly distributed with some qubit pinned".)
  if (n >= 3 && nonzero.length >= 2) {
    const expected = 1 / nonzero.length;
    const allBalanced = nonzero.every(x => Math.abs(x.p - expected) < tol);
    if (allBalanced) {
      // Check each qubit to see if it's pinned across all nonzero outcomes
      for (let q = 0; q < n; q++) {
        const bits = nonzero.map(x => (x.i >> q) & 1);
        const allSame = bits.every(b => b === bits[0]);
        if (allSame && nonzero.length >= 4 && nonzero.length <= probs.length / 2) {
          const pinned = bits[0];
          return `A telltale signature: <code>q${q}</code> is always <code>${pinned}</code>, while the other qubits are uniformly random across ${nonzero.length} equally-likely outcomes. The ${pinned === 1 ? '|1⟩' : '|0⟩'} state <span class="punch">arrived on <code>q${q}</code></span> even though no gate acted on q${q} alone after the Bell pair formed — that's teleportation. The other qubits ended up as random byproducts.`;
        }
      }
    }
  }

  // Uniform check
  const uniform = nonzero.length === probs.length && nonzero.every(x => Math.abs(x.p - 1/probs.length) < tol);
  if (uniform) {
    return `Every basis state is roughly equally likely — a <span class="punch">uniform superposition</span>. Each outcome comes up with probability near 1/${probs.length}.`;
  }

  // Bell/GHZ-type: two dominant peaks, all-0 and all-1, balanced
  if (nonzero.length >= 2) {
    const a = nonzero[0], b = nonzero[1];
    const allZero = 0;
    const allOne = probs.length - 1;
    const isEntangledSignature = (a.i === allZero && b.i === allOne) || (a.i === allOne && b.i === allZero);
    const balanced = Math.abs(a.p - 0.5) < tol && Math.abs(b.p - 0.5) < tol;
    const dominating = (a.p + b.p) > (noise > 0 ? 0.75 : 0.99);

    if (isEntangledSignature && balanced && dominating && n >= 2) {
      return `The dominant outcomes are <code>|${'0'.repeat(n)}⟩</code> and <code>|${'1'.repeat(n)}⟩</code>, each near 50%. The qubits are <span class="punch">entangled</span> — no qubit has a definite value of its own, but they all agree when measured. Classical correlation can't produce this with local, independent coin flips.`;
    }

    if (balanced && nonzero.length === 2) {
      return `Two roughly equally likely outcomes: <code>${formatBasisLabel(a.i, n)}</code> and <code>${formatBasisLabel(b.i, n)}</code>. Before measurement, the system is in a superposition of both.`;
    }

    if (nonzero.length === 2) {
      const p0 = (a.p * 100).toFixed(1);
      const p1 = (b.p * 100).toFixed(1);
      return `Two outcomes appear: <code>${formatBasisLabel(a.i, n)}</code> at ${p0}% and <code>${formatBasisLabel(b.i, n)}</code> at ${p1}%. The unevenness comes from constructive and destructive interference of the amplitudes.`;
    }
  }

  return `The state is spread across ${nonzero.length} outcomes (above). The rest have negligible probability.`;
}

/* ---------------- EVENTS ---------------- */
function toast(msg, err=false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.toggle('err', err);
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

function bindDrag() {
  document.querySelectorAll('.gate-btn').forEach(btn => {
    btn.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('gate', btn.dataset.gate);
      btn.classList.add('dragging');
    });
    btn.addEventListener('dragend', () => btn.classList.remove('dragging'));
  });
}

/* ---------------- NOISE SLIDER ---------------- */
function currentNoise() {
  const slider = document.getElementById('noise-slider');
  return slider ? parseFloat(slider.value) / 100 : 0;
}

const noiseSlider = document.getElementById('noise-slider');
const noiseCtrl = document.getElementById('noise-ctrl');
const noiseVal = document.getElementById('noise-val');
function updateNoiseLabel() {
  const v = parseFloat(noiseSlider.value);
  if (v === 0) {
    noiseVal.textContent = 'off';
    noiseCtrl.classList.add('off');
    document.getElementById('lab-noise-aside').style.display = 'none';
  } else {
    noiseVal.textContent = v.toFixed(1) + '%';
    noiseCtrl.classList.remove('off');
    document.getElementById('lab-noise-aside').style.display = '';
  }
}
noiseSlider.addEventListener('input', updateNoiseLabel);
updateNoiseLabel();

/* Narrative toggle */
document.getElementById('narrative-toggle').addEventListener('click', () => {
  const narrative = document.getElementById('narrative');
  const chevron = document.getElementById('narrative-chevron');
  const open = narrative.style.display !== 'none';
  narrative.style.display = open ? 'none' : '';
  chevron.style.transform = open ? 'rotate(0deg)' : 'rotate(90deg)';
});

document.getElementById('btn-run').addEventListener('click', () => {
  const result = simulate();
  lastResult = result;
  renderOutput();
  renderNarrative(result, circuit.nQubits);
  // Auto-expand narrative panel on run
  const narrative = document.getElementById('narrative');
  const chevron = document.getElementById('narrative-chevron');
  narrative.style.display = '';
  chevron.style.transform = 'rotate(90deg)';
  // Show context card if a template is active
  if (activeTemplateCtx) showContextCard(activeTemplateCtx);
  // scroll to output on mobile
  if (window.innerWidth < 900) {
    document.getElementById('prob-output').scrollIntoView({behavior:'smooth', block:'start'});
  }
});

// Output view toggle
document.querySelectorAll('#output-toggle button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#output-toggle button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentView = btn.dataset.view;
    renderOutput();
  });
});

document.getElementById('btn-clear').addEventListener('click', () => {
  circuit.columns = [];
  ensureColumns();
  render();
  lastResult = null;
  dismissContextCard();
  document.getElementById('prob-output').innerHTML = '<div class="placeholder-output">Build a circuit and press run to see the outcome distribution.</div>';
  document.getElementById('narrative').innerHTML = '<div class="placeholder-output">A step-by-step reading of your circuit will appear here after you run it.</div>';
  document.getElementById('narrative').style.display = 'none';
  document.getElementById('narrative-chevron').style.transform = 'rotate(0deg)';
  document.getElementById('shots-label').textContent = '1024 shots · simulated';
});

document.getElementById('qubit-plus').addEventListener('click', () => {
  if (circuit.nQubits < MAX_QUBITS) {
    resizeQubits(circuit.nQubits + 1);
  } else {
    toast('Max ' + MAX_QUBITS + ' qubits (simulator limit).', true);
  }
});
document.getElementById('qubit-minus').addEventListener('click', () => {
  if (circuit.nQubits > MIN_QUBITS) {
    resizeQubits(circuit.nQubits - 1);
  }
});
