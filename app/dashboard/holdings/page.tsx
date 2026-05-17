import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import PositionsTable from '@/app/dashboard/components/PositionsTable'
import SectorAllocation from '@/app/dashboard/components/SectorAllocation'
import PositionTimeline, { type TimelinePosition } from '@/app/dashboard/components/PositionTimeline'
import { concentrationStats, fmtEUR, fmtNum } from '@/lib/analytics'

import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Holdings' }

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
  entry_date_actual: string | null
}

interface CaseRow {
  trading_id: string
  sector: string | null
  expected_holding_period_months: number | null
  take_profit: number | null
  stop_loss: number | null
}

const SECTOR_FALLBACK: Record<string, string> = {
  I500: 'ETF', IBM: 'Technology', LLY: 'Healthcare',
MSFT: 'Technology', ORCL: 'Technology', PLTR: 'Technology',
  V: 'Financials', RHM: 'Industrials', PANW: 'Technology',
}

export default async function HoldingsPage() {
  const supabase = getServiceClient()

  const [
    { data: openPositionsRaw },
    { data: casesRaw },
  ] = await Promise.all([
    supabase.from('open_positions').select('*'),
    supabase.from('cases').select('trading_id, sector, expected_holding_period_months, take_profit, stop_loss'),
  ])

  const openPositions: OpenPosition[] = openPositionsRaw ?? []
  const cases: CaseRow[] = casesRaw ?? []
  const caseByTradingId = new Map<string, CaseRow>(cases.map(c => [c.trading_id, c]))

  // ── KPIs ──────────────────────────────────────────────────────────
  const totalNav = openPositions.reduce((s, p) => s + p.current_price * p.position_size_actual, 0)
  const stats = concentrationStats(openPositions.map(p => ({
    symbol: p.symbol,
    pct_of_nav: p.pct_of_nav,
    current_price: p.current_price,
    position_size_actual: p.position_size_actual,
  })))
  const avgWeight = openPositions.length > 0
    ? openPositions.reduce((s, p) => s + (p.pct_of_nav ?? 0), 0) / openPositions.length
    : 0

  // ── Sector data ────────────────────────────────────────────────────
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
  const sectorCount = sectorData.length

  // ── Position rows ──────────────────────────────────────────────────
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

  // ── Timeline ───────────────────────────────────────────────────────
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

  return (
    <>
      <div className="dash-page-head">
        <div className="dash-page-title-block">
          <h1 className="dash-page-title"><em>Holdings</em></h1>
          <div className="dash-page-sub">Your live portfolio positions.</div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="adm-kpi-grid" style={{ marginBottom: 20 }}>
        <div className="adm-kpi">
          <div className="adm-kpi-label">Total NAV</div>
          <div className="adm-kpi-val">{fmtEUR(totalNav)}</div>
          <div className="adm-kpi-sub">Current value</div>
        </div>
        <div className="adm-kpi">
          <div className="adm-kpi-label">Positions</div>
          <div className="adm-kpi-val">{openPositions.length}</div>
          <div className="adm-kpi-sub">Open holdings</div>
        </div>
        <div className="adm-kpi">
          <div className="adm-kpi-label">Largest weight</div>
          <div className="adm-kpi-val">{stats.largest ? `${stats.largest.pct.toFixed(1)}%` : '—'}</div>
          <div className="adm-kpi-sub">{stats.largest?.symbol ?? '—'}</div>
        </div>
        <div className="adm-kpi">
          <div className="adm-kpi-label">Avg position</div>
          <div className="adm-kpi-val">{openPositions.length > 0 ? `${avgWeight.toFixed(1)}%` : '—'}</div>
          <div className="adm-kpi-sub">Per position</div>
        </div>
        <div className="adm-kpi">
          <div className="adm-kpi-label">Sectors</div>
          <div className="adm-kpi-val">{sectorCount}</div>
          <div className="adm-kpi-sub">Distinct sectors</div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="dash-grid">
        <div className="dash-col">
          <PositionsTable positions={positionRows} />
          {timelinePositions.length > 0 && (
            <PositionTimeline positions={timelinePositions} />
          )}
        </div>

        <div className="dash-col">
          <SectorAllocation data={sectorData} />

          <div className="dash-card">
            <div className="dash-card-header">
              <div>
                <div className="dash-card-title">Concentration</div>
                <div className="dash-card-sub">Portfolio risk overview</div>
              </div>
            </div>
            <div className="dash-stats-stack" style={{ marginTop: 12 }}>
              <div className="dash-stat-cell">
                <div className="dash-stat-label">Top 1 weight</div>
                <div className="dash-stat-val flat">{stats.top1Pct.toFixed(1)}%</div>
                <div className="dash-stat-glow flat" />
              </div>
              <div className="dash-stat-cell">
                <div className="dash-stat-label">Top 3 weight</div>
                <div className="dash-stat-val flat">{stats.top3Pct.toFixed(1)}%</div>
                <div className="dash-stat-glow flat" />
              </div>
              <div className="dash-stat-cell">
                <div className="dash-stat-label">Top 5 weight</div>
                <div className="dash-stat-val flat">{stats.top5Pct.toFixed(1)}%</div>
                <div className="dash-stat-glow flat" />
              </div>
              <div className="dash-stat-cell">
                <div className="dash-stat-label">Herfindahl</div>
                <div className="dash-stat-val flat">{fmtNum(stats.herfindahl, 0)}</div>
                <div className="dash-stat-sub">HHI score</div>
                <div className="dash-stat-glow flat" />
              </div>
              <div className="dash-stat-cell full-width">
                <div className="dash-stat-label">Effective # holdings</div>
                <div className="dash-stat-val flat">{stats.effectiveCount.toFixed(1)}</div>
                <div className="dash-stat-sub">vs {openPositions.length} actual</div>
                <div className="dash-stat-glow flat" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
