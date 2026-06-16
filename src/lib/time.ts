import type { Shift } from './types'

/** A month identifier like "2026-06" derived from LOCAL time. */
export type MonthKey = string

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
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

/** "09:30" in local time. */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** "Mon 16" — weekday + day-of-month, local. */
export function formatDayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    day: '2-digit',
  })
}

/** "Monday, 16 June 2026" — full local date. */
export function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
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
