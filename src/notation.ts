import { parse } from '@/lib/cube'

/**
 * A move is a token: a face/slice/rotation symbol plus one mutually-exclusive
 * modifier. The two modifiers can never coexist — there is no `R2'` — because a
 * token holds exactly one `mod`. The notation keyboard operates on the token
 * array and derives the alg string from it, while free typing writes the string
 * and derives the tokens from it via `parse()`. One parser, so both stay in sync.
 */

export type Mod = '' | "'" | '2'

export interface Token {
  face: string
  mod: Mod
}

/** `parse()` gives a signed amount; collapse it to the token's single modifier. */
const MOD_FROM_AMT: Record<number, Mod> = { 1: '', [-1]: "'", 2: '2', [-2]: '2' }

/** Tokenise an alg string the same way the solver reads it. */
export function tokensFromAlg(alg: string): Token[] {
  return parse(alg).map(([face, amt]) => ({ face, mod: MOD_FROM_AMT[amt] ?? '' }))
}

/** The canonical string for a token array — always re-parseable, never `R2'`. */
export function algFromTokens(tokens: Token[]): string {
  return tokens.map((t) => t.face + t.mod).join(' ')
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
