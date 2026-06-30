import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const ThemeContext = createContext(null)

const STORAGE_KEY = 'ww-theme'
const VALID_THEMES = ['light', 'dark', 'auto']

function getSystemPreference() {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

function applyTheme(resolved) {
  document.documentElement.setAttribute('data-theme', resolved)
}

async function fetchSunriseSunset(lat, lon) {
  const url = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&formatted=0`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch sunrise/sunset')
  const data = await res.json()
  return {
    sunrise: new Date(data.results.sunrise),
    sunset: new Date(data.results.sunset),
  }
}

function getUserCoords() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(err),
      { timeout: 5000 }
    )
  })
}

async function resolveAutoTheme() {
  try {
    const coords = await getUserCoords()
    const { sunrise, sunset } = await fetchSunriseSunset(coords.lat, coords.lon)
    const now = new Date()
    if (now >= sunrise && now < sunset) {
      return 'light'
    }
    return 'dark'
  } catch {
    // Fallback to OS preference if geolocation or API fails
    return getSystemPreference()
  }
}

export function ThemeProvider({ children }) {
  const stored = localStorage.getItem(STORAGE_KEY)
  const initial = VALID_THEMES.includes(stored) ? stored : 'auto'

  const [theme, setThemeState] = useState(initial)
  const [resolvedTheme, setResolvedTheme] = useState('light')

  const resolveAndApply = useCallback(async (t) => {
    let resolved
    if (t === 'auto') {
      resolved = await resolveAutoTheme()
    } else {
      resolved = t
    }
    setResolvedTheme(resolved)
    applyTheme(resolved)
  }, [])

  // Resolve on mount and whenever theme changes
  useEffect(() => {
    resolveAndApply(theme)
  }, [theme, resolveAndApply])

  // Re-resolve auto theme every minute (sunrise/sunset boundary)
  useEffect(() => {
    if (theme !== 'auto') return
    const interval = setInterval(() => resolveAndApply('auto'), 60_000)
    return () => clearInterval(interval)
  }, [theme, resolveAndApply])

  // Listen for OS preference changes when in auto mode
  useEffect(() => {
    if (theme !== 'auto') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => resolveAndApply('auto')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme, resolveAndApply])

  function setTheme(newTheme) {
    if (!VALID_THEMES.includes(newTheme)) return
    localStorage.setItem(STORAGE_KEY, newTheme)
    setThemeState(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
