'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Nav from '@/app/components/Nav'
import HeroOrbs from '@/app/components/HeroOrbs'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const redirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/auth/reset-password`
      : 'https://fynoy.com/auth/reset-password'

    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

    setLoading(false)

    if (error) {
      const msg = error.message.toLowerCase()
      if (msg.includes('not found') || msg.includes('user') || msg.includes('email')) {
        setError('No account found for that email address.')
      } else if (msg.includes('rate')) {
        setError('Too many attempts. Try again in a few minutes.')
      } else {
        setError('Something went wrong. Please try again.')
      }
      return
    }
    setSent(true)
  }

  return (
    <>
      <Nav />
      <main className="auth-page">
        <div className="auth-split">

          <div className="auth-pitch">
            <HeroOrbs />
            <div className="grid-bg" />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <span className="eyebrow">Forgot password</span>
              <h1 style={{ marginTop: 20, fontSize: 'clamp(32px,3.8vw,52px)', lineHeight: 1.08 }}>
                No worries.<br />Quick reset.
              </h1>
              <p className="lede" style={{ marginTop: 20, maxWidth: '30ch', color: 'var(--ink-mute)' }}>
                Enter your email and we&apos;ll send you a link to set a new password.
              </p>
            </div>
          </div>

          <div className="auth-form-side">
            <div className="auth-card">
              <h2 style={{ fontSize: 'clamp(22px,2.2vw,30px)', marginBottom: 6 }}>Reset password</h2>
              <p style={{ fontSize: 14, color: 'var(--ink-mute)', marginBottom: 32 }}>
                We&apos;ll email you a secure link.
              </p>

              {sent ? (
                <div className="auth-success">
                  Check your inbox — we&apos;ve sent a reset link to <b>{email}</b>.
                  The link is valid for one hour.
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
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

                  {error && <p className="auth-error">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '14px 0', fontSize: 13 }}
                  >
                    {loading ? 'Sending…' : 'Send reset link'}
                  </button>
                </form>
              )}

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
