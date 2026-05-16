'use client'

import { useState, useMemo } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'

interface DataPoint {
  date: string
  nav: number
  benchmark: number
}

interface PerformanceChartProps {
  data: DataPoint[]
}

type FilterKey = '1M' | '3M' | '6M' | 'YTD' | '1Y' | 'All'
const FILTERS: FilterKey[] = ['1M', '3M', '6M', 'YTD', '1Y', 'All']

function filterData(data: DataPoint[], f: FilterKey): DataPoint[] {
  if (!data.length || f === 'All') return data
  const now = new Date()
  let cutoff: Date
  if (f === 'YTD') { cutoff = new Date(now.getFullYear(), 0, 1) }
  else {
    cutoff = new Date(now)
    const map: Record<FilterKey, number> = { '1M': 1, '3M': 3, '6M': 6, 'YTD': 0, '1Y': 12, 'All': 0 }
    cutoff.setMonth(cutoff.getMonth() - map[f])
  }
  return data.filter(d => new Date(d.date) >= cutoff)
}

function indexData(data: DataPoint[]) {
  if (!data.length) return []
  const bn = data[0].nav, bb = data[0].benchmark
  return data.map(d => ({
    date: d.date,
    portfolio: bn > 0 ? ((d.nav - bn) / bn) * 100 : 0,
    benchmark: bb > 0 ? ((d.benchmark - bb) / bb) * 100 : 0,
  }))
}

function fmtPct(v: number): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}

function ChartTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="dash-tooltip">
      <div className="dash-tooltip-date">{label ? fmtDate(label) : ''}</div>
      {payload.map(p => (
        <div key={p.name} className="dash-tooltip-row">
          <span className="dash-tooltip-label">{p.name}</span>
          <span className="dash-tooltip-value" style={{ color: p.color }}>{fmtPct(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function PerformanceChart({ data }: PerformanceChartProps) {
  const [active, setActive] = useState<FilterKey>('All')

  const chartData = useMemo(
    () => indexData(filterData(data, active)),
    [data, active]
  )

  return (
    <div className="dash-chart-card">
      <div className="dash-chart-top">
        <div>
          <div className="dash-chart-title">Portfolio Performance</div>
          <div className="dash-chart-legend" style={{ marginTop: 6 }}>
            <div className="dash-chart-legend-item">
              <div className="dash-legend-line" style={{ background: '#c9a96e' }} />
              <span>Portfolio</span>
            </div>
            <div className="dash-chart-legend-item">
              <div className="dash-legend-line" style={{ background: '#5d5d57', borderTop: '2px dashed #5d5d57', height: 0 }} />
              <span>VWCE</span>
            </div>
          </div>
        </div>
        <div className="dash-filters">
          {FILTERS.map(f => (
            <button
              key={f}
              className={`dash-filter${active === f ? ' active' : ''}`}
              onClick={() => setActive(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={chartData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c9a96e" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#c9a96e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="0"
            stroke="rgba(232,228,220,0.05)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fill: '#5d5d57', fontSize: 10, fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.04em' }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(232,228,220,0.08)' }}
            tickFormatter={fmtDate}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={v => `${v >= 0 ? '+' : ''}${v.toFixed(0)}%`}
            tick={{ fill: '#5d5d57', fontSize: 10, fontFamily: 'DM Sans, sans-serif' }}
            tickLine={false}
            axisLine={false}
            width={52}
          />
          <ReferenceLine y={0} stroke="rgba(232,228,220,0.12)" strokeWidth={1} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(201,169,110,0.2)', strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="portfolio"
            name="Portfolio"
            stroke="#c9a96e"
            strokeWidth={2}
            fill="url(#portfolioGrad)"
            dot={false}
            activeDot={{ r: 4, fill: '#c9a96e', stroke: '#0a0f1e', strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="benchmark"
            name="VWCE"
            stroke="#5d5d57"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
            activeDot={{ r: 3, fill: '#5d5d57', stroke: '#0a0f1e', strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
