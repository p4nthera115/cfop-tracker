import { type ReactNode, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Navbar, type NavSection } from './Navbar'
import { ProgressBar } from './ProgressBar'

/**
 * HashRouter owns the fragment, so `<a href="#edges-only">` can't drive the
 * browser's native scroll-to-id any more. The nav links set only the hash part
 * of the route (`#/pll#edges-only`); this scrolls to whatever it names, which
 * also makes those URLs work as deep links on load. `scroll-mt-32` on the
 * section clears the sticky chrome.
 */
function useScrollToHash(hash: string): void {
  useEffect(() => {
    if (!hash) return
    document.getElementById(hash.slice(1))?.scrollIntoView()
  }, [hash])
}

/** The chrome every set shares: header, group nav, footer. */
export function Page({
  set,
  sections,
  active,
  done,
  total,
  footer,
  children,
}: {
  set: string
  sections: NavSection[]
  active: string
  done: number
  total: number
  footer: ReactNode
  children: ReactNode
}) {
  const { hash } = useLocation()
  useScrollToHash(hash)

  useEffect(() => {
    document.title = `${set} Cheat Sheet`
  }, [set])

  return (
    <>
      <Header set={set} done={done} total={total} />
      <Navbar active={active} sections={sections} label={`${set} groups`} />

      <main className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">{children}</main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-6 text-xs text-muted-foreground sm:px-6">
          {footer}
        </div>
      </footer>
    </>
  )
}

/** One group of cases: a heading, its own progress rule, and a grid of cards. */
export function CaseSection({
  group,
  id,
  done,
  total,
  children,
}: {
  group: string
  id: string
  done: number
  total: number
  children: ReactNode
}) {
  return (
    <section id={id} className="mt-16 scroll-mt-32">
      {/*
        Sticks under the header (56px) + navbar (41px) so the group and its
        progress stay visible while you're inside it; the next group's heading
        pushes this one out. 96px, not 97: landing flush on the navbar leaves a
        hairline of cards showing through wherever the browser rounds a
        fractional layout the other way, so it tucks a pixel *under* instead —
        the navbar is z-40 and paints over the overlap. The negative margins
        bleed the blurred backdrop across `main`'s padding, so cards don't
        scroll past it at the edges.
      */}
      <div className="sticky top-[96px] z-30 -mx-4 mb-6 bg-background/80 px-4 pt-3 pb-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-sm font-medium">{group}</h2>
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {done}/{total}
          </span>
        </div>
        {/* The section rule doubles as its progress bar. */}
        <ProgressBar
          className="mt-3 w-full"
          value={done}
          max={total}
          label={`${group} progress`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {children}
      </div>
    </section>
  )
}
