import { useEffect, useRef, useState } from 'react'

/**
 * Which section is currently under the top of the viewport.
 *
 * The root margin carves out a band just below the sticky chrome. Whichever
 * sections overlap that band are "visible"; the first one in `ids` order wins,
 * so scrolling up doesn't leave a later section highlighted.
 */
export function useActiveSection(ids: string[]): string {
  const [active, setActive] = useState(ids[0] ?? '')
  const idsRef = useRef(ids)
  idsRef.current = ids
  const key = ids.join('|')

  useEffect(() => {
    const visible = new Set<string>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id)
          else visible.delete(entry.target.id)
        }
        const first = idsRef.current.find((id) => visible.has(id))
        if (first) setActive(first)
      },
      // The top inset clears the sticky header (56px) plus navbar (41px).
      { rootMargin: '-104px 0px -65% 0px', threshold: 0 },
    )

    for (const id of key.split('|')) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [key])

  return active
}
