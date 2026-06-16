import { useMemo, useState } from 'react'
import type { NewShiftInput } from '../hooks/useShifts'
import type { Category, Shift } from '../lib/types'
import {
  dateInputToMidnightIso,
  dayDiff,
  enumerateDateRange,
  formatDuration,
  fromLocalInputValue,
  shiftLocalDateTime,
  toDateInputValue,
  toLocalInputValue,
  todayAtLocalValue,
  todayDateInputValue,
} from '../lib/time'
import { Modal } from './Modal'
import { CategoryPicker } from './CategoryPicker'

type EntryKind = 'timed' | 'allday'

/** Default start/end for a new timed shift: today at 07:15. */
const DEFAULT_HOUR = 7
const DEFAULT_MINUTE = 15

type ShiftEditorProps = {
  /** The entry being edited, or null to create a new one. */
  shift: Shift | null
  categories: Category[]
  /** Is another timed shift (not this one) currently ongoing? */
  hasOtherOngoing: boolean
  onCreateCategory: (name: string, color: string) => Category
  /** One input for an edit/single entry; many for an all-day date range. */
  onSubmit: (inputs: NewShiftInput[]) => void
  onDelete?: () => void
  onClose: () => void
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      {children}
    </label>
  )
}

const inputClass =
  'rounded-xl border border-slate-600 bg-slate-900 px-3 py-2.5 text-slate-100 outline-none focus:border-emerald-500'

