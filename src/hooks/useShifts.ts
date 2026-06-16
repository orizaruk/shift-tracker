import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Category, Shift } from '../lib/types'
import { loadData, newId, saveData } from '../lib/store'

export type NewShiftInput = {
  start: string
  end: string | null
  note: string
  allDay: boolean
  categoryId: string | null
}

export type ShiftPatch = Partial<Omit<Shift, 'id'>>

export type UseShifts = {
  shifts: Shift[]
  categories: Category[]
  activeShift: Shift | null
  /** True when the last attempt to persist failed (storage full / unavailable). */
  saveFailed: boolean
  startShift: () => void
  stopShift: () => void
  addShift: (input: NewShiftInput) => void
  addShifts: (inputs: NewShiftInput[]) => void
  updateShift: (id: string, patch: ShiftPatch) => void
  deleteShift: (id: string) => void
  addCategory: (name: string, color: string) => Category
  updateCategory: (id: string, patch: Partial<Omit<Category, 'id'>>) => void
  deleteCategory: (id: string) => void
  replaceAll: (shifts: Shift[], categories: Category[]) => void
}

/** Sort newest-first by start time. */
function sortByStartDesc(shifts: Shift[]): Shift[] {
  return [...shifts].sort(
    (a, b) => new Date(b.start).getTime() - new Date(a.start).getTime(),
  )
}

function shiftFromInput(input: NewShiftInput): Shift {
  return {
    id: newId(),
    start: input.start,
    end: input.end,
    note: input.note,
    allDay: input.allDay,
    categoryId: input.categoryId,
  }
}

export function useShifts(): UseShifts {
  const initial = useMemo(() => loadData(), [])
  const [shifts, setShifts] = useState<Shift[]>(() => sortByStartDesc(initial.shifts))
  const [categories, setCategories] = useState<Category[]>(() => initial.categories)
  const [saveFailed, setSaveFailed] = useState(false)

  // Persist on every change. If storage is unavailable, flag it so the UI can
  // warn the user (their shifts are their income — losing one silently is the
  // worst-case failure). The save runs synchronously; only the status flag is
  // deferred so we don't setState synchronously inside the effect.
  useEffect(() => {
    let failed = false
    try {
      saveData(shifts, categories)
    } catch (err) {
      console.error('Failed to save data to storage:', err)
      failed = true
    }
    const id = setTimeout(() => setSaveFailed(failed), 0)
    return () => clearTimeout(id)
  }, [shifts, categories])

  const activeShift = useMemo(
    () => shifts.find((s) => !s.allDay && s.end === null) ?? null,
    [shifts],
  )

  const startShift = useCallback(() => {
    setShifts((prev) => {
      // Guard: never start a second shift while one is ongoing.
      if (prev.some((s) => !s.allDay && s.end === null)) return prev
      const shift: Shift = {
        id: newId(),
        start: new Date().toISOString(),
        end: null,
        note: '',
        allDay: false,
        categoryId: null,
      }
      return sortByStartDesc([shift, ...prev])
    })
  }, [])

  const stopShift = useCallback(() => {
    setShifts((prev) => {
      const active = prev.find((s) => !s.allDay && s.end === null)
      if (!active) return prev
      return prev.map((s) =>
        s.id === active.id ? { ...s, end: new Date().toISOString() } : s,
      )
    })
  }, [])

  const addShift = useCallback((input: NewShiftInput) => {
    setShifts((prev) => sortByStartDesc([shiftFromInput(input), ...prev]))
  }, [])

  const addShifts = useCallback((inputs: NewShiftInput[]) => {
    if (inputs.length === 0) return
    setShifts((prev) => sortByStartDesc([...inputs.map(shiftFromInput), ...prev]))
  }, [])

  const updateShift = useCallback((id: string, patch: ShiftPatch) => {
    setShifts((prev) =>
      sortByStartDesc(prev.map((s) => (s.id === id ? { ...s, ...patch } : s))),
    )
  }, [])

  const deleteShift = useCallback((id: string) => {
    setShifts((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const addCategory = useCallback((name: string, color: string): Category => {
    const category: Category = { id: newId(), name: name.trim(), color }
    setCategories((prev) => [...prev, category])
    return category
  }, [])

  const updateCategory = useCallback(
    (id: string, patch: Partial<Omit<Category, 'id'>>) => {
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      )
    },
    [],
  )

  const deleteCategory = useCallback((id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id))
    // Un-categorize affected entries rather than deleting them.
    setShifts((prev) =>
      prev.map((s) => (s.categoryId === id ? { ...s, categoryId: null } : s)),
    )
  }, [])

  const replaceAll = useCallback((nextShifts: Shift[], nextCategories: Category[]) => {
    setCategories(nextCategories)
    setShifts(sortByStartDesc(nextShifts))
  }, [])

  return {
    shifts,
    categories,
    activeShift,
    saveFailed,
    startShift,
    stopShift,
    addShift,
    addShifts,
    updateShift,
    deleteShift,
    addCategory,
    updateCategory,
    deleteCategory,
    replaceAll,
  }
}
