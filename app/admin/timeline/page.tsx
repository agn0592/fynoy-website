'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PositionWithCase {
  symbol: string
  entry_date_actual: string | null
  expected_holding_period_months: number | null
}

function getBarColor(entryDate: string, holdingMonths: number, today: Date): string {
  const start = new Date(entryDate)
  const end = new Date(start)
  end.setMonth(end.getMonth() + holdingMonths)

  const thirtyDaysBefore = new Date(end)
  thirtyDaysBefore.setDate(thirtyDaysBefore.getDate() - 30)

  if (today > end) return '#ef4444'
  if (today >= thirtyDaysBefore) return '#f59e0b'
  return '#22c55e'
}

export default function TimelinePage() {
  const [positions, setPositions] = useState<PositionWithCase[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: posRaw } = await supabase
        .from('open_positions')
        .select('symbol, entry_date_actual, trading_id')

      const { data: casesRaw } = await supabase
        .from('cases')
        .select('trading_id, expected_holding_period_months')

      const caseMap = new Map<string, number>(
        (casesRaw ?? []).map((c) => [c.trading_id, c.expected_holding_period_months ?? 12])
      )

      const combined: PositionWithCase[] = (posRaw ?? []).map((p) => ({
        symbol: p.symbol,
        entry_date_actual: p.entry_date_actual,
        expected_holding_period_months: p.trading_id ? (caseMap.get(p.trading_id) ?? null) : null,
      }))

      setPositions(combined)
      setLoading(false)
    }
    load()
  }, [])

  const today = new Date()

  // Find timeline range
  const validPositions = positions.filter(
    (p) => p.entry_date_actual && p.expected_holding_period_months
  )

  const allDates: Date[] = []
  for (const p of validPositions) {
    const start = new Date(p.entry_date_actual!)
    const end = new Date(start)
    end.setMonth(end.getMonth() + p.expected_holding_period_months!)
    allDates.push(start, end)
  }
  allDates.push(today)

  const minDate = allDates.length > 0 ? new Date(Math.min(...allDates.map((d) => d.getTime()))) : today
  const maxDate = allDates.length > 0 ? new Date(Math.max(...allDates.map((d) => d.getTime()))) : today

  // Add 5% padding on each side
  const range = maxDate.getTime() - minDate.getTime() || 1
  const padded = range * 0.05
  const timelineStart = new Date(minDate.getTime() - padded)
  const timelineEnd = new Date(maxDate.getTime() + padded)
  const totalRange = timelineEnd.getTime() - timelineStart.getTime()

  function toPct(date: Date): number {
    return ((date.getTime() - timelineStart.getTime()) / totalRange) * 100
  }

  const todayPct = toPct(today)

  function formatDate(d: Date): string {
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  if (loading) {
    return (
      <div style={{ color: '#6b7280', fontSize: '14px', padding: '48px 0', textAlign: 'center' }}>
        Loading timeline...
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, margin: '0 0 4px' }}>
          Position Timeline
        </h1>
        <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
          Horizontal timeline bars for each open position. Vertical line = today.
        </p>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {[
          { color: '#22c55e', label: 'On track (>30d remaining)' },
          { color: '#f59e0b', label: 'Approaching end (≤30d)' },
          { color: '#ef4444', label: 'Past target end date' },
        ].map((l) => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: l.color }} />
            <span style={{ color: '#9ca3af', fontSize: '12px' }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div
        style={{
          background: '#1a1d27',
          border: '1px solid #2a2d3e',
          borderRadius: '10px',
          padding: '24px',
          overflowX: 'auto',
        }}
      >
        {validPositions.length === 0 ? (
          <div style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center', padding: '32px 0' }}>
            No positions with entry date and holding period data found.
          </div>
        ) : (
          <div style={{ minWidth: '600px' }}>
            {/* Date axis labels */}
            <div style={{ position: 'relative', height: '24px', marginBottom: '8px', marginLeft: '100px' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '0%',
                  color: '#6b7280',
                  fontSize: '11px',
                  transform: 'translateX(-50%)',
                }}
              >
                {formatDate(timelineStart)}
              </span>
              <span
                style={{
                  position: 'absolute',
                  left: '50%',
                  color: '#6b7280',
                  fontSize: '11px',
                  transform: 'translateX(-50%)',
                }}
              >
                {formatDate(new Date((timelineStart.getTime() + timelineEnd.getTime()) / 2))}
              </span>
              <span
                style={{
                  position: 'absolute',
                  left: '100%',
                  color: '#6b7280',
                  fontSize: '11px',
                  transform: 'translateX(-100%)',
                }}
              >
                {formatDate(timelineEnd)}
              </span>
            </div>

            {/* Position rows */}
            {validPositions.map((p) => {
              const start = new Date(p.entry_date_actual!)
              const end = new Date(start)
              end.setMonth(end.getMonth() + p.expected_holding_period_months!)
              const startPct = toPct(start)
              const endPct = toPct(end)
              const barColor = getBarColor(p.entry_date_actual!, p.expected_holding_period_months!, today)
              const widthPct = endPct - startPct

              return (
                <div
                  key={p.symbol}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '12px',
                    gap: '0',
                  }}
                >
                  {/* Symbol label */}
                  <div
                    style={{
                      width: '100px',
                      minWidth: '100px',
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: 600,
                      fontFamily: 'monospace',
                      paddingRight: '12px',
                      textAlign: 'right',
                    }}
                  >
                    {p.symbol}
                  </div>

                  {/* Bar track */}
                  <div
                    style={{
                      flex: 1,
                      position: 'relative',
                      height: '32px',
                      background: '#0f1117',
                      borderRadius: '4px',
                      border: '1px solid #2a2d3e',
                    }}
                  >
                    {/* Position bar */}
                    <div
                      style={{
                        position: 'absolute',
                        left: `${startPct}%`,
                        width: `${widthPct}%`,
                        top: '4px',
                        bottom: '4px',
                        background: barColor,
                        borderRadius: '3px',
                        opacity: 0.85,
                      }}
                      title={`${p.symbol}: ${formatDate(start)} → ${formatDate(end)} (${p.expected_holding_period_months}mo)`}
                    />

                    {/* Today line */}
                    {todayPct >= 0 && todayPct <= 100 && (
                      <div
                        style={{
                          position: 'absolute',
                          left: `${todayPct}%`,
                          top: 0,
                          bottom: 0,
                          width: '2px',
                          background: '#fff',
                          opacity: 0.6,
                          zIndex: 2,
                        }}
                        title={`Today: ${formatDate(today)}`}
                      />
                    )}
                  </div>

                  {/* End date label */}
                  <div
                    style={{
                      width: '110px',
                      minWidth: '110px',
                      color: barColor,
                      fontSize: '11px',
                      paddingLeft: '10px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatDate(end)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
