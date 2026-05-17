'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  IconUser, IconMail, IconLock, IconGlobe, IconCheck,
  IconAlertCircle, IconLogout, IconEdit,
} from '@/app/dashboard/components/Icons'

interface ProfileFormProps {
  userId: string
  initialFullName: string
  email: string
  role: string
  createdAt: string | null
  initial: string
}

type AvatarColor = 'gold' | 'blue' | 'green' | 'purple' | 'pink' | 'orange' | 'teal' | 'red'

const AVATAR_COLORS: { key: AvatarColor; label: string; swatch: string }[] = [
  { key: 'gold',   label: 'Gold',   swatch: 'linear-gradient(135deg, #c9a96e 0%, #7a5f2e 100%)' },
  { key: 'blue',   label: 'Blue',   swatch: 'linear-gradient(135deg, #60a5fa 0%, #1e3a8a 100%)' },
  { key: 'green',  label: 'Green',  swatch: 'linear-gradient(135deg, #4ade80 0%, #14532d 100%)' },
  { key: 'purple', label: 'Purple', swatch: 'linear-gradient(135deg, #a78bfa 0%, #4c1d95 100%)' },
  { key: 'pink',   label: 'Pink',   swatch: 'linear-gradient(135deg, #f472b6 0%, #831843 100%)' },
  { key: 'orange', label: 'Orange', swatch: 'linear-gradient(135deg, #fb923c 0%, #7c2d12 100%)' },
  { key: 'teal',   label: 'Teal',   swatch: 'linear-gradient(135deg, #2dd4bf 0%, #134e4a 100%)' },
  { key: 'red',    label: 'Red',    swatch: 'linear-gradient(135deg, #f87171 0%, #7f1d1d 100%)' },
]

interface ExtraProfile {
  bio: string
  location: string
  website: string
}

const EMPTY_EXTRA: ExtraProfile = { bio: '', location: '', website: '' }

function readExtra(): ExtraProfile {
  if (typeof window === 'undefined') return EMPTY_EXTRA
  try {
    const raw = window.localStorage.getItem('fynoy-profile-extra')
    if (!raw) return EMPTY_EXTRA
    const parsed = JSON.parse(raw) as Partial<ExtraProfile>
    return {
      bio: parsed.bio ?? '',
      location: parsed.location ?? '',
      website: parsed.website ?? '',
    }
  } catch {
    return EMPTY_EXTRA
  }
}

function formatMemberSince(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  } catch {
    return iso
  }
}

