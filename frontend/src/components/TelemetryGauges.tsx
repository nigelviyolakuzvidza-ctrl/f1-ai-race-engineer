type TelemetryData = {
  speed_kmh: number
  gear: number
  rpm: number
  throttle: number
  brake: number
}

type Props = {
  data: TelemetryData
}

export default function TelemetryGauges({ data }: Props) {
  const throttle = Math.max(0, Math.min(100, data.throttle * 100))
  const brake = Math.max(0, Math.min(100, data.brake * 100))

  const gearLabel =
    data.gear === -1 ? 'R' :
    data.gear === 0 ? 'N' :
    String(data.gear)

  return (
    <div className="telemetry-gauges">
      <div className="telemetry-primary">
        <div className="speed-display">
          <span className="telemetry-label">SPEED</span>
          <strong>{data.speed_kmh}</strong>
          <span className="telemetry-unit">KM/H</span>
        </div>

        <div className="gear-display">
          <span className="telemetry-label">GEAR</span>
          <strong>{gearLabel}</strong>
        </div>
      </div>

      <div className="rpm-display">
        <div className="telemetry-row">
          <span>ENGINE RPM</span>
          <strong>{data.rpm.toLocaleString()}</strong>
        </div>
        <div className="telemetry-progress">
          <div
            className="rpm-fill"
            style={{
              width: `${Math.min(100, Math.max(0, data.rpm / 15000 * 100))}%`
            }}
          />
        </div>
      </div>

      <div className="pedal-display">
        <div className="pedal">
          <div className="telemetry-row">
            <span>THROTTLE</span>
            <strong>{throttle.toFixed(0)}%</strong>
          </div>
          <div className="telemetry-progress">
            <div
              className="throttle-fill"
              style={{ width: `${throttle}%` }}
            />
          </div>
        </div>

        <div className="pedal">
          <div className="telemetry-row">
            <span>BRAKE</span>
            <strong>{brake.toFixed(0)}%</strong>
          </div>
          <div className="telemetry-progress">
            <div
              className="brake-fill"
              style={{ width: `${brake}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}