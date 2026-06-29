import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

// Fix Leaflet's broken default icon in Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

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
  return (
    <Marker position={[lat, lon]}>
      <Popup>
        {lat.toFixed(4)}, {lon.toFixed(4)}
      </Popup>
    </Marker>
  )
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

export default function WeatherMap({ lat, lon, onLocationSelect, activeOverlay, OWM_API_KEY }) {
  return (
    <MapContainer
      center={[lat, lon]}
      zoom={10}
      style={{ height: '100%', width: '100%' }}
    >
      {/* OSM base tiles */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
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

      {/* Click-to-select handler */}
      <ClickHandler onLocationSelect={onLocationSelect} />
    </MapContainer>
  )
}
