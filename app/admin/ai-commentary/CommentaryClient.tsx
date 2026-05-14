'use client'

import { useState } from 'react'

interface Commentary {
  id: string
  content: string
  created_at: string
}

interface CommentaryClientProps {
  initialCommentaries: Commentary[]
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

export default function CommentaryClient({ initialCommentaries }: CommentaryClientProps) {
  const [commentaries, setCommentaries] = useState<Commentary[]>(initialCommentaries)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setGenerating(true)
    setError(null)

    try {
      const res = await fetch('/api/commentary/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Failed to generate commentary')
        return
      }

      // Prepend new commentary to the list
      const newEntry: Commentary = {
        id: Date.now().toString(),
        content: data.content,
        created_at: new Date().toISOString(),
      }
      setCommentaries((prev) => [newEntry, ...prev].slice(0, 5))
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Generate button + error */}
      <div
        style={{
          background: '#1a1d27',
          border: '1px solid #2a2d3e',
          borderRadius: '10px',
          padding: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: 600, margin: '0 0 4px' }}>
            Generate Commentary
          </h2>
          <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>
            Calls Claude to analyse current portfolio and generate institutional commentary.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {error && (
            <span style={{ color: '#ef4444', fontSize: '13px' }}>{error}</span>
          )}
          <button
            onClick={handleGenerate}
            disabled={generating}
            style={{
              background: generating ? '#1e3a5f' : '#3b82f6',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 600,
              padding: '10px 24px',
              cursor: generating ? 'not-allowed' : 'pointer',
              opacity: generating ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {generating && (
              <span
                style={{
                  display: 'inline-block',
                  width: '14px',
                  height: '14px',
                  border: '2px solid #ffffff40',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
            )}
            {generating ? 'Generating...' : 'Generate Commentary'}
          </button>
        </div>
      </div>

      {/* Commentaries */}
      {commentaries.length === 0 ? (
        <div
          style={{
            background: '#1a1d27',
            border: '1px solid #2a2d3e',
            borderRadius: '10px',
            padding: '48px',
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '14px',
            fontStyle: 'italic',
          }}
        >
          No commentary yet. Click &quot;Generate Commentary&quot; to create the first one.
        </div>
      ) : (
        commentaries.map((c, i) => (
          <div
            key={c.id}
            style={{
              background: '#1a1d27',
              border: '1px solid #2a2d3e',
              borderRadius: '10px',
              padding: '24px',
              borderLeft: i === 0 ? '3px solid #3b82f6' : '3px solid #2a2d3e',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ color: '#fff', fontSize: '14px', fontWeight: 600, margin: 0 }}>
                  {i === 0 ? 'Latest Commentary' : `Commentary ${i + 1}`}
                </h3>
                {i === 0 && (
                  <span
                    style={{
                      background: '#3b82f620',
                      border: '1px solid #3b82f640',
                      borderRadius: '4px',
                      color: '#3b82f6',
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '1px 8px',
                    }}
                  >
                    Latest
                  </span>
                )}
              </div>
              <span style={{ color: '#6b7280', fontSize: '12px' }}>
                {formatDate(c.created_at)}
              </span>
            </div>
            <div
              style={{
                color: '#d1d5db',
                fontSize: '14px',
                lineHeight: '1.7',
                whiteSpace: 'pre-wrap',
              }}
            >
              {c.content}
            </div>
          </div>
        ))
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
