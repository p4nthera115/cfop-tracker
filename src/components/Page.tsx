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
    <section id={id} className="scroll-mt-32">
      <div className="mt-16 mb-6">
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
