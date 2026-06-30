export default function ErrorCard({ message, onRetry }) {
  return (
    <div className="error-card">
      <span>⚠️ {message}</span>
      {onRetry && <button onClick={onRetry} className="btn-retry">Retry</button>}
    </div>
  )
}
