import { CONDITION_EMOJI } from './constants.js'

function tempGradient(temp) {
  if (temp < 5)  return 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
  if (temp < 15) return 'linear-gradient(135deg, #10b981, #059669)'
  if (temp < 28) return 'linear-gradient(135deg, #f59e0b, #d97706)'
  return 'linear-gradient(135deg, #ef4444, #dc2626)'
}

// Props: { current }
// current = { temperature, feelsLike, humidity, pressure, windSpeed, windDirection,
//             cloudCover, precipitation, weatherCode, condition, timestamp }
export default function CurrentWeather({ current }) {
  if (!current) return null

  const emoji = CONDITION_EMOJI[current.condition] ?? '🌡️'
  const gradient = tempGradient(current.temperature)

  return (
    <div className="current-weather" style={{ background: gradient }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '3rem', fontWeight: 700, lineHeight: 1 }}>
            {Math.round(current.temperature)}°C
          </div>
          <div style={{ fontSize: '1.1rem', marginTop: '0.25rem', opacity: 0.9 }}>
            {emoji} {current.condition}
          </div>
        </div>
        <div style={{ fontSize: '4rem', opacity: 0.8 }}>{emoji}</div>
      </div>

      <div className="weather-grid" style={{ color: 'rgba(255,255,255,0.9)' }}>
        <div>Feels like {Math.round(current.feelsLike)}°C</div>
        <div>Humidity {current.humidity}%</div>
        <div>Wind {current.windSpeed != null ? current.windSpeed.toFixed(1) : '—'} m/s</div>
        <div>Pressure {current.pressure} hPa</div>
      </div>
    </div>
  )
}
