'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Nav from '@/app/components/Nav'
import HeroOrbs from '@/app/components/HeroOrbs'

function ResendBlock() {
  const searchParams = useSearchParams()
  const presetEmail = searchParams.get('email') ?? ''

  const [email, setEmail] = useState(presetEmail)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleResend() {
    if (!email) {
      setStatus('error')
      setErrorMsg('Vul je e-mailadres in.')
      return
    }
    setStatus('sending')
    setErrorMsg(null)

    const supabase = createClient()
    const { error } = await supabase.auth.resend({ type: 'signup', email })

    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
      return
    }
    setStatus('sent')
  }

  return (
    <div>
      <div className="auth-input-group">
        <label className="auth-label" htmlFor="email">E-mailadres</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="auth-input"
          placeholder="jij@voorbeeld.com"
        />
      </div>

      {status === 'sent' && (
        <p className="auth-success">Mail opnieuw verstuurd. Check je inbox en spam folder.</p>
      )}
      {status === 'error' && errorMsg && (
        <p className="auth-error">{errorMsg}</p>
      )}

      <button
        type="button"
        onClick={handleResend}
        disabled={status === 'sending'}
        className="btn btn-outline"
        style={{ width: '100%', justifyContent: 'center', marginTop: 4, padding: '12px 0', fontSize: 13 }}
      >
        {status === 'sending' ? 'Versturen…' : 'Verstuur opnieuw'}
      </button>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <>
      <Nav />
      <main className="auth-page">
        <div className="auth-split">

          <div className="auth-pitch">
            <HeroOrbs />
            <div className="grid-bg" />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <span className="eyebrow">Account aanmaken</span>
              <h1 style={{ marginTop: 20, fontSize: 'clamp(32px,3.8vw,52px)', lineHeight: 1.08 }}>
                Bijna<br />klaar.
              </h1>
              <p className="lede" style={{ marginTop: 20, maxWidth: '30ch', color: 'var(--ink-mute)' }}>
                Bevestig je e-mailadres en krijg direct toegang tot het portfolio dashboard.
              </p>
            </div>
          </div>

          <div className="auth-form-side">
            <div className="auth-card">
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                border: '1.5px solid #22c55e', color: '#22c55e',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 22, fontSize: 28, lineHeight: 1,
              }}>
                ✓
              </div>

              <h2 style={{ fontSize: 'clamp(22px,2.2vw,30px)', marginBottom: 10 }}>
                Check je inbox
              </h2>
              <p style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--ink-mute)', marginBottom: 12 }}>
                We hebben een bevestigingslink gestuurd naar je e-mailadres. Klik op de link om je account
                te activeren en toegang te krijgen tot het dashboard.
              </p>
              <p style={{ fontSize: 13, color: 'var(--ink-dim)', marginBottom: 28 }}>
                Geen mail ontvangen? Check je spam folder of stuur de mail opnieuw.
              </p>

              <Suspense fallback={null}>
                <ResendBlock />
              </Suspense>

              <hr className="auth-divider" />
              <Link href="/auth/login" style={{ color: 'var(--gold)', fontSize: 13 }}>
                ← Terug naar login
              </Link>
            </div>
          </div>

        </div>
      </main>
    </>
  )
}
