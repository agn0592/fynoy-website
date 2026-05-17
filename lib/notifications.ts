import type { NotificationItem } from '@/app/dashboard/components/NotificationBell'

interface ClosedTradeRow {
  symbol: string
  exit_date: string | null
  realized_pnl_pct: number | null
  trading_id: string | null
}
interface OpenPositionRow {
  symbol: string
  entry_date_actual: string | null
  trading_id: string | null
}
interface CommentaryRow {
  id: string
  created_at: string
}
interface PortfolioSnapshotRow {
  snapshot_date: string
  daily_twr: number | null
}

export interface BuildNotificationsInput {
  closedTrades?: ClosedTradeRow[]
  openPositions?: OpenPositionRow[]
  commentaries?: CommentaryRow[]
  snapshots?: PortfolioSnapshotRow[]
  isAdmin?: boolean
  lastSyncAt?: string | null
}

export function buildNotifications(input: BuildNotificationsInput): NotificationItem[] {
  const out: NotificationItem[] = []
  const now = Date.now()
  const SEVEN_DAYS = 7 * 24 * 3600 * 1000

  // Recent closed trades
  for (const t of input.closedTrades ?? []) {
    if (!t.exit_date) continue
    const exitTs = new Date(t.exit_date).getTime()
    if (now - exitTs > 30 * 24 * 3600 * 1000) continue
    const pct = t.realized_pnl_pct ?? 0
    const sign = pct >= 0 ? '+' : ''
    out.push({
      id: `closed-${t.symbol}-${t.exit_date}`,
      type: 'position_closed',
      title: `Position closed: ${t.symbol}`,
      body: `Realized ${sign}${pct.toFixed(2)}% return`,
      date: new Date(t.exit_date).toISOString(),
      href: '/dashboard/history',
      unread: now - exitTs < SEVEN_DAYS,
    })
  }

  // Recent opens
  for (const p of input.openPositions ?? []) {
    if (!p.entry_date_actual) continue
    const ts = new Date(p.entry_date_actual).getTime()
    if (now - ts > 14 * 24 * 3600 * 1000) continue
    out.push({
      id: `open-${p.symbol}-${p.entry_date_actual}`,
      type: 'position_opened',
      title: `New position opened: ${p.symbol}`,
      body: 'Added to portfolio',
      date: new Date(p.entry_date_actual).toISOString(),
      href: '/dashboard/holdings',
      unread: now - ts < SEVEN_DAYS,
    })
  }

  // Recent commentaries (last 5)
  for (const c of (input.commentaries ?? []).slice(0, 5)) {
    out.push({
      id: `commentary-${c.id}`,
      type: 'commentary_updated',
      title: 'Portfolio commentary updated',
      body: 'New AI-generated analysis is available',
      date: c.created_at,
      href: '/dashboard/commentary',
      unread: now - new Date(c.created_at).getTime() < SEVEN_DAYS,
    })
  }

  // Best/worst daily TWR alerts (admin only)
  if (input.isAdmin && input.snapshots && input.snapshots.length > 0) {
    const recent = input.snapshots.slice(-30).filter(s => s.daily_twr != null)
    if (recent.length > 0) {
      const bestDay = [...recent].sort((a, b) => (b.daily_twr ?? 0) - (a.daily_twr ?? 0))[0]
      const worstDay = [...recent].sort((a, b) => (a.daily_twr ?? 0) - (b.daily_twr ?? 0))[0]
      if (bestDay && (bestDay.daily_twr ?? 0) > 1.5) {
        out.push({
          id: `best-day-${bestDay.snapshot_date}`,
          type: 'admin',
          title: `Strong day: +${bestDay.daily_twr?.toFixed(2)}% TWR`,
          body: bestDay.snapshot_date,
          date: new Date(bestDay.snapshot_date).toISOString(),
          href: '/admin/analytics',
          unread: now - new Date(bestDay.snapshot_date).getTime() < SEVEN_DAYS,
        })
      }
      if (worstDay && (worstDay.daily_twr ?? 0) < -1.5) {
        out.push({
          id: `worst-day-${worstDay.snapshot_date}`,
          type: 'admin',
          title: `Drawdown: ${worstDay.daily_twr?.toFixed(2)}% TWR`,
          body: worstDay.snapshot_date,
          date: new Date(worstDay.snapshot_date).toISOString(),
          href: '/admin/analytics',
          unread: now - new Date(worstDay.snapshot_date).getTime() < SEVEN_DAYS,
        })
      }
    }
  }

  // Sort newest first
  out.sort((a, b) => b.date.localeCompare(a.date))
  return out.slice(0, 25)
}
