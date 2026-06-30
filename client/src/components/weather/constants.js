export const CONDITION_EMOJI = {
  'Clear': '☀️',
  'Partly Cloudy': '⛅',
  'Foggy': '🌫️',
  'Drizzle': '🌦️',
  'Rain': '🌧️',
  'Snow': '❄️',
  'Showers': '🌦️',
  'Thunderstorm': '⛈️',
  'Unknown': '🌡️',
}

// Maps Open-Meteo WMO weather codes to condition strings
export function wmoToCondition(code) {
  if (code === 0) return 'Clear'
  if (code <= 3) return 'Partly Cloudy'
  if (code === 45 || code === 48) return 'Foggy'
  if (code >= 51 && code <= 57) return 'Drizzle'
  if (code >= 61 && code <= 67) return 'Rain'
  if (code >= 71 && code <= 77) return 'Snow'
  if (code >= 80 && code <= 82) return 'Showers'
  if (code >= 95 && code <= 99) return 'Thunderstorm'
  return 'Unknown'
}
