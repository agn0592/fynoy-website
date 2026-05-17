import Link from 'next/link'
import { IconArrowLeft, IconHome } from './components/Icons'

export default function DashboardNotFound() {
  return (
    <div className="dash-card" style={{ padding: 32, maxWidth: 540, margin: '40px auto', textAlign: 'center' }}>
      <div style={{
        fontFamily: 'var(--serif)', fontSize: 64, fontWeight: 500,
        color: 'var(--gold)', lineHeight: 1, letterSpacing: '-0.02em',
        margin: '0 0 8px',
      }}>404</div>
      <h2 style={{
        fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 500,
        color: 'var(--ink)', margin: '0 0 6px',
      }}>
        Pagina niet gevonden
      </h2>
      <p style={{ color: 'var(--ink-mute)', fontSize: 14, margin: '0 0 24px', lineHeight: 1.6 }}>
        Deze pagina bestaat niet of is verplaatst.
      </p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href="/dashboard" className="dash-btn btn-gold">
          <IconHome width={14} height={14} />
          Naar dashboard
        </Link>
        <Link href="/dashboard/insights" className="dash-btn btn-ghost">
          <IconArrowLeft width={14} height={14} />
          Bekijk insights
        </Link>
      </div>
    </div>
  )
}
