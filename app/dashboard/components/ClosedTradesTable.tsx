'use client'

import { useState } from 'react'

interface ClosedTrade {
  symbol: string
  entry_date: string
  exit_date: string
  realized_pnl: number
  realized_pnl_pct: number
  holding_period_days: number
}

interface ClosedTradesTableProps {
  trades: ClosedTrade[]
}

const PAGE_SIZE = 10

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
    padding: '12px 20px',
    textAlign: 'left',
    color: '#4b5563',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    whiteSpace: 'nowrap',
    borderBottom: '1px solid #2a2d3e',
  }

  const tdStyle: React.CSSProperties = {
    padding: '14px 20px',
    fontSize: '13px',
    color: '#d1d5db',
    whiteSpace: 'nowrap',
  }

  const winRate = trades.length > 0
    ? ((trades.filter((t) => t.realized_pnl_pct >= 0).length / trades.length) * 100).toFixed(0)
    : null

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #1a1d27 0%, #1e2130 100%)',
        border: '1px solid #2a2d3e',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '20px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h2 style={{ color: '#fff', fontSize: '15px', fontWeight: 600, margin: 0, letterSpacing: '-0.01em' }}>
            Closed Trades
          </h2>
          <p style={{ color: '#4b5563', fontSize: '12px', margin: '4px 0 0' }}>
            {trades.length} {trades.length === 1 ? 'trade' : 'trades'} closed
            {winRate !== null && <> · <span style={{ color: '#22c55e' }}>{winRate}% win rate</span></>}
          </p>
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#161820' }}>
              <th style={thStyle}>Symbol</th>
              <th style={thStyle}>Entry Date</th>
              <th style={thStyle}>Exit Date</th>
              <th style={thStyle}>Return</th>
              <th style={thStyle}>Held</th>
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: '#4b5563', padding: '40px 20px' }}>
                  No closed trades
                </td>
              </tr>
            ) : (
              pageData.map((trade, i) => {
                const pnlColor = trade.realized_pnl_pct >= 0 ? '#22c55e' : '#ef4444'
                return (
                  <tr
                    key={`${trade.symbol}-${i}`}
                    style={{
                      borderTop: '1px solid #1e2130',
                      background: i % 2 === 0 ? 'transparent' : '#161820',
                    }}
                  >
                    <td style={{ ...tdStyle, fontWeight: 700, color: '#fff', fontSize: '14px' }}>{trade.symbol}</td>
                    <td style={{ ...tdStyle, color: '#9ca3af' }}>{formatDate(trade.entry_date)}</td>
                    <td style={{ ...tdStyle, color: '#9ca3af' }}>{formatDate(trade.exit_date)}</td>
                    <td style={{ ...tdStyle, color: pnlColor, fontWeight: 700, fontSize: '14px' }}>
                      {formatPct(trade.realized_pnl_pct)}
                    </td>
                    <td style={{ ...tdStyle, color: '#6b7280' }}>
                      {trade.holding_period_days}d
                    </td>
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
          <span style={{ color: '#4b5563', fontSize: '13px' }}>
            Page {page + 1} of {totalPages}
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
                color: page === 0 ? '#2a2d3e' : '#6b7280',
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
                color: page === totalPages - 1 ? '#2a2d3e' : '#6b7280',
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
