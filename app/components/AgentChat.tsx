'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import MarkdownView from './agent/MarkdownView'
import PlanCard from './agent/PlanCard'
import type { AgentName, ChatMode, PlanActionSummary, StreamEvent } from '@/lib/agent/types'

// ─── Local view types ──────────────────────────────────────────────────

type TextBlock = { type: 'text'; text: string }
type ToolUseBlock = { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
type ToolResultBlock = { type: 'tool_result'; tool_use_id: string; content: string; is_error?: boolean }
type ImagePlaceholderBlock = { type: 'image_placeholder'; media_type: string }
type ContentBlock = TextBlock | ToolUseBlock | ToolResultBlock | ImagePlaceholderBlock

interface UiMessage {
  id?: string
  role: 'user' | 'assistant'
  content: ContentBlock[]
  // Per-message UI state (auto-executed actions, attached plan rows).
  actionChips?: { tool_name: string; result: unknown }[]
}

interface Props {
  agent: AgentName
  agentName: string
  agentTagline?: string
  accentColor?: string
  placeholder?: string
  compact?: boolean
}

interface PendingImage {
  filename: string
  media_type: string
  data: string  // base64
  preview: string  // data URL for thumbnail
}

const MODELS: { key: ChatMode; label: string; hint: string }[] = [
  { key: 'fast',  label: 'Fast',  hint: 'Haiku — quick lookups' },
  { key: 'smart', label: 'Smart', hint: 'Sonnet — default' },
  { key: 'deep',  label: 'Deep',  hint: 'Opus — heavy analysis' },
]

// ─── SSE line reader ───────────────────────────────────────────────────

async function* readSse(body: ReadableStream<Uint8Array>): AsyncGenerator<{ event: string; data: string }> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { value, done } = await reader.read()
    if (done) return
    buffer += decoder.decode(value, { stream: true })
    let idx: number
    while ((idx = buffer.indexOf('\n\n')) !== -1) {
      const block = buffer.slice(0, idx)
      buffer = buffer.slice(idx + 2)
      let event = 'message'
      let data = ''
      for (const rawLine of block.split('\n')) {
        if (rawLine.startsWith(':')) continue  // comment / heartbeat
        if (rawLine.startsWith('event:')) event = rawLine.slice(6).trim()
        else if (rawLine.startsWith('data:')) data += rawLine.slice(5).trim()
      }
      if (data) yield { event, data }
    }
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────

function lastAssistantIndex(messages: UiMessage[]): number {
  for (let i = messages.length - 1; i >= 0; i--) if (messages[i].role === 'assistant') return i
  return -1
}

function readFileAsBase64(file: File): Promise<{ filename: string; media_type: string; data: string; preview: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => {
      const result = reader.result as string
      const m = /^data:(.+?);base64,(.+)$/.exec(result)
      if (!m) return reject(new Error('Bad data URL'))
      resolve({ filename: file.name, media_type: m[1], data: m[2], preview: result })
    }
    reader.readAsDataURL(file)
  })
}

// ─── Component ─────────────────────────────────────────────────────────

