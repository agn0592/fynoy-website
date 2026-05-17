'use client'

import { useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  BarChart,
  Bar,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'
import {
  fmtPct,
  fmtEUR,
  fmtRatio,
  type AdvancedMetrics,
} from '@/lib/analytics'
import {
  IconActivity,
  IconChart,
  IconTrendingUp,
  IconTrendingDown,
  IconBalance,
  IconCalendar,
  IconAlertCircle,
  IconCheck,
} from '@/app/dashboard/components/Icons'
import DrawdownChart from './DrawdownChart'
import MonthlyHeatmap from './MonthlyHeatmap'

interface IndexedPoint {
  date: string
  twrIndex: number
  nav: number
  benchmark: number | null
}

interface DDPoint {
  date: string
  dd: number
  underwater: boolean
}

interface MonthlyReturn {
  year: number
  month: number
  pct: number
}

interface ReturnDistBucket {
  bucket: string
  count: number
  mid: number
}

interface HoldingBucket {
  bucket: string
  count: number
  avgReturn: number
}

interface ConcentrationStats {
  top1Pct: number
  top3Pct: number
  top5Pct: number
  herfindahl: number
  effectiveCount: number
  largest: { symbol: string; pct: number } | null
}

interface SectorRow {
  sector: string
  pct: number
}

interface SectorContribRow {
  sector: string
  pnl: number
}

interface TradeRow {
  symbol: string
  sector: string
  realized_pnl: number
  realized_pnl_pct: number
  holding_period_days: number
  exit_date: string | null
}

interface ScatterPoint {
  x: number
  y: number
  symbol: string
}

export interface AnalyticsViewProps {
  metrics: AdvancedMetrics
  indexed: IndexedPoint[]
  drawdowns: DDPoint[]
  monthly: MonthlyReturn[]
  returnDist: ReturnDistBucket[]
  holdingDist: HoldingBucket[]
  concentration: ConcentrationStats
  sectorRows: SectorRow[]
  sectorContrib: SectorContribRow[]
  topWinners: TradeRow[]
  topLosers: TradeRow[]
  longestWin: number
  longestLoss: number
  scatterData: ScatterPoint[]
  totalClosedTrades: number
}

type TabKey = 'performance' | 'risk' | 'distribution' | 'attribution'
type FilterKey = '1M' | '3M' | '6M' | 'YTD' | '1Y' | 'All'

const FILTERS: FilterKey[] = ['1M', '3M', '6M', 'YTD', '1Y', 'All']

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
}
function fmtShortDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

function filterIndexed(data: IndexedPoint[], f: FilterKey): IndexedPoint[] {
  if (!data.length || f === 'All') return data
  const now = new Date()
  let cutoff: Date
  if (f === 'YTD') {
    cutoff = new Date(now.getFullYear(), 0, 1)
  } else {
    cutoff = new Date(now)
    const months: Record<string, number> = { '1M': 1, '3M': 3, '6M': 6, '1Y': 12 }
    cutoff.setMonth(cutoff.getMonth() - (months[f] ?? 0))
  }
  return data.filter((d) => new Date(d.date) >= cutoff)
}

function rebaseTo100(data: IndexedPoint[]) {
  if (!data.length) return [] as { date: string; portfolio: number; benchmark: number | null }[]
  const startTwr = data[0].twrIndex
  const startBench = data.find((d) => d.benchmark != null)?.benchmark ?? null
  return data.map((d) => ({
    date: d.date,
    portfolio: startTwr > 0 ? ((d.twrIndex - startTwr) / startTwr) * 100 : 0,
    benchmark: d.benchmark != null && startBench != null && startBench > 0
      ? ((d.benchmark - startBench) / startBench) * 100
      : null,
  }))
}

function sharpeColorClass(s: number): 'up' | 'dn' | 'flat' {
  if (s > 1.5) return 'up'
  if (s > 0.5) return 'flat'
  return 'dn'
}

function returnTone(v: number): 'up' | 'dn' | 'flat' {
  if (v > 0) return 'up'
  if (v < 0) return 'dn'
  return 'flat'
}

interface PerfTipPayload {
  name: string
  value: number | null
  color: string
}

function PerformanceTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: PerfTipPayload[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="dash-tooltip">
      <div className="dash-tooltip-date">{label ? fmtDate(label) : ''}</div>
      {payload.map((p) => (
        <div key={p.name} className="dash-tooltip-row">
          <span className="dash-tooltip-label">{p.name}</span>
          <span className="dash-tooltip-val" style={{ color: p.color }}>
            {p.value != null ? `${p.value >= 0 ? '+' : ''}${p.value.toFixed(2)}%` : '—'}
          </span>
        </div>
      ))}
    </div>
  )
}

