import * as predictionService from '../services/predictionService.js'
import { fetchHourly } from '../services/weatherService.js'

// GET /api/predict/temperature?lat=&lon=
export async function getTemperaturePrediction(req, res, next) {
  try {
    const { lat, lon } = req.query
    if (lat == null || lon == null) {
      return res.status(400).json({ error: 'lat and lon are required' })
    }

    const result = await predictionService.predict(Number(lat), Number(lon))
    res.json(result)
  } catch (err) {
    next(err)
  }
}

// GET /api/predict/rain?lat=&lon=
// Returns 3-hour bucketed precipitation probability for the next 12 hours (4 buckets)
export async function getRainPrediction(req, res, next) {
  try {
    const { lat, lon } = req.query
    if (lat == null || lon == null) {
      return res.status(400).json({ error: 'lat and lon are required' })
    }

    const hourly = await fetchHourly(Number(lat), Number(lon), 12)

    const buckets = []
    for (let i = 0; i < 4; i++) {
      const slice = hourly.slice(i * 3, i * 3 + 3)
      const avg =
        slice.length > 0
          ? slice.reduce((s, h) => s + (h.precipitationProbability ?? 0), 0) / slice.length
          : 0
      buckets.push({ startHour: i * 3, probability: Math.round(avg) })
    }

    res.json({ buckets })
  } catch (err) {
    next(err)
  }
}

// GET /api/predict/explain?lat=&lon=
export async function getExplain(req, res, next) {
  try {
    const { lat, lon } = req.query
    if (lat == null || lon == null) {
      return res.status(400).json({ error: 'lat and lon are required' })
    }

    const result = await predictionService.predict(Number(lat), Number(lon))
    res.json({ featureImportance: result.featureImportance, modelType: result.modelType })
  } catch (err) {
    next(err)
  }
}
