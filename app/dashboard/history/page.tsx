import Link from 'next/link'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import ClosedTradesTable from '@/app/dashboard/components/ClosedTradesTable'
import { returnDistribution, holdingPeriodDistribution, fmtPct } from '@/lib/analytics'
import { ReturnDistributionChart, HoldingPeriodChart } from './HistoryCharts'

import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Trade History' }

function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface ClosedTrade {
  symbol: string
  entry_date: string
  exit_date: string
  entry_price: number
  exit_price: number
  realized_pnl: number
  realized_pnl_pct: number
  holding_period_days: number
  trading_id: string | null
}

type FilterKey = 'all' | 'winners' | 'losers' | 'year'
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',     label: 'All' },
  { key: 'winners', label: 'Winners' },
  { key: 'losers',  label: 'Losers' },
  { key: 'year',    label: 'This year' },
]

function matchesFilter(t: ClosedTrade, key: FilterKey, ytdStart: string): boolean {
  if (key === 'all') return true
  if (key === 'winners') return (t.realized_pnl_pct ?? 0) > 0
  if (key === 'losers') return (t.realized_pnl_pct ?? 0) < 0
  if (key === 'year') return t.exit_date >= ytdStart
  return true
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const params = await searchParams
  const rawFilter = (params?.filter ?? 'all') as string
  const filter: FilterKey = (['all', 'winners', 'losers', 'year'] as const).includes(rawFilter as FilterKey)
    ? (rawFilter as FilterKey)
    : 'all'

  const supabase = getServiceClient()
  const { data: closedRaw } = await supabase
    .from('closed_trades')
    .select('*')
    .order('exit_date', { ascending: false })

  const closedTrades: ClosedTrade[] = closedRaw ?? []
  const ytdStart = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10)
  const filtered = closedTrades.filter(t => matchesFilter(t, filter, ytdStart))

  // ── KPIs over the full set (not the filter) ─────────────────────────
  const withPct = closedTrades.filter(t => t.realized_pnl_pct != null)
  const wins = withPct.filter(t => t.realized_pnl_pct > 0)
  const winRate = withPct.length > 0 ? (wins.length / withPct.length) * 100 : 0
  const avgReturn = withPct.length > 0
    ? withPct.reduce((s, t) => s + t.realized_pnl_pct, 0) / withPct.length
    : 0
  const avgHolding = withPct.length > 0
    ? Math.round(withPct.reduce((s, t) => s + (t.holding_period_days ?? 0), 0) / withPct.length)
    : 0
  const bestTrade = [...withPct].sort((a, b) => b.realized_pnl_pct - a.realized_pnl_pct)[0] ?? null

  // ── Charts run on the filtered set so they reflect what the user is looking at ──
  const returnDist = returnDistribution(filtered)
  const holdingDist = holdingPeriodDistribution(filtered)

  const closedRows = filtered.map(t => ({
    symbol: t.symbol,
    entry_date: t.entry_date,
    exit_date: t.exit_date,
    realized_pnl: t.realized_pnl,
    realized_pnl_pct: t.realized_pnl_pct,
    holding_period_days: t.holding_period_days,
    trading_id: t.trading_id,
  }))

  return (
    <>
      <div className="dash-page-head">
        <div className="dash-page-title-block">
          <h1 className="dash-page-title">Trade <em>History</em></h1>
          <div className="dash-page-sub">Every closed position, indexed for analysis.</div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="adm-kpi-grid" style={{ marginBottom: 20 }}>
        <div className="adm-kpi">
          <div className="adm-kpi-label">Total trades</div>
          <div className="adm-kpi-val">{withPct.length}</div>
          <div className="adm-kpi-sub">Closed positions</div>
        </div>
        <div className={`adm-kpi ${winRate >= 50 ? 'kpi-up' : 'kpi-dn'}`}>
          <div className="adm-kpi-label">Win rate</div>
          <div className={`adm-kpi-val ${winRate >= 50 ? 'up' : 'dn'}`}>
            {withPct.length > 0 ? `${winRate.toFixed(0)}%` : '—'}
          </div>
          <div className="adm-kpi-sub">{wins.length} winners</div>
        </div>
        <div className={`adm-kpi ${avgReturn >= 0 ? 'kpi-up' : 'kpi-dn'}`}>
          <div className="adm-kpi-label">Avg return</div>
          <div className={`adm-kpi-val ${avgReturn >= 0 ? 'up' : 'dn'}`}>
            {withPct.length > 0 ? fmtPct(avgReturn) : '—'}
          </div>
          <div className="adm-kpi-sub">Per trade</div>
        </div>
        <div className="adm-kpi kpi-neutral">
          <div className="adm-kpi-label">Avg holding</div>
          <div className="adm-kpi-val">{withPct.length > 0 ? `${avgHolding}d` : '—'}</div>
          <div className="adm-kpi-sub">Average duration</div>
        </div>
        <div className="adm-kpi kpi-up">
          <div className="adm-kpi-label">Best trade</div>
          <div className="adm-kpi-val up">{bestTrade ? fmtPct(bestTrade.realized_pnl_pct) : '—'}</div>
          <div className="adm-kpi-sub">{bestTrade?.symbol ?? '—'}</div>
        </div>
      </div>

      {/* Filter chips */}
      <div className="dash-chips" style={{ marginBottom: 16 }}>
        {FILTERS.map(f => (
          <Link
            key={f.key}
            href={f.key === 'all' ? '/dashboard/history' : `/dashboard/history?filter=${f.key}`}
            className={`dash-chip${filter === f.key ? ' is-active' : ''}`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <ClosedTradesTable trades={closedRows} />

      {filtered.length > 0 && (
        <div className="dash-grid" style={{ marginTop: 16 }}>
          <div className="dash-col">
            <ReturnDistributionChart data={returnDist} />
          </div>
          <div className="dash-col">
            <HoldingPeriodChart data={holdingDist} />
          </div>
        </div>
      )}
    </>
  )
}
