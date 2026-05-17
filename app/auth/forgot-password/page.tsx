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
        setError('We konden geen account vinden bij dit e-mailadres.')
      } else if (msg.includes('rate')) {
        setError('Te veel pogingen. Probeer het over een paar minuten opnieuw.')
      } else {
        setError('Er is iets misgegaan. Probeer het opnieuw.')
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
              <span className="eyebrow">Wachtwoord vergeten</span>
              <h1 style={{ marginTop: 20, fontSize: 'clamp(32px,3.8vw,52px)', lineHeight: 1.08 }}>
                Geen zorgen.<br />Even resetten.
              </h1>
              <p className="lede" style={{ marginTop: 20, maxWidth: '30ch', color: 'var(--ink-mute)' }}>
                Vul je e-mailadres in en we sturen je een link om een nieuw wachtwoord in te stellen.
              </p>
            </div>
          </div>

          <div className="auth-form-side">
            <div className="auth-card">
              <h2 style={{ fontSize: 'clamp(22px,2.2vw,30px)', marginBottom: 6 }}>Wachtwoord resetten</h2>
              <p style={{ fontSize: 14, color: 'var(--ink-mute)', marginBottom: 32 }}>
                We sturen je een veilige link per mail.
              </p>

              {sent ? (
                <div className="auth-success">
                  Check je inbox — we hebben een reset-link gestuurd naar <b>{email}</b>.
                  De link is een uur geldig.
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
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

                  {error && <p className="auth-error">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '14px 0', fontSize: 13 }}
                  >
                    {loading ? 'Versturen…' : 'Verstuur reset-link'}
                  </button>
                </form>
              )}

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
