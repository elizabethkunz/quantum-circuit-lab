/* =======================================================================
   QUANTUM SIMULATOR (browser-native, state-vector)
   Complex numbers as {re, im}. State is array of 2^n complex amplitudes.
   ======================================================================= */

const C = {
  add: (a,b) => ({re: a.re+b.re, im: a.im+b.im}),
  mul: (a,b) => ({re: a.re*b.re - a.im*b.im, im: a.re*b.im + a.im*b.re}),
  scale: (a,s) => ({re: a.re*s, im: a.im*s}),
  abs2: (a) => a.re*a.re + a.im*a.im,
  zero: {re:0, im:0},
  one:  {re:1, im:0},
  i:    {re:0, im:1}
};

// Single-qubit gate matrices (2x2, row-major, complex)
const GATES = {
  H: [
    [{re:1/Math.SQRT2,im:0},{re:1/Math.SQRT2,im:0}],
    [{re:1/Math.SQRT2,im:0},{re:-1/Math.SQRT2,im:0}]
  ],
  X: [[{re:0,im:0},{re:1,im:0}],[{re:1,im:0},{re:0,im:0}]],
  Y: [[{re:0,im:0},{re:0,im:-1}],[{re:0,im:1},{re:0,im:0}]],
  Z: [[{re:1,im:0},{re:0,im:0}],[{re:0,im:0},{re:-1,im:0}]],
  S: [[{re:1,im:0},{re:0,im:0}],[{re:0,im:0},{re:0,im:1}]],
  T: [[{re:1,im:0},{re:0,im:0}],[{re:0,im:0},{re:Math.SQRT1_2,im:Math.SQRT1_2}]]
};

// 4×4 two-qubit unitaries, row/column order |b₀ b₁⟩ with b₀ the lower-index qubit, then b₁
const SWAP4 = [
  [{re:1,im:0},{re:0,im:0},{re:0,im:0},{re:0,im:0}],
  [{re:0,im:0},{re:0,im:0},{re:1,im:0},{re:0,im:0}],
  [{re:0,im:0},{re:1,im:0},{re:0,im:0},{re:0,im:0}],
  [{re:0,im:0},{re:0,im:0},{re:0,im:0},{re:1,im:0}]
];
const ISWAP4 = [
  [{re:1,im:0},{re:0,im:0},{re:0,im:0},{re:0,im:0}],
  [{re:0,im:0},{re:0,im:0},{re:0,im:1},{re:0,im:0}],
  [{re:0,im:0},{re:0,im:1},{re:0,im:0},{re:0,im:0}],
  [{re:0,im:0},{re:0,im:0},{re:0,im:0},{re:1,im:0}]
];

// Apply a 4×4 gate on the qubit pair (qA, qB) in any order; lower index is the
// LSB in the 2-bit local subspace (matches applySingle / CNOT layout).
function applyTwoQubit(state, gate4, qA, qB, nQubits) {
  const p0 = Math.min(qA, qB);
  const p1 = Math.max(qA, qB);
  const m0 = 1 << p0;
  const m1 = 1 << p1;
  const dim = 1 << nQubits;
  const out = state.map(a => ({ re: a.re, im: a.im }));
  for (let base = 0; base < dim; base++) {
    if ((base & m0) !== 0 || (base & m1) !== 0) continue;
    const i0 = base;
    const i1 = base | m0;
    const i2 = base | m1;
    const i3 = base | m0 | m1;
    const v = [state[i0], state[i1], state[i2], state[i3]];
    for (let r = 0; r < 4; r++) {
      let sum = C.zero;
      for (let c = 0; c < 4; c++) {
        sum = C.add(sum, C.mul(gate4[r][c], v[c]));
      }
      if (r === 0) out[i0] = sum;
      else if (r === 1) out[i1] = sum;
      else if (r === 2) out[i2] = sum;
      else out[i3] = sum;
    }
  }
  return out;
}

// Build rotation gate matrix Rx(θ), Ry(θ), Rz(θ) for given angle in degrees
function makeRxGate(deg) {
  const t = deg * Math.PI / 180;
  const c = Math.cos(t/2), s = Math.sin(t/2);
  return [[{re:c,im:0},{re:0,im:-s}],[{re:0,im:-s},{re:c,im:0}]];
}
function makeRyGate(deg) {
  const t = deg * Math.PI / 180;
  const c = Math.cos(t/2), s = Math.sin(t/2);
  return [[{re:c,im:0},{re:-s,im:0}],[{re:s,im:0},{re:c,im:0}]];
}
function makeRzGate(deg) {
  const t = deg * Math.PI / 180;
  return [[{re:Math.cos(t/2),im:-Math.sin(t/2)},{re:0,im:0}],[{re:0,im:0},{re:Math.cos(t/2),im:Math.sin(t/2)}]];
}

