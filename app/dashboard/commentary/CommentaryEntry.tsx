'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { IconArrowRight } from '@/app/dashboard/components/Icons'

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

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function preview(text: string, max: number): string {
  // Strip markdown headings/markers for a cleaner preview snippet
  const cleaned = text
    .replace(/^#+\s*/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/\n+/g, ' ')
    .trim()
  if (cleaned.length <= max) return cleaned
  return cleaned.slice(0, max).trimEnd() + '…'
}

interface Props {
  content: string
  createdAt: string
}

export default function CommentaryEntry({ content, createdAt }: Props) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="dash-card">
      <div className="dash-card-header" style={{ paddingBottom: 8 }}>
        <div>
          <div className="dash-card-title">Portfolio Commentary</div>
          <div className="dash-card-sub">{fmtDate(createdAt)}</div>
        </div>
        <button
          type="button"
          className="dash-card-link"
          onClick={() => setExpanded(v => !v)}
          style={{ background: 'none', border: 0, cursor: 'pointer' }}
          aria-expanded={expanded}
        >
          {expanded ? 'Collapse' : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              Read more <IconArrowRight width={12} height={12} />
            </span>
          )}
        </button>
      </div>
      <div className="dash-card-body">
        {expanded ? (
          <div className="dash-commentary-body">
            <ReactMarkdown components={MARKDOWN_COMPONENTS}>{content}</ReactMarkdown>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--ink-mute)', lineHeight: 1.7 }}>
            {preview(content, 200)}
          </div>
        )}
      </div>
    </div>
  )
}
