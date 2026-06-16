import { formatMonthLabel, type MonthKey } from '../lib/time'

type MonthNavProps = {
  monthKey: MonthKey
  isCurrentMonth: boolean
  summary: string
  onPrev: () => void
  onNext: () => void
  onToday: () => void
}

function ArrowButton({ dir, onClick }: { dir: 'left' | 'right'; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === 'left' ? 'Previous month' : 'Next month'}
      className="rounded-full p-2 text-slate-300 active:bg-slate-700"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {dir === 'left' ? <path d="m15 18-6-6 6-6" /> : <path d="m9 18 6-6-6-6" />}
      </svg>
    </button>
  )
}

/** Month switcher with a one-line summary. One month visible at a time. */
export function MonthNav({
  monthKey,
  isCurrentMonth,
  summary,
  onPrev,
  onNext,
  onToday,
}: MonthNavProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-800/70 px-2 py-2 ring-1 ring-slate-700">
      <ArrowButton dir="left" onClick={onPrev} />

      <button
        type="button"
        onClick={onToday}
        disabled={isCurrentMonth}
        className="flex flex-col items-center px-2 disabled:cursor-default"
      >
        <span className="text-base font-semibold text-slate-100">
          {formatMonthLabel(monthKey)}
        </span>
        <span className="text-xs text-slate-400">
          {summary}
          {!isCurrentMonth ? ' · tap for today' : ''}
        </span>
      </button>

      <ArrowButton dir="right" onClick={onNext} />
    </div>
  )
}
