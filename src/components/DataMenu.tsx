import { useRef, useState } from 'react'
import type { Category, Shift } from '../lib/types'
import { exportData, importData, type LoadedData } from '../lib/store'
import { exportText } from '../lib/exportText'
import { Modal } from './Modal'

type DataMenuProps = {
  shifts: Shift[]
  categories: Category[]
  onImport: (shifts: Shift[], categories: Category[]) => void
  onClose: () => void
}

function todayStamp(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Trigger a file download in a way that's reliable on mobile browsers. */
function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  // Append to the DOM and defer cleanup so mobile browsers (notably Firefox
  // for Android) reliably fetch the blob before the URL is revoked.
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    a.remove()
    URL.revokeObjectURL(url)
  }, 0)
}

const buttonClass =
  'rounded-xl bg-slate-700 py-3 font-medium text-slate-100 active:bg-slate-600'

const sectionTitleClass =
  'text-xs font-semibold uppercase tracking-wide text-slate-500'

/** Export shifts as readable text or a JSON backup, or import a backup back. */
export function DataMenu({ shifts, categories, onImport, onClose }: DataMenuProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<LoadedData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  function handleExportText() {
    downloadFile(exportText(shifts, categories), `shifts-${todayStamp()}.txt`, 'text/plain')
  }

  async function handleCopyText() {
    setError(null)
    try {
      await navigator.clipboard.writeText(exportText(shifts, categories))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Couldn’t copy to the clipboard — use “Download .txt” instead.')
    }
  }

  function handleExportJson() {
    downloadFile(
      exportData(shifts, categories),
      `shift-tracker-backup-${todayStamp()}.json`,
      'application/json',
    )
  }

  async function handleFile(file: File) {
    setError(null)
    try {
      const text = await file.text()
      setPending(importData(text))
    } catch {
      setError('That file could not be read as a valid backup.')
    }
  }

  const count = `${shifts.length} entr${shifts.length === 1 ? 'y' : 'ies'}`

  return (
    <Modal title="Export & backup" onClose={onClose}>
      <div className="flex flex-col gap-5">
        {/* Readable text export */}
        <section className="flex flex-col gap-2">
          <h3 className={sectionTitleClass}>Readable text</h3>
          <p className="text-sm text-slate-400">
            A plain-text list of your entries by month — dates, hours, categories, and notes.
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={handleExportText} className={`flex-1 ${buttonClass}`}>
              Download .txt
            </button>
            <button type="button" onClick={handleCopyText} className={`flex-1 ${buttonClass}`}>
              {copied ? 'Copied ✓' : 'Copy text'}
            </button>
          </div>
        </section>

        {/* JSON backup & restore */}
        <section className="flex flex-col gap-2 border-t border-slate-700 pt-4">
          <h3 className={sectionTitleClass}>Backup & restore</h3>
          <p className="text-sm text-slate-400">
            Your data lives on this device. Save a backup file (entries + categories)
            to keep it safe or move it to another device.
          </p>
          <button type="button" onClick={handleExportJson} className={buttonClass}>
            Export backup ({count})
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className={buttonClass}
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
        </section>

        {error && <p className="text-sm font-medium text-rose-400">{error}</p>}

        {pending && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
            <p className="text-sm text-amber-200">
              Replace all current data with{' '}
              <strong>
                {pending.shifts.length} entr{pending.shifts.length === 1 ? 'y' : 'ies'}
              </strong>{' '}
              and {pending.categories.length} categor
              {pending.categories.length === 1 ? 'y' : 'ies'} from this backup? This can’t be undone.
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
                  onImport(pending.shifts, pending.categories)
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
