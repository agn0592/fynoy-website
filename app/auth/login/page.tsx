'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Nav from '@/app/components/Nav'
import HeroOrbs from '@/app/components/HeroOrbs'
import PasswordInput from '@/app/auth/PasswordInput'

const ERROR_MAP: Record<string, string> = {
  'Invalid login credentials': 'Incorrect email or password.',
  'Email not confirmed': 'Please confirm your email address using the link in your inbox first.',
  'Too many requests': 'Too many attempts. Try again in a few minutes.',
}

function mapError(message: string | undefined): string {
  if (!message) return 'Something went wrong. Please try again.'
  if (ERROR_MAP[message]) return ERROR_MAP[message]
  const lower = message.toLowerCase()
  if (lower.includes('rate')) return ERROR_MAP['Too many requests']
  if (lower.includes('not confirm')) return ERROR_MAP['Email not confirmed']
  if (lower.includes('invalid login') || lower.includes('invalid credentials')) return ERROR_MAP['Invalid login credentials']
  return 'Something went wrong. Please try again.'
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(mapError(error.message))
      setLoading(false)
      return
    }

    const next = searchParams.get('next')
    if (next) {
      router.push(next)
      router.refresh()
      return
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', authData.user.id)
      .single()

    router.push(profile?.role === 'admin' ? '/admin' : '/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div role="alert" className="auth-error" style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}

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
          autoComplete="current-password"
          required
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
          <Link
            href="/auth/forgot-password"
            style={{ color: 'var(--gold)', fontSize: 12, letterSpacing: '0.02em' }}
          >
            Forgot password?
          </Link>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary"
        style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '14px 0', fontSize: 13 }}
      >
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}

export default function LoginPage() {
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
              <span className="eyebrow">Member portal</span>
              <h1 style={{ marginTop: 20, fontSize: 'clamp(32px,3.8vw,52px)', lineHeight: 1.08 }}>
                Welcome<br />back.
              </h1>
              <p className="lede" style={{ marginTop: 20, maxWidth: '30ch', color: 'var(--ink-mute)' }}>
                Access the live portfolio dashboard with every position, every return, and the rationale behind every trade.
              </p>
              <div className="auth-features">
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
            </div>
          </div>

          {/* Right form panel */}
          <div className="auth-form-side">
            <div className="auth-card">
              <h2 style={{ fontSize: 'clamp(22px,2.2vw,30px)', marginBottom: 6 }}>Sign in</h2>
              <p style={{ fontSize: 14, color: 'var(--ink-mute)', marginBottom: 32 }}>
                No account?{' '}
                <Link href="/auth/register" style={{ color: 'var(--gold)' }}>
                  Create one — it&apos;s free →
                </Link>
              </p>

              <Suspense fallback={null}>
                <LoginForm />
              </Suspense>
            </div>
          </div>

        </div>
      </main>
    </>
  )
}
