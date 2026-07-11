import type { AlgSelection, CaseAlgState } from './types'

/**
 * How a case's visible alg list and its selection are derived from the bundled
 * defaults plus the user's `CaseAlgState`. Pure and shared by `useProgress`
 * (which reconciles the persisted selection after every edit) and `CaseCard`
 * (which renders the list). Keeping it in one place is what guarantees a case
 * can never render with zero algs or a selection pointing at nothing.
 */

export const EMPTY_STATE: CaseAlgState = {
  custom: [],
  hidden: [],
  selected: { source: 'default', index: 0 },
}

export interface VisibleAlg {
  source: 'default' | 'custom'
  /** Index within its own list (defaults or custom), not the combined view. */
  index: number
  text: string
  /** Custom algs edit in place; defaults are read-only. */
  editable: boolean
}

/**
 * The algs a case shows, in order: shown defaults then custom. If the user has
 * hidden every default and added no custom, the list would be empty — so the
 * defaults are force-shown instead. `hidden` is left untouched in that case, so
 * adding a custom later hides them as intended.
 */
export function visibleAlgs(defaults: string[], state: CaseAlgState): VisibleAlg[] {
  const shownDefaults: VisibleAlg[] = defaults
    .map((text, index) => ({ source: 'default' as const, index, text, editable: false }))
    .filter((d) => !state.hidden.includes(d.index))
  const custom: VisibleAlg[] = state.custom.map((text, index) => ({
    source: 'custom' as const,
    index,
    text,
    editable: true,
  }))
  const list = [...shownDefaults, ...custom]
  if (list.length > 0) return list
  return defaults.map((text, index) => ({ source: 'default' as const, index, text, editable: false }))
}

/** The primary alg — the persisted selection, or the first visible if it's gone. */
export function selectedAlg(defaults: string[], state: CaseAlgState): VisibleAlg | undefined {
  const list = visibleAlgs(defaults, state)
  return (
    list.find((a) => a.source === state.selected.source && a.index === state.selected.index) ??
    list[0]
  )
}

/** Snap a state's selection back onto something visible after an edit. */
export function reconcile(defaults: string[], state: CaseAlgState): CaseAlgState {
  const sel = selectedAlg(defaults, state)
  if (!sel) return state
  const selected: AlgSelection = { source: sel.source, index: sel.index }
  if (selected.source === state.selected.source && selected.index === state.selected.index)
    return state
  return { ...state, selected }
}
