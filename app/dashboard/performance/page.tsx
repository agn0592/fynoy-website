import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import PerformanceChart from '@/app/dashboard/components/PerformanceChart'
import PortfolioSummary from '@/app/dashboard/components/PortfolioSummary'
import {
  indexSnapshots, drawdownSeries, computeMetrics, monthlyReturns,
  fmtPct, fmtRatio,
} from '@/lib/analytics'
import DrawdownChart from './DrawdownChart'

import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Performance' }

function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface PortfolioSnapshot {
  snapshot_date: string
  total_nav: number
  benchmark_value: number
  deposits_withdrawals: number
  daily_twr: number
}

interface OpenPositionRow {
  current_price: number
  position_size_actual: number
  unrealized_pnl: number
}

interface ClosedTradeRow {
  exit_date: string
  realized_pnl: number
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function heatmapClass(pct: number): string {
  const abs = Math.abs(pct)
  if (abs < 0.001) return 'hm-empty'
  if (pct > 0) {
    if (pct >= 6) return 'hm-up-5'
    if (pct >= 4) return 'hm-up-4'
    if (pct >= 2) return 'hm-up-3'
    if (pct >= 1) return 'hm-up-2'
    if (pct >= 0.5) return 'hm-up-1'
    return 'hm-up-1'
  }
  if (pct <= -6) return 'hm-dn-5'
  if (pct <= -4) return 'hm-dn-4'
  if (pct <= -2) return 'hm-dn-3'
  if (pct <= -1) return 'hm-dn-2'
  if (pct <= -0.5) return 'hm-dn-1'
  return 'hm-dn-1'
}

function fmtDay(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
}

export default async function PerformancePage() {
  const supabase = getServiceClient()

  const [
    { data: snapshotsRaw },
    { data: openRaw },
    { data: closedRaw },
  ] = await Promise.all([
    supabase.from('portfolio_snapshots').select('*').order('snapshot_date', { ascending: true }),
    supabase.from('open_positions').select('current_price, position_size_actual, unrealized_pnl'),
    supabase.from('closed_trades').select('exit_date, realized_pnl'),
  ])

  const snapshots: PortfolioSnapshot[] = snapshotsRaw ?? []
  const openPositions: OpenPositionRow[] = openRaw ?? []
  const closedTrades: ClosedTradeRow[] = closedRaw ?? []

  // ── Performance chart input ───────────────────────────────────────
  const indexed = indexSnapshots(snapshots)
  const chartData = indexed.map((p, i) => ({
    date: p.date,
    nav: p.twrIndex,
    benchmark: snapshots[i]?.benchmark_value ?? 0,
  }))

  // ── Advanced metrics ──────────────────────────────────────────────
  const metrics = computeMetrics(snapshots)
  const dd = drawdownSeries(snapshots)
  const months = monthlyReturns(snapshots)

  // ── PortfolioSummary inputs ───────────────────────────────────────
  const totalNav = openPositions.reduce((s, p) => s + p.current_price * p.position_size_actual, 0)
  const totalUnrealized = openPositions.reduce((s, p) => s + (p.unrealized_pnl ?? 0), 0)
  const unrealizedPct = totalNav > 0 ? (totalUnrealized / totalNav) * 100 : 0
  const ytdStart = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10)
  const realizedYtd = closedTrades.filter(t => t.exit_date >= ytdStart).reduce((s, t) => s + (t.realized_pnl ?? 0), 0)
  const realizedYtdPct = totalNav > 0 ? (realizedYtd / totalNav) * 100 : 0

  // ── Build heatmap rows: year → 12 monthly buckets ─────────────────
  const years = Array.from(new Set(months.map(m => m.year))).sort((a, b) => b - a)
  const cellByKey = new Map<string, number>(months.map(m => [`${m.year}-${m.month}`, m.pct]))

