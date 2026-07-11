import { useEffect, useState } from "react"
import { Check, TriangleAlert } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { htm, isParseable, solves } from "@/lib/cube"

/**
 * The advisory validity indicators, shared by the editable alg rows and the
 * notation keyboard. Always advisory, never a gate: an alg that doesn't solve
 * is flagged amber but still saveable.
 */

/** Move count in HTM as a muted badge. */
export function HtmBadge({ alg }: { alg: string }) {
  return (
    <Badge
      variant="outline"
      className="h-4 shrink-0 rounded-sm px-1 font-mono text-[10px] font-normal text-muted-foreground"
    >
      {htm(alg)}
    </Badge>
  )
}

export type Validity = "idle" | "checking" | "solves" | "warn"

/**
 * Live, debounced check of a typed/tapped alg against the case. `set` ("OLL" /
 * "PLL") decides what "solved" means — orientation only vs. solved-up-to-AUF.
 */
export function useValidity(setup: string, alg: string, set: string): Validity {
  const [status, setStatus] = useState<Validity>("idle")
  useEffect(() => {
    // A half-typed first move is "incomplete", not wrong — stay quiet.
    if (!isParseable(alg)) {
      setStatus("idle")
      return
    }
    setStatus("checking")
    const t = setTimeout(() => setStatus(solves(setup, alg, set) ? "solves" : "warn"), 300)
    return () => clearTimeout(t)
  }, [setup, alg, set])
  return status
}

/** Emerald check / amber triangle / nothing — the only colour besides yellow. */
export function ValidityIcon({ status, set }: { status: Validity; set: string }) {
  if (status === "solves") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="flex size-3.5 shrink-0 items-center justify-center">
            <Check className="size-3.5 text-emerald-500" strokeWidth={3} />
          </span>
        </TooltipTrigger>
        <TooltipContent>Solves this case</TooltipContent>
      </Tooltip>
    )
  }
  if (status === "warn") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="flex size-3.5 shrink-0 items-center justify-center">
            <TriangleAlert className="size-3.5 text-amber-500" />
          </span>
        </TooltipTrigger>
        <TooltipContent>Doesn't solve this {set} case</TooltipContent>
      </Tooltip>
    )
  }
  // Reserve the column so rows don't jitter as validity resolves.
  return <span className="size-3.5 shrink-0" aria-hidden="true" />
}
