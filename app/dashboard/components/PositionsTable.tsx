'use client'

import { useState } from 'react'

interface Position {
  symbol: string
  entry_price_actual: number
  current_price: number
  position_size_actual: number
  pct_of_nav: number
  unrealized_pnl: number
  unrealized_pnl_pct: number
}

interface PositionsTableProps {
  positions: Position[]
}

type SortKey = keyof Position
type SortDir = 'asc' | 'desc'

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'symbol', label: 'Symbol' },
  { key: 'entry_price_actual', label: 'Entry Price' },
  { key: 'current_price', label: 'Current Price' },
  { key: 'position_size_actual', label: 'Position Size' },
  { key: 'pct_of_nav', label: '% NAV' },
  { key: 'unrealized_pnl', label: 'Unrealized PnL (€)' },
  { key: 'unrealized_pnl_pct', label: 'Unrealized PnL (%)' },
]

function formatEur(v: number): string {
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(v)
}

function formatPct(v: number): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
}

export default function PositionsTable({ positions }: PositionsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('unrealized_pnl')
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
    padding: '10px 16px',
    textAlign: 'left',
    color: '#6b7280',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    cursor: 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap',
  }

  const tdStyle: React.CSSProperties = {
    padding: '12px 16px',
    fontSize: '13px',
    color: '#e5e7eb',
    borderTop: '1px solid #2a2d3e',
    whiteSpace: 'nowrap',
  }

  return (
    <div
      style={{
        background: '#1a1d27',
        border: '1px solid #2a2d3e',
        borderRadius: '10px',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '20px 24px 0', marginBottom: '4px' }}>
        <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: 600, margin: 0 }}>
          Open Positions
        </h2>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  style={{
                    ...thStyle,
                    color: sortKey === col.key ? '#3b82f6' : '#6b7280',
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
                <td colSpan={COLUMNS.length} style={{ ...tdStyle, textAlign: 'center', color: '#6b7280' }}>
                  No open positions
                </td>
              </tr>
            ) : (
              sorted.map((pos) => {
                const pnlColor = pos.unrealized_pnl >= 0 ? '#22c55e' : '#ef4444'
                return (
                  <tr key={pos.symbol} style={{ transition: 'background 0.1s' }}>
                    <td style={{ ...tdStyle, fontWeight: 600, color: '#fff' }}>{pos.symbol}</td>
                    <td style={tdStyle}>{formatEur(pos.entry_price_actual)}</td>
                    <td style={tdStyle}>{formatEur(pos.current_price)}</td>
                    <td style={tdStyle}>{pos.position_size_actual.toLocaleString()}</td>
                    <td style={tdStyle}>{pos.pct_of_nav.toFixed(2)}%</td>
                    <td style={{ ...tdStyle, color: pnlColor, fontWeight: 500 }}>
                      {formatEur(pos.unrealized_pnl)}
                    </td>
                    <td style={{ ...tdStyle, color: pnlColor, fontWeight: 500 }}>
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
