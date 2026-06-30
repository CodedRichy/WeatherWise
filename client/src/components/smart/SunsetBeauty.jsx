import { useState, useEffect } from 'react'
import { weatherApi } from '../../api/weatherApi.js'

const QUALITY_EMOJI = { Spectacular: '🌅', Clear: '🌇', Average: '🌆', Blocked: '☁️' }
const QUALITY_COLOR = { Spectacular: '#f59e0b', Clear: '#10b981', Average: 'var(--text-muted)', Blocked: 'var(--text-muted)' }

export default function SunsetBeauty({ lat, lon }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    weatherApi.getSunset(lat, lon).then(r => setData(r.data)).catch(() => {})
  }, [lat, lon])

  if (!data) return null

  const time = new Date(data.sunsetTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
      <div style={{ fontSize: '2rem', lineHeight: 1, flexShrink: 0 }}>{QUALITY_EMOJI[data.quality]}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: QUALITY_COLOR[data.quality] }}>
            {data.quality} sunset
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>at {time}</span>
          <span className="stat-pill" style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem' }}>
            {data.cloudCover}% cloud
          </span>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {data.message}
        </p>
      </div>
    </div>
  )
}
