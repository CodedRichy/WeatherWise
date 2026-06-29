import { useState } from 'react'
import { weatherApi } from '../api/weatherApi.js'
import ComparisonChart from '../components/prediction/ComparisonChart.jsx'
import SkeletonCard from '../components/ui/SkeletonCard.jsx'

export default function Compare() {
  const [query, setQuery]   = useState('')
  const [cities, setCities] = useState([]) // { name, lat, lon, data }
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState(null)

  async function addCity(e) {
    e.preventDefault()
    if (!query.trim() || cities.length >= 4) return
    setLoading(true)
    setError(null)
    try {
      const geo = await weatherApi.geocode(query)
      const results = geo.data?.results
      if (!results?.length) throw new Error('City not found')
      const { name, latitude: lat, longitude: lon, country } = results[0]
      const cityName = `${name}, ${country}`
      if (cities.find(c => c.name === cityName)) throw new Error('Already added')
      const weather = await weatherApi.getCurrent(lat, lon)
      setCities(prev => [...prev, { name: cityName, lat, lon, data: weather.data }])
      setQuery('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page compare-page">
      <h1>Compare Cities</h1>
      <form onSubmit={addCity} className="city-search-form">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search city..."
          className="city-input"
        />
        <button type="submit" className="btn btn--accent" disabled={loading || cities.length >= 4}>
          Add
        </button>
      </form>
      {error && <p className="error-text">{error}</p>}
      <div className="city-chips">
        {cities.map(c => (
          <span key={c.name} className="city-chip">
            {c.name}{' '}
            <button onClick={() => setCities(prev => prev.filter(x => x.name !== c.name))}>
              ×
            </button>
          </span>
        ))}
      </div>
      {loading && <SkeletonCard height="280px" />}
      <ComparisonChart cities={cities} />
      {cities.length > 0 && (
        <table className="compare-table">
          <thead>
            <tr>
              <th>Metric</th>
              {cities.map(c => <th key={c.name}>{c.name}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Temperature</td>
              {cities.map(c => <td key={c.name}>{Math.round(c.data.temperature)}°C</td>)}
            </tr>
            <tr>
              <td>Humidity</td>
              {cities.map(c => <td key={c.name}>{c.data.humidity}%</td>)}
            </tr>
            <tr>
              <td>Wind</td>
              {cities.map(c => <td key={c.name}>{c.data.windSpeed} m/s</td>)}
            </tr>
            <tr>
              <td>Condition</td>
              {cities.map(c => <td key={c.name}>{c.data.condition}</td>)}
            </tr>
          </tbody>
        </table>
      )}
    </div>
  )
}
