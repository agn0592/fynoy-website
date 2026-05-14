'use client'

import { useState } from 'react'

interface ClosedTrade {
  symbol: string
  entry_date: string
  exit_date: string
  entry_price: number
  exit_price: number
  realized_pnl: number
  realized_pnl_pct: number
  holding_period_days: number
}

interface ClosedTradesTableProps {
  trades: ClosedTrade[]
}

const PAGE_SIZE = 10

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

function formatDate(d: string): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function ClosedTradesTable({ trades }: ClosedTradesTableProps) {
  const [page, setPage] = useState(0)
  const totalPages = Math.ceil(trades.length / PAGE_SIZE)
  const pageData = trades.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const thStyle: React.CSSProperties = {
    padding: '10px 16px',
    textAlign: 'left',
    color: '#6b7280',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
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
          Closed Trades
        </h2>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>Symbol</th>
              <th style={thStyle}>Entry Date</th>
              <th style={thStyle}>Exit Date</th>
              <th style={thStyle}>Entry Price</th>
              <th style={thStyle}>Exit Price</th>
              <th style={thStyle}>Realized PnL (€)</th>
              <th style={thStyle}>Realized PnL (%)</th>
              <th style={thStyle}>Holding Period (days)</th>
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ ...tdStyle, textAlign: 'center', color: '#6b7280' }}>
                  No closed trades
                </td>
              </tr>
            ) : (
              pageData.map((trade, i) => {
                const pnlColor = trade.realized_pnl >= 0 ? '#22c55e' : '#ef4444'
                return (
                  <tr key={`${trade.symbol}-${i}`}>
                    <td style={{ ...tdStyle, fontWeight: 600, color: '#fff' }}>{trade.symbol}</td>
                    <td style={tdStyle}>{formatDate(trade.entry_date)}</td>
                    <td style={tdStyle}>{formatDate(trade.exit_date)}</td>
                    <td style={tdStyle}>{formatEur(trade.entry_price)}</td>
                    <td style={tdStyle}>{formatEur(trade.exit_price)}</td>
                    <td style={{ ...tdStyle, color: pnlColor, fontWeight: 500 }}>
                      {formatEur(trade.realized_pnl)}
                    </td>
                    <td style={{ ...tdStyle, color: pnlColor, fontWeight: 500 }}>
                      {formatPct(trade.realized_pnl_pct)}
                    </td>
                    <td style={tdStyle}>{trade.holding_period_days}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 24px',
            borderTop: '1px solid #2a2d3e',
          }}
        >
          <span style={{ color: '#6b7280', fontSize: '13px' }}>
            Page {page + 1} of {totalPages} ({trades.length} trades)
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: '1px solid #2a2d3e',
                background: 'transparent',
                color: page === 0 ? '#374151' : '#9ca3af',
                cursor: page === 0 ? 'default' : 'pointer',
                fontSize: '13px',
              }}
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: '1px solid #2a2d3e',
                background: 'transparent',
                color: page === totalPages - 1 ? '#374151' : '#9ca3af',
                cursor: page === totalPages - 1 ? 'default' : 'pointer',
                fontSize: '13px',
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
