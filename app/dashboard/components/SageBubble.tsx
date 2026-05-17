'use client'

import { useEffect, useState } from 'react'
import AgentChat from '@/app/components/AgentChat'
import '@/app/components/agent-chat.css'

export default function SageBubble() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="agent-bubble">
      {open && (
        <div className="agent-bubble-panel">
          <AgentChat
            agent="sage"
            agentName="Sage"
            agentTagline="Ask me about the portfolio"
            placeholder="Ask Sage anything…"
            compact
          />
        </div>
      )}
      <button
        className="agent-bubble-toggle"
        onClick={() => setOpen(o => !o)}
        title={open ? 'Close Sage' : 'Ask Sage'}
        aria-label={open ? 'Close Sage' : 'Ask Sage'}
      >
        {open ? '×' : 'S'}
      </button>
    </div>
  )
}
