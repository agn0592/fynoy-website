'use client'

import { useState } from 'react'

interface Position { symbol: string; pct_of_nav: number; unrealized_pnl_pct: number }
type SortKey = keyof Position
type SortDir = 'asc' | 'desc'

function fmtPct(v: number) { return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%` }

export default function PositionsTable({ positions }: { positions: Position[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('pct_of_nav')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
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
              return (
                <tr key={pos.symbol} className="dash-tr">
                  <td className="dash-td"><span className="dash-symbol">{pos.symbol}</span></td>
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
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
