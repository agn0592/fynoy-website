'use client'

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from 'recharts'

interface ReturnBucket { bucket: string; count: number; mid: number }
interface HoldingBucket { bucket: string; count: number; avgReturn: number }

function barColor(mid: number): string {
  if (mid > 0) return '#4ade80'
  if (mid < 0) return '#f87171'
  return '#c9a96e'
}

interface TipPayloadEntry { value: number | string; name: string; payload?: { bucket?: string; avgReturn?: number } }
function BarTip({ active, payload, label }: { active?: boolean; payload?: TipPayloadEntry[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="dash-tooltip">
      <div className="dash-tooltip-date">{label ?? ''}</div>
      <div className="dash-tooltip-row">
        <span className="dash-tooltip-label">Trades</span>
        <span className="dash-tooltip-val" style={{ color: 'var(--gold)' }}>{payload[0].value}</span>
      </div>
      {payload[0].payload?.avgReturn != null && (
        <div className="dash-tooltip-row">
          <span className="dash-tooltip-label">Avg return</span>
          <span className="dash-tooltip-val" style={{ color: 'var(--ink)' }}>
            {payload[0].payload.avgReturn >= 0 ? '+' : ''}{payload[0].payload.avgReturn.toFixed(2)}%
          </span>
        </div>
      )}
    </div>
  )
}

export function ReturnDistributionChart({ data }: { data: ReturnBucket[] }) {
  return (
    <div className="dash-card">
      <div className="dash-card-header">
        <div>
          <div className="dash-card-title">Return distribution</div>
          <div className="dash-card-sub">Number of trades per return bucket</div>
        </div>
      </div>
      <div className="dash-card-body" style={{ paddingTop: 12 }}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 12 }}>
            <CartesianGrid stroke="rgba(232,228,220,0.08)" vertical={false} />
            <XAxis
              dataKey="bucket"
              tick={{ fill: '#5d5d57', fontSize: 10, fontFamily: 'DM Sans, sans-serif' }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(232,228,220,0.08)' }}
              interval={0}
              angle={-25}
              textAnchor="end"
              height={50}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: '#5d5d57', fontSize: 10, fontFamily: 'DM Sans, sans-serif' }}
              tickLine={false}
              axisLine={false}
              width={28}
            />
            <Tooltip content={<BarTip />} cursor={{ fill: 'rgba(201,169,110,0.06)' }} />
            <Bar dataKey="count" radius={[2, 2, 0, 0]}>
              {data.map((d, i) => <Cell key={i} fill={barColor(d.mid)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function HoldingPeriodChart({ data }: { data: HoldingBucket[] }) {
  return (
    <div className="dash-card">
      <div className="dash-card-header">
        <div>
          <div className="dash-card-title">Holding period distribution</div>
          <div className="dash-card-sub">Trades per duration bucket</div>
        </div>
      </div>
      <div className="dash-card-body" style={{ paddingTop: 12 }}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 8 }}>
            <CartesianGrid stroke="rgba(232,228,220,0.08)" vertical={false} />
            <XAxis
              dataKey="bucket"
              tick={{ fill: '#5d5d57', fontSize: 10, fontFamily: 'DM Sans, sans-serif' }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(232,228,220,0.08)' }}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: '#5d5d57', fontSize: 10, fontFamily: 'DM Sans, sans-serif' }}
              tickLine={false}
              axisLine={false}
              width={28}
            />
            <Tooltip content={<BarTip />} cursor={{ fill: 'rgba(201,169,110,0.06)' }} />
            <Bar dataKey="count" fill="#c9a96e" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
