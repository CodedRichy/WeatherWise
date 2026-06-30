import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser, useClerk } from '@clerk/react'
import { userApi } from '../api/weatherApi.js'
import SkeletonCard from '../components/ui/SkeletonCard.jsx'
import apiClient from '../api/apiClient.js'

export default function Profile() {
  const { user, isLoaded, isSignedIn } = useUser()
  const { signOut } = useClerk()
  const navigate = useNavigate()
  const [favorites, setFavorites] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState(null)
  const [prefs, setPrefs] = useState({ units: 'metric', theme: 'auto', narrativeStyle: 'casual' })
  const [prefsSaving, setPrefsSaving] = useState(false)
  const [prefsSaveError, setPrefsSaveError] = useState(null)

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      navigate('/', { replace: true })
      return
    }
    // Fetch preferences from MongoDB
    apiClient.get('/api/auth/me').then(res => {
      if (res.data?.preferences) setPrefs(res.data.preferences)
    }).catch(() => {})
  }, [isLoaded, isSignedIn, navigate])

  useEffect(() => {
    if (!isSignedIn) return
    setLoading(true)
    Promise.all([userApi.getFavorites(), userApi.getHistory()])
      .then(([favRes, histRes]) => {
        setFavorites(favRes.data)
        setHistory(histRes.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isSignedIn])

  async function handleRemoveFavorite(id) {
    setRemovingId(id)
    try {
      await userApi.removeFavorite(id)
      setFavorites((prev) => prev.filter((f) => f._id !== id))
    } catch {
    } finally {
      setRemovingId(null)
    }
  }

  async function handleSavePreferences(e) {
    e.preventDefault()
    setPrefsSaving(true)
    setPrefsSaveError(null)
    try {
      await apiClient.put('/api/auth/me', prefs)
    } catch (err) {
      setPrefsSaveError(err.response?.data?.error || 'Failed to save preferences')
    } finally {
      setPrefsSaving(false)
    }
  }

  async function handleLogout() {
    await signOut()
    navigate('/', { replace: true })
  }

  function handleReSearch(entry) {
    if (entry.lat != null && entry.lon != null) {
      navigate(`/?lat=${entry.lat}&lon=${entry.lon}&city=${encodeURIComponent(entry.city || '')}`)
    } else if (entry.city) {
      navigate(`/?city=${encodeURIComponent(entry.city)}`)
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }

  if (!isLoaded) {
    return (
      <div className="page profile-page">
        <SkeletonCard height="80px" />
      </div>
    )
  }

  if (!isSignedIn) return null

  const displayName = user.fullName || user.firstName || user.primaryEmailAddress?.emailAddress || '—'
  const displayEmail = user.primaryEmailAddress?.emailAddress || '—'

  return (
    <div className="page profile-page">
      <h1 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 700 }}>Profile</h1>

      <section className="profile-section">
        <h2>Account</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</span>
            <p style={{ fontWeight: 600, marginTop: '0.15rem' }}>{displayName}</p>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</span>
            <p style={{ marginTop: '0.15rem' }}>{displayEmail}</p>
          </div>
        </div>

        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text)' }}>Preferences</h3>
        <form onSubmit={handleSavePreferences} className="prefs-form">
          <div className="form-group">
            <label>Units</label>
            <select value={prefs.units} onChange={(e) => setPrefs((p) => ({ ...p, units: e.target.value }))}>
              <option value="metric">Metric (°C, m/s)</option>
              <option value="imperial">Imperial (°F, mph)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Theme</label>
            <select value={prefs.theme} onChange={(e) => setPrefs((p) => ({ ...p, theme: e.target.value }))}>
              <option value="auto">Auto (follows sunset)</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          <div className="form-group">
            <label>Narrative Style</label>
            <select value={prefs.narrativeStyle} onChange={(e) => setPrefs((p) => ({ ...p, narrativeStyle: e.target.value }))}>
              <option value="casual">Casual</option>
              <option value="formal">Formal</option>
            </select>
          </div>
          <button type="submit" className="btn-primary" disabled={prefsSaving} style={{ marginTop: '0.5rem' }}>
            {prefsSaving ? 'Saving...' : 'Save Preferences'}
          </button>
          {prefsSaveError && (
            <p style={{ color: 'var(--error, #ef4444)', fontSize: '0.85rem', marginTop: '0.4rem' }}>{prefsSaveError}</p>
          )}
        </form>
      </section>

      <section className="profile-section">
        <h2>Saved Locations</h2>
        {loading ? (
          <SkeletonCard height="60px" />
        ) : favorites.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No saved locations yet. Search for a city and save it as a favourite.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {favorites.map((fav) => (
              <li key={fav._id} className="favorite-item">
                <div>
                  <span style={{ fontWeight: 500 }}>{fav.city}</span>
                  {fav.lat != null && fav.lon != null && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                      {Number(fav.lat).toFixed(2)}, {Number(fav.lon).toFixed(2)}
                    </span>
                  )}
                </div>
                <button
                  className="btn-icon"
                  onClick={() => handleRemoveFavorite(fav._id)}
                  disabled={removingId === fav._id}
                  aria-label={`Remove ${fav.city} from favorites`}
                  title="Remove"
                >
                  {removingId === fav._id ? '…' : '✕'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="profile-section">
        <h2>Search History</h2>
        {loading ? (
          <SkeletonCard height="60px" />
        ) : history.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No search history yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {history.slice(0, 10).map((entry) => (
              <li key={entry._id} className="history-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ color: 'var(--text)', fontWeight: 500 }}>
                    {entry.city || `${Number(entry.lat).toFixed(2)}, ${Number(entry.lon).toFixed(2)}`}
                  </span>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                    {formatDate(entry.searchedAt)}
                  </span>
                </div>
                <button
                  className="btn-icon"
                  onClick={() => handleReSearch(entry)}
                  title="Search again"
                  style={{ fontSize: '1rem' }}
                >
                  ↩
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div style={{ marginTop: '0.5rem' }}>
        <button className="btn-danger" onClick={handleLogout}>
          Sign Out
        </button>
      </div>
    </div>
  )
}