export default function ProfileForm({
  userId, initialFullName, email, role, createdAt, initial,
}: ProfileFormProps) {
  const router = useRouter()
  const [fullName, setFullName] = useState(initialFullName)
  const [savedFullName, setSavedFullName] = useState(initialFullName)
  const [extra, setExtra] = useState<ExtraProfile>(EMPTY_EXTRA)
  const [color, setColor] = useState<AvatarColor>('gold')
  const [saving, setSaving] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const fadeTimer = useRef<number | null>(null)

  useEffect(() => {
    setExtra(readExtra())
    const stored = window.localStorage.getItem('fynoy-avatar-color') as AvatarColor | null
    if (stored && AVATAR_COLORS.some(c => c.key === stored)) setColor(stored)
  }, [])

  useEffect(() => {
    return () => {
      if (fadeTimer.current) window.clearTimeout(fadeTimer.current)
    }
  }, [])

  function flashSaved() {
    setSavedAt(Date.now())
    if (fadeTimer.current) window.clearTimeout(fadeTimer.current)
    fadeTimer.current = window.setTimeout(() => setSavedAt(null), 1500)
  }

  function chooseColor(next: AvatarColor) {
    setColor(next)
    window.localStorage.setItem('fynoy-avatar-color', next)
    window.dispatchEvent(new CustomEvent<string>('fynoy:avatar-color', { detail: next }))
    flashSaved()
  }

  function updateExtra(patch: Partial<ExtraProfile>) {
    const next = { ...extra, ...patch }
    setExtra(next)
    window.localStorage.setItem('fynoy-profile-extra', JSON.stringify(next))
    flashSaved()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const trimmed = fullName.trim()
    if (!trimmed) {
      setError('Voer een geldige naam in.')
      return
    }
    if (!userId) {
      setError('Geen actieve sessie gevonden. Log opnieuw in.')
      return
    }
    setSaving(true)
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('users')
        .update({ full_name: trimmed })
        .eq('id', userId)
      if (updateError) throw updateError
      setSavedFullName(trimmed)
      flashSaved()
      router.refresh()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Het opslaan is mislukt.'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    setSigningOut(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/auth/login')
      router.refresh()
    } catch {
      setSigningOut(false)
    }
  }

  const dirty = fullName.trim() !== savedFullName.trim()
  const avatarClass = `dash-avatar avatar-xl${color !== 'gold' ? ` avatar-${color}` : ''}`
  const showSaved = savedAt !== null
  const memberSince = formatMemberSince(createdAt)

  return (
    <>
      {error && (
        <div className="dash-alert alert-error" style={{ marginBottom: 16 }} role="alert">
          <div className="dash-alert-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconAlertCircle width={12} height={12} /> Er ging iets mis
          </div>
          <div className="dash-alert-body">{error}</div>
        </div>
      )}

      <section
        className="dash-form-section"
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
      >
        <div className={avatarClass} aria-hidden="true">{initial}</div>

        <h2 className="dash-form-section-title" style={{ marginTop: 18, marginBottom: 2 }}>
          {savedFullName || email.split('@')[0] || 'Member'}
        </h2>
        <div className="dash-form-section-sub" style={{ borderBottom: 0, marginBottom: 4, paddingBottom: 0 }}>
          {email}
        </div>

        <div style={{ marginTop: 18, width: '100%', maxWidth: 360 }}>
          <div className="dash-form-label" style={{ marginBottom: 10 }}>Avatar color</div>
          <div
            role="radiogroup"
            aria-label="Avatar color"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(8, 1fr)',
              gap: 8,
              justifyItems: 'center',
            }}
          >
            {AVATAR_COLORS.map(c => {
              const isActive = c.key === color
              return (
                <button
                  key={c.key}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  aria-label={c.label}
                  onClick={() => chooseColor(c.key)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: c.swatch,
                    border: isActive ? '2px solid var(--gold)' : '2px solid transparent',
                    boxShadow: isActive ? '0 0 0 2px var(--navy-2)' : 'none',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'transform 0.12s, border-color 0.12s',
                    transform: isActive ? 'scale(1.06)' : 'scale(1)',
                  }}
                />
              )
            })}
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit}>
        <section className="dash-form-section">
          <h2 className="dash-form-section-title">Identity</h2>
          <p className="dash-form-section-sub">Hoe wij je naam tonen in commentaar, signalen en notificaties.</p>

          <div className="dash-form-grid">
            <div className="dash-form-group span-2">
              <label className="dash-form-label" htmlFor="profile-full-name">
                <IconUser width={11} height={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
                Volledige naam <span className="req">*</span>
              </label>
              <input
                id="profile-full-name"
                className="dash-input"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jouw volledige naam"
                required
              />
              <div className="dash-form-hint">Wordt opgeslagen in jouw Fynoy-profiel.</div>
            </div>

            <div className="dash-form-group span-2">
              <label className="dash-form-label" htmlFor="profile-email">
                <IconMail width={11} height={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
                E-mailadres
              </label>
              <input
                id="profile-email"
                className="dash-input"
                type="email"
                value={email}
                disabled
                readOnly
                style={{ opacity: 0.7, cursor: 'not-allowed' }}
              />
              <div className="dash-form-hint">
                E-mail wijzigen kan alleen via Supabase Auth. Neem contact op met support.
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
              gap: 12, marginTop: 18, flexWrap: 'wrap',
            }}
          >
            <span
              aria-live="polite"
              style={{
                fontSize: 11,
                color: 'var(--dash-green)',
                letterSpacing: '0.06em',
                opacity: showSaved ? 1 : 0,
                transition: 'opacity 0.3s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <IconCheck width={12} height={12} /> Saved
            </span>
            <button
              type="submit"
              className="dash-btn btn-gold"
              disabled={saving || !dirty}
            >
              {saving ? 'Opslaan…' : 'Opslaan'}
            </button>
          </div>
        </section>
      </form>

      <section className="dash-form-section">
        <h2 className="dash-form-section-title">About</h2>
        <p className="dash-form-section-sub">
          Optionele profielinformatie. Lokaal opgeslagen op dit apparaat.
        </p>

        <div className="dash-form-grid">
          <div className="dash-form-group span-all">
            <label className="dash-form-label" htmlFor="profile-bio">
              <IconEdit width={11} height={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              Korte bio
            </label>
            <textarea
              id="profile-bio"
              className="dash-textarea"
              value={extra.bio}
              onChange={(e) => updateExtra({ bio: e.target.value })}
              placeholder="Een paar regels over jezelf — sector, ervaring, focus."
              maxLength={400}
              rows={3}
            />
            <div className="dash-form-hint">{extra.bio.length}/400 tekens</div>
          </div>

          <div className="dash-form-group">
            <label className="dash-form-label" htmlFor="profile-location">Locatie</label>
            <input
              id="profile-location"
              className="dash-input"
              type="text"
              value={extra.location}
              onChange={(e) => updateExtra({ location: e.target.value })}
              placeholder="Amsterdam, NL"
              maxLength={120}
            />
          </div>

          <div className="dash-form-group">
            <label className="dash-form-label" htmlFor="profile-website">
              <IconGlobe width={11} height={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              Website
            </label>
            <input
              id="profile-website"
              className="dash-input"
              type="url"
              value={extra.website}
              onChange={(e) => updateExtra({ website: e.target.value })}
              placeholder="https://example.com"
              maxLength={200}
            />
          </div>
        </div>
      </section>

      <section className="dash-form-section">
        <h2 className="dash-form-section-title">Account</h2>
        <p className="dash-form-section-sub">Account-details, beveiliging en sessie.</p>

        <div className="dash-form-grid">
          <div className="dash-form-group">
            <span className="dash-form-label">Member since</span>
            <div style={{ fontSize: 14, color: 'var(--ink)', fontFamily: 'var(--serif)' }}>
              {memberSince}
            </div>
          </div>

          <div className="dash-form-group">
            <span className="dash-form-label">E-mail</span>
            <div style={{ fontSize: 14, color: 'var(--ink)', wordBreak: 'break-all' }}>
              {email || '—'}
            </div>
          </div>

          <div className="dash-form-group">
            <span className="dash-form-label">Rol</span>
            <div>
              <span className={`status-badge ${role === 'admin' ? 'info' : 'active'}`}>
                {role}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
          <Link href="/auth/forgot-password?from=profile" className="dash-btn btn-outline">
            <IconLock width={14} height={14} /> Wachtwoord wijzigen
          </Link>
        </div>
      </section>

      <section className="dash-form-section">
        <h2 className="dash-form-section-title">Sessie</h2>
        <p className="dash-form-section-sub">Log uit op dit apparaat.</p>

        <button
          type="button"
          className="dash-btn btn-danger"
          onClick={handleSignOut}
          disabled={signingOut}
        >
          <IconLogout width={14} height={14} />
          {signingOut ? 'Uitloggen…' : 'Uitloggen'}
        </button>
      </section>
    </>
  )
}
