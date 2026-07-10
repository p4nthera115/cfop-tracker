import { type ReactNode, useEffect, useRef, useState } from "react"
import { Check, ChevronDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import type { Arrow, StickerGrid as Grid } from "../types"
import { StickerGrid } from "./StickerGrid"

const label = "mb-1 text-[10px] uppercase tracking-wider text-muted-foreground"
const focusRing =
  "outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"

/**
 * Setup and Solution share one well shape, so they read as scramble and answer.
 * `min-h-8` rather than a fixed `h-8`: the longest alg (OLL 56, 34 chars) plus
 * a chevron overflows a card at the 4-column breakpoint, and clipping an
 * algorithm is not an option.
 */
const well =
  "flex min-h-8 w-full items-center gap-2 rounded-md border px-2 py-1.5 font-mono tracking-tight"

/** The answer: solid border, sunk into the card, full contrast. */
const algBox = `${well} border-border bg-background text-xs`

/** The scramble: same shape, recessive. Smaller type keeps 34 chars on one line. */
const setupBox = `${well} justify-center border-dashed border-border/60 bg-transparent text-[11px] text-muted-foreground`

/** Move count in slice-turn metric: every space-separated token is one move. */
function moveCount(alg: string): number {
  return alg.trim().split(/\s+/).length
}

interface Props {
  id: string
  /** The card's title. OLL numbers it; PLL names it by letter. */
  heading: ReactNode
  /** Spoken name of the case, for the checkbox label: "OLL 21", "Ua Perm". */
  name: string
  grid: Grid
  /** PLL only: which pieces need to move. */
  arrows?: Arrow[]
  setup: string
  algs: string[]
  completed: boolean
  onToggleComplete: (id: string) => void
  algIndex: number
  onChooseAlg: (id: string, index: number) => void
}

export function CaseCard({
  id,
  heading,
  name,
  grid,
  arrows,
  setup,
  algs,
  completed,
  onToggleComplete,
  algIndex,
  onChooseAlg,
}: Props) {
  const [open, setOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  // A persisted choice can outlive the alg list it indexed into.
  const index = algIndex >= 0 && algIndex < algs.length ? algIndex : 0
  const selected = algs[index]

  // The panel floats over neighbouring cards, so it must not get stranded open.
  useEffect(() => {
    if (!open) return

    const onPointerDown = (e: PointerEvent) => {
      if (!pickerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }

    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  return (
    <Card
      className={cn(
        // overflow-visible: the alternatives panel overlays out of the card.
        "group relative gap-3 overflow-visible rounded-2xl border bg-card p-3 ring-0 transition-colors duration-150",
        completed
          ? "border-success/60 bg-success/6"
          : "border-border hover:border-muted-foreground/30"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-1.5">{heading}</div>

        <button
          type="button"
          onClick={() => onToggleComplete(id)}
          aria-pressed={completed}
          aria-label={
            completed ? `Mark ${name} as not learned` : `Mark ${name} as learned`
          }
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors duration-150",
            focusRing,
            completed
              ? "border-success bg-success text-success-foreground"
              : "border-border bg-transparent text-transparent hover:border-muted-foreground/60"
          )}
        >
          <Check className="size-3.5" strokeWidth={3} />
        </button>
      </div>

      <div className="flex justify-center py-1">
        <StickerGrid grid={grid} arrows={arrows} />
      </div>

      <div>
        <div className={label}>Setup</div>
        <div className={setupBox}>
          <span className="break-words">{setup}</span>
        </div>
      </div>

      <div>
        <div className={label}>Solution</div>
        {algs.length > 1 ? (
          <Collapsible
            ref={pickerRef}
            open={open}
            onOpenChange={setOpen}
            className="relative"
          >
            <CollapsibleTrigger
              className={cn(
                algBox,
                "text-foreground transition-colors duration-150",
                "hover:border-muted-foreground/30",
                focusRing
              )}
            >
              {/* Balances the chevron so the alg stays optically centred. */}
              <span aria-hidden="true" className="size-3 shrink-0" />
              <span className="flex-1 break-words text-center">{selected}</span>
              <ChevronDown className="size-3 shrink-0 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-180" />
            </CollapsibleTrigger>

            {/* Out of flow, so opening a card never resizes its grid row. */}
            <CollapsibleContent className="absolute inset-x-0 top-full z-20 mt-1 flex flex-col gap-px rounded-md border border-border bg-background p-1">
              {algs.map((alg, i) => (
                <button
                  key={alg}
                  type="button"
                  aria-current={i === index}
                  onClick={() => {
                    onChooseAlg(id, i)
                    setOpen(false)
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left",
                    "font-mono text-xs tracking-tight transition-colors duration-150",
                    "hover:bg-accent hover:text-foreground",
                    focusRing,
                    i === index ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  <span className="flex min-w-0 items-center gap-1.5">
                    <Check
                      className={cn(
                        "size-3 shrink-0",
                        i === index ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="break-words">{alg}</span>
                  </span>
                  <Badge
                    variant="outline"
                    className="h-4 shrink-0 rounded-sm px-1 font-mono text-[10px] font-normal text-muted-foreground"
                  >
                    {moveCount(alg)}
                  </Badge>
                </button>
              ))}
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <div
            className={cn(algBox, "justify-center text-center text-foreground")}
          >
            <span className="break-words">{selected}</span>
          </div>
        )}
      </div>
    </Card>
  )
}
