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
import GoOutsideOracle from '../components/smart/GoOutsideOracle.jsx'
import UVIndex from '../components/smart/UVIndex.jsx'
import SunsetBeauty from '../components/smart/SunsetBeauty.jsx'
import BioWeather from '../components/smart/BioWeather.jsx'

export default function Home() {
  const { lat, lon } = useGeolocation()
  const [selectedCoords, setSelectedCoords] = useState(null)
  const [activeOverlay, setActiveOverlay] = useState(null)

  const coords = selectedCoords || (lat && lon ? { lat, lon } : { lat: 51.5074, lon: -0.1278 })

  const { current, forecast, hourly, narrative, loading, error } = useWeather(coords)

  function conditionGlow(cond) {
    if (!cond) return 'rgba(255,255,255,0.04)'
    const c = cond.toLowerCase()
    if (c.includes('rain') || c.includes('drizzle')) return 'rgba(59,130,246,0.18)'
    if (c.includes('thunder') || c.includes('storm'))  return 'rgba(139,92,246,0.18)'
    if (c.includes('snow'))                             return 'rgba(186,230,253,0.14)'
    if (c.includes('clear') || c.includes('sunny'))    return 'rgba(251,191,36,0.18)'
    if (c.includes('cloud'))                            return 'rgba(148,163,184,0.12)'
    return 'rgba(255,255,255,0.04)'
  }

  // Prediction state
  const [prediction, setPrediction]       = useState(null)
  const [showPrediction, setShowPrediction] = useState(false)
  const [predLoading, setPredLoading]     = useState(false)

  const [showExplain, setShowExplain] = useState(false)
  const [showHourly, setShowHourly] = useState(false)
  const [showWeekly, setShowWeekly] = useState(false)

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
        <div className="map-explore-hint">Click anywhere to explore weather</div>
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
      <div className="weather-panel" style={{ '--wx-glow': conditionGlow(current?.condition) }}>
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
            <div className="smart-grid">
              <GoOutsideOracle lat={coords.lat} lon={coords.lon} />
              <UVIndex lat={coords.lat} lon={coords.lon} />
              <SunsetBeauty lat={coords.lat} lon={coords.lon} />
              <BioWeather lat={coords.lat} lon={coords.lon} />
            </div>
            <div className="prediction-section">
              <button className="section-toggle" data-open={showHourly} onClick={() => setShowHourly(v => !v)}>
                Hourly Forecast <span className="chevron">›</span>
              </button>
              {showHourly && <HourlyTimeline hourly={hourly} />}
            </div>

            <div className="prediction-section">
              <button className="section-toggle" data-open={showWeekly} onClick={() => setShowWeekly(v => !v)}>
                7-Day Forecast <span className="chevron">›</span>
              </button>
              {showWeekly && <WeeklyForecast forecast={forecast} />}
            </div>

            <div className="prediction-section">
              <button className="section-toggle" data-open={showPrediction} onClick={togglePrediction}>
                AI Forecast <span className="chevron">›</span>
              </button>
              {showPrediction && (
                predLoading
                  ? <SkeletonCard height="220px" />
                  : prediction
                    ? <MLForecast forecast={prediction.forecast} />
                    : null
              )}
            </div>

            <div className="prediction-section">
              <button className="section-toggle" data-open={showExplain} onClick={toggleExplain}>
                Why this prediction <span className="chevron">›</span>
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
