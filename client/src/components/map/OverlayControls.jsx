const OVERLAYS = [
  { key: 'temp_new', label: 'Temperature' },
  { key: 'precipitation_new', label: 'Precipitation' },
  { key: 'clouds_new', label: 'Clouds' },
  { key: 'wind_new', label: 'Wind' },
]

const hasOWMKey = Boolean(import.meta.env.VITE_OWM_API_KEY)

export default function OverlayControls({ activeOverlay, onOverlayChange }) {
  function handleClick(key) {
    // Click the already-active button to deselect
    onOverlayChange(activeOverlay === key ? null : key)
  }

  return (
    <div className="overlay-controls">
      {OVERLAYS.map(({ key, label }) => {
        const isActive = activeOverlay === key
        return (
          <div
            key={key}
            className="overlay-btn-wrapper"
            title={!hasOWMKey ? 'OWM API key required' : undefined}
          >
            <button
              className={`overlay-btn${isActive ? ' overlay-btn--active' : ''}`}
              onClick={() => handleClick(key)}
              disabled={!hasOWMKey}
            >
              {label}
            </button>
          </div>
        )
      })}
    </div>
  )
}
