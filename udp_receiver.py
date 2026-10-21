
import socket
import struct
import json
import time
import os
from datetime import datetime, timezone

# ==========================================================
# F1 AI RACE ENGINEER - PHASE 1
# F1 25 / PS5 UDP receiver
# ==========================================================

UDP_IP = "0.0.0.0"
UDP_PORT = 20777
PACKET_FORMAT = 2025
HEADER_SIZE = 29
MAX_CARS = 22
OUTPUT_INTERVAL = 0.2
OUTPUT_FILE = "telemetry_latest.json"

PACKET_SIZES = {
    0: 1349,   # Motion
    1: 753,    # Session
    2: 1285,   # Lap
    3: 45,     # Events
    6: 1352,   # Telemetry
    7: 1239,   # Status
    10: 1041   # Damage
}

WEATHER = {
    0: "Clear",
    1: "Light cloud",
    2: "Overcast",
    3: "Light rain",
    4: "Heavy rain",
    5: "Storm"
}

VISUAL_TYRES = {
    7: "Intermediate",
    8: "Wet",
    16: "Soft",
    17: "Medium",
    18: "Hard"
}

ACTUAL_TYRES = {
    7: "Intermediate",
    8: "Wet",
    16: "C5",
    17: "C4",
    18: "C3",
    19: "C2",
    20: "C1",
    21: "C0",
    22: "C6"
}

EVENT_NAMES = {
    "SSTA": "Session started",
    "SEND": "Session ended",
    "FTLP": "Fastest lap",
    "RTMT": "Retirement",
    "DRSE": "DRS enabled",
    "DRSD": "DRS disabled",
    "TMPT": "Teammate in pits",
    "CHQF": "Chequered flag",
    "RCWN": "Race winner",
    "PENA": "Penalty",
    "SPTP": "Speed trap",
    "STLG": "Start lights",
    "LGOT": "Lights out",
    "DTSV": "Drive-through served",
    "SGSV": "Stop-go served",
    "FLBK": "Flashback",
    "RDFL": "Red flag",
    "OVTK": "Overtake",
    "SCAR": "Safety car",
    "COLL": "Collision"
}


def read(data, fmt, offset):
    return struct.unpack_from("<" + fmt, data, offset)[0]


def read_array(data, fmt, offset, count):
    return list(struct.unpack_from(
        "<" + str(count) + fmt, data, offset
    ))


def format_lap_time(ms):
    if not ms:
        return "--:--.---"

    minutes, remainder = divmod(ms, 60000)
    seconds, milliseconds = divmod(remainder, 1000)

    return f"{minutes}:{seconds:02d}.{milliseconds:03d}"


def timestamp():
    return datetime.now(timezone.utc).isoformat()


def new_state():
    return {
        "timestamp": None,
        "session_uid": None,
        "player_index": None,
        "session": {},
        "car": {},
        "lap": {},
        "position": {},
        "tyres": {},
        "vehicle": {},
        "motion": {},
        "leaderboard": [],
        "events": [],
        "diagnostics": {
            "packet_counts": {
                str(packet_id): 0
                for packet_id in PACKET_SIZES
            },
            "decode_errors": 0,
            "last_damage_packet": None,
            "last_status_packet": None
        }
    }


state = new_state()


# ==========================================================
# PACKET 6 - LIVE CAR TELEMETRY
# ==========================================================

def decode_telemetry(data, player):
    offset = HEADER_SIZE + player * 60

    state["car"] = {
        "speed_kmh": read(data, "H", offset),
        "throttle": round(read(data, "f", offset + 2), 3),
        "steering": round(read(data, "f", offset + 6), 3),
        "brake": round(read(data, "f", offset + 10), 3),
        "clutch": read(data, "B", offset + 14),
        "gear": read(data, "b", offset + 15),
        "rpm": read(data, "H", offset + 16),
        "drs_active": bool(read(data, "B", offset + 18)),
        "rev_lights_percent": read(data, "B", offset + 19),
        "brake_temperatures_c": read_array(
            data, "H", offset + 22, 4
        ),
        "tyre_surface_temperatures_c": read_array(
            data, "B", offset + 30, 4
        ),
        "tyre_inner_temperatures_c": read_array(
            data, "B", offset + 34, 4
        ),
        "engine_temperature_c": read(data, "H", offset + 38),
        "tyre_pressures_psi": [
            round(v, 2)
            for v in read_array(data, "f", offset + 40, 4)
        ]
    }