interface DistTipPayload {
  value: number
  payload: { bucket: string; mid?: number; avgReturn?: number }
}

function ReturnDistTooltip({ active, payload }: { active?: boolean; payload?: DistTipPayload[] }) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div className="dash-tooltip">
      <div className="dash-tooltip-date">{p.payload.bucket}</div>
      <div className="dash-tooltip-row">
        <span className="dash-tooltip-label">Trades</span>
        <span className="dash-tooltip-val">{p.value}</span>
      </div>
    </div>
  )
}

function HoldingDistTooltip({ active, payload }: { active?: boolean; payload?: DistTipPayload[] }) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div className="dash-tooltip">
      <div className="dash-tooltip-date">{p.payload.bucket}</div>
      <div className="dash-tooltip-row">
        <span className="dash-tooltip-label">Trades</span>
        <span className="dash-tooltip-val">{p.value}</span>
      </div>
      <div className="dash-tooltip-row">
        <span className="dash-tooltip-label">Avg return</span>
        <span
          className="dash-tooltip-val"
          style={{ color: (p.payload.avgReturn ?? 0) >= 0 ? 'var(--dash-green)' : 'var(--dash-red)' }}
        >
          {p.payload.avgReturn != null ? `${p.payload.avgReturn >= 0 ? '+' : ''}${p.payload.avgReturn.toFixed(2)}%` : '—'}
        </span>
      </div>
    </div>
  )
}

interface ScatterTipPayload {
  payload: ScatterPoint
}

function ScatterTooltip({ active, payload }: { active?: boolean; payload?: ScatterTipPayload[] }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="dash-tooltip">
      <div className="dash-tooltip-date">{p.symbol}</div>
      <div className="dash-tooltip-row">
        <span className="dash-tooltip-label">Held</span>
        <span className="dash-tooltip-val">{p.x} d</span>
      </div>
      <div className="dash-tooltip-row">
        <span className="dash-tooltip-label">Return</span>
        <span
          className="dash-tooltip-val"
          style={{ color: p.y >= 0 ? 'var(--dash-green)' : 'var(--dash-red)' }}
        >
          {p.y >= 0 ? '+' : ''}{p.y.toFixed(2)}%
        </span>
      </div>
    </div>
  )
}

