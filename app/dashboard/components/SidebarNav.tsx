'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  IconHome, IconGrid, IconClock, IconChart, IconMessage,
  IconStar, IconHelp, IconBalance,
} from './Icons'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  exact?: boolean
  /** Optional hash on /dashboard to scroll to */
  scrollTo?: string
}

const NAV: NavItem[] = [
  { href: '/dashboard',             label: 'Dashboard',            exact: true, icon: <IconHome /> },
  { href: '/dashboard/holdings',    label: 'Holdings',             icon: <IconGrid /> },
  { href: '/dashboard/performance', label: 'Performance',          icon: <IconChart /> },
  { href: '/dashboard',             label: 'Risk-adjusted Return', icon: <IconBalance />, scrollTo: 'risk-adjusted' },
  { href: '/dashboard/history',     label: 'Trade History',        icon: <IconClock /> },
  { href: '/dashboard/commentary',  label: 'Commentary',           icon: <IconMessage /> },
  { href: '/dashboard/favorites',   label: 'Favorites',            icon: <IconStar /> },
  { href: '/dashboard/watchlist',   label: 'Watchlist',            icon: <IconStar /> },
  { href: '/dashboard/insights',    label: 'Insights',             icon: <IconHelp /> },
]

export default function SidebarNav() {
  const pathname = usePathname()
  const router = useRouter()

  function isActive(item: NavItem) {
    if (item.scrollTo) return false
    if (item.exact) return pathname === item.href
    return pathname === item.href || pathname.startsWith(item.href + '/')
  }

  function handleScroll(e: React.MouseEvent, item: NavItem) {
    if (!item.scrollTo) return
    e.preventDefault()
    const target = document.getElementById(item.scrollTo)
    if (target && (pathname === '/dashboard' || pathname?.startsWith('/dashboard'))) {
      // Already on a /dashboard route — try to scroll if the element exists here,
      // otherwise navigate to /dashboard#hash.
      if (pathname === '/dashboard') {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        history.replaceState(null, '', `/dashboard#${item.scrollTo}`)
        return
      }
    }
    // Navigate, then scroll
    router.push(`/dashboard#${item.scrollTo}`)
  }

  return (
    <>
      {NAV.map((item, i) => {
        const key = `${item.href}-${item.scrollTo ?? ''}-${i}`
        const active = isActive(item)
        const className = `dash-sb-item${active ? ' is-active' : ''}`
        if (item.scrollTo) {
          return (
            <a
              key={key}
              href={`/dashboard#${item.scrollTo}`}
              onClick={(e) => handleScroll(e, item)}
              className={className}
              title={item.label}
              aria-label={item.label}
            >
              {item.icon}
              <span className="dash-sb-tooltip">{item.label}</span>
            </a>
          )
        }
        return (
          <Link
            key={key}
            href={item.href}
            className={className}
            title={item.label}
            aria-label={item.label}
          >
            {item.icon}
            <span className="dash-sb-tooltip">{item.label}</span>
          </Link>
        )
      })}
    </>
  )
}
