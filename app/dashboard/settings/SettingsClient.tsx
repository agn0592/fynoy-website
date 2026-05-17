'use client'

import { useEffect, useRef, useState } from 'react'
import {
  IconSun, IconMoon, IconBell, IconShield, IconDownload,
  IconCheck, IconRefresh, IconAlertCircle,
} from '@/app/dashboard/components/Icons'

interface SettingsClientProps {
  displayName: string
  email: string
  role: string
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

interface NotifPrefs {
  positionClosed: boolean
  newCommentary: boolean
  syncAlerts: boolean
  weeklyDigest: boolean
}
const DEFAULT_NOTIF: NotifPrefs = {
  positionClosed: true,
  newCommentary: true,
  syncAlerts: false,
  weeklyDigest: false,
}

type Currency = 'EUR' | 'USD' | 'GBP'
type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY'
type TimeRange = '1M' | '3M' | '6M' | 'YTD' | '1Y' | 'All'

interface DisplayPrefs {
  currency: Currency
  dateFormat: DateFormat
  defaultRange: TimeRange
}
const DEFAULT_DISPLAY: DisplayPrefs = {
  currency: 'EUR',
  dateFormat: 'DD/MM/YYYY',
  defaultRange: 'YTD',
}

interface PrivacyPrefs {
  privacyMode: boolean
  publicProfile: boolean
}
const DEFAULT_PRIVACY: PrivacyPrefs = {
  privacyMode: false,
  publicProfile: false,
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Partial<T>
    return { ...fallback, ...parsed }
  } catch {
    return fallback
  }
}

