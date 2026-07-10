import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export interface NavSection {
  group: string
  id: string
}

export function Navbar({
  active,
  sections,
  label,
}: {
  active: string
  sections: NavSection[]
  label: string
}) {
  const listRef = useRef<HTMLDivElement>(null)

  // Keep the highlighted tab in view as the page scrolls past sections. Nudging
  // scrollLeft directly, rather than scrollIntoView, so the page never moves.
  useEffect(() => {
    const list = listRef.current
    const tab = list?.querySelector<HTMLElement>('[data-state="active"]')
    if (!list || !tab) return

    const l = list.getBoundingClientRect()
    const t = tab.getBoundingClientRect()
    if (t.left < l.left) list.scrollLeft += t.left - l.left - 24
    else if (t.right > l.right) list.scrollLeft += t.right - l.right + 24
  }, [active])

  return (
    <nav
      aria-label={label}
      className="sticky top-14 z-40 border-b border-border bg-background/80 backdrop-blur"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Tabs value={active} className="gap-0">
          <TabsList
            ref={listRef}
            variant="line"
            className="scrollbar-none w-full justify-start gap-6 overflow-x-auto rounded-none bg-transparent p-0 group-data-horizontal/tabs:h-10"
          >
            {sections.map(({ group, id }) => (
              <TabsTrigger
                key={id}
                value={id}
                asChild
                className={[
                  'h-full flex-none rounded-none border-0 bg-transparent px-0 text-sm shadow-none',
                  'transition-colors duration-150',
                  // Underline flush with the navbar's bottom border.
                  'group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:bottom-0 group-data-horizontal/tabs:after:h-0.5',
                  'outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                ].join(' ')}
              >
                {/*
                  Anchor links, not tab panels: every section stays mounted.
                  A bare `href="#id"` would collide with HashRouter, which owns
                  the fragment, so this is a Link that keeps the current route
                  and only sets the hash -> `#/pll#edges-only`. `Page` scrolls.
                  `type` is a button prop Radix would otherwise leak onto the
                  anchor; aria-controls is repointed at the section that exists.
                */}
                <Link to={{ hash: `#${id}` }} type={undefined} aria-controls={id}>
                  {group}
                </Link>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </nav>
  )
}
