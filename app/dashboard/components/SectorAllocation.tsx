'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { PieLabelRenderProps } from 'recharts'

interface SectorData {
  sector: string
  value: number
}

interface SectorAllocationProps {
  data: SectorData[]
}

const COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#f97316',
  '#84cc16',
  '#6366f1',
  '#14b8a6',
]

function renderCustomLabel(props: PieLabelRenderProps) {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props
  if (!percent || percent < 0.05) return null
  const cxNum = Number(cx ?? 0)
  const cyNum = Number(cy ?? 0)
  const midNum = Number(midAngle ?? 0)
  const innerNum = Number(innerRadius ?? 0)
  const outerNum = Number(outerRadius ?? 0)
  const RADIAN = Math.PI / 180
  const radius = innerNum + (outerNum - innerNum) * 0.5
  const x = cxNum + radius * Math.cos(-midNum * RADIAN)
  const y = cyNum + radius * Math.sin(-midNum * RADIAN)
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={600}
    >
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  )
}

export default function SectorAllocation({ data }: SectorAllocationProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  const enriched = data.map((d) => ({
    ...d,
    pct: total > 0 ? (d.value / total) * 100 : 0,
  }))

  return (
    <div
      style={{
        background: '#1a1d27',
        border: '1px solid #2a2d3e',
        borderRadius: '10px',
        padding: '24px',
      }}
    >
      <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: 600, margin: '0 0 20px' }}>
        Sector Allocation
      </h2>
      {data.length === 0 ? (
        <div style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center', padding: '40px 0' }}>
          No sector data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={enriched}
              dataKey="value"
              nameKey="sector"
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={110}
              labelLine={false}
              label={renderCustomLabel}
            >
              {enriched.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: '#0f1117',
                border: '1px solid #2a2d3e',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '12px',
              }}
              formatter={(value, name) => {
                const numVal = typeof value === 'number' ? value : 0
                const pct = total > 0 ? ((numVal / total) * 100).toFixed(1) : '0.0'
                return [`€${numVal.toLocaleString()} (${pct}%)`, name]
              }}
            />
            <Legend
              formatter={(value: string, entry: { payload?: { pct?: number } }) => (
                <span style={{ color: '#9ca3af', fontSize: '12px' }}>
                  {value} {entry.payload?.pct !== undefined ? `${entry.payload.pct.toFixed(1)}%` : ''}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
