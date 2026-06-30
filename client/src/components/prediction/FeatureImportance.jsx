import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

const LABELS = {
  pressure_trend: 'Pressure',
  humidity_trend: 'Humidity',
  temp_trend:     'Temperature',
  cloud_cover:    'Cloud Cover',
}

export default function FeatureImportance({ featureImportance }) {
  if (!featureImportance) return null

  const data = Object.entries(featureImportance).map(([key, val]) => ({
    name:  LABELS[key] ?? key,
    value: Math.round(val * 100),
  }))

  return (
    <div style={{ marginTop: '0.5rem' }}>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            unit="%"
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={90}
            tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
          />
          <Tooltip formatter={v => [`${v}%`, 'Importance']} />
          <Bar
            dataKey="value"
            fill="#3b82f6"
            radius={[0, 4, 4, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
