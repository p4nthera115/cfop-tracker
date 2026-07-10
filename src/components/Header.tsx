import { NavLink } from "react-router-dom"
import { cn } from "@/lib/utils"
import { ProgressBar } from "./ProgressBar"

function switcherLink({ isActive }: { isActive: boolean }) {
  return cn(
    "font-mono text-sm transition-colors duration-150",
    "outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
  )
}

export function Header({
  done,
  total,
}: {
  set: string
  done: number
  total: number
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <nav aria-label="Algorithm set" className="flex items-center gap-3">
            {/* `end`, or "/" stays active on /pll. */}
            <NavLink to="/" end className={switcherLink}>
              OLL
            </NavLink>
            <NavLink to="/pll" className={switcherLink}>
              PLL
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
          <div className="flex items-center gap-3">
            <p className="text-sm">
              <span className="font-mono tabular-nums">{done}</span>
              <span className="text-muted-foreground">/{total}</span>
            </p>
            {/* The switcher costs the header ~90px, enough to push the row past
                a 320px viewport. The bar is the elastic part — the fraction
                beside it carries the number — so it gives up the width. */}
            <ProgressBar
              className="w-16 sm:w-24"
              value={done}
              max={total}
              label="Overall progress"
            />
          </div>
        </div>
      </div>
    </header>
  )
}
