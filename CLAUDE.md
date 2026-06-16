# Shift Tracker

A personal work-shift tracking app. Built as an installable **PWA** so it runs on the
owner's Android phone (Galaxy S24) like a native app, works offline, and stores data
locally on the device.

## Owner's goals (source of truth)

The owner used to have a nice iOS shift-tracker and wants the same experience on Android.
Core experience requested:

- **One big circular button** in the center: tap to **start** a shift, tap again to **stop** it.
- While a shift is **ongoing**, show a live timer and allow **editing the start time**
  (for when they forgot to hit start at the real start).
- Stopped shifts are **logged into a month-based view**: see shifts grouped by the month they
  belong to, **one month visible at a time**, with the ability to move **back/forward** between
  months (defaults to the current month).
- Each shift shows its **date, start time, end time** (and duration).
- **Notes** can be attached to a shift; a shift with a note shows an indicator, and the note is
  viewable by opening the shift.
- **Retroactively edit** any shift — change start time, end time, note — or delete it.
- **Manually add a whole shift** after the fact (forgot to track it at all): enter date, start,
  end, and optional note, and log it directly. Same editor as edit, in "create" mode.
- **Readable plain-text export** of all shifts (grouped by month with totals; weekday + date,
  time range, hours, and notes) — downloadable as `.txt` or copyable to the clipboard. Separate
  from the JSON backup, which is for restoring.
- Should be **intuitive and pleasant** to use. Owner doesn't care about tech choices, just wants
  something that works and looks good.

The owner is the manager's "client": they describe, Claude builds and manages end-to-end.
They will not always be available to answer questions — make reasonable decisions and proceed.

## Tech decisions (and why)

- **PWA over native Android**: installable to home screen, offline, no app store / Android
  toolchain. Servable from the owner's mini PC or any static host.
- **React + TypeScript + Vite**: fast, modern, easy to iterate.
- **Tailwind CSS v4** (`@tailwindcss/vite`): rapid, consistent mobile-first styling.
- **`vite-plugin-pwa`**: manifest, service worker, offline caching, installability.
- **Persistence: `localStorage`** behind a small data layer (`src/lib/store.ts`). Shift data is
  tiny (a few hundred rows of timestamps), so localStorage is simple and reliable. The data layer
  is isolated so it can be swapped for IndexedDB or a server later without touching the UI.
- **JSON export/import** for backups — owner's hours are their income, so data must never be
  trapped or easily lost.
- **No date library** — native `Date` + `Intl` keep the bundle small.

## Data model

```ts
type Shift = {           // an "entry": a timed work shift OR an all-day entry
  id: string;            // uuid
  start: string;         // ISO 8601 datetime; for all-day, local midnight of the day
  end: string | null;    // ISO 8601 datetime; null while ongoing or for all-day
  note: string;          // free text, '' if none
  allDay: boolean;       // all-day entry (e.g. sick day) with no specific hours
  categoryId: string | null; // optional category tag
};

type Category = { id: string; name: string; color: string /* hex */ };

// Persisted: { version: 2, shifts: Shift[], categories: Category[] }
```

