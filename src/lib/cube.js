/**
 * A tiny sticker-permutation cube simulator, ported verbatim from `cube.py` at
 * the repo root — the same model `verify.py` uses to validate every bundled
 * algorithm. Kept faithful to the Python so the two never disagree: a browser
 * `solves()` and the build-time check answer identically.
 *
 * Public API used by the alg editor:
 *   solves(setup, alg)  -> true if `alg` solves the case produced by `setup`
 *   htm(alg)            -> move count in HTM (whole-cube rotations don't count)
 *   isParseable(alg)    -> true if the string contains at least one real move
 *
 * `solves` compares the actual resulting cube state, so it is tolerant of
 * notation (wide moves r/M, rotations, AUF) and only asks whether the case ends
 * solved. A leading `y` genuinely changes the result and will fail; a trailing
 * rotation is undone by normalize() and is fine — real cubing behaviour.
 */

const key = (v) => v.join(",")

// Rotations about each axis. s=+1 -> +90 (matches cube.py's rx/ry/rz).
const ROT = {
  x: ([x, y, z], s) => [x, -s * z, s * y],
  y: ([x, y, z], s) => [s * z, y, -s * x],
  z: ([x, y, z], s) => [-s * y, s * x, z],
}

// face -> [axis, layer predicate, sign for a clockwise turn]
const FACES = {
  U: ["y", (p) => p[1] === 1, -1],
  D: ["y", (p) => p[1] === -1, 1],
  R: ["x", (p) => p[0] === 1, -1],
  L: ["x", (p) => p[0] === -1, 1],
  F: ["z", (p) => p[2] === 1, -1],
  B: ["z", (p) => p[2] === -1, 1],
}
const WIDE = {
  u: ["y", (p) => p[1] >= 0, -1],
  d: ["y", (p) => p[1] <= 0, 1],
  r: ["x", (p) => p[0] >= 0, -1],
  l: ["x", (p) => p[0] <= 0, 1],
  f: ["z", (p) => p[2] >= 0, -1],
  b: ["z", (p) => p[2] <= 0, 1],
}
const SLICE = {
  M: ["x", (p) => p[0] === 0, 1],
  E: ["y", (p) => p[1] === 0, 1],
  S: ["z", (p) => p[2] === 0, -1],
}
const ROTS = {
  x: ["x", () => true, -1],
  y: ["y", () => true, -1],
  z: ["z", () => true, -1],
}
const ALL = { ...FACES, ...WIDE, ...SLICE, ...ROTS }

// home normal -> colour. Y up, W down, G front, B back, R right, O left.
const COLOR = {
  "0,1,0": "Y",
  "0,-1,0": "W",
  "0,0,1": "G",
  "0,0,-1": "B",
  "1,0,0": "R",
  "-1,0,0": "O",
}
const NORMALS = Object.keys(COLOR).map((k) => k.split(",").map(Number))

/** A fresh solved cube: one entry per face sticker as [pos, normal, colour]. */
function solved() {
  const st = []
  for (const x of [-1, 0, 1])
    for (const y of [-1, 0, 1])
      for (const z of [-1, 0, 1])
        for (const n of NORMALS)
          if (x * n[0] + y * n[1] + z * n[2] === 1)
            st.push([[x, y, z], n, COLOR[key(n)]])
  return st
}

function turn(st, face, amount) {
  const [axis, pred, s] = ALL[face]
  const f = ROT[axis]
  const n = (((amount % 4) + 4) % 4) // Python-style modulo: -1 -> 3 quarter turns
  for (let i = 0; i < n; i++)
    for (const stk of st)
      if (pred(stk[0])) {
        stk[0] = f(stk[0], s)
        stk[1] = f(stk[1], s)
      }
  return st
}

