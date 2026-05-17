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
      setErrorMsg('Enter your email address.')
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
        <label className="auth-label" htmlFor="email">Email address</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="auth-input"
          placeholder="you@example.com"
        />
      </div>

      {status === 'sent' && (
        <p className="auth-success">Email resent. Check your inbox and spam folder.</p>
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
        {status === 'sending' ? 'Sending…' : 'Resend email'}
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
              <span className="eyebrow">Create account</span>
              <h1 style={{ marginTop: 20, fontSize: 'clamp(32px,3.8vw,52px)', lineHeight: 1.08 }}>
                Almost<br />there.
              </h1>
              <p className="lede" style={{ marginTop: 20, maxWidth: '30ch', color: 'var(--ink-mute)' }}>
                Confirm your email address to unlock the portfolio dashboard.
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
                Check your inbox
              </h2>
              <p style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--ink-mute)', marginBottom: 12 }}>
                We&apos;ve sent a confirmation link to your email address. Click the link to activate your
                account and unlock the dashboard.
              </p>
              <p style={{ fontSize: 13, color: 'var(--ink-dim)', marginBottom: 28 }}>
                No email? Check your spam folder or resend it.
              </p>

              <Suspense fallback={null}>
                <ResendBlock />
              </Suspense>

              <hr className="auth-divider" />
              <Link href="/auth/login" style={{ color: 'var(--gold)', fontSize: 13 }}>
                ← Back to sign in
              </Link>
            </div>
          </div>

        </div>
      </main>
    </>
  )
}
