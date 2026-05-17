'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import AgentChat from '@/app/components/AgentChat'
import '@/app/components/agent-chat.css'

export default function AtlasBubble() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Hide the floating bubble when the user is already on the dedicated Atlas page.
  const onAtlasPage = pathname?.startsWith('/admin/atlas')

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (onAtlasPage) return null

  return (
    <div className="agent-bubble">
      {open && (
        <div className="agent-bubble-panel">
          <AgentChat
            agent="atlas"
            agentName="Atlas"
            agentTagline="Admin agent · write access"
            placeholder="Geef Atlas een opdracht…"
            compact
          />
        </div>
      )}
      <button
        className="agent-bubble-toggle"
        onClick={() => setOpen(o => !o)}
        title={open ? 'Close Atlas' : 'Open Atlas'}
        aria-label={open ? 'Close Atlas' : 'Open Atlas'}
      >
        {open ? '×' : 'A'}
      </button>
    </div>
  )
}
