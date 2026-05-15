'use client'

import { useState, useMemo } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
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

function getFilteredData(data: DataPoint[], filter: FilterKey): DataPoint[] {
  if (!data.length) return data
  const now = new Date()
  let cutoff: Date

  switch (filter) {
    case '1M':
      cutoff = new Date(now)
      cutoff.setMonth(cutoff.getMonth() - 1)
      break
    case '3M':
      cutoff = new Date(now)
      cutoff.setMonth(cutoff.getMonth() - 3)
      break
    case '6M':
      cutoff = new Date(now)
      cutoff.setMonth(cutoff.getMonth() - 6)
      break
    case 'YTD':
      cutoff = new Date(now.getFullYear(), 0, 1)
      break
    case '1Y':
      cutoff = new Date(now)
      cutoff.setFullYear(cutoff.getFullYear() - 1)
      break
    case 'All':
    default:
      return data
  }

  return data.filter((d) => new Date(d.date) >= cutoff)
}

function indexData(data: DataPoint[]): { date: string; portfolio: number; benchmark: number }[] {
  if (!data.length) return []
  const baseNav = data[0].nav
  const baseBenchmark = data[0].benchmark
  return data.map((d) => ({
    date: d.date,
    portfolio: baseNav > 0 ? ((d.nav - baseNav) / baseNav) * 100 : 0,
    benchmark: baseBenchmark > 0 ? ((d.benchmark - baseBenchmark) / baseBenchmark) * 100 : 0,
  }))
}

function formatPct(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

function formatYAxis(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}

interface TooltipPayload {
  name: string
  value: number
  color: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: '#0f1117',
        border: '1px solid #2a2d3e',
        borderRadius: '8px',
        padding: '12px 16px',
        fontSize: '12px',
      }}
    >
      <div style={{ color: '#6b7280', marginBottom: '8px', fontWeight: 500 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color, marginBottom: '4px', display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
          <span style={{ color: '#9ca3af' }}>{p.name}</span>
          <span style={{ fontWeight: 600 }}>{formatPct(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function PerformanceChart({ data }: PerformanceChartProps) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('All')

  const filteredData = useMemo(
    () => getFilteredData(data, activeFilter),
    [data, activeFilter]
  )

  const indexedData = useMemo(() => indexData(filteredData), [filteredData])

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #1a1d27 0%, #1e2130 100%)',
        border: '1px solid #2a2d3e',
        borderRadius: '12px',
        padding: '24px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h2 style={{ color: '#fff', fontSize: '15px', fontWeight: 600, margin: 0, letterSpacing: '-0.01em' }}>
            Portfolio Performance
          </h2>
          <p style={{ color: '#4b5563', fontSize: '12px', margin: '4px 0 0' }}>
            Indexed return vs FTSE All-World
          </p>
        </div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: activeFilter === f ? '#3b82f6' : '#2a2d3e',
                background: activeFilter === f ? '#3b82f615' : 'transparent',
                color: activeFilter === f ? '#3b82f6' : '#4b5563',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 500,
                transition: 'all 0.15s',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={indexedData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: '#4b5563', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#2a2d3e' }}
          />
          <YAxis
            tickFormatter={formatYAxis}
            tick={{ fill: '#4b5563', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={60}
          />
          <ReferenceLine y={0} stroke="#2a2d3e" strokeWidth={1} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ color: '#6b7280', fontSize: '12px', paddingTop: '16px' }}
          />
          <Line
            type="monotone"
            dataKey="portfolio"
            name="Portfolio"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
          />
          <Line
            type="monotone"
            dataKey="benchmark"
            name="FTSE All-World"
            stroke="#4b5563"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 4, fill: '#4b5563', strokeWidth: 0 }}
            strokeDasharray="4 4"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
