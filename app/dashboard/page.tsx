import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import PortfolioSummary from './components/PortfolioSummary'
import PerformanceChart from './components/PerformanceChart'
import PositionsTable from './components/PositionsTable'
import SectorAllocation from './components/SectorAllocation'
import ClosedTradesTable from './components/ClosedTradesTable'
import AICommentary from './components/AICommentary'

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
}
interface ClosedTrade {
  symbol: string; entry_date: string; exit_date: string
  entry_price: number; exit_price: number; realized_pnl: number
  realized_pnl_pct: number; holding_period_days: number
}
interface PortfolioSnapshot { snapshot_date: string; total_nav: number; benchmark_value: number; deposits_withdrawals: number; daily_twr: number }
interface Case { trading_id: string; sector: string | null }

export default async function DashboardPage() {
  const supabase = getServiceClient()

  const [
    { data: openPositionsRaw },
    { data: closedTradesRaw },
    { data: snapshotsRaw },
    { data: casesRaw },
    commentaryResult,
  ] = await Promise.all([
    supabase.from('open_positions').select('*'),
    supabase.from('closed_trades').select('*').order('exit_date', { ascending: false }),
    supabase.from('portfolio_snapshots').select('*').order('snapshot_date', { ascending: true }),
    supabase.from('cases').select('trading_id, sector'),
    supabase.from('commentary').select('content, created_at').order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  const openPositions: OpenPosition[] = openPositionsRaw ?? []
  const closedTrades: ClosedTrade[] = closedTradesRaw ?? []
  const snapshots: PortfolioSnapshot[] = snapshotsRaw ?? []
  const cases: Case[] = casesRaw ?? []

  // % only — no absolute values exposed
  const totalNav = openPositions.reduce((s, p) => s + p.current_price * p.position_size_actual, 0)
  const totalUnrealized = openPositions.reduce((s, p) => s + (p.unrealized_pnl ?? 0), 0)
  const unrealizedPct = totalNav > 0 ? (totalUnrealized / totalNav) * 100 : 0

  const ytdStart = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10)
  const realizedYtd = closedTrades.filter(t => t.exit_date >= ytdStart).reduce((s, t) => s + (t.realized_pnl ?? 0), 0)
  const realizedYtdPct = totalNav > 0 ? (realizedYtd / totalNav) * 100 : 0

  // Use IBKR's time-weighted return (TWR) for chart — this correctly excludes deposits/withdrawals
  // twr is in % per day; chain-multiply to get cumulative performance index starting at 100
  let twrFactor = 1
  const chartData = snapshots.map(s => {
    twrFactor *= (1 + (s.daily_twr ?? 0) / 100)
    return { date: s.snapshot_date, nav: twrFactor * 100, benchmark: s.benchmark_value ?? 0 }
  })

  const SECTOR_FALLBACK: Record<string, string> = {
    I500: 'ETF', IBM: 'Technology', LLY: 'Healthcare',
    MSFT: 'Technology', ORCL: 'Technology', PLTR: 'Technology',
    V: 'Financials', RHM: 'Industrials', PANW: 'Technology',
  }
  const caseMap = new Map<string, string>(cases.map(c => [c.trading_id, c.sector ?? 'Unknown']))
  const sectorMap = new Map<string, number>()
  for (const pos of openPositions) {
    const sector = pos.trading_id
      ? (caseMap.get(pos.trading_id) ?? SECTOR_FALLBACK[pos.symbol] ?? 'Unknown')
      : (SECTOR_FALLBACK[pos.symbol] ?? 'Unknown')
    sectorMap.set(sector, (sectorMap.get(sector) ?? 0) + pos.current_price * pos.position_size_actual)
  }
  const sectorData = Array.from(sectorMap.entries())
    .map(([sector, value]) => ({ sector, value }))
    .sort((a, b) => b.value - a.value)

  const commentary = commentaryResult.data?.content ?? null
  const commentaryUpdatedAt = commentaryResult.data?.created_at ?? null

  return (
    <>
      {/* Two-column app grid */}
      <div className="dash-grid">

        {/* ── Left column: chart + positions ── */}
        <div className="dash-col">
          <div id="performance">
            <PerformanceChart data={chartData} />
          </div>
          <div id="holdings">
            <PositionsTable positions={openPositions} />
          </div>
        </div>

        {/* ── Right column: stats + sector + trades ── */}
        <div className="dash-col">
          <PortfolioSummary
            unrealizedPnlPct={unrealizedPct}
            realizedPnlYtdPct={realizedYtdPct}
            openPositionsCount={openPositions.length}
            twrPct={(twrFactor - 1) * 100}
            inceptionDate="1 Jan 2026"
          />
          <SectorAllocation data={sectorData} />
          <div id="history">
            <ClosedTradesTable trades={closedTrades} />
          </div>
        </div>

      </div>

      {/* ── Full-width commentary ── */}
      <div className="dash-full" id="commentary">
        <AICommentary commentary={commentary} updatedAt={commentaryUpdatedAt} />
      </div>
    </>
  )
}
