import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Shift } from '../lib/types'
import { loadShifts, newId, saveShifts } from '../lib/store'

export type NewShiftInput = {
  start: string
  end: string | null
  note: string
}

export type ShiftPatch = Partial<Omit<Shift, 'id'>>

export type UseShifts = {
  shifts: Shift[]
  activeShift: Shift | null
  /** True when the last attempt to persist failed (storage full / unavailable). */
  saveFailed: boolean
  startShift: () => void
  stopShift: () => void
  addShift: (input: NewShiftInput) => Shift
  updateShift: (id: string, patch: ShiftPatch) => void
  deleteShift: (id: string) => void
  replaceAll: (shifts: Shift[]) => void
}

/** Sort newest-first by start time. */
function sortByStartDesc(shifts: Shift[]): Shift[] {
  return [...shifts].sort(
    (a, b) => new Date(b.start).getTime() - new Date(a.start).getTime(),
  )
}

export function useShifts(): UseShifts {
  const [shifts, setShifts] = useState<Shift[]>(() => sortByStartDesc(loadShifts()))
  const [saveFailed, setSaveFailed] = useState(false)

  // Persist on every change. If storage is unavailable, flag it so the UI can
  // warn the user (their shifts are their income — losing one silently is the
  // worst-case failure). The save runs synchronously; only the status flag is
  // deferred so we don't setState synchronously inside the effect.
  useEffect(() => {
    let failed = false
    try {
      saveShifts(shifts)
    } catch (err) {
      console.error('Failed to save shifts to storage:', err)
      failed = true
    }
    const id = setTimeout(() => setSaveFailed(failed), 0)
    return () => clearTimeout(id)
  }, [shifts])

  const activeShift = useMemo(
    () => shifts.find((s) => s.end === null) ?? null,
    [shifts],
  )

  const startShift = useCallback(() => {
    setShifts((prev) => {
      // Guard: never start a second shift while one is ongoing.
      if (prev.some((s) => s.end === null)) return prev
      const shift: Shift = {
        id: newId(),
        start: new Date().toISOString(),
        end: null,
        note: '',
      }
      return sortByStartDesc([shift, ...prev])
    })
  }, [])

  const stopShift = useCallback(() => {
    setShifts((prev) => {
      const active = prev.find((s) => s.end === null)
      if (!active) return prev
      return prev.map((s) =>
        s.id === active.id ? { ...s, end: new Date().toISOString() } : s,
      )
    })
  }, [])

  const addShift = useCallback((input: NewShiftInput): Shift => {
    const shift: Shift = {
      id: newId(),
      start: input.start,
      end: input.end,
      note: input.note,
    }
    setShifts((prev) => sortByStartDesc([shift, ...prev]))
    return shift
  }, [])

  const updateShift = useCallback((id: string, patch: ShiftPatch) => {
    setShifts((prev) =>
      sortByStartDesc(prev.map((s) => (s.id === id ? { ...s, ...patch } : s))),
    )
  }, [])

  const deleteShift = useCallback((id: string) => {
    setShifts((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const replaceAll = useCallback((next: Shift[]) => {
    setShifts(sortByStartDesc(next))
  }, [])

  return {
    shifts,
    activeShift,
    saveFailed,
    startShift,
    stopShift,
    addShift,
    updateShift,
    deleteShift,
    replaceAll,
  }
}
