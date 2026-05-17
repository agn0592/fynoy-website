'use client'

import { useMemo, useRef, useState, useEffect } from 'react'
import {
  IconUsers, IconUser, IconShield, IconSearch, IconMail,
} from '@/app/dashboard/components/Icons'

interface MemberRow {
  id: string
  email: string | null
  full_name: string | null
  role: string | null
  created_at: string | null
  last_seen_at?: string | null
}

interface KpiBundle {
  totalMembers: number
  adminCount: number
  joinedThisMonth: number
  activeLast7: number | null
}

interface MembersClientProps {
  members: MemberRow[]
  kpis: KpiBundle
}

const AVATAR_COLORS = ['gold', 'blue', 'green', 'purple', 'pink', 'orange', 'teal', 'red'] as const

function avatarColorClass(id: string): string {
  let sum = 0
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i)
  const idx = sum % AVATAR_COLORS.length
  return `avatar-${AVATAR_COLORS[idx]}`
}

function initialOf(name: string | null, email: string | null): string {
  const src = (name || email || '?').trim()
  return src.charAt(0).toUpperCase()
}

function formatJoined(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

type Filter = 'all' | 'member' | 'admin' | 'month'

export default function MembersClient({ members, kpis }: MembersClientProps) {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  // close action menu when clicking outside
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!menuOpen) return
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [menuOpen])

  const monthStartMs = useMemo(() => {
    const d = new Date()
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
    return d.getTime()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return members.filter((m) => {
      // role/time filter
      if (filter === 'admin' && m.role !== 'admin') return false
      if (filter === 'member' && m.role === 'admin') return false
      if (filter === 'month') {
        if (!m.created_at) return false
        if (new Date(m.created_at).getTime() < monthStartMs) return false
      }
      if (q.length > 0) {
        const name = (m.full_name ?? '').toLowerCase()
        const email = (m.email ?? '').toLowerCase()
        if (!name.includes(q) && !email.includes(q)) return false
      }
      return true
    })
  }, [members, filter, query, monthStartMs])

  const chips: { key: Filter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: kpis.totalMembers },
    { key: 'member', label: 'Members', count: kpis.totalMembers - kpis.adminCount },
    { key: 'admin', label: 'Admins', count: kpis.adminCount },
    { key: 'month', label: 'This month', count: kpis.joinedThisMonth },
  ]

  return (
    <>
      <div className="dash-page-head">
        <div className="dash-page-title-block">
          <h1 className="dash-page-title">
            <em>Members</em>
          </h1>
          <div className="dash-page-sub">Manage Fynoy users and roles.</div>
        </div>
        <div className="dash-page-actions">
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--ink-dim)',
              fontSize: 12,
            }}
          >
            <IconUsers width={14} height={14} />
            {kpis.totalMembers} total
          </span>
        </div>
      </div>

      {/* KPIs */}
      <div className="adm-kpi-grid" style={{ marginBottom: 16, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <Kpi label="Total members" value={String(kpis.totalMembers)} />
        <Kpi
          label="Admins"
          value={String(kpis.adminCount)}
          sub={
            kpis.totalMembers
              ? `${((kpis.adminCount / kpis.totalMembers) * 100).toFixed(0)}% of users`
              : undefined
          }
          accent="neutral"
        />
        <Kpi
          label="Joined this month"
          value={String(kpis.joinedThisMonth)}
          accent={kpis.joinedThisMonth > 0 ? 'up' : 'neutral'}
        />
        <Kpi
          label="Active last 7 days"
          value={kpis.activeLast7 === null ? '—' : String(kpis.activeLast7)}
          sub={kpis.activeLast7 === null ? 'last_seen_at not tracked' : undefined}
          accent={kpis.activeLast7 && kpis.activeLast7 > 0 ? 'up' : 'neutral'}
        />
      </div>

      {/* Filter chips + search */}
      <div
        className="dash-card"
        style={{ padding: '14px 18px', marginBottom: 16, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}
      >
        <div className="dash-chips">
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              className={`dash-chip${filter === c.key ? ' is-active' : ''}`}
              onClick={() => setFilter(c.key)}
            >
              {c.label}
              <span
                style={{
                  marginLeft: 4,
                  padding: '0 5px',
                  borderRadius: 2,
                  background: 'rgba(232,228,220,0.04)',
                  fontSize: 10,
                  color: 'var(--ink-dim)',
                }}
              >
                {c.count}
              </span>
            </button>
          ))}
        </div>
        <div
          style={{
            marginLeft: 'auto',
            position: 'relative',
            minWidth: 220,
            flex: '0 1 320px',
          }}
        >
          <IconSearch
            width={14}
            height={14}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--ink-dim)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="search"
            className="dash-input"
            placeholder="Search name or email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ paddingLeft: 34 }}
          />
        </div>
      </div>

      {/* Members table */}
      <div className="dash-card">
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th className="dash-th">Member</th>
                <th className="dash-th">Email</th>
                <th className="dash-th">Role</th>
                <th className="dash-th">Joined</th>
                <th className="dash-th" style={{ textAlign: 'right' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td className="dash-td" colSpan={5}>
                    <div className="dash-empty">No members match your filter.</div>
                  </td>
                </tr>
              ) : (
                filtered.map((m) => {
                  const color = avatarColorClass(m.id)
                  const initial = initialOf(m.full_name, m.email)
                  const isAdmin = m.role === 'admin'
                  return (
                    <tr key={m.id} className="dash-tr">
                      <td className="dash-td">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div className={`dash-avatar ${color}`}>{initial}</div>
                          <div style={{ minWidth: 0 }}>
                            <div className="dash-symbol" style={{ fontSize: 13 }}>
                              {m.full_name || '—'}
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: 'var(--ink-dim)',
                                fontFamily: 'var(--sans)',
                                letterSpacing: '0.02em',
                              }}
                            >
                              {m.id.slice(0, 8)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="dash-td">
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            color: 'var(--ink-mute)',
                          }}
                        >
                          <IconMail width={12} height={12} style={{ color: 'var(--ink-dim)' }} />
                          {m.email || '—'}
                        </span>
                      </td>
                      <td className="dash-td">
                        <span
                          className={`status-badge ${isAdmin ? 'info' : 'active'}`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          {isAdmin ? (
                            <IconShield width={11} height={11} />
                          ) : (
                            <IconUser width={11} height={11} />
                          )}
                          {isAdmin ? 'Admin' : 'Member'}
                        </span>
                      </td>
                      <td className="dash-td">
                        <span className="dash-date">{formatJoined(m.created_at)}</span>
                      </td>
                      <td className="dash-td" style={{ textAlign: 'right', position: 'relative' }}>
                        <div
                          ref={menuOpen === m.id ? menuRef : null}
                          style={{ display: 'inline-block', position: 'relative' }}
                        >
                          <button
                            type="button"
                            aria-label="Open actions"
                            onClick={() => setMenuOpen(menuOpen === m.id ? null : m.id)}
                            className="dash-btn btn-ghost btn-sm"
                            style={{ padding: '4px 10px', minWidth: 0 }}
                          >
                            <DotsIcon />
                          </button>
                          {menuOpen === m.id && (
                            <div
                              role="menu"
                              className="dash-menu"
                              style={{ minWidth: 220, top: 'calc(100% + 6px)' }}
                            >
                              <div className="dash-menu-section">
                                <button
                                  type="button"
                                  role="menuitem"
                                  className="dash-menu-item"
                                  disabled
                                  title="Profile pages coming soon"
                                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                                >
                                  <IconUser width={14} height={14} /> View profile
                                </button>
                                {m.email && (
                                  <a
                                    role="menuitem"
                                    className="dash-menu-item"
                                    href={`mailto:${m.email}?subject=Fynoy%20password%20reset`}
                                    onClick={() => setMenuOpen(null)}
                                  >
                                    <IconMail width={14} height={14} /> Reset password
                                  </a>
                                )}
                                <button
                                  type="button"
                                  role="menuitem"
                                  className="dash-menu-item"
                                  disabled
                                  title="Requires admin SQL — coming soon"
                                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                                >
                                  <IconShield width={14} height={14} />{' '}
                                  {isAdmin ? 'Make member' : 'Make admin'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function Kpi({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string
  sub?: string
  accent?: 'up' | 'dn' | 'neutral'
}) {
  const cls = accent === 'up' ? 'adm-kpi kpi-up' : accent === 'dn' ? 'adm-kpi kpi-dn' : accent === 'neutral' ? 'adm-kpi kpi-neutral' : 'adm-kpi'
  return (
    <div className={cls}>
      <div className="adm-kpi-label">{label}</div>
      <div className="adm-kpi-val">{value}</div>
      {sub && <div className="adm-kpi-sub">{sub}</div>}
    </div>
  )
}

function DotsIcon() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="5" cy="12" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="19" cy="12" r="1.4" />
    </svg>
  )
}
