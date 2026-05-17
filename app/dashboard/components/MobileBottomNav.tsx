'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  IconHome, IconGrid, IconChart, IconBriefcase, IconSearch,
  IconUser, IconMessage, IconBalance, IconActivity, IconStar,
} from './Icons'

interface MobileBottomNavProps {
  variant: 'member' | 'admin'
}

const MEMBER_ITEMS = [
  { href: '/dashboard',            label: 'Home',      icon: IconHome,   exact: true },
  { href: '/dashboard/holdings',   label: 'Holdings',  icon: IconGrid },
  { href: '/dashboard/watchlist',  label: 'Watchlist', icon: IconStar },
  { href: '/dashboard/commentary', label: 'Insights',  icon: IconMessage },
  { href: '/dashboard/profile',    label: 'Me',        icon: IconUser },
]

const ADMIN_ITEMS = [
  { href: '/admin',           label: 'Overview',  icon: IconGrid,       exact: true },
  { href: '/admin/cases',     label: 'Cases',     icon: IconBriefcase },
  { href: '/admin/research',  label: 'Research',  icon: IconSearch },
  { href: '/admin/analytics', label: 'Analytics', icon: IconActivity },
  { href: '/admin/rebalancing', label: 'Rebal',   icon: IconBalance },
]

export default function MobileBottomNav({ variant }: MobileBottomNavProps) {
  const pathname = usePathname()
  const items = variant === 'admin' ? ADMIN_ITEMS : MEMBER_ITEMS

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav className="dash-bottom-nav" aria-label="Mobile navigation">
      <div className="dash-bottom-nav-inner">
        {items.map(item => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`dash-bottom-item${isActive(item.href, item.exact) ? ' is-active' : ''}`}
            >
              <Icon width={22} height={22} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
