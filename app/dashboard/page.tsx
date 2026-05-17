import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import PortfolioSummary from './components/PortfolioSummary'
import PerformanceChart from './components/PerformanceChart'
import PositionsTable from './components/PositionsTable'
import SectorAllocation from './components/SectorAllocation'
import ClosedTradesTable from './components/ClosedTradesTable'
import AICommentary from './components/AICommentary'
import CommunityCard from './components/CommunityCard'
import RiskMetrics from './components/RiskMetrics'
import RiskAdjustedReturn from './components/RiskAdjustedReturn'
import ActivityFeed, { type ActivityEvent } from './components/ActivityFeed'
import PositionTimeline, { type TimelinePosition } from './components/PositionTimeline'
import { computeRiskMetrics, alignRiskFreeRates } from '@/lib/risk-metrics'

function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface OpenPosition {
  id: string; trading_id: string | null; symbol: string
  entry_price_actual: number; current_price: number; position_size_actual: number
  pct_of_nav: number; unrealized_pnl: number; unrealized_pnl_pct: number
  entry_date_actual: string | null
}
interface ClosedTrade {
  symbol: string; entry_date: string; exit_date: string
  entry_price: number; exit_price: number; realized_pnl: number
  realized_pnl_pct: number; holding_period_days: number
  trading_id: string | null
}
interface PortfolioSnapshot { snapshot_date: string; total_nav: number; benchmark_value: number; deposits_withdrawals: number; daily_twr: number }
interface CaseRow {
  trading_id: string
  sector: string | null
  expected_holding_period_months: number | null
  take_profit: number | null
  stop_loss: number | null
  entry_price_target: number | null
}

