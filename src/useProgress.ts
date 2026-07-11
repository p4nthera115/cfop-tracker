import { useCallback, useEffect, useState } from 'react'
import { EMPTY_STATE, reconcile } from './algState'
import type { Namespace } from './storage'
import { loadAlgStore, loadCompleted, saveAlgStore, saveCompleted } from './storage'
import type { AlgSelection, AlgStore, CaseAlgState } from './types'

/**
 * The whole state layer for one set: which cases are learned, and each case's
 * alg edits (custom algs, hidden defaults, the selected primary). OLL and PLL
 * are tracked independently under their own localStorage prefix.
 *
 * Every mutation takes the case's bundled `defaults` so the selection can be
 * reconciled onto something visible — deleting or hiding the selected alg
 * auto-selects the first remaining one, and the store never persists a dangling
 * pick.
 */
export function useProgress(ns: Namespace) {
  const [completed, setCompleted] = useState<Set<string>>(() => loadCompleted(ns))
  const [algStore, setAlgStore] = useState<AlgStore>(() => loadAlgStore(ns))

  // Remounting under a different namespace must not carry the old set's state.
  const [current, setCurrent] = useState(ns)
  if (current !== ns) {
    setCurrent(ns)
    setCompleted(loadCompleted(ns))
    setAlgStore(loadAlgStore(ns))
  }

  useEffect(() => saveCompleted(ns, completed), [ns, completed])
  useEffect(() => saveAlgStore(ns, algStore), [ns, algStore])

  const toggleComplete = useCallback((id: string) => {
    setCompleted((prev) => {
      const next = new Set(prev)
      if (!next.delete(id)) next.add(id)
      return next
    })
  }, [])

  const update = useCallback(
    (id: string, defaults: string[], fn: (s: CaseAlgState) => CaseAlgState) => {
      setAlgStore((prev) => ({
        ...prev,
        [id]: reconcile(defaults, fn(prev[id] ?? EMPTY_STATE)),
      }))
    },
    [],
  )

  const selectAlg = useCallback(
    (id: string, defaults: string[], selected: AlgSelection) =>
      update(id, defaults, (s) => ({ ...s, selected })),
    [update],
  )

  const addCustom = useCallback(
    (id: string, defaults: string[], text: string) => {
      const alg = text.trim()
      if (!alg) return
      update(id, defaults, (s) => ({ ...s, custom: [...s.custom, alg] }))
    },
    [update],
  )

  const editCustom = useCallback(
    (id: string, defaults: string[], index: number, text: string) =>
      update(id, defaults, (s) => ({
        ...s,
        custom: s.custom.map((c, i) => (i === index ? text : c)),
      })),
    [update],
  )

  const deleteCustom = useCallback(
    (id: string, defaults: string[], index: number) =>
      update(id, defaults, (s) => {
        const custom = s.custom.filter((_, i) => i !== index)
        // Deletion reindexes `custom`; keep the selection on the same alg, and
        // let reconcile pick the first remaining one when the selected alg is
        // the one being removed (the -1 sentinel matches no item).
        let selected = s.selected
        if (selected.source === 'custom') {
          if (selected.index === index) selected = { source: 'custom', index: -1 }
          else if (selected.index > index) selected = { source: 'custom', index: selected.index - 1 }
        }
        return { ...s, custom, selected }
      }),
    [update],
  )

  const hideDefault = useCallback(
    (id: string, defaults: string[], index: number) =>
      update(id, defaults, (s) => ({ ...s, hidden: [...new Set([...s.hidden, index])] })),
    [update],
  )

  const showHidden = useCallback(
    (id: string, defaults: string[]) => update(id, defaults, (s) => ({ ...s, hidden: [] })),
    [update],
  )

  const getCaseState = useCallback(
    (id: string): CaseAlgState => algStore[id] ?? EMPTY_STATE,
    [algStore],
  )

  return {
    completed,
    toggleComplete,
    getCaseState,
    selectAlg,
    addCustom,
    editCustom,
    deleteCustom,
    hideDefault,
    showHidden,
  }
}
