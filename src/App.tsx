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
import { CategorySummary } from './components/CategorySummary'
import { ShiftList } from './components/ShiftList'
import { ShiftEditor } from './components/ShiftEditor'
import { CategoryManager } from './components/CategoryManager'
import { DataMenu } from './components/DataMenu'

type EditorState =
  | { open: false }
  | { open: true; shift: Shift | null } // null = create new

export default function App() {
  const {
    shifts,
    categories,
    activeShift,
    saveFailed,
    startShift,
    stopShift,
    addShifts,
    updateShift,
    deleteShift,
    addCategory,
    updateCategory,
    deleteCategory,
    replaceAll,
  } = useShifts()

  const [viewMonth, setViewMonth] = useState<MonthKey>(() => currentMonthKey())
  const [editor, setEditor] = useState<EditorState>({ open: false })
  const [showData, setShowData] = useState(false)
  const [showCategories, setShowCategories] = useState(false)

  // Tick every second while a shift is running, to drive the live timers.
  const now = useNow(activeShift !== null)

  const monthShifts = useMemo(
    () => shifts.filter((s) => shiftMonthKey(s) === viewMonth),
    [shifts, viewMonth],
  )

  const summary = useMemo(() => {
    if (monthShifts.length === 0) return 'No entries'
    const timed = monthShifts.filter((s) => !s.allDay)
    const allDayCount = monthShifts.length - timed.length
    const workedMs = timed.reduce((sum, s) => sum + durationMs(s, now), 0)
    // Worked-hours total is always shown and never includes all-day entries.
    const parts: string[] = [`${formatDuration(workedMs)} worked`]
    if (timed.length > 0) parts.push(`${timed.length} shift${timed.length === 1 ? '' : 's'}`)
    if (allDayCount > 0) parts.push(`${allDayCount} all-day`)
    return parts.join(' · ')
  }, [monthShifts, now])

  const isCurrentMonth = viewMonth === currentMonthKey()
  const monthLabel = formatMonthLabel(viewMonth)

  // Only one sheet open at a time.
  function openEditor(shift: Shift | null) {
    setShowData(false)
    setShowCategories(false)
    setEditor({ open: true, shift })
  }
  function openDataMenu() {
    setEditor({ open: false })
    setShowCategories(false)
    setShowData(true)
  }
  function openCategories() {
    setEditor({ open: false })
    setShowData(false)
    setShowCategories(true)
  }

  function handleSubmit(inputs: NewShiftInput[]) {
    if (inputs.length === 0) return
    if (editor.open && editor.shift) {
      updateShift(editor.shift.id, inputs[0])
    } else {
      addShifts(inputs)
    }
    // Jump to the month the entry belongs to so the result is visible.
    setViewMonth(monthKeyOf(new Date(inputs[0].start)))
    setEditor({ open: false })
  }

  function handleDelete() {
    if (editor.open && editor.shift) deleteShift(editor.shift.id)
    setEditor({ open: false })
  }

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col gap-5 px-4 pb-8 pt-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-slate-100">Shift Tracker</h1>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={openCategories}
            aria-label="Categories"
            className="rounded-full p-2 text-slate-400 active:bg-slate-700"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.59 13.41 13.42 20.6a2 2 0 0 1-2.83 0L3 13V3h10l7.59 7.59a2 2 0 0 1 0 2.82z" />
              <circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" />
            </svg>
          </button>
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
        </div>
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
        summary={summary}
        onPrev={() => setViewMonth((m) => addMonths(m, -1))}
        onNext={() => setViewMonth((m) => addMonths(m, 1))}
        onToday={() => setViewMonth(currentMonthKey())}
      />

      <CategorySummary categories={categories} shifts={monthShifts} />

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Entries</h2>
        <button
          type="button"
          onClick={() => openEditor(null)}
          className="rounded-full bg-slate-800 px-3 py-1.5 text-sm font-medium text-emerald-400 ring-1 ring-slate-700 active:bg-slate-700"
        >
          + Add
        </button>
      </div>

      <ShiftList
        shifts={monthShifts}
        categories={categories}
        now={now}
        monthLabel={monthLabel}
        onSelect={(shift) => openEditor(shift)}
      />

      {editor.open && (
        <ShiftEditor
          shift={editor.shift}
          categories={categories}
          hasOtherOngoing={activeShift !== null && activeShift.id !== editor.shift?.id}
          onCreateCategory={addCategory}
          onSubmit={handleSubmit}
          onDelete={editor.shift ? handleDelete : undefined}
          onClose={() => setEditor({ open: false })}
        />
      )}

      {showCategories && (
        <CategoryManager
          categories={categories}
          onAdd={addCategory}
          onUpdate={updateCategory}
          onDelete={deleteCategory}
          onClose={() => setShowCategories(false)}
        />
      )}

      {showData && (
        <DataMenu
          shifts={shifts}
          categories={categories}
          onImport={replaceAll}
          onClose={() => setShowData(false)}
        />
      )}
    </div>
  )
}