  return (
    <>
      <div className="dash-page-head">
        <div className="dash-page-title-block">
          <h1 className="dash-page-title"><em>Performance</em></h1>
          <div className="dash-page-sub">Time-weighted returns, risk-adjusted metrics, drawdowns.</div>
        </div>
      </div>

      <PerformanceChart data={chartData} />

      <div className="dash-grid" style={{ marginTop: 16 }}>
        <div className="dash-col">
          {/* Advanced metrics — inline custom card */}
          <div className="dash-card">
            <div className="dash-card-header">
              <div>
                <div className="dash-card-title">Advanced Metrics</div>
                <div className="dash-card-sub">Risk-adjusted performance &amp; tail behaviour</div>
              </div>
            </div>
            <div className="dash-stats-stack" style={{ marginTop: 12 }}>
              <div className="dash-stat-cell">
                <div className="dash-stat-label">Sharpe</div>
                <div className={`dash-stat-val ${metrics.sharpeRatio >= 0 ? 'up' : 'dn'}`}>
                  {fmtRatio(metrics.sharpeRatio)}
                </div>
                <div className="dash-stat-sub">Annualized</div>
                <div className={`dash-stat-glow ${metrics.sharpeRatio >= 0 ? 'up' : 'dn'}`} />
              </div>
              <div className="dash-stat-cell">
                <div className="dash-stat-label">Sortino</div>
                <div className={`dash-stat-val ${metrics.sortinoRatio >= 0 ? 'up' : 'dn'}`}>
                  {fmtRatio(metrics.sortinoRatio)}
                </div>
                <div className="dash-stat-sub">Downside only</div>
                <div className={`dash-stat-glow ${metrics.sortinoRatio >= 0 ? 'up' : 'dn'}`} />
              </div>
              <div className="dash-stat-cell">
                <div className="dash-stat-label">Calmar</div>
                <div className={`dash-stat-val ${metrics.calmarRatio >= 0 ? 'up' : 'dn'}`}>
                  {fmtRatio(metrics.calmarRatio)}
                </div>
                <div className="dash-stat-sub">Return / max DD</div>
                <div className={`dash-stat-glow ${metrics.calmarRatio >= 0 ? 'up' : 'dn'}`} />
              </div>
              <div className="dash-stat-cell">
                <div className="dash-stat-label">Volatility</div>
                <div className="dash-stat-val flat">{metrics.volatilityPct.toFixed(2)}%</div>
                <div className="dash-stat-sub">Annualized σ</div>
                <div className="dash-stat-glow flat" />
              </div>
              <div className="dash-stat-cell">
                <div className="dash-stat-label">Max drawdown</div>
                <div className="dash-stat-val dn">
                  {metrics.maxDrawdownPct.toFixed(2)}%
                </div>
                <div className="dash-stat-sub">{metrics.maxDrawdownDays} days</div>
                <div className="dash-stat-glow dn" />
              </div>
              <div className="dash-stat-cell">
                <div className="dash-stat-label">Current DD</div>
                <div className={`dash-stat-val ${metrics.currentDrawdownPct < -0.01 ? 'dn' : 'flat'}`}>
                  {metrics.currentDrawdownPct.toFixed(2)}%
                </div>
                <div className="dash-stat-sub">From peak</div>
                <div className={`dash-stat-glow ${metrics.currentDrawdownPct < -0.01 ? 'dn' : 'flat'}`} />
              </div>
              <div className="dash-stat-cell">
                <div className="dash-stat-label">Beta vs VWCE</div>
                <div className="dash-stat-val flat">
                  {metrics.betaVsBenchmark != null ? fmtRatio(metrics.betaVsBenchmark) : '—'}
                </div>
                <div className="dash-stat-sub">Market sensitivity</div>
                <div className="dash-stat-glow flat" />
              </div>
              <div className="dash-stat-cell">
                <div className="dash-stat-label">Pos / Neg days</div>
                <div className="dash-stat-val flat">
                  {metrics.positiveDays} / {metrics.negativeDays}
                </div>
                <div className="dash-stat-sub">of {metrics.totalDays} total</div>
                <div className="dash-stat-glow flat" />
              </div>
              <div className="dash-stat-cell">
                <div className="dash-stat-label">Best day</div>
                <div className="dash-stat-val up">
                  {metrics.bestDay ? fmtPct(metrics.bestDay.pct) : '—'}
                </div>
                <div className="dash-stat-sub">{metrics.bestDay ? fmtDay(metrics.bestDay.date) : '—'}</div>
                <div className="dash-stat-glow up" />
              </div>
              <div className="dash-stat-cell">
                <div className="dash-stat-label">Worst day</div>
                <div className="dash-stat-val dn">
                  {metrics.worstDay ? fmtPct(metrics.worstDay.pct) : '—'}
                </div>
                <div className="dash-stat-sub">{metrics.worstDay ? fmtDay(metrics.worstDay.date) : '—'}</div>
                <div className="dash-stat-glow dn" />
              </div>
            </div>
          </div>

          <DrawdownChart data={dd} />

          {/* Monthly returns heatmap */}
          <div className="dash-card">
            <div className="dash-card-header">
              <div>
                <div className="dash-card-title">Monthly returns</div>
                <div className="dash-card-sub">Chained daily TWR per calendar month</div>
              </div>
            </div>
            <div className="dash-card-body">
              {years.length === 0 ? (
                <div className="dash-empty">No monthly data yet</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <div
                    className="heatmap-grid"
                    style={{
                      gridTemplateColumns: '40px repeat(12, minmax(34px, 1fr))',
                      minWidth: 480,
                    }}
                  >
                    {/* Header row */}
                    <div />
                    {MONTH_LABELS.map(m => (
                      <div
                        key={m}
                        style={{
                          fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase',
                          color: 'var(--ink-dim)', textAlign: 'center', padding: '4px 0',
                        }}
                      >
                        {m}
                      </div>
                    ))}

                    {/* Year rows */}
                    {years.map(year => (
                      <div key={year} style={{ display: 'contents' }}>
                        <div
                          style={{
                            fontSize: 11, color: 'var(--ink-mute)',
                            display: 'flex', alignItems: 'center', fontFamily: 'var(--serif)',
                          }}
                        >
                          {year}
                        </div>
                        {MONTH_LABELS.map((_, mi) => {
                          const key = `${year}-${mi}`
                          const pct = cellByKey.get(key)
                          if (pct == null) {
                            return <div key={key} className="heatmap-cell hm-empty" title="No data" />
                          }
                          return (
                            <div
                              key={key}
                              className={`heatmap-cell ${heatmapClass(pct)}`}
                              title={`${MONTH_LABELS[mi]} ${year}: ${fmtPct(pct)}`}
                            >
                              {Math.abs(pct) >= 0.1 ? `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}` : ''}
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="dash-col">
          <PortfolioSummary
            unrealizedPnlPct={unrealizedPct}
            realizedPnlYtdPct={realizedYtdPct}
            openPositionsCount={openPositions.length}
            twrPct={metrics.twrPct}
            vwcePct={metrics.vwcePct}
            alphaPct={metrics.alphaPct}
            inceptionDate="1 Jan 2026"
          />
        </div>
      </div>
    </>
  )
}
