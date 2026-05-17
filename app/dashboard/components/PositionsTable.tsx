'use client'

import { Fragment, useState } from 'react'
import ReactMarkdown from 'react-markdown'

interface Position {
  symbol: string
  pct_of_nav: number
  unrealized_pnl_pct: number
  trading_id: string | null
  take_profit_pct: number | null
  stop_loss_pct: number | null
}
type SortKey = 'symbol' | 'pct_of_nav' | 'unrealized_pnl_pct'
type SortDir = 'asc' | 'desc'

function fmtPct(v: number) { return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%` }

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

export default function PositionsTable({ positions }: { positions: Position[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('pct_of_nav')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [summaries, setSummaries] = useState<Record<string, string>>({})
  const [loadingId, setLoadingId] = useState<string | null>(null)

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  async function handleRowClick(tradingId: string | null) {
    if (!tradingId) return
    if (expandedId === tradingId) {
      setExpandedId(null)
      return
    }
    setExpandedId(tradingId)

    if (!summaries[tradingId]) {
      setLoadingId(tradingId)
      try {
        const res = await fetch(`/api/cases/summary?trading_id=${encodeURIComponent(tradingId)}`)
        const data = await res.json()
        if (data.summary) {
          setSummaries(prev => ({ ...prev, [tradingId]: data.summary }))
        }
      } catch {
        // swallow, render fallback
      } finally {
        setLoadingId(null)
      }
    }
  }

  const sorted = [...positions].sort((a, b) => {
    const av = a[sortKey], bv = b[sortKey]
    if (typeof av === 'string' && typeof bv === 'string')
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
  })

  const arrow = (k: SortKey) => sortKey === k ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''

  return (
    <div className="dash-card">
      <div className="dash-card-header">
        <div>
          <div className="dash-card-title">Open Positions</div>
          <div className="dash-card-sub">{positions.length} active {positions.length === 1 ? 'holding' : 'holdings'}</div>
        </div>
      </div>
      <div style={{ overflowX: 'auto', marginTop: 12 }}>
        <table className="dash-table">
          <thead>
            <tr>
              <th className={`dash-th${sortKey === 'symbol' ? ' sorted' : ''}`} onClick={() => handleSort('symbol')}>Symbol{arrow('symbol')}</th>
              <th className={`dash-th${sortKey === 'pct_of_nav' ? ' sorted' : ''}`} onClick={() => handleSort('pct_of_nav')}>Weight{arrow('pct_of_nav')}</th>
              <th className={`dash-th${sortKey === 'unrealized_pnl_pct' ? ' sorted' : ''}`} onClick={() => handleSort('unrealized_pnl_pct')}>Return{arrow('unrealized_pnl_pct')}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={3} className="dash-td" style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--ink-dim)', fontStyle: 'italic', fontFamily: 'var(--serif)' }}>
                  No open positions
                </td>
              </tr>
            ) : sorted.map(pos => {
              const navPct = Math.min(100, Math.max(0, pos.pct_of_nav))
              const isExpanded = pos.trading_id != null && expandedId === pos.trading_id
              const isClickable = !!pos.trading_id

              return (
                <Fragment key={pos.symbol}>
                  <tr
                    className="dash-tr"
                    onClick={() => handleRowClick(pos.trading_id)}
                    style={{ cursor: isClickable ? 'pointer' : 'default' }}
                    aria-expanded={isExpanded ? 'true' : 'false'}
                  >
                    <td className="dash-td">
                      <span className="dash-symbol">{pos.symbol}</span>
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
                    <td className="dash-td">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="weight-bar-track">
                          <div className="weight-bar-fill" style={{ width: `${navPct}%` }} />
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--ink)', minWidth: 32 }}>{pos.pct_of_nav.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="dash-td">
                      <span className={`ret-badge ${pos.unrealized_pnl_pct >= 0 ? 'up' : 'dn'}`}>
                        {fmtPct(pos.unrealized_pnl_pct)}
                      </span>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr>
                      <td colSpan={3} style={{ padding: 0 }}>
                        <div className="trade-detail-panel">
                          {loadingId === pos.trading_id ? (
                            <div style={{ color: 'var(--ink-dim)', fontSize: 13 }}>Analyse laden…</div>
                          ) : summaries[pos.trading_id as string] ? (
                            <div className="trade-detail-grid">
                              <div className="dash-commentary-body" style={{ fontSize: 13 }}>
                                <ReactMarkdown components={MARKDOWN_COMPONENTS}>
                                  {summaries[pos.trading_id as string]}
                                </ReactMarkdown>
                              </div>
                              <div className="trade-detail-targets">
                                {pos.take_profit_pct != null && (
                                  <div className="trade-target up">
                                    <span className="trade-target-label">TP</span>
                                    <span className="trade-target-val">{fmtPct(pos.take_profit_pct)}</span>
                                  </div>
                                )}
                                {pos.stop_loss_pct != null && (
                                  <div className="trade-target dn">
                                    <span className="trade-target-label">SL</span>
                                    <span className="trade-target-val">{fmtPct(pos.stop_loss_pct)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div style={{ color: 'var(--ink-dim)', fontSize: 13 }}>Geen case analyse beschikbaar.</div>
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
    </div>
  )
}
