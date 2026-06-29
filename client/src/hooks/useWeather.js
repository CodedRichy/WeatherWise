import { useState, useEffect } from 'react'
import { weatherApi } from '../api/weatherApi.js'

export function useWeather({ lat, lon }) {
  const [current,   setCurrent]   = useState(null)
  const [forecast,  setForecast]  = useState(null)
  const [hourly,    setHourly]    = useState(null)
  const [narrative, setNarrative] = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)

  useEffect(() => {
    if (!lat || !lon) return

    setLoading(true)
    setError(null)

    Promise.all([
      weatherApi.getCurrent(lat, lon),
      weatherApi.getForecast(lat, lon),
      weatherApi.getHourly(lat, lon),
      weatherApi.getNarrative(lat, lon),
    ])
      .then(([curr, fore, hour, narr]) => {
        setCurrent(curr.data)
        setForecast(fore.data)
        setHourly(hour.data)
        setNarrative(narr.data)
      })
      .catch(e => setError(e.message || 'Failed to load weather'))
      .finally(() => setLoading(false))
  }, [lat, lon])

  return { current, forecast, hourly, narrative, loading, error }
}
