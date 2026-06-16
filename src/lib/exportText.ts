import type { Shift } from './types'
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

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

/**
 * Render all shifts as a readable plain-text report, grouped by month
 * (oldest first), with each shift's weekday + date, time range, hours, and note.
 */
export function exportText(shifts: Shift[]): string {
  const now = Date.now()
  const sorted = [...shifts].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  )

  // Group into months in chronological order.
  const groups = new Map<MonthKey, Shift[]>()
  for (const shift of sorted) {
    const key = monthKeyOf(new Date(shift.start))
    const bucket = groups.get(key)
    if (bucket) bucket.push(shift)
    else groups.set(key, [shift])
  }

  const completed = sorted.filter((s) => s.end !== null)
  const grandTotalMs = completed.reduce((sum, s) => sum + durationMs(s, now), 0)

  const lines: string[] = []
  lines.push('SHIFT TRACKER — shifts export')
  lines.push(`Generated: ${compactDate(new Date(now).toISOString())}`)
  lines.push(`Total: ${plural(shifts.length, 'shift')}, ${formatDuration(grandTotalMs)}`)

  if (shifts.length === 0) {
    lines.push('')
    lines.push('No shifts recorded yet.')
    return lines.join('\n') + '\n'
  }

  for (const [key, monthShifts] of groups) {
    const monthCompleted = monthShifts.filter((s) => s.end !== null)
    const monthTotalMs = monthCompleted.reduce(
      (sum, s) => sum + durationMs(s, now),
      0,
    )
    lines.push('')
    lines.push(
      `=== ${formatMonthLabel(key)} — ${plural(monthShifts.length, 'shift')}, ${formatDuration(monthTotalMs)} ===`,
    )

    for (const shift of monthShifts) {
      const end = shift.end ? formatTime(shift.end) : '(ongoing)'
      const dur = shift.end ? `  ${formatDuration(durationMs(shift, now))}` : ''
      lines.push(`${compactDate(shift.start)}   ${formatTime(shift.start)}–${end}${dur}`)
      const note = shift.note.trim()
      if (note !== '') {
        // Keep the note readable on one line.
        lines.push(`  Note: ${note.replace(/\s*\n\s*/g, ' ')}`)
      }
    }
  }

  return lines.join('\n') + '\n'
}
