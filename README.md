# F1 AI Race Engineer

**Status:** Phases 1–2 operational locally · Phase 3 AWS backend planned (not yet deployed)

## Project overview

F1 AI Race Engineer is a hands-on engineering project that turns real telemetry from **F1 25 on PlayStation 5** into a live race-control dashboard. It combines network data collection, Python packet decoding, local real-time streaming, and a React/TypeScript interface for analysing driving performance.

The current system runs locally on a MacBook. The next stage is a serverless AWS backend for durable session storage and analysis, followed by an AI-powered voice race engineer. **AWS and AI functionality are planned, not currently live.**

## Live demonstration

A 27-second recording shows real PS5 gameplay alongside the dashboard responding to live telemetry.

**[Watch the live telemetry demo](PASTE_GITHUB_VIDEO_URL_HERE)**

> Replace `PASTE_GITHUB_VIDEO_URL_HERE` with the GitHub video attachment URL. This link is a placeholder until the video is added.

## What works today

- **Live telemetry:** Receive F1 25 UDP packets on port `20777`, decoding supported motion, session, lap, event, car telemetry, status and damage data.
- **Local processing:** Write structured snapshots to `telemetry_latest.json` approximately five times per second.
- **Real-time dashboard:** Stream snapshots through a Python WebSocket server to a React/TypeScript frontend.
- **Race monitoring:** Display speed, RPM, gear, throttle and brake inputs, lap timing, leaderboard, vehicle condition and supported circuit maps.
- **Performance analysis:** Plot throttle and brake together on a 0–100% chart and compare current, latest and fastest laps using distance-aligned speed samples.
- **Track recording:** Automatically record circuit geometry when sufficient valid lap samples are available and plot the player's position using world coordinates.

## Current system architecture

```text
PS5 / F1 25
    │ UDP telemetry (port 20777)
    ▼
Python receiver (udp_receiver.py)
    │
    ▼
telemetry_latest.json
    │
    ▼
Python WebSocket server (websocket_server.py)
    ├── race_analysis.py (lap and track processing)
    │
    ▼
React + TypeScript / Vite dashboard
```

All processing and visualisation currently run locally. The AWS backend is not yet deployed.

## Technology stack

| Area | Technology |
| --- | --- |
| Telemetry and processing | Python, UDP, JSON |
| Live transport | Python WebSockets |
| Dashboard | React, TypeScript, Vite |
| Development | macOS, Git, GitHub |
| Planned cloud infrastructure | AWS SAM / CloudFormation, API Gateway, Lambda, DynamoDB, S3, IAM, CloudWatch |
| Planned AI integration | Voice interaction and AI-assisted race guidance |

## Development roadmap

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Capture and decode genuine PS5 telemetry | Complete |
| 2 | Live dashboard, track recording and lap comparison | Operational locally |
| 3 | AWS serverless ingestion, storage and monitoring | Planning |
| 4 | AI race engineer and voice interaction | Planned |
| Later phases | Packaging, demonstration and documentation improvements | Planned |

See the [full project roadmap](docs/PROJECT_ROADMAP.md) for the detailed implementation plan.

## Run locally

With the Python virtual environment and frontend dependencies installed, start each process in a separate terminal from the repository root.

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

**Terminal 3 — dashboard**
```bash
cd frontend
npm run dev
```

Configure the game to send UDP telemetry to the MacBook's local IP address on port `20777`. The dashboard connects to the local WebSocket service at `ws://127.0.0.1:8765`. The separate `track_recorder.py` script remains available for manual recording; `race_analysis.py` also supports automatic track recording.

## Current limitations

- Lap and track processing in `race_analysis.py` currently runs in the WebSocket client's handling path, so it depends on an active dashboard connection.
- Local `*_last.json` and `*_best.json` lap files are replaced as new laps are recorded; complete historical retention is not yet implemented.
- Generated `data/laps/` files and `telemetry_latest.json` are excluded from Git.
- The AI engineer panel is currently a placeholder, not a working voice or AI service.
- AWS ingestion, authentication, durable cloud uploads and monitoring have not yet been implemented.

## Documentation

- [Project roadmap](docs/PROJECT_ROADMAP.md)
- [Phase 1 — Telemetry](docs/PHASE_1_TELEMETRY.md)
- [Phase 2 — Dashboard and analysis](docs/PHASE_2_DASHBOARD.md)
- [Architecture and design decisions](docs/architecture.md)
- [Project progress and next steps](PROJECT_PROGRESS.md)

## Next: AWS backend

Phase 3 will introduce a serverless backend using **AWS SAM / CloudFormation, API Gateway, Lambda, DynamoDB, S3, IAM and CloudWatch**. The intention is to preserve the existing local dashboard while making completed lap recordings durable and uploads retryable, with an initial operating budget target of **£5/month**. Deployment and validation are still to come.