export default function SettingsClient({ displayName, email, role }: SettingsClientProps) {
  const [light, setLight] = useState(false)
  const [color, setColor] = useState<AvatarColor>('gold')
  const [notif, setNotif] = useState<NotifPrefs>(DEFAULT_NOTIF)
  const [display, setDisplay] = useState<DisplayPrefs>(DEFAULT_DISPLAY)
  const [privacy, setPrivacy] = useState<PrivacyPrefs>(DEFAULT_PRIVACY)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [resetMessage, setResetMessage] = useState<string | null>(null)
  const fadeTimer = useRef<number | null>(null)

  useEffect(() => {
    const theme = window.localStorage.getItem('fynoy-theme')
    setLight(theme === 'light')

    const stored = window.localStorage.getItem('fynoy-avatar-color') as AvatarColor | null
    if (stored && AVATAR_COLORS.some(c => c.key === stored)) setColor(stored)

    setNotif(readJson<NotifPrefs>('fynoy-notif-prefs', DEFAULT_NOTIF))
    setDisplay(readJson<DisplayPrefs>('fynoy-display-prefs', DEFAULT_DISPLAY))
    setPrivacy(readJson<PrivacyPrefs>('fynoy-privacy-prefs', DEFAULT_PRIVACY))

    function onColor(e: Event) {
      const ce = e as CustomEvent<string>
      if (AVATAR_COLORS.some(c => c.key === ce.detail)) {
        setColor(ce.detail as AvatarColor)
      }
    }
    window.addEventListener('fynoy:avatar-color', onColor as EventListener)
    return () => window.removeEventListener('fynoy:avatar-color', onColor as EventListener)
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

  function toggleTheme() {
    const next = !light
    setLight(next)
    if (next) {
      document.documentElement.setAttribute('data-theme', 'light')
      window.localStorage.setItem('fynoy-theme', 'light')
    } else {
      document.documentElement.removeAttribute('data-theme')
      window.localStorage.setItem('fynoy-theme', 'dark')
    }
    flashSaved()
  }

  function chooseColor(next: AvatarColor) {
    setColor(next)
    window.localStorage.setItem('fynoy-avatar-color', next)
    window.dispatchEvent(new CustomEvent<string>('fynoy:avatar-color', { detail: next }))
    flashSaved()
  }

  function updateNotif(patch: Partial<NotifPrefs>) {
    const next = { ...notif, ...patch }
    setNotif(next)
    window.localStorage.setItem('fynoy-notif-prefs', JSON.stringify(next))
    flashSaved()
  }

  function updateDisplay(patch: Partial<DisplayPrefs>) {
    const next = { ...display, ...patch }
    setDisplay(next)
    window.localStorage.setItem('fynoy-display-prefs', JSON.stringify(next))
    flashSaved()
  }

  function updatePrivacy(patch: Partial<PrivacyPrefs>) {
    const next = { ...privacy, ...patch }
    setPrivacy(next)
    window.localStorage.setItem('fynoy-privacy-prefs', JSON.stringify(next))
    flashSaved()
  }

  function handleResetAll() {
    const ok = window.confirm(
      'Are you sure? All Fynoy preferences on this device will be cleared.',
    )
    if (!ok) return
    const keys: string[] = []
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i)
      if (k && k.startsWith('fynoy-')) keys.push(k)
    }
    for (const k of keys) window.localStorage.removeItem(k)
    document.documentElement.removeAttribute('data-theme')
    setLight(false)
    setColor('gold')
    setNotif(DEFAULT_NOTIF)
    setDisplay(DEFAULT_DISPLAY)
    setPrivacy(DEFAULT_PRIVACY)
    window.dispatchEvent(new CustomEvent<string>('fynoy:avatar-color', { detail: 'gold' }))
    setResetMessage('Preferences reset to defaults.')
    window.setTimeout(() => setResetMessage(null), 3500)
    flashSaved()
  }

  function handleExportCsv(e: React.MouseEvent) {
    e.preventDefault()
    const header = 'symbol,quantity,entry_price,current_price\n'
    const sample = '# Placeholder export — wire this up to /api/portfolio/export in the future.\n'
    const blob = new Blob([header + sample], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fynoy-portfolio-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const showSaved = savedAt !== null
  const savedIndicator = (
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
        marginLeft: 'auto',
      }}
    >
      <IconCheck width={12} height={12} /> Saved
    </span>
  )

  return (
    <>
      <section className="dash-form-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 className="dash-form-section-title">Appearance</h2>
          </div>
          {savedIndicator}
        </div>
        <p className="dash-form-section-sub">Thema en accentkleur voor dit apparaat.</p>

        <div className="dash-form-grid">
          <div className="dash-form-group span-2">
            <span className="dash-form-label">Thema</span>
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: 'var(--navy-3)',
                border: '1px solid var(--line)',
                borderRadius: 2, padding: '11px 13px',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--ink)' }}>
                {light ? <IconSun width={16} height={16} /> : <IconMoon width={16} height={16} />}
                <span style={{ fontSize: 14 }}>{light ? 'Light mode' : 'Dark mode'}</span>
              </span>
              <label className="dash-toggle" style={{ marginLeft: 'auto' }}>
                <input type="checkbox" checked={light} onChange={toggleTheme} aria-label="Toggle light mode" />
                <span className="dash-toggle-slider" />
              </label>
            </div>
            <div className="dash-form-hint">Switches instantly — saved as fynoy-theme.</div>
          </div>

          <div className="dash-form-group span-2">
            <span className="dash-form-label">Accent color</span>
            <div
              role="radiogroup"
              aria-label="Accent color"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(8, minmax(28px, 1fr))',
                gap: 8,
                padding: '6px 0',
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
                      width: 28, height: 28,
                      borderRadius: '50%',
                      background: c.swatch,
                      border: isActive ? '2px solid var(--gold)' : '2px solid transparent',
                      boxShadow: isActive ? '0 0 0 2px var(--navy-2)' : 'none',
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'transform 0.12s, border-color 0.12s',
                      transform: isActive ? 'scale(1.08)' : 'scale(1)',
                    }}
                  />
                )
              })}
            </div>
            <div className="dash-form-hint">Also used for your avatar across the app.</div>
          </div>
        </div>
      </section>

      <section className="dash-form-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 className="dash-form-section-title">
              <IconBell width={13} height={13} style={{ verticalAlign: '-2px', marginRight: 6 }} />
              Notifications
            </h2>
          </div>
          {savedIndicator}
        </div>
        <p className="dash-form-section-sub">Pick what you want to be notified about.</p>

        <div className="dash-form-grid">
          <ToggleRow
            label="Position closed"
            hint="Alert when a trade is closed."
            checked={notif.positionClosed}
            onChange={(v) => updateNotif({ positionClosed: v })}
          />
          <ToggleRow
            label="New commentary"
            hint="Notify me when a new portfolio update is published."
            checked={notif.newCommentary}
            onChange={(v) => updateNotif({ newCommentary: v })}
          />
          <ToggleRow
            label="Sync alerts"
            hint="Warn me when data goes stale."
            checked={notif.syncAlerts}
            onChange={(v) => updateNotif({ syncAlerts: v })}
          />
          <ToggleRow
            label="Weekly digest"
            hint="Weekly email summary."
            checked={notif.weeklyDigest}
            onChange={(v) => updateNotif({ weeklyDigest: v })}
          />
        </div>
      </section>

      <section className="dash-form-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 className="dash-form-section-title">Display</h2>
          </div>
          {savedIndicator}
        </div>
        <p className="dash-form-section-sub">How amounts, dates and default ranges are shown.</p>

        <div className="dash-form-grid">
          <div className="dash-form-group">
            <label className="dash-form-label" htmlFor="display-currency">Currency</label>
            <select
              id="display-currency"
              className="dash-select"
              value={display.currency}
              onChange={(e) => updateDisplay({ currency: e.target.value as Currency })}
            >
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>

          <div className="dash-form-group">
            <label className="dash-form-label" htmlFor="display-date">Date format</label>
            <select
              id="display-date"
              className="dash-select"
              value={display.dateFormat}
              onChange={(e) => updateDisplay({ dateFormat: e.target.value as DateFormat })}
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            </select>
          </div>

          <div className="dash-form-group">
            <label className="dash-form-label" htmlFor="display-range">Default time range</label>
            <select
              id="display-range"
              className="dash-select"
              value={display.defaultRange}
              onChange={(e) => updateDisplay({ defaultRange: e.target.value as TimeRange })}
            >
              <option value="1M">1M</option>
              <option value="3M">3M</option>
              <option value="6M">6M</option>
              <option value="YTD">YTD</option>
              <option value="1Y">1Y</option>
              <option value="All">All</option>
            </select>
            <div className="dash-form-hint">Used when opening the performance chart.</div>
          </div>
        </div>
      </section>

      <section className="dash-form-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 className="dash-form-section-title">
              <IconShield width={13} height={13} style={{ verticalAlign: '-2px', marginRight: 6 }} />
              Privacy
            </h2>
          </div>
          {savedIndicator}
        </div>
        <p className="dash-form-section-sub">Hide sensitive numbers in public environments.</p>

        <div className="dash-form-grid">
          <ToggleRow
            label="Privacy mode"
            hint="All amounts are replaced with •••."
            checked={privacy.privacyMode}
            onChange={(v) => updatePrivacy({ privacyMode: v })}
          />
          <ToggleRow
            label="Public profile"
            hint="Placeholder — coming later."
            checked={privacy.publicProfile}
            onChange={(v) => updatePrivacy({ publicProfile: v })}
            disabled
          />
        </div>

        <div
          style={{
            marginTop: 14,
            fontSize: 11,
            color: 'var(--ink-dim)',
            letterSpacing: '0.04em',
          }}
        >
          Session: <strong style={{ color: 'var(--ink-mute)' }}>{displayName}</strong>
          {email && <> · <span style={{ color: 'var(--ink-mute)' }}>{email}</span></>}
          <> · <span className={`status-badge ${role === 'admin' ? 'info' : 'active'}`}>{role}</span></>
        </div>
      </section>

      <section className="dash-form-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 className="dash-form-section-title">Data &amp; Export</h2>
          </div>
        </div>
        <p className="dash-form-section-sub">Download your portfolio data or reset all your preferences.</p>

        {resetMessage && (
          <div className="dash-alert" style={{ marginBottom: 14 }} role="status">
            <div className="dash-alert-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconAlertCircle width={12} height={12} /> Reset complete
            </div>
            <div className="dash-alert-body">{resetMessage}</div>
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <a
            href="#"
            className="dash-btn btn-outline"
            onClick={handleExportCsv}
          >
            <IconDownload width={14} height={14} /> Export as CSV
          </a>
          <button
            type="button"
            className="dash-btn btn-danger"
            onClick={handleResetAll}
          >
            <IconRefresh width={14} height={14} /> Reset preferences
          </button>
        </div>
      </section>
    </>
  )
}

interface ToggleRowProps {
  label: string
  hint?: string
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}

function ToggleRow({ label, hint, checked, onChange, disabled }: ToggleRowProps) {
  return (
    <div className="dash-form-group">
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'var(--navy-3)',
          border: '1px solid var(--line)',
          borderRadius: 2, padding: '11px 13px',
          opacity: disabled ? 0.55 : 1,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: 'var(--ink)' }}>{label}</div>
          {hint && <div className="dash-form-hint" style={{ marginTop: 2 }}>{hint}</div>}
        </div>
        <label className="dash-toggle">
          <input
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={(e) => onChange(e.target.checked)}
            aria-label={label}
          />
          <span className="dash-toggle-slider" />
        </label>
      </div>
    </div>
  )
}
