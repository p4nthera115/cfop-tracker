import { useCallback, useEffect, useState } from 'react'
import type { Namespace } from './storage'
import { loadAlgChoices, loadCompleted, saveAlgChoices, saveCompleted } from './storage'
import type { AlgChoices } from './types'

/**
 * Which cases are learned, and which alg is preferred for each, for one set.
 * OLL and PLL are tracked independently under their own localStorage prefix.
 */
export function useProgress(ns: Namespace) {
  const [completed, setCompleted] = useState<Set<string>>(() => loadCompleted(ns))
  const [algChoices, setAlgChoices] = useState<AlgChoices>(() => loadAlgChoices(ns))

  // Remounting under a different namespace must not carry the old set's state.
  const [current, setCurrent] = useState(ns)
  if (current !== ns) {
    setCurrent(ns)
    setCompleted(loadCompleted(ns))
    setAlgChoices(loadAlgChoices(ns))
  }

  useEffect(() => saveCompleted(ns, completed), [ns, completed])
  useEffect(() => saveAlgChoices(ns, algChoices), [ns, algChoices])

  const toggleComplete = useCallback((id: string) => {
    setCompleted((prev) => {
      const next = new Set(prev)
      if (!next.delete(id)) next.add(id)
      return next
    })
  }, [])

  const chooseAlg = useCallback((id: string, index: number) => {
    setAlgChoices((prev) => ({ ...prev, [id]: index }))
  }, [])

  return { completed, algChoices, toggleComplete, chooseAlg }
}
