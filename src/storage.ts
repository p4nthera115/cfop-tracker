import type { AlgChoices, AlgSelection, AlgStore, CaseAlgState } from './types'

/**
 * Each set keeps its own progress under its own prefix: `oll:completed`,
 * `pll:algChoice`, and so on.
 */
export type Namespace = 'oll' | 'pll'

function read<T>(key: string, fallback: T, parse: (value: unknown) => T | null): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    return parse(JSON.parse(raw)) ?? fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Private mode or quota exceeded: progress just won't persist.
  }
}

/**
 * Ids are strings now that PLL cases are named by letter. OLL wrote numbers
 * before the split, so coerce whatever comes back rather than dropping it.
 */
export function loadCompleted(ns: Namespace): Set<string> {
  return read(`${ns}:completed`, new Set<string>(), (value) =>
    Array.isArray(value)
      ? new Set(
          value
            .filter((v) => typeof v === 'string' || typeof v === 'number')
            .map((v) => String(v)),
        )
      : null,
  )
}

export function saveCompleted(ns: Namespace, completed: Set<string>): void {
  write(`${ns}:completed`, [...completed])
}

function loadAlgChoices(ns: Namespace): AlgChoices {
  return read(`${ns}:algChoice`, {}, (value) => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
    const out: AlgChoices = {}
    for (const [id, index] of Object.entries(value)) {
      if (typeof index === 'number') out[id] = index
    }
    return out
  })
}

function parseSelection(value: unknown): AlgSelection {
  if (
    typeof value === 'object' &&
    value !== null &&
    'source' in value &&
    'index' in value &&
    ((value as AlgSelection).source === 'default' || (value as AlgSelection).source === 'custom') &&
    typeof (value as AlgSelection).index === 'number' &&
    (value as AlgSelection).index >= 0
  ) {
    return { source: (value as AlgSelection).source, index: (value as AlgSelection).index }
  }
  return { source: 'default', index: 0 }
}

function parseCaseState(value: unknown): CaseAlgState | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const v = value as Record<string, unknown>
  const custom = Array.isArray(v.custom) ? v.custom.filter((s): s is string => typeof s === 'string') : []
  const hidden = Array.isArray(v.hidden)
    ? [...new Set(v.hidden.filter((n): n is number => typeof n === 'number' && n >= 0))]
    : []
  return { custom, hidden, selected: parseSelection(v.selected) }
}

function isDefaultState(s: CaseAlgState): boolean {
  return (
    s.custom.length === 0 &&
    s.hidden.length === 0 &&
    s.selected.source === 'default' &&
    s.selected.index === 0
  )
}

/**
 * The old `<ns>:algChoice` key was `id -> default index`. Fold any non-zero
 * pick into the new store as a default selection so nobody loses it; index 0 is
 * already the implicit default, so it needn't be stored.
 */
function migrateAlgChoices(ns: Namespace): AlgStore {
  const out: AlgStore = {}
  for (const [id, index] of Object.entries(loadAlgChoices(ns))) {
    if (index > 0) out[id] = { custom: [], hidden: [], selected: { source: 'default', index } }
  }
  return out
}

/**
 * User alg edits for a set, keyed by case id. Absent when the key is missing,
 * in which case we migrate the pre-split `algChoice` selections on first load.
 */
export function loadAlgStore(ns: Namespace): AlgStore {
  return read(`${ns}:algs`, migrateAlgChoices(ns), (value) => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
    const out: AlgStore = {}
    for (const [id, s] of Object.entries(value)) {
      const parsed = parseCaseState(s)
      if (parsed) out[id] = parsed
    }
    return out
  })
}

/** Persist the store, dropping untouched cases so it stays sparse. */
export function saveAlgStore(ns: Namespace, store: AlgStore): void {
  const pruned: AlgStore = {}
  for (const [id, s] of Object.entries(store)) {
    if (!isDefaultState(s)) pruned[id] = s
  }
  write(`${ns}:algs`, pruned)
}
