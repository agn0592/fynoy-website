'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  IconUser, IconSettings, IconSun, IconMoon, IconLogout,
  IconChevronDown, IconBell, IconShield, IconHelp,
} from './Icons'

interface ProfileMenuProps {
  displayName: string
  email: string
  initial: string
  isAdmin: boolean
  avatarColor?: string | null
}

export default function ProfileMenu({
  displayName, email, initial, isAdmin, avatarColor,
}: ProfileMenuProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [light, setLight] = useState(false)
  const [localColor, setLocalColor] = useState<string | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem('fynoy-theme')
    if (stored === 'light') {
      setLight(true)
      document.documentElement.setAttribute('data-theme', 'light')
    }
    const c = localStorage.getItem('fynoy-avatar-color')
    if (c) setLocalColor(c)

    function onColorChange(e: Event) {
      const ce = e as CustomEvent<string>
      setLocalColor(ce.detail)
    }
    window.addEventListener('fynoy:avatar-color', onColorChange as EventListener)
    return () => window.removeEventListener('fynoy:avatar-color', onColorChange as EventListener)
  }, [])

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent | TouchEvent) {
      const target = e.target as Node
      if (wrapRef.current && !wrapRef.current.contains(target)) {
        setOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown, { passive: true })
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function toggleTheme() {
    const next = !light
    setLight(next)
    if (next) {
      document.documentElement.setAttribute('data-theme', 'light')
      localStorage.setItem('fynoy-theme', 'light')
    } else {
      document.documentElement.removeAttribute('data-theme')
      localStorage.setItem('fynoy-theme', 'dark')
    }
  }

  async function handleSignOut() {
    setOpen(false)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const effectiveColor = localColor ?? avatarColor ?? null
  const avatarClass = `dash-avatar${effectiveColor && effectiveColor !== 'gold' ? ` avatar-${effectiveColor}` : ''}`

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className={`dash-profile-trigger${open ? ' is-open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open profile menu"
      >
        <div className={avatarClass}>{initial}</div>
        <span className="dash-profile-name">{displayName}</span>
        <span className="dash-profile-chevron"><IconChevronDown /></span>
      </button>

      {open && (
        <div className="dash-menu" role="menu">
          <div className="dash-menu-head">
            <div className={`${avatarClass} avatar-lg`} style={{ width: 44, height: 44, fontSize: 18 }}>
              {initial}
            </div>
            <div className="dash-menu-head-info">
              <h4 className="dash-menu-head-name">{displayName}</h4>
              <p className="dash-menu-head-email">{email}</p>
              {isAdmin && (
                <span className="status-badge" style={{ marginTop: 6, fontSize: 9 }}>
                  <IconShield width={10} height={10} /> Admin
                </span>
              )}
            </div>
          </div>

          <div className="dash-menu-section">
            <Link href="/dashboard/profile" className="dash-menu-item" role="menuitem" onClick={() => setOpen(false)}>
              <IconUser width={16} height={16} />
              <span>Profile</span>
            </Link>
            <Link href="/dashboard/settings" className="dash-menu-item" role="menuitem" onClick={() => setOpen(false)}>
              <IconSettings width={16} height={16} />
              <span>Settings</span>
            </Link>
            <Link href="/dashboard/notifications" className="dash-menu-item" role="menuitem" onClick={() => setOpen(false)}>
              <IconBell width={16} height={16} />
              <span>Notifications</span>
            </Link>
          </div>

          <div className="dash-menu-section">
            <button type="button" className="dash-menu-item" role="menuitem" onClick={toggleTheme}>
              {light ? <IconMoon width={16} height={16} /> : <IconSun width={16} height={16} />}
              <span>{light ? 'Dark mode' : 'Light mode'}</span>
              <span className="dash-menu-meta">{light ? 'LIGHT' : 'DARK'}</span>
            </button>
            <Link href="/dashboard/insights" className="dash-menu-item" role="menuitem" onClick={() => setOpen(false)}>
              <IconHelp width={16} height={16} />
              <span>Insights & Help</span>
            </Link>
          </div>

          {isAdmin && (
            <div className="dash-menu-section">
              <Link href="/admin" className="dash-menu-item" role="menuitem" onClick={() => setOpen(false)}>
                <IconShield width={16} height={16} />
                <span>Admin Command Center</span>
              </Link>
            </div>
          )}

          <div className="dash-menu-section">
            <button type="button" className="dash-menu-item is-danger" role="menuitem" onClick={handleSignOut}>
              <IconLogout width={16} height={16} />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