export function ShiftEditor({
  shift,
  categories,
  hasOtherOngoing,
  onCreateCategory,
  onSubmit,
  onDelete,
  onClose,
}: ShiftEditorProps) {
  const isCreate = shift === null

  const [kind, setKind] = useState<EntryKind>(() =>
    shift?.allDay ? 'allday' : 'timed',
  )

  // Timed fields. New shifts default to today at 07:15.
  const [start, setStart] = useState(() =>
    shift && !shift.allDay
      ? toLocalInputValue(shift.start)
      : todayAtLocalValue(DEFAULT_HOUR, DEFAULT_MINUTE),
  )
  const [ended, setEnded] = useState(() =>
    shift && !shift.allDay ? shift.end !== null : true,
  )
  const [end, setEnd] = useState(() =>
    shift?.end && !shift.allDay
      ? toLocalInputValue(shift.end)
      : todayAtLocalValue(DEFAULT_HOUR, DEFAULT_MINUTE),
  )

  // When the start's DATE changes, shift the end's date by the same number of
  // days so the end follows the start (keeps the end's time-of-day).
  function handleStartChange(next: string) {
    const delta = dayDiff(start, next)
    setStart(next)
    if (delta !== 0) setEnd((prev) => shiftLocalDateTime(prev, delta))
  }

  // All-day fields. `date` is used when editing a single entry; from/to for ranges.
  const initialDate = shift?.allDay ? toDateInputValue(shift.start) : todayDateInputValue()
  const [date, setDate] = useState(initialDate)
  const [fromDate, setFromDate] = useState(initialDate)
  const [toDate, setToDate] = useState(initialDate)

  const [categoryId, setCategoryId] = useState<string | null>(shift?.categoryId ?? null)
  const [note, setNote] = useState(() => shift?.note ?? '')
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const validation = useMemo(() => {
    if (kind === 'allday') {
      if (isCreate) {
        const days = enumerateDateRange(fromDate, toDate)
        if (days.length === 0) {
          return { ok: false, error: 'End date can’t be before the start date.', info: null }
        }
        return { ok: true, error: null, info: `Creates ${days.length} day${days.length === 1 ? '' : 's'}.` }
      }
      return date
        ? { ok: true, error: null, info: null }
        : { ok: false, error: 'Pick a date.', info: null }
    }

    // Timed.
    const startMs = new Date(start).getTime()
    if (!start || Number.isNaN(startMs)) {
      return { ok: false, error: 'Enter a valid start time.', info: null }
    }
    if (!ended) {
      if (hasOtherOngoing) {
        return { ok: false, error: 'Another shift is already running — stop it first.', info: null }
      }
      return { ok: true, error: null, info: null }
    }
    const endMs = new Date(end).getTime()
    if (!end || Number.isNaN(endMs)) {
      return { ok: false, error: 'Enter a valid end time.', info: null }
    }
    if (endMs < startMs) {
      return { ok: false, error: 'End time can’t be before the start time.', info: null }
    }
    return { ok: true, error: null, info: `Duration: ${formatDuration(endMs - startMs)}` }
  }, [kind, isCreate, fromDate, toDate, date, start, end, ended, hasOtherOngoing])

  function buildInputs(): NewShiftInput[] {
    const trimmedNote = note.trim()
    if (kind === 'allday') {
      const dates = isCreate ? enumerateDateRange(fromDate, toDate) : [date]
      return dates.map((d) => ({
        start: dateInputToMidnightIso(d),
        end: null,
        note: trimmedNote,
        allDay: true,
        categoryId,
      }))
    }
    // Timed — preserve original sub-minute precision when a field is unchanged.
    const timed = shift && !shift.allDay ? shift : null
    const startIso =
      timed && toLocalInputValue(timed.start) === start ? timed.start : fromLocalInputValue(start)
    let endIso: string | null
    if (!ended) {
      endIso = null
    } else if (timed?.end && toLocalInputValue(timed.end) === end) {
      endIso = timed.end
    } else {
      endIso = fromLocalInputValue(end)
    }
    return [{ start: startIso, end: endIso, note: trimmedNote, allDay: false, categoryId }]
  }

  function handleSubmit() {
    if (!validation.ok) return
    onSubmit(buildInputs())
  }

  return (
    <Modal title={isCreate ? 'Add entry' : 'Edit entry'} onClose={onClose}>
      <div className="flex flex-col gap-4">
        {/* Kind toggle */}
        <div className="flex rounded-xl bg-slate-900 p-1 ring-1 ring-slate-700">
          {(['timed', 'allday'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={[
                'flex-1 rounded-lg py-2 text-sm font-medium transition',
                kind === k ? 'bg-slate-700 text-slate-100' : 'text-slate-400',
              ].join(' ')}
            >
              {k === 'timed' ? 'Work shift' : 'All day'}
            </button>
          ))}
        </div>

        {kind === 'timed' ? (
          <>
            <Field label="Start">
              <input
                type="datetime-local"
                value={start}
                onChange={(e) => handleStartChange(e.target.value)}
                className={inputClass}
              />
            </Field>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={ended}
                  onChange={(e) => setEnded(e.target.checked)}
                  className="h-5 w-5 accent-emerald-500"
                />
                <span className="text-sm font-medium text-slate-300">Shift has ended</span>
              </label>
              {ended ? (
                <Field label="End">
                  <input
                    type="datetime-local"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              ) : (
                <p className="rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                  This shift will be marked as ongoing.
                </p>
              )}
            </div>
          </>
        ) : isCreate ? (
          <div className="flex gap-3">
            <Field label="From">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value)
                  if (toDate < e.target.value) setToDate(e.target.value)
                }}
                className={inputClass}
              />
            </Field>
            <Field label="To">
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
        ) : (
          <Field label="Date">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </Field>
        )}

        <CategoryPicker
          categories={categories}
          value={categoryId}
          onChange={setCategoryId}
          onCreate={onCreateCategory}
        />

        <Field label="Note (optional)">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Anything you want to remember…"
            className={`${inputClass} resize-none`}
          />
        </Field>

        {validation.info && <p className="text-sm text-slate-400">{validation.info}</p>}
        {validation.error && (
          <p className="text-sm font-medium text-rose-400">{validation.error}</p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!validation.ok}
          className="rounded-xl bg-emerald-600 py-3 text-base font-semibold text-white active:bg-emerald-700 disabled:opacity-40"
        >
          {isCreate ? 'Add' : 'Save changes'}
        </button>

        {!isCreate && onDelete && (
          <div className="border-t border-slate-700 pt-3">
            {confirmingDelete ? (
              <div className="flex flex-col gap-2">
                <p className="text-center text-sm text-slate-300">
                  Delete this entry permanently?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    className="flex-1 rounded-xl bg-slate-700 py-2.5 font-medium text-slate-200 active:bg-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={onDelete}
                    className="flex-1 rounded-xl bg-rose-600 py-2.5 font-medium text-white active:bg-rose-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="w-full rounded-xl py-2.5 font-medium text-rose-400 active:bg-rose-500/10"
              >
                Delete entry
              </button>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
