'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Nav from '@/app/components/Nav'
import HeroOrbs from '@/app/components/HeroOrbs'

const ERROR_MAP: Record<string, string> = {
  'Invalid login credentials': 'Onjuist e-mailadres of wachtwoord.',
  'Email not confirmed': 'Bevestig eerst je e-mailadres via de link in je inbox.',
  'Too many requests': 'Te veel pogingen. Probeer het over een paar minuten opnieuw.',
}

function mapError(message: string | undefined): string {
  if (!message) return 'Er is iets misgegaan. Probeer het opnieuw.'
  if (ERROR_MAP[message]) return ERROR_MAP[message]
  const lower = message.toLowerCase()
  if (lower.includes('rate')) return ERROR_MAP['Too many requests']
  if (lower.includes('not confirm')) return ERROR_MAP['Email not confirmed']
  if (lower.includes('invalid login') || lower.includes('invalid credentials')) return ERROR_MAP['Invalid login credentials']
  return 'Er is iets misgegaan. Probeer het opnieuw.'
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
        <div
          role="alert"
          style={{
            background: 'rgba(220,38,38,0.08)',
            border: '1px solid rgba(220,38,38,0.3)',
            borderRadius: 2,
            padding: '10px 14px',
            fontSize: 13,
            color: '#ef4444',
            marginBottom: 18,
          }}
        >
          {error}
        </div>
      )}

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
      <div className="auth-input-group">
        <label className="auth-label" htmlFor="password">Wachtwoord</label>
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
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
          <Link
            href="/auth/forgot-password"
            style={{ color: 'var(--gold)', fontSize: 12, letterSpacing: '0.02em' }}
          >
            Wachtwoord vergeten?
          </Link>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary"
        style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '14px 0', fontSize: 13 }}
      >
        {loading ? 'Inloggen…' : 'Inloggen'}
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
                Welkom<br />terug.
              </h1>
              <p className="lede" style={{ marginTop: 20, maxWidth: '30ch', color: 'var(--ink-mute)' }}>
                Toegang tot het live portfolio dashboard met elke positie, elk rendement en de redenering achter elke trade.
              </p>
              <div className="auth-features">
                {[
                  'Realtime open positions & rendementen',
                  'Volledige trade redenering bij elke positie',
                  'Performance vs VWCE benchmark',
                  'Alle gesloten trades met exact rendement',
                  'Sector allocatie & risico analyse',
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
              <h2 style={{ fontSize: 'clamp(22px,2.2vw,30px)', marginBottom: 6 }}>Inloggen</h2>
              <p style={{ fontSize: 14, color: 'var(--ink-mute)', marginBottom: 32 }}>
                Nog geen account?{' '}
                <Link href="/auth/register" style={{ color: 'var(--gold)' }}>
                  Maak er gratis een aan →
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
