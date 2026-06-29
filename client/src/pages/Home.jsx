import { useState, useEffect } from 'react'
import { useGeolocation } from '../hooks/useGeolocation.js'
import { useWeather } from '../hooks/useWeather.js'
import { weatherApi } from '../api/weatherApi.js'
import WeatherMap from '../components/map/WeatherMap.jsx'
import OverlayControls from '../components/map/OverlayControls.jsx'
import CurrentWeather from '../components/weather/CurrentWeather.jsx'
import HourlyTimeline from '../components/weather/HourlyTimeline.jsx'
import WeeklyForecast from '../components/weather/WeeklyForecast.jsx'
import NarrativeSummary from '../components/weather/NarrativeSummary.jsx'
import SkeletonCard from '../components/ui/SkeletonCard.jsx'
import ErrorCard from '../components/ui/ErrorCard.jsx'
import MLForecast from '../components/prediction/MLForecast.jsx'
import FeatureImportance from '../components/prediction/FeatureImportance.jsx'

export default function Home() {
  const { lat, lon } = useGeolocation()
  const [selectedCoords, setSelectedCoords] = useState(null)
  const [activeOverlay, setActiveOverlay] = useState(null)

  const coords = selectedCoords || (lat && lon ? { lat, lon } : { lat: 51.5074, lon: -0.1278 })

  const { current, forecast, hourly, narrative, loading, error } = useWeather(coords)

  // Prediction state
  const [prediction, setPrediction]       = useState(null)
  const [showPrediction, setShowPrediction] = useState(false)
  const [predLoading, setPredLoading]     = useState(false)

  const [showExplain, setShowExplain] = useState(false)

  // Click-to-weather popup state
  const [clickWeather, setClickWeather] = useState(null)
  const [clickLoading, setClickLoading] = useState(false)

  // Clear stale prediction when location changes
  useEffect(() => {
    setPrediction(null)
    setShowPrediction(false)
    setShowExplain(false)
  }, [coords.lat, coords.lon])

  async function loadPrediction() {
    if (prediction || predLoading) return
    setPredLoading(true)
    try {
      const [pred, expl] = await Promise.all([
        weatherApi.getPrediction(coords.lat, coords.lon),
        weatherApi.getExplain(coords.lat, coords.lon),
      ])
      setPrediction({
        forecast:          pred.data.forecast,
        featureImportance: expl.data.featureImportance,
      })
    } catch {
      // silent fail for MVP
    } finally {
      setPredLoading(false)
    }
  }

  function togglePrediction() {
    const next = !showPrediction
    setShowPrediction(next)
    if (next) loadPrediction()
  }

  function toggleExplain() {
    const next = !showExplain
    setShowExplain(next)
    if (next) loadPrediction()
  }

  return (
    <div className="home-layout">
      <div className="map-panel">
        <WeatherMap
          lat={coords.lat}
          lon={coords.lon}
          onLocationSelect={async (lat, lon) => {
            setSelectedCoords({ lat, lon })
            setClickWeather(null)
            setClickLoading(true)
            try {
              const res = await weatherApi.getCurrent(lat, lon)
              setClickWeather({ ...res.data, lat, lon })
            } catch {
              // silent fail
            } finally {
              setClickLoading(false)
            }
          }}
          activeOverlay={activeOverlay}
          OWM_API_KEY={import.meta.env.VITE_OWM_API_KEY}
          windSpeed={current?.windSpeed}
          windDirection={current?.windDirection}
          clickWeather={clickWeather}
          clickLoading={clickLoading}
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
          <ErrorCard message={error} onRetry={() => window.location.reload()} />
        ) : current ? (
          <>
            <CurrentWeather current={current} />
            <NarrativeSummary narrative={narrative} loading={loading} />
            <HourlyTimeline hourly={hourly} />
            <WeeklyForecast forecast={forecast} />

            {/* AI Forecast section */}
            <div className="prediction-section">
              <button className="section-toggle" onClick={togglePrediction}>
                {showPrediction ? '▼' : '▶'} AI Forecast
              </button>
              {showPrediction && (
                predLoading
                  ? <SkeletonCard height="220px" />
                  : prediction
                    ? <MLForecast forecast={prediction.forecast} />
                    : null
              )}
            </div>

            {/* Why this prediction section */}
            <div className="prediction-section">
              <button className="section-toggle" onClick={toggleExplain}>
                {showExplain ? '▼' : '▶'} Why this prediction
              </button>
              {showExplain && (
                predLoading
                  ? <SkeletonCard height="160px" />
                  : prediction
                    ? <FeatureImportance featureImportance={prediction.featureImportance} />
                    : null
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
