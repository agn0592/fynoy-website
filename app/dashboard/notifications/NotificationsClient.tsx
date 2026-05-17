'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { NotificationItem } from '@/app/dashboard/components/NotificationBell'

type FilterKey = 'all' | 'trades' | 'commentary' | 'system'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',        label: 'All' },
  { key: 'trades',     label: 'Trades' },
  { key: 'commentary', label: 'Commentary' },
  { key: 'system',     label: 'System' },
]

const TYPE_DOT_COLOR: Record<NotificationItem['type'], string> = {
  position_closed: 'var(--dash-red)',
  position_opened: 'var(--dash-green)',
  commentary_updated: 'var(--gold)',
  sync_complete: 'var(--dash-blue)',
  admin: 'var(--dash-purple)',
  info: 'var(--ink-mute)',
}

function matchesFilter(item: NotificationItem, key: FilterKey): boolean {
  if (key === 'all') return true
  if (key === 'trades') return item.type === 'position_closed' || item.type === 'position_opened'
  if (key === 'commentary') return item.type === 'commentary_updated'
  if (key === 'system') return item.type === 'admin' || item.type === 'sync_complete' || item.type === 'info'
  return true
}

function relTime(iso: string): string {
  const date = new Date(iso)
  const sec = Math.round((Date.now() - date.getTime()) / 1000)
  if (sec < 60) return 'just now'
  const min = Math.round(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h ago`
  const days = Math.round(hr / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
}

function dayBucket(iso: string): 'today' | 'yesterday' | 'week' | 'earlier' {
  const now = new Date()
  const d = new Date(iso)
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startYday  = startToday - 86_400_000
  const startWeek  = startToday - 6 * 86_400_000
  const t = d.getTime()
  if (t >= startToday) return 'today'
  if (t >= startYday) return 'yesterday'
  if (t >= startWeek) return 'week'
  return 'earlier'
}

const GROUP_LABEL: Record<ReturnType<typeof dayBucket>, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  week: 'This week',
  earlier: 'Earlier',
}

export default function NotificationsClient({ items }: { items: NotificationItem[] }) {
  const [filter, setFilter] = useState<FilterKey>('all')

  const filtered = useMemo(() => items.filter(i => matchesFilter(i, filter)), [items, filter])

  const groups = useMemo(() => {
    const out: { key: ReturnType<typeof dayBucket>; items: NotificationItem[] }[] = []
    const order: ReturnType<typeof dayBucket>[] = ['today', 'yesterday', 'week', 'earlier']
    for (const key of order) {
      const inGroup = filtered.filter(i => dayBucket(i.date) === key)
      if (inGroup.length > 0) out.push({ key, items: inGroup })
    }
    return out
  }, [filtered])

  return (
    <>
      <div className="dash-chips" style={{ marginBottom: 20 }}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            type="button"
            className={`dash-chip${filter === f.key ? ' is-active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            {f.key !== 'all' && (
              <span style={{ opacity: 0.5 }}>
                {items.filter(i => matchesFilter(i, f.key)).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="dash-alert">
          <div className="dash-alert-title">All caught up</div>
          <div className="dash-alert-body">Niets te melden — geen nieuwe events in deze categorie.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {groups.map(group => (
            <div key={group.key}>
              <div className="dash-section-sep">{GROUP_LABEL[group.key]}</div>
              <div className="dash-card">
                <ul className="activity-list" style={{ borderTop: 0 }}>
                  {group.items.map(item => {
                    const dot = (
                      <span
                        className="activity-dot"
                        style={{
                          background: TYPE_DOT_COLOR[item.type],
                          boxShadow: `0 0 0 3px ${TYPE_DOT_COLOR[item.type]}1f`,
                        }}
                      />
                    )
                    const content = (
                      <>
                        {dot}
                        <div className="activity-content">
                          <div className="activity-label" style={{ fontFamily: 'var(--serif)', fontSize: 14 }}>
                            {item.title}
                          </div>
                          {item.body && (
                            <div className="activity-date" style={{ color: 'var(--ink-mute)', fontSize: 12, letterSpacing: 0, marginTop: 2 }}>
                              {item.body}
                            </div>
                          )}
                        </div>
                        <div className="activity-meta">{relTime(item.date)}</div>
                      </>
                    )
                    return item.href ? (
                      <li key={item.id} className="activity-item" style={{ padding: 0 }}>
                        <Link
                          href={item.href}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '16px 1fr auto',
                            gap: 14,
                            padding: '14px 20px',
                            width: '100%',
                            alignItems: 'center',
                            color: 'inherit',
                            textDecoration: 'none',
                          }}
                        >
                          {content}
                        </Link>
                      </li>
                    ) : (
                      <li key={item.id} className="activity-item">
                        {content}
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
