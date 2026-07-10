import { cn } from '@/lib/utils'

interface Props {
  value: number
  max: number
  /** Accessible name, e.g. "Fish Shapes progress". */
  label: string
  className?: string
}

/**
 * A 1px rule that fills as you learn. Two divs, not a shadcn Progress: it has
 * to read as a hairline separator first and a progress bar second. Turns green
 * once the group is finished, matching the completed-card accent.
 */
export function ProgressBar({ value, max, label, className }: Props) {
  const done = max > 0 && value >= max
  const pct = max > 0 ? (value / max) * 100 : 0

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn('h-px overflow-hidden bg-border', className)}
    >
      {/* scaleX rather than width: it composites, so no layout per frame. */}
      <div
        className={cn(
          'h-full w-full origin-left transition-[transform,background-color] duration-300 ease-out',
          done ? 'bg-success' : 'bg-foreground',
        )}
        style={{ transform: `scaleX(${pct / 100})` }}
      />
    </div>
  )
}
