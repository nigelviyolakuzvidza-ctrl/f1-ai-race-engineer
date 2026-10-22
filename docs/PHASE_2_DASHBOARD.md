# Phase 2 — Live Racing Dashboard

**Status:** Core dashboard operational; further improvements planned.

## 1. Objective

Build a real-time racing dashboard that receives genuine telemetry from F1 25 on PS5, visualises driving performance and displays the car's position on a recorded circuit.

## 2. Architecture

```text
PS5 — F1 25
    |
    | UDP telemetry (port 20777)
    v
MacBook — Python UDP Receiver
    |
    v
telemetry_latest.json
    |
    v
Python WebSocket Server
    |
    | ws://127.0.0.1:8765
    v
React + TypeScript Dashboard
    |
    +-- Speed and gear
    +-- Throttle and brake
    +-- Lap and session information
    +-- Live telemetry charts
    +-- Leaderboard
    +-- Tyre and vehicle information
    +-- Circuit map and live car position
```

All Phase 2 services run locally. No AWS infrastructure is required at this stage.

## 3. Technologies

| Technology | Purpose |
|---|---|
| Python | Receive, decode and process telemetry |
| UDP | Receive telemetry packets from the PS5 |
| WebSockets | Stream telemetry to the browser |
| React | Build the dashboard interface |
| TypeScript | Type-check frontend code |
| Vite | Frontend development and build tooling |
| Recharts | Visualise live telemetry |
| SVG | Render circuit geometry and car position |
| Git and GitHub | Version control and project documentation |

## 4. Implementation

### UDP telemetry

The existing `udp_receiver.py` receives F1 25 telemetry and periodically updates `telemetry_latest.json`.

The telemetry includes speed, gear, throttle, brake, lap information, session details, leaderboard information and world-position coordinates.

### WebSocket integration

`websocket_server.py` reads the latest telemetry snapshot and sends updates to connected browser clients.

The server runs locally on port 8765 and restricts accepted browser origins to configured local development addresses.

### React dashboard

The dashboard is located in `frontend/`.

Live telemetry is used to update the driving metrics and charts. The speed trace and throttle/brake graph display approximately 30 seconds of recent data.

The dashboard retains its original visual design while replacing selected illustrative elements with genuine telemetry.

### Track recording

`track_recorder.py` records world-position coordinates from telemetry.

Recorded circuit coordinates are saved under `data/tracks/`.

The first recorded circuit is Melbourne, identified by track ID 0. A lap recording produced 444 positional points, with an approximately 8.2-metre gap between its first and last points.

A copy of the recorded circuit is stored in `frontend/public/tracks/` for browser access.

### Dynamic track map

The React dashboard loads the circuit file corresponding to the telemetry `track_id`.

Recorded world coordinates are scaled and projected into an SVG view. The player's current `world_x` and `world_z` coordinates position a live marker on the map.

If a circuit file is unavailable, the dashboard displays a fallback message rather than an incorrect track.

## 5. Running the application locally

From the repository root, start the UDP receiver:

```bash
source .venv/bin/activate
python udp_receiver.py
```

In a separate terminal, start the WebSocket server:

```bash
source .venv/bin/activate
python websocket_server.py
```

In another terminal, start the frontend:

```bash
cd frontend
npm run dev
```

Open the local URL displayed by Vite.

To record a circuit, run the UDP receiver and start the track recorder in another terminal:

```bash
source .venv/bin/activate
python track_recorder.py
```

After recording, copy the saved circuit JSON into `frontend/public/tracks/` to make it available to the dashboard.

## 6. Validation completed
## Phase 2 Enhancements — Automatic Track Recording and Lap Comparison

### Automatic circuit recording
- `race_analysis.py` processes live telemetry received through the WebSocket server.
- Uses session identifiers and track information to distinguish circuits.
- Records circuit coordinates and saves new track maps under `data/tracks/`.
- Supports existing circuit maps as a fallback.

### Live lap comparison
- Records speed, throttle, braking and distance throughout each lap.
- Detects completed laps and validates telemetry coverage.
- Tracks the latest completed lap and fastest valid recorded lap.
- Displays distance-aligned speed comparisons in the React dashboard.
- Saves lap recordings locally under `data/laps/`.

### Architecture
PS5 → UDP Receiver → WebSocket Server → Race Analysis → React Dashboard

### Data management
- Recorded lap files are excluded from Git using `.gitignore`.
- Temporary upgrade backups are excluded from Git.
- Race analysis currently runs locally without AWS infrastructure.

### Verification
- Live lap comparison confirmed working.
- Best and latest lap JSON files successfully generated.
- React production build completed successfully.
