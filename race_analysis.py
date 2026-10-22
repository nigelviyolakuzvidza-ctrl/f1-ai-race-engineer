"""Local, single-process track recording and distance-aligned lap comparison."""
import json
import math
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent
TRACKS = ROOT / 'data' / 'tracks'
LAPS = ROOT / 'data' / 'laps'


def save_json(path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix('.tmp')
    temporary.write_text(json.dumps(payload, separators=(',', ':')), encoding='utf-8')
    os.replace(temporary, path)


class RaceAnalysis:
    def __init__(self):
        self.key = None
        self.lap_no = None
        self.samples = []
        self.started_near_line = False
        self.previous_distance = None
        self.last_timestamp = None
        self.track = None
        self.best = None
        self.last = None

    def _reset(self, key, lap_no):
        self.key = key
        self.lap_no = lap_no
        self.samples = []
        self.started_near_line = False
        self.previous_distance = None
        self.last_timestamp = None
        track_id, track_length = key[1], key[2]
        track_file = TRACKS / f'track_{track_id}_{track_length}.json'
        legacy_file = TRACKS / f'track_{track_id}.json'
        self.track = None
        for candidate in (track_file, legacy_file):
            if candidate.exists():
                try:
                    found = json.loads(candidate.read_text(encoding='utf-8'))
                    if found.get('track_id') == track_id and len(found.get('points', [])) >= 20:
                        self.track = found
                        break
                except (OSError, ValueError, TypeError):
                    pass
        self.best = None
        self.last = None

    def _complete(self, last_lap_ms, invalid, length):
        points = self.samples
        if not self.started_near_line or invalid or last_lap_ms <= 0 or len(points) < 80:
            return
        distances = [p['distance'] for p in points]
        if min(distances) > length * .04 or max(distances) < length * .96:
            return
        if any(b - a < -20 for a, b in zip(distances, distances[1:])):
            return
        if any(b - a > length * .12 for a, b in zip(distances, distances[1:])):
            return
        lap = {'lap_number': self.lap_no, 'lap_time_ms': last_lap_ms, 'samples': points}
        self.last = lap
        if self.best is None or last_lap_ms < self.best['lap_time_ms']:
            self.best = lap
        track_id, track_length = self.key[1], self.key[2]
        save_json(LAPS / f'track_{track_id}_{track_length}_last.json', lap)
        if self.best is lap:
            save_json(LAPS / f'track_{track_id}_{track_length}_best.json', lap)
        if self.track is None:
            coords = [{'x': p['x'], 'z': p['z']} for p in points]
            first, final = coords[0], coords[-1]
            gap = math.hypot(first['x'] - final['x'], first['z'] - final['z'])
            # Samples near the start/finish line should form a near-closed loop.
            if gap < 100:
                self.track = {'track_id': track_id, 'track_length_m': track_length, 'points': coords}
                save_json(TRACKS / f'track_{track_id}_{track_length}.json', self.track)

    def process(self, data):
        try:
            session, lap, car, motion = (data[k] for k in ('session', 'lap', 'car', 'motion'))
            uid = data['session_uid']
            track_id = int(session['track_id'])
            length = int(session['track_length_m'])
            lap_no = int(lap['lap_number'])
            distance = float(lap['lap_distance_m'])
            x, z = float(motion['world_x']), float(motion['world_z'])
            speed = float(car['speed_kmh'])
            throttle, brake = float(car['throttle']), float(car['brake'])
            timestamp = data['timestamp']
            valid = all(math.isfinite(v) for v in (distance, x, z, speed, throttle, brake))
            if not valid or track_id < 0 or length < 500 or not 0 <= distance <= length * 1.03:
                return self.payload()
        except (KeyError, TypeError, ValueError, OverflowError):
            return self.payload()
        key = (uid, track_id, length)
        if key != self.key:
            self._reset(key, lap_no)
        if timestamp == self.last_timestamp:
            return self.payload()
        self.last_timestamp = timestamp
        if lap_no != self.lap_no:
            if lap_no == self.lap_no + 1:
                self._complete(int(lap.get('last_lap_time_ms', 0)), bool(lap.get('lap_invalid', False)), length)
            self.lap_no = lap_no
            self.samples = []
            self.started_near_line = distance <= length * .04
            self.previous_distance = None
        if not self.samples:
            self.started_near_line = distance <= length * .04
        if self.previous_distance is not None and distance < self.previous_distance - 20:
            self.samples = []
            self.started_near_line = False
        self.previous_distance = distance
        if not self.samples or distance - self.samples[-1]['distance'] >= 3:
            self.samples.append({'distance': round(distance, 2), 'x': round(x, 2), 'z': round(z, 2),
                                 'speed': round(speed, 1), 'throttle': round(throttle * 100, 1),
                                 'brake': round(brake * 100, 1)})
        if len(self.samples) > 2500:
            self.samples = self.samples[-2500:]
        return self.payload()

    def payload(self):
        return {'track': self.track, 'last_lap': self.last, 'best_lap': self.best,
                'current_lap': {'lap_number': self.lap_no, 'samples': self.samples[-1200:]},
                'recording': self.track is None}
