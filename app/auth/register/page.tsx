'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Nav from '@/app/components/Nav'
import HeroOrbs from '@/app/components/HeroOrbs'

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
        setError('Er bestaat al een account met dit e-mailadres. Log in of reset je wachtwoord.')
      } else if (msg.includes('password')) {
        setError('Kies een sterker wachtwoord (minimaal 8 tekens).')
      } else if (msg.includes('rate')) {
        setError('Te veel pogingen. Probeer het over een paar minuten opnieuw.')
      } else {
        setError('Er is iets misgegaan. Probeer het opnieuw.')
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
              <span className="eyebrow">Gratis lidmaatschap</span>
              <h1 style={{ marginTop: 20, fontSize: 'clamp(32px,3.8vw,52px)', lineHeight: 1.08 }}>
                Volledige transparantie.<br />Zonder kosten.
              </h1>
              <p className="lede" style={{ marginTop: 20, maxWidth: '30ch', color: 'var(--ink-mute)' }}>
                Maak een gratis account aan en volg elke trade die Fynoy Capital maakt — in realtime.
              </p>
              <div className="auth-features" style={{ marginTop: 32 }}>
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
              <p style={{ marginTop: 32, fontSize: 13, color: 'var(--ink-dim)' }}>
                Geen kosten. Geen verplichtingen.
              </p>
            </div>
          </div>

          {/* Right form panel */}
          <div className="auth-form-side">
            <div className="auth-card">
              <h2 style={{ fontSize: 'clamp(22px,2.2vw,30px)', marginBottom: 6 }}>Account aanmaken</h2>
              <p style={{ fontSize: 14, color: 'var(--ink-mute)', marginBottom: 32 }}>
                Al lid?{' '}
                <Link href="/auth/login" style={{ color: 'var(--gold)' }}>
                  Log in →
                </Link>
              </p>

              <form onSubmit={handleSubmit}>
                <div className="auth-input-group">
                  <label className="auth-label" htmlFor="fullName">Volledige naam</label>
                  <input
                    id="fullName"
                    type="text"
                    autoComplete="name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="auth-input"
                    placeholder="Jan de Vries"
                  />
                </div>
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
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="auth-input"
                    placeholder="Min. 8 tekens"
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
                  {loading ? 'Aanmaken…' : 'Maak gratis account'}
                </button>

                <p style={{ marginTop: 16, fontSize: 12, color: 'var(--ink-dim)', lineHeight: 1.6 }}>
                  Door een account aan te maken ga je akkoord met onze{' '}
                  <Link href="/legal?tab=privacy" style={{ color: 'var(--ink-mute)' }}>privacy policy</Link>.
                </p>
              </form>
            </div>
          </div>

        </div>
      </main>
    </>
  )
}
