'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
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
        background: 'linear-gradient(135deg, #1a1d27 0%, #1e2130 100%)',
        border: '1px solid #2a2d3e',
        borderRadius: '12px',
        padding: '24px',
        height: '100%',
      }}
    >
      <h2 style={{ color: '#fff', fontSize: '15px', fontWeight: 600, margin: '0 0 6px', letterSpacing: '-0.01em' }}>
        Sector Allocation
      </h2>
      <p style={{ color: '#4b5563', fontSize: '12px', margin: '0 0 20px' }}>
        Portfolio weight by sector
      </p>
      {data.length === 0 ? (
        <div style={{ color: '#4b5563', fontSize: '14px', textAlign: 'center', padding: '40px 0' }}>
          No sector data available
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={enriched}
                dataKey="value"
                nameKey="sector"
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={100}
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
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                }}
                formatter={(_value, name, entry) => {
                  const pct = entry?.payload?.pct
                  return [`${typeof pct === 'number' ? pct.toFixed(1) : '0.0'}%`, name]
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
            {enriched.map((d, i) => (
              <div key={d.sector} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '2px',
                      background: COLORS[i % COLORS.length],
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ color: '#9ca3af', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {d.sector}
                  </span>
                </div>
                <span style={{ color: '#d1d5db', fontSize: '12px', fontWeight: 600, flexShrink: 0 }}>
                  {d.pct.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
