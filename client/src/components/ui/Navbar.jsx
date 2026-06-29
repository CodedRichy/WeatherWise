import React, { useState, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useTheme } from '../../contexts/ThemeContext.jsx'

const THEME_ICONS = { light: '☀️', dark: '🌙', auto: '⚙️' }
const THEME_CYCLE = ['light', 'dark', 'auto']

const LOCATION_KEY = 'ww-location'

function getInitials(user) {
  if (!user) return ''
  const name = user.name || user.email || ''
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()

  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [searchError, setSearchError] = useState(null)
  const inputRef = useRef(null)

  function cycleTheme() {
    const idx = THEME_CYCLE.indexOf(theme)
    setTheme(THEME_CYCLE[(idx + 1) % THEME_CYCLE.length])
  }

  async function handleSearch(e) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    setSearchError(null)

    try {
      const res = await fetch(`/api/weather/geocode?q=${encodeURIComponent(q)}`)
      if (!res.ok) throw new Error('Geocode request failed')
      const data = await res.json()
      if (data && data.length > 0) {
        const location = data[0]
        localStorage.setItem(LOCATION_KEY, JSON.stringify(location))
        setQuery('')
        // Dispatch a storage event so other components can react
        window.dispatchEvent(new StorageEvent('storage', {
          key: LOCATION_KEY,
          newValue: JSON.stringify(location),
        }))
      } else {
        setSearchError('Location not found')
      }
    } catch {
      setSearchError('Search unavailable')
    }
  }

  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar__logo">
        WeatherWise
      </NavLink>

      <button
        className="hamburger"
        aria-label="Toggle navigation menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((o) => !o)}
      >
        {menuOpen ? '✕' : '☰'}
      </button>

      <div className={`navbar__links nav-links${menuOpen ? ' open' : ''}`}>
        <NavLink
          to="/"
          end
          className={({ isActive }) => 'navbar__link' + (isActive ? ' active' : '')}
        >
          Home
        </NavLink>
        <NavLink
          to="/compare"
          className={({ isActive }) => 'navbar__link' + (isActive ? ' active' : '')}
        >
          Compare
        </NavLink>
        <NavLink
          to="/activities"
          className={({ isActive }) => 'navbar__link' + (isActive ? ' active' : '')}
        >
          Activities
        </NavLink>
        <NavLink
          to="/history"
          className={({ isActive }) => 'navbar__link' + (isActive ? ' active' : '')}
        >
          Time Machine
        </NavLink>
      </div>

      <form className="navbar__search" onSubmit={handleSearch} role="search">
        <input
          ref={inputRef}
          type="search"
          className="navbar__search-input"
          placeholder="Search location…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (searchError) setSearchError(null)
          }}
          aria-label="Search location"
          title={searchError || undefined}
        />
      </form>

      <div className="navbar__actions">
        <button
          className="btn--icon"
          onClick={cycleTheme}
          aria-label={`Theme: ${theme}. Click to cycle.`}
          title={`Theme: ${theme}`}
        >
          {THEME_ICONS[theme]}
        </button>

        {user ? (
          <>
            <div className="avatar" title={user.name || user.email}>
              {getInitials(user)}
            </div>
            <NavLink
              to="/profile"
              className={({ isActive }) => 'navbar__link' + (isActive ? ' active' : '')}
            >
              Profile
            </NavLink>
            <button className="btn" onClick={logout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <button
              className="btn"
              onClick={() => {
                // Modal support will be wired up in a later task;
                // for now emit a custom event that a modal component can listen to.
                window.dispatchEvent(new CustomEvent('ww:open-auth', { detail: 'login' }))
              }}
            >
              Login
            </button>
            <button
              className="btn btn--accent"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('ww:open-auth', { detail: 'register' }))
              }}
            >
              Register
            </button>
          </>
        )}
      </div>
    </nav>
  )
}
