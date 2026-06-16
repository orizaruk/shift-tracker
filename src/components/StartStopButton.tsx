import { formatStopwatch, formatTime } from '../lib/time'
import type { Shift } from '../lib/types'

type StartStopButtonProps = {
  activeShift: Shift | null
  now: number
  onStart: () => void
  onStop: () => void
  onEditActive: () => void
}

/** The big central circle: tap to start a shift, tap again to stop. */
export function StartStopButton({
  activeShift,
  now,
  onStart,
  onStop,
  onEditActive,
}: StartStopButtonProps) {
  const isActive = activeShift !== null
  const elapsedMs = isActive ? now - new Date(activeShift.start).getTime() : 0

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        onClick={isActive ? onStop : onStart}
        className={[
          'flex h-60 w-60 select-none flex-col items-center justify-center rounded-full',
          'shadow-xl transition-transform active:scale-95',
          'focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
          isActive
            ? 'bg-gradient-to-b from-rose-500 to-rose-600 ring-rose-400'
            : 'bg-gradient-to-b from-emerald-500 to-emerald-600 ring-emerald-400',
        ].join(' ')}
      >
        {isActive ? (
          <>
            <span className="text-4xl font-bold tabular-nums tracking-tight text-white">
              {formatStopwatch(Math.max(0, elapsedMs))}
            </span>
            <span className="mt-2 text-sm font-medium uppercase tracking-widest text-white/80">
              Tap to stop
            </span>
          </>
        ) : (
          <>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="white" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
            <span className="mt-2 text-base font-semibold uppercase tracking-widest text-white">
              Start shift
            </span>
          </>
        )}
      </button>

      {isActive && (
        <button
          type="button"
          onClick={onEditActive}
          className="rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-300 ring-1 ring-slate-700 active:bg-slate-700"
        >
          Started {formatTime(activeShift.start)} · adjust
        </button>
      )}
    </div>
  )
}
