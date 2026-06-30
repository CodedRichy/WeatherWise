export default function SkeletonCard({ width = '100%', height = '120px', borderRadius }) {
  return (
    <div
      className="skeleton-card"
      style={{ width, height, borderRadius: borderRadius || undefined }}
    />
  )
}
