import { useState } from 'react'
import type { Category } from '../lib/types'
import { CATEGORY_COLORS } from '../lib/categories'
import { Modal } from './Modal'

type CategoryManagerProps = {
  categories: Category[]
  onAdd: (name: string, color: string) => void
  onUpdate: (id: string, patch: Partial<Omit<Category, 'id'>>) => void
  onDelete: (id: string) => void
  onClose: () => void
}

function Swatches({
  value,
  onPick,
}: {
  value: string
  onPick: (color: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORY_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          aria-label={`Color ${c}`}
          onClick={() => onPick(c)}
          className={[
            'h-7 w-7 rounded-full ring-2 ring-offset-2 ring-offset-slate-800',
            value === c ? 'ring-slate-200' : 'ring-transparent',
          ].join(' ')}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  )
}

/** Add, rename, recolor, or delete categories. Deleting un-categorizes entries. */
export function CategoryManager({
  categories,
  onAdd,
  onUpdate,
  onDelete,
  onClose,
}: CategoryManagerProps) {
  const [editingColor, setEditingColor] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState<string>(CATEGORY_COLORS[0])

  function addNew() {
    if (newName.trim() === '') return
    onAdd(newName, newColor)
    setNewName('')
    setNewColor(CATEGORY_COLORS[(categories.length + 1) % CATEGORY_COLORS.length])
  }

  return (
    <Modal title="Categories" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <p className="text-sm text-slate-400">
          Tag entries (like sick days) with a color. Deleting a category keeps its
          entries — it just removes the tag.
        </p>

        <div className="flex flex-col gap-2">
          {categories.map((c) => (
            <div key={c.id} className="rounded-xl bg-slate-900 p-2.5 ring-1 ring-slate-700">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Change color"
                  onClick={() => setEditingColor((id) => (id === c.id ? null : c.id))}
                  className="h-6 w-6 shrink-0 rounded-full ring-2 ring-slate-600"
                  style={{ backgroundColor: c.color }}
                />
                <input
                  value={c.name}
                  onChange={(e) => onUpdate(c.id, { name: e.target.value })}
                  className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-1 py-1 text-slate-100 outline-none focus:border-slate-600"
                />
                <button
                  type="button"
                  aria-label={`Delete ${c.name}`}
                  onClick={() =>
                    setConfirmingDelete((id) => (id === c.id ? null : c.id))
                  }
                  className="shrink-0 rounded-lg p-2 text-slate-400 active:bg-slate-700"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                  </svg>
                </button>
              </div>

              {editingColor === c.id && (
                <div className="mt-2.5">
                  <Swatches
                    value={c.color}
                    onPick={(color) => {
                      onUpdate(c.id, { color })
                      setEditingColor(null)
                    }}
                  />
                </div>
              )}

              {confirmingDelete === c.id && (
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="flex-1 text-sm text-slate-300">Delete “{c.name}”?</span>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(null)}
                    className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm font-medium text-slate-200 active:bg-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(c.id)
                      setConfirmingDelete(null)
                    }}
                    className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white active:bg-rose-700"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add new */}
        <div className="flex flex-col gap-2 border-t border-slate-700 pt-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            New category
          </span>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name"
            onKeyDown={(e) => e.key === 'Enter' && addNew()}
            className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-500"
          />
          <Swatches value={newColor} onPick={setNewColor} />
          <button
            type="button"
            onClick={addNew}
            disabled={newName.trim() === ''}
            className="rounded-xl bg-emerald-600 py-2.5 font-medium text-white active:bg-emerald-700 disabled:opacity-40"
          >
            Add category
          </button>
        </div>
      </div>
    </Modal>
  )
}
