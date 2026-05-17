'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  IconMenu, IconClose, IconHome, IconChart, IconGrid, IconClock, IconMessage,
  IconBell, IconUser, IconSettings, IconStar, IconHelp, IconLogout,
  IconBriefcase, IconSearch, IconBalance, IconUsers, IconActivity,
  IconBook, IconShield,
} from './Icons'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

interface MobileDrawerProps {
  variant: 'member' | 'admin'
  isAdmin: boolean
}

const MEMBER_PRIMARY: NavItem[] = [
  { href: '/dashboard',                 label: 'Dashboard',     icon: <IconHome /> },
  { href: '/dashboard/holdings',        label: 'Holdings',      icon: <IconGrid /> },
  { href: '/dashboard/history',         label: 'Trade History', icon: <IconClock /> },
  { href: '/dashboard/performance',     label: 'Performance',   icon: <IconChart /> },
  { href: '/dashboard/commentary',      label: 'Commentary',    icon: <IconMessage /> },
  { href: '/dashboard/favorites',       label: 'Favorites',     icon: <IconStar /> },
  { href: '/dashboard/watchlist',       label: 'Watchlist',     icon: <IconStar /> },
  { href: '/dashboard/insights',        label: 'Insights',      icon: <IconHelp /> },
]

const MEMBER_ACCOUNT: NavItem[] = [
  { href: '/dashboard/notifications',   label: 'Notifications', icon: <IconBell /> },
  { href: '/dashboard/profile',         label: 'Profile',       icon: <IconUser /> },
  { href: '/dashboard/settings',        label: 'Settings',      icon: <IconSettings /> },
]

const ADMIN_PRIMARY: NavItem[] = [
  { href: '/admin',                  label: 'Overview',       icon: <IconGrid /> },
  { href: '/admin/cases',            label: 'Cases',          icon: <IconBriefcase /> },
  { href: '/admin/research',         label: 'Research',       icon: <IconSearch /> },
  { href: '/admin/analytics',        label: 'Analytics',      icon: <IconActivity /> },
  { href: '/admin/rebalancing',      label: 'Rebalancing',    icon: <IconBalance /> },
  { href: '/admin/timeline',         label: 'Timeline',       icon: <IconClock /> },
  { href: '/admin/ai-commentary',    label: 'AI Commentary',  icon: <IconMessage /> },
  { href: '/admin/risk-free-rate',   label: 'Risk-free Rate', icon: <IconBalance /> },
  { href: '/admin/journal',          label: 'Journal',        icon: <IconBook /> },
  { href: '/admin/members',          label: 'Members',        icon: <IconUsers /> },
  { href: '/admin/audit',            label: 'Audit Log',      icon: <IconActivity /> },
  { href: '/admin/settings',         label: 'Settings',       icon: <IconSettings /> },
]

export default function MobileDrawer({ variant, isAdmin }: MobileDrawerProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (open) document.body.classList.add('dash-drawer-open')
    else document.body.classList.remove('dash-drawer-open')
    return () => document.body.classList.remove('dash-drawer-open')
  }, [open])

  useEffect(() => { setOpen(false) }, [pathname])

  function isActive(href: string) {
    if (href === '/dashboard' || href === '/admin') return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setOpen(false)
    router.push('/auth/login')
    router.refresh()
  }

  const primary = variant === 'admin' ? ADMIN_PRIMARY : MEMBER_PRIMARY

  return (
    <>
      <button
        type="button"
        className="dash-burger"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
      >
        <IconMenu width={20} height={20} />
      </button>

      <div
        className={`dash-drawer-backdrop${open ? ' is-open' : ''}`}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      />

      <aside className={`dash-drawer${open ? ' is-open' : ''}`} aria-hidden={!open}>
        <div className="dash-drawer-head">
          <span className="dash-drawer-brand">
            Fynoy <em>{variant === 'admin' ? 'Admin' : 'Capital'}</em>
          </span>
          <button
            type="button"
            className="dash-drawer-close"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <IconClose width={18} height={18} />
          </button>
        </div>

        <nav className="dash-drawer-nav">
          <div className="dash-drawer-section-label">
            {variant === 'admin' ? 'Admin' : 'Portfolio'}
          </div>
          {primary.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`dash-drawer-item${isActive(item.href) ? ' is-active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}

          {variant === 'member' && (
            <>
              <div className="dash-drawer-section-label">Account</div>
              {MEMBER_ACCOUNT.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`dash-drawer-item${isActive(item.href) ? ' is-active' : ''}`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
              {isAdmin && (
                <Link href="/admin" className="dash-drawer-item">
                  <IconShield />
                  <span>Admin Center</span>
                </Link>
              )}
            </>
          )}

          {variant === 'admin' && (
            <>
              <div className="dash-drawer-section-label">Member View</div>
              <Link href="/dashboard" className="dash-drawer-item">
                <IconHome />
                <span>Switch to Member</span>
              </Link>
            </>
          )}
        </nav>

        <div className="dash-drawer-foot">
          <button
            type="button"
            className="dash-drawer-item"
            onClick={handleSignOut}
            style={{ color: 'var(--dash-red)' }}
          >
            <IconLogout />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  )
}
