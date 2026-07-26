import { useEffect, useState } from 'react'
import { loadCompleted } from './storage'

/**
 * One-time in-app announcements, gated on the user actually using the tracker.
 * Seen ids live under a single forward-compatible key so future announcements
 * reuse it — an array, not a boolean, so each id retires independently.
 *
 *   localStorage["announcements:seen"] = ["brackets-2026-07"]
 */

const SEEN_KEY = 'announcements:seen'

/** The bracket-keyboard announcement. */
export const BRACKETS_ANNOUNCEMENT = 'brackets-2026-07'

function loadSeen(): string[] {
  try {
    const raw = localStorage.getItem(SEEN_KEY)
    if (raw === null) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
  } catch {
    return []
  }
}

function markSeen(id: string): void {
  try {
    const seen = loadSeen()
    if (seen.includes(id)) return
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen, id]))
  } catch {
    // Private mode or quota exceeded: it'll just be offered again next visit.
  }
}

/** Has the user marked at least one case learned in either set? */
function hasCompletedAny(): boolean {
  return loadCompleted('oll').size > 0 || loadCompleted('pll').size > 0
}

/**
 * Whether `id`'s banner should render, decided once on mount and read from
 * localStorage synchronously so it never flashes for someone who shouldn't see
 * it. Qualifying viewers are marked seen immediately — closing the tab without
 * dismissing still counts, making this genuinely one-time — while an unqualified
 * viewer is left untouched, so they get the announcement on a later visit once
 * they've started tracking.
 */
export function useAnnouncement(id: string): boolean {
  const [show] = useState(() => hasCompletedAny() && !loadSeen().includes(id))
  useEffect(() => {
    if (show) markSeen(id)
  }, [id, show])
  return show
}
