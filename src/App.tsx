import { useMemo, useState } from 'react'
import { useShifts, type NewShiftInput } from './hooks/useShifts'
import { useNow } from './hooks/useNow'
import {
  addMonths,
  currentMonthKey,
  durationMs,
  formatDuration,
  formatMonthLabel,
  monthKeyOf,
  shiftMonthKey,
  type MonthKey,
} from './lib/time'
import type { Shift } from './lib/types'
import { StartStopButton } from './components/StartStopButton'
import { MonthNav } from './components/MonthNav'
import { ShiftList } from './components/ShiftList'
import { ShiftEditor } from './components/ShiftEditor'
import { DataMenu } from './components/DataMenu'

type EditorState =
  | { open: false }
  | { open: true; shift: Shift | null } // null = create new

export default function App() {
  const {
    shifts,
    activeShift,
    saveFailed,
    startShift,
    stopShift,
    addShift,
    updateShift,
    deleteShift,
    replaceAll,
  } = useShifts()

  const [viewMonth, setViewMonth] = useState<MonthKey>(() => currentMonthKey())
  const [editor, setEditor] = useState<EditorState>({ open: false })
  const [showData, setShowData] = useState(false)

  // Tick every second while a shift is running, to drive the live timers.
  const now = useNow(activeShift !== null)

  const monthShifts = useMemo(
    () => shifts.filter((s) => shiftMonthKey(s) === viewMonth),
    [shifts, viewMonth],
  )

  const monthTotalMs = useMemo(
    () => monthShifts.reduce((sum, s) => sum + durationMs(s, now), 0),
    [monthShifts, now],
  )

  const isCurrentMonth = viewMonth === currentMonthKey()
  const monthLabel = formatMonthLabel(viewMonth)

  // Only one sheet open at a time.
  function openEditor(shift: Shift | null) {
    setShowData(false)
    setEditor({ open: true, shift })
  }
  function openDataMenu() {
    setEditor({ open: false })
    setShowData(true)
  }

  function handleSubmit(values: NewShiftInput) {
    if (editor.open && editor.shift) {
      updateShift(editor.shift.id, values)
    } else {
      addShift(values)
    }
    // Jump to the month the shift belongs to so the result is visible.
    setViewMonth(monthKeyOf(new Date(values.start)))
    setEditor({ open: false })
  }

  function handleDelete() {
    if (editor.open && editor.shift) deleteShift(editor.shift.id)
    setEditor({ open: false })
  }

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col gap-5 px-4 pb-8 pt-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-slate-100">
          Shift Tracker
        </h1>
        <button
          type="button"
          onClick={openDataMenu}
          aria-label="Export & backup"
          className="rounded-full p-2 text-slate-400 active:bg-slate-700"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-9-9c2.5 0 4.8 1 6.4 2.7" />
            <path d="M21 3v5h-5" />
          </svg>
        </button>
      </header>

      {saveFailed && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-500/50 bg-rose-500/15 px-4 py-3 text-sm text-rose-200"
        >
          Couldn’t save to this device’s storage — recent changes may be lost on
          reload. Free up space or export a backup from the icon above.
        </div>
      )}

      <section className="flex justify-center py-3">
        <StartStopButton
          activeShift={activeShift}
          now={now}
          onStart={startShift}
          onStop={stopShift}
          onEditActive={() => openEditor(activeShift)}
        />
      </section>

      <MonthNav
        monthKey={viewMonth}
        isCurrentMonth={isCurrentMonth}
        totalLabel={formatDuration(monthTotalMs)}
        shiftCount={monthShifts.length}
        onPrev={() => setViewMonth((m) => addMonths(m, -1))}
        onNext={() => setViewMonth((m) => addMonths(m, 1))}
        onToday={() => setViewMonth(currentMonthKey())}
      />

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Shifts
        </h2>
        <button
          type="button"
          onClick={() => openEditor(null)}
          className="rounded-full bg-slate-800 px-3 py-1.5 text-sm font-medium text-emerald-400 ring-1 ring-slate-700 active:bg-slate-700"
        >
          + Add shift
        </button>
      </div>

      <ShiftList
        shifts={monthShifts}
        now={now}
        monthLabel={monthLabel}
        onSelect={(shift) => openEditor(shift)}
      />

      {editor.open && (
        <ShiftEditor
          shift={editor.shift}
          hasOtherOngoing={
            activeShift !== null && activeShift.id !== editor.shift?.id
          }
          onSubmit={handleSubmit}
          onDelete={editor.shift ? handleDelete : undefined}
          onClose={() => setEditor({ open: false })}
        />
      )}

      {showData && (
        <DataMenu
          shifts={shifts}
          onImport={replaceAll}
          onClose={() => setShowData(false)}
        />
      )}
    </div>
  )
}
