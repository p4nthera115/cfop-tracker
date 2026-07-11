/**
 * A single cell of the 5x5 plan view.
 *   true  -> sticker is oriented (yellow)
 *   false -> not oriented
 *   null  -> corner of the plan view, nothing there
 */
export type Cell = boolean | null

/** 5x5, row 0 = back, row 4 = front, col 0 = left, col 4 = right. */
export type Grid = Cell[][]

export interface OllCase {
  id: number
  name: string
  group: string
  grid: Grid
  setup: string
  algs: string[]
}

export interface OllData {
  groups: string[]
  cases: OllCase[]
}

/**
 * What `StickerGrid` actually paints, after each set normalises its own grid:
 * a face colour, the `dark` sentinel for an unoriented OLL sticker, or `null`
 * for the four corners of the plan view.
 *
 * Widened to `string` rather than a union of the five colour codes because
 * `resolveJsonModule` widens `"Y"` to `string`; keeping it loose lets `pll.json`
 * be assigned to `PllData` directly, so the JSON is still shape-checked at build
 * time instead of being cast through `unknown`. Unknown codes render as `dark`,
 * and `verify.py` is what actually guarantees the colours are right.
 */
export type StickerCell = string | null

export type StickerGrid = StickerCell[][]

/**
 * A piece that is out of place, and where it belongs. Coordinates are
 * `[row, col]` on the inner 3x3 U face, 0-indexed, row 0 = back, col 0 = left.
 */
export interface Arrow {
  /** `"corner"` or `"edge"`. Both draw as straight lines; kept for fidelity. */
  kind: string
  /** Where the piece currently sits. */
  frm: number[]
  /** Where it belongs. */
  to: number[]
}

export interface PllCase {
  /** The perm letter — "Ua", "Ja", "Gc". Not a number. */
  id: string
  name: string
  group: string
  /** 5x5 of colour codes `Y G R B O`, corners `null`. Inner 3x3 is always `Y`. */
  grid: StickerGrid
  setup: string
  algs: string[]
  arrows: Arrow[]
}

export interface PllData {
  groups: string[]
  cases: PllCase[]
}

/** case id -> index into that case's `algs`. Ids are stringified to share a shape. */
export type AlgChoices = Record<string, number>

/** Which alg a case shows big: a bundled default, or one the user added. */
export interface AlgSelection {
  source: 'default' | 'custom'
  index: number
}

/**
 * A case's user edits, layered over the read-only bundled `algs`. The visible
 * list is defaults (minus `hidden`) followed by `custom`; `selected` names the
 * primary. See [src/algState.ts](src/algState.ts) for how it's derived.
 */
export interface CaseAlgState {
  /** User-added algs, in order. */
  custom: string[]
  /** Indices of DEFAULT algs the user hid. */
  hidden: number[]
  selected: AlgSelection
}

/** case id -> its edits. Absent ids are untouched (all defaults, first selected). */
export type AlgStore = Record<string, CaseAlgState>
