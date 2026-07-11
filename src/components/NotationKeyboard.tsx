import { Delete } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  algFromTokens,
  cycleMod,
  PALETTE_FACES,
  PALETTE_ROTATE,
  PALETTE_SLICE,
  PALETTE_WIDE,
  tokensFromAlg,
  type Mod,
  type Token,
} from "@/notation"
import { HtmBadge, useValidity, ValidityIcon } from "./Validity"

const focusRing =
  "outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"

// Tapping a key steals focus from the text field by default, which would close
// the panel (and pop the caret out mid-compose). Suppress the focus change so
// the field stays focused and editable.
const keepFocus = (e: React.MouseEvent) => e.preventDefault()

// Compact, packed like a phone keyboard: short keys, no section labels — the
// letter case (R vs r) and colour carry the grouping. Prominence is type weight
// and fill, not size.
const keyBase =
  "flex h-9 items-center justify-center rounded-md border text-sm font-mono transition-colors active:scale-95 select-none"

const faceKey = `${keyBase} border-border bg-secondary font-semibold text-foreground hover:bg-accent`
const minorKey = `${keyBase} border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground`
const tertiaryKey = `${keyBase} border-border bg-background text-xs text-muted-foreground hover:bg-accent hover:text-foreground`
const modKey = `${keyBase} border-primary/50 bg-background font-semibold text-foreground hover:bg-accent`
const utilKey = `${keyBase} gap-1 border-dashed border-border/70 bg-transparent text-xs text-muted-foreground hover:bg-accent hover:text-foreground`

interface Props {
  /** The alg string being composed; the token array is derived from it. */
  value: string
  onChange: (value: string) => void
  setup: string
  /** "OLL" / "PLL", for the validity tooltip. */
  set: string
}

/**
 * The inline notation palette. Renders the composed sequence as tappable chips
 * and a grouped key palette. Every mutation goes token array -> string via
 * `algFromTokens`, so the palette can only ever produce canonical, re-parseable
 * notation — no `R2'`, no faces stuck together.
 */
export function NotationKeyboard({ value, onChange, setup, set }: Props) {
  const tokens = tokensFromAlg(value)
  const status = useValidity(setup, value, set)

  const setTokens = (next: Token[]) => onChange(algFromTokens(next))
  const append = (face: string) => setTokens([...tokens, { face, mod: "" }])

  // ' and 2 act on the last token, and toggle off if already set. Mutually
  // exclusive: setting one replaces the other outright.
  const modifyLast = (mod: Mod) => {
    if (tokens.length === 0) return
    const last = tokens.length - 1
    setTokens(
      tokens.map((t, i) =>
        i === last ? { ...t, mod: t.mod === mod ? "" : mod } : t
      )
    )
  }
  const cycleAt = (i: number) =>
    setTokens(
      tokens.map((t, j) => (j === i ? { ...t, mod: cycleMod(t.mod) } : t))
    )
  const removeAt = (i: number) => setTokens(tokens.filter((_, j) => j !== i))
  const backspace = () => setTokens(tokens.slice(0, -1))
  const clear = () => onChange("")

  const Keys = ({
    faces,
    className,
  }: {
    faces: string[]
    className: string
  }) => (
    <div className="grid grid-cols-6 gap-1">
      {faces.map((face) => (
        <button
          key={face}
          type="button"
          onMouseDown={keepFocus}
          onClick={() => append(face)}
          className={cn(className, focusRing)}
          aria-label={`Add ${face}`}
        >
          {face}
        </button>
      ))}
    </div>
  )

  return (
    <div className="mt-2 flex flex-col gap-1.5 rounded-md border border-border bg-background/40 p-2">
      {/* Built sequence + validity */}
      <div className="flex min-h-8 flex-wrap items-center gap-1">
        {tokens.length === 0 ? (
          <span className="px-1 text-xs text-muted-foreground">
            Tap keys or type…
          </span>
        ) : (
          tokens.map((t, i) => {
            const isLast = i === tokens.length - 1
            return (
              <span
                key={i}
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-md border py-1 pl-2.5 pr-1 font-mono text-sm",
                  isLast
                    ? "border-primary/60 bg-accent/50"
                    : "border-border bg-background"
                )}
              >
                {/* Cycle this move's modifier; shift-click deletes (desktop). */}
                <button
                  type="button"
                  onMouseDown={keepFocus}
                  onClick={(e) => (e.shiftKey ? removeAt(i) : cycleAt(i))}
                  className={cn("py-0.5 tracking-tight", focusRing)}
                  aria-label={`Cycle modifier of ${t.face}${t.mod}`}
                >
                  {t.face}
                  {t.mod}
                </button>
                {/* Always-visible delete affordance for touch. */}
                <button
                  type="button"
                  onMouseDown={keepFocus}
                  onClick={() => removeAt(i)}
                  className={cn(
                    "flex size-6 items-center justify-center rounded-sm text-muted-foreground hover:bg-background hover:text-foreground",
                    focusRing
                  )}
                  aria-label={`Delete ${t.face}${t.mod}`}
                >
                  <span aria-hidden="true" className="text-sm leading-none">
                    ×
                  </span>
                </button>
              </span>
            )
          })
        )}
        {tokens.length > 0 && (
          <span className="ml-auto flex items-center gap-1.5 pl-1">
            <HtmBadge alg={value} />
            <ValidityIcon status={status} set={set} />
          </span>
        )}
      </div>

      {/* Palette — four packed rows of six, like a phone keyboard. */}
      <Keys faces={PALETTE_FACES} className={faceKey} />
      <Keys faces={PALETTE_WIDE} className={minorKey} />

      {/* Slice then rotate, sharing one row. */}
      <div className="grid grid-cols-6 gap-1">
        {PALETTE_SLICE.map((face) => (
          <button
            key={face}
            type="button"
            onMouseDown={keepFocus}
            onClick={() => append(face)}
            className={cn(minorKey, focusRing)}
            aria-label={`Add ${face}`}
          >
            {face}
          </button>
        ))}
        {PALETTE_ROTATE.map((face) => (
          <button
            key={face}
            type="button"
            onMouseDown={keepFocus}
            onClick={() => append(face)}
            className={cn(tertiaryKey, focusRing)}
            aria-label={`Add rotation ${face}`}
          >
            {face}
          </button>
        ))}
      </div>

      {/* Modify last + edit controls, aligned to the same six-column grid. */}
      <div className="grid grid-cols-6 gap-1">
        <button
          type="button"
          onMouseDown={keepFocus}
          onClick={() => modifyLast("'")}
          disabled={tokens.length === 0}
          className={cn(modKey, focusRing, "disabled:opacity-40")}
          aria-label="Prime the last move"
        >
          {"'"}
        </button>
        <button
          type="button"
          onMouseDown={keepFocus}
          onClick={() => modifyLast("2")}
          disabled={tokens.length === 0}
          className={cn(modKey, focusRing, "disabled:opacity-40")}
          aria-label="Double the last move"
        >
          2
        </button>
        <button
          type="button"
          onMouseDown={keepFocus}
          onClick={backspace}
          disabled={tokens.length === 0}
          className={cn(utilKey, focusRing, "col-span-2 disabled:opacity-40")}
          aria-label="Delete last move"
        >
          <Delete className="size-4" />
        </button>
        <button
          type="button"
          onMouseDown={keepFocus}
          onClick={clear}
          disabled={tokens.length === 0}
          className={cn(utilKey, focusRing, "col-span-2 disabled:opacity-40")}
          aria-label="Clear sequence"
        >
          Clear
        </button>
      </div>
    </div>
  )
}
