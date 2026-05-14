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

function formatYAxis(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `€${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `€${(value / 1_000).toFixed(0)}k`
  return `€${value.toFixed(0)}`
}

export default function PerformanceChart({ data }: PerformanceChartProps) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('All')

  const filteredData = useMemo(
    () => getFilteredData(data, activeFilter),
    [data, activeFilter]
  )

  return (
    <div
      style={{
        background: '#1a1d27',
        border: '1px solid #2a2d3e',
        borderRadius: '10px',
        padding: '24px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: 600, margin: 0 }}>
          Portfolio Performance
        </h2>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                padding: '4px 12px',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: activeFilter === f ? '#3b82f6' : '#2a2d3e',
                background: activeFilter === f ? '#3b82f620' : 'transparent',
                color: activeFilter === f ? '#3b82f6' : '#6b7280',
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
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={filteredData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#2a2d3e' }}
          />
          <YAxis
            tickFormatter={formatYAxis}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={70}
          />
          <Tooltip
            contentStyle={{
              background: '#0f1117',
              border: '1px solid #2a2d3e',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '12px',
            }}
            formatter={(value, name) => [
              typeof value === 'number'
                ? `€${value.toLocaleString('en-EU', { minimumFractionDigits: 2 })}`
                : String(value),
              name,
            ]}
          />
          <Legend
            wrapperStyle={{ color: '#9ca3af', fontSize: '12px' }}
          />
          <Line
            type="monotone"
            dataKey="nav"
            name="Portfolio"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="benchmark"
            name="FTSE All-World"
            stroke="#6b7280"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            strokeDasharray="4 4"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
