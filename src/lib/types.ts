export type Shift = {
  /** Stable unique id. */
  id: string
  /** ISO 8601 datetime when the shift started. */
  start: string
  /** ISO 8601 datetime when the shift ended, or null while ongoing. */
  end: string | null
  /** Free-text note for the owner; '' when empty. */
  note: string
}

/** Shape persisted to storage. Versioned so the format can evolve safely. */
export type ShiftData = {
  version: 1
  shifts: Shift[]
}
