import { useState, useEffect } from 'react'
import { useGeolocation } from '../hooks/useGeolocation.js'
import { weatherApi } from '../api/weatherApi.js'
import SkeletonCard from '../components/ui/SkeletonCard.jsx'

// WMO code to emoji
function codeEmoji(code) {
  if (!code && code !== 0) return '—'
  if (code === 0) return '☀️'
  if (code <= 3) return '🌤️'
  if (code <= 48) return '🌫️'
  if (code <= 57) return '🌦️'
  if (code <= 67) return '🌧️'
  if (code <= 77) return '❄️'
  if (code <= 82) return '🌦️'
  return '⛈️'
}

// Format date as YYYY-MM-DD
function toDateStr(date) {
  return date.toISOString().slice(0, 10)
}

const YEAR_OFFSETS = [1, 5, 10, 25]

export default function History() {
  const { lat, lon } = useGeolocation()
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 1) // yesterday
    return toDateStr(d)
  })
  const [results, setResults] = useState({}) // { '1': data, '5': data, ... }
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const coords = lat && lon ? { lat, lon } : { lat: 51.5074, lon: -0.1278 }

  async function fetchAll(date) {
    if (!date) return
    setLoading(true)
    setError(null)
    setResults({})

    const base = new Date(date)
    const fetches = YEAR_OFFSETS.map(async (offset) => {
      const past = new Date(base)
      past.setFullYear(past.getFullYear() - offset)
      const pastStr = toDateStr(past)
      try {
        const res = await weatherApi.getHistory(coords.lat, coords.lon, pastStr)
        return [offset, { ...res.data, yearOffset: offset, actualDate: pastStr }]
      } catch { return [offset, null] }
    })

    const pairs = await Promise.all(fetches)
    const map = {}
    pairs.forEach(([k, v]) => { map[k] = v })
    setResults(map)
    setLoading(false)
  }

  useEffect(() => { fetchAll(selectedDate) }, [selectedDate, coords.lat, coords.lon])

  const baseLabel = (() => {
    const d = new Date(selectedDate + 'T12:00:00')
    return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })
  })()

  return (
    <div className="page">
      <h1>Time Machine</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem', marginTop: '-0.75rem' }}>
        What was the weather like on this day in the past?
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
        <input
          type="date"
          value={selectedDate}
          max={toDateStr(new Date(Date.now() - 86400000))}
          min="2000-01-01"
          onChange={e => setSelectedDate(e.target.value)}
          style={{
            padding: '0.5rem 1rem', borderRadius: '9999px',
            border: '1px solid var(--border-solid)', background: 'var(--surface)',
            color: 'var(--text)', font: 'inherit', fontSize: '0.9rem', outline: 'none',
            cursor: 'pointer'
          }}
        />
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Showing {baseLabel} across {YEAR_OFFSETS.join(', ')} years ago
        </span>
      </div>

      {error && <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</p>}

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
          {YEAR_OFFSETS.map(y => <SkeletonCard key={y} height="160px" />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
          {YEAR_OFFSETS.map(offset => {
            const d = results[offset]
            const yr = new Date(selectedDate + 'T12:00:00').getFullYear() - offset
            if (!d) return (
              <div key={offset} className="card" style={{ padding: '1.25rem', opacity: 0.5 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.5rem' }}>
                  {offset} year{offset > 1 ? 's' : ''} ago · {yr}
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No data available</p>
              </div>
            )
            return (
              <div key={offset} className="card" style={{ padding: '1.25rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.65rem' }}>
                  {offset} year{offset > 1 ? 's' : ''} ago · {yr}
                </div>
                <div style={{ fontSize: '2.2rem', lineHeight: 1, marginBottom: '0.25rem' }}>
                  {codeEmoji(d.weatherCode)}
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.1rem' }}>
                  {d.tempMax != null ? Math.round(d.tempMax) : '—'}° / {d.tempMin != null ? Math.round(d.tempMin) : '—'}°
                </div>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.65rem' }}>
                  {d.precipitation != null && (
                    <span className="stat-pill">💧 {d.precipitation}mm</span>
                  )}
                  {d.windMax != null && (
                    <span className="stat-pill">💨 {Math.round(d.windMax)} km/h</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--border)', borderRadius: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        💡 Try your birthday, a holiday, or a special date to see what the weather was like.
      </div>
    </div>
  )
}
