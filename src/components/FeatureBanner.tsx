import { useState } from "react"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BRACKETS_ANNOUNCEMENT, useAnnouncement } from "@/announcements"

/**
 * The one-time bracket-feature banner. Sits directly under the sticky header,
 * above the tab bar (see `Page`). Whether it shows at all is resolved from
 * localStorage before first paint by `useAnnouncement`, so it never flashes for
 * users who shouldn't see it; dismissing only fades it out and doesn't touch
 * persistence — it's already been marked seen on mount.
 */
export function FeatureBanner() {
  const show = useAnnouncement(BRACKETS_ANNOUNCEMENT)
  const [closing, setClosing] = useState(false)
  const [removed, setRemoved] = useState(false)

  if (!show || removed) return null

  return (
    // Collapse height and fade together so dismissing doesn't jump the layout.
    <div
      className={`overflow-hidden transition-all duration-200 ease-out ${
        closing ? "max-h-0 opacity-0" : "max-h-24 opacity-100"
      }`}
      onTransitionEnd={() => closing && setRemoved(true)}
    >
      <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
          <Badge
            variant="outline"
            className="shrink-0 rounded-sm border-transparent bg-success px-1.5 text-[10px] font-semibold uppercase tracking-wide text-success-foreground"
          >
            New
          </Badge>
          <p className="text-sm text-muted-foreground">
            You can now add brackets in the keyboard.
          </p>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Dismiss"
            onClick={() => setClosing(true)}
            className="ml-auto shrink-0 text-muted-foreground"
          >
            <X />
          </Button>
        </div>
      </div>
    </div>
  )
}
