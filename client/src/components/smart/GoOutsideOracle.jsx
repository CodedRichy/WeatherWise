import { useState } from 'react'
import { weatherApi } from '../../api/weatherApi.js'
import SkeletonCard from '../ui/SkeletonCard.jsx'

export default function GoOutsideOracle({ lat, lon }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [checked, setChecked] = useState(false)

  async function check() {
    if (loading) return
    setLoading(true)
    try {
      const res = await weatherApi.getOracle(lat, lon)
      setData(res.data)
      setChecked(true)
    } finally { setLoading(false) }
  }

  return (
    <div className="oracle-card">
      <p style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
        Should I go outside?
      </p>
      {!checked && !loading && (
        <button className="btn btn--accent" onClick={check} style={{ padding: '0.5rem 1.75rem' }}>
          Ask WeatherWise
        </button>
      )}
      {loading && <SkeletonCard height="80px" />}
      {checked && data && (
        <>
          <div className="oracle-answer" style={{ color: data.goOutside ? 'var(--success)' : 'var(--danger)' }}>
            {data.emoji} {data.goOutside ? 'Yes' : 'No'}
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{data.reason}</p>
          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '0.75rem' }}>
            <span className="stat-pill">{Math.round(data.temp)}°C</span>
            <span className="stat-pill">Score {data.score}/100</span>
            <span className="stat-pill">{data.condition}</span>
          </div>
          <button onClick={() => { setChecked(false); setData(null) }} style={{ marginTop: '0.75rem', background: 'none', border: 'none', color: 'var(--text-muted)', font: 'inherit', fontSize: '0.78rem', cursor: 'pointer' }}>
            Check again
          </button>
        </>
      )}
    </div>
  )
}
