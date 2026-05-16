'use client'

import { useState } from 'react'

interface ClosedTrade {
  symbol: string; entry_date: string; exit_date: string
  realized_pnl: number; realized_pnl_pct: number; holding_period_days: number
}

const PAGE_SIZE = 8

function fmtPct(v: number) { return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%` }
function fmtDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
}

export default function ClosedTradesTable({ trades }: { trades: ClosedTrade[] }) {
  const [page, setPage] = useState(0)
  const totalPages = Math.ceil(trades.length / PAGE_SIZE)
  const pageData = trades.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const wins = trades.filter(t => t.realized_pnl_pct >= 0).length
  const winRate = trades.length > 0 ? Math.round((wins / trades.length) * 100) : null
  const avgReturn = trades.length > 0 ? trades.reduce((s, t) => s + t.realized_pnl_pct, 0) / trades.length : null

  return (
    <div className="dash-card">
      <div className="dash-card-header">
        <div>
          <div className="dash-card-title">Trade History</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <div className="dash-card-sub" style={{ marginTop: 0 }}>{trades.length} trades</div>
            {winRate !== null && <span className="win-badge">{winRate}% win</span>}
            {avgReturn !== null && (
              <span style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: avgReturn >= 0 ? '#4ade80' : '#f87171' }}>
                avg {fmtPct(avgReturn)}
              </span>
            )}
          </div>
        </div>
      </div>
      <div style={{ overflowX: 'auto', marginTop: 12 }}>
        <table className="dash-table">
          <thead>
            <tr>
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
                <td colSpan={5} className="dash-td" style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--ink-dim)', fontStyle: 'italic', fontFamily: 'var(--serif)' }}>
                  No closed trades
                </td>
              </tr>
            ) : pageData.map((t, i) => (
              <tr key={`${t.symbol}-${i}`} className="dash-tr">
                <td className="dash-td"><span className="dash-symbol">{t.symbol}</span></td>
                <td className="dash-td"><span className="dash-date">{fmtDate(t.entry_date)}</span></td>
                <td className="dash-td"><span className="dash-date">{fmtDate(t.exit_date)}</span></td>
                <td className="dash-td">
                  <span className={`ret-badge ${t.realized_pnl_pct >= 0 ? 'up' : 'dn'}`}>{fmtPct(t.realized_pnl_pct)}</span>
                </td>
                <td className="dash-td"><span style={{ fontSize: 11, color: 'var(--ink-dim)' }}>{t.holding_period_days}d</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="dash-pagination">
          <span className="dash-page-info">{page + 1} / {totalPages}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="dash-page-btn" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>← Prev</button>
            <button className="dash-page-btn" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}>Next →</button>
          </div>
        </div>
      )}
    </div>
  )
}
