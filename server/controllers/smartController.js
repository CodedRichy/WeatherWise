import fetch from 'node-fetch'
import { fetchCurrent, fetchForecast, fetchHistorical } from '../services/weatherService.js'

export async function getOracle(req, res, next) {
  try {
    const { lat, lon } = req.query
    const current = await fetchCurrent(Number(lat), Number(lon))

    let score = 100
    const reasons = []

    // Weather code penalties
    const code = current.weatherCode
    if ([95, 96, 99].includes(code)) { score -= 80; reasons.push('thunderstorm') }
    else if (code >= 71 && code <= 77) { score -= 50; reasons.push('snowing') }
    else if (code >= 61 && code <= 67) { score -= 45; reasons.push('rain') }
    else if (code >= 80 && code <= 82) { score -= 40; reasons.push('showers') }
    else if (code >= 51 && code <= 57) { score -= 25; reasons.push('drizzle') }
    else if (code === 45 || code === 48) { score -= 15; reasons.push('foggy') }

    // Temperature penalties
    const temp = current.temperature
    if (temp < -5) { score -= 40; reasons.push('dangerously cold') }
    else if (temp < 5) { score -= 20; reasons.push('very cold') }
    else if (temp < 10) { score -= 10; reasons.push('chilly') }
    else if (temp > 38) { score -= 45; reasons.push('dangerously hot') }
    else if (temp > 32) { score -= 20; reasons.push('very hot') }

    // Wind penalty
    if (current.windSpeed > 20) { score -= 30; reasons.push('strong winds') }
    else if (current.windSpeed > 12) { score -= 10; reasons.push('windy') }

    // Humidity + heat combo
    if (current.humidity > 80 && temp > 26) { score -= 15; reasons.push('humid and hot') }

    score = Math.max(0, Math.min(100, score))
    const goOutside = score >= 55

    // Build human reason string
    let reason
    if (score >= 80) reason = 'Perfect conditions outside'
    else if (score >= 65) reason = 'Good to go, ' + (reasons[0] || 'mild weather')
    else if (score >= 55) reason = 'OK but expect ' + (reasons[0] || 'mixed weather')
    else if (score >= 35) reason = `Stay in — ${reasons.slice(0, 2).join(' and ')}`
    else reason = `Don't risk it — ${reasons.slice(0, 2).join(' and ')}`

    // Pick emoji
    const emoji = score >= 80 ? '☀️' : score >= 60 ? '🌤️' : score >= 40 ? '🌧️' : score >= 20 ? '⛈️' : '❌'

    res.json({ goOutside, score: Math.round(score), reason, emoji, temp: Math.round(temp), condition: current.condition })
  } catch (err) { next(err) }
}

