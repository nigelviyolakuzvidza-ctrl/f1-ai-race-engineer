# F1 AI Race Engineer

**Status: Planning — implementation not started.**

A real-time race analytics and AI engineer project for **F1 25 on PlayStation 5**, using a MacBook, Python, React and AWS. Built as a hands-on cloud engineering portfolio project.

## Goals
- Receive and decode genuine F1 25 UDP telemetry on a MacBook.
- Build a multi-panel React race-control dashboard with live gauges, track map, standings and lap charts.
- Show **throttle and brake as two overlaid lines on one 0–100% chart**.
- Deploy secure, monitored AWS services for race-session storage and analysis.
- Provide data-grounded AI coaching and eventually spoken race-engineer interaction.

## Six-phase roadmap
1. **PS5 telemetry** — configure UDP, write a Python receiver and validate packet data.
2. **Live dashboard** — React/TypeScript, local WebSockets, telemetry graphs, leaderboard and track map.
3. **AWS backend** — SAM/CloudFormation, API Gateway, Lambda, DynamoDB, S3, IAM and CloudWatch.
4. **AI race engineer** — Bedrock explanations based on calculated metrics and session summaries.
5. **Voice and live coaching** — spoken questions, responses and event-driven coaching.
6. **Advanced analytics and portfolio** — evaluate MSK/Flink, improve reports and publish a demo.

## Proposed data flow
```text
PS5 (F1 25 UDP) -> MacBook (Python collector + local calculations)
                            |                      |
                      WebSocket server       Secure AWS ingestion
                            |                      |
                      React dashboard       Lambda -> DynamoDB / S3
                                                   |
                                            Summaries -> Bedrock
```

This architecture is **proposed, not deployed**. We'll validate which game data is available and measure traffic before finalising ingestion and storage.

## Engineering principles
Work incrementally, understand the code, document tests and decisions, use least-privilege IAM, minimise AWS costs, and never commit secrets.

See [project progress](PROJECT_PROGRESS.md) and [architecture notes](docs/architecture.md).
