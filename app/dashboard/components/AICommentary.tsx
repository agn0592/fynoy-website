interface AICommentaryProps {
  commentary: string | null
  updatedAt: string | null
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AICommentary({ commentary, updatedAt }: AICommentaryProps) {
  return (
    <div
      style={{
        background: '#1a1d27',
        border: '1px solid #2a2d3e',
        borderRadius: '10px',
        padding: '24px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
        <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: 600, margin: 0 }}>
          AI Commentary
        </h2>
        {updatedAt && (
          <span style={{ color: '#6b7280', fontSize: '12px' }}>
            Last updated: {formatDate(updatedAt)}
          </span>
        )}
      </div>
      {commentary ? (
        <div style={{ color: '#d1d5db', fontSize: '14px', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
          {commentary}
        </div>
      ) : (
        <div style={{ color: '#6b7280', fontSize: '14px', fontStyle: 'italic' }}>
          No commentary available yet.
        </div>
      )}
    </div>
  )
}
