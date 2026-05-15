'use client'

import { useState } from 'react'

interface Position {
  symbol: string
  pct_of_nav: number
  unrealized_pnl_pct: number
}

interface PositionsTableProps {
  positions: Position[]
}

type SortKey = keyof Position
type SortDir = 'asc' | 'desc'

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'symbol', label: 'Symbol' },
  { key: 'pct_of_nav', label: '% of Portfolio' },
  { key: 'unrealized_pnl_pct', label: 'Return' },
]

function formatPct(v: number): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
}

export default function PositionsTable({ positions }: PositionsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('pct_of_nav')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sorted = [...positions].sort((a, b) => {
    const av = a[sortKey]
    const bv = b[sortKey]
    if (typeof av === 'string' && typeof bv === 'string') {
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    }
    const an = av as number
    const bn = bv as number
    return sortDir === 'asc' ? an - bn : bn - an
  })

  const thStyle: React.CSSProperties = {
    padding: '12px 20px',
    textAlign: 'left',
    color: '#4b5563',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    cursor: 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    borderBottom: '1px solid #2a2d3e',
  }

  const tdStyle: React.CSSProperties = {
    padding: '14px 20px',
    fontSize: '13px',
    color: '#d1d5db',
    whiteSpace: 'nowrap',
  }

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #1a1d27 0%, #1e2130 100%)',
        border: '1px solid #2a2d3e',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '20px 24px 16px' }}>
        <h2 style={{ color: '#fff', fontSize: '15px', fontWeight: 600, margin: 0, letterSpacing: '-0.01em' }}>
          Open Positions
        </h2>
        <p style={{ color: '#4b5563', fontSize: '12px', margin: '4px 0 0' }}>
          {positions.length} active {positions.length === 1 ? 'holding' : 'holdings'}
        </p>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#161820' }}>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  style={{
                    ...thStyle,
                    color: sortKey === col.key ? '#3b82f6' : '#4b5563',
                  }}
                  onClick={() => handleSort(col.key)}
                >
                  {col.label}{' '}
                  {sortKey === col.key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} style={{ ...tdStyle, textAlign: 'center', color: '#4b5563', padding: '40px 20px' }}>
                  No open positions
                </td>
              </tr>
            ) : (
              sorted.map((pos, i) => {
                const pnlColor = pos.unrealized_pnl_pct >= 0 ? '#22c55e' : '#ef4444'
                const navPct = Math.min(100, Math.max(0, pos.pct_of_nav))
                return (
                  <tr
                    key={pos.symbol}
                    style={{
                      borderTop: '1px solid #1e2130',
                      background: i % 2 === 0 ? 'transparent' : '#161820',
                      transition: 'background 0.1s',
                    }}
                  >
                    <td style={{ ...tdStyle, fontWeight: 700, color: '#fff', fontSize: '14px' }}>
                      {pos.symbol}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            height: '4px',
                            width: '80px',
                            background: '#2a2d3e',
                            borderRadius: '2px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${navPct}%`,
                              background: '#3b82f6',
                              borderRadius: '2px',
                            }}
                          />
                        </div>
                        <span style={{ color: '#9ca3af', minWidth: '40px' }}>
                          {pos.pct_of_nav.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td style={{ ...tdStyle, color: pnlColor, fontWeight: 600 }}>
                      {formatPct(pos.unrealized_pnl_pct)}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
