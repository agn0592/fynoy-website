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

// Gold-toned palette that matches the brand
const COLORS = [
  '#c9a96e', // gold
  '#8b7355', // warm brown
  '#e8c98a', // light gold
  '#6b9e8b', // teal
  '#9b8a6e', // muted gold
  '#7a9db5', // slate blue
  '#b8956e', // copper
  '#8aa67a', // sage
  '#a88b6e', // warm tan
  '#6e8aa6', // cool blue
]

interface TooltipEntry {
  payload?: { sector: string; pct: number }
}

function SectorTooltip({ active, payload }: { active?: boolean; payload?: TooltipEntry[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div className="dash-tooltip">
      <div className="dash-tooltip-row">
        <span className="dash-tooltip-label">{d.sector}</span>
        <span className="dash-tooltip-value" style={{ color: 'var(--gold)' }}>{d.pct.toFixed(1)}%</span>
      </div>
    </div>
  )
}

function CenterLabel({ viewBox, count }: { viewBox?: { cx: number; cy: number }; count: number }) {
  if (!viewBox) return null
  const { cx, cy } = viewBox
  return (
    <g>
      <text x={cx} y={cy - 8} textAnchor="middle" fill="#e8e4dc" fontSize={26} fontFamily="Playfair Display, serif" fontWeight={500}>
        {count}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#8b8a82" fontSize={10} fontFamily="DM Sans, sans-serif" letterSpacing="0.12em">
        SECTORS
      </text>
    </g>
  )
}

export default function SectorAllocation({ data }: { data: SectorData[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const enriched = data.map(d => ({
    ...d,
    pct: total > 0 ? (d.value / total) * 100 : 0,
  }))

  return (
    <div className="dash-panel">
      <div className="dash-panel-title">Sector Allocation</div>
      <div className="dash-panel-sub">Portfolio weight</div>

      {data.length === 0 ? (
        <div style={{ color: 'var(--ink-dim)', fontSize: 14, textAlign: 'center', padding: '40px 0', fontStyle: 'italic', fontFamily: 'var(--serif)' }}>
          No sector data
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={enriched}
                dataKey="value"
                nameKey="sector"
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={90}
                strokeWidth={2}
                stroke="var(--navy-2)"
                paddingAngle={2}
              >
                {enriched.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
                <CenterLabel count={enriched.length} />
              </Pie>
              <Tooltip content={<SectorTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          <div className="sector-legend">
            {enriched.map((d, i) => (
              <div key={d.sector} className="sector-legend-item">
                <div className="sector-swatch" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="sector-name">{d.sector}</span>
                <div className="sector-pct-wrap">
                  <div className="sector-pct-bar-wrap">
                    <div className="sector-pct-bar" style={{ width: `${d.pct}%`, background: COLORS[i % COLORS.length] }} />
                  </div>
                  <span className="sector-pct">{d.pct.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
