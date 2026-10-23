# Phase 2 — Live Racing Dashboard and Lap Analysis

**Status:** Core implementation operational locally. AWS not deployed.

## Implemented architecture
```text
PS5 F1 25 --UDP:20777--> udp_receiver.py
  --> telemetry_latest.json (atomic snapshot updates, ~0.2 s)
  --> websocket_server.py (127.0.0.1:8765)
       |--> race_analysis.py (processes new snapshot timestamps)
       |      |--> data/tracks/track_<id>_<length>.json
       |      |--> data/laps/track_<id>_<length>_last.json
       |      +--> data/laps/track_<id>_<length>_best.json
       +--> React / TypeScript / Vite dashboard
```

## Dashboard
- Live speed, gear, RPM, throttle, brake, session and lap data, leaderboard and vehicle condition.
- Shared throttle/brake graph (0–100%) and recent telemetry history.
- Circuit map from recorded track coordinates and current car world position; fallback when track geometry is unavailable.
- Current-lap vs best-lap distance-aligned speed comparison, where sufficient samples exist.
- Phase 4 AI engineer banner is a placeholder, not live AI coaching.

## Automatic track recording and lap comparison
`race_analysis.py` The system records key session and track information, including track length, car position, speed, throttle and braking. As each lap is completed, it checks that the data is accurate and complete before saving it. Valid laps are stored locally in JSON files, keeping a record of the latest and fastest laps. If a track layout has not already been saved, the system can also use the recorded car positions from a completed lap to create one automatically.

`track_recorder.py` is also present as an independent, manually run track-recording utility. Track geometry under `data/tracks/` is not always automatically copied into `frontend/public/tracks/`; static assets are used for browser track loading.

## Run locally
Installed Python dependencies (including `websockets`) in `.venv`, and frontend npm dependencies. Then used three terminals from the repository root:

Terminal 1:
```bash
source .venv/bin/activate
python udp_receiver.py
```
Terminal 2:
```bash
source .venv/bin/activate
python websocket_server.py
```
Terminal 3:
```bash
cd frontend
npm run dev
```
npm run dev generates the Vite URL. The server accepts the configured localhost origins. It is here we can view the dashboard.

## Verification documented during Phase 2
- Local WebSocket feed and React dashboard displayed live PS5 telemetry.
- Automatic track recording and lap comparison were reported working.
- Latest and best lap JSON files were generated.
- React production build was reported successful.

## Known limitations
- Race analysis is invoked from the WebSocket client handler; without a connected dashboard, automatic recording may not progress.
- Files ending `_last.json` and `_best.json` are replaced by subsequent laps; full historical lap retention is not yet implemented.
- Recording state is in memory and does not resume an unfinished lap after process restart.
- No AWS upload queue or cloud persistence exists yet.

## Phase 3 handoff
Preserve the local pipeline, decouple durable lap recording from dashboard connections, add unique lap files and retryable uploads, then integrate the planned serverless AWS backend.
