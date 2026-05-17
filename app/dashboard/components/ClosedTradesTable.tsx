'use client'

import { Fragment, useState } from 'react'
import ReactMarkdown from 'react-markdown'

interface ClosedTrade {
  symbol: string
  entry_date: string
  exit_date: string
  realized_pnl: number
  realized_pnl_pct: number
  holding_period_days: number
  trading_id?: string | null
}

const PAGE_SIZE = 8

function fmtPct(v: number) { return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%` }
function fmtDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
}

const MARKDOWN_COMPONENTS = {
  h1: ({ children }: { children?: React.ReactNode }) => <h1 className="commentary-h1">{children}</h1>,
  h2: ({ children }: { children?: React.ReactNode }) => <h2 className="commentary-h2">{children}</h2>,
  h3: ({ children }: { children?: React.ReactNode }) => <h3 className="commentary-h3">{children}</h3>,
  p:  ({ children }: { children?: React.ReactNode }) => <p  className="commentary-p">{children}</p>,
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="commentary-ul">{children}</ul>,
  li: ({ children }: { children?: React.ReactNode }) => <li className="commentary-li">{children}</li>,
  strong: ({ children }: { children?: React.ReactNode }) => <strong className="commentary-strong">{children}</strong>,
  hr: () => <hr className="commentary-hr" />,
} as const

export default function ClosedTradesTable({ trades }: { trades: ClosedTrade[] }) {
  const [page, setPage] = useState(0)
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [summaries, setSummaries] = useState<Record<string, string>>({})
  const [loadingKey, setLoadingKey] = useState<string | null>(null)
  const [errorKeys, setErrorKeys] = useState<Record<string, boolean>>({})

  const totalPages = Math.ceil(trades.length / PAGE_SIZE)
  const pageData = trades.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const wins = trades.filter(t => t.realized_pnl_pct >= 0).length
  const winRate = trades.length > 0 ? Math.round((wins / trades.length) * 100) : null
  const avgReturn = trades.length > 0 ? trades.reduce((s, t) => s + t.realized_pnl_pct, 0) / trades.length : null

  async function handleRowClick(trade: ClosedTrade, key: string) {
    if (!trade.trading_id) return
    if (expandedKey === key) {
      setExpandedKey(null)
      return
    }
    setExpandedKey(key)

    if (!summaries[key]) {
      setLoadingKey(key)
      setErrorKeys(prev => ({ ...prev, [key]: false }))
      try {
        const res = await fetch('/api/cases/summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trading_id: trade.trading_id,
            realized_pnl_pct: trade.realized_pnl_pct,
          }),
        })
        if (!res.ok) throw new Error(`status ${res.status}`)
        const data = await res.json()
        if (data.summary) setSummaries(prev => ({ ...prev, [key]: data.summary }))
        else throw new Error('empty')
      } catch {
        setErrorKeys(prev => ({ ...prev, [key]: true }))
      } finally {
        setLoadingKey(null)
      }
    }
  }

  function handleRowKey(e: React.KeyboardEvent<HTMLTableRowElement>, trade: ClosedTrade, key: string) {
    if (!trade.trading_id) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleRowClick(trade, key)
    }
  }

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
      <div className="dash-table-wrap">
        <table className="dash-table">
          <thead>
            <tr>
              <th scope="col" className="dash-th">Symbol</th>
              <th scope="col" className="dash-th">Entry</th>
              <th scope="col" className="dash-th">Exit</th>
              <th scope="col" className="dash-th">Return</th>
              <th scope="col" className="dash-th">Held</th>
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={5} className="dash-td" style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--ink-dim)', fontStyle: 'italic', fontFamily: 'var(--serif)' }}>
                  No closed trades
                </td>
              </tr>
            ) : pageData.map((t, i) => {
              const rowKey = `${t.symbol}-${t.entry_date}-${t.exit_date}-${i}`
              const isClickable = !!t.trading_id
              const isExpanded = expandedKey === rowKey
              return (
                <Fragment key={rowKey}>
                  <tr
                    className="dash-tr"
                    onClick={() => handleRowClick(t, rowKey)}
                    onKeyDown={(e) => handleRowKey(e, t, rowKey)}
                    style={{ cursor: isClickable ? 'pointer' : 'default' }}
                    tabIndex={isClickable ? 0 : undefined}
                    role={isClickable ? 'button' : undefined}
                    aria-expanded={isClickable ? (isExpanded ? 'true' : 'false') : undefined}
                    aria-label={isClickable ? `Closed trade ${t.symbol} — expand analysis` : undefined}
                  >
                    <td className="dash-td">
                      <span className="dash-symbol">{t.symbol}</span>
                      {isClickable && (
                        <span style={{
                          marginLeft: 8, color: 'var(--ink-dim)', fontSize: 11,
                          display: 'inline-block', transition: 'transform 0.15s',
                          transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        }}>
                          ›
                        </span>
                      )}
                    </td>
                    <td className="dash-td"><span className="dash-date">{fmtDate(t.entry_date)}</span></td>
                    <td className="dash-td"><span className="dash-date">{fmtDate(t.exit_date)}</span></td>
                    <td className="dash-td">
                      <span className={`ret-badge ${t.realized_pnl_pct >= 0 ? 'up' : 'dn'}`}>{fmtPct(t.realized_pnl_pct)}</span>
                    </td>
                    <td className="dash-td"><span style={{ fontSize: 11, color: 'var(--ink-dim)' }}>{t.holding_period_days}d</span></td>
                  </tr>

                  {isExpanded && (
                    <tr>
                      <td colSpan={5} style={{ padding: 0 }}>
                        <div className="trade-detail-panel" aria-live="polite">
                          {loadingKey === rowKey ? (
                            <div style={{ color: 'var(--ink-dim)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span className="dash-spinner" aria-hidden />
                              <span>Loading analysis…</span>
                            </div>
                          ) : errorKeys[rowKey] ? (
                            <div style={{ color: '#f87171', fontSize: 13 }}>
                              Could not load analysis. <button type="button" onClick={() => handleRowClick(t, rowKey)} style={{ color: 'var(--gold)', background: 'none', border: 0, padding: 0, cursor: 'pointer', textDecoration: 'underline' }}>Retry</button>
                            </div>
                          ) : summaries[rowKey] ? (
                            <div className="trade-detail-grid">
                              <div className="dash-commentary-body" style={{ fontSize: 13 }}>
                                <ReactMarkdown components={MARKDOWN_COMPONENTS}>
                                  {summaries[rowKey]}
                                </ReactMarkdown>
                              </div>
                              <div className="trade-detail-targets">
                                <div className={`trade-target ${t.realized_pnl_pct >= 0 ? 'up' : 'dn'}`}>
                                  <span className="trade-target-label">Result</span>
                                  <span className="trade-target-val">{fmtPct(t.realized_pnl_pct)}</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div style={{ color: 'var(--ink-dim)', fontSize: 13 }}>No case analysis available.</div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
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
