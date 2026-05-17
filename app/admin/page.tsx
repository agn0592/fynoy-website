import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import CommandCenter from './CommandCenter'

function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface OpenPosition {
  trading_id: string | null
  symbol: string
  entry_date_actual: string | null
  current_price: number
  position_size_actual: number
  unrealized_pnl: number
  last_synced_at: string | null
}

interface ClosedTrade {
  exit_date: string
  realized_pnl: number
}

interface Case {
  id: string
  trading_id: string
  company_name: string
  ticker: string | null
  status: string
  sector: string | null
  date_of_case: string | null
  total_score: number | null
  expected_holding_period_months: number | null
}

interface PortfolioSnapshot {
  snapshot_date: string
  total_nav: number
  benchmark_value: number | null
  daily_twr: number | null
}

export default async function AdminPage() {
  const supabase = getServiceClient()

  const [
    { data: openPositionsRaw },
    { data: closedTradesRaw },
    { data: casesRaw },
    { data: snapshotsRaw },
    { data: settingsRaw },
  ] = await Promise.all([
    supabase
      .from('open_positions')
      .select('trading_id, symbol, entry_date_actual, current_price, position_size_actual, unrealized_pnl, last_synced_at'),
    supabase
      .from('closed_trades')
      .select('exit_date, realized_pnl')
      .order('exit_date', { ascending: false }),
    supabase
      .from('cases')
      .select('id, trading_id, company_name, ticker, status, sector, date_of_case, total_score, expected_holding_period_months')
      .order('date_of_case', { ascending: false }),
    supabase
      .from('portfolio_snapshots')
      .select('snapshot_date, total_nav, benchmark_value, daily_twr')
      .order('snapshot_date', { ascending: true }),
    supabase
      .from('settings')
      .select('value')
      .eq('key', 'target_allocation')
      .maybeSingle(),
  ])

  const openPositions: OpenPosition[] = openPositionsRaw ?? []
  const closedTrades: ClosedTrade[] = closedTradesRaw ?? []
  const cases: Case[] = casesRaw ?? []
  const snapshots: PortfolioSnapshot[] = snapshotsRaw ?? []
  const targetAllocation: Record<string, number> =
    (settingsRaw?.value as Record<string, number>) ?? {}

  // --- KPIs ---
  const totalNav = openPositions.reduce(
    (sum, p) => sum + p.current_price * p.position_size_actual, 0
  )
  const totalUnrealizedPnl = openPositions.reduce((sum, p) => sum + (p.unrealized_pnl ?? 0), 0)
  const unrealizedPct = totalNav > 0 ? (totalUnrealizedPnl / totalNav) * 100 : 0

  const ytdStart = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10)
  const closedYtd = closedTrades.filter((t) => t.exit_date >= ytdStart)
  const realizedPnlYtd = closedYtd.reduce((sum, t) => sum + (t.realized_pnl ?? 0), 0)

  const profitableTrades = closedTrades.filter((t) => (t.realized_pnl ?? 0) > 0).length
  const winRate = closedTrades.length > 0 ? (profitableTrades / closedTrades.length) * 100 : null

  const latestNav = snapshots[snapshots.length - 1]?.total_nav ?? 0
  const prevNav = snapshots[snapshots.length - 2]?.total_nav ?? 0
  const navDelta = prevNav > 0 ? ((latestNav - prevNav) / prevNav) * 100 : null

  // --- Sync freshness ---
  const lastSyncedAt = openPositions.reduce<string | null>(
    (latest, p) =>
      p.last_synced_at && (latest === null || p.last_synced_at > latest)
        ? p.last_synced_at : latest,
    null
  )
  const syncAgeHours = lastSyncedAt
    ? (Date.now() - new Date(lastSyncedAt).getTime()) / 3_600_000
    : null

  // --- NAV history for chart (TWR-indexed portfolio % + raw benchmark) ---
  let twrFactor = 1
  const navHistory = snapshots.map((s) => {
    twrFactor *= (1 + (s.daily_twr ?? 0) / 100)
    return {
      date: s.snapshot_date,
      nav: twrFactor * 100,
      benchmark: s.benchmark_value ?? 0,
    }
  })

  // --- Case pipeline ---
  const activeCases = cases.filter((c) => c.status === 'Active')
  const inactiveCases = cases.filter((c) => c.status !== 'Active')
  const scoredActive = activeCases.filter((c) => c.total_score !== null)
  const avgScore = scoredActive.length > 0
    ? scoredActive.reduce((sum, c) => sum + (c.total_score ?? 0), 0) / scoredActive.length
    : null
  const topCases = [...activeCases]
    .sort((a, b) => (b.total_score ?? 0) - (a.total_score ?? 0))
    .slice(0, 5)
    .map((c) => ({ id: c.id, ticker: c.ticker, trading_id: c.trading_id, total_score: c.total_score }))

  // --- Sector data ---
  const caseMap = new Map<string, string>(
    cases.map((c) => [c.trading_id, c.sector ?? 'Unknown'])
  )
  const sectorValues = new Map<string, number>()
  for (const pos of openPositions) {
    const sector = pos.trading_id ? (caseMap.get(pos.trading_id) ?? 'Unknown') : 'Unknown'
    const val = pos.current_price * pos.position_size_actual
    sectorValues.set(sector, (sectorValues.get(sector) ?? 0) + val)
  }
  const allSectors = Array.from(
    new Set([...sectorValues.keys(), ...Object.keys(targetAllocation)])
  ).sort()
  const sectorRisks = allSectors
    .map((sector) => {
      const val = sectorValues.get(sector) ?? 0
      const actual = totalNav > 0 ? (val / totalNav) * 100 : 0
      const target = targetAllocation[sector] ?? 0
      return { sector, actual, target, diff: actual - target }
    })
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))

  // Donut chart data (only sectors with actual positions)
  const sectorChartData = Array.from(sectorValues.entries())
    .map(([name, val]) => ({
      name,
      value: totalNav > 0 ? parseFloat(((val / totalNav) * 100).toFixed(1)) : 0,
    }))
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value)

  // --- Position timeline alerts ---
  const today = new Date()
  const caseHoldingMap = new Map<string, number>(
    cases.map((c) => [c.trading_id, c.expected_holding_period_months ?? 12])
  )
  const positionAlerts = openPositions
    .filter((p) => p.entry_date_actual && p.trading_id)
    .map((p) => {
      const holdMonths = caseHoldingMap.get(p.trading_id!) ?? 12
      const end = new Date(p.entry_date_actual!)
      end.setMonth(end.getMonth() + holdMonths)
      const daysLeft = Math.round((end.getTime() - today.getTime()) / 86_400_000)
      return { symbol: p.symbol, daysLeft, holdMonths }
    })
    .filter((p) => p.daysLeft <= 30)
    .sort((a, b) => a.daysLeft - b.daysLeft)

  const overweightSectors  = sectorRisks.filter((s) => s.diff > 5)
  const underweightSectors = sectorRisks.filter((s) => s.diff < -5)
  const staleSyncAlert = syncAgeHours !== null && syncAgeHours > 24
  const totalAlerts =
    positionAlerts.length + overweightSectors.length + underweightSectors.length + (staleSyncAlert ? 1 : 0)

  return (
    <CommandCenter
      syncAgeHours={syncAgeHours}
      todayStr={today.toISOString()}
      totalNav={totalNav}
      totalUnrealizedPnl={totalUnrealizedPnl}
      unrealizedPct={unrealizedPct}
      realizedPnlYtd={realizedPnlYtd}
      closedYtdCount={closedYtd.length}
      winRate={winRate}
      profitableTrades={profitableTrades}
      totalTrades={closedTrades.length}
      openPositionsCount={openPositions.length}
      navDelta={navDelta}
      navHistory={navHistory}
      sectorChartData={sectorChartData}
      activeCasesCount={activeCases.length}
      inactiveCasesCount={inactiveCases.length}
      avgScore={avgScore}
      topCases={topCases}
      sectorRisks={sectorRisks}
      positionAlerts={positionAlerts}
      overweightSectors={overweightSectors}
      underweightSectors={underweightSectors}
      totalAlerts={totalAlerts}
      recentCases={cases.slice(0, 7).map((c) => ({
        id: c.id,
        ticker: c.ticker,
        company_name: c.company_name,
        sector: c.sector,
        status: c.status,
        total_score: c.total_score,
        date_of_case: c.date_of_case,
      }))}
    />
  )
}
