import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

const CITY_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']

export default function ComparisonChart({ cities }) {
  if (!cities.length) {
    return <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1rem 0' }}>Add cities to compare</p>
  }

  const data = [
    {
      metric: 'Temp (°C)',
      ...cities.reduce((acc, c) => ({ ...acc, [c.name]: c.data.temperature }), {}),
    },
    {
      metric: 'Humidity %',
      ...cities.reduce((acc, c) => ({ ...acc, [c.name]: c.data.humidity }), {}),
    },
    {
      metric: 'Wind m/s',
      ...cities.reduce((acc, c) => ({ ...acc, [c.name]: c.data.windSpeed }), {}),
    },
  ]

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="metric" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
        <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
        <Tooltip />
        <Legend />
        {cities.map((city, i) => (
          <Bar
            key={city.name}
            dataKey={city.name}
            fill={CITY_COLORS[i % CITY_COLORS.length]}
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
