# Phase 1 — PS5 F1 25 Telemetry Integration

**Status:** Core implementation complete and validated  
**Platform:** PlayStation 5, F1 25, macOS  
**Language:** Python 3.9.6  
**Transport:** UDP over local network

## 1. Overview

Phase 1 establishes a working telemetry pipeline between EA Sports F1 25 on PlayStation 5 and a Python application running on a MacBook Air.

The system receives genuine racing telemetry, decodes supported UDP packets, maintains a structured snapshot of the current session and writes the latest data to a local JSON file.

This provides the foundation for the React dashboard in Phase 2 and the AWS integration in Phase 3.

## 2. Architecture

```text
PS5 — F1 25
     |
     | UDP telemetry over local network
     | Port 20777
     v
MacBook Air
     |
     v
Python UDP Receiver
     |
     +-- Packet identification
     +-- Binary decoding
     +-- State updates
     +-- Diagnostics
     |
     v
telemetry_latest.json
     |
     v
Phase 2 — React Dashboard (planned)
```

All Phase 1 processing happens locally. No AWS resources or cloud services are required.

## 3. Prerequisites

- PlayStation 5 with EA Sports F1 25
- MacBook Air running macOS
- PS5 and MacBook connected to a network that permits UDP communication between them
- Python 3.9.6 or a compatible version
- VS Code or another code editor
- Git for version control

## 4. F1 25 Telemetry Configuration

Configure the telemetry settings within F1 25:

| Setting | Value |
|---|---|
| UDP Telemetry | Enabled |
| UDP Broadcast Mode | Off |
| UDP IP Address | MacBook's local IP address |
| UDP Port | 20777 |
| UDP Format | 2025 |
| UDP Send Rate | 60 Hz |

The MacBook's IP address must be reachable from the PS5.

The game sends telemetry to the configured destination. The Python receiver listens on the corresponding UDP port.

## 5. Python Receiver

**File:** `udp_receiver.py`

The receiver uses Python's standard library, including:

- `socket` for receiving UDP datagrams
- `struct` for decoding binary packet fields
- `json` for serialising telemetry
- `datetime` and `time` for timestamps and update handling
- `os` for local file operations

### Processing workflow

1. Bind a UDP socket to the configured listening port.
2. Receive datagrams transmitted by F1 25.
3. Identify packet types from their headers.
4. Validate supported packet formats and decode relevant fields.
5. Update the current session state.
6. Publish a structured JSON snapshot approximately five times per second.
7. Display a compact telemetry summary in the terminal.

The receiver writes JSON using a temporary file and replacement operation to reduce the risk of readers encountering a partially written snapshot.

## 6. Supported Packet Types

| Packet ID | Type | Purpose |
|---|---|---|
| 0 | Motion | Vehicle position and motion data |
| 1 | Session | Session information and weather |
| 2 | Lap Data | Lap timing, sectors and positions |
| 3 | Event | Race and session events |
| 6 | Car Telemetry | Speed, throttle, brake, gear and RPM |
| 7 | Car Status | Fuel, tyres, DRS and ERS |
| 10 | Car Damage | Tyre wear and vehicle damage |

The decoder focuses on fields needed for the planned dashboard and race-engineer functionality. It does not claim to decode every field available in the F1 25 protocol.

## 7. Decoded Telemetry

### Vehicle performance

- Speed
- Throttle input
- Brake input
- Gear
- Engine RPM
- DRS information

### Race and session

- Current lap and lap time
- Sector information
- Race position
- Leaderboard information
- Session and weather information
- Supported race events

### Vehicle condition

- Fuel information
- Tyre compounds and tyre age
- Tyre wear
- Supported damage indicators
- ERS energy and deployment information

### Motion

- Available vehicle position and motion data for future track visualisation

Data availability depends on the packet type, game mode and what F1 25 transmits.

## 8. Validation and Test Results

The receiver was tested with live PS5 telemetry in Time Trial and Grand Prix sessions.

### Packet reception

The following counts were recorded during a validation run:

| Packet ID | Packets received |
|---|---:|
| 0 | 3,425 |
| 1 | 114 |
| 2 | 3,427 |
| 3 | 162 |
| 6 | 3,430 |
| 7 | 3,430 |
| 10 | 573 |

**Decode errors recorded: 0**

All seven supported packet types were observed during the test.

These results demonstrate successful reception and decoding. They do not establish a measured packet-loss rate because transmitted sequence numbers and expected packet counts were not independently compared.

### Functional testing

The following behaviours were observed:

- Speed, throttle, brake and gear updated during driving.
- Lap timing and position information were received.
- Grand Prix sessions provided a 20-driver leaderboard.
- Tyre compound decoding returned a valid Soft tyre designation.
- ERS energy returned plausible values and changed during driving.
- Tyre wear data was observed during Grand Prix testing.
- Vehicle damage fields were decoded, although damage values remained zero during the recorded test.

## 9. Troubleshooting and Lessons Learned

### Incorrect UDP destination

**Problem:** The receiver initially failed to receive packets.

**Resolution:** Corrected the configured IP address so F1 25 transmitted telemetry to the MacBook.

**Lesson:** Validate basic network communication before investigating packet-decoding logic.

### Binary field offsets

**Problem:** Initial tyre and ERS values were incorrect or implausible.

**Resolution:** Corrected the binary offsets used when decoding the car-status packet.

**Lesson:** Binary protocol parsing requires precise field alignment. Plausibility checks help detect incorrect decoding even when no Python exception occurs.

### State overwritten by incoming packets

**Problem:** Vehicle damage information was missing from the JSON snapshot.

**Cause:** A car-status update replaced the entire vehicle state, removing fields previously added by the damage decoder.

**Resolution:** Updated individual vehicle fields without replacing the complete state dictionary.

**Lesson:** Different packet types must update shared state without unintentionally discarding information from other packets.

## 10. Recreating Phase 1

1. Clone the GitHub repository.
2. Confirm Python is installed.
3. Connect the PS5 and MacBook to a network that allows UDP communication.
4. Identify the MacBook's local IP address.
5. Configure the F1 25 UDP settings as described above.
6. Open the project in VS Code.
7. Run the receiver from the repository root:

```bash
python3 udp_receiver.py
```

8. Start a driving session in F1 25.
9. Confirm that live telemetry appears in the terminal.
10. Inspect `telemetry_latest.json` to verify the structured output.
11. Check `diagnostics.packet_counts` and `diagnostics.decode_errors`.

Stop the receiver using `Ctrl+C`.

If the receiver does not receive packets, verify the IP address, UDP port, game telemetry settings and local network connectivity.

## 11. Version Control

The validated receiver and `.gitignore` changes were committed to the `main` branch.

**Commit:** `748af0f`  
**Message:** `Complete Phase 1 F1 25 telemetry decoder`

Generated telemetry snapshots are excluded from Git tracking.

## 12. Limitations and Future Improvements

- Packet reception counts do not independently measure packet loss or jitter.
- The current JSON file contains the latest telemetry snapshot rather than a complete historical trace.
- Lap comparisons require collecting and aligning telemetry samples.
- Track mapping requires further validation of positional data.
- The local WebSocket server and React dashboard have not yet been implemented.
- AWS storage and AI services are planned for later phases.

## 13. Phase 1 Outcome

Phase 1 has delivered a working local telemetry feed from F1 25 on PS5 to a Python application on macOS.

The implementation demonstrates UDP networking, binary protocol decoding, structured state management, JSON serialisation, diagnostics and practical debugging.

**Next phase:** Build a live React dashboard with a local WebSocket connection, telemetry gauges, lap timing, standings and live throttle/brake charts.