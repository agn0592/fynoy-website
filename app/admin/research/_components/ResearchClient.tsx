'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  IconSearch,
  IconFilter,
  IconStar,
} from '@/app/dashboard/components/Icons'

export interface CaseRow {
  id: string
  trading_id: string
  company_name: string | null
  ticker: string | null
  sector: string | null
  status: string | null
  trigger_score: number | null
  fundamental_score: number | null
  valuation_score: number | null
  conviction_score: number | null
  technical_score: number | null
  total_score: number | null
  date_of_case: string | null
}

type ChipKey = 'all' | 'active' | 'inactive' | 'top'

type SortKey =
  | 'trading_id'
  | 'company_name'
  | 'ticker'
  | 'status'
  | 'sector'
  | 'trigger_score'
  | 'fundamental_score'
  | 'valuation_score'
  | 'conviction_score'
  | 'technical_score'
  | 'total_score'
  | 'date_of_case'

type SortDir = 'asc' | 'desc'

interface Props {
  cases: CaseRow[]
  sectors: string[]
  initialChip: ChipKey
  initialSector: string
  initialQuery: string
}

const TOP_PICK_THRESHOLD = 35
const MAX_TOTAL = 48

function formatDate(d: string | null): string {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

function scoreClass(value: number | null, max: number): 'high' | 'medium' | 'low' | null {
  if (value === null) return null
  const pct = (value / max) * 100
  if (pct >= 75) return 'high'
  if (pct >= 50) return 'medium'
  return 'low'
}

function ScoreCell({ value, max }: { value: number | null; max: number }) {
  if (value === null) {
    return <span style={{ color: 'var(--ink-dim)' }}>—</span>
  }
  const cls = scoreClass(value, max)
  return (
    <span className={`score-badge ${cls ?? ''}`}>
      {value}
      <span className="max">/{max}</span>
    </span>
  )
}

function compareValues(a: unknown, b: unknown, dir: SortDir): number {
  // null/undefined always sort to the bottom regardless of direction
  const aNull = a === null || a === undefined
  const bNull = b === null || b === undefined
  if (aNull && bNull) return 0
  if (aNull) return 1
  if (bNull) return -1

  if (typeof a === 'number' && typeof b === 'number') {
    return dir === 'asc' ? a - b : b - a
  }
  const sa = String(a).toLowerCase()
  const sb = String(b).toLowerCase()
  return dir === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa)
}

