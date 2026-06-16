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
type Shift = {
  id: string;        // uuid
  start: string;     // ISO 8601 datetime
  end: string | null; // ISO 8601 datetime, or null while ongoing
  note: string;      // free text, '' if none
};
```

- A shift is **ongoing** when `end === null`. Only one ongoing shift at a time.
- Month grouping is by the **start** timestamp's local year-month.
- Duration = `end - start` (live `now - start` while ongoing).

## Project structure

- `src/lib/types.ts` — types
- `src/lib/store.ts` — localStorage persistence + load/save/export/import
- `src/lib/time.ts` — date/time formatting & month helpers
- `src/hooks/useShifts.ts` — state + actions (start/stop/edit/delete), persistence wiring
- `src/components/` — UI (StartStopButton, MonthNav, ShiftList, ShiftRow, ShiftEditor, etc.)
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
- [x] Initial commit made on `main`
- [x] Deploy target chosen: **GitHub Pages**, via `.github/workflows/deploy.yml`
      (auto build + deploy on every push to `main`). `base: './'` keeps assets working
      under any repo subpath.
- [ ] Owner's remaining manual steps (no `gh` CLI available locally): create a GitHub repo,
      `git remote add origin … && git push -u origin main`, set Pages source to "GitHub
      Actions", then Add-to-Home-screen on the S24. Full steps in README "Option A".

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
