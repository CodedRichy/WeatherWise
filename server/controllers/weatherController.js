import * as weatherService from '../services/weatherService.js'
import * as geocodingService from '../services/geocodingService.js'
import { generateNarrative } from '../services/narrativeService.js'
import SearchHistory from '../models/SearchHistory.js'

// GET /api/weather/current?lat=&lon=
export async function getCurrent(req, res) {
  try {
    const { lat, lon } = req.query
    if (lat == null || lon == null) {
      return res.status(400).json({ error: 'lat and lon are required' })
    }

    const data = await weatherService.fetchCurrent(Number(lat), Number(lon))

    // Save search history if user is authenticated (optional — do not fail request on error)
    if (req.auth?.userId) {
      try {
        await SearchHistory.create({
          userId: req.auth.userId,
          city: 'Unknown',
          lat: Number(lat),
          lon: Number(lon),
          weatherSnapshot: data,
        })
      } catch (_err) {
        // History save failed — log silently, do not surface to client
      }
    }

    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// GET /api/weather/forecast?lat=&lon=&days=7
export async function getForecast(req, res) {
  try {
    const { lat, lon, days } = req.query
    if (lat == null || lon == null) {
      return res.status(400).json({ error: 'lat and lon are required' })
    }

    const data = await weatherService.fetchForecast(Number(lat), Number(lon), days ? Number(days) : 7)
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// GET /api/weather/hourly?lat=&lon=&hours=48
export async function getHourly(req, res) {
  try {
    const { lat, lon, hours } = req.query
    if (lat == null || lon == null) {
      return res.status(400).json({ error: 'lat and lon are required' })
    }

    const data = await weatherService.fetchHourly(Number(lat), Number(lon), hours ? Number(hours) : 48)
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// GET /api/weather/compare?cities=lat:lon,lat:lon
export async function getCompare(req, res) {
  try {
    const { cities } = req.query
    if (!cities) {
      return res.status(400).json({ error: 'cities query parameter is required (format: lat:lon,lat:lon)' })
    }

    const pairs = cities.split(',').map((pair) => {
      const [lat, lon] = pair.trim().split(':').map(Number)
      if (isNaN(lat) || isNaN(lon)) throw new Error(`Invalid coordinate pair: ${pair}`)
      return { lat, lon }
    })

    const results = await Promise.all(
      pairs.map(async ({ lat, lon }) => {
        const weather = await weatherService.fetchCurrent(lat, lon)
        return { lat, lon, weather }
      })
    )

    res.json(results)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// GET /api/weather/narrative?lat=&lon=&style=casual
export async function getNarrative(req, res) {
  try {
    const { lat, lon, style } = req.query
    if (lat == null || lon == null) {
      return res.status(400).json({ error: 'lat and lon are required' })
    }

    const weatherData = await weatherService.fetchCurrent(Number(lat), Number(lon))
    const result = generateNarrative(weatherData, style ?? 'casual')
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// GET /api/weather/history?lat=&lon=&date=YYYY-MM-DD
export async function getHistory(req, res, next) {
  try {
    const { lat, lon, date } = req.query // date = YYYY-MM-DD
    if (!lat || !lon || !date) return res.status(400).json({ error: 'lat, lon, date required' })

    // Fetch from Open-Meteo historical archive
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${date}&end_date=${date}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code,wind_speed_10m_max&hourly=temperature_2m,precipitation_probability,weather_code&timezone=auto`

    const fetch = (await import('node-fetch')).default
    const r = await fetch(url)
    if (!r.ok) throw new Error(`Archive error: ${r.status}`)
    const json = await r.json()

    const daily = json.daily
    const hourly = json.hourly

    res.json({
      date,
      tempMax: daily.temperature_2m_max?.[0],
      tempMin: daily.temperature_2m_min?.[0],
      precipitation: daily.precipitation_sum?.[0],
      weatherCode: daily.weather_code?.[0],
      windMax: daily.wind_speed_10m_max?.[0],
      hourly: hourly?.time?.slice(0, 24).map((t, i) => ({
        time: t,
        temp: hourly.temperature_2m?.[i],
        weatherCode: hourly.weather_code?.[i],
      })) || [],
    })
  } catch (err) { next(err) }
}

// GET /api/weather/geocode?q=London
export async function geocode(req, res) {
  try {
    const { q } = req.query
    if (!q) {
      return res.status(400).json({ error: 'q query parameter is required' })
    }

    const results = await geocodingService.search(q)
    res.json(results)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
