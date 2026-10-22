
import json
import math
import time
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent
TELEMETRY_FILE = PROJECT_ROOT / "telemetry_latest.json"
TRACKS_DIR = PROJECT_ROOT / "data" / "tracks"

SAMPLE_INTERVAL = 0.2
MIN_POINT_DISTANCE = 3.0
MIN_LAP_DISTANCE = 500.0


def main():
    TRACKS_DIR.mkdir(parents=True, exist_ok=True)

    print("F1 Track Recorder")
    print("Waiting for fresh PS5 telemetry... Press Ctrl+C to stop.")

    track_id = None
    session_uid = None
    lap_number = None
    points = []
    last_timestamp = None

    try:
        while True:
            try:
                data = json.loads(TELEMETRY_FILE.read_text())

                timestamp = data["timestamp"]

                if timestamp == last_timestamp:
                    time.sleep(SAMPLE_INTERVAL)
                    continue

                last_timestamp = timestamp

                session = data["session"]
                lap = data["lap"]
                motion = data["motion"]

                current_track = session["track_id"]
                current_session = data["session_uid"]
                current_lap = lap["lap_number"]

                x = float(motion["world_x"])
                z = float(motion["world_z"])
                lap_distance = float(lap["lap_distance_m"])

                if not all(math.isfinite(v) for v in (x, z, lap_distance)):
                    time.sleep(SAMPLE_INTERVAL)
                    continue

                if (
                    current_track != track_id
                    or current_session != session_uid
                ):
                    track_id = current_track
                    session_uid = current_session
                    lap_number = current_lap
                    points = []
                    print(f"Recording track {track_id}, lap {lap_number}")

                elif current_lap != lap_number:
                    if len(points) >= 20 and lap_distance < MIN_LAP_DISTANCE:
                        output = TRACKS_DIR / f"track_{track_id}.json"

                        result = {
                            "track_id": track_id,
                            "session_uid": session_uid,
                            "points": points,
                        }

                        output.write_text(json.dumps(result, indent=2))

                        print(
                            f"Saved {len(points)} points to {output}"
                        )
                    else:
                        print("Lap incomplete; track not saved.")

                    lap_number = current_lap
                    points = []

                if lap_distance >= 0:
                    point = {"x": x, "z": z}

                    if not points or math.hypot(
                        x - points[-1]["x"],
                        z - points[-1]["z"],
                    ) >= MIN_POINT_DISTANCE:
                        points.append(point)

            except (OSError, KeyError, ValueError, TypeError,
                    json.JSONDecodeError):
                pass

            time.sleep(SAMPLE_INTERVAL)

    except KeyboardInterrupt:
        print("\nTrack recorder stopped.")


if __name__ == "__main__":
    main()
