# Project Progress

## 2026-10-21 — Step 0: Project planning and repository setup
**Status:** Documentation initialised; implementation not started.

### Decisions
- One repository and separate ChatGPT conversations for each phase.
- Python UDP receiver on MacBook is the first technical milestone.
- React/TypeScript race-control dashboard with AI message banner, track map, leaderboard, gauges and **combined overlaid throttle/brake line chart**.
- Local processing for low-latency feedback; AWS for storage and deeper analytics.
- Use AWS SAM/CloudFormation for infrastructure as code when the cloud phase begins.
- Prioritise security, monitoring and low cost.

### Phase checklist
- [ ] Phase 1 — Receive and decode live F1 25 PS5 UDP telemetry
- [ ] Phase 2 — Build local live race-control dashboard
- [ ] Phase 3 — Deploy AWS backend and monitoring
- [ ] Phase 4 — Integrate data-grounded AI analysis
- [ ] Phase 5 — Add voice and live coaching
- [ ] Phase 6 — Evaluate advanced streaming and polish portfolio

### Next action
Confirm PS5/MacBook network setup and Python version; configure F1 25 telemetry and test receipt of UDP packets.

### Evidence to capture
Document setup, sample *sanitised* packet metadata, test results, architecture changes, screenshots and cost decisions as phases progress.
