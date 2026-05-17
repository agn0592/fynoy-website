'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { IconCalendar } from '@/app/dashboard/components/Icons'

export interface PositionTimelineRow {
  symbol: string
  trading_id: string | null
  caseId: string | null
  entry_date_actual: string
  expected_holding_period_months: number
  entry_iso: number
  end_iso: number
}

type TimelineStatus = 'on-track' | 'approaching' | 'past'

type SortKey =
  | 'symbol'
  | 'entry_date'
  | 'end_date'
  | 'days_remaining'
  | 'progress'
  | 'status'

type SortDir = 'asc' | 'desc'

interface Props {
  positions: PositionTimelineRow[]
  todayMs: number
}

const APPROACHING_DAYS = 30
const DAY_MS = 86_400_000

function classifyStatus(endMs: number, todayMs: number): TimelineStatus {
  if (todayMs > endMs) return 'past'
  if (endMs - todayMs <= APPROACHING_DAYS * DAY_MS) return 'approaching'
  return 'on-track'
}

function statusColor(status: TimelineStatus): string {
  if (status === 'past') return 'var(--dash-red)'
  if (status === 'approaching') return 'var(--dash-orange)'
  return 'var(--gold)'
}

function statusBadgeClass(status: TimelineStatus): string {
  if (status === 'past') return 'status-badge warning'
  if (status === 'approaching') return 'status-badge warning'
  return 'status-badge active'
}

function statusLabel(status: TimelineStatus): string {
  if (status === 'past') return 'Past target'
  if (status === 'approaching') return 'Approaching'
  return 'On track'
}

