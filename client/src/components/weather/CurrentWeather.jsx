import { useState, useEffect, useRef } from 'react'
import { CONDITION_EMOJI } from './constants.js'

function tempAccent(temp) {
  if (temp < 0)  return '#60a5fa'
  if (temp < 10) return '#34d399'
  if (temp < 20) return '#a3e635'
  if (temp < 28) return '#fbbf24'
  if (temp < 35) return '#f97316'
  return '#ef4444'
}

function useCountUp(target, duration = 600) {
  const [val, setVal] = useState(0)
  const prev = useRef(0)
  useEffect(() => {
    const start = prev.current
    const diff = target - start
    const startTime = performance.now()
    function step(now) {
      const t = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setVal(Math.round(start + diff * eased))
      if (t < 1) requestAnimationFrame(step)
      else prev.current = target
    }
    requestAnimationFrame(step)
  }, [target, duration])
  return val
}

export default function CurrentWeather({ current }) {
  if (!current) return null

  const emoji = CONDITION_EMOJI[current.condition] ?? '🌡️'
  const accent = tempAccent(current.temperature)
  const displayTemp = useCountUp(Math.round(current.temperature))

  return (
    <div className="current-weather" style={{ '--cw-accent': accent }}>
      <div className="cw-header">
        <div>
          <div className="cw-degree">{displayTemp}°C</div>
          <div className="cw-condition">{current.condition}</div>
        </div>
        <div className="cw-icon">{emoji}</div>
      </div>
      <div className="cw-stats">
        <span className="cw-stat">Feels {Math.round(current.feelsLike)}°C</span>
        <span className="cw-stat">{current.humidity}% humidity</span>
        <span className="cw-stat">{current.windSpeed != null ? current.windSpeed.toFixed(1) : '—'} m/s wind</span>
        <span className="cw-stat">{current.pressure} hPa</span>
      </div>
    </div>
  )
}
