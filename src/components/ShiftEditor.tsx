import { useMemo, useState } from 'react'
import type { NewShiftInput } from '../hooks/useShifts'
import type { Shift } from '../lib/types'
import {
  formatDuration,
  fromLocalInputValue,
  toLocalInputValue,
} from '../lib/time'
import { Modal } from './Modal'

type ShiftEditorProps = {
  /** The shift being edited, or null to create a new one. */
  shift: Shift | null
  /** Is another shift (not this one) currently ongoing? */
  hasOtherOngoing: boolean
  onSubmit: (values: NewShiftInput) => void
  onDelete?: () => void
  onClose: () => void
}

function nowLocalValue(): string {
  return toLocalInputValue(new Date().toISOString())
}

/** Local datetime value `minutes` before now (used for sensible create defaults). */
function minutesAgoLocalValue(minutes: number): string {
  return toLocalInputValue(new Date(Date.now() - minutes * 60000).toISOString())
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
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
  hasOtherOngoing,
  onSubmit,
  onDelete,
  onClose,
}: ShiftEditorProps) {
  const isCreate = shift === null

  const [start, setStart] = useState(() =>
    // New manual shift defaults to a valid 1-hour block ending now, so the form
    // opens without an error; the owner then adjusts the date/times.
    shift ? toLocalInputValue(shift.start) : minutesAgoLocalValue(60),
  )
  const [ended, setEnded] = useState(() => (shift ? shift.end !== null : true))
  const [end, setEnd] = useState(() =>
    shift?.end ? toLocalInputValue(shift.end) : nowLocalValue(),
  )
  const [note, setNote] = useState(() => shift?.note ?? '')
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const validation = useMemo(() => {
    const startMs = new Date(start).getTime()
    if (!start || Number.isNaN(startMs)) {
      return { ok: false, error: 'Enter a valid start time.', durationMs: 0 }
    }
    if (!ended) {
      if (hasOtherOngoing) {
        return {
          ok: false,
          error: 'Another shift is already running — stop it first.',
          durationMs: 0,
        }
      }
      return { ok: true, error: null, durationMs: 0 }
    }
    const endMs = new Date(end).getTime()
    if (!end || Number.isNaN(endMs)) {
      return { ok: false, error: 'Enter a valid end time.', durationMs: 0 }
    }
    if (endMs < startMs) {
      return {
        ok: false,
        error: 'End time can’t be before the start time.',
        durationMs: 0,
      }
    }
    return { ok: true, error: null, durationMs: endMs - startMs }
  }, [start, end, ended, hasOtherOngoing])

  function handleSubmit() {
    if (!validation.ok) return
    // datetime-local only has minute precision, so a field left untouched would
    // otherwise drop the original seconds. Keep the original ISO when the
    // minute-level value is unchanged.
    const startIso =
      shift && toLocalInputValue(shift.start) === start
        ? shift.start
        : fromLocalInputValue(start)
    let endIso: string | null
    if (!ended) {
      endIso = null
    } else if (shift?.end && toLocalInputValue(shift.end) === end) {
      endIso = shift.end
    } else {
      endIso = fromLocalInputValue(end)
    }
    onSubmit({ start: startIso, end: endIso, note: note.trim() })
  }

  return (
    <Modal title={isCreate ? 'Add shift' : 'Edit shift'} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <Field label="Start">
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
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
            <span className="text-sm font-medium text-slate-300">
              Shift has ended
            </span>
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

        <Field label="Note (optional)">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Anything you want to remember about this shift…"
            className={`${inputClass} resize-none`}
          />
        </Field>

        {validation.ok && ended && (
          <p className="text-sm text-slate-400">
            Duration:{' '}
            <span className="font-semibold text-slate-200">
              {formatDuration(validation.durationMs)}
            </span>
          </p>
        )}
        {validation.error && (
          <p className="text-sm font-medium text-rose-400">{validation.error}</p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!validation.ok}
          className="rounded-xl bg-emerald-600 py-3 text-base font-semibold text-white active:bg-emerald-700 disabled:opacity-40"
        >
          {isCreate ? 'Add shift' : 'Save changes'}
        </button>

        {!isCreate && onDelete && (
          <div className="border-t border-slate-700 pt-3">
            {confirmingDelete ? (
              <div className="flex flex-col gap-2">
                <p className="text-center text-sm text-slate-300">
                  Delete this shift permanently?
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
                Delete shift
              </button>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
