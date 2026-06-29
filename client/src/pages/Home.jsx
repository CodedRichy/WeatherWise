import { useState } from 'react'
import { useGeolocation } from '../hooks/useGeolocation.js'
import WeatherMap from '../components/map/WeatherMap.jsx'
import OverlayControls from '../components/map/OverlayControls.jsx'

export default function Home() {
  const { lat, lon } = useGeolocation()
  const [selectedCoords, setSelectedCoords] = useState(null)
  const [activeOverlay, setActiveOverlay] = useState(null)

  const coords = selectedCoords || (lat && lon ? { lat, lon } : { lat: 51.5074, lon: -0.1278 })

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
        <p>Weather data for {coords.lat.toFixed(4)}, {coords.lon.toFixed(4)}</p>
      </div>
    </div>
  )
}
