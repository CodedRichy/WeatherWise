import React, { useState, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { Show, UserButton, SignInButton, SignUpButton } from '@clerk/react'
import { useTheme } from '../../contexts/ThemeContext.jsx'

const THEME_ICONS = { light: '☀️', dark: '🌙', auto: '⚙️' }
const THEME_CYCLE = ['light', 'dark', 'auto']

const LOCATION_KEY = 'ww-location'

export default function Navbar() {
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
        <NavLink to="/" end className={({ isActive }) => 'navbar__link' + (isActive ? ' active' : '')}>
          Home
        </NavLink>
        <NavLink to="/compare" className={({ isActive }) => 'navbar__link' + (isActive ? ' active' : '')}>
          Compare
        </NavLink>
        <NavLink to="/activities" className={({ isActive }) => 'navbar__link' + (isActive ? ' active' : '')}>
          Activities
        </NavLink>
        <NavLink to="/history" className={({ isActive }) => 'navbar__link' + (isActive ? ' active' : '')}>
          Time Machine
        </NavLink>
      </div>

      <form className="navbar__search" onSubmit={handleSearch} role="search" style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="search"
          className={`navbar__search-input${searchError ? ' input--error' : ''}`}
          placeholder="Search location…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (searchError) setSearchError(null)
          }}
          aria-label="Search location"
        />
        {searchError && (
          <span style={{ position: 'absolute', top: '100%', left: 0, fontSize: '0.75rem', color: 'var(--danger)', whiteSpace: 'nowrap', marginTop: '0.25rem' }}>
            {searchError}
          </span>
        )}
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

        <Show when="signed-in">
          <NavLink
            to="/profile"
            className={({ isActive }) => 'navbar__link' + (isActive ? ' active' : '')}
          >
            Profile
          </NavLink>
          <UserButton afterSignOutUrl="/" />
        </Show>
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button className="btn">Login</button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="btn btn--accent">Register</button>
          </SignUpButton>
        </Show>
      </div>
    </nav>
  )
}
