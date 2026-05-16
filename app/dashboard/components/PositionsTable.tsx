'use client'

import { useState } from 'react'

interface Position {
  symbol: string
  pct_of_nav: number
  unrealized_pnl_pct: number
}

type SortKey = keyof Position
type SortDir = 'asc' | 'desc'

function fmtPct(v: number): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
}

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

  function thClass(key: SortKey) {
    return `dash-th${sortKey === key ? ' sorted' : ''}`
  }

  function arrow(key: SortKey) {
    if (sortKey !== key) return <span style={{ color: 'rgba(232,228,220,0.2)', marginLeft: 4 }}>↕</span>
    return <span style={{ marginLeft: 4 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <div className="dash-panel" style={{ padding: 0 }}>
      <div style={{ padding: 'clamp(20px,3vw,32px)', paddingBottom: 0 }}>
        <div className="dash-panel-title">Open Positions</div>
        <div className="dash-panel-sub">{positions.length} active {positions.length === 1 ? 'holding' : 'holdings'}</div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="dash-table">
          <thead>
            <tr style={{ background: 'rgba(10,15,30,0.6)' }}>
              <th className={thClass('symbol')} onClick={() => handleSort('symbol')}>Symbol {arrow('symbol')}</th>
              <th className={thClass('pct_of_nav')} onClick={() => handleSort('pct_of_nav')}>Weight {arrow('pct_of_nav')}</th>
              <th className={thClass('unrealized_pnl_pct')} onClick={() => handleSort('unrealized_pnl_pct')}>Return {arrow('unrealized_pnl_pct')}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={3} className="dash-td" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--ink-dim)', fontStyle: 'italic', fontFamily: 'var(--serif)' }}>
                  No open positions
                </td>
              </tr>
            ) : (
              sorted.map(pos => {
                const isUp = pos.unrealized_pnl_pct >= 0
                const navPct = Math.min(100, Math.max(0, pos.pct_of_nav))
                return (
                  <tr key={pos.symbol} className="dash-tr">
                    <td className="dash-td">
                      <span className="dash-symbol">{pos.symbol}</span>
                    </td>
                    <td className="dash-td">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="nav-bar-track">
                          <div className="nav-bar-fill" style={{ width: `${navPct}%` }} />
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--ink)', fontWeight: 500, minWidth: 36 }}>
                          {pos.pct_of_nav.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="dash-td">
                      <span className={`ret-badge ${isUp ? 'up' : 'dn'}`}>
                        {fmtPct(pos.unrealized_pnl_pct)}
                      </span>
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
