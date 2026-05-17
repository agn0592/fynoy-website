'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Nav from '@/app/components/Nav'
import HeroOrbs from '@/app/components/HeroOrbs'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  // Supabase puts a recovery session in the URL; ensure we have a session.
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        setError('This reset link is no longer valid. Request a new one.')
      }
      setReady(true)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setError(error.message || 'Something went wrong. Please try again.')
      return
    }

    router.push('/dashboard')
    router.refresh()
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
              <span className="eyebrow">New password</span>
              <h1 style={{ marginTop: 20, fontSize: 'clamp(32px,3.8vw,52px)', lineHeight: 1.08 }}>
                Set a<br />new password.
              </h1>
              <p className="lede" style={{ marginTop: 20, maxWidth: '30ch', color: 'var(--ink-mute)' }}>
                Choose a password of at least 8 characters. We&apos;ll sign you in right after.
              </p>
            </div>
          </div>

          <div className="auth-form-side">
            <div className="auth-card">
              <h2 style={{ fontSize: 'clamp(22px,2.2vw,30px)', marginBottom: 6 }}>New password</h2>
              <p style={{ fontSize: 14, color: 'var(--ink-mute)', marginBottom: 32 }}>
                At least 8 characters.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="auth-input-group">
                  <label className="auth-label" htmlFor="password">New password</label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="auth-input"
                    placeholder="Min. 8 characters"
                  />
                </div>
                <div className="auth-input-group">
                  <label className="auth-label" htmlFor="confirm">Confirm password</label>
                  <input
                    id="confirm"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="auth-input"
                    placeholder="Repeat your new password"
                  />
                </div>

                {error && <p className="auth-error">{error}</p>}

                <button
                  type="submit"
                  disabled={loading || !ready}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '14px 0', fontSize: 13 }}
                >
                  {loading ? 'Saving…' : 'Save new password'}
                </button>
              </form>

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
