import type { Category, Shift } from './types'
import {
  durationMs,
  formatDuration,
  formatMonthLabel,
  formatTime,
  monthKeyOf,
  type MonthKey,
} from './time'

/** "Mon, 02 Jun 2026" — compact weekday + date for the export. */
function compactDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/** Per-category counts, e.g. "Sick day: 2 · Vacation: 1", for the entries given. */
function categoryTally(shifts: Shift[], categories: Category[]): string {
  const counts = new Map<string, number>()
  for (const s of shifts) {
    if (s.categoryId) counts.set(s.categoryId, (counts.get(s.categoryId) ?? 0) + 1)
  }
  const parts = categories
    .filter((c) => counts.has(c.id))
    .map((c) => `${c.name}: ${counts.get(c.id)}`)
  return parts.join(' · ')
}

/**
 * Render all entries as a readable plain-text report, grouped by month
 * (oldest first), with each entry's weekday + date, hours (or "All day"),
 * category, and note.
 */
export function exportText(shifts: Shift[], categories: Category[]): string {
  const now = Date.now()
  const byId = new Map(categories.map((c) => [c.id, c]))
  const sorted = [...shifts].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  )

  const groups = new Map<MonthKey, Shift[]>()
  for (const shift of sorted) {
    const key = monthKeyOf(new Date(shift.start))
    const bucket = groups.get(key)
    if (bucket) bucket.push(shift)
    else groups.set(key, [shift])
  }

  const worked = (list: Shift[]) =>
    list.filter((s) => !s.allDay && s.end !== null).reduce((sum, s) => sum + durationMs(s, now), 0)

  const lines: string[] = []
  lines.push('SHIFT TRACKER — shifts export')
  lines.push(`Generated: ${compactDate(new Date(now).toISOString())}`)
  const entryCount = `${shifts.length} ${shifts.length === 1 ? 'entry' : 'entries'}`
  lines.push(`Total: ${entryCount}, ${formatDuration(worked(sorted))} worked`)

  if (shifts.length === 0) {
    lines.push('')
    lines.push('No entries recorded yet.')
    return lines.join('\n') + '\n'
  }

  for (const [key, monthShifts] of groups) {
    lines.push('')
    lines.push(`=== ${formatMonthLabel(key)} — ${formatDuration(worked(monthShifts))} worked ===`)
    const tally = categoryTally(monthShifts, categories)
    if (tally) lines.push(`  ${tally}`)

    for (const shift of monthShifts) {
      const category = shift.categoryId ? byId.get(shift.categoryId) : undefined
      if (shift.allDay) {
        const label = category ? `All day — ${category.name}` : 'All day'
        lines.push(`${compactDate(shift.start)}   ${label}`)
      } else {
        const end = shift.end ? formatTime(shift.end) : '(ongoing)'
        const dur = shift.end ? `  ${formatDuration(durationMs(shift, now))}` : ''
        const tag = category ? `  [${category.name}]` : ''
        lines.push(`${compactDate(shift.start)}   ${formatTime(shift.start)}–${end}${dur}${tag}`)
      }
      const note = shift.note.trim()
      if (note !== '') lines.push(`  Note: ${note.replace(/\s*\n\s*/g, ' ')}`)
    }
  }

  return lines.join('\n') + '\n'
}
