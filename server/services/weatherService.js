import fetch from 'node-fetch'
import { weatherCache as cache } from '../middleware/cache.js'

// Cache helpers
function cacheGet(key) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.fetchedAt > entry.ttl) { cache.delete(key); return null }
  return entry.data
}

function cacheSet(key, data, ttlMs) {
  cache.set(key, { data, fetchedAt: Date.now(), ttl: ttlMs })
}

function cacheKey(lat, lon, type) {
  return `${Number(lat).toFixed(2)},${Number(lon).toFixed(2)}:${type}`
}

// WMO weather code → human-readable condition
export function weatherCodeToCondition(code) {
  if (code === 0) return 'Clear'
  if (code >= 1 && code <= 3) return 'Partly Cloudy'
  if (code === 45 || code === 48) return 'Foggy'
  if (code >= 51 && code <= 55) return 'Drizzle'
  if (code >= 61 && code <= 65) return 'Rain'
  if (code >= 71 && code <= 77) return 'Snow'
  if (code >= 80 && code <= 82) return 'Showers'
  if (code === 95 || code === 96 || code === 99) return 'Thunderstorm'
  return 'Unknown'
}

// Fetch current weather
export async function fetchCurrent(lat, lon) {
  const key = cacheKey(lat, lon, 'current')
  const cached = cacheGet(key)
  if (cached) return cached

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,cloud_cover&wind_speed_unit=ms&timezone=auto`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Open-Meteo current error: ${res.status}`)
  const json = await res.json()
  const current = json.current

  const data = {
    temperature: current.temperature_2m,
    feelsLike: current.apparent_temperature,
    humidity: current.relative_humidity_2m,
    pressure: current.surface_pressure,
    windSpeed: current.wind_speed_10m,
    windDirection: current.wind_direction_10m,
    cloudCover: current.cloud_cover,
    precipitation: current.precipitation,
    weatherCode: current.weather_code,
    condition: weatherCodeToCondition(current.weather_code),
    timestamp: current.time,
  }

  cacheSet(key, data, 600000) // 10 min
  return data
}

// Fetch 7-day daily forecast
export async function fetchForecast(lat, lon, days = 7) {
  const key = cacheKey(lat, lon, 'forecast')
  const cached = cacheGet(key)
  if (cached) return cached

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code,wind_speed_10m_max,sunrise,sunset&timezone=auto&forecast_days=${days}`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Open-Meteo forecast error: ${res.status}`)
  const json = await res.json()
  const daily = json.daily

  const data = daily.time.map((date, i) => ({
    date,
    tempMax: daily.temperature_2m_max[i],
    tempMin: daily.temperature_2m_min[i],
    precipitation: daily.precipitation_sum[i],
    weatherCode: daily.weather_code[i],
    condition: weatherCodeToCondition(daily.weather_code[i]),
    windSpeedMax: daily.wind_speed_10m_max[i],
    sunrise: daily.sunrise[i],
    sunset: daily.sunset[i],
  }))

  cacheSet(key, data, 3600000) // 60 min
  return data
}

// Fetch 48-hour hourly forecast
export async function fetchHourly(lat, lon, hours = 48) {
  const key = cacheKey(lat, lon, 'hourly')
  const cached = cacheGet(key)
  if (cached) return cached

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m,cloud_cover&timezone=auto&forecast_days=2`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Open-Meteo hourly error: ${res.status}`)
  const json = await res.json()
  const hourly = json.hourly

  const sliceCount = Math.min(hours, hourly.time.length)
  const data = hourly.time.slice(0, sliceCount).map((time, i) => ({
    time,
    temperature: hourly.temperature_2m[i],
    humidity: hourly.relative_humidity_2m[i],
    precipitationProbability: hourly.precipitation_probability[i],
    weatherCode: hourly.weather_code[i],
    condition: weatherCodeToCondition(hourly.weather_code[i]),
    windSpeed: hourly.wind_speed_10m[i],
    cloudCover: hourly.cloud_cover[i],
  }))

  cacheSet(key, data, 600000) // 10 min
  return data
}

// Fetch past 7 days of hourly data for prediction
export async function fetchHistorical(lat, lon) {
  const key = cacheKey(lat, lon, 'historical')
  const cached = cacheGet(key)
  if (cached) return cached

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,surface_pressure,cloud_cover&past_days=7&forecast_days=0&timezone=auto`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Open-Meteo historical error: ${res.status}`)
  const json = await res.json()

  const data = {
    time: json.hourly.time,
    temperature: json.hourly.temperature_2m,
    humidity: json.hourly.relative_humidity_2m,
    pressure: json.hourly.surface_pressure,
    cloudCover: json.hourly.cloud_cover,
  }

  cacheSet(key, data, 3600000) // 60 min
  return data
}
