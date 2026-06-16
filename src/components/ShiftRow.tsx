import {
  durationMs,
  formatDayLabel,
  formatDuration,
  formatStopwatch,
  formatTime,
} from '../lib/time'
import type { Shift } from '../lib/types'

type ShiftRowProps = {
  shift: Shift
  now: number
  onSelect: (shift: Shift) => void
}

function NoteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="Has note">
      <path d="M4 6h16M4 12h10M4 18h7" />
    </svg>
  )
}

/** A single shift in the month list. Tap to open the editor. */
export function ShiftRow({ shift, now, onSelect }: ShiftRowProps) {
  const isOngoing = shift.end === null
  const ms = durationMs(shift, now)

  return (
    <button
      type="button"
      onClick={() => onSelect(shift)}
      className="flex w-full items-center gap-3 rounded-2xl bg-slate-800/70 px-4 py-3 text-left ring-1 ring-slate-700 active:bg-slate-700"
    >
      <div className="flex w-12 flex-col items-center">
        <span className="text-[11px] font-medium uppercase text-slate-400">
          {formatDayLabel(shift.start).split(' ')[0]}
        </span>
        <span className="text-xl font-bold leading-none text-slate-100">
          {formatDayLabel(shift.start).split(' ')[1]}
        </span>
      </div>

      <div className="h-9 w-px bg-slate-700" />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-slate-100">
            {formatTime(shift.start)}
            {' – '}
            {isOngoing ? (
              <span className="text-emerald-400">now</span>
            ) : (
              formatTime(shift.end as string)
            )}
          </span>
          {shift.note.trim() !== '' && (
            <span className="text-slate-400">
              <NoteIcon />
            </span>
          )}
        </div>
        {shift.note.trim() !== '' && (
          <p className="mt-0.5 truncate text-sm text-slate-400">{shift.note.trim()}</p>
        )}
      </div>

      <div className="flex flex-col items-end">
        {isOngoing ? (
          <>
            <span className="text-base font-bold tabular-nums text-emerald-400">
              {formatStopwatch(ms)}
            </span>
            <span className="text-[11px] uppercase tracking-wide text-emerald-500">
              Ongoing
            </span>
          </>
        ) : (
          <span className="text-base font-bold tabular-nums text-slate-200">
            {formatDuration(ms)}
          </span>
        )}
      </div>
    </button>
  )
}
