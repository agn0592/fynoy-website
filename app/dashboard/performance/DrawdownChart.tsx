'use client'

import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine,
} from 'recharts'

interface DrawdownPoint { date: string; dd: number; underwater: boolean }

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

interface TipPayloadEntry { value: number }
function DrawdownTip({ active, payload, label }: { active?: boolean; payload?: TipPayloadEntry[]; label?: string }) {
  if (!active || !payload?.length) return null
  const v = payload[0].value
  return (
    <div className="dash-tooltip">
      <div className="dash-tooltip-date">{label ? fmtDate(label) : ''}</div>
      <div className="dash-tooltip-row">
        <span className="dash-tooltip-label">Drawdown</span>
        <span className="dash-tooltip-val" style={{ color: v < 0 ? '#f87171' : 'var(--ink)' }}>
          {v.toFixed(2)}%
        </span>
      </div>
    </div>
  )
}

export default function DrawdownChart({ data }: { data: DrawdownPoint[] }) {
  return (
    <div className="dash-card">
      <div className="dash-card-header">
        <div>
          <div className="dash-card-title">Drawdown</div>
          <div className="dash-card-sub">Underwater periods vs peak</div>
        </div>
      </div>
      <div className="dash-card-body" style={{ paddingTop: 12 }}>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f87171" stopOpacity={0} />
                <stop offset="100%" stopColor="#f87171" stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(232,228,220,0.06)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#5d5d57', fontSize: 10, fontFamily: 'DM Sans, sans-serif' }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(232,228,220,0.08)' }}
              tickFormatter={fmtDate}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={v => `${(v as number).toFixed(0)}%`}
              tick={{ fill: '#5d5d57', fontSize: 10, fontFamily: 'DM Sans, sans-serif' }}
              tickLine={false}
              axisLine={false}
              width={48}
            />
            <ReferenceLine y={0} stroke="rgba(232,228,220,0.12)" />
            <Tooltip content={<DrawdownTip />} cursor={{ stroke: 'rgba(248,113,113,0.25)', strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="dd"
              stroke="#f87171"
              strokeWidth={1.5}
              fill="url(#ddGrad)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
