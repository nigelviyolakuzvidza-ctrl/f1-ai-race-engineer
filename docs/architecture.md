# Architecture and Design Decisions

**Status: Phases 1–2 implemented locally; Phase 3 AWS backend proposed, not deployed.**

## Implemented local data flow
```text
PS5 / F1 25
  | UDP, format 2025, port 20777
  v
udp_receiver.py -> telemetry_latest.json (atomic snapshot, ~5 Hz)
                       |
                       v
                 websocket_server.py (localhost:8765)
                       |                     |
                       v                     v
                 race_analysis.py       React dashboard
                       |
                data/tracks/ and data/laps/
```
`race_analysis.py` is currently called by the WebSocket server when processing fresh telemetry for a connected client. It creates track geometry and best/last lap recordings. The dashboard also uses track files in `frontend/public/tracks/`.

## Proposed Phase 3 (not deployed)
```text
MacBook local recording -> durable completed-lap files
                       -> persistent upload queue + retry
                       -> HTTPS API Gateway HTTP API
                       -> Lambda
                           |--> DynamoDB: session and lap metadata
                           +--> S3: full lap samples and exports
```
Provision with AWS SAM/CloudFormation. Use IAM least privilege, authentication, CloudWatch logs/alarms and cost controls. Keep real-time rendering and telemetry decoding local. No direct per-packet cloud upload is planned.

## Architecture decisions
- **ADR-001 Local-first:** PS5 UDP decoding and immediate dashboard updates run locally.
- **ADR-002 Separate low-latency from cloud:** AWS persists completed laps and summaries; connectivity is not needed for racing.
- **ADR-003 Serverless starting point:** Evaluate API Gateway HTTP API, Lambda, DynamoDB and S3 before deploying; avoid unnecessary streaming infrastructure.
- **ADR-004 Data-grounded AI:** Compute driving metrics deterministically; later Bedrock explanations must use recorded evidence.
- **ADR-005 Security and cost:** Authenticate requests, avoid committed secrets, apply least-privilege IAM, limit logs and retention, and set budget alerts. Target £5/month, not a guaranteed cap.
- **ADR-006 Proposed durable ingestion:** Store uniquely identified laps locally, queue uploads across restarts and use idempotent backend handling. Not implemented yet.

## Known technical limitations
- Best/last lap files overwrite earlier versions; no complete local history.
- Race analysis currently depends on WebSocket client processing.
- Cloud resources, persistent upload queue and AI/voice services do not yet exist.

## Documentation
See [roadmap](PROJECT_ROADMAP.md), [Phase 1](PHASE_1_TELEMETRY.md), [Phase 2](PHASE_2_DASHBOARD.md), and [progress tracker](../PROJECT_PROGRESS.md).
