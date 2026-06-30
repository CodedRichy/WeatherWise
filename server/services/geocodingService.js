import fetch from 'node-fetch'

// Search for locations by name using Open-Meteo geocoding API
export async function search(query) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Geocoding error: ${res.status}`)
  const json = await res.json()

  if (!json.results || json.results.length === 0) return []

  return json.results.map((r) => ({
    name: r.name,
    lat: r.latitude,
    lon: r.longitude,
    country: r.country,
    admin1: r.admin1 ?? null,
  }))
}

// Open-Meteo does not support reverse geocoding — return coords with placeholder label
export function reverseGeocode(lat, lon) {
  return { lat: Number(lat), lon: Number(lon), city: 'Unknown' }
}
