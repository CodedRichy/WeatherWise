import { useState } from 'react'
import { useGeolocation } from '../hooks/useGeolocation.js'
import { useWeather } from '../hooks/useWeather.js'
import WeatherMap from '../components/map/WeatherMap.jsx'
import OverlayControls from '../components/map/OverlayControls.jsx'
import CurrentWeather from '../components/weather/CurrentWeather.jsx'
import HourlyTimeline from '../components/weather/HourlyTimeline.jsx'
import WeeklyForecast from '../components/weather/WeeklyForecast.jsx'
import NarrativeSummary from '../components/weather/NarrativeSummary.jsx'
import SkeletonCard from '../components/ui/SkeletonCard.jsx'

export default function Home() {
  const { lat, lon } = useGeolocation()
  const [selectedCoords, setSelectedCoords] = useState(null)
  const [activeOverlay, setActiveOverlay] = useState(null)

  const coords = selectedCoords || (lat && lon ? { lat, lon } : { lat: 51.5074, lon: -0.1278 })

  const { current, forecast, hourly, narrative, loading, error } = useWeather(coords)

  return (
    <div className="home-layout">
      <div className="map-panel">
        <WeatherMap
          lat={coords.lat}
          lon={coords.lon}
          onLocationSelect={(lat, lon) => setSelectedCoords({ lat, lon })}
          activeOverlay={activeOverlay}
          OWM_API_KEY={import.meta.env.VITE_OWM_API_KEY}
        />
        <OverlayControls activeOverlay={activeOverlay} onOverlayChange={setActiveOverlay} />
      </div>
      <div className="weather-panel">
        {loading ? (
          <>
            <SkeletonCard height="180px" />
            <SkeletonCard height="80px" />
            <SkeletonCard height="100px" />
            <SkeletonCard height="200px" />
          </>
        ) : error ? (
          <div className="error-card">
            ⚠️ {error}{' '}
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        ) : current ? (
          <>
            <CurrentWeather current={current} />
            <NarrativeSummary narrative={narrative} />
            <HourlyTimeline hourly={hourly} />
            <WeeklyForecast forecast={forecast} />
          </>
        ) : null}
      </div>
    </div>
  )
}
