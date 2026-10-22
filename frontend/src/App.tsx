import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import recorded from "./data/telemetry-sample.json";
import "./App.css";

type Telemetry = typeof recorded;
const colours = ["#559bff", "#ffad42", "#f34655", "#35d8bd", "#b97aff"];
const formatLap = (ms: number) =>
  ms > 0
    ? `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}.${String(Math.floor(ms % 1000)).padStart(3, "0")}`
    : "—:——.———";
const pct = (v: number) => Math.max(0, Math.min(100, v));
function Panel({
  title,
  extra,
  children,
  className = "",
}: {
  title: string;
  extra?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <h2>{title}</h2>
        {extra}
      </div>
      {children}
    </section>
  );
}
function Headset() {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path
        d="M8 27v-6a16 16 0 0 1 32 0v6M36 36c0 6-5 7-12 7"
        stroke="currentColor"
        strokeWidth="3"
      />
      <rect x="5" y="22" width="9" height="17" rx="4" fill="currentColor" />
      <rect x="34" y="22" width="9" height="17" rx="4" fill="currentColor" />
      <rect x="20" y="39" width="9" height="6" rx="3" fill="currentColor" />
    </svg>
  );
}
function CarDrawing() {
  return (
    <svg
      className="car-drawing"
      viewBox="0 0 130 230"
      aria-label="Top view of racing car"
    >
      <defs>
        <linearGradient id="body" x1="0" x2="1">
          <stop stopColor="#1a2635" />
          <stop offset=".5" stopColor="#728396" />
          <stop offset="1" stopColor="#17212f" />
        </linearGradient>
      </defs>
      <g stroke="#77899c" strokeWidth="1.3">
        <path d="M24 190h82v15H24zM30 20h70v15H30z" fill="#263341" />
        <path
          d="M60 30h10l8 68 18 28-9 53-17 20H60l-17-20-9-53 18-28z"
          fill="url(#body)"
        />
        <path d="M60 44h10v52H60z" fill="#f43e51" />
        <path d="M54 106q11-20 22 0l3 32-14 10-14-10z" fill="#080e16" />
        <path
          d="M48 148l17 24 17-24M65 177v21M25 63l32 19m48-19L73 82M25 166l30-9m50 9-30-9"
          fill="none"
        />
        <g fill="#090e15">
          <rect x="13" y="45" width="22" height="43" rx="6" />
          <rect x="95" y="45" width="22" height="43" rx="6" />
          <rect x="13" y="150" width="24" height="46" rx="6" />
          <rect x="93" y="150" width="24" height="46" rx="6" />
        </g>
        <path d="M16 50v32m98-32v32M16 156v34m98-34v34" stroke="#f24759" />
      </g>
    </svg>
  );
}

type LapSample = { distance: number; x: number; z: number; speed: number; throttle: number; brake: number };
type LapRecord = { lap_number: number; lap_time_ms: number; samples: LapSample[] };
type RaceAnalysisPayload = {
  track: TrackMap | null;
  last_lap: LapRecord | null;
  best_lap: LapRecord | null;
  current_lap: { lap_number: number | null; samples: LapSample[] };
  recording: boolean;
};

type TrackPoint = {
  x: number;
  z: number;
};

type TrackMap = {
  track_id: number;
  points: TrackPoint[];
};