# ==========================================================
# PACKET 2 - LAP DATA AND LEADERBOARD
# ==========================================================

def decode_lap(data, player):
    offset = HEADER_SIZE + player * 57

    current_ms = read(data, "I", offset + 4)
    last_ms = read(data, "I", offset)

    sector1_ms = (
        read(data, "H", offset + 8)
        + read(data, "B", offset + 10) * 60000
    )

    sector2_ms = (
        read(data, "H", offset + 11)
        + read(data, "B", offset + 13) * 60000
    )

    state["lap"] = {
        "current_lap_time_ms": current_ms,
        "last_lap_time_ms": last_ms,
        "current_lap_time": format_lap_time(current_ms),
        "last_lap_time": format_lap_time(last_ms),
        "sector1_time_ms": sector1_ms,
        "sector2_time_ms": sector2_ms,
        "sector1_time": format_lap_time(sector1_ms),
        "sector2_time": format_lap_time(sector2_ms),
        "lap_distance_m": round(
            read(data, "f", offset + 20), 2
        ),
        "total_distance_m": round(
            read(data, "f", offset + 24), 2
        ),
        "lap_number": read(data, "B", offset + 33),
        "sector": read(data, "B", offset + 36) + 1,
        "lap_invalid": bool(read(data, "B", offset + 37))
    }

    state["position"] = {
        "race_position": read(data, "B", offset + 32),
        "pit_status": read(data, "B", offset + 34),
        "pit_stops": read(data, "B", offset + 35),
        "penalty_seconds": read(data, "B", offset + 38)
    }

    leaderboard = []

    for index in range(MAX_CARS):
        base = HEADER_SIZE + index * 57
        position = read(data, "B", base + 32)

        if position == 0:
            continue

        leaderboard.append({
            "car_index": index,
            "position": position,
            "lap_number": read(data, "B", base + 33),
            "last_lap_ms": read(data, "I", base),
            "current_lap_ms": read(data, "I", base + 4),
            "lap_distance_m": round(
                read(data, "f", base + 20), 2
            )
        })

    state["leaderboard"] = sorted(
        leaderboard,
        key=lambda car: car["position"]
    )


# ==========================================================
# PACKET 1 - SESSION INFORMATION
# ==========================================================

def decode_session(data):
    offset = HEADER_SIZE

    state["session"] = {
        "weather": WEATHER.get(
            read(data, "B", offset), "Unknown"
        ),
        "track_temperature_c": read(data, "b", offset + 1),
        "air_temperature_c": read(data, "b", offset + 2),
        "total_laps": read(data, "B", offset + 3),
        "track_length_m": read(data, "H", offset + 4),
        "session_type_id": read(data, "B", offset + 6),
        "track_id": read(data, "b", offset + 7),
        "time_left_seconds": read(data, "H", offset + 9),
        "duration_seconds": read(data, "H", offset + 11),
        "pit_speed_limit_kmh": read(data, "B", offset + 13)
    }


# ==========================================================
# PACKET 0 - MOTION
# ==========================================================

def decode_motion(data, player):
    offset = HEADER_SIZE + player * 60

    state["motion"] = {
        "world_x": round(read(data, "f", offset), 3),
        "world_y": round(read(data, "f", offset + 4), 3),
        "world_z": round(read(data, "f", offset + 8), 3),
        "velocity_x": round(read(data, "f", offset + 12), 3),
        "velocity_y": round(read(data, "f", offset + 16), 3),
        "velocity_z": round(read(data, "f", offset + 20), 3),
        "g_force_lateral": round(
            read(data, "f", offset + 36), 3
        ),
        "g_force_longitudinal": round(
            read(data, "f", offset + 40), 3
        ),
        "yaw": round(read(data, "f", offset + 48), 3)
    }


