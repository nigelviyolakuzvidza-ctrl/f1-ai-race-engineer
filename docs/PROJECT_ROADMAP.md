# Project Roadmap: AI F1 Race Engineer

This document is the **authoritative six-phase project roadmap**. As of 2026-10-23, Phases 1–2 are operational locally; Phase 3 is planning only.

## Phase 1 — Connect to the F1 game

**Implementation status: completed and validated.**

**Foundation**

**Goal:** Receive genuine telemetry from your PS5.

- Configure the game's UDP telemetry output.
- Build a Python receiver on my computer.
- Decode speed, throttle, brake, gear, lap time and other available data.
- Verify that packets arrive consistently during a race.

**Deliverable:** A working telemetry feed.

## Phase 2 — Build a live racing dashboard

**Implementation status: core dashboard, automatic track recording and lap comparison operational locally.**

**Goal:** Turn raw packets into something useful.

- Build a React dashboard displaying speed, gear, throttle and braking.
- Show current lap times and session information.
- Plot telemetry over time and compare laps where the data permits.
- Add a simple local WebSocket connection for live updates.

**Deliverable:** A live dashboard while you race.

### Agreed dashboard design requirements

Use the race-control dashboard reference image taken at the AWS convention as inspiration.

- Dark, multi-panel race-control interface.
- Full-width AI engineer message banner across the top.
- Telemetry gauges (speed, gear, RPM, throttle and brake).
- Track map with live car position where telemetry permits.
- Live race leaderboard with positions and gaps where available.
- Lap timing and session information.
- Live telemetry charts.
- Tyre, brake and car condition panels where the game provides the data.
- **Throttle and brake MUST be shown as two overlaid line traces on ONE shared 0–100% graph**, not two separate graphs.
- Confirm availability of other drivers' detailed telemetry before planning competitor input comparisons.

## Phase 3 — Build the AWS backend

**Implementation status: planning; no AWS backend deployed.**

**Goal:** Turn the prototype into a cloud engineering project.

- Deploy the backend using AWS SAM and CloudFormation.
- Use API Gateway and Lambda for APIs and event-driven processing.
- Store race sessions and lap summaries in DynamoDB.
- Store raw telemetry or exported sessions in S3 where useful.
- Add IAM permissions, CloudWatch logs, alarms and error handling.

**Deliverable:** A deployed, monitored AWS application.

## Phase 4 — Add the AI race engineer

**Goal:** Make the system understand my race.

- Use Amazon Bedrock to interpret telemetry summaries and calculated metrics.
- Ask questions such as, "Where did I lose time this lap?"
- Generate coaching recommendations based on actual data.
- Give the AI access to relevant race-session context.
- Keep deterministic calculations separate from AI-generated explanations.

**Deliverable:** A race engineer that can analyse my driving.

## Phase 5 — Add voice and real-time coaching

**Goal:** Interact with the engineer while driving.

- Add speech input and spoken responses.
- Support questions about gaps, lap performance and race conditions.
- Trigger concise coaching messages when meaningful events occur.
- Keep latency low by doing immediate calculations locally and limiting unnecessary cloud requests.

**Deliverable:** A conversational AI race engineer.

## Phase 6 — Advanced streaming and portfolio polish

**Goal:** Evolve the project towards the AWS Summit architecture.

- Evaluate Amazon MSK and Managed Service for Apache Flink for continuous streaming analytics.
- Add richer race reports, historical comparisons and strategy analysis.
- Document architecture decisions, costs, security and monitoring.
- Publish a clean GitHub repository with diagrams and a demonstration video.

**Deliverable:** A polished portfolio project with an explainable architecture.