function TrackPreview({
  trackId,
  worldX,
  worldZ,
  automaticTrack,
}: {
  trackId: number;
  worldX: number;
  worldZ: number;
  automaticTrack?: TrackMap | null;
}) {
  const [track, setTrack] = useState<TrackMap | null>(null);

  useEffect(() => {
    let cancelled = false;

    setTrack(null);

    fetch(`/tracks/track_${trackId}.json`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Track map unavailable");
        }
        return response.json();
      })
      .then((result: TrackMap) => {
        if (
          !cancelled &&
          result.track_id === trackId &&
          Array.isArray(result.points) &&
          result.points.length > 1
        ) {
          setTrack(result);
        }
      })
      .catch(() => {
        if (!cancelled) setTrack(null);
      });

    return () => {
      cancelled = true;
    };
  }, [trackId]);

  const activeTrack = automaticTrack?.track_id === trackId ? automaticTrack : track;

  if (!activeTrack) {
    return (
      <div className="track-preview">
        <div className="map-note">
          <span className="tag">TRACK MAP</span>
          <span>No recorded map for this circuit yet</span>
        </div>
      </div>
    );
  }

  const xs = activeTrack.points.map((point) => point.x);
  const zs = activeTrack.points.map((point) => point.z);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);

  const padding = 18;
  const width = 520;
  const height = 260;

  const scale = Math.min(
    (width - padding * 2) / Math.max(maxX - minX, 1),
    (height - padding * 2) / Math.max(maxZ - minZ, 1)
  );

  const project = (x: number, z: number) => ({
    x: width / 2 + (x - (minX + maxX) / 2) * scale,
    y: height / 2 - (z - (minZ + maxZ) / 2) * scale,
  });

  const path = activeTrack.points
    .map((point, index) => {
      const position = project(point.x, point.z);
      return `${index === 0 ? "M" : "L"}${position.x.toFixed(2)} ${position.y.toFixed(2)}`;
    })
    .join(" ") + " Z";

  const car = project(worldX, worldZ);

  return (
    <div className="track-preview">
      <svg viewBox="0 0 520 260" aria-label="Recorded circuit with live car position">
        <path className="track-edge" d={path} />
        <path className="track-line" d={path} />
        {Number.isFinite(car.x) && Number.isFinite(car.y) && (
          <>
            <circle cx={car.x} cy={car.y} r="13" fill="none" stroke="#36d6f5" opacity=".3" />
            <circle cx={car.x} cy={car.y} r="7" fill="#36d6f5" />
          </>
        )}
      </svg>
      <div className="map-note">
        <span className="tag">RECORDED TRACK</span>
        <span>Live car position · Track {trackId}</span>
      </div>
    </div>
  );
}

type TracePoint = {
  seconds: number;
  timestamp: number;
  speed: number;
  throttle: number;
  brake: number;
};

