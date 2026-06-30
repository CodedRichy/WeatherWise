import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

import WindLayer from './WindLayer.jsx'

// Fix Leaflet's broken default icon in Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

// Force Leaflet to measure full container on mount
function MapSizer() {
  const map = useMap()
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 50)
  }, [map])
  return null
}

// Re-center the map whenever lat/lon props change
function MapRecenter({ lat, lon }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lon])
  }, [lat, lon, map])
  return null
}

// Marker at current selected coords with popup
function LocationMarker({ lat, lon }) {
  const icon = L.divIcon({
    html: '<div class="pulse-dot"><div class="pulse-ring"></div></div>',
    className: '',
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  })
  return <Marker position={[lat, lon]} icon={icon} />
}

// Fire onLocationSelect when user clicks the map
function ClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

// Popup showing weather at clicked point
function WeatherPopup({ lat, lon, weather, loading }) {
  if (!weather && !loading) return null
  return (
    <Marker position={[lat, lon]}>
      <Popup autoClose={false} closeOnClick={false}>
        {loading ? (
          <span>Loading…</span>
        ) : (
          <div style={{ fontSize: '13px', minWidth: '120px' }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>
              {weather.temperature != null ? `${Math.round(weather.temperature)}°C` : '—'} {weather.condition || ''}
            </div>
            <div style={{ color: '#888' }}>
              💧 {weather.humidity}% · 💨 {Math.round(weather.windSpeed * 3.6)} km/h
            </div>
          </div>
        )}
      </Popup>
    </Marker>
  )
}

export default function WeatherMap({
  lat,
  lon,
  onLocationSelect,
  activeOverlay,
  OWM_API_KEY,
  windSpeed,
  windDirection,
  clickWeather,
  clickLoading,
}) {
  return (
    <MapContainer
      center={[lat, lon]}
      zoom={10}
      style={{ height: '100%', width: '100%' }}
    >
      {/* Dark CartoDB base tiles */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
      />

      {/* OWM weather overlay — only when an overlay is selected and a key is present */}
      {activeOverlay && OWM_API_KEY && (
        <TileLayer
          url={`https://tile.openweathermap.org/map/${activeOverlay}/{z}/{x}/{y}.png?appid=${OWM_API_KEY}`}
          opacity={0.6}
        />
      )}

      {/* Location marker */}
      <LocationMarker lat={lat} lon={lon} />

      {/* Re-center when coords change */}
      <MapRecenter lat={lat} lon={lon} />
      <MapSizer />

      {/* Click-to-select handler */}
      <ClickHandler onLocationSelect={onLocationSelect} />

      {/* Animated wind particles */}
      <WindLayer windSpeed={windSpeed} windDirection={windDirection} />

      {/* Click-to-weather popup */}
      {(clickWeather || clickLoading) && (
        <WeatherPopup
          lat={clickWeather?.lat ?? lat}
          lon={clickWeather?.lon ?? lon}
          weather={clickWeather}
          loading={clickLoading}
        />
      )}
    </MapContainer>
  )
}
