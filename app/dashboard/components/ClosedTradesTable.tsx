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

const PAGE_SIZE = 10

function fmtPct(v: number): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
}

function fmtDate(d: string): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
}

export default function ClosedTradesTable({ trades }: { trades: ClosedTrade[] }) {
  const [page, setPage] = useState(0)
  const totalPages = Math.ceil(trades.length / PAGE_SIZE)
  const pageData = trades.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const wins = trades.filter(t => t.realized_pnl_pct >= 0).length
  const winRate = trades.length > 0 ? Math.round((wins / trades.length) * 100) : null

  const avgReturn = trades.length > 0
    ? trades.reduce((s, t) => s + t.realized_pnl_pct, 0) / trades.length
    : null

  return (
    <>
      <div className="dash-table-head">
        <div>
          <div className="dash-panel-title">Closed Trades</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
            <span className="dash-panel-sub" style={{ margin: 0 }}>{trades.length} trades</span>
            {winRate !== null && (
              <span className="win-rate-badge">{winRate}% win rate</span>
            )}
            {avgReturn !== null && (
              <span style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: avgReturn >= 0 ? '#4ade80' : '#f87171' }}>
                avg {fmtPct(avgReturn)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="dash-table-wrap">
        <table className="dash-table">
          <thead>
            <tr style={{ background: 'rgba(10,15,30,0.6)' }}>
              <th className="dash-th">Symbol</th>
              <th className="dash-th">Entry</th>
              <th className="dash-th">Exit</th>
              <th className="dash-th">Return</th>
              <th className="dash-th">Held</th>
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={5} className="dash-td" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--ink-dim)', fontStyle: 'italic', fontFamily: 'var(--serif)' }}>
                  No closed trades
                </td>
              </tr>
            ) : (
              pageData.map((t, i) => {
                const isUp = t.realized_pnl_pct >= 0
                return (
                  <tr key={`${t.symbol}-${i}`} className="dash-tr">
                    <td className="dash-td">
                      <span className="dash-symbol">{t.symbol}</span>
                    </td>
                    <td className="dash-td">
                      <span className="dash-date">{fmtDate(t.entry_date)}</span>
                    </td>
                    <td className="dash-td">
                      <span className="dash-date">{fmtDate(t.exit_date)}</span>
                    </td>
                    <td className="dash-td">
                      <span className={`ret-badge ${isUp ? 'up' : 'dn'}`}>
                        {fmtPct(t.realized_pnl_pct)}
                      </span>
                    </td>
                    <td className="dash-td">
                      <span style={{ fontSize: 12, color: 'var(--ink-dim)' }}>{t.holding_period_days}d</span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="dash-pagination">
          <span className="dash-page-info">
            {page + 1} / {totalPages} &nbsp;·&nbsp; {trades.length} trades
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="dash-page-btn"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              ← Prev
            </button>
            <button
              className="dash-page-btn"
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </>
  )
}
