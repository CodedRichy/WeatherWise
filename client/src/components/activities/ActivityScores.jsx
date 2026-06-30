import SkeletonCard from '../ui/SkeletonCard.jsx'

const DISPLAY_NAMES = {
  running: 'Running',
  cycling: 'Cycling',
  stargazing: 'Stargazing',
  photography: 'Photography',
  outdoorDining: 'Outdoor Dining',
}

const ACTIVITY_KEYS = ['running', 'cycling', 'stargazing', 'photography', 'outdoorDining']

function scoreColor(score) {
  if (score >= 70) return '#10b981'
  if (score >= 40) return '#f59e0b'
  return '#ef4444'
}

function RadialGauge({ score }) {
  const color = scoreColor(score)
  const filled = (score / 100) * 282.7

  return (
    <svg viewBox="0 0 100 100" width="100" height="100" style={{ display: 'block', margin: '0 auto' }}>
      <circle
        cx="50"
        cy="50"
        r="45"
        stroke="#e2e8f0"
        strokeWidth="8"
        fill="none"
      />
      <circle
        cx="50"
        cy="50"
        r="45"
        stroke={color}
        strokeWidth="8"
        fill="none"
        strokeDasharray={`${filled} 282.7`}
        strokeLinecap="round"
        strokeDashoffset="-70.7"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="24"
        fontWeight="700"
        fill={color}
      >
        {score}
      </text>
    </svg>
  )
}

function ActivityCard({ activityKey, data }) {
  const name = DISPLAY_NAMES[activityKey] || activityKey
  const score = data?.score ?? 0
  const factors = data?.factors ?? []
  const topFactors = factors.slice(0, 2)

  return (
    <div className="activity-card">
      <h3>{name}</h3>
      <RadialGauge score={score} />
      {topFactors.length > 0 && (
        <div className="activity-factors">
          {topFactors.map((f, i) => (
            <div key={i}>{f}</div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ActivityScores({ scores, loading }) {
  if (loading) {
    return (
      <div className="activity-grid">
        {[...Array(5)].map((_, i) => (
          <SkeletonCard key={i} height="220px" />
        ))}
      </div>
    )
  }

  if (!scores) return null

  return (
    <div
      className="activity-grid"
      style={{ gridTemplateAreas: '"a b" "c d" ". e ."' }}
    >
      {ACTIVITY_KEYS.map((key, i) => (
        <div
          key={key}
          style={
            i === 4
              ? { gridColumn: '1 / -1', maxWidth: '50%', margin: '0 auto', width: '100%' }
              : {}
          }
        >
          <ActivityCard activityKey={key} data={scores[key]} />
        </div>
      ))}
    </div>
  )
}
