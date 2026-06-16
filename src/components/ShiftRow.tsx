import {
  durationMs,
  formatDayLabel,
  formatDuration,
  formatStopwatch,
  formatTime,
} from '../lib/time'
import type { Category, Shift } from '../lib/types'
import { Dot } from './CategoryPicker'

type ShiftRowProps = {
  shift: Shift
  category: Category | null
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

/** A single entry in the month list. Tap to open the editor. */
export function ShiftRow({ shift, category, now, onSelect }: ShiftRowProps) {
  const isOngoing = !shift.allDay && shift.end === null
  const hasNote = shift.note.trim() !== ''
  const [weekday, day] = formatDayLabel(shift.start).split(' ')

  return (
    <button
      type="button"
      onClick={() => onSelect(shift)}
      className="flex w-full items-center gap-3 rounded-2xl bg-slate-800/70 px-3 py-3 text-left ring-1 ring-slate-700 active:bg-slate-700"
    >
      <div className="flex w-12 flex-col items-center">
        <span className="text-[11px] font-medium uppercase text-slate-400">{weekday}</span>
        <span className="text-xl font-bold leading-none text-slate-100">{day}</span>
      </div>

      {/* Accent bar — category color when set, else a neutral divider. */}
      <div
        className="h-9 w-1 shrink-0 rounded-full"
        style={{ backgroundColor: category ? category.color : '#334155' }}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {shift.allDay ? (
            category ? (
              <span className="flex items-center gap-1.5 text-base font-semibold" style={{ color: category.color }}>
                <Dot color={category.color} />
                {category.name}
              </span>
            ) : (
              <span className="text-base font-semibold text-slate-200">All-day</span>
            )
          ) : (
            <span className="text-base font-semibold text-slate-100">
              {formatTime(shift.start)}
              {' – '}
              {isOngoing ? (
                <span className="text-emerald-400">now</span>
              ) : (
                formatTime(shift.end as string)
              )}
            </span>
          )}
          {hasNote && (
            <span className="text-slate-400">
              <NoteIcon />
            </span>
          )}
        </div>

        {/* Category chip for timed shifts (all-day already shows the name above). */}
        {!shift.allDay && category && (
          <span className="mt-1 flex items-center gap-1.5 text-xs font-medium" style={{ color: category.color }}>
            <Dot color={category.color} size={8} />
            {category.name}
          </span>
        )}

        {hasNote && <p className="mt-0.5 truncate text-sm text-slate-400">{shift.note.trim()}</p>}
      </div>

      <div className="flex flex-col items-end">
        {shift.allDay ? (
          category && (
            <span className="text-[11px] uppercase tracking-wide text-slate-500">All-day</span>
          )
        ) : isOngoing ? (
          <>
            <span className="text-base font-bold tabular-nums text-emerald-400">
              {formatStopwatch(durationMs(shift, now))}
            </span>
            <span className="text-[11px] uppercase tracking-wide text-emerald-500">Ongoing</span>
          </>
        ) : (
          <span className="text-base font-bold tabular-nums text-slate-200">
            {formatDuration(durationMs(shift, now))}
          </span>
        )}
      </div>
    </button>
  )
}
