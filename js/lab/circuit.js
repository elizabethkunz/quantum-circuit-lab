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
     {type:'swap2', gate:'SWAP'|'iSWAP', partner:number} |
     {type:'ccx', ctrl0, ctrl1, target} (same ref on three wires) |
     {type:'cswap', control, swap0, swap1} (same ref on three wires) |
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
        if (entry && (entry.type === 'ctrl' || entry.type === 'target' || entry.type === 'swap2')) {
          if (entry.partner >= n) return null;
        }
        if (entry && entry.type === 'ccx') {
          if (entry.ctrl0 >= n || entry.ctrl1 >= n || entry.target >= n) return null;
        }
        if (entry && entry.type === 'cswap') {
          if (entry.control >= n || entry.swap0 >= n || entry.swap1 >= n) return null;
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
    if (g === 'SX' || g === 'SY' || g === 'SZ') {
      el.classList.add('sqrt-pauli');
      el.style.fontSize = '11px';
      const ax = g[1];
      el.innerHTML = `<span style="font-size:9px">√</span><span style="font-weight:600">${ax}</span>`;
      el.title = `√${ax} — click to remove`;
    } else if (g === 'RX' || g === 'RY' || g === 'RZ') {
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
  if (entry.type === 'swap2') {
    const el = document.createElement('div');
    el.className = 'placed swap-pair' + (entry.gate === 'iSWAP' ? ' iswap' : '');
    const label = entry.gate === 'SWAP' ? 'SW' : 'iSW';
    el.textContent = label;
    el.title = (entry.gate === 'SWAP' ? 'SWAP' : 'iSWAP') + ' · click to remove';
    el.addEventListener('click', () => removePair(q, c));
    return el;
  }
  if (entry.type === 'ccx') {
    const el = document.createElement('div');
    if (q === entry.target) {
      el.className = 'placed target-x';
      el.textContent = '⊕';
      el.title = 'Toffoli target · click to remove';
    } else {
      el.className = 'placed ctrl-dot';
      el.title = 'Toffoli control · click to remove';
    }
    el.addEventListener('click', () => removeCCXOrCSWAP(c));
    return el;
  }
  if (entry.type === 'cswap') {
    const el = document.createElement('div');
    if (q === entry.control) {
      el.className = 'placed ctrl-dot';
      el.title = 'Fredkin control · click to remove';
    } else {
      el.className = 'placed cswap-end';
      el.textContent = '⇄';
      el.title = 'CSWAP swap line · click to remove';
    }
    el.addEventListener('click', () => removeCCXOrCSWAP(c));
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
    const swapPair = [];
    col.forEach((e, q) => {
      if (e && e.type === 'ctrl') ctrlQs.push(q);
      if (e && e.type === 'target') tgtQs.push(q);
      if (e && e.type === 'swap2' && e.partner > q) swapPair.push([q, e.partner]);
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
    for (const [qLo, qHi] of swapPair) {
      const slotA = document.querySelector(`.slot[data-col="${c}"][data-qubit="${qLo}"]`);
      const slotB = document.querySelector(`.slot[data-col="${c}"][data-qubit="${qHi}"]`);
      if (slotA && slotB) {
        const rA = slotA.getBoundingClientRect();
        const rB = slotB.getBoundingClientRect();
        const link = document.createElement('div');
        link.className = 'ctrl-link';
        const topY = Math.min(rA.top, rB.top) - circuitRect.top + rA.height / 2;
        const bottomY = Math.max(rA.top, rB.top) - circuitRect.top + rA.height / 2;
        link.style.top = topY + 'px';
        link.style.height = (bottomY - topY) + 'px';
        link.style.left = (rA.left - circuitRect.left + rA.width / 2) + 'px';
        link.style.transform = 'translateX(-50%)';
        circuitEl.appendChild(link);
      }
    }
    for (let q = 0; q < circuit.nQubits; q++) {
      const e = col[q];
      if (!e) continue;
      if (e.type === 'ccx' && q === Math.min(e.ctrl0, e.ctrl1, e.target)) {
        const lo = Math.min(e.ctrl0, e.ctrl1, e.target);
        const hi = Math.max(e.ctrl0, e.ctrl1, e.target);
        drawVerticalLink(circuitEl, circuitRect, c, lo, hi);
      } else if (e.type === 'cswap' && q === Math.min(e.control, e.swap0, e.swap1)) {
        const lo = Math.min(e.control, e.swap0, e.swap1);
        const hi = Math.max(e.control, e.swap0, e.swap1);
        drawVerticalLink(circuitEl, circuitRect, c, lo, hi);
      }
    }
  }
}

function drawVerticalLink(circuitEl, circuitRect, col, qLo, qHi) {
  const slotA = document.querySelector(`.slot[data-col="${col}"][data-qubit="${qLo}"]`);
  const slotB = document.querySelector(`.slot[data-col="${col}"][data-qubit="${qHi}"]`);
  if (!slotA || !slotB) return;
  const rA = slotA.getBoundingClientRect();
  const rB = slotB.getBoundingClientRect();
  const link = document.createElement('div');
  link.className = 'ctrl-link';
  const topY = Math.min(rA.top, rB.top) - circuitRect.top + rA.height / 2;
  const bottomY = Math.max(rA.top, rB.top) - circuitRect.top + rA.height / 2;
  link.style.top = topY + 'px';
  link.style.height = (bottomY - topY) + 'px';
  link.style.left = (rA.left - circuitRect.left + rA.width / 2) + 'px';
  link.style.transform = 'translateX(-50%)';
  circuitEl.appendChild(link);
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

  if (gate === 'SWAP' || gate === 'iSWAP') {
    let target = -1;
    const candidates = [];
    for (let q = 0; q < circuit.nQubits; q++) {
      if (q !== qubit) candidates.push(q);
    }
    candidates.sort((a, b) => Math.abs(a - qubit) - Math.abs(b - qubit));
    for (const q of candidates) {
      if (circuit.columns[col][q] === null) { target = q; break; }
    }
    if (target === -1) { toast('No free qubit in this column for a 2-qubit gate.', true); return; }
    if (existing !== null) { toast('Slot is occupied.', true); return; }

    const gname = gate === 'SWAP' ? 'SWAP' : 'iSWAP';
    circuit.columns[col][qubit] = { type: 'swap2', gate: gname, partner: target };
    circuit.columns[col][target] = { type: 'swap2', gate: gname, partner: qubit };
    ensureColumns();
    render();
    return;
  }

  if (gate === 'CCX') {
    if (circuit.nQubits < 3) { toast('CCX (Toffoli) needs at least 3 qubits.', true); return; }
    if (existing !== null) { toast('Slot is occupied.', true); return; }
    const free = [];
    for (let q = 0; q < circuit.nQubits; q++) {
      if (circuit.columns[col][q] === null) free.push(q);
    }
    free.sort((a, b) => a - b);
    if (free.length < 3) { toast('Need 3 free qubits in this column for CCX.', true); return; }
    const a = free[0], b = free[1], c0 = free[2];
    if (qubit !== a && qubit !== b && qubit !== c0) {
      toast('For CCX, drop on one of the three lowest free wires in this column.', true);
      return;
    }
    const cell = { type: 'ccx', ctrl0: a, ctrl1: b, target: c0 };
    circuit.columns[col][a] = cell;
    circuit.columns[col][b] = cell;
    circuit.columns[col][c0] = cell;
    ensureColumns();
    render();
    return;
  }

  if (gate === 'CSWAP') {
    if (circuit.nQubits < 3) { toast('CSWAP (Fredkin) needs at least 3 qubits.', true); return; }
    if (existing !== null) { toast('Slot is occupied.', true); return; }
    const free = [];
    for (let q = 0; q < circuit.nQubits; q++) {
      if (circuit.columns[col][q] === null) free.push(q);
    }
    if (free.length < 3) { toast('Need 3 free qubits in this column for CSWAP.', true); return; }
    if (!free.includes(qubit)) { toast('Slot is occupied.', true); return; }
    const rest = free.filter(q => q !== qubit).sort((a, b) => a - b);
    if (rest.length < 2) { toast('CSWAP needs two more free qubits in this column.', true); return; }
    const cell = { type: 'cswap', control: qubit, swap0: rest[0], swap1: rest[1] };
    circuit.columns[col][qubit] = cell;
    circuit.columns[col][rest[0]] = cell;
    circuit.columns[col][rest[1]] = cell;
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
  if (e.type === 'ccx' || e.type === 'cswap') {
    removeCCXOrCSWAP(c);
    return;
  }
  if (e.type === 'ctrl' || e.type === 'target' || e.type === 'swap2') {
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

function removeCCXOrCSWAP(c) {
  const col = circuit.columns[c];
  if (!col) return;
  for (let q = 0; q < circuit.nQubits; q++) {
    const e = col[q];
    if (!e) continue;
    if (e.type === 'ccx') {
      col[e.ctrl0] = null;
      col[e.ctrl1] = null;
      col[e.target] = null;
      ensureColumns();
      render();
      return;
    }
    if (e.type === 'cswap') {
      col[e.control] = null;
      col[e.swap0] = null;
      col[e.swap1] = null;
      ensureColumns();
      render();
      return;
    }
  }
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
      } else if (e.type === 'swap2') {
        const target = e.partner;
        const other = col[target];
        if (other && other.type === 'swap2' && other.gate === e.gate && other.partner === q) {
          const mat = e.gate === 'SWAP' ? SWAP4 : ISWAP4;
          state = applyTwoQubit(state, mat, q, target, circuit.nQubits);
          processed.add(q);
          processed.add(target);
          if (p > 0) {
            if (Math.random() < p) state = applySingle(state, randomPauli(), q, circuit.nQubits);
            if (Math.random() < p) state = applySingle(state, randomPauli(), target, circuit.nQubits);
          }
        }
      } else if (e.type === 'ccx') {
        const c0 = e.ctrl0, c1 = e.ctrl1, t = e.target;
        if (q === Math.min(c0, c1, t)) {
          state = applyToffoli(state, c0, c1, t, circuit.nQubits);
          processed.add(c0);
          processed.add(c1);
          processed.add(t);
          if (p > 0) {
            if (Math.random() < p) state = applySingle(state, randomPauli(), c0, circuit.nQubits);
            if (Math.random() < p) state = applySingle(state, randomPauli(), c1, circuit.nQubits);
            if (Math.random() < p) state = applySingle(state, randomPauli(), t, circuit.nQubits);
          }
        }
      } else if (e.type === 'cswap') {
        const C = e.control, s0 = e.swap0, s1 = e.swap1;
        if (q === Math.min(C, s0, s1)) {
          state = applyCSWAP(state, C, s0, s1, circuit.nQubits);
          processed.add(C);
          processed.add(s0);
          processed.add(s1);
          if (p > 0) {
            if (Math.random() < p) state = applySingle(state, randomPauli(), C, circuit.nQubits);
            if (Math.random() < p) state = applySingle(state, randomPauli(), s0, circuit.nQubits);
            if (Math.random() < p) state = applySingle(state, randomPauli(), s1, circuit.nQubits);
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

/* Logical gate order per column (matches simulation semantics). */
function buildLogicalTrace(columns, nQubits) {
  const trace = [];
  for (let c = 0; c < columns.length; c++) {
    const col = columns[c];
    if (!col) continue;
    const processed = new Set();
    for (let q = 0; q < nQubits; q++) {
      const e = col[q];
      if (!e || processed.has(q)) continue;
      if (e.type === 'ctrl') {
        const target = e.partner;
        const tgtEntry = col[target];
        if (tgtEntry && tgtEntry.type === 'target') {
          trace.push({ kind: 'controlled', gate: tgtEntry.gate === 'X' ? 'CNOT' : 'CZ', control: q, target });
          processed.add(q); processed.add(target);
        }
      } else if (e.type === 'swap2') {
        const target = e.partner;
        const other = col[target];
        if (other && other.type === 'swap2' && other.gate === e.gate && other.partner === q) {
          const a = Math.min(q, target);
          const b = Math.max(q, target);
          trace.push({ kind: 'swap2', gate: e.gate, a, b });
          processed.add(q);
          processed.add(target);
        }
      } else if (e.type === 'ccx') {
        if (q === Math.min(e.ctrl0, e.ctrl1, e.target)) {
          trace.push({ kind: 'ccx', ctrl0: e.ctrl0, ctrl1: e.ctrl1, target: e.target });
          processed.add(e.ctrl0);
          processed.add(e.ctrl1);
          processed.add(e.target);
        }
      } else if (e.type === 'cswap') {
        if (q === Math.min(e.control, e.swap0, e.swap1)) {
          trace.push({ kind: 'cswap', control: e.control, swap0: e.swap0, swap1: e.swap1 });
          processed.add(e.control);
          processed.add(e.swap0);
          processed.add(e.swap1);
        }
      }
    }
    for (let q = 0; q < nQubits; q++) {
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
  return trace;
}

function simulate() {
  const p = currentNoise(); // 0..0.10
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

  const trace = buildLogicalTrace(circuit.columns, circuit.nQubits);

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

function purityFromDensity(rho) {
  const dim = rho.length;
  let purity = 0;
  for (let i = 0; i < dim; i++) {
    for (let j = 0; j < dim; j++) {
      const z = rho[i][j];
      purity += z.re * z.re + z.im * z.im;
    }
  }
  return purity;
}

function expectationPauliFromDensity(rho, n, qubit, pauli) {
  const dim = 1 << n;
  const mask = 1 << qubit;
  let value = 0;

  if (pauli === 'Z') {
    for (let i = 0; i < dim; i++) {
      const bit = (i >> qubit) & 1;
      value += (bit === 0 ? 1 : -1) * rho[i][i].re;
    }
    return value;
  }

  if (pauli === 'X') {
    for (let i = 0; i < dim; i++) {
      const j = i ^ mask;
      value += rho[i][j].re;
    }
    return value;
  }

  // pauli === 'Y'
  for (let i = 0; i < dim; i++) {
    const j = i ^ mask;
    const bit = (i >> qubit) & 1;
    const sign = bit === 0 ? -1 : 1;
    value += sign * rho[i][j].im;
  }
  return value;
}

function updateAnalysisSelectors() {
  const qubitSel = document.getElementById('analysis-qubit-select');
  const targetSel = document.getElementById('analysis-target-select');
  if (!qubitSel || !targetSel) return;

  qubitSel.innerHTML = '';
  for (let q = 0; q < circuit.nQubits; q++) {
    const opt = document.createElement('option');
    opt.value = String(q);
    opt.textContent = `q${q}`;
    qubitSel.appendChild(opt);
  }

  targetSel.innerHTML = '';
  const dim = 1 << circuit.nQubits;
  for (let i = 0; i < dim; i++) {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = formatBasisLabel(i, circuit.nQubits);
    targetSel.appendChild(opt);
  }
}

function renderAnalysis(result, n) {
  const expEl = document.getElementById('analysis-expvals');
  const fidEl = document.getElementById('analysis-fidelity');
  const purityEl = document.getElementById('analysis-purity');
  const qubitSel = document.getElementById('analysis-qubit-select');
  const targetSel = document.getElementById('analysis-target-select');
  if (!expEl || !fidEl || !purityEl || !qubitSel || !targetSel) return;

  if (!result) {
    expEl.innerHTML = '<div class="placeholder-output">Run a circuit to compute expectation values.</div>';
    fidEl.innerHTML = '<div class="placeholder-output">Run a circuit to compute fidelity.</div>';
    purityEl.innerHTML = '<div class="placeholder-output">Run a circuit to compute purity.</div>';
    return;
  }

  const rho = result.density;
  const qubit = Math.max(0, Math.min(n - 1, parseInt(qubitSel.value, 10) || 0));
  const targetIndex = Math.max(0, Math.min((1 << n) - 1, parseInt(targetSel.value, 10) || 0));

  const ex = expectationPauliFromDensity(rho, n, qubit, 'X');
  const ey = expectationPauliFromDensity(rho, n, qubit, 'Y');
  const ez = expectationPauliFromDensity(rho, n, qubit, 'Z');
  const fidelity = rho[targetIndex][targetIndex].re;
  const purity = purityFromDensity(rho);

  expEl.innerHTML = `
    <div class="analysis-kv"><span>\\(\\langle X \\rangle\\) on q${qubit}</span><b>${fmtNum(ex)}</b></div>
    <div class="analysis-kv"><span>\\(\\langle Y \\rangle\\) on q${qubit}</span><b>${fmtNum(ey)}</b></div>
    <div class="analysis-kv"><span>\\(\\langle Z \\rangle\\) on q${qubit}</span><b>${fmtNum(ez)}</b></div>
    <div class="analysis-note">Range is [−1, +1] for each expectation value.</div>
  `;

  fidEl.innerHTML = `
    <div class="analysis-kv"><span>Fidelity to ${formatBasisLabel(targetIndex, n)}</span><b>${fidelity.toFixed(4)}</b></div>
    <div class="analysis-note">Using \\(F=\\langle \\psi_{\\mathrm{target}}|\\rho|\\psi_{\\mathrm{target}}\\rangle\\) for basis target states.</div>
  `;

  purityEl.innerHTML = `
    <div class="analysis-kv"><span>\\(\\mathrm{Tr}(\\rho^2)\\)</span><b>${purity.toFixed(4)}</b></div>
    <div class="analysis-note">${purity < 0.999 ? 'Mixed state (purity < 1).' : 'Pure state (purity = 1).'}</div>
  `;
}

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
    parts.push(`<div style="font-family:var(--mono);font-size:10px;color:var(--ink-faint);letter-spacing:0.1em;margin-bottom:12px">Pure state: \\(\\rho=|\\psi\\rangle\\langle\\psi|\\) · \\(\\mathrm{Tr}(\\rho^2)=1.000\\)</div>`);
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
    \\(\\mathrm{Tr}(\\rho)\\) = ${trace.toFixed(3)} · \\(\\mathrm{Tr}(\\rho^2)\\) = ${purity.toFixed(3)} ${purity < 0.99 ? '· <span style="color:var(--amber)">mixed state</span>' : '· pure state'}
  </div>`);

  parts.push(`</div>`);

  el.innerHTML = parts.join('');
  updateShotsLabel(result);
}

function densityColor(t, isDiagonal) {
  // t ∈ [0,1]. Fade from bg-2 to accent blue; diagonals use phos-rgb, off-diagonals a cyan tint.
  if (t < 0.01) return 'var(--bg-2)';
  const r = isDiagonal ? 120 : 111;
  const g = isDiagonal ? 212 : 212;
  const b = isDiagonal ? 255 : 224;
  // blend from bg-2 to (r,g,b) as t goes 0→1
  const mix = (a, b, t) => Math.round(a + (b - a) * t);
  const R = mix(20, r, t);
  const G = mix(26, g, t);
  const B = mix(34, b, t);
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
      } else if (g === 'SX') {
        text = `A <b>√X</b> (SX) on <code>q${t.qubit}</code> — a 90° rotation about the x-axis, so two in a row act like a Pauli <b>X</b> (up to global phase). Standard in the Clifford+T and native transmon layer.`;
      } else if (g === 'SY') {
        text = `A <b>√Y</b> (SY) on <code>q${t.qubit}</code> — a 90° rotation about the y-axis, the natural “half power” of Y.`;
      } else if (g === 'SZ') {
        text = `A <b>√Z</b> (SZ) on <code>q${t.qubit}</code> — in this lab it is the <b>S</b> gate, which applies a <code>π/2</code> phase to <code>|1⟩</code> (so (SZ)² = Z on the subspace, up to global phase).`;
      }
    } else if (t.kind === 'controlled') {
      if (t.gate === 'CNOT') {
        text = `A <b>CNOT</b> fires between control <code>q${t.control}</code> and target <code>q${t.target}</code>. The target flips <em>only if</em> the control is 1 — but if the control is in superposition, this binds the two qubits together. <span class="punch">This is where entanglement is born.</span>`;
      } else {
        text = `A <b>CZ</b> (controlled-Z) between <code>q${t.control}</code> and <code>q${t.target}</code>. The phase of the target flips only when the control is 1 — another way to entangle.`;
      }
    } else if (t.kind === 'swap2') {
      if (t.gate === 'SWAP') {
        text = `A <b>SWAP</b> exchanges the two qubit states on <code>q${t.a}</code> and <code>q${t.b}</code> — the quantum analogue of swapping two wires.`;
      } else {
        text = `An <b>iSWAP</b> on <code>q${t.a}</code> and <code>q${t.b}</code> swaps the two qubits and multiplies the <code>|01⟩↔|10⟩</code> swap by <code>i</code> — a natural native gate on many superconducting processors.`;
      }
    } else if (t.kind === 'ccx') {
      text = `A <b>Toffoli (CCX)</b>: the target <code>q${t.target}</code> is flipped <em>only if</em> both controls <code>q${t.ctrl0}</code> and <code>q${t.ctrl1}</code> are <code>1</code> — a universal three-qubit gate for reversible logic and oracles.`;
    } else if (t.kind === 'cswap') {
      text = `A <b>Fredkin (CSWAP)</b>: the two data lines <code>q${t.swap0}</code> and <code>q${t.swap1}</code> are swapped <em>only if</em> the control <code>q${t.control}</code> is <code>1</code>. Classically, it is controlled routing of bits.`;
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
    const gateCount = trace.filter(t => t.kind === 'single' || t.kind === 'controlled' || t.kind === 'swap2' || t.kind === 'ccx' || t.kind === 'cswap').length;
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

/* ---------------- CIRCUIT-TO-PULSE ANALYSIS ---------------- */
const PULSE_LIBRARY = {
  superconducting: {
    X: [{ label: 'Gaussian/DRAG π', duration: 32, color: 'var(--mint)' }],
    Y: [{ label: 'IQ phase-shifted π', duration: 32, color: 'var(--cyan)' }],
    Z: [{ label: 'virtual Z frame update', duration: 1, color: 'var(--amber)' }],
    H: [
      { label: 'X90 pulse', duration: 20, color: 'var(--cyan)' },
      { label: 'virtual Z', duration: 1, color: 'var(--amber)' }
    ],
    S: [{ label: 'virtual Z(π/2)', duration: 1, color: 'var(--amber)' }],
    T: [{ label: 'virtual Z(π/4)', duration: 1, color: 'var(--amber)' }],
    RX: [{ label: 'resonant drive (θ)', duration: 28, color: 'var(--mint)' }],
    RY: [{ label: 'quadrature drive (θ)', duration: 28, color: 'var(--cyan)' }],
    RZ: [{ label: 'virtual Z(θ)', duration: 1, color: 'var(--amber)' }],
    CZ: [
      { label: 'flux/parametric entangler', duration: 300, color: 'var(--magenta)' },
      { label: '1Q correction', duration: 30, color: 'var(--cyan)' },
      { label: 'virtual Z trims', duration: 1, color: 'var(--amber)' }
    ],
    CNOT: [
      { label: 'echoed CR(+)', duration: 180, color: 'var(--magenta)' },
      { label: 'echoed CR(-)', duration: 180, color: 'var(--magenta)' },
      { label: '1Q correction', duration: 35, color: 'var(--cyan)' },
      { label: 'virtual Z', duration: 1, color: 'var(--amber)' }
    ],
    SWAP: [
      { label: 'flux entangler (3×)', duration: 280, color: 'var(--magenta)' },
      { label: 'single-qubit trims', duration: 24, color: 'var(--cyan)' }
    ],
    iSWAP: [
      { label: 'parametric iSWAP', duration: 260, color: 'var(--magenta)' },
      { label: 'phase frame', duration: 1, color: 'var(--amber)' }
    ],
    SX: [{ label: 'DRAG π/2 (sqrt-X)', duration: 18, color: 'var(--mint)' }],
    SY: [{ label: 'quadrature π/2', duration: 18, color: 'var(--cyan)' }],
    SZ: [{ label: 'virtual Z(π/2)', duration: 1, color: 'var(--amber)' }],
    CCX: [
      { label: '6× CNOT / phase', duration: 1200, color: 'var(--magenta)' },
      { label: 'single-qubit trim', duration: 20, color: 'var(--cyan)' }
    ],
    CSWAP: [
      { label: '2× Toffoli / ancilla', duration: 1400, color: 'var(--magenta)' },
      { label: 'virtual Z', duration: 1, color: 'var(--amber)' }
    ],
    M: [{ label: 'dispersive readout', duration: 400, color: 'var(--amber)' }]
  },
  trapped_ion: {
    X: [{ label: 'resonant Raman pulse', duration: 18000, color: 'var(--mint)' }],
    Y: [{ label: 'phase-shifted Raman pulse', duration: 18000, color: 'var(--cyan)' }],
    Z: [{ label: 'phase advance', duration: 5, color: 'var(--amber)' }],
    H: [
      { label: 'R_y(π/2)', duration: 15000, color: 'var(--cyan)' },
      { label: 'phase update', duration: 5, color: 'var(--amber)' }
    ],
    S: [{ label: 'phase advance (π/2)', duration: 5, color: 'var(--amber)' }],
    T: [{ label: 'phase advance (π/4)', duration: 5, color: 'var(--amber)' }],
    RX: [{ label: 'carrier rotation (θ)', duration: 16000, color: 'var(--mint)' }],
    RY: [{ label: 'carrier rotation (θ)', duration: 16000, color: 'var(--cyan)' }],
    RZ: [{ label: 'phase advance (θ)', duration: 5, color: 'var(--amber)' }],
    CZ: [{ label: 'Mølmer-Sørensen entangler + phases', duration: 120000, color: 'var(--magenta)' }],
    CNOT: [{ label: 'MS entangler + local rotations', duration: 150000, color: 'var(--magenta)' }],
    SWAP: [{ label: 'ion transport + MS', duration: 180000, color: 'var(--magenta)' }],
    iSWAP: [{ label: 'bichromatic MS (iSWAP)', duration: 160000, color: 'var(--magenta)' }],
    SX: [{ label: 'Raman π/2', duration: 12000, color: 'var(--mint)' }],
    SY: [{ label: 'phase-shifted Raman π/2', duration: 12000, color: 'var(--cyan)' }],
    SZ: [{ label: 'phase advance (π/2)', duration: 5, color: 'var(--amber)' }],
    CCX: [{ label: 'MS / CNOT chain', duration: 900000, color: 'var(--magenta)' }],
    CSWAP: [{ label: 'multi-qubit MS sequence', duration: 950000, color: 'var(--magenta)' }],
    M: [{ label: 'state-dependent fluorescence', duration: 250000, color: 'var(--amber)' }]
  },
  photonic: {
    X: [{ label: 'waveplate/interferometer unitary', duration: 100, color: 'var(--mint)' }],
    Y: [{ label: 'phase shifter + beamsplitter', duration: 120, color: 'var(--cyan)' }],
    Z: [{ label: 'phase shifter', duration: 50, color: 'var(--amber)' }],
    H: [{ label: '50:50 beamsplitter transform', duration: 110, color: 'var(--cyan)' }],
    S: [{ label: 'quarter-wave phase element', duration: 50, color: 'var(--amber)' }],
    T: [{ label: 'eighth-wave phase element', duration: 55, color: 'var(--amber)' }],
    RX: [{ label: 'programmable interferometer (θ)', duration: 120, color: 'var(--mint)' }],
    RY: [{ label: 'programmable interferometer (θ)', duration: 120, color: 'var(--cyan)' }],
    RZ: [{ label: 'phase shifter (θ)', duration: 50, color: 'var(--amber)' }],
    CZ: [{ label: 'measurement-induced entangler', duration: 2000, color: 'var(--magenta)' }],
    CNOT: [{ label: 'linear-optical CNOT + ancilla', duration: 2500, color: 'var(--magenta)' }],
    SWAP: [{ label: 'reconfigurable coupler', duration: 2200, color: 'var(--magenta)' }],
    iSWAP: [{ label: 'cavity-mediated iSWAP', duration: 2000, color: 'var(--magenta)' }],
    SX: [{ label: 'waveplate π/4', duration: 70, color: 'var(--mint)' }],
    SY: [{ label: 'tunable plate π/4', duration: 75, color: 'var(--cyan)' }],
    SZ: [{ label: 'phase shifter π/2', duration: 45, color: 'var(--amber)' }],
    CCX: [{ label: 'KLM-style block', duration: 8000, color: 'var(--magenta)' }],
    CSWAP: [{ label: 'controlled coupler', duration: 8500, color: 'var(--magenta)' }],
    M: [{ label: 'single-photon detector window', duration: 800, color: 'var(--amber)' }]
  }
};
const PLATFORM_LABELS = {
  superconducting: 'Superconducting',
  trapped_ion: 'Trapped ion',
  photonic: 'Photonic'
};
let pulseHardware = 'superconducting';
let pulseFocusGate = 'H';
let lastPulseSchedule = null;

function gateSegmentsForPlatform(gate, hardware) {
  const lib = PULSE_LIBRARY[hardware] || PULSE_LIBRARY.superconducting;
  return (lib[gate] || lib.X).map(seg => ({ ...seg }));
}

function gateDurationNs(gate, hardware) {
  return gateSegmentsForPlatform(gate, hardware).reduce((sum, seg) => sum + seg.duration, 0);
}

function buildPulseScheduleFromCircuit(hardware) {
  const lanes = Array.from({ length: circuit.nQubits }, () => []);
  let cursorNs = 0;
  let opIndex = 0;

  for (let c = 0; c < circuit.columns.length; c++) {
    const col = circuit.columns[c];
    const ops = [];
    const seen = new Set();
    for (let q = 0; q < circuit.nQubits; q++) {
      if (seen.has(q)) continue;
      const e = col[q];
      if (!e) continue;
      if (e.type === 'single') {
        ops.push({ gate: e.gate, qubits: [q] });
      } else if (e.type === 'meas') {
        ops.push({ gate: 'M', qubits: [q] });
      } else if (e.type === 'ctrl') {
        const target = e.partner;
        const tgtEntry = col[target];
        if (tgtEntry && tgtEntry.type === 'target') {
          ops.push({ gate: tgtEntry.gate === 'X' ? 'CNOT' : 'CZ', qubits: [q, target] });
          seen.add(target);
        }
      } else if (e.type === 'swap2') {
        const target = e.partner;
        const other = col[target];
        if (other && other.type === 'swap2' && other.gate === e.gate && other.partner === q) {
          if (q < target) ops.push({ gate: e.gate, qubits: [q, target] });
          seen.add(target);
        }
      } else if (e.type === 'ccx') {
        if (q === Math.min(e.ctrl0, e.ctrl1, e.target)) {
          ops.push({ gate: 'CCX', qubits: [e.ctrl0, e.ctrl1, e.target] });
          seen.add(e.ctrl0);
          seen.add(e.ctrl1);
          seen.add(e.target);
        }
      } else if (e.type === 'cswap') {
        if (q === Math.min(e.control, e.swap0, e.swap1)) {
          ops.push({ gate: 'CSWAP', qubits: [e.control, e.swap0, e.swap1] });
          seen.add(e.control);
          seen.add(e.swap0);
          seen.add(e.swap1);
        }
      }
    }
    if (!ops.length) continue;

    const colDuration = Math.max(...ops.map(op => gateDurationNs(op.gate, hardware)));
    for (const op of ops) {
      opIndex++;
      const segments = gateSegmentsForPlatform(op.gate, hardware);
      for (const q of op.qubits) {
        let localStart = cursorNs;
        segments.forEach(seg => {
          lanes[q].push({
            startNs: localStart,
            durationNs: seg.duration,
            label: seg.label,
            color: seg.color,
            gate: op.gate,
            opIndex
          });
          localStart += seg.duration;
        });
      }
    }
    cursorNs += colDuration;
  }

  return { lanes, totalNs: Math.max(cursorNs, 1), operationCount: opIndex };
}

function renderPulseTimelineFromSchedule(schedule) {
  const svg = document.getElementById('analysis-pulse-timeline');
  const explain = document.getElementById('analysis-pulse-explain');
  const source = document.getElementById('analysis-pulse-source');
  const tomoSvg = document.getElementById('analysis-pulse-tomo');
  const tomoNote = document.getElementById('analysis-pulse-tomo-note');
  if (!svg || !explain) return;

  const ns = 'http://www.w3.org/2000/svg';
  function mk(tag, attrs, text) {
    const e = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
    if (text) e.textContent = text;
    return e;
  }
  const nQ = schedule.lanes.length;
  const leftPad = 54;
  const rightPad = 18;
  const topPad = 16;
  const rowPitch = 30;
  const axisY = topPad + (nQ - 1) * rowPitch + 22;
  const width = 620;
  const height = Math.max(120, topPad + nQ * rowPitch + 34);
  const usableWidth = width - leftPad - rightPad;
  const pxPerNs = usableWidth / Math.max(schedule.totalNs, 1);
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.innerHTML = '';

  for (let q = 0; q < nQ; q++) {
    const y = topPad + q * rowPitch;
    svg.appendChild(mk('text', { x: 10, y: y + 4, 'font-family': 'var(--mono)', 'font-size': 10, fill: 'var(--ink-faint)' }, `q${q}`));
    svg.appendChild(mk('line', { x1: leftPad, y1: y, x2: width - rightPad, y2: y, stroke: 'var(--line-bright)', 'stroke-width': 1 }));
    for (const seg of schedule.lanes[q]) {
      const x = leftPad + seg.startNs * pxPerNs;
      const w = Math.max(3, seg.durationNs * pxPerNs);
      const highlight = seg.gate === pulseFocusGate;
      svg.appendChild(mk('rect', {
        x, y: y - 9, width: w, height: 18, fill: 'var(--bg-0)', stroke: seg.color, 'stroke-width': highlight ? 1.8 : 1
      }));
      if (w > 28) {
        svg.appendChild(mk('text', {
          x: x + w / 2, y: y + 3, 'text-anchor': 'middle', 'font-family': 'var(--mono)', 'font-size': 8, fill: seg.color
        }, `${seg.label} (${seg.durationNs} ns)`));
      }
    }
  }

  svg.appendChild(mk('line', { x1: leftPad, y1: axisY, x2: width - rightPad, y2: axisY, stroke: 'var(--ink-faint)', 'stroke-width': 1 }));
  const ticks = 5;
  for (let i = 0; i <= ticks; i++) {
    const t = i / ticks;
    const x = leftPad + t * usableWidth;
    const nsVal = Math.round(t * schedule.totalNs);
    svg.appendChild(mk('line', { x1: x, y1: axisY - 4, x2: x, y2: axisY + 4, stroke: 'var(--ink-faint)', 'stroke-width': 1 }));
    svg.appendChild(mk('text', { x, y: axisY + 16, 'text-anchor': 'middle', 'font-family': 'var(--mono)', 'font-size': 9, fill: 'var(--ink-faint)' }, `${nsVal} ns`));
  }
  svg.appendChild(mk('text', { x: width - rightPad, y: axisY + 28, 'text-anchor': 'end', 'font-family': 'var(--mono)', 'font-size': 9, fill: 'var(--ink-faint)' }, 'time'));

  const focusSegments = gateSegmentsForPlatform(pulseFocusGate, pulseHardware);
  const focusDuration = focusSegments.reduce((sum, seg) => sum + seg.duration, 0);
  explain.innerHTML = `
    <div class="analysis-kv"><span>Platform</span><b>${PLATFORM_LABELS[pulseHardware]}</b></div>
    <div class="analysis-kv"><span>Circuit operations mapped</span><b>${schedule.operationCount}</b></div>
    <div class="analysis-kv"><span>Total schedule time</span><b>${Math.round(schedule.totalNs)} ns</b></div>
    <div class="analysis-kv"><span>Focused gate</span><b>${pulseFocusGate} (~${focusDuration} ns)</b></div>
    <div class="analysis-note">Durations are schematic hardware-typical values for the selected platform. Single-qubit transmon examples: X ~20-40 ns, CZ ~200-400 ns.</div>
  `;
  if (source) {
    source.textContent = `Auto-linked to latest run circuit on ${PLATFORM_LABELS[pulseHardware]}. Palette focus: ${pulseFocusGate}.`;
  }

  if (tomoSvg) {
    tomoSvg.innerHTML = '';
    function tmk(tag, attrs, text) {
      const e = document.createElementNS(ns, tag);
      Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
      if (text) e.textContent = text;
      return e;
    }
    function pulseBox(x, yMid, w, label, color) {
      const y = yMid - 10;
      tomoSvg.appendChild(tmk('rect', {
        x, y, width: w, height: 20,
        fill: color, 'fill-opacity': 0.22,
        stroke: color, 'stroke-width': 1.2
      }));
      tomoSvg.appendChild(tmk('line', {
        x1: x + 2, y1: y + 2, x2: x + w - 2, y2: y + 18,
        stroke: color, 'stroke-opacity': 0.35, 'stroke-width': 1
      }));
      tomoSvg.appendChild(tmk('line', {
        x1: x + 2, y1: y + 18, x2: x + w - 2, y2: y + 2,
        stroke: color, 'stroke-opacity': 0.2, 'stroke-width': 1
      }));
      tomoSvg.appendChild(tmk('text', {
        x: x + w / 2, y: yMid + 3, 'text-anchor': 'middle',
        'font-family': 'var(--mono)', 'font-size': 9, fill: color
      }, label));
    }

    const prepTag = `${pulseFocusGate} prep`;
    const rows = [
      { axis: 'X tomography', prerot: 'Rᵧ(−π/2)' },
      { axis: 'Y tomography', prerot: 'Rₓ(+π/2)' },
      { axis: 'Z tomography', prerot: 'none' }
    ];
    rows.forEach((row, i) => {
      const y = 22 + i * 46;
      tomoSvg.appendChild(tmk('text', {
        x: 10, y: y + 3, 'font-family': 'var(--mono)', 'font-size': 9, fill: 'var(--ink-faint)'
      }, row.axis));
      tomoSvg.appendChild(tmk('line', {
        x1: 104, y1: y, x2: 398, y2: y,
        stroke: 'var(--line-bright)', 'stroke-width': 1.2
      }));
      pulseBox(118, y, 82, prepTag, 'var(--cyan)');
      if (row.prerot !== 'none') {
        pulseBox(224, y, 88, row.prerot, 'var(--amber)');
      } else {
        tomoSvg.appendChild(tmk('text', {
          x: 268, y: y + 4, 'text-anchor': 'middle', 'font-family': 'var(--mono)', 'font-size': 9, fill: 'var(--ink-faint)'
        }, 'direct'));
      }
      pulseBox(334, y, 58, 'M_z', 'var(--mint)');
    });
  }

  if (tomoNote) tomoNote.innerHTML = `<div class="analysis-note">Tomography panel keeps the selected palette gate as the operation under test while the left panel shows the full circuit-derived pulse timeline.</div>`;
}

function setPulseFocusGate(gate) {
  if (!gate || gate === 'M') return;
  pulseFocusGate = gate;
  renderPulseSection();
}

function renderPulseSection() {
  if (!lastPulseSchedule) {
    const source = document.getElementById('analysis-pulse-source');
    const explain = document.getElementById('analysis-pulse-explain');
    if (source) source.textContent = 'Run a circuit to auto-build a pulse schedule from your gate timeline.';
    if (explain) {
      const d = gateDurationNs(pulseFocusGate, pulseHardware);
      explain.innerHTML = `<div class="analysis-kv"><span>Platform</span><b>${PLATFORM_LABELS[pulseHardware]}</b></div><div class="analysis-kv"><span>Focused gate</span><b>${pulseFocusGate} (~${d} ns)</b></div><div class="analysis-note">Run the circuit to view the complete multi-rail pulse schedule.</div>`;
    }
    const preview = { lanes: [[...gateSegmentsForPlatform(pulseFocusGate, pulseHardware).map((seg, i) => ({ ...seg, startNs: i === 0 ? 0 : gateSegmentsForPlatform(pulseFocusGate, pulseHardware).slice(0, i).reduce((s, x) => s + x.duration, 0), durationNs: seg.duration, gate: pulseFocusGate }))]], totalNs: gateDurationNs(pulseFocusGate, pulseHardware), operationCount: 1 };
    renderPulseTimelineFromSchedule(preview);
    return;
  }
  renderPulseTimelineFromSchedule(lastPulseSchedule);
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
      setPulseFocusGate(btn.dataset.gate);
    });
    btn.addEventListener('dragend', () => btn.classList.remove('dragging'));
    btn.addEventListener('click', () => setPulseFocusGate(btn.dataset.gate));
  });
}

/* ---------------- NOISE SLIDER ---------------- */
function currentNoise() {
  const slider = document.getElementById('noise-slider');
  return slider ? parseFloat(slider.value) / 100 : 0;
}

/* ---------------- EXPORT (JSON / QASM / LaTeX / Markdown) ---------------- */
function trimExportColumns(columns, nQubits) {
  let last = -1;
  for (let c = 0; c < columns.length; c++) {
    const col = columns[c];
    if (!col) continue;
    for (let q = 0; q < nQubits; q++) {
      if (q < col.length && col[q]) {
        last = c;
        break;
      }
    }
  }
  if (last < 0) return [];
  return columns.slice(0, last + 1).map(col =>
    col.slice(0, nQubits).map(cell =>
      cell === null ? null : JSON.parse(JSON.stringify(cell))
    )
  );
}

function exportCircuitPayload() {
  const cols = trimExportColumns(circuit.columns, circuit.nQubits);
  return {
    format: 'quantum-lab-circuit',
    version: 1,
    nQubits: circuit.nQubits,
    columns: cols,
    simulator: {
      depolarizingProbabilityAfterGate: currentNoise()
    }
  };
}

function downloadExportBlob(filename, text, mime) {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function exportTimestampSlug() {
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
}

function singleGateToQASM(gate, qubit, angleDeg) {
  const q = `q[${qubit}]`;
  if (gate === 'RX' || gate === 'RY' || gate === 'RZ') {
    const deg = angleDeg !== undefined ? angleDeg : 90;
    const theta = (deg * Math.PI) / 180;
    return `${gate.toLowerCase()}(${theta}) ${q};`;
  }
  if (gate === 'SX') return `sx ${q};`;
  if (gate === 'SY') return `ry(1.5707963267948966) ${q};`;
  if (gate === 'SZ') return `s ${q};`;
  return `${gate.toLowerCase()} ${q};`;
}

function exportOpenQASM2() {
  const n = circuit.nQubits;
  const cols = trimExportColumns(circuit.columns, n);
  const trace = buildLogicalTrace(cols, n);
  let nMeas = 0;
  for (let i = 0; i < trace.length; i++) {
    if (trace[i].kind === 'meas') nMeas++;
  }
  const lines = [
    'OPENQASM 2.0;',
    'include "qelib1.inc";',
    `qreg q[${n}];`
  ];
  if (nMeas > 0) lines.push(`creg c[${nMeas}];`);
  let mi = 0;
  for (let i = 0; i < trace.length; i++) {
    const op = trace[i];
    if (op.kind === 'controlled') {
      if (op.gate === 'CNOT') lines.push(`cx q[${op.control}], q[${op.target}];`);
      else lines.push(`cz q[${op.control}], q[${op.target}];`);
    } else if (op.kind === 'swap2' && op.gate === 'SWAP') {
      const a = op.a, b = op.b;
      lines.push(`cx q[${a}], q[${b}];`);
      lines.push(`cx q[${b}], q[${a}];`);
      lines.push(`cx q[${a}], q[${b}];`);
    } else if (op.kind === 'swap2' && op.gate === 'iSWAP') {
      const a = op.a, b = op.b;
      lines.push(`// iSWAP on q[${a}], q[${b}] (no standard OpenQASM 2 built-in; use a native or decomposed sequence)`);
    } else if (op.kind === 'ccx') {
      lines.push(`ccx q[${op.ctrl0}], q[${op.ctrl1}], q[${op.target}];`);
    } else if (op.kind === 'cswap') {
      lines.push(`cswap q[${op.control}], q[${op.swap0}], q[${op.swap1}];`);
    } else if (op.kind === 'single') {
      lines.push(singleGateToQASM(op.gate, op.qubit, op.angleDeg));
    } else if (op.kind === 'meas') {
      lines.push(`measure q[${op.qubit}] -> c[${mi}];`);
      mi++;
    }
  }
  return lines.join('\n') + '\n';
}

function exportLaTeXSchedule() {
  const cols = trimExportColumns(circuit.columns, circuit.nQubits);
  const trace = buildLogicalTrace(cols, circuit.nQubits);
  const lines = [];
  lines.push('\\documentclass{article}');
  lines.push('\\usepackage{amsmath}');
  lines.push('\\usepackage{amssymb}');
  lines.push('\\begin{document}');
  lines.push('');
  lines.push('\\section*{Circuit export (gate schedule)}');
  lines.push(`\\paragraph{Lab layout.} ${circuit.nQubits} qubit(s), wires drawn with \\texttt{q_{n-1}} at the top through \\texttt{q_0} at the bottom (matching the simulator canvas).`);
  lines.push('\\begin{enumerate}');
  for (let i = 0; i < trace.length; i++) {
    const op = trace[i];
    let item = '';
    if (op.kind === 'controlled' && op.gate === 'CNOT') {
      item = `$\\mathrm{CNOT}$ with control $q_{${op.control}}$, target $q_{${op.target}}$`;
    } else if (op.kind === 'controlled' && op.gate === 'CZ') {
      item = `$\\mathrm{CZ}$ on $q_{${op.control}}$ and $q_{${op.target}}$`;
    } else if (op.kind === 'swap2' && op.gate === 'SWAP') {
      item = `$\\mathrm{SWAP}$ on $q_{${op.a}}$ and $q_{${op.b}}$`;
    } else if (op.kind === 'swap2' && op.gate === 'iSWAP') {
      item = `$\\mathrm{iSWAP}$ on $q_{${op.a}}$ and $q_{${op.b}}$`;
    } else if (op.kind === 'ccx') {
      item = `$\\mathrm{Toffoli}$ ($\\mathrm{CCX}$): controls $q_{${op.ctrl0}}$, $q_{${op.ctrl1}}$, target $q_{${op.target}}$`;
    } else if (op.kind === 'cswap') {
      item = `$\\mathrm{Fredkin}$ ($\\mathrm{CSWAP}$): control $q_{${op.control}}$, swap $q_{${op.swap0}}$, $q_{${op.swap1}}$`;
    } else if (op.kind === 'single') {
      const g = op.gate;
      if (g === 'RX' || g === 'RY' || g === 'RZ') {
        const axis = g[1].toLowerCase();
        const deg = op.angleDeg !== undefined ? op.angleDeg : 90;
        item = `$R_${axis}(${deg}^\\circ)$ on $q_{${op.qubit}}$`;
      } else if (g === 'SX' || g === 'SY' || g === 'SZ') {
        const ax = g[1].toLowerCase();
        item = `$\\sqrt{${ax.toUpperCase()}}$ on $q_{${op.qubit}}$`;
      } else {
        item = `$\\mathrm{${g}}$ on $q_{${op.qubit}}$`;
      }
    } else if (op.kind === 'meas') {
      item = `Measurement in the computational basis on $q_{${op.qubit}}$`;
    }
    lines.push(`  \\item ${item}`);
  }
  lines.push('\\end{enumerate}');
  lines.push('');
  lines.push('\\paragraph{Noise model (simulator UI).} Depolarizing probability per gate after unitary steps: ' + currentNoise().toFixed(4) + '.');
  lines.push('\\end{document}');
  lines.push('');
  return lines.join('\n');
}

function exportMarkdownSchedule() {
  const cols = trimExportColumns(circuit.columns, circuit.nQubits);
  const trace = buildLogicalTrace(cols, circuit.nQubits);
  const lines = [];
  lines.push('# Circuit export');
  lines.push('');
  lines.push(`- **Qubits:** ${circuit.nQubits}`);
  lines.push(`- **Depolarizing $p$ per gate (UI):** ${currentNoise().toFixed(4)}`);
  lines.push('');
  lines.push('| Step | Operation |');
  lines.push('| ---: | --- |');
  for (let i = 0; i < trace.length; i++) {
    const op = trace[i];
    let desc = '';
    if (op.kind === 'controlled' && op.gate === 'CNOT') {
      desc = `CNOT · control q_${op.control} → target q_${op.target}`;
    } else if (op.kind === 'controlled' && op.gate === 'CZ') {
      desc = `CZ · q_${op.control}, q_${op.target}`;
    } else if (op.kind === 'swap2' && op.gate === 'SWAP') {
      desc = `SWAP · q_${op.a}, q_${op.b}`;
    } else if (op.kind === 'swap2' && op.gate === 'iSWAP') {
      desc = `iSWAP · q_${op.a}, q_${op.b}`;
    } else if (op.kind === 'ccx') {
      desc = `CCX (Toffoli) · c q_${op.ctrl0}, q_${op.ctrl1} → t q_${op.target}`;
    } else if (op.kind === 'cswap') {
      desc = `CSWAP (Fredkin) · ctl q_${op.control}, swap q_${op.swap0}, q_${op.swap1}`;
    } else if (op.kind === 'single') {
      const g = op.gate;
      if (g === 'RX' || g === 'RY' || g === 'RZ') {
        const deg = op.angleDeg !== undefined ? op.angleDeg : 90;
        desc = `${g}(${deg}°) · q_${op.qubit}`;
      } else {
        desc = `${g} · q_${op.qubit}`;
      }
    } else if (op.kind === 'meas') {
      desc = `Measure · q_${op.qubit}`;
    }
    lines.push(`| ${i + 1} | ${desc} |`);
  }
  lines.push('');
  return lines.join('\n');
}

function runCircuitExport(kind) {
  const cols = trimExportColumns(circuit.columns, circuit.nQubits);
  const has = cols.some(col => col.some(e => e !== null));
  if (!has) {
    toast('Nothing to export — add at least one gate.', true);
    return;
  }
  const slug = exportTimestampSlug();
  if (kind === 'json') {
    downloadExportBlob(`circuit-export-${slug}.json`, JSON.stringify(exportCircuitPayload(), null, 2), 'application/json');
    toast('Downloaded JSON');
  } else if (kind === 'qasm') {
    downloadExportBlob(`circuit-export-${slug}.qasm`, exportOpenQASM2(), 'text/plain');
    toast('Downloaded OpenQASM 2');
  } else if (kind === 'latex') {
    downloadExportBlob(`circuit-export-${slug}.tex`, exportLaTeXSchedule(), 'text/plain');
    toast('Downloaded LaTeX');
  } else if (kind === 'markdown') {
    downloadExportBlob(`circuit-export-${slug}.md`, exportMarkdownSchedule(), 'text/markdown');
    toast('Downloaded Markdown');
  }
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

const exportFormatSelect = document.getElementById('export-format');
if (exportFormatSelect) {
  exportFormatSelect.addEventListener('change', () => {
    const v = exportFormatSelect.value;
    if (!v) return;
    runCircuitExport(v);
    exportFormatSelect.value = '';
  });
}

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
  lastPulseSchedule = buildPulseScheduleFromCircuit(pulseHardware);
  renderOutput();
  renderNarrative(result, circuit.nQubits);
  renderAnalysis(result, circuit.nQubits);
  renderPulseSection();
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
  lastPulseSchedule = null;
  dismissContextCard();
  document.getElementById('prob-output').innerHTML = '<div class="placeholder-output">Build a circuit and press run to see the outcome distribution.</div>';
  document.getElementById('narrative').innerHTML = '<div class="placeholder-output">A step-by-step reading of your circuit will appear here after you run it.</div>';
  document.getElementById('narrative').style.display = 'none';
  document.getElementById('narrative-chevron').style.transform = 'rotate(0deg)';
  document.getElementById('shots-label').textContent = '1024 shots · simulated';
  updateAnalysisSelectors();
  renderAnalysis(null, circuit.nQubits);
  renderPulseSection();
});

document.getElementById('qubit-plus').addEventListener('click', () => {
  if (circuit.nQubits < MAX_QUBITS) {
    resizeQubits(circuit.nQubits + 1);
    updateAnalysisSelectors();
    renderAnalysis(lastResult, circuit.nQubits);
  } else {
    toast('Max ' + MAX_QUBITS + ' qubits (simulator limit).', true);
  }
});
document.getElementById('qubit-minus').addEventListener('click', () => {
  if (circuit.nQubits > MIN_QUBITS) {
    resizeQubits(circuit.nQubits - 1);
    updateAnalysisSelectors();
    renderAnalysis(lastResult, circuit.nQubits);
  }
});

document.getElementById('analysis-qubit-select').addEventListener('change', () => {
  renderAnalysis(lastResult, circuit.nQubits);
});
document.getElementById('analysis-target-select').addEventListener('change', () => {
  renderAnalysis(lastResult, circuit.nQubits);
});
document.getElementById('analysis-hardware-select').addEventListener('change', (evt) => {
  pulseHardware = evt.target.value;
  if (lastResult) {
    lastPulseSchedule = buildPulseScheduleFromCircuit(pulseHardware);
  }
  renderPulseSection();
});

updateAnalysisSelectors();
renderAnalysis(null, circuit.nQubits);
renderPulseSection();