const TOK = /([UDRLFBudrlfbMESxyz])(w?)(2?)('?)(2?)/g

/**
 * [face, amount] pairs. amount is +1, -1 (prime) or +/-2 (double). Exported so
 * the notation editor can tokenise the same way the solver does — one parser,
 * so typing and tapping never disagree. Wide moves come back lowercased (`Rw`
 * -> `r`), and a malformed `R2'` normalises to amount -2 (a double).
 */
export function parse(alg) {
  const cleaned = alg
    .replace(/[()[\]+]/g, " ")
    // Anything that reads as a prime -> a straight apostrophe. Mobile keyboards
    // and copied-from-the-web algs use curly quotes / the prime glyph, and
    // dropping them silently turns `R'` into `R` — a wrong, "unsolvable" alg.
    .replace(/[‘’ʹʼ′´`â]/g, "'")
  const out = []
  for (const m of cleaned.matchAll(TOK)) {
    let [, fRaw, w, d1, p, d2] = m
    const f = w ? fRaw.toLowerCase() : fRaw
    let amt = 1
    if (d1 || d2) amt = 2
    if (p) amt = -amt
    out.push([f, amt])
  }
  return out
}

function apply(st, mv) {
  for (const [f, a] of mv) turn(st, f, a)
  return st
}

/** Rotate the whole cube so the U centre is yellow and the F centre green. */
function normalize(st) {
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const u = st.find((s) => key(s[0]) === "0,1,0")[2]
      const f = st.find((s) => key(s[0]) === "0,0,1")[2]
      if (u === "Y" && f === "G") return st
      turn(st, "y", 1)
    }
    turn(st, "x", 1)
  }
  throw new Error("cannot normalize cube")
}

/** The last-layer state produced by a setup, oriented U=yellow / F=green. */
function state(setup) {
  const st = solved()
  apply(st, parse(setup))
  normalize(st)
  return st
}

/** Every sticker on its home face — a fully solved cube. */
function allHome(st) {
  return st.every(([, n, c]) => COLOR[key(n)] === c)
}

/** F2L intact: everything below the top layer is home. The top may be anything. */
function f2lSolved(st) {
  return st.every(([pos, n, c]) => pos[1] >= 1 || COLOR[key(n)] === c)
}

/** The whole U face is yellow — the last layer is oriented (OLL complete). */
function topOriented(st) {
  return st.every(([, n, c]) => key(n) !== "0,1,0" || c === "Y")
}

/** Solved except possibly for a final U turn (AUF), which cubers don't count. */
function solvedUpToAuf(st) {
  if (allHome(st)) return true
  const work = st.map(([p, n, c]) => [p.slice(), n.slice(), c])
  for (let k = 0; k < 3; k++) {
    turn(work, "U", 1)
    if (allHome(work)) return true
  }
  return false
}

/**
 * Does `alg` solve the case produced by `setup`? Applies the alg, re-normalises
 * (so a trailing rotation is harmless), and asks the question the way a cuber
 * means it:
 *
 * - OLL only orients the last layer, so "solved" is: F2L intact and the whole U
 *   face yellow. The last-layer *permutation* is irrelevant — a valid OLL alg is
 *   free to leave any PLL behind, and AUF never matters for orientation.
 * - PLL permutes an already-oriented layer, so "solved" is: fully solved up to a
 *   final AUF, which algs are routinely quoted without.
 *
 * Strict full-solve checking (the old behaviour) wrongly flagged both: a correct
 * alg ending at a different angle looked "wrong".
 */
export function solves(setup, alg, set) {
  try {
    const st = state(setup)
    apply(st, parse(alg))
    normalize(st)
    if (set === "OLL") return f2lSolved(st) && topOriented(st)
    if (set === "PLL") return solvedUpToAuf(st)
    return allHome(st) // no set given: exact full solve
  } catch {
    return false
  }
}

/** Move count in HTM: every face/slice/wide turn is one, rotations are zero. */
export function htm(alg) {
  return parse(alg).filter(([f]) => f !== "x" && f !== "y" && f !== "z").length
}

/** True if the string contains at least one recognisable move. */
export function isParseable(alg) {
  return parse(alg).length > 0
}