export default function ResearchClient({
  cases,
  sectors,
  initialChip,
  initialSector,
  initialQuery,
}: Props) {
  const [chip, setChip] = useState<ChipKey>(initialChip)
  const [sector, setSector] = useState<string>(initialSector)
  const [query, setQuery] = useState<string>(initialQuery)
  const [sortKey, setSortKey] = useState<SortKey>('total_score')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      // numeric columns default to descending; text columns to ascending
      const isNumeric =
        key === 'trigger_score' ||
        key === 'fundamental_score' ||
        key === 'valuation_score' ||
        key === 'conviction_score' ||
        key === 'technical_score' ||
        key === 'total_score' ||
        key === 'date_of_case'
      setSortDir(isNumeric ? 'desc' : 'asc')
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return cases.filter((c) => {
      if (chip === 'active' && c.status !== 'Active') return false
      if (chip === 'inactive' && c.status !== 'Not Active') return false
      if (chip === 'top' && (c.total_score ?? 0) < TOP_PICK_THRESHOLD) return false
      if (sector && c.sector !== sector) return false
      if (q.length > 0) {
        const name = (c.company_name ?? '').toLowerCase()
        const ticker = (c.ticker ?? '').toLowerCase()
        if (!name.includes(q) && !ticker.includes(q)) return false
      }
      return true
    })
  }, [cases, chip, sector, query])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      if (sortKey === 'date_of_case') {
        const av = a.date_of_case ? new Date(a.date_of_case).getTime() : null
        const bv = b.date_of_case ? new Date(b.date_of_case).getTime() : null
        return compareValues(av, bv, sortDir)
      }
      return compareValues(a[sortKey], b[sortKey], sortDir)
    })
    return arr
  }, [filtered, sortKey, sortDir])

  const arrow = (k: SortKey) =>
    sortKey === k ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''

  const counts = useMemo(() => {
    let active = 0
    let inactive = 0
    let top = 0
    for (const c of cases) {
      if (c.status === 'Active') active++
      else if (c.status === 'Not Active') inactive++
      if ((c.total_score ?? 0) >= TOP_PICK_THRESHOLD) top++
    }
    return { all: cases.length, active, inactive, top }
  }, [cases])

  const chips: { key: ChipKey; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'active', label: 'Active', count: counts.active },
    { key: 'inactive', label: 'Not Active', count: counts.inactive },
    { key: 'top', label: `Top Picks ≥${TOP_PICK_THRESHOLD}`, count: counts.top },
  ]

  return (
    <>
      {/* Filter bar */}
      <div
        className="dash-card"
        style={{
          padding: '14px 18px',
          marginBottom: 16,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div className="dash-chips">
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              className={`dash-chip${chip === c.key ? ' is-active' : ''}`}
              onClick={() => setChip(c.key)}
            >
              {c.label}
              <span
                style={{
                  marginLeft: 4,
                  padding: '0 5px',
                  borderRadius: 2,
                  background: 'rgba(232,228,220,0.04)',
                  fontSize: 10,
                  color: 'var(--ink-dim)',
                }}
              >
                {c.count}
              </span>
            </button>
          ))}
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            minWidth: 0,
          }}
        >
          <IconFilter
            width={14}
            height={14}
            style={{ color: 'var(--ink-dim)', flexShrink: 0 }}
          />
          <select
            className="dash-select"
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            style={{ padding: '7px 32px 7px 11px', fontSize: 12, minWidth: 160 }}
            aria-label="Filter by sector"
          >
            <option value="">All sectors</option>
            {sectors.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div
          style={{
            marginLeft: 'auto',
            position: 'relative',
            minWidth: 220,
            flex: '0 1 320px',
          }}
        >
          <IconSearch
            width={14}
            height={14}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--ink-dim)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="search"
            className="dash-input"
            placeholder="Search company or ticker..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ paddingLeft: 34 }}
          />
        </div>
      </div>

      {/* Result count */}
      <div
        style={{
          fontSize: 11,
          color: 'var(--ink-dim)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span>
          {sorted.length} {sorted.length === 1 ? 'case' : 'cases'}
        </span>
        {sorted.some((c) => (c.total_score ?? 0) >= TOP_PICK_THRESHOLD) && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              color: 'var(--gold)',
            }}
          >
            <IconStar width={11} height={11} />
            top picks bordered gold
          </span>
        )}
      </div>

      {/* Table */}
      <div className="dash-card">
        <div className="dash-table-wrap">
          <table className="dash-table" style={{ minWidth: 1100 }}>
            <thead>
              <tr>
                <th
                  className={`dash-th${sortKey === 'trading_id' ? ' sorted' : ''}`}
                  onClick={() => handleSort('trading_id')}
                >
                  Trading ID{arrow('trading_id')}
                </th>
                <th
                  className={`dash-th${sortKey === 'company_name' ? ' sorted' : ''}`}
                  onClick={() => handleSort('company_name')}
                >
                  Company{arrow('company_name')}
                </th>
                <th
                  className={`dash-th${sortKey === 'ticker' ? ' sorted' : ''}`}
                  onClick={() => handleSort('ticker')}
                >
                  Ticker{arrow('ticker')}
                </th>
                <th
                  className={`dash-th${sortKey === 'status' ? ' sorted' : ''}`}
                  onClick={() => handleSort('status')}
                >
                  Status{arrow('status')}
                </th>
                <th
                  className={`dash-th${sortKey === 'trigger_score' ? ' sorted' : ''}`}
                  onClick={() => handleSort('trigger_score')}
                >
                  Trigger /7{arrow('trigger_score')}
                </th>
                <th
                  className={`dash-th${sortKey === 'fundamental_score' ? ' sorted' : ''}`}
                  onClick={() => handleSort('fundamental_score')}
                >
                  Fundamental /10{arrow('fundamental_score')}
                </th>
                <th
                  className={`dash-th${sortKey === 'valuation_score' ? ' sorted' : ''}`}
                  onClick={() => handleSort('valuation_score')}
                >
                  Valuation /8{arrow('valuation_score')}
                </th>
                <th
                  className={`dash-th${sortKey === 'conviction_score' ? ' sorted' : ''}`}
                  onClick={() => handleSort('conviction_score')}
                >
                  Conviction /10{arrow('conviction_score')}
                </th>
                <th
                  className={`dash-th${sortKey === 'technical_score' ? ' sorted' : ''}`}
                  onClick={() => handleSort('technical_score')}
                >
                  Technical /6{arrow('technical_score')}
                </th>
                <th
                  className={`dash-th${sortKey === 'total_score' ? ' sorted' : ''}`}
                  onClick={() => handleSort('total_score')}
                >
                  Total /48{arrow('total_score')}
                </th>
                <th
                  className={`dash-th${sortKey === 'date_of_case' ? ' sorted' : ''}`}
                  onClick={() => handleSort('date_of_case')}
                >
                  Date{arrow('date_of_case')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td className="dash-td" colSpan={11}>
                    <div className="dash-empty">No cases match the current filters.</div>
                  </td>
                </tr>
              ) : (
                sorted.map((c) => {
                  const total = c.total_score ?? 0
                  const isTopPick = total >= TOP_PICK_THRESHOLD
                  const totalPct = Math.min(100, Math.max(0, (total / MAX_TOTAL) * 100))
                  const statusClass = c.status === 'Active' ? 'active' : 'inactive'
                  return (
                    <tr
                      key={c.id}
                      className="dash-tr"
                      style={
                        isTopPick
                          ? { boxShadow: 'inset 2px 0 0 var(--gold)' }
                          : undefined
                      }
                    >
                      <td className="dash-td">
                        <Link
                          href={`/admin/cases/${c.id}`}
                          style={{
                            color: 'var(--gold)',
                            fontFamily: 'var(--serif)',
                            fontSize: 12,
                            letterSpacing: '0.02em',
                            textDecoration: 'none',
                          }}
                        >
                          {c.trading_id}
                        </Link>
                      </td>
                      <td className="dash-td">
                        <Link
                          href={`/admin/cases/${c.id}`}
                          style={{
                            display: 'block',
                            color: 'var(--ink)',
                            textDecoration: 'none',
                            minWidth: 0,
                          }}
                        >
                          <div className="dash-symbol" style={{ fontSize: 13 }}>
                            {c.company_name ?? '—'}
                          </div>
                          {c.sector && (
                            <div
                              style={{
                                fontSize: 10,
                                color: 'var(--ink-dim)',
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                                marginTop: 2,
                              }}
                            >
                              {c.sector}
                            </div>
                          )}
                        </Link>
                      </td>
                      <td className="dash-td">
                        <span className="dash-symbol" style={{ fontSize: 13 }}>
                          {c.ticker ?? '—'}
                        </span>
                      </td>
                      <td className="dash-td">
                        <span className={`status-badge ${statusClass}`}>
                          {c.status ?? 'Not Active'}
                        </span>
                      </td>
                      <td className="dash-td">
                        <ScoreCell value={c.trigger_score} max={7} />
                      </td>
                      <td className="dash-td">
                        <ScoreCell value={c.fundamental_score} max={10} />
                      </td>
                      <td className="dash-td">
                        <ScoreCell value={c.valuation_score} max={8} />
                      </td>
                      <td className="dash-td">
                        <ScoreCell value={c.conviction_score} max={10} />
                      </td>
                      <td className="dash-td">
                        <ScoreCell value={c.technical_score} max={6} />
                      </td>
                      <td className="dash-td">
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <span
                            className={
                              isTopPick
                                ? 'score-badge'
                                : `score-badge ${scoreClass(total, MAX_TOTAL) ?? ''}`
                            }
                            style={isTopPick ? { color: 'var(--gold)' } : undefined}
                          >
                            {c.total_score ?? 0}
                            <span className="max">/{MAX_TOTAL}</span>
                          </span>
                          <div className="weight-bar-track">
                            <div
                              className="weight-bar-fill"
                              style={{ width: `${totalPct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="dash-td">
                        <span className="dash-date">{formatDate(c.date_of_case)}</span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
