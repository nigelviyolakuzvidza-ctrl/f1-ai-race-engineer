# Architecture and Design Decisions

**Status:** Proposed architecture; not yet deployed.

## Context
F1 25 on PS5 can transmit telemetry over the local network using UDP. A MacBook will receive packets, parse them and supply a browser dashboard. Selected data and summaries may be sent to AWS for storage and AI-assisted analysis.

## Conceptual data flow
```text
PS5 / F1 25
   | UDP on LAN
   v
MacBook Python UDP listener -> parser / validation -> local metrics
                                                |             |
                                                v             v
                                        WebSocket server   secure upload
                                                |             |
                                                v             v
                                         React dashboard   AWS API Gateway
                                                              |
                                                           Lambda
                                                           /    \
                                                     DynamoDB   S3
                                                              |
                                                  summaries / Bedrock
```
This is a logical design, not a claim that all listed services are required.

## Decisions
### ADR-001 — Local first
Prove and validate packet reception and parsing before cloud deployment. This reduces cost and simplifies troubleshooting.

### ADR-002 — Separate low-latency and cloud workloads
Use local deterministic calculations for immediate feedback; use AWS for persistence, session summaries and contextual AI analysis. Cloud connectivity should not be required for basic live telemetry.

### ADR-003 — Serverless AWS starting point
Evaluate API Gateway, Lambda, DynamoDB and S3 with SAM/CloudFormation. Choose ingestion cadence and payload sizes after measuring telemetry volume; avoid uploading every packet by default.

### ADR-004 — Data-grounded AI
Calculate measurable driving metrics in code. Supply relevant metrics and race context to Bedrock for explanations and coaching; do not treat generated recommendations as measured facts.

### ADR-005 — Cost and security
Use least-privilege IAM, avoid embedded credentials, authenticate cloud uploads, minimise retention and set budget/monitoring controls before deployment. MSK/Flink are exploratory future options, not initial dependencies.

## Open questions to validate in Phase 1
- Exact F1 25 UDP packet version and supported fields
- Availability of other cars' telemetry and position data
- Packet rate, size, drop behaviour and local network reliability
- Timing and alignment approach for lap comparisons
- Appropriate retention and upload frequency for AWS

## Planned dashboard
Dark multi-panel race-control view based on the project's supplied visual reference: full-width AI message banner, standings, live gauges, track map, car/tyre condition and live charts. Throttle and brake must appear as two overlaid traces on one 0–100% plot.

## Portfolio evidence
Record decisions, validation tests, failure handling, diagrams, AWS costs and operational lessons throughout development.
