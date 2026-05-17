'use client'

import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts'

interface Props {
  spec: Record<string, unknown>
}

interface ParsedSpec {
  kind: 'line' | 'bar' | 'area'
  data: Record<string, unknown>[]
  xKey: string
  yKeys: string[]
  title?: string
}

function parseSpec(raw: Record<string, unknown>): ParsedSpec | null {
  const kind = raw.kind === 'bar' || raw.kind === 'area' ? raw.kind : 'line'
  const data = Array.isArray(raw.data) ? raw.data as Record<string, unknown>[] : []
  const xKey = typeof raw.xKey === 'string' ? raw.xKey : 'x'
  const yKeys = Array.isArray(raw.yKeys) ? (raw.yKeys as unknown[]).filter((v): v is string => typeof v === 'string') : []
  if (data.length === 0 || yKeys.length === 0) return null
  return { kind, data, xKey, yKeys, title: typeof raw.title === 'string' ? raw.title : undefined }
}

const SERIES_COLORS = ['var(--gold)', '#7aa9d6', '#c97a7a', '#7ec99a', '#c9b87a']

export default function ChartBlock({ spec }: Props) {
  const parsed = parseSpec(spec)
  if (!parsed) return null

  const common = (
    <>
      <CartesianGrid stroke="rgba(232,228,220,0.06)" strokeDasharray="3 3" />
      <XAxis dataKey={parsed.xKey} stroke="var(--ink-mute)" fontSize={10} />
      <YAxis stroke="var(--ink-mute)" fontSize={10} />
      <Tooltip contentStyle={{ background: 'var(--navy-2)', border: '1px solid var(--line)', borderRadius: 2, fontSize: 12 }} />
      <Legend wrapperStyle={{ fontSize: 11, color: 'var(--ink-dim)' }} />
    </>
  )

  return (
    <div className="agent-chart">
      {parsed.title && <div className="agent-chart-title">{parsed.title}</div>}
      <ResponsiveContainer width="100%" height={220}>
        {parsed.kind === 'bar' ? (
          <BarChart data={parsed.data}>
            {common}
            {parsed.yKeys.map((k, i) => (
              <Bar key={k} dataKey={k} fill={SERIES_COLORS[i % SERIES_COLORS.length]} />
            ))}
          </BarChart>
        ) : parsed.kind === 'area' ? (
          <AreaChart data={parsed.data}>
            {common}
            {parsed.yKeys.map((k, i) => (
              <Area key={k} dataKey={k} type="monotone" fillOpacity={0.2} stroke={SERIES_COLORS[i % SERIES_COLORS.length]} fill={SERIES_COLORS[i % SERIES_COLORS.length]} />
            ))}
          </AreaChart>
        ) : (
          <LineChart data={parsed.data}>
            {common}
            {parsed.yKeys.map((k, i) => (
              <Line key={k} dataKey={k} type="monotone" stroke={SERIES_COLORS[i % SERIES_COLORS.length]} strokeWidth={1.5} dot={false} />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
