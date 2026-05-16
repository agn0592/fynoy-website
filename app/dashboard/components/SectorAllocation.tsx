'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

interface SectorData { sector: string; value: number }

const COLORS = [
  '#c9a96e', // gold
  '#4f9de8', // bright blue
  '#e8614f', // red-orange
  '#5bc98a', // green
  '#b07fe8', // purple
  '#e8c84f', // yellow
  '#4fc9c9', // teal
  '#e87fb0', // pink
  '#8ae84f', // lime
  '#e89b4f', // orange
]

interface TooltipEntry { payload?: { sector: string; pct: number } }
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
  const enriched = data.map(d => ({ ...d, pct: total > 0 ? (d.value / total) * 100 : 0 }))

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
              <Pie data={enriched} dataKey="value" nameKey="sector" cx="50%" cy="50%"
                innerRadius={62} outerRadius={90} strokeWidth={2} stroke="var(--navy-2)" paddingAngle={2}>
                {enriched.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                <CenterLabel count={enriched.length} />
              </Pie>
              <Tooltip content={<SectorTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          <div className="sector-legend">
            {enriched.map((d, i) => (
              <div key={d.sector} className="sector-row">
                <div className="sector-dot" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="sector-name">{d.sector}</span>
                <span className="sector-pct">{d.pct.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