export default function AgentChat({
  agent,
  agentName,
  agentTagline,
  accentColor = 'var(--gold)',
  placeholder = 'Ask me anything…',
  compact = false,
}: Props) {
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [pendingPlans, setPendingPlans] = useState<PlanActionSummary[]>([])
  const [mode, setMode] = useState<ChatMode>('smart')
  const [images, setImages] = useState<PendingImage[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, busy, pendingPlans])

  // ── Load most-recent conversation on mount (so the chat persists across page reloads).
  useEffect(() => {
    let cancelled = false
    fetch(`/api/agent/conversations?agent=${agent}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(async (data: { conversations: { id: string; updated_at: string }[] } | null) => {
        if (cancelled || !data?.conversations?.length) return
        const latest = data.conversations[0]
        const r = await fetch(`/api/agent/conversations/${latest.id}`, { credentials: 'include' })
        if (!r.ok) return
        const detail = await r.json() as ConversationDetail
        if (cancelled) return
        setConversationId(detail.conversation.id)
        // Map DB rows to UiMessage. Replay write_actions as PlanCards under their parent message.
        const actionsByMessage = new Map<string, PlanActionSummary[]>()
        for (const a of detail.write_actions ?? []) {
          const arr = actionsByMessage.get(a.message_id) ?? []
          arr.push({ id: a.id, tool_use_id: a.tool_use_id, tool_name: a.tool_name, diff: a.diff, status: a.status })
          actionsByMessage.set(a.message_id, arr)
        }
        const uiMessages: UiMessage[] = detail.messages
          .filter((m): m is typeof m & { role: 'user' | 'assistant' } => m.role === 'user' || m.role === 'assistant')
          .map(m => ({
            id: m.id,
            role: m.role,
            content: Array.isArray(m.content) ? m.content as ContentBlock[] : [{ type: 'text', text: typeof m.content === 'string' ? m.content : '' }],
          }))
        setMessages(uiMessages)
        // Restore any still-proposed plan rows so the user can resume.
        const stillProposed = Array.from(actionsByMessage.values()).flat().filter(a => a.status === 'proposed')
        setPendingPlans(stillProposed)
      })
      .catch(() => { /* not critical */ })
    return () => { cancelled = true }
  }, [agent])

  const startNewConversation = useCallback(() => {
    abortRef.current?.abort()
    setConversationId(null)
    setMessages([])
    setPendingPlans([])
    setError(null)
    setImages([])
  }, [])

  const handleAttach = useCallback(async (fileList: FileList | null) => {
    if (!fileList) return
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const next: PendingImage[] = []
    for (const file of Array.from(fileList).slice(0, 5 - images.length)) {
      if (!allowed.includes(file.type)) continue
      if (file.size > 5_500_000) continue
      try {
        const parsed = await readFileAsBase64(file)
        next.push(parsed)
      } catch (e) {
        console.error(e)
      }
    }
    if (next.length) setImages(prev => [...prev, ...next].slice(0, 5))
  }, [images.length])

  const handlePaste = useCallback(async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(e.clipboardData.files).filter(f => f.type.startsWith('image/'))
    if (files.length === 0) return
    e.preventDefault()
    const dt = new DataTransfer()
    for (const f of files) dt.items.add(f)
    await handleAttach(dt.files)
  }, [handleAttach])

  async function handleSend() {
    const text = draft.trim()
    if (!text || busy) return

    setError(null)
    setBusy(true)

    // Optimistic user message (text + image thumbs).
    const userBlocks: ContentBlock[] = []
    for (const img of images) userBlocks.push({ type: 'image_placeholder', media_type: img.media_type })
    userBlocks.push({ type: 'text', text })
    const userMsg: UiMessage = { role: 'user', content: userBlocks }
    setMessages(prev => [...prev, userMsg, { role: 'assistant', content: [{ type: 'text', text: '' }] }])
    setDraft('')
    const sendImages = images
    setImages([])

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch(`/api/agent/${agent}/stream`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          conversation_id: conversationId,
          user_message: text,
          mode,
          images: sendImages.map(i => ({ filename: i.filename, media_type: i.media_type, data: i.data })),
        }),
      })

      if (!res.ok || !res.body) {
        const errBody = await res.json().catch(() => ({}))
        setError(errBody.detail ?? errBody.error ?? `HTTP ${res.status}`)
        // remove the empty assistant placeholder
        setMessages(prev => prev.slice(0, -1))
        return
      }

      // Per-tool_use partial JSON accumulators so we can show "live" input.
      const toolInputAcc = new Map<string, string>()
      const toolNames = new Map<string, string>()

      for await (const frame of readSse(res.body)) {
        let evt: StreamEvent | null = null
        try { evt = JSON.parse(frame.data) as StreamEvent } catch { continue }
        if (!evt) continue

        if (evt.type === 'conversation') {
          setConversationId(evt.conversation_id)
          continue
        }
        if (evt.type === 'token') {
          setMessages(prev => {
            const next = [...prev]
            const i = lastAssistantIndex(next)
            if (i === -1) return next
            const last = next[i]
            const blocks = [...last.content]
            const lastBlock = blocks[blocks.length - 1]
            if (lastBlock?.type === 'text') {
              blocks[blocks.length - 1] = { type: 'text', text: lastBlock.text + evt.text }
            } else {
              blocks.push({ type: 'text', text: evt.text })
            }
            next[i] = { ...last, content: blocks }
            return next
          })
          continue
        }
        if (evt.type === 'tool_call_start') {
          toolNames.set(evt.tool_use_id, evt.name)
          toolInputAcc.set(evt.tool_use_id, '')
          setMessages(prev => {
            const next = [...prev]
            const i = lastAssistantIndex(next)
            if (i === -1) return next
            const blocks = [...next[i].content, { type: 'tool_use' as const, id: evt.tool_use_id, name: evt.name, input: {} as Record<string, unknown> }]
            next[i] = { ...next[i], content: blocks }
            return next
          })
          continue
        }
        if (evt.type === 'tool_call_args') {
          toolInputAcc.set(evt.tool_use_id, (toolInputAcc.get(evt.tool_use_id) ?? '') + evt.partial_json)
          continue
        }
        if (evt.type === 'tool_call_end') {
          setMessages(prev => {
            const next = [...prev]
            const i = lastAssistantIndex(next)
            if (i === -1) return next
            const blocks = next[i].content.map(b => {
              if (b.type === 'tool_use' && b.id === evt.tool_use_id) {
                return { ...b, input: (evt.input ?? {}) as Record<string, unknown> }
              }
              return b
            })
            next[i] = { ...next[i], content: blocks }
            return next
          })
          continue
        }
        if (evt.type === 'action_executed') {
          setMessages(prev => {
            const next = [...prev]
            const i = lastAssistantIndex(next)
            if (i === -1) return next
            const chips = [...(next[i].actionChips ?? []), { tool_name: evt.tool_name, result: evt.result }]
            next[i] = { ...next[i], actionChips: chips }
            return next
          })
          continue
        }
        if (evt.type === 'plan') {
          setPendingPlans(prev => {
            const ids = new Set(prev.map(p => p.id))
            return [...prev, ...evt.actions.filter(a => !ids.has(a.id))]
          })
          continue
        }
        if (evt.type === 'message') {
          setMessages(prev => {
            const next = [...prev]
            const i = lastAssistantIndex(next)
            if (i !== -1) next[i] = { ...next[i], id: evt.message_id }
            return next
          })
          continue
        }
        if (evt.type === 'error') {
          setError(evt.detail ?? evt.code)
          continue
        }
        if (evt.type === 'done') {
          // nothing extra to do — UI is already current
          continue
        }
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
      setError(e instanceof Error ? e.message : 'Network error')
    } finally {
      setBusy(false)
      abortRef.current = null
    }
  }

  function handleAbort() {
    abortRef.current?.abort()
    setBusy(false)
  }

  function handlePlanResolved(updated: PlanActionSummary) {
    setPendingPlans(prev => prev.filter(p => p.id !== updated.id))
  }

  const hasMessages = messages.length > 0

  return (
    <div className={`agent-chat ${compact ? 'agent-chat--compact' : ''}`}>
      <div className="agent-chat-header">
        <div className="agent-chat-header-titles">
          <div className="agent-chat-name" style={{ color: accentColor }}>{agentName}</div>
          {agentTagline && <div className="agent-chat-tag">{agentTagline}</div>}
        </div>
        <div className="agent-chat-header-tools">
          <ModeSelector value={mode} onChange={setMode} disabled={busy} />
          {hasMessages && (
            <button className="agent-chat-reset" onClick={startNewConversation} title="New conversation" disabled={busy}>
              +
            </button>
          )}
        </div>
      </div>

      <div className="agent-chat-scroll" ref={scrollRef}>
        {!hasMessages && (
          <div className="agent-chat-empty">
            <div className="agent-chat-empty-title" style={{ color: accentColor }}>{agentName}</div>
            {agentTagline && <div className="agent-chat-empty-tag">{agentTagline}</div>}
          </div>
        )}

        {messages.map((m, i) => (
          <MessageView key={m.id ?? i} message={m} accent={accentColor} agent={agent} />
        ))}

        {pendingPlans.map(p => (
          <PlanCard key={p.id} action={p} onResolved={handlePlanResolved} />
        ))}

        {busy && messages[messages.length - 1]?.role === 'assistant' && messages[messages.length - 1].content.every(b => b.type !== 'text' || (b as TextBlock).text === '') && (
          <div className="agent-chat-thinking">
            <span className="agent-chat-dot" />
            <span className="agent-chat-dot" />
            <span className="agent-chat-dot" />
          </div>
        )}

        {error && <div className="agent-chat-error">⚠ {error}</div>}
      </div>

      {images.length > 0 && (
        <div className="agent-attached-row">
          {images.map((img, i) => (
            <div key={i} className="agent-attached-thumb">
              <img src={img.preview} alt={img.filename} />
              <button onClick={() => setImages(prev => prev.filter((_, j) => j !== i))} aria-label="remove">×</button>
            </div>
          ))}
        </div>
      )}

      <div className="agent-chat-input">
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder={placeholder}
          rows={2}
          disabled={busy}
        />
        <div className="agent-chat-input-actions">
          <label className="agent-chat-attach" title="Attach image (max 5)">
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              multiple
              hidden
              onChange={e => { void handleAttach(e.target.files); e.currentTarget.value = '' }}
            />
            <span>+</span>
          </label>
          {busy ? (
            <button onClick={handleAbort} className="agent-chat-stop" title="Stop">■</button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!draft.trim()}
              style={{ background: accentColor }}
            >
              Send
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────

function MessageView({ message, accent, agent }: { message: UiMessage; accent: string; agent: AgentName }) {
  const renderedContent = useMemo(() => message.content, [message.content])

  if (message.role === 'user') {
    const text = renderedContent.filter((c): c is TextBlock => c.type === 'text').map(c => c.text).join('\n')
    const imageCount = renderedContent.filter(c => c.type === 'image_placeholder').length
    if (!text && imageCount === 0) return null
    return (
      <div className="agent-msg agent-msg--user">
        <div className="agent-msg-bubble">
          {imageCount > 0 && <div className="agent-msg-imgs">📎 {imageCount} image{imageCount === 1 ? '' : 's'}</div>}
          {text && <div>{text}</div>}
        </div>
      </div>
    )
  }
  return (
    <div className="agent-msg agent-msg--assistant">
      {renderedContent.map((c, i) => {
        if (c.type === 'text') {
          if (!c.text) return null
          return (
            <div key={i} className="agent-msg-bubble">
              <MarkdownView text={c.text} agent={agent} />
            </div>
          )
        }
        if (c.type === 'tool_use') {
          const argCount = Object.keys(c.input ?? {}).length
          return (
            <details key={i} className="agent-tool-card">
              <summary>
                <span className="agent-tool-icon" style={{ background: accent }} />
                <span className="agent-tool-name">{c.name}</span>
                <span className="agent-tool-meta">{argCount} arg{argCount === 1 ? '' : 's'}</span>
              </summary>
              <pre className="agent-tool-args">{JSON.stringify(c.input ?? {}, null, 2)}</pre>
            </details>
          )
        }
        return null
      })}
      {(message.actionChips ?? []).map((chip, i) => (
        <div key={i} className="agent-action-chip">
          <span className="agent-action-chip-dot" />
          ran <code>{chip.tool_name}</code>
        </div>
      ))}
    </div>
  )
}

function ModeSelector({ value, onChange, disabled }: { value: ChatMode; onChange: (v: ChatMode) => void; disabled?: boolean }) {
  return (
    <div className="agent-mode-row" role="radiogroup" aria-label="Model speed">
      {MODELS.map(m => (
        <button
          key={m.key}
          className={`agent-mode-btn ${value === m.key ? 'agent-mode-btn--active' : ''}`}
          onClick={() => onChange(m.key)}
          disabled={disabled}
          title={m.hint}
          role="radio"
          aria-checked={value === m.key}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}

// ─── DB shapes ─────────────────────────────────────────────────────────

interface ConversationDetail {
  conversation: { id: string; title: string | null; agent: AgentName; created_at: string; updated_at: string }
  messages: { id: string; role: 'user' | 'assistant' | 'tool' | 'system'; content: unknown; created_at: string }[]
  write_actions: { id: string; message_id: string; tool_use_id: string; tool_name: string; input: Record<string, unknown>; diff: PlanActionSummary['diff']; status: PlanActionSummary['status']; created_at: string }[]
}