export async function getUV(req, res, next) {
  try {
    const { lat, lon } = req.query
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=uv_index&timezone=auto&forecast_days=1`
    const r = await fetch(url)
    const json = await r.json()
    const times = json.hourly.time
    const uvs = json.hourly.uv_index

    // Find current UV (closest past hour)
    const now = Date.now()
    let currentUV = uvs[0] ?? 0
    for (let i = 0; i < times.length; i++) {
      if (new Date(times[i]).getTime() <= now) currentUV = uvs[i] ?? 0
    }

    // UV level label
    const level = currentUV < 3 ? 'Low' : currentUV < 6 ? 'Moderate' : currentUV < 8 ? 'High' : currentUV < 11 ? 'Very High' : 'Extreme'

    // Safe exposure minutes (Fitzpatrick skin type 2, fair skin as reference)
    // Formula: safeMin = (200 * SPF) / (3 * uvIndex)
    const safeMinutes = {
      spf0:  currentUV > 0 ? Math.round(Math.min(600, 200 / (3 * currentUV))) : 999,
      spf30: currentUV > 0 ? Math.round(Math.min(600, 200 * 30 / (3 * currentUV))) : 999,
      spf50: currentUV > 0 ? Math.round(Math.min(600, 200 * 50 / (3 * currentUV))) : 999,
    }

    // Today's UV timeline (hourly)
    const timeline = times.slice(0, 24).map((t, i) => ({ hour: new Date(t).getHours(), uv: uvs[i] ?? 0 }))

    res.json({ currentUV: Math.round(currentUV * 10) / 10, level, safeMinutes, timeline })
  } catch (err) { next(err) }
}

export async function getBioWeather(req, res, next) {
  try {
    const { lat, lon } = req.query

    // Fetch historical pressure (past 7 days hourly)
    const historical = await fetchHistorical(Number(lat), Number(lon))
    const pressures = historical.pressure // array of hourly hPa readings
    const times = historical.time

    if (!pressures || pressures.length < 4) {
      return res.json({ alert: null, pressureTrend: 0, currentPressure: null })
    }

    // Current pressure = last reading
    const currentPressure = pressures[pressures.length - 1]

    // Pressure 3 hours ago
    const pressure3hAgo = pressures[Math.max(0, pressures.length - 4)]

    // Pressure 6 hours ago
    const pressure6hAgo = pressures[Math.max(0, pressures.length - 7)]

    // 3-hour trend
    const trend3h = currentPressure - pressure3hAgo
    // 6-hour trend
    const trend6h = currentPressure - pressure6hAgo

    // Build alerts
    const alerts = []

    // Migraine trigger: drop > 4hPa in 3 hours
    if (trend3h < -4) {
      alerts.push({
        type: 'migraine',
        severity: trend3h < -8 ? 'high' : 'moderate',
        message: `Pressure dropped ${Math.abs(trend3h.toFixed(1))} hPa in 3 hours — migraine risk elevated`,
        emoji: '🧠',
      })
    }

    // Arthritis: sustained drop over 6 hours
    if (trend6h < -6 && trend3h < -2) {
      alerts.push({
        type: 'arthritis',
        severity: 'moderate',
        message: `Sustained pressure drop may cause joint discomfort`,
        emoji: '🦴',
      })
    }

    // Storm incoming: rapid drop
    if (trend3h < -10) {
      alerts.push({
        type: 'storm',
        severity: 'high',
        message: `Rapid pressure drop — storm conditions likely within hours`,
        emoji: '⛈️',
      })
    }

    // Rising pressure = clearing
    let positiveNote = null
    if (trend6h > 6) {
      positiveNote = 'Pressure rising — improving conditions ahead ☀️'
    }

    // Last 24 hours of pressure for sparkline
    const sparkline = pressures.slice(-24).map((p, i) => ({
      i,
      pressure: p,
      time: times[times.length - 24 + i],
    }))

    res.json({
      alerts,
      positiveNote,
      pressureTrend: Math.round(trend3h * 10) / 10,
      trend6h: Math.round(trend6h * 10) / 10,
      currentPressure: Math.round(currentPressure * 10) / 10,
      sparkline,
    })
  } catch(err) { next(err) }
}

export async function getSunset(req, res, next) {
  try {
    const { lat, lon } = req.query
    const forecast = await fetchForecast(Number(lat), Number(lon), 1)
    const today = forecast[0]

    // Fetch hourly cloud cover around sunset
    const hourlyUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=cloud_cover&timezone=auto&forecast_days=1`
    const r = await fetch(hourlyUrl)
    const json = await r.json()

    // Find cloud cover at sunset hour
    const sunsetHour = new Date(today.sunset).getHours()
    const cloudAtSunset = json.hourly.cloud_cover[sunsetHour] ?? 50
    const cloudBefore = json.hourly.cloud_cover[Math.max(0, sunsetHour - 1)] ?? 50
    const avgCloud = (cloudAtSunset + cloudBefore) / 2

    // Sunset quality formula:
    // 20-60% cloud = spectacular (dramatic coloured clouds)
    // 0-20% = good (clear but less colour)
    // 60-85% = average
    // >85% = blocked
    let quality, score, message
    if (avgCloud >= 85) { quality = 'Blocked'; score = 5; message = 'Clouds will hide the sunset' }
    else if (avgCloud >= 60) { quality = 'Average'; score = 35; message = 'Patchy clouds, limited colour' }
    else if (avgCloud >= 15) { quality = 'Spectacular'; score = 90; message = 'Dramatic clouds — perfect for photography' }
    else { quality = 'Clear'; score = 60; message = 'Clear sky, subtle glow on the horizon' }

    res.json({ quality, score, message, sunsetTime: today.sunset, cloudCover: Math.round(avgCloud) })
  } catch (err) { next(err) }
}
