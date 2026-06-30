import { useState, useEffect } from 'react'
import { weatherApi } from '../../api/weatherApi.js'

export default function UVIndex({ lat, lon }) {
  const [data, setData] = useState(null)
  const [spf, setSpf] = useState(30)

  useEffect(() => {
    weatherApi.getUV(lat, lon).then(r => setData(r.data)).catch(() => {})
  }, [lat, lon])

  if (!data) return null

  const safeTime = spf === 0 ? data.safeMinutes.spf0 : spf === 30 ? data.safeMinutes.spf30 : data.safeMinutes.spf50
  const uvColor = data.currentUV < 3 ? '#10b981' : data.currentUV < 6 ? '#84cc16' : data.currentUV < 8 ? '#f59e0b' : data.currentUV < 11 ? '#ef4444' : '#7c3aed'
  const uvPct = Math.min(100, (data.currentUV / 12) * 100)

  return (
    <div className="card" style={{ padding: '1rem 1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>UV Index</span>
        <span style={{ fontWeight: 700, fontSize: '1.1rem', color: uvColor }}>{data.currentUV} — {data.level}</span>
      </div>
      <div className="uv-bar-track">
        <div className="uv-bar-thumb" style={{ left: `${uvPct}%` }} />
      </div>
      <div style={{ marginTop: '0.75rem' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Safe exposure time:</p>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {[0, 30, 50].map(s => (
            <button key={s} onClick={() => setSpf(s)} style={{
              padding: '0.25rem 0.7rem', borderRadius: '9999px', border: '1px solid var(--border-solid)',
              background: spf === s ? 'var(--accent)' : 'transparent',
              color: spf === s ? 'var(--accent-fg)' : 'var(--text-muted)',
              fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s'
            }}>
              {s === 0 ? 'No SPF' : `SPF ${s}`}
            </button>
          ))}
        </div>
        <p style={{ marginTop: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
          {safeTime >= 999 ? 'No limit today' : `${safeTime} min max`}
        </p>
      </div>
    </div>
  )
}
