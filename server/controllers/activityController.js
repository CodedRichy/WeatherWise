import { fetchCurrent, fetchHourly } from '../services/weatherService.js'

function clamp(val) {
  return Math.min(100, Math.max(0, val))
}

function scoreActivity(activity, { temp, humidity, wind, precipProb, cloudCover }) {
  switch (activity) {
    case 'running':
      return clamp(
        100 -
          Math.abs(temp - 18) * 2.5 -
          Math.max(0, humidity - 60) * 0.5 -
          Math.max(0, wind - 5) * 3 -
          precipProb * 0.8
      )
    case 'cycling':
      return clamp(
        100 -
          Math.abs(temp - 20) * 2 -
          Math.max(0, wind - 8) * 4 -
          precipProb * 0.9 -
          Math.max(0, humidity - 70) * 0.3
      )
    case 'stargazing':
      return clamp(
        100 -
          cloudCover * 0.8 -
          precipProb * 0.6 -
          Math.max(0, wind - 10) * 1 -
          Math.max(0, humidity - 80) * 0.2
      )
    case 'photography':
      return clamp(
        80 -
          cloudCover * 0.4 +
          (cloudCover > 20 && cloudCover < 70 ? 20 : 0) -
          precipProb * 0.5 -
          Math.abs(temp - 20) * 1
      )
    case 'outdoorDining':
      return clamp(
        100 -
          Math.abs(temp - 22) * 2 -
          precipProb * 0.9 -
          Math.max(0, wind - 6) * 3 -
          Math.max(0, humidity - 65) * 0.3
      )
    default:
      return 0
  }
}

const ACTIVITIES = ['running', 'cycling', 'stargazing', 'photography', 'outdoorDining']

// GET /api/activities/scores?lat=&lon=
export async function getScores(req, res) {
  try {
    const { lat, lon } = req.query
    if (lat == null || lon == null) {
      return res.status(400).json({ error: 'lat and lon are required' })
    }

    const weather = await fetchCurrent(Number(lat), Number(lon))
    const { temperature: temp, humidity, windSpeed: wind, cloudCover, precipitation } = weather

    // Convert precipitation mm → rough probability proxy (cap at 100)
    const precipProb = Math.min(100, (precipitation || 0) * 20)

    const scores = {}
    for (const activity of ACTIVITIES) {
      const score = scoreActivity(activity, { temp, humidity, wind, precipProb, cloudCover })
      scores[activity] = {
        score,
        factors: { temp, humidity, wind, precipitation: precipProb },
      }
    }

    res.json({ scores, timestamp: new Date().toISOString() })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// GET /api/activities/best-window?activity=running&days=7&lat=&lon=
export async function getBestWindow(req, res) {
  try {
    const { lat, lon, activity = 'running' } = req.query
    if (lat == null || lon == null) {
      return res.status(400).json({ error: 'lat and lon are required' })
    }

    if (!ACTIVITIES.includes(activity)) {
      return res.status(400).json({ error: `activity must be one of: ${ACTIVITIES.join(', ')}` })
    }

    const hourly = await fetchHourly(Number(lat), Number(lon), 168)

    const scored = hourly.map(h => {
      const {
        temperature: temp,
        humidity,
        windSpeed: wind,
        cloudCover,
        precipitationProbability: precipProb,
        time,
      } = h

      const score = scoreActivity(activity, {
        temp,
        humidity,
        wind,
        precipProb: precipProb ?? 0,
        cloudCover: cloudCover ?? 0,
      })

      return {
        startTime: time,
        score,
        duration: '2h',
        factors: { temp, humidity, wind, cloudCover },
      }
    })

    scored.sort((a, b) => b.score - a.score)
    const windows = scored.slice(0, 5)

    res.json({ activity, windows })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
