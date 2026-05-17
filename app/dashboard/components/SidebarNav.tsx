'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  IconHome, IconGrid, IconClock, IconChart, IconMessage,
  IconStar, IconHelp, IconBalance,
} from './Icons'

const NAV = [
  { href: '/dashboard',                                 label: 'Dashboard',            exact: true, icon: <IconHome /> },
  { href: '/dashboard/holdings',                        label: 'Holdings',             icon: <IconGrid /> },
  { href: '/dashboard/performance',                     label: 'Performance',          icon: <IconChart /> },
  { href: '/dashboard#risk-adjusted',                   label: 'Risk-adjusted Return', icon: <IconBalance /> },
  { href: '/dashboard/history',                         label: 'Trade History',        icon: <IconClock /> },
  { href: '/dashboard/commentary',                      label: 'Commentary',           icon: <IconMessage /> },
  { href: '/dashboard/watchlist',                       label: 'Watchlist',            icon: <IconStar /> },
  { href: '/dashboard/insights',                        label: 'Insights',             icon: <IconHelp /> },
]

export default function SidebarNav() {
  const pathname = usePathname()

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <>
      {NAV.map(item => (
        <Link
          key={item.href}
          href={item.href}
          className={`dash-sb-item${isActive(item.href, item.exact) ? ' is-active' : ''}`}
          title={item.label}
          aria-label={item.label}
        >
          {item.icon}
          <span className="dash-sb-tooltip">{item.label}</span>
        </Link>
      ))}
    </>
  )
}
