import type { AlgChoices } from './types'

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

export function loadAlgChoices(ns: Namespace): AlgChoices {
  return read(`${ns}:algChoice`, {}, (value) => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
    const out: AlgChoices = {}
    for (const [id, index] of Object.entries(value)) {
      if (typeof index === 'number') out[id] = index
    }
    return out
  })
}

export function saveAlgChoices(ns: Namespace, choices: AlgChoices): void {
  write(`${ns}:algChoice`, choices)
}