# ==========================================================
# PACKET 7 - CAR STATUS
# ==========================================================


def decode_status(data, player):
    offset = HEADER_SIZE + player * 55

    actual_id = read(data, "B", offset + 25)
    visual_id = read(data, "B", offset + 26)

    state["vehicle"].update({
        "fuel_kg": round(read(data, "f", offset + 5), 2),
        "fuel_capacity_kg": round(read(data, "f", offset + 9), 2),
        "fuel_remaining_laps": round(
            read(data, "f", offset + 13), 2
        ),
        "front_brake_bias_percent": read(
            data, "B", offset + 3
        ),
        "pit_limiter_active": bool(
            read(data, "B", offset + 4)
        ),
        "drs_allowed": bool(read(data, "B", offset + 22)),
        "ers_energy_joules": round(
            read(data, "f", offset + 37), 2
        ),
        "ers_deploy_mode": read(data, "B", offset + 41),
        "ers_harvested_mguk_joules": round(
            read(data, "f", offset + 42), 2
        ),
        "ers_harvested_mguh_joules": round(
            read(data, "f", offset + 46), 2
        ),
        "ers_deployed_this_lap_joules": round(
            read(data, "f", offset + 50), 2
        )
    })

    state["tyres"].update({
        "actual_compound_id": actual_id,
        "actual_compound": ACTUAL_TYRES.get(
            actual_id, f"Unknown ({actual_id})"
        ),
        "visual_compound_id": visual_id,
        "visual_compound": VISUAL_TYRES.get(
            visual_id, f"Unknown ({visual_id})"
        ),
        "age_laps": read(data, "B", offset + 27)
    })

    state["diagnostics"]["last_status_packet"] = timestamp()


    state["tyres"].update({
        "actual_compound_id": actual_id,
        "actual_compound": ACTUAL_TYRES.get(
            actual_id, f"Unknown ({actual_id})"
        ),
        "visual_compound_id": visual_id,
        "visual_compound": VISUAL_TYRES.get(
            visual_id, f"Unknown ({visual_id})"
        ),
        "age_laps": read(data, "B", offset + 28)
    })

    state["diagnostics"]["last_status_packet"] = timestamp()


# ==========================================================
# PACKET 10 - TYRE WEAR AND DAMAGE
# ==========================================================

def decode_damage(data, player):
    offset = HEADER_SIZE + player * 46

    state["tyres"].update({
        "wear_percent": [
            round(v, 2)
            for v in read_array(data, "f", offset, 4)
        ],
        "tyre_damage_percent": read_array(
            data, "B", offset + 16, 4
        ),
        "brake_damage_percent": read_array(
            data, "B", offset + 20, 4
        ),
        "tyre_blisters_percent": read_array(
            data, "B", offset + 24, 4
        )
    })

    state["vehicle"]["damage"] = {
        "front_left_wing": read(data, "B", offset + 28),
        "front_right_wing": read(data, "B", offset + 29),
        "rear_wing": read(data, "B", offset + 30),
        "floor": read(data, "B", offset + 31),
        "diffuser": read(data, "B", offset + 32),
        "sidepod": read(data, "B", offset + 33),
        "drs_fault": bool(read(data, "B", offset + 34)),
        "ers_fault": bool(read(data, "B", offset + 35)),
        "gearbox": read(data, "B", offset + 36),
        "engine": read(data, "B", offset + 37),
        "engine_blown": bool(
            read(data, "B", offset + 44)
        ),
        "engine_seized": bool(
            read(data, "B", offset + 45)
        )
    }

    state["diagnostics"]["last_damage_packet"] = timestamp()


# ==========================================================
# PACKET 3 - RACE EVENTS
# ==========================================================

