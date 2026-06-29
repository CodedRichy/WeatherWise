import { useState, useEffect } from 'react'
import { weatherApi } from '../api/weatherApi.js'
import ActivityScores from '../components/activities/ActivityScores.jsx'
import BestWindowPicker from '../components/activities/BestWindowPicker.jsx'
import SkeletonCard from '../components/ui/SkeletonCard.jsx'

export default function Activities() {
  const [coords, setCoords] = useState(null)
  const [scores, setScores] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('ww-location')
    const loc = stored ? JSON.parse(stored) : { lat: 51.5074, lon: -0.1278 }
    setCoords(loc)
    weatherApi.getScores(loc.lat, loc.lon)
      .then(res => setScores(res.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page activities-page">
      <h1>Activity Conditions</h1>
      {loading ? (
        <SkeletonCard height="300px" />
      ) : error ? (
        <div className="error-card">&#9888;&#65039; {error}</div>
      ) : (
        <ActivityScores scores={scores?.scores} loading={loading} />
      )}
      {coords && <BestWindowPicker lat={coords.lat} lon={coords.lon} />}
    </div>
  )
}
