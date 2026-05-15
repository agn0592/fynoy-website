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
  id: string
  trading_id: string | null
  symbol: string
  entry_price_actual: number
  current_price: number
  position_size_actual: number
  pct_of_nav: number
  unrealized_pnl: number
  unrealized_pnl_pct: number
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
}

interface PortfolioSnapshot {
  snapshot_date: string
  total_nav: number
  benchmark_value: number
}

interface Case {
  trading_id: string
  sector: string | null
}

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
    supabase
      .from('closed_trades')
      .select('*')
      .order('exit_date', { ascending: false }),
    supabase
      .from('portfolio_snapshots')
      .select('*')
      .order('snapshot_date', { ascending: true }),
    supabase.from('cases').select('trading_id, sector'),
    supabase
      .from('commentary')
      .select('content, created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const openPositions: OpenPosition[] = openPositionsRaw ?? []
  const closedTrades: ClosedTrade[] = closedTradesRaw ?? []
  const snapshots: PortfolioSnapshot[] = snapshotsRaw ?? []
  const cases: Case[] = casesRaw ?? []

  // --- Calculated metrics (% only, no absolute values exposed) ---
  const totalNav = openPositions.reduce(
    (sum, p) => sum + p.current_price * p.position_size_actual,
    0
  )
  const totalUnrealizedPnl = openPositions.reduce(
    (sum, p) => sum + (p.unrealized_pnl ?? 0),
    0
  )
  const unrealizedPnlPct = totalNav > 0 ? (totalUnrealizedPnl / totalNav) * 100 : 0

  const ytdStart = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10)
  const realizedPnlYtd = closedTrades
    .filter((t) => t.exit_date >= ytdStart)
    .reduce((sum, t) => sum + (t.realized_pnl ?? 0), 0)
  const realizedPnlYtdPct = totalNav > 0 ? (realizedPnlYtd / totalNav) * 100 : 0

  // --- Performance chart data ---
  const chartData = snapshots.map((s) => ({
    date: s.snapshot_date,
    nav: s.total_nav ?? 0,
    benchmark: s.benchmark_value ?? 0,
  }))

  // --- Sector allocation ---
  const caseMap = new Map<string, string>(
    cases.map((c) => [c.trading_id, c.sector ?? 'Unknown'])
  )

  const sectorMap = new Map<string, number>()
  for (const pos of openPositions) {
    const sector = pos.trading_id ? (caseMap.get(pos.trading_id) ?? 'Unknown') : 'Unknown'
    const marketValue = pos.current_price * pos.position_size_actual
    sectorMap.set(sector, (sectorMap.get(sector) ?? 0) + marketValue)
  }

  const sectorData = Array.from(sectorMap.entries())
    .map(([sector, value]) => ({ sector, value }))
    .sort((a, b) => b.value - a.value)

  // --- AI Commentary ---
  const commentary = commentaryResult.data?.content ?? null
  const commentaryUpdatedAt = commentaryResult.data?.created_at ?? null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PortfolioSummary
        unrealizedPnlPct={unrealizedPnlPct}
        realizedPnlYtdPct={realizedPnlYtdPct}
        openPositionsCount={openPositions.length}
      />

      <PerformanceChart data={chartData} />

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: '2 1 500px', minWidth: '300px' }}>
          <PositionsTable positions={openPositions} />
        </div>
        <div style={{ flex: '1 1 280px', minWidth: '260px' }}>
          <SectorAllocation data={sectorData} />
        </div>
      </div>

      <ClosedTradesTable trades={closedTrades} />

      <AICommentary commentary={commentary} updatedAt={commentaryUpdatedAt} />
    </div>
  )
}
