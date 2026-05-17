import AgentChat from '@/app/components/AgentChat'
import '@/app/components/agent-chat.css'

export default function AtlasPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: 'calc(100vh - 140px)' }}>
      <div>
        <h1 style={{ color: 'var(--ink)', fontSize: 24, fontWeight: 600, margin: '0 0 4px', fontFamily: 'var(--serif)' }}>
          Atlas
        </h1>
        <p style={{ color: 'var(--ink-dim)', fontSize: 13, margin: 0 }}>
          Jouw admin-agent met directe schrijftoegang tot de cases en posities. Geef opdrachten zoals
          &quot;voor MSFT zet take-profit op 520 en holding-period op 9&quot; — bij elke wijziging vraagt
          Atlas een bevestiging voor hij iets opslaat.
        </p>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <AgentChat
          agent="atlas"
          agentName="Atlas"
          agentTagline="Admin agent · write access"
          placeholder="Geef Atlas een opdracht…"
        />
      </div>
    </div>
  )
}
