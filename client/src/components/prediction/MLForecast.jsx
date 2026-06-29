import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const mid  = payload.find(p => p.dataKey === 'mid')?.value
  const high = payload.find(p => p.dataKey === 'high')?.value
  const low  = payload.find(p => p.dataKey === 'low')?.value
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}>
      <p style={{ fontWeight: 600, marginBottom: 4 }}>{label}</p>
      {mid  != null && <p>Forecast: <strong>{mid}°C</strong></p>}
      {high != null && low != null && (
        <p style={{ color: 'var(--text-muted)' }}>Range: {low}°C – {high}°C</p>
      )}
    </div>
  )
}

export default function MLForecast({ forecast }) {
  if (!forecast?.length) return null

  const data = forecast.map(d => ({
    name: d.day === 0 ? 'Today' : d.day === 1 ? 'Tomorrow' : 'Day 3',
    low:  d.confidenceLow,
    mid:  d.tempMid,
    high: d.confidenceHigh,
  }))

  return (
    <div style={{ marginTop: '0.5rem' }}>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
          <YAxis domain={['auto', 'auto']} unit="°C" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} width={45} />
          <Tooltip content={<CustomTooltip />} />
          {/* Confidence band: high area filled, then low area filled with bg to "erase" lower portion */}
          <Area
            type="monotone"
            dataKey="high"
            fill="#3b82f630"
            stroke="#3b82f640"
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="low"
            fill="var(--bg)"
            stroke="#3b82f640"
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="mid"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 4, fill: '#3b82f6' }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
