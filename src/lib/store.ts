import type { Shift, ShiftData } from './types'

const STORAGE_KEY = 'shift-tracker:data:v1'
const CURRENT_VERSION = 1 as const

function emptyData(): ShiftData {
  return { version: CURRENT_VERSION, shifts: [] }
}

/** A reasonably-unique id without external deps. */
export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/** A string that `Date` can parse into a real time. */
function isValidIso(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
}

function isShift(value: unknown): value is Shift {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.id === 'string' &&
    v.id !== '' &&
    isValidIso(v.start) &&
    (v.end === null || isValidIso(v.end)) &&
    typeof v.note === 'string'
  )
}

/**
 * Parse unknown JSON into valid ShiftData. Drops anything malformed (including
 * shifts with unparseable timestamps) and de-duplicates by id so a crafted or
 * corrupted backup can't poison the month views or delete two shifts at once.
 */
export function parseData(raw: unknown): ShiftData {
  if (typeof raw !== 'object' || raw === null) return emptyData()
  const obj = raw as Record<string, unknown>
  const seen = new Set<string>()
  const shifts: Shift[] = []
  if (Array.isArray(obj.shifts)) {
    for (const item of obj.shifts) {
      if (!isShift(item) || seen.has(item.id)) continue
      seen.add(item.id)
      shifts.push(item)
    }
  }
  return { version: CURRENT_VERSION, shifts }
}

export function loadShifts(): Shift[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return parseData(JSON.parse(raw)).shifts
  } catch (err) {
    console.error('Failed to load shifts from storage:', err)
    return []
  }
}

/**
 * Persist shifts. Throws if storage is unavailable (quota exceeded, private
 * mode, SecurityError) so the caller can warn the user rather than silently
 * losing data.
 */
export function saveShifts(shifts: Shift[]): void {
  const data: ShiftData = { version: CURRENT_VERSION, shifts }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

/** Serialize all data for a backup file. */
export function exportData(shifts: Shift[]): string {
  const data: ShiftData = { version: CURRENT_VERSION, shifts }
  return JSON.stringify(data, null, 2)
}

/** Parse a backup file's text back into shifts. Throws on invalid JSON. */
export function importData(text: string): Shift[] {
  const parsed = JSON.parse(text)
  return parseData(parsed).shifts
}
