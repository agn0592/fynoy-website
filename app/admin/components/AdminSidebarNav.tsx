'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  IconGrid, IconBriefcase, IconSearch, IconBalance, IconClock,
  IconMessage, IconUsers, IconActivity, IconBook, IconSettings,
} from '@/app/dashboard/components/Icons'

const NAV = [
  { href: '/admin',               label: 'Overview',      icon: <IconGrid />,       exact: true },
  { href: '/admin/cases',         label: 'Cases',         icon: <IconBriefcase /> },
  { href: '/admin/research',      label: 'Research',      icon: <IconSearch /> },
  { href: '/admin/analytics',     label: 'Analytics',     icon: <IconActivity /> },
  { href: '/admin/rebalancing',   label: 'Rebalancing',   icon: <IconBalance /> },
  { href: '/admin/timeline',      label: 'Timeline',      icon: <IconClock /> },
  { href: '/admin/ai-commentary', label: 'AI Commentary', icon: <IconMessage /> },
  { href: '/admin/journal',       label: 'Journal',       icon: <IconBook /> },
  { href: '/admin/members',       label: 'Members',       icon: <IconUsers /> },
  { href: '/admin/settings',      label: 'Settings',      icon: <IconSettings /> },
]

export default function AdminSidebarNav() {
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
