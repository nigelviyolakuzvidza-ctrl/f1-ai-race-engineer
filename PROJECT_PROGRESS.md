# Project Progress

**Updated: 2026-10-23.** Status reflects code in the repository, not a new live validation run.

## Phase checklist
- [x] Phase 1 — Receive and decode live F1 25 PS5 telemetry
- [x] Phase 2 — Operational local dashboard, automatic track recording and lap comparison
- [ ] Phase 3 — AWS backend and monitoring (planning)
- [ ] Phase 4 — Data-grounded AI analysis
- [ ] Phase 5 — Voice and live coaching
- [ ] Phase 6 — Advanced streaming and portfolio polish

## Phase 1 — Completed and validated
- Configured PS5 F1 25 UDP format 2025 on port 20777 at 60 Hz.
- Implemented Python binary decoding for supported packet IDs 0, 1, 2, 3, 6, 7 and 10.
- Published atomic JSON telemetry snapshots approximately every 0.2 seconds.
- Validated live speed, throttle, brake, gear, lap timing, leaderboard, tyre and ERS data; see [Phase 1 evidence](docs/PHASE_1_TELEMETRY.md).

## Phase 2 — Core implementation operational
- React/TypeScript dashboard receives local telemetry through `websocket_server.py` on port 8765.
- Live gauges, timing, standings, vehicle data, circuit map and telemetry charts implemented.
- `race_analysis.py` automatically captures circuit geometry when a valid completed lap permits it.
- Distance-aligned lap samples support current/last/best comparisons.
- Local best/last lap JSON and track geometry are saved under `data/`; frontend has static track files for browser access.
- Phase 2 documentation records successful live lap comparison and frontend production build.

## Known gaps before cloud integration
1. `race_analysis.py` is called from the WebSocket client handler, so processing depends on an active dashboard connection.
2. Best/last lap files are overwritten; durable per-lap history is not yet implemented.
3. No persistent upload queue, retries, authentication or AWS backend exists.
4. Automatic track files created under `data/tracks/` are not automatically made available as static frontend assets in every case.

## Phase 3 — Proposed, not deployed
- Preserve the local UDP/WebSocket/React experience.
- Make completed laps independently and durably recorded, with unique identifiers and retryable local upload queue.
- Design SAM/CloudFormation for API Gateway HTTP API, Lambda, DynamoDB, S3, IAM and CloudWatch.
- Set AWS budgets/retention and validate cost assumptions before deploying; target £5/month.
- Capture architecture decisions, tests, monitoring evidence and cleanup instructions for portfolio use.

**Next action:** Review and agree Phase 3 Milestone 1 (durable local lap recording) before any application changes or AWS deployment.
