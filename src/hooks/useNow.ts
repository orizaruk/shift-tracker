import { useEffect, useState } from 'react'

/**
 * Returns the current time in ms, refreshed on an interval.
 * Pass `active = false` to stop ticking (e.g. when no shift is running).
 */
export function useNow(active: boolean, intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    // Kick an immediate refresh (deferred to the next task so we don't
    // setState synchronously inside the effect).
    const kick = setTimeout(() => setNow(Date.now()), 0)
    return () => {
      clearInterval(id)
      clearTimeout(kick)
    }
  }, [active, intervalMs])

  return now
}
