'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Nav from '@/app/components/Nav'
import HeroOrbs from '@/app/components/HeroOrbs'
import PasswordInput from '@/app/auth/PasswordInput'

export default function RegisterPage() {
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      const msg = error.message.toLowerCase()
      if (msg.includes('registered') || msg.includes('exists')) {
        setError('An account already exists for this email. Sign in or reset your password.')
      } else if (msg.includes('password')) {
        setError('Choose a stronger password (at least 8 characters).')
      } else if (msg.includes('rate')) {
        setError('Too many attempts. Try again in a few minutes.')
      } else {
        setError('Something went wrong. Please try again.')
      }
      setLoading(false)
      return
    }

    // If Supabase already has a session (email confirmation disabled), go to dashboard.
    if (data.session) {
      router.push('/dashboard')
      router.refresh()
      return
    }

    // Otherwise: show the verify-email confirmation screen.
    router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`)
  }

  return (
    <>
      <Nav />
      <main className="auth-page">
        <div className="auth-split">

          {/* Left pitch panel */}
          <div className="auth-pitch">
            <HeroOrbs />
            <div className="grid-bg" />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <span className="eyebrow">Free to join</span>
              <h1 style={{ marginTop: 20, fontSize: 'clamp(32px,3.8vw,52px)', lineHeight: 1.08 }}>
                Full transparency.<br />Zero cost.
              </h1>
              <p className="lede" style={{ marginTop: 20, maxWidth: '30ch', color: 'var(--ink-mute)' }}>
                Create a free account and follow every move Fynoy Capital makes — in real time.
              </p>
              <div className="auth-features" style={{ marginTop: 32 }}>
                {[
                  'Realtime open positions & returns',
                  'Full trade rationale per position',
                  'Performance vs VWCE benchmark',
                  'Closed trades with exact return',
                  'Sector allocation & risk view',
                ].map((f) => (
                  <div key={f} className="auth-feature">
                    <span className="auth-feature-dot" />
                    {f}
                  </div>
                ))}
              </div>
              <p style={{ marginTop: 32, fontSize: 13, color: 'var(--ink-dim)' }}>
                No fees. No commitments.
              </p>
            </div>
          </div>

          {/* Right form panel */}
          <div className="auth-form-side">
            <div className="auth-card">
              <h2 style={{ fontSize: 'clamp(22px,2.2vw,30px)', marginBottom: 6 }}>Create account</h2>
              <p style={{ fontSize: 14, color: 'var(--ink-mute)', marginBottom: 32 }}>
                Already a member?{' '}
                <Link href="/auth/login" style={{ color: 'var(--gold)' }}>
                  Sign in →
                </Link>
              </p>

              <form onSubmit={handleSubmit}>
                <div className="auth-input-group">
                  <label className="auth-label" htmlFor="fullName">Full name</label>
                  <input
                    id="fullName"
                    type="text"
                    autoComplete="name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="auth-input"
                    placeholder="Jane Doe"
                  />
                </div>
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
                <div className="auth-input-group">
                  <label className="auth-label" htmlFor="password">Password</label>
                  <PasswordInput
                    id="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={setPassword}
                    placeholder="Min. 8 characters"
                  />
                </div>

                {error && <p className="auth-error">{error}</p>}
                {message && <p className="auth-success">{message}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '14px 0', fontSize: 13 }}
                >
                  {loading ? 'Creating account…' : 'Create free account'}
                </button>

                <p style={{ marginTop: 16, fontSize: 12, color: 'var(--ink-dim)', lineHeight: 1.6 }}>
                  By creating an account you agree to our{' '}
                  <Link href="/legal#privacy" style={{ color: 'var(--ink-mute)' }}>privacy policy</Link>.
                </p>
              </form>
            </div>
          </div>

        </div>
      </main>
    </>
  )
}
