import SkeletonCard from '../ui/SkeletonCard.jsx'

// Props: { narrative }
// narrative = { narrative: string, tone: string, generatedAt: string } | null
export default function NarrativeSummary({ narrative, loading }) {
  if (!narrative) {
    return loading ? <SkeletonCard height="80px" /> : null
  }

  let generatedTime = ''
  if (narrative.generatedAt) {
    const d = new Date(narrative.generatedAt)
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    generatedTime = `${hh}:${mm}`
  }

  return (
    <div className="narrative-card">
      <p style={{ fontStyle: 'italic', lineHeight: 1.6, color: 'var(--text)' }}>
        {narrative.narrative}
      </p>
      {generatedTime && (
        <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Generated at {generatedTime}
        </p>
      )}
    </div>
  )
}
