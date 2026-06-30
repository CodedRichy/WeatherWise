import { CONDITION_EMOJI, wmoToCondition } from './constants.js'

// Props: { hourly }
// hourly = { hourly: { time[], temperature_2m[], relative_humidity_2m[],
//            precipitation_probability[], weather_code[], wind_speed_10m[], cloud_cover[] } }
export default function HourlyTimeline({ hourly }) {
  if (!hourly?.hourly?.time) return null

  const { time, temperature_2m, weather_code } = hourly.hourly
  const now = Date.now()

  // Find index of current hour
  const nowIndex = time.findIndex((t) => new Date(t).getTime() >= now)
  const validNow = nowIndex >= 0
  const startIdx = validNow ? nowIndex : Math.max(0, time.length - 24)

  // Show next 24 hours
  const items = time.slice(startIdx, startIdx + 24).map((t, i) => {
    const idx = startIdx + i
    const date = new Date(t)
    const hh = String(date.getHours()).padStart(2, '0')
    const mm = String(date.getMinutes()).padStart(2, '0')
    const label = `${hh}:${mm}`
    const temp = temperature_2m?.[idx] != null ? Math.round(temperature_2m[idx]) : '—'
    const code = weather_code?.[idx] ?? 0
    const condition = wmoToCondition(code)
    const emoji = CONDITION_EMOJI[condition] ?? '🌡️'
    const isActive = validNow && i === 0

    return { label, temp, emoji, isActive }
  })

  return (
    <div className="hourly-timeline">
      {items.map(({ label, temp, emoji, isActive }, i) => (
        <div
          key={i}
          className="hourly-item"
          style={isActive ? { background: 'var(--accent)', color: '#fff' } : {}}
        >
          <div style={{ fontSize: '0.75rem', color: isActive ? 'rgba(255,255,255,0.85)' : 'var(--text-muted)' }}>
            {label}
          </div>
          <div style={{ fontSize: '1.25rem', margin: '0.25rem 0' }}>{emoji}</div>
          <div style={{ fontWeight: 600 }}>{temp}°</div>
        </div>
      ))}
    </div>
  )
}