export default function AnalyticsView(props: AnalyticsViewProps) {
  const {
    metrics, indexed, drawdowns, monthly, returnDist, holdingDist, concentration,
    sectorRows, sectorContrib, topWinners, topLosers, longestWin, longestLoss,
    scatterData, totalClosedTrades,
  } = props

  const [tab, setTab] = useState<TabKey>('performance')
  const [filter, setFilter] = useState<FilterKey>('All')

  const filteredPerformance = useMemo(
    () => rebaseTo100(filterIndexed(indexed, filter)),
    [indexed, filter],
  )

  // YTD summary stats
  const currentYear = new Date().getFullYear()
  const ytdMonths = monthly.filter((m) => m.year === currentYear)
  const ytdReturn = useMemo(() => {
    if (ytdMonths.length === 0) return 0
    let factor = 1
    for (const m of ytdMonths) factor *= 1 + m.pct / 100
    return (factor - 1) * 100
  }, [ytdMonths])
  const bestMonth = monthly.length > 0
    ? monthly.reduce((acc, m) => (m.pct > acc.pct ? m : acc), monthly[0])
    : null
  const worstMonth = monthly.length > 0
    ? monthly.reduce((acc, m) => (m.pct < acc.pct ? m : acc), monthly[0])
    : null
  const avgMonthly = monthly.length > 0
    ? monthly.reduce((s, m) => s + m.pct, 0) / monthly.length
    : 0
  const positiveMonths = monthly.filter((m) => m.pct > 0).length
  const totalMonths = monthly.length

  // Trendline for scatter (simple linear regression)
  const trendline = useMemo(() => {
    if (scatterData.length < 2) return null
    const n = scatterData.length
    const sumX = scatterData.reduce((s, p) => s + p.x, 0)
    const sumY = scatterData.reduce((s, p) => s + p.y, 0)
    const sumXY = scatterData.reduce((s, p) => s + p.x * p.y, 0)
    const sumXX = scatterData.reduce((s, p) => s + p.x * p.x, 0)
    const denom = n * sumXX - sumX * sumX
    if (denom === 0) return null
    const slope = (n * sumXY - sumX * sumY) / denom
    const intercept = (sumY - slope * sumX) / n
    const xs = scatterData.map((p) => p.x)
    const xMin = Math.min(...xs)
    const xMax = Math.max(...xs)
    return [
      { x: xMin, y: slope * xMin + intercept },
      { x: xMax, y: slope * xMax + intercept },
    ]
  }, [scatterData])

  // Sector contribution scaling
  const maxSectorAbs = Math.max(1, ...sectorContrib.map((s) => Math.abs(s.pnl)))

  // KPI values
  const totalReturn = metrics.twrPct
  const alpha = metrics.alphaPct
  const sharpe = metrics.sharpeRatio
  const maxDD = metrics.maxDrawdownPct
  const vol = metrics.volatilityPct

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── KPI Strip ── */}
      <div className="adm-kpi-grid">
        <div className={`adm-kpi ${totalReturn >= 0 ? 'kpi-up' : 'kpi-dn'}`}>
          <div className="adm-kpi-label">Total Return (TWR)</div>
          <div className={`adm-kpi-val ${returnTone(totalReturn)}`}>{fmtPct(totalReturn)}</div>
          <div className="adm-kpi-sub">Time-weighted, all-time</div>
        </div>
        <div className={`adm-kpi ${alpha == null ? 'kpi-neutral' : alpha >= 0 ? 'kpi-up' : 'kpi-dn'}`}>
          <div className="adm-kpi-label">Alpha vs VWCE</div>
          <div className={`adm-kpi-val ${alpha == null ? 'flat' : returnTone(alpha)}`}>
            {alpha == null ? '—' : fmtPct(alpha)}
          </div>
          <div className="adm-kpi-sub">vs benchmark</div>
        </div>
        <div className={`adm-kpi ${sharpe > 1.5 ? 'kpi-up' : sharpe > 0.5 ? '' : 'kpi-dn'}`}>
          <div className="adm-kpi-label">Sharpe Ratio</div>
          <div className={`adm-kpi-val ${sharpeColorClass(sharpe)}`}>{fmtRatio(sharpe)}</div>
          <div className="adm-kpi-sub">vs 0% risk-free</div>
        </div>
        <div className="adm-kpi kpi-dn">
          <div className="adm-kpi-label">Max Drawdown</div>
          <div className="adm-kpi-val dn">{fmtPct(maxDD)}</div>
          <div className="adm-kpi-sub">{metrics.maxDrawdownDays} days</div>
        </div>
        <div className="adm-kpi kpi-neutral">
          <div className="adm-kpi-label">Volatility</div>
          <div className="adm-kpi-val">{fmtPct(vol, 1)}</div>
          <div className="adm-kpi-sub">Annualized</div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="dash-tabs" role="tablist" aria-label="Analytics sections">
        {(
          [
            { key: 'performance', label: 'Performance', icon: <IconChart /> },
            { key: 'risk', label: 'Risk', icon: <IconAlertCircle /> },
            { key: 'distribution', label: 'Distribution', icon: <IconActivity /> },
            { key: 'attribution', label: 'Attribution', icon: <IconBalance /> },
          ] as { key: TabKey; label: string; icon: React.ReactNode }[]
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            className={`dash-tab${tab === t.key ? ' is-active' : ''}`}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <span style={{ display: 'inline-flex', width: 14, height: 14 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Performance tab ── */}
      {tab === 'performance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Big TWR chart */}
          <div className="dash-card">
            <div className="dash-card-header">
              <div>
                <div className="dash-card-title">Portfolio vs Benchmark</div>
                <div className="dash-card-sub">Indexed to 0% at start of period</div>
                <div className="dash-chart-legend">
                  <div className="dash-legend-item">
                    <div className="dash-legend-dot" style={{ background: 'var(--gold)' }} />
                    <span>Portfolio (TWR)</span>
                  </div>
                  <div className="dash-legend-item">
                    <div
                      className="dash-legend-line"
                      style={{ background: '#a8a8a0', borderTop: '1.5px dashed #a8a8a0', height: 0 }}
                    />
                    <span>VWCE</span>
                  </div>
                </div>
              </div>
              <div className="dash-chart-filters">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={`dash-filter${filter === f ? ' active' : ''}`}
                    onClick={() => setFilter(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="dash-card-body" style={{ paddingTop: 12 }}>
              {filteredPerformance.length > 1 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart data={filteredPerformance} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="anaPortfolioGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#c9a96e" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#c9a96e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(232,228,220,0.06)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: 'var(--ink-dim)', fontSize: 10 }}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(232,228,220,0.08)' }}
                      tickFormatter={fmtShortDate}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tickFormatter={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(0)}%`}
                      tick={{ fill: 'var(--ink-dim)', fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      width={48}
                    />
                    <ReferenceLine y={0} stroke="rgba(232,228,220,0.12)" />
                    <Tooltip
                      content={<PerformanceTooltip />}
                      cursor={{ stroke: 'rgba(201,169,110,0.18)', strokeWidth: 1 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="portfolio"
                      name="Portfolio"
                      stroke="#c9a96e"
                      strokeWidth={2.5}
                      fill="url(#anaPortfolioGrad)"
                      dot={false}
                      activeDot={{ r: 4, fill: '#c9a96e', stroke: 'var(--navy)', strokeWidth: 2 }}
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="benchmark"
                      name="VWCE"
                      stroke="#a8a8a0"
                      strokeWidth={1.5}
                      strokeDasharray="5 3"
                      dot={false}
                      activeDot={{ r: 3, fill: '#a8a8a0', stroke: 'var(--navy)', strokeWidth: 2 }}
                      isAnimationActive={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="dash-empty">Not enough snapshot data for this range.</div>
              )}
            </div>
          </div>

          {/* Drawdown chart */}
          <div className="dash-card">
            <div className="dash-card-header">
              <div>
                <div className="dash-card-title">Drawdown</div>
                <div className="dash-card-sub">Depth below all-time high</div>
              </div>
              <div style={{
                color: 'var(--dash-red)',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'var(--serif)',
              }}>
                Current {fmtPct(metrics.currentDrawdownPct)}
              </div>
            </div>
            <div className="dash-card-body" style={{ paddingTop: 12 }}>
              <DrawdownChart data={drawdowns} />
            </div>
          </div>

          {/* Two-column grid: heatmap + YTD summary */}
          <div className="dash-grid">
            <div className="dash-col">
              <div className="dash-card">
                <div className="dash-card-header">
                  <div>
                    <div className="dash-card-title">Monthly Returns</div>
                    <div className="dash-card-sub">Chained daily TWR by month</div>
                  </div>
                  <div style={{ display: 'inline-flex', color: 'var(--ink-dim)' }}>
                    <IconCalendar />
                  </div>
                </div>
                <div className="dash-card-body">
                  <MonthlyHeatmap data={monthly} />
                </div>
              </div>
            </div>

            <div className="dash-col">
              <div className="dash-card">
                <div className="dash-card-header">
                  <div>
                    <div className="dash-card-title">Year-to-Date Summary</div>
                    <div className="dash-card-sub">{currentYear} performance breakdown</div>
                  </div>
                </div>
                <div className="dash-stats-stack" style={{ marginTop: 4 }}>
                  <div className="dash-stat-cell full-width">
                    <div className="dash-stat-label">YTD Return</div>
                    <div className={`dash-stat-val ${returnTone(ytdReturn)}`}>{fmtPct(ytdReturn)}</div>
                    <div className="dash-stat-sub">{ytdMonths.length} month{ytdMonths.length === 1 ? '' : 's'} in {currentYear}</div>
                    <div className={`dash-stat-glow ${returnTone(ytdReturn)}`} />
                  </div>
                  <div className="dash-stat-cell">
                    <div className="dash-stat-label">Best Month</div>
                    <div className="dash-stat-val up">{bestMonth ? fmtPct(bestMonth.pct) : '—'}</div>
                    <div className="dash-stat-sub">
                      {bestMonth ? `${monthLabel(bestMonth.month)} ${bestMonth.year}` : '—'}
                    </div>
                  </div>
                  <div className="dash-stat-cell">
                    <div className="dash-stat-label">Worst Month</div>
                    <div className="dash-stat-val dn">{worstMonth ? fmtPct(worstMonth.pct) : '—'}</div>
                    <div className="dash-stat-sub">
                      {worstMonth ? `${monthLabel(worstMonth.month)} ${worstMonth.year}` : '—'}
                    </div>
                  </div>
                  <div className="dash-stat-cell">
                    <div className="dash-stat-label">Avg Monthly</div>
                    <div className={`dash-stat-val ${returnTone(avgMonthly)}`}>{fmtPct(avgMonthly)}</div>
                    <div className="dash-stat-sub">Across all months</div>
                  </div>
                  <div className="dash-stat-cell">
                    <div className="dash-stat-label">Positive Months</div>
                    <div className="dash-stat-val flat">{positiveMonths} / {totalMonths}</div>
                    <div className="dash-stat-sub">
                      {totalMonths > 0 ? `${((positiveMonths / totalMonths) * 100).toFixed(0)}% hit rate` : '—'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Risk tab ── */}
      {tab === 'risk' && (
        <div className="dash-grid">
          <div className="dash-col">
            <div className="dash-card">
              <div className="dash-card-header">
                <div>
                  <div className="dash-card-title">Advanced Risk Metrics</div>
                  <div className="dash-card-sub">Annualized unless noted</div>
                </div>
                <div style={{ display: 'inline-flex', color: 'var(--ink-dim)' }}>
                  <IconAlertCircle />
                </div>
              </div>
              <div className="dash-stats-stack" style={{ marginTop: 4 }}>
                <RiskCell label="Volatility" val={fmtPct(metrics.volatilityPct, 1)} tone="flat" sub="Annualized stdev" />
                <RiskCell
                  label="Sharpe"
                  val={fmtRatio(metrics.sharpeRatio)}
                  tone={sharpeColorClass(metrics.sharpeRatio)}
                  sub="(Ret − Rf) / σ"
                />
                <RiskCell
                  label="Sortino"
                  val={fmtRatio(metrics.sortinoRatio)}
                  tone={metrics.sortinoRatio > 1.5 ? 'up' : metrics.sortinoRatio > 0.5 ? 'flat' : 'dn'}
                  sub="Downside-only σ"
                />
                <RiskCell
                  label="Calmar"
                  val={fmtRatio(metrics.calmarRatio)}
                  tone={metrics.calmarRatio > 1 ? 'up' : metrics.calmarRatio > 0 ? 'flat' : 'dn'}
                  sub="CAGR / |max DD|"
                />
                <RiskCell
                  label="Beta vs VWCE"
                  val={fmtRatio(metrics.betaVsBenchmark)}
                  tone="flat"
                  sub="<1 = less sensitive"
                />
                <RiskCell
                  label="Current Drawdown"
                  val={fmtPct(metrics.currentDrawdownPct)}
                  tone={metrics.currentDrawdownPct < -0.1 ? 'dn' : 'flat'}
                  sub="From all-time high"
                />
                <RiskCell
                  label="Best Day"
                  val={metrics.bestDay ? fmtPct(metrics.bestDay.pct) : '—'}
                  tone="up"
                  sub={metrics.bestDay ? fmtDate(metrics.bestDay.date) : '—'}
                />
                <RiskCell
                  label="Worst Day"
                  val={metrics.worstDay ? fmtPct(metrics.worstDay.pct) : '—'}
                  tone="dn"
                  sub={metrics.worstDay ? fmtDate(metrics.worstDay.date) : '—'}
                />
                <RiskCell
                  label="Positive Days"
                  val={`${metrics.positiveDays} / ${metrics.totalDays}`}
                  tone="flat"
                  sub={metrics.totalDays > 0 ? `${((metrics.positiveDays / metrics.totalDays) * 100).toFixed(0)}% of sessions` : '—'}
                  fullWidth
                />
              </div>
            </div>
          </div>

          <div className="dash-col">
            {/* Concentration */}
            <div className="dash-card">
              <div className="dash-card-header">
                <div>
                  <div className="dash-card-title">Concentration</div>
                  <div className="dash-card-sub">Open position weights</div>
                </div>
                <div style={{ display: 'inline-flex', color: 'var(--ink-dim)' }}>
                  <IconBalance />
                </div>
              </div>
              <div className="dash-card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--ink-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    HHI Index
                  </div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 500, color: 'var(--gold)' }}>
                    {(concentration.herfindahl / 10000).toFixed(3)}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-dim)', marginBottom: 14 }}>
                  1 = monopoly, 0 = perfectly spread
                </div>

                <ConcentrationBar label="Top 1" value={concentration.top1Pct} />
                <ConcentrationBar label="Top 3" value={concentration.top3Pct} />
                <ConcentrationBar label="Top 5" value={concentration.top5Pct} />

                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  paddingTop: 14, marginTop: 14, borderTop: '1px solid var(--line)',
                }}>
                  <div style={{ fontSize: 11, color: 'var(--ink-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Effective Holdings
                  </div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>
                    {concentration.effectiveCount > 0 ? concentration.effectiveCount.toFixed(1) : '—'}
                  </div>
                </div>
                {concentration.largest && (
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    marginTop: 8,
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--ink-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Largest Position
                    </div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: 13, color: 'var(--ink)' }}>
                      <span style={{ fontWeight: 600 }}>{concentration.largest.symbol}</span>
                      <span style={{ color: 'var(--gold)', marginLeft: 8 }}>{concentration.largest.pct.toFixed(1)}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sector exposure */}
            <div className="dash-card">
              <div className="dash-card-header">
                <div>
                  <div className="dash-card-title">Sector Exposure</div>
                  <div className="dash-card-sub">Current weight (open positions)</div>
                </div>
              </div>
              <div className="dash-card-body">
                {sectorRows.length === 0 ? (
                  <div className="dash-empty">No open positions yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {sectorRows.map((s) => (
                      <div key={s.sector}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ color: 'var(--ink-mute)', fontSize: 12 }}>{s.sector}</span>
                          <span style={{
                            color: 'var(--ink)',
                            fontSize: 12,
                            fontFamily: 'var(--serif)',
                            fontWeight: 600,
                          }}>
                            {s.pct.toFixed(1)}%
                          </span>
                        </div>
                        <div style={{
                          height: 6,
                          background: 'rgba(232,228,220,0.06)',
                          borderRadius: 2,
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${Math.min(s.pct, 100)}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, var(--gold), #e8c98a)',
                            transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Distribution tab ── */}
      {tab === 'distribution' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Return distribution histogram */}
          <div className="dash-card">
            <div className="dash-card-header">
              <div>
                <div className="dash-card-title">Return Distribution</div>
                <div className="dash-card-sub">Closed trades, bucketed by P&amp;L %</div>
              </div>
              <div style={{ display: 'inline-flex', color: 'var(--ink-dim)' }}>
                <IconActivity />
              </div>
            </div>
            <div className="dash-card-body">
              {totalClosedTrades === 0 ? (
                <div className="dash-empty">No closed trades yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={returnDist} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(232,228,220,0.06)" vertical={false} />
                    <XAxis
                      dataKey="bucket"
                      tick={{ fill: 'var(--ink-dim)', fontSize: 10 }}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(232,228,220,0.08)' }}
                      interval={0}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: 'var(--ink-dim)', fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      width={32}
                    />
                    <Tooltip
                      content={<ReturnDistTooltip />}
                      cursor={{ fill: 'rgba(201,169,110,0.06)' }}
                    />
                    <Bar dataKey="count" radius={[2, 2, 0, 0]} isAnimationActive={false}>
                      {returnDist.map((b, i) => (
                        <Cell
                          key={i}
                          fill={b.mid > 0 ? '#4ade80' : b.mid < 0 ? '#f87171' : '#c9a96e'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Two-column: holding period + streaks */}
          <div className="dash-grid">
            <div className="dash-col">
              <div className="dash-card">
                <div className="dash-card-header">
                  <div>
                    <div className="dash-card-title">Holding Period</div>
                    <div className="dash-card-sub">Trade count + avg return per bucket</div>
                  </div>
                </div>
                <div className="dash-card-body">
                  {totalClosedTrades === 0 ? (
                    <div className="dash-empty">No closed trades yet.</div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={holdingDist} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                          <CartesianGrid stroke="rgba(232,228,220,0.06)" vertical={false} />
                          <XAxis
                            dataKey="bucket"
                            tick={{ fill: 'var(--ink-dim)', fontSize: 10 }}
                            tickLine={false}
                            axisLine={{ stroke: 'rgba(232,228,220,0.08)' }}
                            interval={0}
                          />
                          <YAxis
                            allowDecimals={false}
                            tick={{ fill: 'var(--ink-dim)', fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                            width={28}
                          />
                          <Tooltip
                            content={<HoldingDistTooltip />}
                            cursor={{ fill: 'rgba(201,169,110,0.06)' }}
                          />
                          <Bar dataKey="count" fill="#c9a96e" radius={[2, 2, 0, 0]} isAnimationActive={false} />
                        </BarChart>
                      </ResponsiveContainer>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${holdingDist.length}, 1fr)`,
                        gap: 4,
                        marginTop: 4,
                      }}>
                        {holdingDist.map((b) => (
                          <div
                            key={b.bucket}
                            style={{
                              textAlign: 'center',
                              fontSize: 10,
                              fontFamily: 'var(--serif)',
                              color: b.count === 0
                                ? 'var(--ink-dim)'
                                : b.avgReturn >= 0 ? 'var(--dash-green)' : 'var(--dash-red)',
                              fontWeight: 600,
                            }}
                          >
                            {b.count > 0 ? `${b.avgReturn >= 0 ? '+' : ''}${b.avgReturn.toFixed(1)}%` : '—'}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="dash-col">
              <div className="dash-card">
                <div className="dash-card-header">
                  <div>
                    <div className="dash-card-title">Win / Loss Streaks</div>
                    <div className="dash-card-sub">Consecutive closed trades</div>
                  </div>
                </div>
                <div className="dash-stats-stack" style={{ marginTop: 4 }}>
                  <div className="dash-stat-cell full-width">
                    <div className="dash-stat-label">Longest Winning Streak</div>
                    <div className="dash-stat-val up">{longestWin}</div>
                    <div className="dash-stat-sub">consecutive profitable trades</div>
                    <div className="dash-stat-glow up" />
                  </div>
                  <div className="dash-stat-cell full-width">
                    <div className="dash-stat-label">Longest Losing Streak</div>
                    <div className="dash-stat-val dn">{longestLoss}</div>
                    <div className="dash-stat-sub">consecutive losing trades</div>
                    <div className="dash-stat-glow dn" />
                  </div>
                  <div className="dash-stat-cell full-width">
                    <div className="dash-stat-label">Total Closed</div>
                    <div className="dash-stat-val flat">{totalClosedTrades}</div>
                    <div className="dash-stat-sub">trades on record</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Attribution tab ── */}
      {tab === 'attribution' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="dash-grid">
            <div className="dash-col">
              <div className="dash-card">
                <div className="dash-card-header">
                  <div>
                    <div className="dash-card-title">Top Winners</div>
                    <div className="dash-card-sub">By realized P&amp;L</div>
                  </div>
                  <div style={{ display: 'inline-flex', color: 'var(--dash-green)' }}>
                    <IconTrendingUp />
                  </div>
                </div>
                <div className="dash-card-body" style={{ paddingTop: 8 }}>
                  {topWinners.length === 0 ? (
                    <div className="dash-empty">No winning trades yet.</div>
                  ) : (
                    <ContributorList rows={topWinners} tone="up" />
                  )}
                </div>
              </div>
            </div>
            <div className="dash-col">
              <div className="dash-card">
                <div className="dash-card-header">
                  <div>
                    <div className="dash-card-title">Top Losers</div>
                    <div className="dash-card-sub">By realized P&amp;L</div>
                  </div>
                  <div style={{ display: 'inline-flex', color: 'var(--dash-red)' }}>
                    <IconTrendingDown />
                  </div>
                </div>
                <div className="dash-card-body" style={{ paddingTop: 8 }}>
                  {topLosers.length === 0 ? (
                    <div className="dash-empty">No losing trades yet.</div>
                  ) : (
                    <ContributorList rows={topLosers} tone="dn" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sector contribution */}
          <div className="dash-card">
            <div className="dash-card-header">
              <div>
                <div className="dash-card-title">Sector Contribution</div>
                <div className="dash-card-sub">Realized P&amp;L by sector</div>
              </div>
              <div style={{ display: 'inline-flex', color: 'var(--ink-dim)' }}>
                <IconCheck />
              </div>
            </div>
            <div className="dash-card-body">
              {sectorContrib.length === 0 ? (
                <div className="dash-empty">No closed trades yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {sectorContrib.map((s) => {
                    const isPositive = s.pnl >= 0
                    const widthPct = (Math.abs(s.pnl) / maxSectorAbs) * 100
                    return (
                      <div key={s.sector}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: 5,
                        }}>
                          <span style={{ color: 'var(--ink-mute)', fontSize: 12 }}>{s.sector}</span>
                          <span
                            style={{
                              color: isPositive ? 'var(--dash-green)' : 'var(--dash-red)',
                              fontSize: 12,
                              fontFamily: 'var(--serif)',
                              fontWeight: 600,
                            }}
                          >
                            {fmtEUR(s.pnl)}
                          </span>
                        </div>
                        <div style={{
                          height: 6,
                          background: 'rgba(232,228,220,0.06)',
                          borderRadius: 2,
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${widthPct}%`,
                            height: '100%',
                            background: isPositive
                              ? 'linear-gradient(90deg, rgba(74,222,128,0.5), var(--dash-green))'
                              : 'linear-gradient(90deg, rgba(248,113,113,0.5), var(--dash-red))',
                            transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
                          }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Scatter: holding vs return */}
          <div className="dash-card">
            <div className="dash-card-header">
              <div>
                <div className="dash-card-title">Holding Period vs Return</div>
                <div className="dash-card-sub">Each dot is a closed trade</div>
              </div>
            </div>
            <div className="dash-card-body">
              {scatterData.length === 0 ? (
                <div className="dash-empty">No closed trades yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <ScatterChart margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                    <CartesianGrid stroke="rgba(232,228,220,0.06)" />
                    <XAxis
                      type="number"
                      dataKey="x"
                      name="Days held"
                      tick={{ fill: 'var(--ink-dim)', fontSize: 10 }}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(232,228,220,0.08)' }}
                      label={{
                        value: 'Days held',
                        position: 'insideBottom',
                        offset: -2,
                        fill: 'var(--ink-dim)',
                        fontSize: 10,
                        letterSpacing: '0.1em',
                      }}
                    />
                    <YAxis
                      type="number"
                      dataKey="y"
                      name="Return %"
                      tick={{ fill: 'var(--ink-dim)', fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(0)}%`}
                      width={48}
                    />
                    <ReferenceLine y={0} stroke="rgba(232,228,220,0.12)" />
                    <Tooltip content={<ScatterTooltip />} cursor={{ stroke: 'rgba(201,169,110,0.18)' }} />
                    <Scatter
                      data={scatterData}
                      isAnimationActive={false}
                      shape={(props: unknown) => {
                        const p = props as { cx: number; cy: number; payload: ScatterPoint }
                        const fill = p.payload.y >= 0 ? '#4ade80' : '#f87171'
                        return (
                          <circle cx={p.cx} cy={p.cy} r={4} fill={fill} fillOpacity={0.7} stroke={fill} strokeWidth={1} />
                        )
                      }}
                    />
                    {trendline && (
                      <Scatter
                        data={trendline}
                        line={{ stroke: '#c9a96e', strokeWidth: 1.5, strokeDasharray: '4 3' }}
                        shape={() => <></>}
                        legendType="none"
                        isAnimationActive={false}
                      />
                    )}
                  </ScatterChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function RiskCell({
  label, val, tone, sub, fullWidth,
}: { label: string; val: string; tone: 'up' | 'dn' | 'flat'; sub: string; fullWidth?: boolean }) {
  return (
    <div className={`dash-stat-cell${fullWidth ? ' full-width' : ''}`}>
      <div className="dash-stat-label">{label}</div>
      <div className={`dash-stat-val ${tone}`}>{val}</div>
      <div className="dash-stat-sub">{sub}</div>
      <div className={`dash-stat-glow ${tone}`} />
    </div>
  )
}

function ConcentrationBar({ label, value }: { label: string; value: number }) {
  const width = Math.min(Math.max(value, 0), 100)
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 5,
      }}>
        <span style={{
          color: 'var(--ink-dim)',
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}>{label}</span>
        <span style={{
          color: 'var(--ink)',
          fontSize: 12,
          fontFamily: 'var(--serif)',
          fontWeight: 600,
        }}>
          {value.toFixed(1)}%
        </span>
      </div>
      <div style={{
        height: 6,
        background: 'rgba(232,228,220,0.06)',
        borderRadius: 2,
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${width}%`,
          height: '100%',
          background: 'linear-gradient(90deg, var(--gold), #e8c98a)',
          transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
        }} />
      </div>
    </div>
  )
}

interface TradeListRow {
  symbol: string
  sector: string
  realized_pnl: number
  realized_pnl_pct: number
}

function ContributorList({ rows, tone }: { rows: TradeListRow[]; tone: 'up' | 'dn' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {rows.map((r, i) => (
        <div
          key={`${r.symbol}-${i}`}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto auto',
            gap: 12,
            alignItems: 'center',
            padding: '10px 0',
            borderBottom: i < rows.length - 1 ? '1px solid var(--line)' : 'none',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{
              color: 'var(--ink)',
              fontFamily: 'var(--serif)',
              fontSize: 14,
              fontWeight: 600,
            }}>
              {r.symbol}
            </div>
            <div style={{
              color: 'var(--ink-dim)',
              fontSize: 11,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {r.sector}
            </div>
          </div>
          <div
            className={`ret-badge ${tone}`}
            style={{ minWidth: 60, justifyContent: 'center' }}
          >
            {fmtPct(r.realized_pnl_pct, 1)}
          </div>
          <div style={{
            color: tone === 'up' ? 'var(--dash-green)' : 'var(--dash-red)',
            fontFamily: 'var(--serif)',
            fontSize: 13,
            fontWeight: 600,
            minWidth: 80,
            textAlign: 'right',
          }}>
            {fmtEUR(r.realized_pnl)}
          </div>
        </div>
      ))}
    </div>
  )
}

function monthLabel(m: number): string {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m] ?? ''
}
