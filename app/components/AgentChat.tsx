'use client'

import { useEffect, useRef, useState } from 'react'

// Anthropic ContentBlock shapes we care about — kept loose to avoid SDK type imports on client.
type TextBlock = { type: 'text'; text: string }
type ToolUseBlock = { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
type ToolResultBlock = { type: 'tool_result'; tool_use_id: string; content: string; is_error?: boolean }
type ContentBlock = TextBlock | ToolUseBlock | ToolResultBlock | { type: string; [k: string]: unknown }

interface Message {
  role: 'user' | 'assistant'
  content: string | ContentBlock[]
}

interface PendingTool {
  tool_use_id: string
  name: string
  input: Record<string, unknown>
  description?: string
}

interface ChatResponse {
  status: 'done' | 'pending'
  messages: Message[]
  pending?: PendingTool
  error?: string
}

interface Props {
  endpoint: string                       // e.g. '/api/agent/atlas'
  agentName: string                      // 'Atlas' / 'Sage'
  agentTagline?: string                  // shown under the name
  accentColor?: string                   // CSS color for accent
  placeholder?: string                   // input placeholder
  compact?: boolean                      // bubble layout (smaller)
}

const ACCENT_DEFAULT = 'var(--gold)'

export default function AgentChat({
  endpoint,
  agentName,
  agentTagline,
  accentColor = ACCENT_DEFAULT,
  placeholder = 'Ask me anything…',
  compact = false,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<PendingTool | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, busy, pending])

  async function callApi(body: { messages: Message[]; approved?: { tool_use_id: string; approved: boolean; reason?: string } }) {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data: ChatResponse = await res.json()
      if (!res.ok || data.error) {
        setError(data.error ?? `HTTP ${res.status}`)
        return
      }
      setMessages(data.messages)
      setPending(data.status === 'pending' ? data.pending ?? null : null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error')
    } finally {
      setBusy(false)
    }
  }

  function handleSend() {
    const text = draft.trim()
    if (!text || busy) return
    const next: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setDraft('')
    callApi({ messages: next })
  }

  function handleConfirm(approved: boolean) {
    if (!pending) return
    setPending(null)
    callApi({ messages, approved: { tool_use_id: pending.tool_use_id, approved } })
  }

  function handleReset() {
    setMessages([])
    setPending(null)
    setError(null)
    setDraft('')
  }

  return (
    <div className={`agent-chat ${compact ? 'agent-chat--compact' : ''}`}>
      <div className="agent-chat-header" style={{ borderBottom: '1px solid var(--line)' }}>
        <div>
          <div className="agent-chat-name" style={{ color: accentColor }}>{agentName}</div>
          {agentTagline && <div className="agent-chat-tag">{agentTagline}</div>}
        </div>
        {messages.length > 0 && (
          <button className="agent-chat-reset" onClick={handleReset} title="Start over">
            ↻
          </button>
        )}
      </div>

      <div className="agent-chat-scroll" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="agent-chat-empty">
            <div className="agent-chat-empty-title" style={{ color: accentColor }}>{agentName}</div>
            {agentTagline && <div className="agent-chat-empty-tag">{agentTagline}</div>}
          </div>
        )}
        {messages.map((m, i) => (
          <MessageView key={i} message={m} prevMessages={messages.slice(0, i)} accent={accentColor} />
        ))}
        {pending && (
          <PendingToolCard pending={pending} onApprove={() => handleConfirm(true)} onReject={() => handleConfirm(false)} accent={accentColor} />
        )}
        {busy && (
          <div className="agent-chat-thinking">
            <span className="agent-chat-dot" />
            <span className="agent-chat-dot" />
            <span className="agent-chat-dot" />
          </div>
        )}
        {error && (
          <div className="agent-chat-error">⚠ {error}</div>
        )}
      </div>

      <div className="agent-chat-input">
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder={placeholder}
          rows={2}
          disabled={busy || !!pending}
        />
        <button
          onClick={handleSend}
          disabled={busy || !!pending || !draft.trim()}
          style={{ background: accentColor }}
        >
          Send
        </button>
      </div>
    </div>
  )
}

function MessageView({ message, accent }: { message: Message; prevMessages: Message[]; accent: string }) {
  const content = typeof message.content === 'string' ? [{ type: 'text', text: message.content } as TextBlock] : message.content
  if (message.role === 'user') {
    const text = content
      .filter((c): c is TextBlock => c.type === 'text')
      .map(c => c.text)
      .join('\n')
    if (!text) return null
    return (
      <div className="agent-msg agent-msg--user">
        <div className="agent-msg-bubble">{text}</div>
      </div>
    )
  }
  return (
    <div className="agent-msg agent-msg--assistant">
      {content.map((c, i) => {
        if (c.type === 'text') {
          return (
            <div key={i} className="agent-msg-bubble">
              {(c as TextBlock).text}
            </div>
          )
        }
        if (c.type === 'tool_use') {
          const tu = c as ToolUseBlock
          return (
            <details key={i} className="agent-tool-card">
              <summary>
                <span className="agent-tool-icon" style={{ background: accent }} />
                <span className="agent-tool-name">{tu.name}</span>
                <span className="agent-tool-meta">{Object.keys(tu.input).length} arg{Object.keys(tu.input).length === 1 ? '' : 's'}</span>
              </summary>
              <pre className="agent-tool-args">{JSON.stringify(tu.input, null, 2)}</pre>
            </details>
          )
        }
        return null
      })}
    </div>
  )
}

function PendingToolCard({ pending, onApprove, onReject, accent }: {
  pending: PendingTool
  onApprove: () => void
  onReject: () => void
  accent: string
}) {
  return (
    <div className="agent-pending">
      <div className="agent-pending-head">
        <span className="agent-pending-icon" style={{ borderColor: accent, color: accent }}>!</span>
        <div>
          <div className="agent-pending-title">Confirm action: <code>{pending.name}</code></div>
          {pending.description && (
            <div className="agent-pending-desc">{pending.description}</div>
          )}
        </div>
      </div>
      <pre className="agent-pending-args">{JSON.stringify(pending.input, null, 2)}</pre>
      <div className="agent-pending-foot">
        <button className="agent-btn agent-btn--ghost" onClick={onReject}>Cancel</button>
        <button className="agent-btn agent-btn--primary" style={{ background: accent }} onClick={onApprove}>Confirm</button>
      </div>
    </div>
  )
}
