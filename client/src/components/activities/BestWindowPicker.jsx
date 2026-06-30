import { useState, useEffect } from 'react'
import { weatherApi } from '../../api/weatherApi.js'
import SkeletonCard from '../ui/SkeletonCard.jsx'

const ACTIVITIES = [
  { value: 'running',      label: 'Running' },
  { value: 'cycling',      label: 'Cycling' },
  { value: 'stargazing',   label: 'Stargazing' },
  { value: 'photography',  label: 'Photography' },
  { value: 'outdoorDining', label: 'Outdoor Dining' },
]

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function scoreColor(score) {
  if (score >= 70) return '#10b981'
  if (score >= 40) return '#f59e0b'
  return '#ef4444'
}

function formatWindowTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  const day = DAY_NAMES[d.getDay()]
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${day} ${hh}:${mm}`
}

function formatDuration(minutes) {
  if (!minutes) return null
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

function WindowCard({ window: win }) {
  const score = Math.round(win?.score ?? 0)
  const color = scoreColor(score)
  const startLabel = formatWindowTime(win?.startTime ?? win?.start)
  const duration = win?.duration_minutes != null ? formatDuration(win.duration_minutes) : null
  const factorsRaw = win?.factors ?? {}
  const topFactors = Array.isArray(factorsRaw)
    ? factorsRaw.slice(0, 2)
    : Object.entries(factorsRaw).slice(0, 2).map(([k, v]) => `${k}: ${typeof v === 'number' ? v.toFixed(1) : v}`)

  return (
    <div className="window-card">
      <div
        className="score-badge"
        style={{ background: color }}
      >
        {score}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{startLabel}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
          {duration && <span style={{ marginRight: '0.75rem' }}>{duration}</span>}
          {topFactors.join(' · ')}
        </div>
      </div>
    </div>
  )
}

export default function BestWindowPicker({ lat, lon }) {
  const [activity, setActivity] = useState('running')
  const [windows, setWindows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (lat == null || lon == null) return
    setLoading(true)
    setError(null)
    weatherApi.getBestWindow(activity, lat, lon, 7)
      .then(res => {
        const data = res.data
        const list = Array.isArray(data) ? data : data?.windows ?? []
        setWindows(list.slice(0, 5))
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [activity, lat, lon])

  return (
    <div className="best-window-section">
      <h2>Best Time to Go</h2>

      <div style={{ marginBottom: '1rem' }}>
        <select
          value={activity}
          onChange={e => setActivity(e.target.value)}
          style={{
            padding: '0.4rem 0.75rem',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text)',
            fontSize: '0.9rem',
            cursor: 'pointer',
          }}
        >
          {ACTIVITIES.map(a => (
            <option key={a.value} value={a.value}>{a.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <>
          <SkeletonCard height="68px" />
          <div style={{ marginTop: '0.5rem' }}><SkeletonCard height="68px" /></div>
          <div style={{ marginTop: '0.5rem' }}><SkeletonCard height="68px" /></div>
        </>
      ) : error ? (
        <div className="error-card">Failed to load windows: {error}</div>
      ) : windows.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No windows found for the next 7 days.</div>
      ) : (
        windows.map((win, i) => <WindowCard key={i} window={win} />)
      )}
    </div>
  )
}
