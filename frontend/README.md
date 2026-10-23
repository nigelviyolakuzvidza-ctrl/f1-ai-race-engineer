# F1 AI Race Engineer — Dashboard Frontend

The frontend is a **React + TypeScript + Vite** race-control dashboard for telemetry from **F1 25 on PlayStation 5**. It receives processed data from a Python WebSocket service running locally on the Mac. AWS integration and AI voice coaching are not implemented in this frontend yet.

For the overall project architecture and roadmap, see the [repository README](../README.md).

## Features

- Live speed, gear, RPM, throttle, braking, DRS, fuel, ERS, tyre condition, vehicle damage, session information and leaderboard.
- Real telemetry traces for speed and combined throttle/brake inputs, using a rolling 30-second window when connected.
- Track visualisation from recorded circuit coordinates, with a position marker derived from the car's world coordinates.
- Distance-aligned speed comparison between the current lap and the best completed valid lap.
- A bundled PS5 telemetry snapshot for initial display, plus a **Load snapshot** option for importing a local JSON file.
- A Phase 4 AI race engineer placeholder; no AI guidance is generated yet.

## Prerequisites

- Node.js and npm installed.
- Python environment and dependencies configured for the repository's UDP receiver and WebSocket server.
- For **live** data: F1 25 on PS5 configured to send UDP telemetry to the Mac's LAN IP on port `20777`.

## Run locally

From the repository root, start the telemetry pipeline in separate terminals:

**Terminal 1 — UDP receiver**
```bash
source .venv/bin/activate
python udp_receiver.py
```

**Terminal 2 — WebSocket server**
```bash
source .venv/bin/activate
python websocket_server.py
```

**Terminal 3 — frontend**
```bash
cd frontend
npm ci
npm run dev
```

Open the URL printed by Vite (typically `http://localhost:5173`; it may use `5174` if the first port is occupied). Use **Ctrl+C** in each terminal to stop the processes.

## How live data reaches the dashboard

```text
PS5 / F1 25
    │ UDP :20777
    ▼
udp_receiver.py
    │ writes telemetry_latest.json
    ▼
websocket_server.py
    │ invokes race_analysis.py for track/lap data
    │ WebSocket ws://127.0.0.1:8765
    ▼
frontend/src/App.tsx
    ├── race telemetry panels
    ├── rolling speed and throttle/brake charts
    ├── recorded circuit and car position
    └── lap comparison
```

The Python WebSocket server checks the telemetry file approximately every **0.2 seconds** and sends changed snapshots to connected clients. Track and lap analysis currently runs within the server's client-handling path, so recording depends on an active dashboard connection.

## Configuration and connection behaviour

- The frontend WebSocket URL is currently hard-coded in `src/App.tsx` as `ws://127.0.0.1:8765`.
- The Python server listens on loopback port `8765` and accepts development origins at `localhost` or `127.0.0.1`, ports `5173` and `5174`.
- The dashboard begins with a bundled PS5 snapshot and switches to live data when valid WebSocket messages arrive.
- The connection status and error messages are shown in the UI. The current implementation does **not** automatically reconnect after a disconnected WebSocket; refresh the page after restarting the server.
- **Load snapshot** reads a local JSON file in the browser; it does not upload the file to AWS or another service.

## Data notes and current limitations

- Rolling live speed and throttle/brake charts use incoming samples; they are not fabricated historical telemetry.
- The lap comparison requires valid completed-lap data from `race_analysis.py`. Local `*_last.json` and `*_best.json` files are overwritten as new laps are recorded; full lap history is not retained.
- A recorded track is shown when available from the analysis payload; the frontend can also try a matching static track JSON file. Other circuits may initially show **No recorded map for this circuit yet**.
- Leaderboard entries use car numbers where driver names are unavailable. Missing lap times are shown as dashes rather than estimated values.
- Tyre indices follow the incoming data order (RL, RR, FL, FR), mapped to the correct dashboard positions.
- ERS percentage is calculated against a nominal 4 MJ capacity. The AI engineer panel is a visual placeholder.
- The best-lap value in the timing strip is still a placeholder; the lap comparison panel separately displays the best completed valid lap when available.

## Validate the frontend

From `frontend/`:

```bash
npm run build
npm run lint
```

These commands compile and bundle the frontend and run ESLint. They do not replace testing against a live PS5 telemetry session.

## Further documentation

- [Phase 1 — Telemetry](../docs/PHASE_1_TELEMETRY.md)
- [Phase 2 — Dashboard and analysis](../docs/PHASE_2_DASHBOARD.md)
- [Architecture and design decisions](../docs/architecture.md)
- [Project progress](../PROJECT_PROGRESS.md)
