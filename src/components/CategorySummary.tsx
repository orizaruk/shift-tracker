import { useMemo } from 'react'
import type { Category, Shift } from '../lib/types'
import { Dot } from './CategoryPicker'

type CategorySummaryProps = {
  categories: Category[]
  shifts: Shift[]
}

/** A compact "● Sick day 2  ● Vacation 1" tally for the visible month. */
export function CategorySummary({ categories, shifts }: CategorySummaryProps) {
  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of shifts) {
      if (s.categoryId) map.set(s.categoryId, (map.get(s.categoryId) ?? 0) + 1)
    }
    return categories
      .filter((c) => map.has(c.id))
      .map((c) => ({ category: c, count: map.get(c.id) as number }))
  }, [categories, shifts])

  if (counts.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {counts.map(({ category, count }) => (
        <span
          key={category.id}
          className="flex items-center gap-1.5 rounded-full bg-slate-800/70 px-2.5 py-1 text-xs font-medium text-slate-200 ring-1 ring-slate-700"
        >
          <Dot color={category.color} size={8} />
          {category.name}
          <span className="text-slate-400">{count}</span>
        </span>
      ))}
    </div>
  )
}
