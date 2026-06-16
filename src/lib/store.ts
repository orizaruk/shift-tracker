import type { Category, Shift, ShiftData } from './types'
import { DEFAULT_CATEGORIES } from './categories'

const STORAGE_KEY = 'shift-tracker:data:v1'
const CURRENT_VERSION = 2 as const

export type LoadedData = {
  shifts: Shift[]
  categories: Category[]
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

function isCategory(value: unknown): value is Category {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.id === 'string' &&
    v.id !== '' &&
    typeof v.name === 'string' &&
    typeof v.color === 'string'
  )
}

/**
 * Validate and normalize one stored entry, coercing the v2 fields (`allDay`,
 * `categoryId`) when migrating older data. Returns null if irrecoverably malformed.
 */
function normalizeShift(value: unknown, validCategoryIds: Set<string>): Shift | null {
  if (typeof value !== 'object' || value === null) return null
  const v = value as Record<string, unknown>
  if (typeof v.id !== 'string' || v.id === '') return null
  if (!isValidIso(v.start)) return null
  if (!(v.end === null || isValidIso(v.end))) return null
  if (typeof v.note !== 'string') return null

  const categoryId =
    typeof v.categoryId === 'string' && validCategoryIds.has(v.categoryId)
      ? v.categoryId
      : null

  return {
    id: v.id,
    start: v.start,
    end: (v.end as string | null) ?? null,
    note: v.note,
    allDay: v.allDay === true,
    categoryId,
  }
}

function parseCategories(raw: unknown): Category[] {
  if (!Array.isArray(raw)) return [...DEFAULT_CATEGORIES]
  const seen = new Set<string>()
  const categories: Category[] = []
  for (const item of raw) {
    if (!isCategory(item) || seen.has(item.id)) continue
    seen.add(item.id)
    categories.push({ id: item.id, name: item.name, color: item.color })
  }
  // Empty/garbage categories → fall back to the defaults so the UI is usable.
  return categories.length > 0 ? categories : [...DEFAULT_CATEGORIES]
}

/** Parse unknown JSON into valid data, migrating v1, dropping malformed entries. */
export function parseData(raw: unknown): LoadedData {
  if (typeof raw !== 'object' || raw === null) {
    return { shifts: [], categories: [...DEFAULT_CATEGORIES] }
  }
  const obj = raw as Record<string, unknown>
  const categories = parseCategories(obj.categories)
  const validIds = new Set(categories.map((c) => c.id))

  const seen = new Set<string>()
  const shifts: Shift[] = []
  if (Array.isArray(obj.shifts)) {
    for (const item of obj.shifts) {
      const shift = normalizeShift(item, validIds)
      if (!shift || seen.has(shift.id)) continue
      seen.add(shift.id)
      shifts.push(shift)
    }
  }
  return { shifts, categories }
}

export function loadData(): LoadedData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { shifts: [], categories: [...DEFAULT_CATEGORIES] }
    return parseData(JSON.parse(raw))
  } catch (err) {
    console.error('Failed to load data from storage:', err)
    return { shifts: [], categories: [...DEFAULT_CATEGORIES] }
  }
}

/**
 * Persist data. Throws if storage is unavailable (quota exceeded, private mode,
 * SecurityError) so the caller can warn the user rather than silently losing data.
 */
export function saveData(shifts: Shift[], categories: Category[]): void {
  const data: ShiftData = { version: CURRENT_VERSION, shifts, categories }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

/** Serialize all data for a backup file. */
export function exportData(shifts: Shift[], categories: Category[]): string {
  const data: ShiftData = { version: CURRENT_VERSION, shifts, categories }
  return JSON.stringify(data, null, 2)
}

/** Parse a backup file's text back into data. Throws on invalid JSON. */
export function importData(text: string): LoadedData {
  return parseData(JSON.parse(text))
}
