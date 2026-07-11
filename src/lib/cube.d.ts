/** Types for the verified cube simulator in `cube.js`. */

/**
 * True if `alg` solves the case produced by `setup`, judged the way the given
 * set means it: `"OLL"` checks orientation only (F2L intact + top yellow),
 * `"PLL"` checks a full solve up to AUF. With no `set`, an exact full solve.
 */
export function solves(setup: string, alg: string, set?: string): boolean

/** Move count in HTM; whole-cube rotations (x/y/z) don't count. */
export function htm(alg: string): number

/** True if the string contains at least one recognisable move. */
export function isParseable(alg: string): boolean

/** `[face, amount]` pairs; amount is +1, -1 (prime) or +/-2 (double). */
export function parse(alg: string): [string, number][]
