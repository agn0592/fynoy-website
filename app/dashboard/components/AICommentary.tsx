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
        background: 'linear-gradient(135deg, #1a1d27 0%, #1e2130 100%)',
        border: '1px solid #2a2d3e',
        borderRadius: '12px',
        padding: '28px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, #8b5cf640, #3b82f640, #8b5cf620)',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#8b5cf6',
                boxShadow: '0 0 6px #8b5cf6',
              }}
            />
            <h2 style={{ color: '#fff', fontSize: '15px', fontWeight: 600, margin: 0, letterSpacing: '-0.01em' }}>
              Portfolio Commentary
            </h2>
          </div>
          <p style={{ color: '#4b5563', fontSize: '12px', margin: 0 }}>
            AI-generated analysis of current portfolio positioning
          </p>
        </div>
        {updatedAt && (
          <span style={{ color: '#4b5563', fontSize: '12px', flexShrink: 0 }}>
            {formatDate(updatedAt)}
          </span>
        )}
      </div>
      {commentary ? (
        <div
          style={{
            color: '#9ca3af',
            fontSize: '14px',
            lineHeight: '1.8',
            whiteSpace: 'pre-wrap',
            borderTop: '1px solid #1e2130',
            paddingTop: '20px',
          }}
        >
          {commentary}
        </div>
      ) : (
        <div
          style={{
            color: '#374151',
            fontSize: '14px',
            fontStyle: 'italic',
            borderTop: '1px solid #1e2130',
            paddingTop: '20px',
          }}
        >
          No commentary available yet.
        </div>
      )}
    </div>
  )
}