def decode_event(data):
    event_code = data[29:33].decode(
        "ascii", errors="replace"
    )

    # Controller inputs are too frequent to be useful.
    if event_code == "BUTN":
        return

    # Keep the raw event code and payload.
    # Different events have different payload layouts.
    state["events"].append({
        "code": event_code,
        "name": EVENT_NAMES.get(event_code, event_code),
        "payload_hex": data[33:].hex(),
        "timestamp": timestamp()
    })

    state["events"] = state["events"][-20:]


# ==========================================================
# OUTPUT
# ==========================================================

def publish():
    car = state["car"]

    if not car:
        return

    lap = state["lap"]
    position = state["position"]
    vehicle = state["vehicle"]
    tyres = state["tyres"]

    print(
        f"Speed: {car.get('speed_kmh', 0):3} km/h | "
        f"Gear: {car.get('gear', 0):2} | "
        f"Throttle: {car.get('throttle', 0) * 100:3.0f}% | "
        f"Brake: {car.get('brake', 0) * 100:3.0f}% | "
        f"Lap: {lap.get('lap_number', '-')} | "
        f"Time: {lap.get('current_lap_time', '--:--.---')} | "
        f"P{position.get('race_position', '-')} | "
        f"Tyre: {tyres.get('visual_compound', '-')} | "
        f"ERS: {vehicle.get('ers_energy_joules', 0):.0f} J"
    )

    # Write to a temporary file first.
    # Then replace the existing JSON atomically.
    temp_file = OUTPUT_FILE + ".tmp"

    with open(temp_file, "w", encoding="utf-8") as file:
        json.dump(state, file, indent=2, allow_nan=False)

    os.replace(temp_file, OUTPUT_FILE)


# ==========================================================
# MAIN RECEIVER
# ==========================================================

def main():
    global state

    sock = socket.socket(
        socket.AF_INET,
        socket.SOCK_DGRAM
    )

    sock.bind((UDP_IP, UDP_PORT))
    sock.settimeout(1.0)

    print("=" * 55)
    print("F1 AI RACE ENGINEER - UDP RECEIVER")
    print(f"Listening on UDP port {UDP_PORT}")
    print(f"Packet format: {PACKET_FORMAT}")
    print("Press Ctrl+C to stop")
    print("=" * 55)

    last_output = time.monotonic()

    try:
        while True:
            try:
                data, address = sock.recvfrom(4096)
            except socket.timeout:
                continue

            if len(data) < HEADER_SIZE:
                continue

            packet_format = read(data, "H", 0)
            packet_id = read(data, "B", 6)
            session_uid = read(data, "Q", 7)
            player_index = read(data, "B", 27)

            if packet_format != PACKET_FORMAT:
                continue

            expected_size = PACKET_SIZES.get(packet_id)

            if expected_size is None:
                continue

            if len(data) != expected_size:
                continue

            # Reset state when a new session begins.
            if state["session_uid"] != session_uid:
                state = new_state()
                state["session_uid"] = session_uid

            state["timestamp"] = timestamp()
            state["player_index"] = player_index

            diagnostics = state["diagnostics"]
            packet_key = str(packet_id)

            diagnostics["packet_counts"][packet_key] += 1

            try:
                if packet_id == 1:
                    decode_session(data)

                elif packet_id == 3:
                    decode_event(data)

                elif player_index < MAX_CARS:
                    if packet_id == 0:
                        decode_motion(data, player_index)

                    elif packet_id == 2:
                        decode_lap(data, player_index)

                    elif packet_id == 6:
                        decode_telemetry(data, player_index)

                    elif packet_id == 7:
                        decode_status(data, player_index)

                    elif packet_id == 10:
                        decode_damage(data, player_index)

            except (struct.error, ValueError) as error:
                diagnostics["decode_errors"] += 1
                print(f"Decoding error: {error}")
                continue

            now = time.monotonic()

            if now - last_output >= OUTPUT_INTERVAL:
                try:
                    publish()
                except (OSError, ValueError) as error:
                    print(f"Output error: {error}")

                last_output = now

    except KeyboardInterrupt:
        print("\nReceiver stopped.")

    finally:
        sock.close()


if __name__ == "__main__":
    main()