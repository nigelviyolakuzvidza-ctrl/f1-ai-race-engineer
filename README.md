# F1 AI Race Engineer

**Status: Phases 1–2 operational locally; Phase 3 AWS backend in planning (not deployed).**

A portfolio project using real F1 25 telemetry from PlayStation 5, a Python receiver on macOS, a React/TypeScript race-control dashboard, and a planned serverless AWS backend.

## Implemented features
- Receives F1 25 UDP packets on port 20777 and decodes supported motion, session, lap, event, car telemetry, status and damage fields.
- Publishes the latest structured telemetry snapshot to `telemetry_latest.json` approximately five times per second.
- Streams local snapshots to a React dashboard over a Python WebSocket server at `ws://127.0.0.1:8765`.
- Displays live speed, gear, RPM, throttle/brake, lap timing, leaderboard, vehicle condition, and supported circuit maps.
- Shows throttle and brake together on a shared 0–100% chart.
- Records track geometry automatically when sufficient valid lap samples are available, and renders the player's position from world coordinates.
- Compares current, latest and fastest recorded laps using distance-aligned speed samples.

## Current architecture
```text
PS5 / F1 25 UDP
   -> udp_receiver.py -> telemetry_latest.json
   -> websocket_server.py -> race_analysis.py (track and lap processing)
                           -> React / Vite dashboard
```
All of this currently runs on the MacBook. No AWS backend or AI/voice coaching has been deployed.

## Running locally
With Python dependencies installed in `.venv` and frontend dependencies installed:
```bash
source .venv/bin/activate
python udp_receiver.py
```
In a second terminal:
```bash
source .venv/bin/activate
python websocket_server.py
```
In a third terminal:
```bash
cd frontend
npm run dev
```
The browser dashboard connects to the local WebSocket service. The separate `track_recorder.py` script remains available as a manual recording utility; `race_analysis.py` also supports automatic track recording.

## Known limitations
- `race_analysis.py` runs as part of the WebSocket server's client-handling path, so processing currently depends on an active dashboard connection.
- Local lap files named `*_last.json` and `*_best.json` are overwritten as new laps are recorded; complete historical lap retention is not implemented.
- Generated `data/laps/` and `telemetry_latest.json` are ignored by Git.
- The frontend displays a Phase 4 AI engineer placeholder, not a working AI service.
- AWS ingestion, authentication, durable uploads, and cloud monitoring are proposed only.

## Roadmap and documentation
- [Six-phase project roadmap](docs/PROJECT_ROADMAP.md)
- [Phase 1 telemetry](docs/PHASE_1_TELEMETRY.md)
- [Phase 2 dashboard and analysis](docs/PHASE_2_DASHBOARD.md)
- [Architecture and decisions](docs/architecture.md)
- [Progress and next steps](PROJECT_PROGRESS.md)

## Next phase
Plan and implement an AWS backend using SAM/CloudFormation, API Gateway, Lambda, DynamoDB, S3, IAM and CloudWatch. Preserve the local dashboard; first make completed lap recordings durable and uploads retryable. Target budget: £5/month. No deployment has occurred.
