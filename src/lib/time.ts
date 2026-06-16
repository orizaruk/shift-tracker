import type { Shift } from './types'

/** A month identifier like "2026-06" derived from LOCAL time. */
export type MonthKey = string

/**
 * Fixed display locale so dates/times render consistently regardless of the
 * device locale: European day-first dates (5 June 2026) and a 24-hour clock.
 */
export const LOCALE = 'en-GB'

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

/** Local year-month key for a Date, e.g. "2026-06". */
export function monthKeyOf(date: Date): MonthKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
}

/** The month a shift belongs to (by its start time). */
export function shiftMonthKey(shift: Shift): MonthKey {
  return monthKeyOf(new Date(shift.start))
}

export function currentMonthKey(): MonthKey {
  return monthKeyOf(new Date())
}

/** Shift a month key by a number of months (can be negative). */
export function addMonths(key: MonthKey, delta: number): MonthKey {
  const [year, month] = key.split('-').map(Number)
  const d = new Date(year, month - 1 + delta, 1)
  return monthKeyOf(d)
}

/** A human label for a month key, e.g. "June 2026". */
export function formatMonthLabel(key: MonthKey): string {
  const [year, month] = key.split('-').map(Number)
  const d = new Date(year, month - 1, 1)
  return d.toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' })
}

/** "09:30" in local time, 24-hour. */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/** "Mon 16" — weekday + day-of-month, local. */
export function formatDayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString(LOCALE, {
    weekday: 'short',
    day: '2-digit',
  })
}

/** "Monday, 16 June 2026" — full local date. */
export function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString(LOCALE, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Milliseconds of a shift; uses `now` while ongoing. */
export function durationMs(shift: Shift, now: number): number {
  const startMs = new Date(shift.start).getTime()
  const endMs = shift.end ? new Date(shift.end).getTime() : now
  return Math.max(0, endMs - startMs)
}

/** "7h 32m" — compact duration. */
export function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours}h ${pad(minutes)}m`
}

/** "07:32:05" — live timer for an ongoing shift. */
export function formatStopwatch(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}

/** Decimal hours, e.g. 7.53, for monthly totals. */
export function hoursOf(ms: number): number {
  return ms / 3600000
}

/** Format an ISO string as the value a <input type="datetime-local"> expects (local). */
export function toLocalInputValue(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`
}

/** Convert a <input type="datetime-local"> value (local) back to an ISO string. */
export function fromLocalInputValue(value: string): string {
  // `new Date('YYYY-MM-DDTHH:mm')` is interpreted as local time.
  return new Date(value).toISOString()
}

/** Local "YYYY-MM-DD" for an ISO string — the value an <input type="date"> uses. */
export function toDateInputValue(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Today's local date as "YYYY-MM-DD". */
export function todayDateInputValue(): string {
  return toDateInputValue(new Date().toISOString())
}

/** A datetime-local value for today at a given hour:minute, e.g. todayAtLocalValue(7, 15). */
export function todayAtLocalValue(hour: number, minute: number): string {
  const d = new Date()
  d.setHours(hour, minute, 0, 0)
  return toLocalInputValue(d.toISOString())
}

/** Whole-day difference between the date parts of two date(-time) input values. */
export function dayDiff(fromValue: string, toValue: string): number {
  const a = Date.parse(`${fromValue.slice(0, 10)}T00:00:00Z`)
  const b = Date.parse(`${toValue.slice(0, 10)}T00:00:00Z`)
  return Math.round((b - a) / 86400000)
}

/** Shift the date part of a "YYYY-MM-DDTHH:mm" value by `days`, keeping the time. */
export function shiftLocalDateTime(value: string, days: number): string {
  const [datePart, timePart = '00:00'] = value.split('T')
  const d = new Date(Date.parse(`${datePart}T00:00:00Z`) + days * 86400000)
  const shifted = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
  return `${shifted}T${timePart}`
}

/** ISO string for local midnight of a "YYYY-MM-DD" date value (used for all-day entries). */
export function dateInputToMidnightIso(value: string): string {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day, 0, 0, 0, 0).toISOString()
}

/**
 * Inclusive list of "YYYY-MM-DD" dates from `from` to `to` (capped to `max` days
 * to guard against runaway ranges). Returns [] if `to` precedes `from`.
 */
export function enumerateDateRange(from: string, to: string, max = 366): string[] {
  const [fy, fm, fd] = from.split('-').map(Number)
  const [ty, tm, td] = to.split('-').map(Number)
  const start = new Date(fy, fm - 1, fd)
  const end = new Date(ty, tm - 1, td)
  if (end.getTime() < start.getTime()) return []
  const days: string[] = []
  const cursor = new Date(start)
  while (cursor.getTime() <= end.getTime() && days.length < max) {
    days.push(
      `${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}-${pad(cursor.getDate())}`,
    )
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}
