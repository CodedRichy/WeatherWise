import { useState, useEffect } from 'react'

const LONDON_FALLBACK = { lat: 51.5074, lon: -0.1278 }

export function useGeolocation() {
  const [state, setState] = useState({ lat: null, lon: null, loading: true, error: null })

  useEffect(() => {
    // Check localStorage first (set by Navbar search)
    const stored = localStorage.getItem('ww-location')
    if (stored) {
      try {
        const { lat, lon } = JSON.parse(stored)
        if (lat != null && lon != null) {
          setState({ lat, lon, loading: false, error: null })
          return
        }
      } catch {
        // ignore malformed data
      }
    }

    // Try geolocation API
    if (!navigator.geolocation) {
      setState({ ...LONDON_FALLBACK, loading: false, error: 'Geolocation not supported' })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          loading: false,
          error: null,
        })
      },
      (err) => {
        setState({ ...LONDON_FALLBACK, loading: false, error: err.message })
      },
      { timeout: 8000 }
    )
  }, [])

  return state
}
