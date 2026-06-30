import { useState, useEffect } from 'react'
import { weatherApi } from '../../api/weatherApi.js'

const QUALITY_EMOJI = { Spectacular: '🌅', Clear: '🌇', Average: '🌆', Blocked: '☁️' }
const QUALITY_COLOR = { Spectacular: 'var(--warn)', Clear: 'var(--success)', Average: 'var(--text-muted)', Blocked: 'var(--text-muted)' }

export default function SunsetBeauty({ lat, lon }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    weatherApi.getSunset(lat, lon).then(r => setData(r.data)).catch(() => {})
  }, [lat, lon])

  if (!data) return null

  const time = new Date(data.sunsetTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ fontSize: '2rem', lineHeight: 1 }}>{QUALITY_EMOJI[data.quality]}</div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.15rem' }}>
          <span style={{ fontWeight: 700, color: QUALITY_COLOR[data.quality] }}>{data.quality} sunset</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>at {time}</span>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{data.message}</p>
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right', flexShrink: 0 }}>
        {data.cloudCover}%<br/>cloud
      </div>
    </div>
  )
}
