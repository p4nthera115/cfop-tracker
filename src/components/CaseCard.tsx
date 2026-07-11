import { type ReactNode, useEffect, useState } from "react"
import { Check, EyeOff, SquarePen, Plus, Trash2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { selectedAlg, visibleAlgs } from "../algState"
import type {
  AlgSelection,
  Arrow,
  CaseAlgState,
  StickerGrid as Grid,
} from "../types"
import { HtmBadge, useValidity, ValidityIcon } from "./Validity"
import { NotationKeyboard } from "./NotationKeyboard"
import { StickerGrid } from "./StickerGrid"

const label = "mb-1 text-[10px] uppercase tracking-wider text-muted-foreground"
const focusRing =
  "outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"

/**
 * Setup and Solution share one well shape, so they read as scramble and answer.
 * `min-h-8` rather than a fixed `h-8`: the longest alg overflows a card at the
 * 4-column breakpoint, and clipping an algorithm is not an option.
 */
const well =
  "flex min-h-8 w-full items-center gap-2 rounded-md border px-2 py-1.5 font-mono tracking-tight"

/** The answer: solid border, sunk into the card, full contrast. */
const algBox = `${well} border-border bg-background text-sm`

/** The scramble: same shape, recessive. Smaller type keeps 34 chars on one line. */
const setupBox = `${well} justify-center border-dashed border-border/60 bg-transparent text-[11px] text-muted-foreground`

const rowBtn =
  "flex size-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"

/** A read-only bundled alg: select it, or hide it. */
function DefaultRow({
  value,
  text,
  onHide,
}: {
  value: string
  text: string
  onHide: () => void
}) {
  return (
    <div className="flex items-center gap-2">
      <RadioGroupItem value={value} aria-label="Use this algorithm" />
      <span className="flex-1 break-words font-mono text-sm tracking-tight">
        {text}
      </span>
      <HtmBadge alg={text} />
      <span className="size-3.5 shrink-0" aria-hidden="true" />
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onHide}
            aria-label="Hide default"
            className={cn(rowBtn, focusRing)}
          >
            <EyeOff className="size-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Hide default</TooltipContent>
      </Tooltip>
    </div>
  )
}

const inlineInput =
  "min-w-0 flex-1 border-b border-transparent bg-transparent font-mono text-sm tracking-tight outline-none transition-colors placeholder:text-muted-foreground focus:border-border"

/** A user alg: edit in place (commit on blur/Enter), see its validity, delete it. */
function CustomRow({
  value,
  text,
  setup,
  set,
  onCommit,
  onDelete,
}: {
  value: string
  text: string
  setup: string
  set: string
  onCommit: (text: string) => void
  onDelete: () => void
}) {
  const [draft, setDraft] = useState(text)
  const [focused, setFocused] = useState(false)
  // Absorb outside edits (reindex after a delete) unless mid-typing.
  useEffect(() => {
    if (!focused) setDraft(text)
  }, [text, focused])
  const status = useValidity(setup, draft, set)

  const commit = () => {
    const next = draft.trim()
    if (next && next !== text) onCommit(next)
    else setDraft(text) // ignore empties; revert display
  }

  return (
    <div className="flex items-center gap-2">
      <RadioGroupItem value={value} aria-label="Use this algorithm" />
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false)
          commit()
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur()
        }}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="none"
        autoComplete="off"
        aria-label="Edit algorithm"
        className={inlineInput}
      />
      <HtmBadge alg={draft} />
      <ValidityIcon status={status} set={set} />
      <button
        type="button"
        onClick={onDelete}
        aria-label="Delete algorithm"
        className={cn(rowBtn, focusRing)}
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  )
}

/**
 * The append field plus its always-present notation keyboard. In the modal
 * there's room to keep the palette shown, so the layout is stable — no pop-in on
 * focus. The keyboard shows validity beside its chips, so the row itself doesn't
 * repeat it.
 */
function AddRow({
  setup,
  set,
  onAdd,
}: {
  setup: string
  set: string
  onAdd: (text: string) => void
}) {
  const [draft, setDraft] = useState("")

  const submit = () => {
    const next = draft.trim()
    if (!next) return
    onAdd(next)
    setDraft("")
  }

  return (
    <div>
      <div className={label}>Add algorithm</div>
      <div className="flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit()
          }}
          // The palette is the on-screen keyboard, so on touch we suppress the
          // OS one — it would cover the sheet and fight the palette. A physical
          // keyboard (desktop) is unaffected and still types.
          inputMode="none"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="none"
          autoComplete="off"
          placeholder="Tap the keys below…"
          aria-label="Add algorithm"
          className={cn(inlineInput, "border-0")}
        />
        <button
          type="button"
          // Keep the field focused so typing can continue across adds.
          onMouseDown={(e) => e.preventDefault()}
          onClick={submit}
          disabled={!draft.trim()}
          className={cn(
            "flex min-h-8 shrink-0 items-center gap-1 rounded-md bg-secondary px-3 text-xs font-semibold text-foreground transition-colors hover:bg-accent",
            focusRing,
            "disabled:opacity-40 disabled:hover:bg-secondary"
          )}
        >
          <Plus className="size-3.5" />
          Add
        </button>
      </div>

      <NotationKeyboard
        value={draft}
        onChange={setDraft}
        setup={setup}
        set={set}
      />
    </div>
  )
}