// Current angle for rotation gates (in degrees)
let rotAngleDeg = 90;

function initState(n) {
  const dim = 1 << n;
  const s = new Array(dim).fill(0).map(() => ({re:0,im:0}));
  s[0] = {re:1, im:0};
  return s;
}

// Apply single-qubit gate to state.
// Qubit indexing: qubit 0 is the *least significant* bit of the basis state index.
// So for 3 qubits, basis state |q2 q1 q0> maps to index q2*4 + q1*2 + q0.
function applySingle(state, gate, target, nQubits) {
  const dim = 1 << nQubits;
  const out = new Array(dim).fill(0).map(() => ({re:0, im:0}));
  const mask = 1 << target;

  for (let i = 0; i < dim; i++) {
    if ((i & mask) === 0) {
      const j = i | mask;
      const a0 = state[i];
      const a1 = state[j];
      // |i>'s target bit is 0, |j>'s target bit is 1
      // new_a0 = g[0][0]*a0 + g[0][1]*a1
      // new_a1 = g[1][0]*a0 + g[1][1]*a1
      out[i] = C.add(C.mul(gate[0][0], a0), C.mul(gate[0][1], a1));
      out[j] = C.add(C.mul(gate[1][0], a0), C.mul(gate[1][1], a1));
    }
  }
  return out;
}

// Controlled gate (control, target, 2x2 unitary on target when control=1)
function applyControlled(state, gate, control, target, nQubits) {
  const dim = 1 << nQubits;
  const out = state.map(a => ({re:a.re, im:a.im})); // copy
  const cMask = 1 << control;
  const tMask = 1 << target;

  for (let i = 0; i < dim; i++) {
    if ((i & cMask) !== 0 && (i & tMask) === 0) {
      const j = i | tMask;
      const a0 = state[i];
      const a1 = state[j];
      out[i] = C.add(C.mul(gate[0][0], a0), C.mul(gate[0][1], a1));
      out[j] = C.add(C.mul(gate[1][0], a0), C.mul(gate[1][1], a1));
    }
  }
  return out;
}

// Toffoli: X on target iff both controls are |1⟩
function applyToffoli(state, ctrl0, ctrl1, target, nQubits) {
  const dim = 1 << nQubits;
  const out = state.map(a => ({ re: a.re, im: a.im }));
  const m0 = 1 << ctrl0;
  const m1 = 1 << ctrl1;
  const mt = 1 << target;
  for (let i = 0; i < dim; i++) {
    if ((i & m0) && (i & m1) && ((i & mt) === 0)) {
      const j = i | mt;
      out[i] = state[j];
      out[j] = state[i];
    }
  }
  return out;
}

// Fredkin (CSWAP): swap t0,t1 amplitudes iff control is |1⟩
function applyCSWAP(state, ctrl, t0, t1, nQubits) {
  const dim = 1 << nQubits;
  const mC = 1 << ctrl;
  const m0 = 1 << t0;
  const m1 = 1 << t1;
  function f(i) {
    if ((i & mC) === 0) return i;
    const ba = (i & m0) ? 1 : 0;
    const bb = (i & m1) ? 1 : 0;
    let j = i & ~m0 & ~m1;
    if (ba) j |= m1;
    if (bb) j |= m0;
    return j;
  }
  const out = new Array(dim);
  for (let i = 0; i < dim; i++) {
    out[f(i)] = state[i];
  }
  return out;
}

// √X, √Y as π/2 rotations; √Z ≡ S (principal Pauli square root on the |1⟩ branch)
GATES.SX = makeRxGate(90);
GATES.SY = makeRyGate(90);
GATES.SZ = [
  [{ re: 1, im: 0 }, { re: 0, im: 0 }],
  [{ re: 0, im: 0 }, { re: 0, im: 1 }]
]; // √Z = S = diag(1, i)

// Probabilities per basis state
function probabilities(state) {
  return state.map(a => C.abs2(a));
}
