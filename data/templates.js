/* ---------------- EXAMPLES ---------------- */
const EXAMPLES = {
  superposition: {
    nQubits: 1,
    noisePreset: 0,
    place: (c) => {
      c.columns = Array(MIN_COLUMNS).fill(0).map(() => new Array(1).fill(null));
      c.columns[1][0] = { type: 'single', gate: 'H' };
      c.columns[3][0] = { type: 'meas' };
      return c;
    }
  },
  'gate-identity': {
    nQubits: 1,
    noisePreset: 0,
    place: (c) => {
      c.columns = Array(MIN_COLUMNS).fill(0).map(() => new Array(1).fill(null));
      // H, Z, H == X (on |0> → |1>)
      c.columns[1][0] = { type: 'single', gate: 'H' };
      c.columns[2][0] = { type: 'single', gate: 'Z' };
      c.columns[3][0] = { type: 'single', gate: 'H' };
      c.columns[5][0] = { type: 'meas' };
      return c;
    }
  },
  'phase-kickback': {
    nQubits: 2,
    noisePreset: 0,
    place: (c) => {
      c.columns = Array(MIN_COLUMNS).fill(0).map(() => new Array(2).fill(null));
      // q0: H → |+>;  q1: X then H → |->
      c.columns[1][0] = { type: 'single', gate: 'H' };
      c.columns[1][1] = { type: 'single', gate: 'X' };
      c.columns[2][1] = { type: 'single', gate: 'H' };
      // CNOT q0 -> q1 (kickback phase onto q0)
      c.columns[3][0] = { type: 'ctrl', partner: 1 };
      c.columns[3][1] = { type: 'target', gate: 'X', partner: 0 };
      // H on q0 to convert phase into bit
      c.columns[4][0] = { type: 'single', gate: 'H' };
      c.columns[6][0] = { type: 'meas' };
      c.columns[6][1] = { type: 'meas' };
      return c;
    }
  },
  bell: {
    nQubits: 2,
    noisePreset: 0,
    place: (c) => {
      c.columns = Array(MIN_COLUMNS).fill(0).map(() => new Array(2).fill(null));
      c.columns[1][0] = { type: 'single', gate: 'H' };
      c.columns[2][0] = { type: 'ctrl', partner: 1 };
      c.columns[2][1] = { type: 'target', gate: 'X', partner: 0 };
      c.columns[4][0] = { type: 'meas' };
      c.columns[4][1] = { type: 'meas' };
      return c;
    }
  },
  ghz: {
    nQubits: 3,
    noisePreset: 0,
    place: (c) => {
      c.columns = Array(MIN_COLUMNS).fill(0).map(() => new Array(3).fill(null));
      c.columns[1][0] = { type: 'single', gate: 'H' };
      c.columns[2][0] = { type: 'ctrl', partner: 1 };
      c.columns[2][1] = { type: 'target', gate: 'X', partner: 0 };
      c.columns[3][1] = { type: 'ctrl', partner: 2 };
      c.columns[3][2] = { type: 'target', gate: 'X', partner: 1 };
      c.columns[5][0] = { type: 'meas' };
      c.columns[5][1] = { type: 'meas' };
      c.columns[5][2] = { type: 'meas' };
      return c;
    }
  },
  'cz-entangler': {
    nQubits: 2,
    noisePreset: 0,
    place: (c) => {
      c.columns = Array(MIN_COLUMNS).fill(0).map(() => new Array(2).fill(null));
      // H on both, then CZ, then H on q1 → Bell
      c.columns[1][0] = { type: 'single', gate: 'H' };
      c.columns[1][1] = { type: 'single', gate: 'H' };
      c.columns[2][0] = { type: 'ctrl', partner: 1 };
      c.columns[2][1] = { type: 'target', gate: 'Z', partner: 0 };
      c.columns[3][1] = { type: 'single', gate: 'H' };
      c.columns[5][0] = { type: 'meas' };
      c.columns[5][1] = { type: 'meas' };
      return c;
    }
  },
  teleport: {
    nQubits: 3,
    noisePreset: 0,
    place: (c) => {
      c.columns = Array(10).fill(0).map(() => new Array(3).fill(null));
      c.columns[0][0] = { type: 'single', gate: 'X' };
      c.columns[1][1] = { type: 'single', gate: 'H' };
      c.columns[2][1] = { type: 'ctrl', partner: 2 };
      c.columns[2][2] = { type: 'target', gate: 'X', partner: 1 };
      c.columns[4][0] = { type: 'ctrl', partner: 1 };
      c.columns[4][1] = { type: 'target', gate: 'X', partner: 0 };
      c.columns[5][0] = { type: 'single', gate: 'H' };
      c.columns[6][1] = { type: 'ctrl', partner: 2 };
      c.columns[6][2] = { type: 'target', gate: 'X', partner: 1 };
      c.columns[7][0] = { type: 'ctrl', partner: 2 };
      c.columns[7][2] = { type: 'target', gate: 'Z', partner: 0 };
      c.columns[9][0] = { type: 'meas' };
      c.columns[9][1] = { type: 'meas' };
      c.columns[9][2] = { type: 'meas' };
      return c;
    }
  },
  deutsch: {
    nQubits: 2,
    noisePreset: 0,
    place: (c) => {
      c.columns = Array(MIN_COLUMNS).fill(0).map(() => new Array(2).fill(null));
      // Prepare q1 = |1>
      c.columns[0][1] = { type: 'single', gate: 'X' };
      // H on both
      c.columns[1][0] = { type: 'single', gate: 'H' };
      c.columns[1][1] = { type: 'single', gate: 'H' };
      // Oracle: CNOT (q0 -> q1). This represents the balanced function f(x) = x.
      c.columns[3][0] = { type: 'ctrl', partner: 1 };
      c.columns[3][1] = { type: 'target', gate: 'X', partner: 0 };
      // H on q0
      c.columns[4][0] = { type: 'single', gate: 'H' };
      c.columns[6][0] = { type: 'meas' };
      return c;
    }
  },
  superdense: {
    nQubits: 2,
    noisePreset: 0,
    place: (c) => {
      c.columns = Array(MIN_COLUMNS).fill(0).map(() => new Array(2).fill(null));
      // Bell pair shared
      c.columns[0][0] = { type: 'single', gate: 'H' };
      c.columns[1][0] = { type: 'ctrl', partner: 1 };
      c.columns[1][1] = { type: 'target', gate: 'X', partner: 0 };
      // Alice encodes "11" via X then Z on her qubit
      c.columns[3][0] = { type: 'single', gate: 'X' };
      c.columns[4][0] = { type: 'single', gate: 'Z' };
      // Bob decodes: CNOT then H
      c.columns[5][0] = { type: 'ctrl', partner: 1 };
      c.columns[5][1] = { type: 'target', gate: 'X', partner: 0 };
      c.columns[6][0] = { type: 'single', gate: 'H' };
      c.columns[7][0] = { type: 'meas' };
      c.columns[7][1] = { type: 'meas' };
      return c;
    }
  },
  'noisy-bell': {
    nQubits: 2,
    noisePreset: 3, // 3% depolarizing
    place: (c) => {
      c.columns = Array(MIN_COLUMNS).fill(0).map(() => new Array(2).fill(null));
      c.columns[1][0] = { type: 'single', gate: 'H' };
      c.columns[2][0] = { type: 'ctrl', partner: 1 };
      c.columns[2][1] = { type: 'target', gate: 'X', partner: 0 };
      c.columns[4][0] = { type: 'meas' };
      c.columns[4][1] = { type: 'meas' };
      return c;
    }
  },
  echo: {
    nQubits: 1,
    noisePreset: 0,
    place: (c) => {
      c.columns = Array(MIN_COLUMNS).fill(0).map(() => new Array(1).fill(null));
      c.columns[1][0] = { type: 'single', gate: 'X' };
      c.columns[2][0] = { type: 'single', gate: 'X' };
      c.columns[4][0] = { type: 'meas' };
      return c;
    }
  },
  'bitflip-encode': {
    nQubits: 3,
    noisePreset: 0,
    place: (c) => {
      c.columns = Array(MIN_COLUMNS).fill(0).map(() => new Array(3).fill(null));
      // Put logical qubit in |+>, then entangle with two helpers
      c.columns[1][0] = { type: 'single', gate: 'H' };
      c.columns[2][0] = { type: 'ctrl', partner: 1 };
      c.columns[2][1] = { type: 'target', gate: 'X', partner: 0 };
      c.columns[3][0] = { type: 'ctrl', partner: 2 };
      c.columns[3][2] = { type: 'target', gate: 'X', partner: 0 };
      c.columns[5][0] = { type: 'meas' };
      c.columns[5][1] = { type: 'meas' };
      c.columns[5][2] = { type: 'meas' };
      return c;
    }
  },

  /* ----- Rotation gate templates ----- */
  'ry-super': {
    nQubits: 1,
    noisePreset: 0,
    place: (c) => {
      c.columns = Array(MIN_COLUMNS).fill(0).map(() => new Array(1).fill(null));
      // Ry(90°) is H-like (creates superposition on real axis)
      c.columns[1][0] = { type: 'single', gate: 'RY', angleDeg: 90 };
      c.columns[3][0] = { type: 'meas' };
      return c;
    }
  },
  'biased-coin': {
    nQubits: 1,
    noisePreset: 0,
    place: (c) => {
      c.columns = Array(MIN_COLUMNS).fill(0).map(() => new Array(1).fill(null));
      // Ry(60°) gives a biased coin ~25/75
      c.columns[1][0] = { type: 'single', gate: 'RY', angleDeg: 60 };
      c.columns[3][0] = { type: 'meas' };
      return c;
    }
  },
  'rot-chain': {
    nQubits: 1,
    noisePreset: 0,
    place: (c) => {
      c.columns = Array(MIN_COLUMNS).fill(0).map(() => new Array(1).fill(null));
      // Ry(90°) then Rz(180°) then Ry(-90°) equivalent to X (Euler angles)
      c.columns[1][0] = { type: 'single', gate: 'RY', angleDeg: 90 };
      c.columns[2][0] = { type: 'single', gate: 'RZ', angleDeg: 180 };
      c.columns[3][0] = { type: 'single', gate: 'RY', angleDeg: 270 }; // -90 equivalent
      c.columns[5][0] = { type: 'meas' };
      return c;
    }
  },

  /* ----- Deutsch–Jozsa n=2 full ----- */
  'dj-constant': {
    nQubits: 3,
    noisePreset: 0,
    place: (c) => {
      c.columns = Array(MIN_COLUMNS).fill(0).map(() => new Array(3).fill(null));
      // Initialize ancilla (q2) to |1>
      c.columns[0][2] = { type: 'single', gate: 'X' };
      // H on all three
      c.columns[1][0] = { type: 'single', gate: 'H' };
      c.columns[1][1] = { type: 'single', gate: 'H' };
      c.columns[1][2] = { type: 'single', gate: 'H' };
      // Constant oracle = identity (nothing happens)
      // Final H on input register
      c.columns[3][0] = { type: 'single', gate: 'H' };
      c.columns[3][1] = { type: 'single', gate: 'H' };
      c.columns[5][0] = { type: 'meas' };
      c.columns[5][1] = { type: 'meas' };
      return c;
    }
  },
  'dj-balanced': {
    nQubits: 3,
    noisePreset: 0,
    place: (c) => {
      c.columns = Array(MIN_COLUMNS).fill(0).map(() => new Array(3).fill(null));
      c.columns[0][2] = { type: 'single', gate: 'X' };
      c.columns[1][0] = { type: 'single', gate: 'H' };
      c.columns[1][1] = { type: 'single', gate: 'H' };
      c.columns[1][2] = { type: 'single', gate: 'H' };
      // Balanced oracle: f(x) = x0 XOR x1 → CNOT from q0 to q2, then CNOT from q1 to q2
      c.columns[2][0] = { type: 'ctrl', partner: 2 };
      c.columns[2][2] = { type: 'target', gate: 'X', partner: 0 };
      c.columns[3][1] = { type: 'ctrl', partner: 2 };
      c.columns[3][2] = { type: 'target', gate: 'X', partner: 1 };
      c.columns[4][0] = { type: 'single', gate: 'H' };
      c.columns[4][1] = { type: 'single', gate: 'H' };
      c.columns[6][0] = { type: 'meas' };
      c.columns[6][1] = { type: 'meas' };
      return c;
    }
  },

  /* ----- Bernstein–Vazirani ----- */
  'bv': {
    nQubits: 4,
    noisePreset: 0,
    place: (c) => {
      // BV: recover secret string s=101 with 1 query. Oracle computes f(x) = x · s (mod 2).
      c.columns = Array(10).fill(0).map(() => new Array(4).fill(null));
      // ancilla |1>
      c.columns[0][3] = { type: 'single', gate: 'X' };
      // H on all
      c.columns[1][0] = { type: 'single', gate: 'H' };
      c.columns[1][1] = { type: 'single', gate: 'H' };
      c.columns[1][2] = { type: 'single', gate: 'H' };
      c.columns[1][3] = { type: 'single', gate: 'H' };
      // Oracle: s = 101 → CNOT from q0 and q2 to ancilla
      c.columns[2][0] = { type: 'ctrl', partner: 3 };
      c.columns[2][3] = { type: 'target', gate: 'X', partner: 0 };
      c.columns[3][2] = { type: 'ctrl', partner: 3 };
      c.columns[3][3] = { type: 'target', gate: 'X', partner: 2 };
      // H on input register
      c.columns[4][0] = { type: 'single', gate: 'H' };
      c.columns[4][1] = { type: 'single', gate: 'H' };
      c.columns[4][2] = { type: 'single', gate: 'H' };
      c.columns[6][0] = { type: 'meas' };
      c.columns[6][1] = { type: 'meas' };
      c.columns[6][2] = { type: 'meas' };
      return c;
    }
  },

  /* ----- Variational / parameterized ----- */
  'ry-ansatz': {
    nQubits: 2,
    noisePreset: 0,
    place: (c) => {
      c.columns = Array(MIN_COLUMNS).fill(0).map(() => new Array(2).fill(null));
      // Single-layer VQE ansatz: Ry rotations + entangler
      c.columns[1][0] = { type: 'single', gate: 'RY', angleDeg: 60 };
      c.columns[1][1] = { type: 'single', gate: 'RY', angleDeg: 120 };
      c.columns[2][0] = { type: 'ctrl', partner: 1 };
      c.columns[2][1] = { type: 'target', gate: 'X', partner: 0 };
      c.columns[3][0] = { type: 'single', gate: 'RY', angleDeg: 45 };
      c.columns[3][1] = { type: 'single', gate: 'RY', angleDeg: 30 };
      c.columns[5][0] = { type: 'meas' };
      c.columns[5][1] = { type: 'meas' };
      return c;
    }
  },
  'qaoa-layer': {
    nQubits: 3,
    noisePreset: 0,
    place: (c) => {
      c.columns = Array(10).fill(0).map(() => new Array(3).fill(null));
      // Initial mixer: H on all
      c.columns[1][0] = { type: 'single', gate: 'H' };
      c.columns[1][1] = { type: 'single', gate: 'H' };
      c.columns[1][2] = { type: 'single', gate: 'H' };
      // Cost layer: CNOT + Rz on neighbors
      c.columns[2][0] = { type: 'ctrl', partner: 1 };
      c.columns[2][1] = { type: 'target', gate: 'X', partner: 0 };
      c.columns[3][1] = { type: 'single', gate: 'RZ', angleDeg: 60 };
      c.columns[4][0] = { type: 'ctrl', partner: 1 };
      c.columns[4][1] = { type: 'target', gate: 'X', partner: 0 };
      c.columns[5][1] = { type: 'ctrl', partner: 2 };
      c.columns[5][2] = { type: 'target', gate: 'X', partner: 1 };
      c.columns[6][2] = { type: 'single', gate: 'RZ', angleDeg: 90 };
      c.columns[7][1] = { type: 'ctrl', partner: 2 };
      c.columns[7][2] = { type: 'target', gate: 'X', partner: 1 };
      // Mixer layer: Rx on all
      c.columns[8][0] = { type: 'single', gate: 'RX', angleDeg: 45 };
      c.columns[8][1] = { type: 'single', gate: 'RX', angleDeg: 45 };
      c.columns[8][2] = { type: 'single', gate: 'RX', angleDeg: 45 };
      return c;
    }
  },
  'hea': {
    nQubits: 3,
    noisePreset: 0,
    place: (c) => {
      c.columns = Array(MIN_COLUMNS).fill(0).map(() => new Array(3).fill(null));
      // Hardware-efficient ansatz (1 layer): Ry, Rz, entangler ring
      c.columns[1][0] = { type: 'single', gate: 'RY', angleDeg: 75 };
      c.columns[1][1] = { type: 'single', gate: 'RY', angleDeg: 45 };
      c.columns[1][2] = { type: 'single', gate: 'RY', angleDeg: 110 };
      c.columns[2][0] = { type: 'single', gate: 'RZ', angleDeg: 30 };
      c.columns[2][1] = { type: 'single', gate: 'RZ', angleDeg: 60 };
      c.columns[2][2] = { type: 'single', gate: 'RZ', angleDeg: 90 };
      // Entangler: linear chain
      c.columns[3][0] = { type: 'ctrl', partner: 1 };
      c.columns[3][1] = { type: 'target', gate: 'X', partner: 0 };
      c.columns[4][1] = { type: 'ctrl', partner: 2 };
      c.columns[4][2] = { type: 'target', gate: 'X', partner: 1 };
      c.columns[6][0] = { type: 'meas' };
      c.columns[6][1] = { type: 'meas' };
      c.columns[6][2] = { type: 'meas' };
      return c;
    }
  }
};