interface Props {
  id: string
  /** The card's title. OLL numbers it; PLL names it by letter. */
  heading: ReactNode
  /** Spoken name of the case, for the checkbox label: "OLL 21", "Ua Perm". */
  name: string
  /** "OLL" or "PLL" — used in the validity tooltip. */
  set: string
  grid: Grid
  /** PLL only: which pieces need to move. */
  arrows?: Arrow[]
  setup: string
  /** Bundled, read-only default algs. */
  defaults: string[]
  /** The user's layered edits for this case. */
  state: CaseAlgState
  completed: boolean
  onToggleComplete: (id: string) => void
  onSelect: (id: string, defaults: string[], selection: AlgSelection) => void
  onAddCustom: (id: string, defaults: string[], text: string) => void
  onEditCustom: (
    id: string,
    defaults: string[],
    index: number,
    text: string
  ) => void
  onDeleteCustom: (id: string, defaults: string[], index: number) => void
  onHideDefault: (id: string, defaults: string[], index: number) => void
  onShowHidden: (id: string, defaults: string[]) => void
}

export function CaseCard({
  id,
  heading,
  name,
  set,
  grid,
  arrows,
  setup,
  defaults,
  state,
  completed,
  onToggleComplete,
  onSelect,
  onAddCustom,
  onEditCustom,
  onDeleteCustom,
  onHideDefault,
  onShowHidden,
}: Props) {
  const [open, setOpen] = useState(false)

  const items = visibleAlgs(defaults, state)
  const selected = selectedAlg(defaults, state) ?? items[0]
  const selectedKey = `${selected.source}:${selected.index}`
  // Zero in the forced-fallback case, where hidden defaults are shown anyway.
  const hiddenCount =
    defaults.length - items.filter((i) => i.source === "default").length

  const handleSelect = (v: string) => {
    const [source, index] = v.split(":")
    onSelect(id, defaults, {
      source: source as AlgSelection["source"],
      index: Number(index),
    })
  }

  return (
    <Card
      className={cn(
        "group relative gap-3 rounded-2xl border bg-card p-3 ring-0 transition-colors duration-150",
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
            completed
              ? `Mark ${name} as not learned`
              : `Mark ${name} as learned`
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

      {/* The edit affordance lives on the label line, not in the alg row: the
          row needs its full width, and an icon inside it pushed the longest
          algs onto a second line. Up here it costs no horizontal space at all. */}
      <Dialog open={open} onOpenChange={setOpen}>
        <div className="group/alg">
          <div className={cn(label, "flex items-center justify-between gap-2")}>
            <span>Solution</span>
            {/* The squarePen opens the same dialog. `-m-1 p-1` grows the tap target
                without growing the icon's footprint, so the label row's height
                is untouched. */}
            <DialogTrigger
              aria-label={`Edit algorithms for ${name}`}
              className={cn(
                "-m-1 flex cursor-pointer rounded-sm p-1 text-muted-foreground transition-colors",
                "hover:text-foreground group-hover/alg:text-foreground",
                focusRing
              )}
            >
              <SquarePen aria-hidden="true" className="size-3 shrink-0" />
            </DialogTrigger>
          </div>
          <DialogTrigger
            className={cn(
              algBox,
              "text-center text-xs text-foreground transition-colors duration-150",
              "cursor-pointer hover:border-neutral-500 hover:bg-accent/40",
              focusRing
            )}
            aria-label={`Edit algorithms for ${name}`}
          >
            <span className="flex-1 break-words">{selected.text}</span>
          </DialogTrigger>
        </div>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>{name}</DialogTitle>
            <DialogDescription>
              Choose, edit, or add algorithms.
            </DialogDescription>
          </DialogHeader>

          {/* Everything below the title scrolls as one, so the sheet never
                overflows and the palette stays reachable on small screens. */}
          <div className="-mr-2 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-2">
            {/* The case for reference, since the modal covers the card. */}
            <div className="flex flex-col items-center gap-1.5">
              <StickerGrid grid={grid} arrows={arrows} />
              <div className={cn(setupBox, "w-auto")}>
                <span className="break-words">{setup}</span>
              </div>
            </div>

            <RadioGroup
              value={selectedKey}
              onValueChange={handleSelect}
              className="gap-1.5"
            >
              {items.map((item) =>
                item.editable ? (
                  <CustomRow
                    key={`custom:${item.index}`}
                    value={`custom:${item.index}`}
                    text={item.text}
                    setup={setup}
                    set={set}
                    onCommit={(text) =>
                      onEditCustom(id, defaults, item.index, text)
                    }
                    onDelete={() => onDeleteCustom(id, defaults, item.index)}
                  />
                ) : (
                  <DefaultRow
                    key={`default:${item.index}`}
                    value={`default:${item.index}`}
                    text={item.text}
                    onHide={() => onHideDefault(id, defaults, item.index)}
                  />
                )
              )}
            </RadioGroup>

            {hiddenCount > 0 && (
              <button
                type="button"
                onClick={() => onShowHidden(id, defaults)}
                className={cn(
                  "self-start rounded-sm px-1 text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline",
                  focusRing
                )}
              >
                Show hidden ({hiddenCount})
              </button>
            )}

            <AddRow
              setup={setup}
              set={set}
              onAdd={(text) => onAddCustom(id, defaults, text)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
