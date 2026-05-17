'use client'

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'

interface DDPoint {
  date: string
  dd: number
  underwater: boolean
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
}

function fmtShortDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

interface TooltipPayload {
  value: number
}

function DDTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) {
  if (!active || !payload?.length) return null
  const dd = payload[0].value
  return (
    <div className="dash-tooltip">
      <div className="dash-tooltip-date">{label ? fmtDate(label) : ''}</div>
      <div className="dash-tooltip-row">
        <span className="dash-tooltip-label">Drawdown</span>
        <span
          className="dash-tooltip-val"
          style={{ color: dd < 0 ? 'var(--dash-red)' : 'var(--ink)' }}
        >
          {dd.toFixed(2)}%
        </span>
      </div>
    </div>
  )
}

export default function DrawdownChart({ data }: { data: DDPoint[] }) {
  if (data.length === 0) {
    return (
      <div style={{
        height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--ink-dim)', fontSize: 13, fontStyle: 'italic', fontFamily: 'var(--serif)',
      }}>
        No drawdown data
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f87171" stopOpacity={0} />
            <stop offset="100%" stopColor="#f87171" stopOpacity={0.32} />
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
          tickFormatter={(v) => `${v.toFixed(0)}%`}
          tick={{ fill: 'var(--ink-dim)', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          width={48}
          domain={['dataMin', 0]}
        />
        <ReferenceLine y={0} stroke="rgba(232,228,220,0.18)" strokeWidth={1} />
        <Tooltip
          content={<DDTooltip />}
          cursor={{ stroke: 'rgba(248,113,113,0.18)', strokeWidth: 1 }}
        />
        <Area
          type="monotone"
          dataKey="dd"
          stroke="#f87171"
          strokeWidth={1.5}
          fill="url(#ddGrad)"
          dot={false}
          activeDot={{ r: 4, fill: '#f87171', stroke: 'var(--navy)', strokeWidth: 2 }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
