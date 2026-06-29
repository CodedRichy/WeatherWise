const SHIMMER_STYLE = `
  @keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`

export default function SkeletonCard({ width = '100%', height = '120px', borderRadius = '8px' }) {
  return (
    <>
      <style>{SHIMMER_STYLE}</style>
      <div
        style={{
          width,
          height,
          borderRadius,
          background: 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
        }}
      />
    </>
  )
}
