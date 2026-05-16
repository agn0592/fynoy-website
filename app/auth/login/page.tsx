'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Nav from '@/app/components/Nav'
import HeroOrbs from '@/app/components/HeroOrbs'

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
      setError(error.message)
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
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="auth-input"
          placeholder="••••••••"
        />
      </div>

      {error && <p className="auth-error">{error}</p>}

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
                Access the live portfolio dashboard, weekly research reports, and the full trade history.
              </p>
              <div className="auth-features">
                {[
                  'Live open positions & P&L',
                  'Every closed trade with exact returns',
                  'Weekly research reports',
                  'Thursday pitch session access',
                  'Performance vs benchmark',
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
