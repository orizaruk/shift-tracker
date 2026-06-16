import type { Category } from './types'

/** Palette offered when creating/editing a category. Hex so it survives in data
 *  and renders via inline styles (Tailwind can't JIT runtime color values). */
export const CATEGORY_COLORS = [
  '#f43f5e', // rose
  '#fb923c', // orange
  '#fbbf24', // amber
  '#a3e635', // lime
  '#34d399', // emerald
  '#2dd4bf', // teal
  '#38bdf8', // sky
  '#818cf8', // indigo
  '#a78bfa', // violet
  '#f472b6', // pink
  '#94a3b8', // slate
] as const

/** Seeded for new installs and when migrating v1 data that had no categories. */
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'sick', name: 'Sick day', color: '#f43f5e' },
  { id: 'vacation', name: 'Vacation', color: '#38bdf8' },
  { id: 'holiday', name: 'Holiday', color: '#fbbf24' },
]
