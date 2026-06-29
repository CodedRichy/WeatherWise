import { fetchHistorical } from './weatherService.js'

function mean(arr) {
  return arr.reduce((s, v) => s + v, 0) / arr.length
}

function stdev(arr) {
  const m = mean(arr)
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length)
}

// Normalized linear trend: (last - first) / length
function trend(arr) {
  return (arr[arr.length - 1] - arr[0]) / arr.length
}

export async function predict(lat, lon) {
  const historical = await fetchHistorical(lat, lon)

  const temps = historical.temperature
  const humidities = historical.humidity
  const pressures = historical.pressure
  const clouds = historical.cloudCover

  const tempTrend = trend(temps)
  const humidityTrend = trend(humidities)
  const pressureTrend = trend(pressures)
  const cloudTrend = trend(clouds)

  const lastTemp = temps[temps.length - 1]

  // Weighted blend of trends, scaled by 5 to produce realistic temperature deltas
  const nextDayTempMid =
    lastTemp +
    (pressureTrend * 0.35 + humidityTrend * 0.25 + tempTrend * 0.25 + cloudTrend * 0.15) * 5

  const variance = stdev(temps)
  const confidence = variance * 0.8

  // 3-day forecast with per-day jitter
  const forecast = [0, 1, 2].map(day => {
    const jitter = (Math.random() - 0.5) * variance * 0.2
    const mid = nextDayTempMid + tempTrend * day * 2 + jitter
    return {
      day,
      tempMin: mid - variance * 0.5,
      tempMax: mid + variance * 0.5,
      tempMid: mid,
      confidenceLow: mid - confidence,
      confidenceHigh: mid + confidence,
    }
  })

  // Feature importance with ±0.05 jitter, renormalized to sum 1
  const base = { pressure_trend: 0.35, humidity_trend: 0.25, temp_trend: 0.25, cloud_cover: 0.15 }
  const jittered = Object.fromEntries(
    Object.entries(base).map(([k, v]) => [k, Math.max(0, v + (Math.random() - 0.5) * 0.1)])
  )
  const total = Object.values(jittered).reduce((a, b) => a + b, 0)
  const featureImportance = Object.fromEntries(
    Object.entries(jittered).map(([k, v]) => [k, v / total])
  )

  return {
    forecast,
    featureImportance,
    modelType: 'rule-based-weighted-linear',
    generatedAt: new Date().toISOString(),
  }
}
