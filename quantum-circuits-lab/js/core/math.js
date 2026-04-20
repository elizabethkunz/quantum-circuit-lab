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

// Probabilities per basis state
function probabilities(state) {
  return state.map(a => C.abs2(a));
}
