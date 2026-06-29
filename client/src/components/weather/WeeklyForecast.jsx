import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const CONDITION_EMOJI = {
  'Clear': '☀️',
  'Partly Cloudy': '⛅',
  'Foggy': '🌫️',
  'Drizzle': '🌦️',
  'Rain': '🌧️',
  'Snow': '❄️',
  'Showers': '🌦️',
  'Thunderstorm': '⛈️',
  'Unknown': '🌡️',
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function wmoToCondition(code) {
  if (code === 0) return 'Clear'
  if (code <= 3) return 'Partly Cloudy'
  if (code === 45 || code === 48) return 'Foggy'
  if (code >= 51 && code <= 57) return 'Drizzle'
  if (code >= 61 && code <= 67) return 'Rain'
  if (code >= 71 && code <= 77) return 'Snow'
  if (code >= 80 && code <= 82) return 'Showers'
  if (code >= 95 && code <= 99) return 'Thunderstorm'
  return 'Unknown'
}

// Generate a simple bell-curve temperature profile between min and max over 24 points
function buildDummyHourlyData(min, max) {
  return Array.from({ length: 24 }, (_, h) => {
    // Peak around 14:00, trough around 04:00
    const factor = Math.sin(((h - 4) / 24) * Math.PI)
    const temp = min + (max - min) * Math.max(0, factor)
    return { hour: `${String(h).padStart(2, '0')}:00`, temp: Math.round(temp * 10) / 10 }
  })
}

function formatTime(isoString) {
  if (!isoString) return '—'
  const d = new Date(isoString)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

// Props: { forecast }
// forecast = { daily: { time[], temperature_2m_max[], temperature_2m_min[],
//              precipitation_sum[], weather_code[], wind_speed_10m_max[], sunrise[], sunset[] } }
export default function WeeklyForecast({ forecast }) {
  const [expandedIdx, setExpandedIdx] = useState(null)

  if (!forecast?.daily?.time) return null

  const {
    time,
    temperature_2m_max,
    temperature_2m_min,
    weather_code,
    sunrise,
    sunset,
  } = forecast.daily

  const days = time.map((t, i) => {
    const date = new Date(t)
    const dayName = DAY_NAMES[date.getDay()]
    const tMax = temperature_2m_max?.[i] ?? 0
    const tMin = temperature_2m_min?.[i] ?? 0
    const code = weather_code?.[i] ?? 0
    const condition = wmoToCondition(code)
    const emoji = CONDITION_EMOJI[condition] ?? '🌡️'
    const sunriseStr = sunrise?.[i] ? formatTime(sunrise[i]) : '—'
    const sunsetStr = sunset?.[i] ? formatTime(sunset[i]) : '—'
    const chartData = buildDummyHourlyData(tMin, tMax)

    return { dayName, tMax, tMin, emoji, condition, sunriseStr, sunsetStr, chartData }
  })

  function toggle(i) {
    setExpandedIdx(expandedIdx === i ? null : i)
  }

  return (
    <div style={{ background: 'var(--surface)', borderRadius: '8px', overflow: 'hidden' }}>
      {days.map((day, i) => (
        <div key={i}>
          <div
            className="weekly-row"
            onClick={() => toggle(i)}
            role="button"
            aria-expanded={expandedIdx === i}
          >
            <span style={{ width: '2.5rem', fontWeight: 600, color: 'var(--text)' }}>
              {day.dayName}
            </span>
            <span style={{ fontSize: '1.25rem' }}>{day.emoji}</span>
            <span style={{ flex: 1, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {day.condition}
            </span>
            <span style={{ fontSize: '0.875rem', color: 'var(--text)' }}>
              <span style={{ color: '#ef4444', fontWeight: 600 }}>{Math.round(day.tMax)}°</span>
              {' / '}
              <span style={{ color: '#3b82f6' }}>{Math.round(day.tMin)}°</span>
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
              {expandedIdx === i ? '▲' : '▼'}
            </span>
          </div>

          {expandedIdx === i && (
            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
              <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                <span>🌅 Sunrise {day.sunriseStr}</span>
                <span>🌇 Sunset {day.sunsetStr}</span>
              </div>
              <ResponsiveContainer width="100%" height={80}>
                <AreaChart data={day.chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id={`tempGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="hour" tick={{ fontSize: 9 }} interval={5} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip
                    contentStyle={{ fontSize: '0.75rem', padding: '2px 6px' }}
                    formatter={(v) => [`${v}°C`, 'Temp']}
                  />
                  <Area
                    type="monotone"
                    dataKey="temp"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fill={`url(#tempGrad-${i})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
