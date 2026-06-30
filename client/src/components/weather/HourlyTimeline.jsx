import { CONDITION_EMOJI } from './constants.js'

export default function HourlyTimeline({ hourly }) {
  if (!Array.isArray(hourly) || !hourly.length) return null

  const now = Date.now()
  const nowIndex = hourly.findIndex(h => new Date(h.time).getTime() >= now)
  const startIdx = nowIndex >= 0 ? nowIndex : 0
  const items = hourly.slice(startIdx, startIdx + 24)

  return (
    <div className="hourly-timeline" style={{ padding: '0.5rem 0.75rem 0.75rem' }}>
      {items.map((h, i) => {
        const d = new Date(h.time)
        const label = `${String(d.getHours()).padStart(2,'0')}:00`
        const emoji = CONDITION_EMOJI[h.condition] ?? '🌡️'
        const isNow = i === 0 && nowIndex >= 0
        return (
          <div key={i} className="hourly-item" style={isNow ? { background: 'var(--accent)', color: 'var(--accent-fg)' } : {}}>
            <div style={{ fontSize: '0.72rem', color: isNow ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)' }}>{label}</div>
            <div style={{ fontSize: '1.2rem', margin: '0.2rem 0' }}>{emoji}</div>
            <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{h.temperature != null ? Math.round(h.temperature) : '—'}°</div>
          </div>
        )
      })}
    </div>
  )
}