- A timed shift is **ongoing** when `!allDay && end === null`. Only one ongoing at a time.
- Month grouping is by the **start** timestamp's local year-month.
- Worked duration = `end - start` (live `now - start` while ongoing); all-day entries have no duration.
- **Storage v2** (key unchanged: `shift-tracker:data:v1`). `parseData` migrates v1 data in place:
  missing `allDay`/`categoryId` default to false/null; categories seed to defaults if absent;
  a `categoryId` not matching any category is nulled. Colors are hex (inline styles, since
  Tailwind can't JIT runtime color values).

## Project structure

- `src/lib/types.ts` — types (Shift, Category, ShiftData)
- `src/lib/categories.ts` — color palette + default seeded categories
- `src/lib/store.ts` — localStorage persistence + load/save/JSON export/import + v1→v2 migration
- `src/lib/exportText.ts` — readable plain-text report (grouped by month, categories, all-day)
- `src/lib/time.ts` — date/time formatting, month + date-range helpers
- `src/hooks/useShifts.ts` — state + actions for entries AND categories, persistence wiring
- `src/components/` — UI (StartStopButton, MonthNav, CategorySummary, ShiftList, ShiftRow,
  ShiftEditor, CategoryPicker, CategoryManager, DataMenu, Modal)
- `src/App.tsx` — composition

## Status

**v1 complete and verified working** (built, linted, and smoke-tested end-to-end in a
headless browser at Galaxy-S24 viewport with zero console errors).

- [x] Scaffolded (Vite React-TS), deps installed (Tailwind v4, vite-plugin-pwa)
- [x] Data layer (`store.ts`, `types.ts`, `time.ts`) + hooks (`useShifts`, `useNow`)
- [x] UI (StartStopButton, MonthNav, ShiftList/Row, ShiftEditor, DataMenu, Modal)
- [x] PWA config + generated icons (manifest, service worker, offline)
- [x] Build verified (`npm run build`) + lint clean (`npm run lint`)
- [x] Persistent-storage request (guards against eviction)
- [x] README with run + phone-install + deployment instructions
- [x] Initial commit on `main`; pushed to GitHub: **github.com/orizaruk/shift-tracker** (public)
- [x] **Deployed live** via GitHub Pages + Actions (`.github/workflows/deploy.yml`):
      **https://orizaruk.github.io/shift-tracker/** (HTTPS, manifest/sw/icons all 200).
      Auto-rebuilds and redeploys on every push to `main`. `base: './'` keeps assets working
      under the `/shift-tracker/` subpath.
- [x] **Readable text export** (`.txt` download + copy-to-clipboard) in the Export & backup sheet.
- [x] **Categories + all-day entries** (v2): optional color categories (seeded Sick day / Vacation /
      Holiday, fully manageable), all-day entries with no hours, date-range mass-add (one entry per
      day), color accents in the list, and a per-month category tally. Verified incl. v1 migration.
- [ ] Owner's only remaining step: open the URL on the S24 in Chrome → ⋮ → Add to Home screen.

### Deploy gotcha (for future reference)
The default Actions `GITHUB_TOKEN` could NOT create the Pages site
(`actions/configure-pages@v5` with `enablement: true` → "Resource not accessible by
integration"). Fixed by enabling Pages once out-of-band with the owner token:
`gh api -X POST repos/orizaruk/shift-tracker/pages -f build_type=workflow`, then removing
the self-enable step. Pages stays enabled; future deploys just work.

### Verified behaviours
Start→live timer→stop logs a shift; "adjust" edits an ongoing shift's start; manual
"+ Add shift" logs a past shift and jumps to its month; notes show an icon + preview;
month nav + totals work; editing an existing shift works.

### Audit pass (2026-06-16)
A `project-auditor` subagent reviewed all of `src/`. Confirmed correct: DST round-trips,
local month grouping, single-ongoing-shift guard, persistence timing, month arithmetic.
Fixes applied from its findings (all re-verified in-browser):
- **Storage failure now surfaced** — `saveShifts` throws on quota/private-mode/SecurityError;
  `useShifts` exposes `saveFailed`; `App` shows a red banner so a shift can't vanish silently.
- **Import hardening** — `isShift` rejects unparseable `start`/`end` and empty ids; `parseData`
  de-duplicates by id, so a corrupt/crafted backup can't create invisible (`NaN` month) shifts
  or make one delete erase two.
- **Edit precision** — editor preserves the original (sub-minute) ISO when a field is unchanged,
  so a no-op save no longer shaves up to 59s off start/end.
- **Same-minute shift editable** — validation now rejects only end *before* start (equal allowed),
  so a shift whose start/end share a minute can still be edited (e.g. to add a note).
- **Export robustness** — anchor appended to DOM + deferred `revokeObjectURL` (Firefox-Android).
- **Modal mutual-exclusion** — opening the editor or backup sheet closes the other.

### Possible next steps (not yet requested by owner)
- Decimal-hours display / pay estimate, week view, shift categories/tags, reminders,
  cloud sync. Hold until owner asks.

## How to run

- `npm run dev` — local dev server
- `npm run build` — production build to `dist/`
- `npm run preview` — preview the production build

Deployment notes live in `README.md`.