function formatDate(ms: number): string {
  try {
    return new Date(ms).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

function formatShortDate(ms: number): string {
  try {
    return new Date(ms).toLocaleDateString('en-GB', {
      month: 'short',
      year: '2-digit',
    })
  } catch {
    return '—'
  }
}

function compareValues(a: unknown, b: unknown, dir: SortDir): number {
  if (typeof a === 'number' && typeof b === 'number') {
    return dir === 'asc' ? a - b : b - a
  }
  const sa = String(a).toLowerCase()
  const sb = String(b).toLowerCase()
  return dir === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa)
}

export default function TimelineClient({ positions, todayMs }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('days_remaining')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  function handleSort(k: SortKey) {
    if (sortKey === k) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(k)
      const ascDefault = k === 'symbol' || k === 'days_remaining' || k === 'entry_date' || k === 'end_date'
      setSortDir(ascDefault ? 'asc' : 'desc')
    }
  }

  const enriched = useMemo(() => {
    return positions.map((p) => {
      const status = classifyStatus(p.end_iso, todayMs)
      const totalDuration = Math.max(1, p.end_iso - p.entry_iso)
      const elapsed = Math.max(0, todayMs - p.entry_iso)
      const progress = Math.min(100, (elapsed / totalDuration) * 100)
      const daysRemaining = Math.round((p.end_iso - todayMs) / DAY_MS)
      return { ...p, status, progress, daysRemaining }
    })
  }, [positions, todayMs])

  // Timeline domain with 5% padding
  const domain = useMemo(() => {
    if (enriched.length === 0) {
      return { start: todayMs - 30 * DAY_MS, end: todayMs + 30 * DAY_MS }
    }
    const starts = enriched.map((p) => p.entry_iso)
    const ends = enriched.map((p) => p.end_iso)
    const all = [...starts, ...ends, todayMs]
    const min = Math.min(...all)
    const max = Math.max(...all)
    const span = Math.max(1, max - min)
    const pad = span * 0.05
    return { start: min - pad, end: max + pad }
  }, [enriched, todayMs])

  const totalRange = domain.end - domain.start

  function toPct(ms: number): number {
    return ((ms - domain.start) / totalRange) * 100
  }

  const todayPct = toPct(todayMs)
  const midPct = 50

  const sorted = useMemo(() => {
    const arr = [...enriched]
    arr.sort((a, b) => {
      switch (sortKey) {
        case 'symbol':
          return compareValues(a.symbol, b.symbol, sortDir)
        case 'entry_date':
          return compareValues(a.entry_iso, b.entry_iso, sortDir)
        case 'end_date':
          return compareValues(a.end_iso, b.end_iso, sortDir)
        case 'days_remaining':
          return compareValues(a.daysRemaining, b.daysRemaining, sortDir)
        case 'progress':
          return compareValues(a.progress, b.progress, sortDir)
        case 'status':
          return compareValues(a.status, b.status, sortDir)
        default:
          return 0
      }
    })
    return arr
  }, [enriched, sortKey, sortDir])

  const arrow = (k: SortKey) =>
    sortKey === k ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''

  if (positions.length === 0) {
    return (
      <div className="dash-card" style={{ marginTop: 16 }}>
        <div className="dash-card-body">
          <div className="dash-empty">
            No positions with entry date and expected holding period data.
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Gantt-style timeline card */}
      <div className="dash-card" style={{ marginTop: 4 }}>
        <div className="dash-card-header">
          <div>
            <div className="dash-card-title">Holding period map</div>
            <div className="dash-card-sub">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <IconCalendar width={11} height={11} /> Today line in gold
              </span>
            </div>
          </div>
        </div>
        <div className="dash-card-body" style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 720 }}>
            {/* Axis */}
            <div
              style={{
                position: 'relative',
                height: 18,
                marginLeft: 90,
                marginRight: 130,
                marginBottom: 10,
              }}
            >
              {[
                { left: 0, anchor: 'flex-start' as const, label: formatShortDate(domain.start) },
                { left: 50, anchor: 'center' as const, label: formatShortDate((domain.start + domain.end) / 2) },
                { left: 100, anchor: 'flex-end' as const, label: formatShortDate(domain.end) },
              ].map((tick) => (
                <span
                  key={tick.left}
                  style={{
                    position: 'absolute',
                    left: `${tick.left}%`,
                    transform:
                      tick.left === 0
                        ? 'translateX(0)'
                        : tick.left === 100
                          ? 'translateX(-100%)'
                          : 'translateX(-50%)',
                    color: 'var(--ink-dim)',
                    fontSize: 10,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  {tick.label}
                </span>
              ))}
            </div>

            {/* Position rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {enriched.map((p) => {
                const startPct = toPct(p.entry_iso)
                const endPct = toPct(p.end_iso)
                const widthPct = Math.max(0.5, endPct - startPct)
                const color = statusColor(p.status)
                const tooltip = `${p.symbol}: ${formatDate(p.entry_iso)} → ${formatDate(p.end_iso)} (${p.expected_holding_period_months} months)`

                return (
                  <div
                    key={`${p.symbol}-${p.entry_iso}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 90,
                        minWidth: 90,
                        textAlign: 'right',
                        paddingRight: 12,
                      }}
                    >
                      <span className="dash-symbol" style={{ fontSize: 13 }}>
                        {p.symbol}
                      </span>
                    </div>

                    <div
                      style={{
                        flex: 1,
                        position: 'relative',
                        height: 26,
                        background: 'rgba(232,228,220,0.03)',
                        border: '1px solid var(--line)',
                        borderRadius: 2,
                      }}
                    >
                      <div
                        title={tooltip}
                        style={{
                          position: 'absolute',
                          left: `${startPct}%`,
                          width: `${widthPct}%`,
                          top: 3,
                          bottom: 3,
                          background:
                            p.status === 'on-track'
                              ? 'linear-gradient(90deg, var(--gold), #e8c98a)'
                              : color,
                          opacity: p.status === 'past' ? 0.75 : 0.92,
                          borderRadius: 2,
                          cursor: 'help',
                          transition: 'opacity 0.15s',
                        }}
                      />
                      {todayPct >= 0 && todayPct <= 100 && (
                        <div
                          title={`Today: ${formatDate(todayMs)}`}
                          style={{
                            position: 'absolute',
                            left: `${todayPct}%`,
                            top: -3,
                            bottom: -3,
                            width: 2,
                            background: 'var(--gold)',
                            transform: 'translateX(-1px)',
                            boxShadow: '0 0 6px rgba(201,169,110,0.6)',
                            zIndex: 2,
                          }}
                        />
                      )}
                    </div>

                    <div
                      style={{
                        width: 130,
                        minWidth: 130,
                        paddingLeft: 12,
                        fontSize: 11,
                        color: 'var(--ink-mute)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span style={{ color, fontWeight: 600, marginRight: 4 }}>
                        {formatShortDate(p.end_iso)}
                      </span>
                      <span style={{ color: 'var(--ink-dim)' }}>
                        {p.daysRemaining >= 0
                          ? `${p.daysRemaining}d left`
                          : `${Math.abs(p.daysRemaining)}d past`}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Bottom axis mid date hint (subtle) */}
            <div
              aria-hidden
              style={{
                marginLeft: 90,
                marginRight: 130,
                marginTop: 10,
                fontSize: 10,
                color: 'var(--ink-dim)',
                textAlign: 'center',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              <span style={{ display: 'inline-block' }}>
                Mid: {formatDate(domain.start + (domain.end - domain.start) * (midPct / 100))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary table */}
      <div className="dash-card" style={{ marginTop: 16 }}>
        <div className="dash-card-header">
          <div>
            <div className="dash-card-title">Position summary</div>
            <div className="dash-card-sub">
              {positions.length} position{positions.length === 1 ? '' : 's'} tracked
            </div>
          </div>
        </div>
        <div className="dash-table-wrap" style={{ marginTop: 12 }}>
          <table className="dash-table" style={{ minWidth: 720 }}>
            <thead>
              <tr>
                <th
                  className={`dash-th${sortKey === 'symbol' ? ' sorted' : ''}`}
                  onClick={() => handleSort('symbol')}
                >
                  Symbol{arrow('symbol')}
                </th>
                <th
                  className={`dash-th${sortKey === 'entry_date' ? ' sorted' : ''}`}
                  onClick={() => handleSort('entry_date')}
                >
                  Entry date{arrow('entry_date')}
                </th>
                <th
                  className={`dash-th${sortKey === 'end_date' ? ' sorted' : ''}`}
                  onClick={() => handleSort('end_date')}
                >
                  End date{arrow('end_date')}
                </th>
                <th
                  className={`dash-th${sortKey === 'days_remaining' ? ' sorted' : ''}`}
                  onClick={() => handleSort('days_remaining')}
                >
                  Days remaining{arrow('days_remaining')}
                </th>
                <th
                  className={`dash-th${sortKey === 'progress' ? ' sorted' : ''}`}
                  onClick={() => handleSort('progress')}
                >
                  Progress{arrow('progress')}
                </th>
                <th
                  className={`dash-th${sortKey === 'status' ? ' sorted' : ''}`}
                  onClick={() => handleSort('status')}
                >
                  Status{arrow('status')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => {
                const remainingLabel =
                  p.daysRemaining >= 0
                    ? `${p.daysRemaining}d`
                    : `${Math.abs(p.daysRemaining)}d past`
                return (
                  <tr key={`${p.symbol}-${p.entry_iso}-row`} className="dash-tr">
                    <td className="dash-td">
                      {p.caseId ? (
                        <Link
                          href={`/admin/cases/${p.caseId}`}
                          style={{
                            textDecoration: 'none',
                            color: 'inherit',
                          }}
                        >
                          <span className="dash-symbol" style={{ color: 'var(--gold)' }}>
                            {p.symbol}
                          </span>
                        </Link>
                      ) : (
                        <span className="dash-symbol">{p.symbol}</span>
                      )}
                    </td>
                    <td className="dash-td">
                      <span className="dash-date">{formatDate(p.entry_iso)}</span>
                    </td>
                    <td className="dash-td">
                      <span className="dash-date">{formatDate(p.end_iso)}</span>
                    </td>
                    <td className="dash-td">
                      <span
                        style={{
                          color:
                            p.daysRemaining < 0
                              ? 'var(--dash-red)'
                              : p.daysRemaining <= APPROACHING_DAYS
                                ? 'var(--dash-orange)'
                                : 'var(--ink)',
                          fontFamily: 'var(--serif)',
                          fontWeight: 600,
                        }}
                      >
                        {remainingLabel}
                      </span>
                    </td>
                    <td className="dash-td">
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <div className="weight-bar-track">
                          <div
                            className="weight-bar-fill"
                            style={{ width: `${Math.min(100, p.progress)}%` }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: 12,
                            color: 'var(--ink)',
                            minWidth: 36,
                            fontFamily: 'var(--serif)',
                          }}
                        >
                          {p.progress.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="dash-td">
                      <span
                        className={statusBadgeClass(p.status)}
                        style={
                          p.status === 'on-track'
                            ? {
                                color: 'var(--gold)',
                                background: 'rgba(201,169,110,0.07)',
                                borderColor: 'var(--gold-line)',
                              }
                            : undefined
                        }
                      >
                        {statusLabel(p.status)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