function Chart({
  inputs = false,
  trace,
}: {
  inputs?: boolean;
  trace: TracePoint[];
}) {
  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={trace}
          margin={{ top: 12, right: 12, bottom: 0, left: -20 }}
        >
          <CartesianGrid
            stroke="#273446"
            strokeDasharray="2 4"
            vertical={false}
          />
          <XAxis
            dataKey="seconds"
            type="number"
            domain={[-30, 0]}
            ticks={[-30, -25, -20, -15, -10, -5, 0]}
            tickFormatter={(v) => `${v}s`}
            tick={{ fill: "#94a7bc", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={inputs ? [0, 100] : [0, 350]}
            ticks={inputs ? [0, 25, 50, 75, 100] : [0, 100, 200, 300]}
            tickFormatter={(v) => (inputs ? `${v}%` : `${v}`)}
            tick={{ fill: "#94a7bc", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#111d2b",
              border: "1px solid #36495e",
              borderRadius: 6,
              color: "#f1f6fc",
            }}
            labelFormatter={(v) => `${Number(v).toFixed(1)}s`}
          />
          {inputs ? (
            <>
              <Line
                name="Throttle"
                dataKey="throttle"
                stroke="#43e788"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                name="Brake"
                dataKey="brake"
                stroke="#ff4559"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </>
          ) : (
            <Line
              name="Speed (km/h)"
              dataKey="speed"
              stroke="#36d6f5"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
function LapComparison({ analysis }: { analysis: RaceAnalysisPayload | null }) {
  const best = analysis?.best_lap;
  const current = analysis?.current_lap.samples ?? [];
  const reference = best?.samples ?? [];
  const nearest = (samples: LapSample[], distance: number) => {
    if (!samples.length) return null;
    let low = 0, high = samples.length - 1;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (samples[mid].distance < distance) low = mid + 1;
      else high = mid;
    }
    return samples[low];
  };
  const maxDistance = Math.max(reference[reference.length - 1]?.distance ?? 0, current[current.length - 1]?.distance ?? 0);
  const chartData = Array.from({ length: 100 }, (_, index) => {
    const distance = maxDistance * index / 99;
    const currentSample = nearest(current, distance);
    const bestSample = nearest(reference, distance);
    return {
      distance: Math.round(distance),
      currentSpeed: currentSample && Math.abs(currentSample.distance - distance) < 80 ? currentSample.speed : null,
      bestSpeed: bestSample && Math.abs(bestSample.distance - distance) < 80 ? bestSample.speed : null,
    };
  });
  return (
    <Panel title="LAP COMPARISON" extra={<span className="eyebrow">SPEED · DISTANCE-ALIGNED</span>}>
      <div style={{ padding: "12px 16px" }}>
        <p style={{ margin: "0 0 10px", color: "#94a7bc", fontSize: 12 }}>
          Best completed lap: {best ? formatLap(best.lap_time_ms) : "Awaiting a complete valid lap"}
          {analysis?.last_lap ? ` · Last: ${formatLap(analysis.last_lap.lap_time_ms)}` : ""}
        </p>
        <div style={{ height: 210 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 18, bottom: 5, left: -15 }}>
              <CartesianGrid stroke="#273446" strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="distance" tick={{ fill: "#94a7bc", fontSize: 10 }} unit="m" />
              <YAxis domain={[0, 350]} tick={{ fill: "#94a7bc", fontSize: 10 }} unit="" />
              <Tooltip contentStyle={{ background: "#111d2b", border: "1px solid #36495e" }} />
              <Line dataKey="bestSpeed" name="Best lap (km/h)" stroke="#36d6f5" strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
              <Line dataKey="currentSpeed" name="Current lap (km/h)" stroke="#ffad42" strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Panel>
  );
}

function App() {
  const [data, setData] = useState<Telemetry>(recorded);
  const [analysis, setAnalysis] = useState<RaceAnalysisPayload | null>(null);
  const [liveTrace, setLiveTrace] = useState<TracePoint[]>([]);
  const [source, setSource] = useState("Recorded PS5 snapshot");
  const [error, setError] = useState("");
  useEffect(() => {
  const websocket = new WebSocket("ws://127.0.0.1:8765");

  websocket.onopen = () => {
    setSource("Connected to telemetry server");
    setError("");
  };

  websocket.onmessage = (event) => {
    try {
      const parsed: unknown = JSON.parse(event.data);

      if (!isTelemetry(parsed)) {
        throw new Error("Invalid telemetry received.");
      }

      setData(parsed);
      const extra = (parsed as Telemetry & { race_analysis?: RaceAnalysisPayload }).race_analysis;
      if (extra) setAnalysis(extra);

setLiveTrace((previous) => {
  const now = Date.now() / 1000;

  const next = previous
    .filter((point) => now - point.timestamp <= 30)
    .map((point) => ({
      ...point,
      seconds: point.timestamp - now,
    }));

  next.push({
    timestamp: now,
    seconds: 0,
    speed: parsed.car.speed_kmh,
    throttle: parsed.car.throttle * 100,
    brake: parsed.car.brake * 100,
  });

  return next.slice(-150);
});

setSource("PS5 telemetry feed");
setError("");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Telemetry error.",
      );
    }
  };

  websocket.onerror = () => {
    setError("Unable to connect to the telemetry server.");
  };

  websocket.onclose = () => {
    setSource("Disconnected — last snapshot");
  };

  return () => websocket.close();
}, []);
  const fileInput = useRef<HTMLInputElement>(null);
  const { car, lap, session, vehicle, tyres, position } = data;
  const ers = pct((vehicle.ers_energy_joules / 4000000) * 100);
  const frontDamage = Math.max(
    vehicle.damage.front_left_wing,
    vehicle.damage.front_right_wing,
  );
  async function loadSnapshot(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!isTelemetry(parsed))
        throw new Error(
          "Choose a complete telemetry_latest.json snapshot from the receiver.",
        );
      setData(parsed);
      setSource("Imported PS5 snapshot");
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to read snapshot.");
    }
    event.target.value = "";
  }
  return (
    <div className="dashboard">
      <header className="topbar">
        <div className="brand">
          <svg viewBox="0 0 60 32" aria-hidden="true">
            <path
              d="M3 27 22 5h35L46 16H27l-9 11Zm23 0 9-10h11L37 27Z"
              fill="currentColor"
            />
          </svg>
          <h1>RACE ENGINEER</h1>
          <span className="platform">F1 25 · PS5</span>
        </div>
        <div className="header-tools">
          <span className="source-pill">
            <i />
            {source}
          </span>
          <button onClick={() => fileInput.current?.click()}>
            Load snapshot <span>↗</span>
          </button>
          <input
            ref={fileInput}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={loadSnapshot}
          />
        </div>
      </header>
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      <div className="workspace">
        <aside className="panel standings">
          <div className="panel-heading">
            <h2>LIVE STANDINGS</h2>
            <span className="eyebrow">
              LAP {lap.lap_number} / {session.total_laps}
            </span>
          </div>
          <div className="standings-head">
            <span>POS</span>
            <span>DRIVER</span>
            <span>LAST LAP</span>
          </div>
          <ol>
            {[...data.leaderboard]
              .sort((a, b) => a.position - b.position)
              .map((row) => (
                <li
                  key={row.car_index}
                  className={
                    row.car_index === data.player_index ? "is-player" : ""
                  }
                >
                  <span className="position">{row.position}</span>
                  <span className="driver">
                    <i
                      style={{
                        background:
                          row.car_index === data.player_index
                            ? "#36d6f5"
                            : colours[row.car_index % colours.length],
                      }}
                    />
                    {row.car_index === data.player_index
                      ? "NIGEL"
                      : `CAR ${String(row.car_index + 1).padStart(2, "0")}`}
                  </span>
                  <span className="last-lap">{formatLap(row.last_lap_ms)}</span>
                </li>
              ))}
          </ol>
          <div className="standings-foot">
            <span className="tag">RECORDED SESSION</span>
            <p>Driver names and time gaps are not included in this feed.</p>
          </div>
        </aside>
        <main className="main-content">
          <section className="engineer-banner">
            <Headset />
            <div>
              <div className="banner-label">
                AI RACE ENGINEER <span className="tag">PHASE 4 PREVIEW</span>
              </div>
              <p>Your race engineer will appear here.</p>
            </div>
          </section>
          <section className="timing-strip" aria-label="Lap timing">
            {[
              ["POSITION", `P${position.race_position}`],
              ["LAP", `${lap.lap_number} / ${session.total_laps}`],
              ["CURRENT LAP", formatLap(lap.current_lap_time_ms)],
              ["SECTOR", String(lap.sector)],
              ["LAST LAP", formatLap(lap.last_lap_time_ms)],
              ["BEST LAP", "—:——.———"],
            ].map(([label, value]) => (
              <div
                key={label}
                className={`timing-cell ${label === "SECTOR" ? "purple" : ""}`}
              >
                <span className="eyebrow">{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </section>
          <div className="hero-row">
            <Panel
              title="LIVE TELEMETRY"
              extra={
                <span className={`tag ${car.drs_active ? "green" : ""}`}>
                  ● DRS {car.drs_active ? "ACTIVE" : "CLOSED"}
                </span>
              }
              className="telemetry-panel"
            >
              <div className="instruments">
                <div className="speed-gear">
                  <div className="speed">
                    <strong>{Math.round(car.speed_kmh)}</strong>
                    <span>KM/H</span>
                  </div>
                  <div className="gear">
                    <strong>
                      {car.gear === 0 ? "N" : car.gear === -1 ? "R" : car.gear}
                    </strong>
                    <span>GEAR</span>
                    <b>
                      {car.rpm.toLocaleString("en-GB")} <small>RPM</small>
                    </b>
                  </div>
                  <div className="rpm-block">
                    <div className="rpm-track">
                      <div
                        style={{ width: `${pct(car.rev_lights_percent)}%` }}
                      />
                    </div>
                    <span className="eyebrow">ENGINE RPM</span>
                  </div>
                </div>
                <div className="pedals">
                  {[
                    ["THROTTLE", car.throttle, "throttle"],
                    ["BRAKE", car.brake, "brake"],
                  ].map(([label, value, kind]) => (
                    <div className={`pedal ${kind}`} key={String(label)}>
                      <div
                        className="pedal-track"
                        role="meter"
                        aria-label={String(label)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(pct(Number(value) * 100))}
                      >
                        <div
                          style={{ height: `${pct(Number(value) * 100)}%` }}
                        />
                      </div>
                      <strong>{Math.round(Number(value) * 100)}%</strong>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="resource-row">
                <div className="resource">
                  <span className="resource-icon">ϟ</span>
                  <span>ERS ENERGY</span>
                  <div className="meter">
                    <div style={{ width: `${ers}%` }} />
                  </div>
                  <strong>{ers.toFixed(0)}%</strong>
                </div>
                <div className="resource fuel">
                  <span className="resource-icon">▣</span>
                  <span>FUEL</span>
                  <div className="meter">
                    <div
                      style={{
                        width: `${pct((vehicle.fuel_kg / vehicle.fuel_capacity_kg) * 100)}%`,
                      }}
                    />
                  </div>
                  <strong>
                    {vehicle.fuel_kg.toFixed(2)} <small>KG</small>
                  </strong>
                </div>
              </div>
            </Panel>
            <Panel
              title="TRACK POSITION"
              extra={<span className="eyebrow">POSITIONAL PREVIEW</span>}
            >
            <TrackPreview
  trackId={data.session.track_id}
  worldX={data.motion.world_x}
  worldZ={data.motion.world_z}
  automaticTrack={analysis?.track}
/>
            </Panel>
          </div>
          <div className="detail-row">
            <Panel
              title="TYRES & CONDITION"
              extra={<span className="eyebrow">WEAR %</span>}
            >
              <div className="condition-body">
                <div className="tyre-assembly">
                  <CarDrawing />
                  {[
                    { label: "FL", index: 2 },
                    { label: "FR", index: 3 },
                    { label: "RL", index: 0 },
                    { label: "RR", index: 1 },
                  ].map(({ label, index }) => (
                    <div
                      className={`tyre tyre-${label.toLowerCase()}`}
                      key={label}
                    >
                      <span>{label}</span>
                      <strong>
                        {tyres.wear_percent[index]?.toFixed(0) ?? "—"}%
                      </strong>
                      <small>
                        {car.tyre_inner_temperatures_c[index] ?? "—"}°C
                      </small>
                    </div>
                  ))}
                  <div className="compound">
                    <i>{tyres.visual_compound.slice(0, 1)}</i>
                    {tyres.visual_compound.toUpperCase()} · {tyres.age_laps}{" "}
                    LAPS
                  </div>
                </div>
                <div className="damage">
                  <span className="eyebrow">DAMAGE</span>
                  {[
                    ["FRONT WING", frontDamage],
                    ["REAR WING", vehicle.damage.rear_wing],
                    ["ENGINE", vehicle.damage.engine],
                  ].map(([label, v]) => (
                    <div className={Number(v) > 0 ? "damaged" : ""} key={label}>
                      <span>{label}</span>
                      <strong>{v}%</strong>
                    </div>
                  ))}
                  {frontDamage > 0 && (
                    <p className="damage-warning">
                      Front-left {vehicle.damage.front_left_wing}% · Front-right{" "}
                      {vehicle.damage.front_right_wing}%
                    </p>
                  )}
                  <div className="fuel-laps">
                    <span>FUEL REMAINING</span>
                    <strong>
                      {vehicle.fuel_remaining_laps.toFixed(2)} laps
                    </strong>
                  </div>
                </div>
              </div>
            </Panel>
            <Panel
              title="SESSION"
              extra={<span className="eyebrow">F1 25</span>}
            >
              <div className="session-body">
                <div className="session-facts">
                  <div>
                    <span className="fact-icon">⚑</span>
                    <div>
                      <span className="eyebrow">SESSION</span>
                      <strong>
                        {session.session_type_id === 15
                          ? "GRAND PRIX"
                          : `TYPE ${session.session_type_id}`}
                      </strong>
                    </div>
                  </div>
                  <div>
                    <span className="fact-icon weather">◌</span>
                    <div>
                      <span className="eyebrow">WEATHER</span>
                      <strong>{session.weather}</strong>
                      <small>
                        Air {session.air_temperature_c}°C · Track{" "}
                        {session.track_temperature_c}°C
                      </small>
                    </div>
                  </div>
                  <div>
                    <span className="fact-icon">⌁</span>
                    <div>
                      <span className="eyebrow">CIRCUIT</span>
                      <strong>
                        {session.track_id === 0
                          ? "Melbourne"
                          : `Track ${session.track_id}`}
                      </strong>
                      <small>
                        {(session.track_length_m / 1000).toFixed(3)} km
                      </small>
                    </div>
                  </div>
                </div>
                <div className="events">
                  <span className="eyebrow">RACE EVENTS · SESSION-WIDE</span>
                  {data.events
                    .slice(-4)
                    .reverse()
                    .map((event, i) => (
                      <div key={`${event.timestamp}-${i}`}>
                        <time>{event.timestamp.slice(11, 19)}</time>
                        <span>{event.name}</span>
                      </div>
                    ))}
                </div>
              </div>
            </Panel>
          </div>
          <div className="chart-row">
            <Panel
              title="SPEED TRACE"
            extra={<span className="eyebrow">KM/H · LIVE</span>}
            >
              <Chart trace={liveTrace} />
            </Panel>
            <Panel
              title="DRIVER INPUTS"
              extra={
                <div className="chart-legend">
                  <span>
                    <i className="throttle-dot" />
                    Throttle
                  </span>
                  <span>
                    <i className="brake-dot" />
                    Brake
                  </span>
                  <span className="eyebrow">LIVE · 30 SEC</span>
                </div>
              }
            >
              <Chart inputs trace={liveTrace} />
            </Panel>
          </div>
          <div style={{ marginTop: 16 }}><LapComparison analysis={analysis} /></div>
        </main>
      </div>
      <footer>
        <span>
          SNAPSHOT MODE · {data.timestamp.replace("T", " ").slice(0, 19)} UTC ·
          NOT LIVE
        </span>
        <span>
          Local telemetry <b>·</b> AWS integration planned
        </span>
      </footer>
    </div>
  );
}
// Require the fields used by the UI; reject truncated or unrelated JSON without crashing.
function isTelemetry(value: unknown): value is Telemetry {
  const shapeMatches = (candidate: unknown, example: unknown): boolean => {
    if (typeof example === "number")
      return typeof candidate === "number" && Number.isFinite(candidate);
    if (Array.isArray(example))
      return (
        Array.isArray(candidate) &&
        (example.length === 0 ||
          candidate.every((item) => shapeMatches(item, example[0])))
      );
    if (example !== null && typeof example === "object")
      return (
        candidate !== null &&
        typeof candidate === "object" &&
        Object.entries(example).every(([key, v]) =>
          shapeMatches((candidate as Record<string, unknown>)[key], v),
        )
      );
    return typeof candidate === typeof example;
  };
  return (
    shapeMatches(value, recorded) &&
    (value as Telemetry).tyres.wear_percent.length === 4 &&
    (value as Telemetry).car.tyre_inner_temperatures_c.length === 4
  );
}
export default App;
