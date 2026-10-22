# F1 AI Race Engineer — dashboard frontend

React + TypeScript + Vite implementation of the approved race-control design. Existing package versions and entry point are preserved. No AWS resources or extra dependencies are required.

## Run on your Mac

1. Keep a backup of your current `frontend` folder.
2. Copy this folder's contents into your project's `frontend` folder (or use it as the replacement frontend). Do not copy `node_modules` from the ZIP.
3. In your VS Code terminal, from the project's `frontend` folder:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Stop the dev server with Ctrl+C.

For an existing installation, the only required changes are `src/App.tsx`, `src/App.css`, `src/index.css`, the new `src/data/telemetry-sample.json`, and the page title in `index.html`. `main.tsx`, package dependencies, and Vite configuration remain as uploaded. The older `TelemetryGauges` component is preserved but no longer imported.

## What works now

- Responsive race-control layout, standings, lap/sector timing, speed, gear, RPM, throttle and brake gauges, DRS, fuel, ERS, tyre wear/inner temperatures, vehicle damage, session/weather and recent race events.
- Starts with the supplied real PS5 recording. It is labelled **snapshot mode — not live**.
- **Load snapshot** opens a local `telemetry_latest.json`; no file is uploaded to a service. Import requires the complete supplied schema. Refresh returns to the bundled recording.
- Hover the charts for illustrative values.

## Data correctness and pending work

- The speed and combined throttle/brake charts use clearly labelled synthetic illustrative traces. The supplied JSON is one snapshot, so it cannot supply historical samples. These traces do not represent the recorded drive and do not change when importing a snapshot.
- Standings use car numbers because participants/names are not present. Last lap is shown instead of inventing gaps; zero/missing lap times display a dash. Standings colours are decorative car markers, not verified team identities.
- Best lap displays a dash until lap history is collected. The bundled session UID exceeds JavaScript's safe integer range; it is not used as an identifier. A future transport should send it as a string.
- Tyre arrays are displayed using the raw F1 order **RL, RR, FL, FR** (indices 0, 1, 2, 3). Verify whether the receiver reorders them before live integration.
- ERS percentage uses a nominal 4 MJ maximum; fuel bar uses the supplied tank capacity. Fuel remaining is the game's estimate.
- Front-wing summary is the maximum of left/right damage, with both values shown underneath when damaged. Event list is session-wide, not necessarily player events.
- The static track outline is an illustrative layout preview, with no live car mapping. AI banner is a Phase 4 placeholder. Track ID 0 is Melbourne; session type 15 is the race/Grand Prix label for this supplied recording.
- Next: connect the existing Python receiver through a local WebSocket, handle stale/disconnected data, collect real rolling chart samples, then validate positional mapping. No WebSocket server was supplied, and none is assumed here.

## Validation

```bash
npm run build
npm run lint
```

Validation completed here: TypeScript compilation, Vite production bundling and ESLint passed. Browser visual verification could not run because the browser download was unavailable. Check the layout on your Mac using npm run dev. Vite reports a non-blocking chunk size advisory for the chart library.
