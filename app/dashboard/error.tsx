'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div className="dash-card" style={{ borderColor: 'rgba(248,113,113,0.3)', padding: 28, maxWidth: 540, margin: '40px auto' }}>
      <div className="dash-card-title" style={{ color: 'var(--dash-red)' }}>Iets ging mis</div>
      <div className="dash-card-sub" style={{ marginTop: 6 }}>
        {error.message || 'An unexpected error occurred. Probeer het opnieuw.'}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
        <button type="button" className="dash-btn btn-gold" onClick={reset}>
          Probeer opnieuw
        </button>
        <Link href="/dashboard" className="dash-btn btn-ghost">
          Naar dashboard
        </Link>
      </div>
    </div>
  )
}
