import { useState } from 'react'
import type { Category } from '../lib/types'
import { CATEGORY_COLORS } from '../lib/categories'

type CategoryPickerProps = {
  categories: Category[]
  value: string | null
  onChange: (id: string | null) => void
  onCreate: (name: string, color: string) => Category
}

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition',
        selected
          ? 'bg-slate-700 text-slate-100 ring-slate-400'
          : 'bg-slate-900 text-slate-300 ring-slate-700 active:bg-slate-700',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

export function Dot({ color, size = 10 }: { color: string; size?: number }) {
  return (
    <span
      className="inline-block shrink-0 rounded-full"
      style={{ width: size, height: size, backgroundColor: color }}
    />
  )
}

/** Pick a category (or none) for an entry, with inline creation of new ones. */
export function CategoryPicker({
  categories,
  value,
  onChange,
  onCreate,
}: CategoryPickerProps) {
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState<string>(CATEGORY_COLORS[0])

  function submitNew() {
    const trimmed = name.trim()
    if (trimmed === '') return
    const created = onCreate(trimmed, color)
    onChange(created.id)
    setName('')
    setColor(CATEGORY_COLORS[0])
    setCreating(false)
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-slate-300">Category</span>
      <div className="flex flex-wrap gap-2">
        <Chip selected={value === null} onClick={() => onChange(null)}>
          None
        </Chip>
        {categories.map((c) => (
          <Chip key={c.id} selected={value === c.id} onClick={() => onChange(c.id)}>
            <Dot color={c.color} />
            {c.name}
          </Chip>
        ))}
        <Chip selected={false} onClick={() => setCreating((v) => !v)}>
          + New
        </Chip>
      </div>

      {creating && (
        <div className="flex flex-col gap-2 rounded-xl border border-slate-700 bg-slate-900 p-3">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category name"
            className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 outline-none focus:border-emerald-500"
            onKeyDown={(e) => e.key === 'Enter' && submitNew()}
          />
          <div className="flex flex-wrap gap-2">
            {CATEGORY_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Color ${c}`}
                onClick={() => setColor(c)}
                className={[
                  'h-7 w-7 rounded-full ring-2 ring-offset-2 ring-offset-slate-900',
                  color === c ? 'ring-slate-200' : 'ring-transparent',
                ].join(' ')}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setCreating(false)
                setName('')
              }}
              className="flex-1 rounded-lg bg-slate-700 py-2 text-sm font-medium text-slate-200 active:bg-slate-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitNew}
              disabled={name.trim() === ''}
              className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white active:bg-emerald-700 disabled:opacity-40"
            >
              Add category
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
