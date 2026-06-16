import { useMemo } from 'react'
import type { Category, Shift } from '../lib/types'
import { ShiftRow } from './ShiftRow'

type ShiftListProps = {
  shifts: Shift[]
  categories: Category[]
  now: number
  monthLabel: string
  onSelect: (shift: Shift) => void
}

/** The list of entries for the selected month (already filtered, newest first). */
export function ShiftList({ shifts, categories, now, monthLabel, onSelect }: ShiftListProps) {
  const byId = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  )

  if (shifts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-700 px-4 py-10 text-center">
        <p className="text-slate-300">Nothing in {monthLabel}.</p>
        <p className="mt-1 text-sm text-slate-500">
          Start a shift with the button above, or tap “+ Add” for a past shift or days off.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {shifts.map((shift) => (
        <ShiftRow
          key={shift.id}
          shift={shift}
          category={shift.categoryId ? byId.get(shift.categoryId) ?? null : null}
          now={now}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}
