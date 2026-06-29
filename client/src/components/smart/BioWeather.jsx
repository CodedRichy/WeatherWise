import { useState, useEffect } from 'react'
import { weatherApi } from '../../api/weatherApi.js'
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'

export default function BioWeather({ lat, lon }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    weatherApi.getBio(lat, lon).then(r => setData(r.data)).catch(() => {})
  }, [lat, lon])

  if (!data) return null
  if (!data.alerts?.length && !data.positiveNote) return null // nothing to show

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
      {data.alerts.map((alert, i) => (
        <div key={i} className={`alert-banner alert-banner--${alert.severity === 'high' ? 'danger' : 'warn'}`}>
          <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{alert.emoji}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.1rem', textTransform: 'capitalize' }}>
              {alert.type} alert
            </div>
            <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>{alert.message}</div>
          </div>
          {data.currentPressure && (
            <div style={{ fontSize: '0.75rem', opacity: 0.7, flexShrink: 0, textAlign: 'right' }}>
              {data.currentPressure}<br/>hPa
            </div>
          )}
        </div>
      ))}
      {data.positiveNote && (
        <div className="alert-banner alert-banner--info" style={{ border: '1px solid var(--border-solid)' }}>
          <span>{data.positiveNote}</span>
        </div>
      )}
      {data.sparkline?.length > 4 && (
        <div style={{ height: 40, padding: '0 0.5rem' }}>
          <ResponsiveContainer width="100%" height={40}>
            <LineChart data={data.sparkline}>
              <Line type="monotone" dataKey="pressure" stroke="var(--text-muted)" strokeWidth={1.5} dot={false} />
              <Tooltip
                contentStyle={{ background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }}
                formatter={v => [`${v} hPa`, 'Pressure']}
                labelFormatter={() => ''}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
