'use client'

import { useState, useMemo } from 'react'
import {
  ResponsiveContainer, ComposedChart, Area, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine,
} from 'recharts'

const VWCE_TOOLTIP = 'VWCE is the Vanguard FTSE All-World ETF — a global index of ~3,700 stocks across developed and emerging markets. We use VWCE as our benchmark to compare our performance against the global market return.'

interface DataPoint { date: string; nav: number; benchmark: number }
type FilterKey = '1M' | '3M' | '6M' | 'YTD' | '1Y' | 'All'
const FILTERS: FilterKey[] = ['1M', '3M', '6M', 'YTD', '1Y', 'All']

function filterData(data: DataPoint[], f: FilterKey): DataPoint[] {
  if (!data.length || f === 'All') return data
  const now = new Date()
  let cutoff: Date
  if (f === 'YTD') { cutoff = new Date(now.getFullYear(), 0, 1) }
  else {
    cutoff = new Date(now)
    const m: Record<string, number> = { '1M': 1, '3M': 3, '6M': 6, '1Y': 12 }
    cutoff.setMonth(cutoff.getMonth() - (m[f] ?? 0))
  }
  return data.filter(d => new Date(d.date) >= cutoff)
}

function indexData(data: DataPoint[]) {
  if (!data.length) return []
  const bn = data[0].nav
  // Use first non-zero benchmark as base (Jan 1 and holidays may have 0)
  const firstBenchmark = data.find(d => d.benchmark > 0)
  const bb = firstBenchmark?.benchmark ?? 0
  return data.map(d => ({
    date: d.date,
    portfolio: bn > 0 ? ((d.nav - bn) / bn) * 100 : 0,
    benchmark: bb > 0 && d.benchmark > 0 ? ((d.benchmark - bb) / bb) * 100 : null,
  }))
}

function fmtPct(v: number) { return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%` }
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

interface TPayload { name: string; value: number; color: string }
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: TPayload[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="dash-tooltip">
      <div className="dash-tooltip-date">{label ? fmtDate(label) : ''}</div>
      {payload.map(p => (
        <div key={p.name} className="dash-tooltip-row">
          <span className="dash-tooltip-label">{p.name}</span>
          <span className="dash-tooltip-val" style={{ color: p.color }}>{fmtPct(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function PerformanceChart({ data }: { data: DataPoint[] }) {
  const [active, setActive] = useState<FilterKey>('All')
  const [tipOpen, setTipOpen] = useState(false)
  const chartData = useMemo(() => indexData(filterData(data, active)), [data, active])

  return (
    <div className="dash-card">
      <div className="dash-card-header">
        <div>
          <div className="dash-card-title">Portfolio Performance</div>
          <div className="dash-chart-legend">
            <div className="dash-legend-item">
              <div className="dash-legend-dot" style={{ background: '#d4a843' }} />
              <span>Portfolio</span>
            </div>
            <div className="dash-legend-item">
              <div className="dash-legend-line" style={{ background: '#a8a8a0', borderTop: '1.5px dashed #a8a8a0', height: 0 }} />
              <span>VWCE</span>
              <span
                role="button"
                tabIndex={0}
                aria-label="VWCE explanation"
                onMouseEnter={() => setTipOpen(true)}
                onMouseLeave={() => setTipOpen(false)}
                onFocus={() => setTipOpen(true)}
                onBlur={() => setTipOpen(false)}
                style={{
                  position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 14, height: 14, marginLeft: 2, borderRadius: '50%',
                  border: '1px solid var(--line-strong)', color: 'var(--ink-dim)',
                  fontSize: 9, fontWeight: 600, cursor: 'help', userSelect: 'none',
                  lineHeight: 1,
                }}
              >
                i
                {tipOpen && (
                  <div
                    className="dash-tooltip"
                    style={{
                      position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%',
                      transform: 'translateX(-50%)', width: 280, maxWidth: '80vw',
                      zIndex: 50, pointerEvents: 'none', whiteSpace: 'normal',
                      fontSize: 11.5, lineHeight: 1.55, color: 'var(--ink-mute)',
                      textTransform: 'none', letterSpacing: 0,
                    }}
                  >
                    {VWCE_TOOLTIP}
                  </div>
                )}
              </span>
            </div>
          </div>
        </div>
        <div className="dash-chart-filters">
          {FILTERS.map(f => (
            <button key={f} className={`dash-filter${active === f ? ' active' : ''}`} onClick={() => setActive(f)}>{f}</button>
          ))}
        </div>
      </div>
      <div className="dash-card-body" style={{ paddingTop: 12 }}>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d4a843" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#d4a843" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(232,228,220,0.08)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#5d5d57', fontSize: 10, fontFamily: 'DM Sans, sans-serif' }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(232,228,220,0.08)' }}
              tickFormatter={fmtDate}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={v => `${v >= 0 ? '+' : ''}${v.toFixed(0)}%`}
              tick={{ fill: '#5d5d57', fontSize: 10, fontFamily: 'DM Sans, sans-serif' }}
              tickLine={false} axisLine={false} width={48}
            />
            <ReferenceLine y={0} stroke="rgba(232,228,220,0.1)" />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(201,169,110,0.18)', strokeWidth: 1 }} />
            <Area type="monotone" dataKey="portfolio" name="Portfolio"
              stroke="#d4a843" strokeWidth={2.5} fill="url(#portfolioGrad)" dot={false}
              activeDot={{ r: 4, fill: '#d4a843', stroke: '#0a0f1e', strokeWidth: 2 }} />
            <Line type="monotone" dataKey="benchmark" name="VWCE"
              stroke="#a8a8a0" strokeWidth={1.5} strokeDasharray="5 3" dot={false}
              activeDot={{ r: 3, fill: '#a8a8a0', stroke: '#0a0f1e', strokeWidth: 2 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
