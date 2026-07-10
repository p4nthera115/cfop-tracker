import ollRaw from '../oll.json'
import pllRaw from '../pll.json'
import type { Grid, OllCase, OllData, PllCase, PllData, StickerGrid } from './types'

export const oll: OllData = ollRaw
export const pll: PllData = pllRaw

/** "Fish Shapes" -> "fish-shapes", used for section ids and nav anchors. */
export function slug(group: string): string {
  return group
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export interface Section<T> {
  group: string
  id: string
  cases: T[]
}

function byGroup<T extends { group: string }>(groups: string[], cases: T[]): Section<T>[] {
  return groups.map((group) => ({
    group,
    id: slug(group),
    cases: cases.filter((c) => c.group === group),
  }))
}

/**
 * OLL stores booleans; `StickerGrid` speaks colour codes. An oriented sticker is
 * yellow, an unoriented one takes the `dark` fill — on the strips too, where it
 * reads as a side sticker that has not come up yet. `null` stays reserved for
 * the four corners of the plan view, which render as nothing.
 */
function toStickerGrid(grid: Grid): StickerGrid {
  return grid.map((row) => row.map((cell) => (cell === null ? null : cell ? 'Y' : 'dark')))
}

/** The `grid` an OLL case hands to `StickerGrid`, resolved once at module load. */
export type OllCaseView = OllCase & { sticker: StickerGrid }

const ollCases: OllCaseView[] = oll.cases.map((c) => ({ ...c, sticker: toStickerGrid(c.grid) }))

export const ollSections: Section<OllCaseView>[] = byGroup(oll.groups, ollCases)
export const pllSections: Section<PllCase>[] = byGroup(pll.groups, pll.cases)

export const ollCount = oll.cases.length
export const pllCount = pll.cases.length
