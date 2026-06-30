import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { CONDITION_EMOJI } from './constants.js'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function buildDummyHourlyData(min, max) {
  return Array.from({ length: 24 }, (_, h) => {
    const factor = Math.sin(((h - 4) / 24) * Math.PI)
    const temp = min + (max - min) * Math.max(0, factor)
    return { hour: `${String(h).padStart(2, '0')}:00`, temp: Math.round(temp * 10) / 10 }
  })
}

function formatTime(isoString) {
  if (!isoString) return '—'
  const d = new Date(isoString)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

export default function WeeklyForecast({ forecast }) {
  const [expandedIdx, setExpandedIdx] = useState(null)

  if (!Array.isArray(forecast) || !forecast.length) return null

  const days = forecast.map(d => {
    const date = new Date(d.date)
    return {
      dayName: DAY_NAMES[date.getDay()],
      tMax: d.tempMax ?? 0,
      tMin: d.tempMin ?? 0,
      emoji: CONDITION_EMOJI[d.condition] ?? '🌡️',
      condition: d.condition ?? '',
      sunriseStr: formatTime(d.sunrise),
      sunsetStr: formatTime(d.sunset),
      chartData: buildDummyHourlyData(d.tempMin ?? 0, d.tempMax ?? 0),
    }
  })

  return (
    <div style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
      {days.map((day, i) => (
        <div key={i}>
          <div
            className="weekly-row"
            onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
            role="button"
            aria-expanded={expandedIdx === i}
          >
            <span style={{ width: '2.5rem', fontWeight: 600, color: 'var(--text)' }}>{day.dayName}</span>
            <span style={{ fontSize: '1.2rem' }}>{day.emoji}</span>
            <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--text-muted)' }}>{day.condition}</span>
            <span style={{ fontSize: '0.875rem' }}>
              <span style={{ color: '#ef4444', fontWeight: 600 }}>{Math.round(day.tMax)}°</span>
              {' / '}
              <span style={{ color: '#60a5fa' }}>{Math.round(day.tMin)}°</span>
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.4rem' }}>
              {expandedIdx === i ? '▲' : '▼'}
            </span>
          </div>

          {expandedIdx === i && (
            <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)' }}>
              <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                <span>🌅 {day.sunriseStr}</span>
                <span>🌇 {day.sunsetStr}</span>
              </div>
              <ResponsiveContainer width="100%" height={70}>
                <AreaChart data={day.chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id={`tg-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="hour" tick={{ fontSize: 9 }} interval={5} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip contentStyle={{ fontSize: '0.72rem', padding: '2px 6px' }} formatter={v => [`${v}°C`, 'Temp']} />
                  <Area type="monotone" dataKey="temp" stroke="#f59e0b" strokeWidth={2} fill={`url(#tg-${i})`} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
