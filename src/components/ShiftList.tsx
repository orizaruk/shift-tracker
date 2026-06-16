import type { Shift } from '../lib/types'
import { ShiftRow } from './ShiftRow'

type ShiftListProps = {
  shifts: Shift[]
  now: number
  monthLabel: string
  onSelect: (shift: Shift) => void
}

/** The list of shifts for the selected month (already filtered, newest first). */
export function ShiftList({ shifts, now, monthLabel, onSelect }: ShiftListProps) {
  if (shifts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-700 px-4 py-10 text-center">
        <p className="text-slate-300">No shifts in {monthLabel}.</p>
        <p className="mt-1 text-sm text-slate-500">
          Start one with the button above, or add a past shift with “+ Add shift”.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {shifts.map((shift) => (
        <ShiftRow key={shift.id} shift={shift} now={now} onSelect={onSelect} />
      ))}
    </div>
  )
}
