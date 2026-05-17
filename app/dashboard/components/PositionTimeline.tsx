'use client'

import { useEffect, useState } from 'react'
import {
  ResponsiveContainer, AreaChart, Area, CartesianGrid,
  XAxis, YAxis, Tooltip, ReferenceLine,
} from 'recharts'

export interface TimelinePosition {
  symbol: string
  trading_id: string | null
  entry_date: string
  holding_months: number
  entry_price: number
  current_price: number
  take_profit_pct: number | null
  stop_loss_pct: number | null
}

function addMonths(date: Date, months: number) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

function fmtDate(d: Date) {
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
}

interface PriceHistoryPoint { date: string; close: number }

function MiniChart({ position }: { position: TimelinePosition }) {
  const [history, setHistory] = useState<PriceHistoryPoint[]>([])
  const [state, setState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle')

  useEffect(() => {
    let cancelled = false
    setState('loading')
    fetch(`/api/prices/history?symbol=${encodeURIComponent(position.symbol)}&from=${encodeURIComponent(position.entry_date)}`)
      .then(r => r.json())
      .then((data: { prices?: PriceHistoryPoint[] }) => {
        if (cancelled) return
        setHistory(data.prices ?? [])
        setState('loaded')
      })
      .catch(() => {
        if (cancelled) return
        setState('error')
      })
    return () => { cancelled = true }
  }, [position.symbol, position.entry_date])

  if (state === 'loading') {
    return (
      <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-dim)', fontSize: 12 }}>
        Koersdata laden…
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-dim)', fontSize: 12, fontStyle: 'italic' }}>
        Geen koersdata beschikbaar.
      </div>
    )
  }

  const data = history.map(p => ({
    date: p.date,
    return: ((p.close - position.entry_price) / position.entry_price) * 100,
  }))

  const tp = position.take_profit_pct
  const sl = position.stop_loss_pct

  return (
    <ResponsiveContainer width="100%" height={120}>
      <AreaChart data={data} margin={{ top: 4, right: 56, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${position.symbol}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d4a843" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#d4a843" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(232,228,220,0.04)" vertical={false} />
        <XAxis dataKey="date" tick={false} axisLine={false} tickLine={false} />
        <YAxis
          domain={['auto', 'auto']}
          tick={{ fontSize: 9, fill: '#5d5d57' }}
          tickLine={false}
          axisLine={false}
          width={44}
          tickFormatter={v => `${v >= 0 ? '+' : ''}${(v as number).toFixed(0)}%`}
        />
        <Tooltip
          contentStyle={{
            background: '#0a0f1e', border: '1px solid rgba(232,228,220,0.18)',
            borderRadius: 2, fontSize: 11, padding: '6px 10px',
          }}
          labelStyle={{ color: 'var(--ink-dim)', fontSize: 10 }}
          formatter={(v) => {
            const n = typeof v === 'number' ? v : Number(v)
            if (!Number.isFinite(n)) return ['—', 'Return']
            return [`${n >= 0 ? '+' : ''}${n.toFixed(2)}%`, 'Return']
          }}
        />
        {tp != null && (
          <ReferenceLine y={tp} stroke="#4ade80" strokeDasharray="4 3" strokeWidth={1}
            label={{ value: `TP +${tp.toFixed(1)}%`, position: 'right', fontSize: 9, fill: '#4ade80' }} />
        )}
        {sl != null && (
          <ReferenceLine y={sl} stroke="#f87171" strokeDasharray="4 3" strokeWidth={1}
            label={{ value: `SL ${sl.toFixed(1)}%`, position: 'right', fontSize: 9, fill: '#f87171' }} />
        )}
        <ReferenceLine y={0} stroke="rgba(232,228,220,0.1)" />
        <Area
          type="monotone"
          dataKey="return"
          stroke="#d4a843"
          strokeWidth={1.5}
          fill={`url(#grad-${position.symbol})`}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function TimelineRow({ position }: { position: TimelinePosition }) {
  const entry = new Date(position.entry_date)
  const expectedEnd = addMonths(entry, position.holding_months)
  const now = new Date()

  const total = expectedEnd.getTime() - entry.getTime()
  const elapsed = now.getTime() - entry.getTime()
  const progress = total > 0 ? Math.max(0, Math.min(100, (elapsed / total) * 100)) : 0

  const currentPct = ((position.current_price - position.entry_price) / position.entry_price) * 100

  return (
    <div className="timeline-item">
      <div className="timeline-header">
        <span className="timeline-symbol">{position.symbol}</span>
        <span className={`timeline-return ${currentPct >= 0 ? 'up' : 'dn'}`}>
          {currentPct >= 0 ? '+' : ''}{currentPct.toFixed(2)}%
        </span>
        <span className="timeline-progress">{Math.round(progress)}% van houdperiode verstreken</span>
      </div>
      <div className="timeline-bar-track">
        <div className="timeline-bar-fill" style={{ width: `${progress}%` }} />
        <div className="timeline-marker" style={{ left: `${progress}%` }} />
      </div>
      <div className="timeline-labels">
        <span>{fmtDate(entry)}</span>
        <span>{fmtDate(expectedEnd)}</span>
      </div>
      <div className="timeline-chart">
        <MiniChart position={position} />
      </div>
    </div>
  )
}

export default function PositionTimeline({ positions }: { positions: TimelinePosition[] }) {
  if (positions.length === 0) return null
  return (
    <div className="dash-card">
      <div className="dash-card-header">
        <div>
          <div className="dash-card-title">Positie Timeline</div>
          <div className="dash-card-sub">Voortgang &amp; koersverloop sinds entry</div>
        </div>
      </div>
      <div className="dash-card-body">
        {positions.map(p => <TimelineRow key={p.symbol} position={p} />)}
      </div>
    </div>
  )
}