export default async function DashboardPage() {
  const supabase = getServiceClient()

  const [
    { data: openPositionsRaw },
    { data: closedTradesRaw },
    { data: snapshotsRaw },
    { data: casesRaw },
    { data: rfRatesRaw },
    commentaryResult,
  ] = await Promise.all([
    supabase.from('open_positions').select('*'),
    supabase.from('closed_trades').select('*').order('exit_date', { ascending: false }),
    supabase.from('portfolio_snapshots').select('*').order('snapshot_date', { ascending: true }),
    supabase.from('cases').select('trading_id, sector, expected_holding_period_months, take_profit, stop_loss, entry_price_target'),
    supabase.from('risk_free_rates').select('date, rate').order('date', { ascending: true }),
    supabase.from('commentary').select('content, created_at').order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  const openPositions: OpenPosition[] = openPositionsRaw ?? []
  const closedTrades: ClosedTrade[]   = closedTradesRaw ?? []
  const snapshots: PortfolioSnapshot[] = snapshotsRaw ?? []
  const cases: CaseRow[] = casesRaw ?? []
  const rfRates: { date: string; rate: number }[] = (rfRatesRaw ?? []).map(r => ({ date: r.date, rate: Number(r.rate) }))

  const caseByTradingId = new Map<string, CaseRow>(cases.map(c => [c.trading_id, c]))

  // ── Portfolio metrics ──────────────────────────────────────────────
  const totalNav = openPositions.reduce((s, p) => s + p.current_price * p.position_size_actual, 0)
  const totalUnrealized = openPositions.reduce((s, p) => s + (p.unrealized_pnl ?? 0), 0)
  const unrealizedPct = totalNav > 0 ? (totalUnrealized / totalNav) * 100 : 0

  const ytdStart = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10)
  const realizedYtd = closedTrades.filter(t => t.exit_date >= ytdStart).reduce((s, t) => s + (t.realized_pnl ?? 0), 0)
  const realizedYtdPct = totalNav > 0 ? (realizedYtd / totalNav) * 100 : 0

  let twrFactor = 1
  const chartData = snapshots.map(s => {
    twrFactor *= (1 + (s.daily_twr ?? 0) / 100)
    return { date: s.snapshot_date, nav: twrFactor * 100, benchmark: s.benchmark_value ?? 0 }
  })

  const firstBenchmark = snapshots.find(s => (s.benchmark_value ?? 0) > 0)
  const lastBenchmark = [...snapshots].reverse().find(s => (s.benchmark_value ?? 0) > 0)
  const vwcePct = firstBenchmark && lastBenchmark && firstBenchmark !== lastBenchmark
    ? ((lastBenchmark.benchmark_value - firstBenchmark.benchmark_value) / firstBenchmark.benchmark_value) * 100
    : null
  const alphaPct = vwcePct !== null ? (twrFactor - 1) * 100 - vwcePct : null

  // ── Capped M² (risk-adjusted return) ──────────────────────────────
  const rfAligned = alignRiskFreeRates(
    snapshots.map(s => s.snapshot_date),
    rfRates,
  )
  const riskMetrics = computeRiskMetrics({
    dailyTwrPct: snapshots.map(s => s.daily_twr ?? 0),
    benchmarkValues: snapshots.map(s => s.benchmark_value ?? 0),
    riskFreeAnnual: rfAligned,
  })
  const latestRf = rfRates.length > 0 ? rfRates[rfRates.length - 1] : null
  const rfStale = latestRf
    ? (new Date().getTime() - new Date(latestRf.date).getTime()) / 86_400_000 > 7
    : true

  // ── Sector allocation ──────────────────────────────────────────────
  const SECTOR_FALLBACK: Record<string, string> = {
    I500: 'ETF', IBM: 'Technology', LLY: 'Healthcare',
    MSFT: 'Technology', ORCL: 'Technology', PLTR: 'Technology',
    V: 'Financials', RHM: 'Industrials', PANW: 'Technology',
  }
  const sectorMap = new Map<string, number>()
  for (const pos of openPositions) {
    const sector = pos.trading_id
      ? (caseByTradingId.get(pos.trading_id)?.sector ?? SECTOR_FALLBACK[pos.symbol] ?? 'Unknown')
      : (SECTOR_FALLBACK[pos.symbol] ?? 'Unknown')
    sectorMap.set(sector, (sectorMap.get(sector) ?? 0) + pos.current_price * pos.position_size_actual)
  }
  const sectorData = Array.from(sectorMap.entries())
    .map(([sector, value]) => ({ sector, value }))
    .sort((a, b) => b.value - a.value)

  // ── Risk metrics from closed trades ───────────────────────────────
  const closedWithPnl = closedTrades.filter(t => t.realized_pnl_pct != null)
  const wins = closedWithPnl.filter(t => t.realized_pnl_pct > 0)
  const winRate = closedWithPnl.length > 0 ? (wins.length / closedWithPnl.length) * 100 : 0
  const avgReturn = closedWithPnl.length > 0
    ? closedWithPnl.reduce((s, t) => s + t.realized_pnl_pct, 0) / closedWithPnl.length
    : 0
  const avgHoldingDays = closedWithPnl.length > 0
    ? Math.round(closedWithPnl.reduce((s, t) => s + (t.holding_period_days ?? 0), 0) / closedWithPnl.length)
    : 0
  const sortedByPnl = [...closedWithPnl].sort((a, b) => b.realized_pnl_pct - a.realized_pnl_pct)
  const bestTrade  = sortedByPnl[0] ? { symbol: sortedByPnl[0].symbol, pct: sortedByPnl[0].realized_pnl_pct } : null
  const worstTrade = sortedByPnl.length > 0
    ? { symbol: sortedByPnl[sortedByPnl.length - 1].symbol, pct: sortedByPnl[sortedByPnl.length - 1].realized_pnl_pct }
    : null
  const tradesYtd = closedTrades.filter(t => t.exit_date >= ytdStart).length

  // ── Positions with TP/SL targets (% off entry) ──────────────────────
  function computePcts(pos: OpenPosition) {
    if (!pos.trading_id || !pos.entry_price_actual) return { take_profit_pct: null, stop_loss_pct: null }
    const c = caseByTradingId.get(pos.trading_id)
    const tp = c?.take_profit != null
      ? ((c.take_profit - pos.entry_price_actual) / pos.entry_price_actual) * 100
      : null
    const sl = c?.stop_loss != null
      ? ((c.stop_loss - pos.entry_price_actual) / pos.entry_price_actual) * 100
      : null
    return { take_profit_pct: tp, stop_loss_pct: sl }
  }

  const positionRows = openPositions.map(p => ({
    symbol: p.symbol,
    pct_of_nav: p.pct_of_nav,
    unrealized_pnl_pct: p.unrealized_pnl_pct,
    trading_id: p.trading_id,
    ...computePcts(p),
  }))

  const closedRows = closedTrades.map(t => ({
    symbol: t.symbol,
    entry_date: t.entry_date,
    exit_date: t.exit_date,
    realized_pnl: t.realized_pnl,
    realized_pnl_pct: t.realized_pnl_pct,
    holding_period_days: t.holding_period_days,
    trading_id: t.trading_id,
  }))

  // ── Timeline positions ─────────────────────────────────────────────
  const timelinePositions: TimelinePosition[] = openPositions
    .filter(p => p.entry_date_actual && p.entry_price_actual)
    .map(p => {
      const pcts = computePcts(p)
      const months = p.trading_id ? (caseByTradingId.get(p.trading_id)?.expected_holding_period_months ?? 6) : 6
      return {
        symbol: p.symbol,
        trading_id: p.trading_id,
        entry_date: p.entry_date_actual as string,
        holding_months: months,
        entry_price: p.entry_price_actual,
        current_price: p.current_price,
        take_profit_pct: pcts.take_profit_pct,
        stop_loss_pct: pcts.stop_loss_pct,
      }
    })

  // ── Activity feed ───────────────────────────────────────────────────
  const activityEvents: ActivityEvent[] = []
  for (const p of openPositions) {
    if (p.entry_date_actual) {
      activityEvents.push({
        date: p.entry_date_actual,
        type: 'position_opened',
        symbol: p.symbol,
        label: `Position opened: ${p.symbol}`,
      })
    }
  }
  for (const t of closedTrades) {
    if (t.exit_date) {
      const pct = t.realized_pnl_pct ?? 0
      activityEvents.push({
        date: t.exit_date,
        type: 'position_closed',
        symbol: t.symbol,
        pct,
        label: `Trade closed: ${t.symbol} ${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`,
      })
    }
  }
  if (commentaryResult.data?.created_at) {
    activityEvents.push({
      date: commentaryResult.data.created_at,
      type: 'commentary_updated',
      label: 'Portfolio commentary updated',
    })
  }
  activityEvents.sort((a, b) => b.date.localeCompare(a.date))
  const recentActivity = activityEvents.slice(0, 15)

  const commentary = commentaryResult.data?.content ?? null
  const commentaryUpdatedAt = commentaryResult.data?.created_at ?? null

  return (
    <>
      {/* Two-column app grid */}
      <div className="dash-grid">

        {/* ── Left column: chart + positions + trade history + timeline ── */}
        <div className="dash-col">
          <div id="performance">
            <PerformanceChart data={chartData} />
          </div>
          <div id="holdings">
            <PositionsTable positions={positionRows} />
          </div>
          <div id="history">
            <ClosedTradesTable trades={closedRows} />
          </div>
          {timelinePositions.length > 0 && (
            <div id="timeline">
              <PositionTimeline positions={timelinePositions} />
            </div>
          )}
          <div id="activity">
            <ActivityFeed events={recentActivity} />
          </div>
        </div>

        {/* ── Right column: stats + sector + risk ── */}
        <div className="dash-col">
          <PortfolioSummary
            unrealizedPnlPct={unrealizedPct}
            realizedPnlYtdPct={realizedYtdPct}
            openPositionsCount={openPositions.length}
            twrPct={(twrFactor - 1) * 100}
            vwcePct={vwcePct}
            alphaPct={alphaPct}
            inceptionDate="1 Jan 2026"
          />
          <SectorAllocation data={sectorData} />
          <RiskMetrics
            winRate={winRate}
            avgReturn={avgReturn}
            avgHoldingDays={avgHoldingDays}
            bestTrade={bestTrade}
            worstTrade={worstTrade}
            tradesYtd={tradesYtd}
            totalTrades={closedWithPnl.length}
          />
        </div>

      </div>

      {/* ── Full-width risk-adjusted return (Capped M²) ── */}
      <div className="dash-full" id="risk-adjusted">
        <RiskAdjustedReturn
          metrics={riskMetrics}
          inceptionDate="1 Jan 2026"
          rfSource="10Y Duitse Bund"
          rfStale={rfStale}
          benchmarkLabel="VWCE"
        />
      </div>

      {/* ── Full-width commentary ── */}
      <div className="dash-full" id="commentary">
        <AICommentary commentary={commentary} updatedAt={commentaryUpdatedAt} />
      </div>

      {/* ── Community CTAs ── */}
      <div className="dash-full" id="community">
        <CommunityCard />
      </div>
    </>
  )
}
