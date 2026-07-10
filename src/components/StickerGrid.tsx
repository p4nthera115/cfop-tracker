import { useId } from 'react'
import type { Arrow, StickerCell, StickerGrid as Grid } from '../types'
import { SIZE, centre, gridVars } from './stickerGeometry'

/**
 * 5x5 plan view of the last layer. Front is at the bottom, back at the top.
 *
 *   rows 1-3 / cols 1-3   the U face itself
 *   row 0 / row 4         back / front side stickers
 *   col 0 / col 4         left / right side stickers
 *   four corners          null, render as nothing
 *
 * Shared by both sets: OLL normalises its booleans to colour codes at the call
 * site, PLL passes its colour codes straight through. Purely presentational —
 * cell value + position -> class name, plus an optional arrow overlay.
 */
export function StickerGrid({ grid, arrows }: { grid: Grid; arrows?: Arrow[] }) {
  return (
    <div className="sticker-grid" style={gridVars} aria-hidden="true">
      {grid.map((row, r) =>
        row.map((cell, c) => <div key={`${r}-${c}`} className={cellClass(cell, r, c)} />),
      )}
      {arrows && arrows.length > 0 ? <ArrowOverlay arrows={arrows} /> : null}
    </div>
  )
}

/** Colour code -> fill class. Anything unrecognised falls back to the dark fill. */
const FILL: Record<string, string> = {
  Y: 'sticker-yellow',
  G: 'sticker-green',
  R: 'sticker-red',
  B: 'sticker-blue',
  O: 'sticker-orange',
  dark: 'sticker-dark',
}

function cellClass(cell: StickerCell, r: number, c: number): string {
  if (cell === null) return 'sticker-cell'

  const fill = FILL[cell] ?? FILL.dark
  const inner = r >= 1 && r <= 3 && c >= 1 && c <= 3
  if (inner) return `sticker-cell sticker-face ${fill}`

  const side =
    r === 0
      ? 'sticker-bar-t'
      : r === 4
        ? 'sticker-bar-b'
        : c === 0
          ? 'sticker-bar-l'
          : 'sticker-bar-r'
  return `sticker-cell sticker-bar ${side} ${fill}`
}

/** How far each endpoint is pulled toward the line's midpoint, as a fraction of
 *  its length, so the heads clear the sticker edges. */
const INSET = 0.2

interface Segment {
  x1: number
  y1: number
  x2: number
  y2: number
  /** Two arrows that were exact reverses of each other, drawn as one line. */
  double: boolean
}

const samePoint = (p: number[], q: number[]) => p[0] === q[0] && p[1] === q[1]

/**
 * Collapse mutual swaps into single double-headed arrows. A 3-cycle has no
 * reverse pairs, so it survives as three separate single-headed arrows — which
 * is how PLL diagrams are conventionally drawn.
 */
function toSegments(arrows: Arrow[]): Segment[] {
  const paired = new Set<number>()
  const segments: Segment[] = []

  for (let i = 0; i < arrows.length; i++) {
    if (paired.has(i)) continue
    const a = arrows[i]
    let double = false

    for (let j = i + 1; j < arrows.length; j++) {
      if (paired.has(j)) continue
      const b = arrows[j]
      if (samePoint(a.frm, b.to) && samePoint(a.to, b.frm)) {
        paired.add(j)
        double = true
        break
      }
    }

    // Coordinates are [row, col] on the inner 3x3: row drives y, col drives x.
    const ax = centre(a.frm[1])
    const ay = centre(a.frm[0])
    const bx = centre(a.to[1])
    const by = centre(a.to[0])
    const dx = bx - ax
    const dy = by - ay

    segments.push({
      x1: ax + dx * INSET,
      y1: ay + dy * INSET,
      x2: bx - dx * INSET,
      y2: by - dy * INSET,
      double,
    })
  }

  return segments
}

const HEAD = 'M0 0 L10 5 L0 10 Z'

function ArrowOverlay({ arrows }: { arrows: Arrow[] }) {
  // Marker ids are document-global, so every card needs its own set.
  // `useId` yields ":r0:" — strip the colons before building `url(#...)`.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const head = `arrowhead-${uid}`
  const halo = `arrowhalo-${uid}`
  const segments = toSegments(arrows)

  return (
    <svg className="sticker-arrows" viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
      <defs>
        {/*
          `paint-order` would give a filled shape an outline in one pass, but a
          <line> has no fill to paint over its stroke. So each arrow is drawn
          twice: a dark 4px underlay, then the 2px white arrow on top. The heads
          follow the same two passes — the halo marker is the same triangle
          fattened by a dark stroke, so the outline wraps the tip too.
          `overflow: visible` keeps that stroke from being clipped to the viewBox.
        */}
        <marker
          id={halo}
          viewBox="0 0 10 10"
          refX="10"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          markerUnits="userSpaceOnUse"
          orient="auto-start-reverse"
          overflow="visible"
        >
          <path d={HEAD} fill="#09090b" stroke="#09090b" strokeWidth="4" strokeLinejoin="round" />
        </marker>
        <marker
          id={head}
          viewBox="0 0 10 10"
          refX="10"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          markerUnits="userSpaceOnUse"
          orient="auto-start-reverse"
          overflow="visible"
        >
          <path d={HEAD} fill="#fafafa" />
        </marker>
      </defs>

      {[
        { stroke: '#09090b', width: 4, marker: halo },
        { stroke: '#fafafa', width: 2, marker: head },
      ].map(({ stroke, width, marker }) => (
        <g key={stroke} stroke={stroke} strokeWidth={width} strokeLinecap="round">
          {segments.map((s, i) => (
            <line
              key={i}
              x1={s.x1}
              y1={s.y1}
              x2={s.x2}
              y2={s.y2}
              markerEnd={`url(#${marker})`}
              markerStart={s.double ? `url(#${marker})` : undefined}
            />
          ))}
        </g>
      ))}
    </svg>
  )
}