/* ==========================================================================
   TEMPLATE CONTEXT CARDS
   ========================================================================== */
const TEMPLATE_CONTEXT = {
  superposition: {
    eyebrow: 'Foundations · F·01',
    title: 'Why superposition matters',
    color: 'var(--phos)',
    why: `This is the simplest quantum circuit that does something <em>genuinely impossible</em> for a classical bit. A classical coin is either heads or tails — even before you look. A qubit in superposition is <b>both at once</b>, with amplitudes that can interfere constructively or destructively before any measurement collapses them. Almost every quantum algorithm starts here.`,
    facts: ['50% |0⟩, 50% |1⟩ — every run', 'Measurement destroys the superposition', 'Basis of quantum parallelism']
  },
  'gate-identity': {
    eyebrow: 'Foundations · F·02',
    title: 'H·Z·H = X: same result, different path',
    color: 'var(--phos)',
    why: `The same logical operation can be built from different combinations of gates — a concept called <b>gate synthesis</b>. The identity H·Z·H = X says "a Z gate, viewed from the X basis, looks like an X gate." This kind of basis-change reasoning is how quantum algorithms are compiled to real hardware, where some gates are native and others must be emulated.`,
    facts: ['Output: |1⟩ with certainty', 'Z and X are related by a basis rotation', 'Used in hardware-aware compilation']
  },
  'phase-kickback': {
    eyebrow: 'Foundations · F·03',
    title: 'Phase kickback: the control learns from the target',
    color: 'var(--phos)',
    why: `Something subtle happens when a controlled gate acts on a qubit in an <b>eigenstate</b> of that gate — the phase gets "kicked back" onto the <em>control</em> qubit, not the target. This feels backwards, but it's the mechanism behind <b>Deutsch–Jozsa, Bernstein–Vazirani, phase estimation</b>, and ultimately Shor's algorithm. q0 measures 1 here because it absorbed the eigenphase of the CNOT acting on |−⟩.`,
    facts: ['q0 always measures 1 (kickback)', 'q1 stays in |−⟩ (eigenstate)', 'Core primitive for quantum algorithms']
  },
  bell: {
    eyebrow: 'Entanglement · E·01',
    title: 'The Bell pair: the simplest entangled state',
    color: 'var(--cyan)',
    why: `Two qubits in a Bell state have <b>no individual identity</b> — neither is 0 nor 1 on its own, yet they always agree when measured. John Bell proved in 1964 that this correlation is <em>stronger than anything classical physics can produce</em> — no shared hidden variables can explain it. The 2022 Nobel Prize in Physics was awarded for experiments confirming this. It's the foundation for quantum cryptography, teleportation, and superdense coding.`,
    facts: ['Only |00⟩ or |11⟩ ever appear', 'Violates Bell inequalities', 'Nobel Prize 2022 (Aspect, Clauser, Zeilinger)']
  },
  ghz: {
    eyebrow: 'Entanglement · E·02',
    title: 'GHZ: entanglement at scale',
    color: 'var(--cyan)',
    why: `The GHZ state (Greenberger–Horne–Zeilinger) extends Bell entanglement to three qubits. The key property: measuring <em>any one</em> qubit instantly determines the others, even though each one alone is completely random. GHZ states are used in <b>quantum sensing</b> (they beat the classical precision limit), foundational tests of reality, and as building blocks for many error-correction codes.`,
    facts: ['|000⟩ + |111⟩ — all or nothing', 'Resource state for quantum sensing', 'Maximally entangled across 3 qubits']
  },
  'cz-entangler': {
    eyebrow: 'Entanglement · E·03',
    title: 'CZ entangler: hardware matters',
    color: 'var(--cyan)',
    why: `On most <b>superconducting qubit</b> processors (Google, IBM, Rigetti), the CZ gate is native — meaning it's directly implemented by the hardware without any overhead. CNOT is not native; it's emulated as <code>(I⊗H)·CZ·(I⊗H)</code>. This circuit shows exactly that decomposition, producing an identical Bell state via the hardware-preferred route. Understanding native gate sets is essential for low-overhead quantum compilation.`,
    facts: ['Same Bell state as CNOT version', 'CZ is native on superconducting hardware', 'Relevant for circuit compilation & optimization']
  },
  teleport: {
    eyebrow: 'Algorithms · A·01',
    title: 'Teleportation: state transfer without moving the qubit',
    color: 'var(--magenta)',
    why: `Quantum teleportation transfers an unknown qubit state from q0 to q2 using only a pre-shared Bell pair and two classical bits of communication. The qubit itself <em>never travels</em>. Notice q2 always measures 1 (the teleported state) while q0 and q1 are uniformly random byproducts. This isn't science fiction — it's a real protocol used in <b>quantum networks and repeaters</b>, and a component of distributed quantum computing.`,
    facts: ['q2 always equals the input state', 'Requires pre-shared entanglement', 'Backbone of quantum networking']
  },
  deutsch: {
    eyebrow: 'Algorithms · A·02',
    title: 'Deutsch\'s algorithm: the first quantum speedup',
    color: 'var(--magenta)',
    why: `Deutsch's algorithm solves a toy problem — "is this black-box function constant or balanced?" — in a <b>single query</b>. Any classical algorithm needs two. It's a small advantage, but it was the first rigorous proof that quantum computers can outperform classical ones on a well-defined task. The key insight is <b>phase kickback + interference</b>: q0 measures 1 with certainty when the oracle is balanced, 0 when constant. Grover and Shor are generalisations of this idea.`,
    facts: ['1 query vs 2 classical', 'q0 = 1 → balanced oracle detected', 'First proven quantum speedup (1985)']
  },
  superdense: {
    eyebrow: 'Algorithms · A·03',
    title: 'Superdense coding: two bits in one qubit',
    color: 'var(--magenta)',
    why: `Given a pre-shared Bell pair, Alice can transmit <b>two classical bits</b> to Bob by sending only <em>one qubit</em>. She encodes her two bits by applying one of four simple gate combinations {I, X, Z, XZ} to her half of the entangled pair. Bob then decodes by running the inverse Bell circuit. Here Alice encodes "11" and Bob reads it back perfectly. This saturates the <b>Holevo bound</b> — the theoretical maximum information per qubit.`,
    facts: ['2 classical bits per 1 qubit sent', 'Requires pre-shared Bell pair', 'Saturates the Holevo bound']
  },
  'noisy-bell': {
    eyebrow: 'Noise & Hardware · N·01',
    title: 'What noise does to entanglement',
    color: 'var(--amber)',
    why: `A perfect Bell pair <em>never</em> produces |01⟩ or |10⟩. But real quantum hardware introduces small errors on every gate, and those errors accumulate. At 3% depolarizing noise you can already see the forbidden outcomes seeping in. This "leakage" into wrong states is called <b>decoherence</b>, and closing the gap between a clean simulation and a noisy real device is the central engineering challenge of the field — the reason <b>quantum error correction</b> exists.`,
    facts: ['Forbidden outcomes appear with noise', 'Noise rate ~0.1–1% on best hardware today', 'Try cranking the slider to 10%']
  },
  echo: {
    eyebrow: 'Noise & Hardware · N·02',
    title: 'The X·X echo: when trivial circuits fail',
    color: 'var(--amber)',
    why: `Two X gates in sequence are logically an identity — they should always return |0⟩ with certainty. With no noise, they do. <b>Crank the noise slider</b> and watch a "trivially correct" circuit silently accumulate errors until its output is indistinguishable from a random guess. Real quantum benchmarking uses exactly this kind of echo sequence — called <em>randomized benchmarking</em> — to measure a device's gate fidelity.`,
    facts: ['Should always output |0⟩', 'Used in randomized benchmarking', 'Try noise at 5%, 10%, 15%']
  },
  'bitflip-encode': {
    eyebrow: 'Noise & Hardware · N·03',
    title: 'A logical qubit: spreading information to protect it',
    color: 'var(--amber)',
    why: `Classical error correction works by copying bits. Quantum mechanics forbids copying — but it allows <b>entangling</b>. Here a single logical qubit (in superposition) is spread across three physical qubits as |000⟩ + |111⟩. The information lives in the <em>correlations</em>, not in any individual qubit. A single bit-flip error on any one qubit can then be detected and corrected by measuring parity without ever learning the underlying state. This is the seed idea behind the <b>surface code</b> used by Google and IBM.`,
    facts: ['Logical qubit encoded across 3 physical', 'Detects single bit-flip errors', 'Seed of the surface code']
  },

  /* --- Rotation gate contexts --- */
  'ry-super': {
    eyebrow: 'Rotations · R·01',
    title: 'Ry(90°) = Hadamard without the phase',
    color: 'var(--cyan)',
    why: `The Hadamard gate maps |0⟩ → (|0⟩+|1⟩)/√2, but it also carries a <em>phase</em> structure that isn't always wanted. <b>Ry(90°)</b> produces the same measurement distribution — 50/50 — but lands the Bloch vector on the positive y-axis with no phase baggage. This cleaner rotation is the default building block in most variational and ansatz circuits, where you want precise geometric control over states.`,
    facts: ['50% |0⟩, 50% |1⟩ (like H)', 'Real-valued amplitudes only', 'Standard block for VQE / QAOA']
  },
  'biased-coin': {
    eyebrow: 'Rotations · R·02',
    title: 'A biased quantum coin',
    color: 'var(--cyan)',
    why: `Unlike the H gate, rotation gates accept an arbitrary angle. <b>Ry(60°)</b> produces an <em>asymmetric</em> superposition — roughly 25% |1⟩, 75% |0⟩. This parameterized control is the engine behind amplitude-encoding schemes: you can represent any probability distribution on a qubit by choosing the right angle. <em>Drag the angle slider in the palette and re-drop</em> to try other ratios.`,
    facts: ['~25% |1⟩ at θ=60°', 'cos²(θ/2) gives P(|0⟩)', 'Parameterized amplitude encoding']
  },
  'rot-chain': {
    eyebrow: 'Rotations · R·03',
    title: 'Any gate, built from Ry and Rz',
    color: 'var(--cyan)',
    why: `A fundamental result in quantum computing: <b>any single-qubit unitary</b> can be written as Rz(γ)·Ry(β)·Rz(α) — three rotations are enough to reach any point on the Bloch sphere. This template demonstrates a specific case: Ry(90°)·Rz(180°)·Ry(−90°) = X (up to global phase). Real hardware compilers use this decomposition to translate arbitrary gates into the machine's native rotation primitives.`,
    facts: ['Euler-angle decomposition', 'Produces X equivalent', 'Used by real compilers (Qiskit, Cirq)']
  },

  /* --- DJ full contexts --- */
  'dj-constant': {
    eyebrow: 'Algorithms · A·04',
    title: 'Deutsch–Jozsa: constant oracle (full)',
    color: 'var(--phos)',
    why: `The full 3-qubit Deutsch–Jozsa circuit with a <b>constant</b> oracle (f(x) = 0 for all x). The oracle here is the identity — it does nothing. After the final Hadamard layer, the input register always measures <code>|00⟩</code>. A classical algorithm needs at least 3 queries in the worst case to be sure; this finishes in <b>1 oracle call</b>. See Tutorial 5 for a full walkthrough.`,
    facts: ['Input register → |00⟩ with certainty', 'Oracle = identity (f is constant)', 'Classical needs 3 queries; quantum needs 1']
  },
  'dj-balanced': {
    eyebrow: 'Algorithms · A·05',
    title: 'Deutsch–Jozsa: balanced oracle (full)',
    color: 'var(--phos)',
    why: `The same D-J circuit with a <b>balanced</b> oracle: f(x) = x₀ ⊕ x₁ (two CNOTs onto the ancilla). After the final Hadamard layer, the input register collapses to <code>|11⟩</code> — at least one bit is 1, confirming the function is not constant. The phase kickback through the |−⟩ ancilla is the mechanism that encodes f's structure as interference.`,
    facts: ['Input register → |11⟩ with certainty', 'Oracle = two CNOTs (f = x₀ ⊕ x₁)', 'Any non-zero output → balanced']
  },

  /* --- Bernstein–Vazirani --- */
  'bv': {
    eyebrow: 'Algorithms · A·06',
    title: 'Bernstein–Vazirani: recovering a secret string',
    color: 'var(--phos)',
    why: `Given an oracle f(x) = x · s (mod 2) where s is a hidden n-bit string, how quickly can you find s? Classically you need n queries — one for each bit. <b>Bernstein–Vazirani recovers s in a single query</b>. Here the secret is s = 101; after running, the input register measures exactly <code>|101⟩</code> with certainty. A subtle but important sharpening of Deutsch–Jozsa, often taught as its direct successor.`,
    facts: ['Secret s = 101 recovered in 1 query', 'Classical needs n queries', 'Same phase-kickback mechanism as D-J']
  },

  /* --- Variational contexts --- */
  'ry-ansatz': {
    eyebrow: 'Variational · V·01',
    title: 'A two-qubit VQE ansatz',
    color: 'var(--magenta)',
    why: `Variational quantum eigensolvers (<b>VQE</b>) minimize a cost function by tuning gate angles in a parameterized circuit. This is the simplest useful structure: Ry rotations, a CNOT entangler, then more Ry rotations. Real VQE runs stack many such blocks and use a classical optimizer (Adam, SPSA, COBYLA) to update the angles each iteration. <em>Change the angles in the palette slider</em> to explore different output distributions.`,
    facts: ['Parameterized Ry + CNOT + Ry', 'Core building block of VQE', 'Tunable via classical optimizer']
  },
  'qaoa-layer': {
    eyebrow: 'Variational · V·02',
    title: 'One QAOA layer (cost + mixer)',
    color: 'var(--magenta)',
    why: `The <b>Quantum Approximate Optimization Algorithm</b> (QAOA) alternates two kinds of layers: a <em>cost</em> layer (diagonal CNOT + Rz patterns encoding the problem) and a <em>mixer</em> layer (Rx rotations that explore new states). This template is a single pair of layers; production QAOA stacks p ≈ 5–10 pairs and tunes the Rz/Rx angles via a classical optimizer. Used for combinatorial optimization problems like MaxCut.`,
    facts: ['Cost layer: CNOT · Rz · CNOT', 'Mixer layer: Rx on all qubits', 'Applied to MaxCut, scheduling, TSP']
  },
  'hea': {
    eyebrow: 'Variational · V·03',
    title: 'Hardware-efficient ansatz',
    color: 'var(--magenta)',
    why: `A <b>hardware-efficient ansatz</b> uses only rotations and CNOTs that are <em>native</em> to the device — no SWAPs, no long-range interactions. This single-layer version has Ry and Rz on every qubit followed by a linear chain of CNOTs. Real hardware runs 3–8 such layers for chemistry or optimization problems. The ansatz is "expressive" (can represent many states) but has known trainability issues (<em>barren plateaus</em> — flat cost landscapes at high depth).`,
    facts: ['Only native gates (Ry, Rz, CNOT)', 'Used by IBM, Google, Rigetti', 'Known issue: barren plateaus at depth']
  }
};
