import { useRef, useState } from 'react'
import type { Shift } from '../lib/types'
import { exportData, importData } from '../lib/store'
import { Modal } from './Modal'

type DataMenuProps = {
  shifts: Shift[]
  onImport: (shifts: Shift[]) => void
  onClose: () => void
}

/** Backup & restore: export shifts to a JSON file, or import one back. */
export function DataMenu({ shifts, onImport, onClose }: DataMenuProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<Shift[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleExport() {
    const blob = new Blob([exportData(shifts)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const stamp = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `shift-tracker-backup-${stamp}.json`
    // Append to the DOM and defer cleanup so mobile browsers (notably Firefox
    // for Android) reliably fetch the blob before the URL is revoked.
    document.body.appendChild(a)
    a.click()
    setTimeout(() => {
      a.remove()
      URL.revokeObjectURL(url)
    }, 0)
  }

  async function handleFile(file: File) {
    setError(null)
    try {
      const text = await file.text()
      const imported = importData(text)
      setPending(imported)
    } catch {
      setError('That file could not be read as a valid backup.')
    }
  }

  return (
    <Modal title="Backup & restore" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <p className="text-sm text-slate-400">
          Your shifts are stored on this device. Export a backup file to keep them
          safe or move them to another device.
        </p>

        <button
          type="button"
          onClick={handleExport}
          className="rounded-xl bg-slate-700 py-3 font-medium text-slate-100 active:bg-slate-600"
        >
          Export backup ({shifts.length} shift{shifts.length === 1 ? '' : 's'})
        </button>

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-xl bg-slate-700 py-3 font-medium text-slate-100 active:bg-slate-600"
        >
          Import from backup…
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = ''
          }}
        />

        {error && <p className="text-sm font-medium text-rose-400">{error}</p>}

        {pending && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
            <p className="text-sm text-amber-200">
              Replace all current data with{' '}
              <strong>
                {pending.length} shift{pending.length === 1 ? '' : 's'}
              </strong>{' '}
              from this backup? This can’t be undone.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setPending(null)}
                className="flex-1 rounded-xl bg-slate-700 py-2.5 font-medium text-slate-200 active:bg-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onImport(pending)
                  setPending(null)
                  onClose()
                }}
                className="flex-1 rounded-xl bg-amber-600 py-2.5 font-medium text-white active:bg-amber-700"
              >
                Replace
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
