'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { IconMessage, IconRefresh, IconAlertCircle } from '@/app/dashboard/components/Icons'

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

function relTime(iso: string): string {
  const date = new Date(iso)
  const sec = Math.round((Date.now() - date.getTime()) / 1000)
  if (sec < 60) return 'just now'
  const min = Math.round(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h ago`
  const days = Math.round(hr / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(iso)
}

const MARKDOWN_COMPONENTS = {
  h1: ({ children }: { children?: React.ReactNode }) => <h1 className="commentary-h1">{children}</h1>,
  h2: ({ children }: { children?: React.ReactNode }) => <h2 className="commentary-h2">{children}</h2>,
  h3: ({ children }: { children?: React.ReactNode }) => <h3 className="commentary-h3">{children}</h3>,
  p:  ({ children }: { children?: React.ReactNode }) => <p  className="commentary-p">{children}</p>,
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="commentary-ul">{children}</ul>,
  li: ({ children }: { children?: React.ReactNode }) => <li className="commentary-li">{children}</li>,
  strong: ({ children }: { children?: React.ReactNode }) => <strong className="commentary-strong">{children}</strong>,
  em: ({ children }: { children?: React.ReactNode }) => <em className="commentary-em">{children}</em>,
  hr: () => <hr className="commentary-hr" />,
} as const

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

      const newEntry: Commentary = {
        id: data.id ?? Date.now().toString(),
        content: data.content,
        created_at: new Date().toISOString(),
      }
      setCommentaries((prev) => [newEntry, ...prev].slice(0, 10))
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Generate panel */}
      <div className="dash-card">
        <div className="dash-card-header">
          <div>
            <div className="dash-card-title">Generate Commentary</div>
            <div className="dash-card-sub">Claude analyses the live portfolio and writes institutional commentary.</div>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="dash-btn btn-gold"
          >
            {generating ? (
              <span style={{
                display: 'inline-block', width: 12, height: 12,
                border: '2px solid rgba(26,20,10,0.3)',
                borderTopColor: '#1a140a',
                borderRadius: '50%',
                animation: 'fyn-spin 0.8s linear infinite',
              }} />
            ) : (
              <IconRefresh width={13} height={13} />
            )}
            {generating ? 'Generating…' : 'Generate now'}
          </button>
        </div>
        {error && (
          <div className="dash-alert alert-error" style={{ margin: '16px 20px 20px' }}>
            <div className="dash-alert-title">
              <IconAlertCircle width={12} height={12} style={{ verticalAlign: '-2px', marginRight: 4 }} />
              Generation failed
            </div>
            <div className="dash-alert-body">{error}</div>
          </div>
        )}
      </div>

      {/* Commentaries */}
      {commentaries.length === 0 ? (
        <div className="dash-card">
          <div className="dash-card-body dash-empty" style={{ padding: '48px 20px' }}>
            <IconMessage width={28} height={28} style={{ marginBottom: 12, color: 'var(--ink-dim)' }} />
            <div>No commentary yet. Click &quot;Generate now&quot; to create the first one.</div>
          </div>
        </div>
      ) : (
        commentaries.map((c, i) => (
          <div
            key={c.id}
            className="dash-commentary"
            style={i === 0 ? undefined : { opacity: 0.95 }}
          >
            <div className="dash-commentary-inner">
              <div className="dash-commentary-header">
                <div>
                  <h3 className="dash-commentary-title">
                    {i === 0 ? 'Latest Commentary' : `Commentary #${commentaries.length - i}`}
                  </h3>
                  <div className="dash-commentary-sub">
                    AI-generated · {relTime(c.created_at)}
                  </div>
                </div>
                <div className="dash-commentary-date">
                  {formatDate(c.created_at)}
                </div>
              </div>
              <div className="dash-commentary-body">
                <ReactMarkdown components={MARKDOWN_COMPONENTS}>
                  {c.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))
      )}

      <style>{`
        @keyframes fyn-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
