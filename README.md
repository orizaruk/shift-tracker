# Shift Tracker

A simple, fast app for tracking work shifts — built as an **installable PWA** so it lives on
your phone's home screen, works offline, and keeps your data on the device.

## What it does

- **One big button** — tap to start a shift, tap again to stop. A live timer runs while you work.
- **Adjust the start time** while a shift is running (for when you forgot to hit start on time).
- **Month view** — your shifts, one month at a time, with the month's total hours. Arrow back and
  forward between months; tap the month name to jump back to today.
- **Edit any shift** — change its start, end, or note, or delete it. Great for fixing a shift you
  forgot to stop.
- **Add a shift from scratch** — forgot to track one entirely? Tap **+ Add shift**, enter the date,
  times, and an optional note, and log it after the fact.
- **Notes** — attach a note to any shift; shifts with notes show an icon and a preview in the list.
- **Backup & restore** — export all your shifts to a JSON file, or import one back (top-right icon).

## Run it

```bash
npm install
npm run dev        # local dev server (http://localhost:5173)
npm run build      # production build into dist/
npm run preview    # preview the production build locally
npm run icons      # regenerate app icons from public/favicon.svg
```

## Get it onto your phone

The app is a PWA. To **install it to your home screen** (fullscreen, offline, app-like), the phone
needs to load it over **HTTPS** (or `localhost`). Pick whichever hosting option suits you:

### Option A — GitHub Pages (chosen setup)

A GitHub Actions workflow (`.github/workflows/deploy.yml`) is already included. Once the repo is on
GitHub, **every push to `main` rebuilds and republishes automatically** — no manual build/upload.

One-time setup:

1. Create a new, empty repository on github.com (e.g. `shift-tracker`) — **don't** add a README or
   `.gitignore`, this project already has them.
2. Connect it and push (the project is already committed locally):
   ```bash
   git remote add origin https://github.com/<your-username>/shift-tracker.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. Watch the **Actions** tab — when the "Deploy to GitHub Pages" run goes green, your app is live at
   `https://<your-username>.github.io/shift-tracker/`.
5. On your S24, open that URL in Chrome → **⋮ menu → Add to Home screen / Install app**. It now opens
   fullscreen and works offline.

After that, publishing an update is just `git push`. The repo can be public or private; either way
the **site URL is publicly reachable** (it's only the app's code — your shift data stays on your
phone and is never uploaded).

### Option B — Self-host on your mini PC

Serve the `dist/` folder. For the installable/offline PWA experience you need HTTPS; the easiest
ways on a home server:

- **Tailscale** (no domain needed): install Tailscale on the mini PC and your phone, then
  `tailscale serve` the built site — Tailscale gives it a trusted `https://…ts.net` address that
  works on your phone.
- **Caddy** with a domain: `caddy file-server --root dist` behind a domain gets you automatic
  HTTPS via Let's Encrypt.

> Plain `http://<mini-pc-ip>` over your LAN also works as a normal web page (data still persists in
> that browser), but Android won't offer **Install** or run it offline without HTTPS.

## Your data & backups

- Shifts are stored **locally on the device**, in the browser's `localStorage`, under the key
  `shift-tracker:data:v1`. Nothing is sent anywhere.
- The app asks the browser to keep this data **persistent** so it isn't evicted automatically.
- Because the data is local, **clearing the browser's site data will erase your shifts** — use
  **Backup & restore** (top-right icon) to export a JSON file periodically, especially before
  switching phones or browsers.

## Tech

React + TypeScript + Vite, Tailwind CSS v4, and `vite-plugin-pwa` for the manifest, service worker,
and offline caching. No backend. See `CLAUDE.md` for architecture and decisions.

## Project layout

```
src/
  lib/        types, localStorage data layer, date/time helpers
  hooks/      useShifts (state + actions), useNow (live clock)
  components/ StartStopButton, MonthNav, ShiftList, ShiftRow, ShiftEditor, DataMenu, Modal
  App.tsx     composition
public/       icons (regenerate with `npm run icons`)
scripts/      generate-icons.mjs
```
