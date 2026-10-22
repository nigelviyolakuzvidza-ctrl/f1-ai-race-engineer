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

### Phase 1 — PS5 Telemetry Integration

**Status:** In Progress

#### Completed milestones
- [x] Configured F1 25 UDP telemetry on PS5.
- [x] Identified the MacBook's local IP address.
- [x] Established UDP communication over the local network.
- [x] Created a Python UDP receiver using the `socket` library.
- [x] Successfully received live telemetry packets on UDP port `20777`.
- [x] Committed the initial receiver to GitHub.

#### Technical configuration
- **Platform:** PlayStation 5 — F1 25
- **Receiver:** macOS / Python 3.9.6
- **Protocol:** UDP over IPv4
- **Port:** 20777
- **Telemetry format:** 2025
- **Configured send rate:** 60 Hz

#### Next milestones
- [ ] Decode binary UDP telemetry packets.
- [ ] Extract speed, throttle, brake, gear and lap data.
- [ ] Validate decoded values against live gameplay.
- [ ] Implement structured telemetry output.

#### Key learning
Established a working local-network telemetry pipeline between a PS5 and MacBook using Python sockets. Verified that the game transmits UDP packets that can be captured for further processing.