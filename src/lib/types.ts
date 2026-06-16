export type Category = {
  /** Stable unique id. */
  id: string
  /** Display name, e.g. "Sick day". */
  name: string
  /** Hex color, e.g. "#f43f5e". */
  color: string
}

export type Shift = {
  /** Stable unique id. */
  id: string
  /** ISO 8601 datetime when the shift started. For all-day entries, local midnight of the day. */
  start: string
  /** ISO 8601 datetime when the shift ended, or null while ongoing / for all-day entries. */
  end: string | null
  /** Free-text note for the owner; '' when empty. */
  note: string
  /** All-day entry (e.g. a sick day) with no specific hours. */
  allDay: boolean
  /** Optional category this entry belongs to, or null. */
  categoryId: string | null
}

/** Shape persisted to storage. Versioned so the format can evolve safely. */
export type ShiftData = {
  version: 2
  shifts: Shift[]
  categories: Category[]
}
