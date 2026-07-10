import type { CSSProperties } from 'react'

/**
 * The single source of truth for the sticker grid's dimensions, in px.
 *
 * These are handed to CSS as custom properties on `.sticker-grid` (see
 * `gridVars`) and used directly to place the SVG arrow overlay, so the two can
 * never drift apart: resize the grid here and the arrows follow.
 */
export const CELL = 30
export const BAR = 9
export const GAP = 2
export const EDGE_GAP = 4

/**
 * Outer tracks run wider than the bars themselves. The leftover, plus the grid
 * gap, is what separates each bar from the U face.
 */
export const BAR_TRACK = BAR + EDGE_GAP - GAP

/** 11 + 2 + 30 + 2 + 30 + 2 + 30 + 2 + 11 = 120px square */
export const SIZE = 2 * BAR_TRACK + 3 * CELL + 4 * GAP

/** Distance between the centres of two adjacent U-face cells. */
const PITCH = CELL + GAP

/**
 * Centre of inner-3x3 cell `i` (0-2) along either axis, in grid px. The inner
 * face starts one bar track and one gap in from the edge of the plan view.
 */
export function centre(i: number): number {
  return BAR_TRACK + GAP + CELL / 2 + i * PITCH
}

export const gridVars = {
  '--sticker-cell': `${CELL}px`,
  '--sticker-bar': `${BAR}px`,
  '--sticker-gap': `${GAP}px`,
  '--sticker-bar-track': `${BAR_TRACK}px`,
} as CSSProperties
