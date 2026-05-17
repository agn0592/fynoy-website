import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import {
  computeMetrics,
  indexSnapshots,
  drawdownSeries,
  monthlyReturns,
  returnDistribution,
  holdingPeriodDistribution,
  concentrationStats,
} from '@/lib/analytics'
import AnalyticsView from './AnalyticsView'

import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Analytics' }

function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface RawSnapshot {
  snapshot_date: string
  total_nav: number | null
  daily_twr: number | null
  benchmark_value: number | null
  deposits_withdrawals: number | null
}

interface RawClosedTrade {
  symbol: string
  trading_id: string | null
  entry_date: string | null
  exit_date: string | null
  realized_pnl: number | null
  realized_pnl_pct: number | null
  holding_period_days: number | null
}

interface RawOpenPosition {
  trading_id: string | null
  symbol: string
  pct_of_nav: number | null
  current_price: number | null
  position_size_actual: number | null
}

interface RawCase {
  trading_id: string
  sector: string | null
}

export default async function AnalyticsPage() {
  const supabase = getServiceClient()

  const [
    { data: snapshotsRaw },
    { data: closedTradesRaw },
    { data: openPositionsRaw },
    { data: casesRaw },
  ] = await Promise.all([
    supabase
      .from('portfolio_snapshots')
      .select('snapshot_date, total_nav, daily_twr, benchmark_value, deposits_withdrawals')
      .order('snapshot_date', { ascending: true }),
    supabase
      .from('closed_trades')
      .select('symbol, trading_id, entry_date, exit_date, realized_pnl, realized_pnl_pct, holding_period_days'),
    supabase
      .from('open_positions')
      .select('trading_id, symbol, pct_of_nav, current_price, position_size_actual'),
    supabase
      .from('cases')
      .select('trading_id, sector'),
  ])

  const snapshots: RawSnapshot[] = snapshotsRaw ?? []
  const closedTrades: RawClosedTrade[] = closedTradesRaw ?? []
  const openPositions: RawOpenPosition[] = openPositionsRaw ?? []
  const cases: RawCase[] = casesRaw ?? []

  // Compute everything server-side
  const metrics = computeMetrics(snapshots, { riskFreePct: 0 })
  const indexed = indexSnapshots(snapshots)
  const drawdowns = drawdownSeries(snapshots)
  const monthly = monthlyReturns(snapshots)
  const returnDist = returnDistribution(closedTrades)
  const holdingDist = holdingPeriodDistribution(closedTrades)
  const concentration = concentrationStats(openPositions)

  // Sector map: trading_id → sector
  const sectorByTradingId = new Map<string, string>()
  for (const c of cases) {
    sectorByTradingId.set(c.trading_id, c.sector ?? 'Unknown')
  }

  // Sector exposure (open positions weighted by pct_of_nav)
  const sectorExposure = new Map<string, number>()
  for (const p of openPositions) {
    const sector = p.trading_id ? (sectorByTradingId.get(p.trading_id) ?? 'Unknown') : 'Unknown'
    sectorExposure.set(sector, (sectorExposure.get(sector) ?? 0) + (p.pct_of_nav ?? 0))
  }
  const sectorRows = Array.from(sectorExposure.entries())
    .map(([sector, pct]) => ({ sector, pct }))
    .filter((s) => s.pct > 0)
    .sort((a, b) => b.pct - a.pct)

  // Sector contribution from closed trades
  const sectorContribMap = new Map<string, number>()
  for (const t of closedTrades) {
    const sector = t.trading_id ? (sectorByTradingId.get(t.trading_id) ?? 'Unknown') : 'Unknown'
    sectorContribMap.set(sector, (sectorContribMap.get(sector) ?? 0) + (t.realized_pnl ?? 0))
  }
  const sectorContrib = Array.from(sectorContribMap.entries())
    .map(([sector, pnl]) => ({ sector, pnl }))
    .filter((s) => s.pnl !== 0)
    .sort((a, b) => b.pnl - a.pnl)

  // Top winners / losers
  const tradesWithSector = closedTrades.map((t) => ({
    symbol: t.symbol,
    sector: t.trading_id ? (sectorByTradingId.get(t.trading_id) ?? 'Unknown') : 'Unknown',
    realized_pnl: t.realized_pnl ?? 0,
    realized_pnl_pct: t.realized_pnl_pct ?? 0,
    holding_period_days: t.holding_period_days ?? 0,
    exit_date: t.exit_date,
  }))
  const topWinners = [...tradesWithSector]
    .filter((t) => t.realized_pnl > 0)
    .sort((a, b) => b.realized_pnl - a.realized_pnl)
    .slice(0, 5)
  const topLosers = [...tradesWithSector]
    .filter((t) => t.realized_pnl < 0)
    .sort((a, b) => a.realized_pnl - b.realized_pnl)
    .slice(0, 5)

  // Win/Loss streak (sorted by exit_date ascending)
  const sortedByDate = [...closedTrades]
    .filter((t) => t.exit_date)
    .sort((a, b) => (a.exit_date! < b.exit_date! ? -1 : 1))
  let curWin = 0
  let curLoss = 0
  let longestWin = 0
  let longestLoss = 0
  for (const t of sortedByDate) {
    const pnl = t.realized_pnl ?? 0
    if (pnl > 0) {
      curWin++
      curLoss = 0
      if (curWin > longestWin) longestWin = curWin
    } else if (pnl < 0) {
      curLoss++
      curWin = 0
      if (curLoss > longestLoss) longestLoss = curLoss
    } else {
      curWin = 0
      curLoss = 0
    }
  }

  // Scatter plot data
  const scatterData = tradesWithSector
    .filter((t) => t.holding_period_days > 0)
    .map((t) => ({
      x: t.holding_period_days,
      y: t.realized_pnl_pct,
      symbol: t.symbol,
    }))

  return (
    <>
      <div className="dash-page-head">
        <div className="dash-page-title-block">
          <h1 className="dash-page-title"><em>Analytics</em></h1>
          <div className="dash-page-sub">Deep portfolio performance, risk, attribution.</div>
        </div>
      </div>

      <AnalyticsView
        metrics={metrics}
        indexed={indexed}
        drawdowns={drawdowns}
        monthly={monthly}
        returnDist={returnDist}
        holdingDist={holdingDist}
        concentration={concentration}
        sectorRows={sectorRows}
        sectorContrib={sectorContrib}
        topWinners={topWinners}
        topLosers={topLosers}
        longestWin={longestWin}
        longestLoss={longestLoss}
        scatterData={scatterData}
        totalClosedTrades={closedTrades.length}
      />
    </>
  )
}
