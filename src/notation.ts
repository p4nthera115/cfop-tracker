/**
 * A sequence token is one of two kinds. A `move` is a face/slice/rotation
 * symbol plus one mutually-exclusive modifier — the two modifiers can never
 * coexist (there is no `R2'`) because a token holds exactly one `mod`. A
 * `bracket` is a lone `(` or `)`: pure visual grouping (sledgehammer, sexy
 * move), not a move — `cube.js`'s `parse()` strips it, so it never touches the
 * move count or validation. The notation keyboard operates on the token array
 * and derives the alg string from it, while free typing writes the string and
 * derives the tokens from it. One tokeniser, so both stay in sync.
 */

export type Mod = '' | "'" | '2'

export interface MoveToken {
  kind: 'move'
  face: string
  mod: Mod
}

export interface BracketToken {
  kind: 'bracket'
  char: '(' | ')'
}

export type Token = MoveToken | BracketToken

/** A signed turn amount collapses to the token's single modifier. */
const MOD_FROM_AMT: Record<number, Mod> = { 1: '', [-1]: "'", 2: '2', [-2]: '2' }

// Same move grammar as cube.js's TOK, plus a capture for a lone round bracket.
// Square brackets and `+` are dropped (below) before matching — commutator
// notation is deliberately unsupported.
const TOKENISE = /([UDRLFBudrlfbMESxyz])(w?)(2?)('?)(2?)|([()])/g

/**
 * Tokenise an alg string, preserving round brackets in place. Move parsing
 * mirrors cube.js's `parse()` (wide `Rw` -> `r`, curly quotes/prime -> `'`) so
 * typing and tapping never disagree; brackets are carried through as their own
 * token so the text field round-trips.
 */
export function tokensFromAlg(alg: string): Token[] {
  const cleaned = alg
    .replace(/[[\]+]/g, ' ')
    .replace(/[‘’ʹʼ′´`â]/g, "'")
  const out: Token[] = []
  for (const m of cleaned.matchAll(TOKENISE)) {
    const bracket = m[6]
    if (bracket) {
      out.push({ kind: 'bracket', char: bracket as '(' | ')' })
      continue
    }
    const [, fRaw, w, d1, p, d2] = m
    const face = w ? fRaw.toLowerCase() : fRaw
    let amt = 1
    if (d1 || d2) amt = 2
    if (p) amt = -amt
    out.push({ kind: 'move', face, mod: MOD_FROM_AMT[amt] ?? '' })
  }
  return out
}

/** The text of a single token. */
const tokenText = (t: Token): string => (t.kind === 'move' ? t.face + t.mod : t.char)

/**
 * The canonical string for a token array — always re-parseable, never `R2'`.
 * Moves are space-separated, but brackets sit flush against what they wrap:
 * `(R U R' U')`, not `( R U R' U' )`.
 */
export function algFromTokens(tokens: Token[]): string {
  let out = ''
  tokens.forEach((t, i) => {
    if (i > 0) {
      const prev = tokens[i - 1]
      const flush =
        (t.kind === 'bracket' && t.char === ')') ||
        (prev.kind === 'bracket' && prev.char === '(')
      if (!flush) out += ' '
    }
    out += tokenText(t)
  })
  return out
}

/** The bracket to insert next: `)` if there's an unclosed `(`, else `(`. */
export function nextBracket(tokens: Token[]): '(' | ')' {
  let depth = 0
  for (const t of tokens)
    if (t.kind === 'bracket') depth += t.char === '(' ? 1 : -1
  return depth > 0 ? ')' : '('
}

/**
 * Indices of bracket tokens that have no partner — an unclosed `(` or a stray
 * `)`. Advisory only: they don't affect validation, the UI just dims them.
 */
export function unmatchedBrackets(tokens: Token[]): Set<number> {
  const unmatched = new Set<number>()
  const open: number[] = []
  tokens.forEach((t, i) => {
    if (t.kind !== 'bracket') return
    if (t.char === '(') open.push(i)
    else if (open.length) open.pop()
    else unmatched.add(i)
  })
  for (const i of open) unmatched.add(i)
  return unmatched
}

/** Tapping a chip walks its modifier: none -> "'" -> "2" -> none. */
export function cycleMod(mod: Mod): Mod {
  return mod === '' ? "'" : mod === "'" ? '2' : ''
}

/** The palette, in prominence order. Faces are primary; rotations tertiary. */
export const PALETTE_FACES = ['R', 'L', 'U', 'D', 'F', 'B']
export const PALETTE_WIDE = ['r', 'l', 'u', 'd', 'f', 'b']
export const PALETTE_SLICE = ['M', 'E', 'S']
export const PALETTE_ROTATE = ['x', 'y', 'z']
