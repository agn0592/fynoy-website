'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { IconBell } from './Icons'

export interface NotificationItem {
  id: string
  type: 'position_closed' | 'position_opened' | 'commentary_updated' | 'sync_complete' | 'admin' | 'info'
  title: string
  body?: string
  date: string
  href?: string
  unread?: boolean
}

interface NotificationBellProps {
  items: NotificationItem[]
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
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

const TYPE_DOT_COLOR: Record<NotificationItem['type'], string> = {
  position_closed: '#f87171',
  position_opened: '#4ade80',
  commentary_updated: '#c9a96e',
  sync_complete: '#60a5fa',
  admin: '#a78bfa',
  info: '#8b8a82',
}

export default function NotificationBell({ items }: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('fynoy-notif-dismissed')
      if (stored) setDismissed(new Set(JSON.parse(stored)))
    } catch { /* */ }
  }, [])

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent | TouchEvent) {
      const target = e.target as Node
      if (wrapRef.current && !wrapRef.current.contains(target)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown, { passive: true })
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function dismissAll() {
    const all = new Set([...dismissed, ...items.map(i => i.id)])
    setDismissed(all)
    try { localStorage.setItem('fynoy-notif-dismissed', JSON.stringify([...all])) } catch { /* */ }
  }

  const unread = items.filter(i => !dismissed.has(i.id))
  const unreadCount = unread.length

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className="dash-bell"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${unreadCount} new notifications`}
      >
        <IconBell width={18} height={18} />
        {unreadCount > 0 && (
          <span className="dash-bell-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="dash-menu" role="menu" style={{ width: 360, maxWidth: 'calc(100vw - 24px)' }}>
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--line)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <h4 style={{ fontFamily: 'var(--serif)', fontSize: 14, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                Notifications
              </h4>
              <div style={{ fontSize: 11, color: 'var(--ink-dim)', marginTop: 2 }}>
                {unreadCount === 0 ? "You're all caught up" : `${unreadCount} new`}
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={dismissAll}
                style={{
                  background: 'none', border: 0, color: 'var(--gold)',
                  fontSize: 11, cursor: 'pointer', padding: 4,
                  letterSpacing: '0.04em',
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: 'min(60vh, 480px)', overflowY: 'auto' }}>
            {items.length === 0 ? (
              <div style={{ padding: 28, textAlign: 'center', color: 'var(--ink-dim)', fontSize: 13, fontStyle: 'italic' }}>
                No notifications yet
              </div>
            ) : items.slice(0, 10).map(item => {
              const isUnread = !dismissed.has(item.id)
              const content = (
                <div style={{
                  display: 'grid', gridTemplateColumns: '8px 1fr auto',
                  gap: 12, padding: '12px 16px',
                  borderBottom: '1px solid var(--line)',
                  cursor: item.href ? 'pointer' : 'default',
                  background: isUnread ? 'rgba(201,169,110,0.025)' : 'transparent',
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: isUnread ? TYPE_DOT_COLOR[item.type] : 'var(--line-strong)',
                    boxShadow: isUnread ? `0 0 0 3px ${TYPE_DOT_COLOR[item.type]}22` : 'none',
                    marginTop: 6,
                  }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.4 }}>{item.title}</div>
                    {item.body && (
                      <div style={{ fontSize: 11, color: 'var(--ink-dim)', marginTop: 3, lineHeight: 1.45 }}>
                        {item.body}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--ink-dim)', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                    {relTime(item.date)}
                  </div>
                </div>
              )
              return item.href ? (
                <Link key={item.id} href={item.href} onClick={() => setOpen(false)} style={{ textDecoration: 'none' }}>
                  {content}
                </Link>
              ) : (
                <div key={item.id}>{content}</div>
              )
            })}
          </div>

          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--line)', textAlign: 'center' }}>
            <Link
              href="/dashboard/notifications"
              onClick={() => setOpen(false)}
              style={{
                color: 'var(--gold)', fontSize: 11, fontWeight: 500,
                letterSpacing: '0.06em', textTransform: 'uppercase', textDecoration: 'none',
              }}
            >
              View all
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
