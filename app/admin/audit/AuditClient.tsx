'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  IconActivity, IconAlertCircle, IconCalendar, IconCopy, IconCheck,
} from '@/app/dashboard/components/Icons'
import type { AuditEvent } from './page'

interface AuditClientProps {
  auditAvailable: boolean
  auditEvents: AuditEvent[]
  synthetic: AuditEvent[]
  range: '24h' | '7d' | '30d' | 'all'
  rangeStartMs: number | null
  lastSync: string | null
  lastCommentary: string | null
}

const AVATAR_COLORS = ['gold', 'blue', 'green', 'purple', 'pink', 'orange', 'teal', 'red'] as const
type Category = 'all' | 'sync' | 'commentary' | 'cases' | 'members' | 'system'

function avatarColorClass(seed: string): string {
  let sum = 0
  for (let i = 0; i < seed.length; i++) sum += seed.charCodeAt(i)
  return `avatar-${AVATAR_COLORS[sum % AVATAR_COLORS.length]}`
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 0) return 'just now'
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day}d ago`
  const mo = Math.floor(day / 30)
  if (mo < 12) return `${mo}mo ago`
  return `${Math.floor(mo / 12)}y ago`
}

function absoluteTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function categorize(action: string): Category {
  if (action.startsWith('ibkr.') || action.includes('sync')) return 'sync'
  if (action.startsWith('commentary')) return 'commentary'
  if (action.startsWith('case') || action.startsWith('trade')) return 'cases'
  if (action.startsWith('user') || action.startsWith('member') || action.startsWith('role')) return 'members'
  return 'system'
}

function actionVariant(action: string): 'active' | 'info' | 'warning' | 'inactive' {
  if (action.startsWith('commentary')) return 'info'
  if (action.includes('sync')) return 'active'
  if (action.includes('error') || action.includes('failed')) return 'warning'
  return 'inactive'
}

function truncateDetail(detail: unknown): string {
  if (detail === null || detail === undefined) return '—'
  let str: string
  try {
    str = typeof detail === 'string' ? detail : JSON.stringify(detail)
  } catch {
    return String(detail)
  }
  if (str.length > 64) return str.slice(0, 61) + '…'
  return str
}

export default function AuditClient(props: AuditClientProps) {
  const { auditAvailable, auditEvents, synthetic, range, rangeStartMs, lastSync, lastCommentary } = props
  const router = useRouter()
  const searchParams = useSearchParams()
  const [category, setCategory] = useState<Category>('all')
  const [copied, setCopied] = useState(false)
  // Snapshot "now" at mount to keep render deterministic across re-renders.
  // Lazy initializer runs once at mount; value remains stable thereafter.
  const [nowMs] = useState<number>(() => Date.now())

  const allEvents = useMemo(() => {
    return [...auditEvents, ...synthetic].sort((a, b) =>
      a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0,
    )
  }, [auditEvents, synthetic])

  const filteredEvents = useMemo(() => {
    return allEvents.filter((e) => {
      if (rangeStartMs !== null && new Date(e.created_at).getTime() < rangeStartMs) return false
      if (category !== 'all' && categorize(e.action) !== category) return false
      return true
    })
  }, [allEvents, rangeStartMs, category])

  // KPI counts — depend on nowMs snapshot from mount
  const eventsToday = useMemo(() => {
    const start = new Date(nowMs)
    start.setHours(0, 0, 0, 0)
    const startMs = start.getTime()
    return allEvents.filter((e) => new Date(e.created_at).getTime() >= startMs).length
  }, [allEvents, nowMs])
  const eventsThisWeek = useMemo(() => {
    const startMs = nowMs - 7 * 24 * 3_600_000
    return allEvents.filter((e) => new Date(e.created_at).getTime() >= startMs).length
  }, [allEvents, nowMs])

  function changeRange(next: '24h' | '7d' | '30d' | 'all') {
    const sp = new URLSearchParams(searchParams?.toString() ?? '')
    sp.set('range', next)
    router.push(`/admin/audit?${sp.toString()}`)
  }

  async function copyMigrationName() {
    try {
      await navigator.clipboard.writeText('011_user_features.sql')
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  const categoryChips: { key: Category; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'sync', label: 'Sync' },
    { key: 'commentary', label: 'Commentary' },
    { key: 'cases', label: 'Cases' },
    { key: 'members', label: 'Members' },
    { key: 'system', label: 'System' },
  ]
  const rangeChips: { key: '24h' | '7d' | '30d' | 'all'; label: string }[] = [
    { key: '24h', label: 'Last 24h' },
    { key: '7d', label: 'Last 7 days' },
    { key: '30d', label: 'Last 30 days' },
    { key: 'all', label: 'All time' },
  ]

  return (
    <>
      <div className="dash-page-head">
        <div className="dash-page-title-block">
          <h1 className="dash-page-title">
            Audit <em>Log</em>
          </h1>
          <div className="dash-page-sub">System events and admin actions.</div>
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
            <IconActivity width={14} height={14} />
            {filteredEvents.length} events
          </span>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="adm-kpi-grid" style={{ marginBottom: 16, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <Kpi label="Events today" value={String(eventsToday)} accent={eventsToday > 0 ? 'up' : 'neutral'} />
        <Kpi label="Events this week" value={String(eventsThisWeek)} />
        <Kpi
          label="Last sync"
          value={lastSync ? relTime(lastSync) : '—'}
          sub={lastSync ? absoluteTime(lastSync) : 'never'}
          accent="neutral"
        />
        <Kpi
          label="Last commentary"
          value={lastCommentary ? relTime(lastCommentary) : '—'}
          sub={lastCommentary ? absoluteTime(lastCommentary) : 'never'}
          accent="neutral"
        />
      </div>

      {!auditAvailable && (
        <div className="dash-alert alert-info" style={{ marginBottom: 16 }}>
          <div
            className="dash-alert-title"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <IconAlertCircle width={12} height={12} /> Audit log not enabled
          </div>
          <div className="dash-alert-body" style={{ marginTop: 4 }}>
            Apply migration{' '}
            <code
              style={{
                fontFamily: 'var(--mono, var(--sans))',
                background: 'rgba(96,165,250,0.08)',
                padding: '2px 6px',
                borderRadius: 2,
              }}
            >
              011_user_features.sql
            </code>{' '}
            to enable the audit_log table. Synthetic events from existing data are shown below in
            the meantime.
            <div style={{ marginTop: 10 }}>
              <button
                type="button"
                className="dash-btn btn-sm btn-outline"
                onClick={copyMigrationName}
              >
                {copied ? <IconCheck width={12} height={12} /> : <IconCopy width={12} height={12} />}
                {copied ? 'Copied' : 'Copy filename'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div
        className="dash-card"
        style={{
          padding: '14px 18px',
          marginBottom: 16,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <div className="dash-chips">
          {categoryChips.map((c) => (
            <button
              key={c.key}
              type="button"
              className={`dash-chip${category === c.key ? ' is-active' : ''}`}
              onClick={() => setCategory(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: 'var(--ink-dim)',
            fontSize: 11,
            letterSpacing: '0.04em',
          }}
        >
          <IconCalendar width={13} height={13} />
          <div className="dash-chips">
            {rangeChips.map((r) => (
              <button
                key={r.key}
                type="button"
                className={`dash-chip${range === r.key ? ' is-active' : ''}`}
                onClick={() => changeRange(r.key)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events table */}
      <div className="dash-card">
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th className="dash-th">Time</th>
                <th className="dash-th">Actor</th>
                <th className="dash-th">Action</th>
                <th className="dash-th">Target</th>
                <th className="dash-th">Detail</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length === 0 ? (
                <tr>
                  <td className="dash-td" colSpan={5}>
                    <div className="dash-empty">No events in this range.</div>
                  </td>
                </tr>
              ) : (
                filteredEvents.map((e) => {
                  const cat = categorize(e.action)
                  const variant = actionVariant(e.action)
                  const actorLabel = e.actor_name || (e.actor_email ? e.actor_email.split('@')[0] : 'system')
                  const avatarSeed = e.actor_id ?? actorLabel
                  return (
                    <tr key={e.id} className="dash-tr">
                      <td className="dash-td">
                        <div
                          title={absoluteTime(e.created_at)}
                          style={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                        >
                          <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>
                            {relTime(e.created_at)}
                          </span>
                          <span className="dash-date">{absoluteTime(e.created_at)}</span>
                        </div>
                      </td>
                      <td className="dash-td">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            className={`dash-avatar ${avatarColorClass(avatarSeed)}`}
                            style={{ width: 26, height: 26, fontSize: 11 }}
                          >
                            {actorLabel.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                            <span style={{ color: 'var(--ink)', fontSize: 12 }}>{actorLabel}</span>
                            {e.synthetic && (
                              <span
                                style={{
                                  fontSize: 9,
                                  color: 'var(--ink-dim)',
                                  letterSpacing: '0.12em',
                                  textTransform: 'uppercase',
                                }}
                              >
                                synthetic
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="dash-td">
                        <span className={`status-badge ${variant}`} title={`Category: ${cat}`}>
                          {e.action}
                        </span>
                      </td>
                      <td className="dash-td">
                        <span style={{ fontFamily: 'var(--serif)', fontSize: 13 }}>
                          {e.target || '—'}
                        </span>
                      </td>
                      <td
                        className="dash-td"
                        style={{
                          maxWidth: 320,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={typeof e.detail === 'string' ? e.detail : JSON.stringify(e.detail ?? '')}
                      >
                        <code
                          style={{
                            fontFamily: 'var(--mono, var(--sans))',
                            fontSize: 11,
                            color: 'var(--ink-dim)',
                          }}
                        >
                          {truncateDetail(e.detail)}
                        </code>
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
  const cls =
    accent === 'up'
      ? 'adm-kpi kpi-up'
      : accent === 'dn'
        ? 'adm-kpi kpi-dn'
        : accent === 'neutral'
          ? 'adm-kpi kpi-neutral'
          : 'adm-kpi'
  return (
    <div className={cls}>
      <div className="adm-kpi-label">{label}</div>
      <div className="adm-kpi-val">{value}</div>
      {sub && <div className="adm-kpi-sub">{sub}</div>}
    </div>
  )
}

