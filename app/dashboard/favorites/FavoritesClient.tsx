'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  loadFavorites,
  onFavoritesChange,
  closedTradeKey,
  type FavoritesState,
} from '@/lib/favorites'
import { fmtEUR, fmtPct, fmtNum } from '@/lib/analytics'
import FavoriteToggle from '@/app/dashboard/components/FavoriteToggle'
import InfoTooltip from '@/app/dashboard/components/InfoTooltip'
import { IconStar, IconArrowRight } from '@/app/dashboard/components/Icons'

export interface OpenPositionInput {
  symbol: string
  trading_id: string | null
  entry_price: number | null
  current_price: number | null
  position_size: number | null
  pct_of_nav: number | null
  unrealized_pnl: number | null
  unrealized_pnl_pct: number | null
  entry_date: string | null
}

export interface ClosedTradeInput {
  symbol: string
  entry_date: string | null
  exit_date: string | null
  entry_price: number | null
  exit_price: number | null
  position_size: number | null
  realized_pnl: number | null
  realized_pnl_pct: number | null
  holding_period_days: number | null
  trading_id: string | null
}

interface CaseRow {
  trading_id: string
  sector: string | null
  take_profit: number | null
  stop_loss: number | null
}

interface FavoritesClientProps {
  openPositions: OpenPositionInput[]
  closedTrades: ClosedTradeInput[]
  casesIndex: Record<string, CaseRow>
}

function fmtShortDate(s: string | null): string {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
}

function daysHeld(entry: string | null, exit: string | null): number | null {
  if (!entry || !exit) return null
  return Math.round((new Date(exit).getTime() - new Date(entry).getTime()) / 86_400_000)
}

export default function FavoritesClient({ openPositions, closedTrades, casesIndex }: FavoritesClientProps) {
  const [mounted, setMounted] = useState(false)
  const [favs, setFavs] = useState<FavoritesState>({ positions: [], closedTrades: [] })

  useEffect(() => {
    setFavs(loadFavorites())
    setMounted(true)
    const unsub = onFavoritesChange(setFavs)
    return unsub
  }, [])

  // Build favorited lists
  const favOpen = openPositions.filter(p => favs.positions.includes(p.symbol))
  const favClosed = closedTrades.filter(t =>
    favs.closedTrades.includes(closedTradeKey(t.symbol, t.entry_date, t.exit_date)),
  )

  // Aggregate stats
  const totalOpenNav = favOpen.reduce(
    (s, p) => s + ((p.current_price ?? 0) * (p.position_size ?? 0)),
    0,
  )
  const totalUnrealized = favOpen.reduce((s, p) => s + (p.unrealized_pnl ?? 0), 0)
  const wAvgUnrealized = (() => {
    if (totalOpenNav <= 0) return 0
    return favOpen.reduce(
      (s, p) => s + (p.unrealized_pnl_pct ?? 0) * ((p.current_price ?? 0) * (p.position_size ?? 0)),
      0,
    ) / totalOpenNav
  })()

  const totalRealized = favClosed.reduce((s, t) => s + (t.realized_pnl ?? 0), 0)
  const avgRealizedPct = favClosed.length > 0
    ? favClosed.reduce((s, t) => s + (t.realized_pnl_pct ?? 0), 0) / favClosed.length
    : 0
  const wins = favClosed.filter(t => (t.realized_pnl_pct ?? 0) > 0)
  const winRate = favClosed.length > 0 ? (wins.length / favClosed.length) * 100 : 0
  const avgHold = favClosed.length > 0
    ? Math.round(favClosed.reduce((s, t) => s + (t.holding_period_days ?? daysHeld(t.entry_date, t.exit_date) ?? 0), 0) / favClosed.length)
    : 0

  const bestClosed = favClosed.length > 0
    ? [...favClosed].sort((a, b) => (b.realized_pnl_pct ?? -Infinity) - (a.realized_pnl_pct ?? -Infinity))[0]
    : null
  const worstClosed = favClosed.length > 0
    ? [...favClosed].sort((a, b) => (a.realized_pnl_pct ?? Infinity) - (b.realized_pnl_pct ?? Infinity))[0]
    : null

  const bestOpen = favOpen.length > 0
    ? [...favOpen].sort((a, b) => (b.unrealized_pnl_pct ?? -Infinity) - (a.unrealized_pnl_pct ?? -Infinity))[0]
    : null
  const worstOpen = favOpen.length > 0
    ? [...favOpen].sort((a, b) => (a.unrealized_pnl_pct ?? Infinity) - (b.unrealized_pnl_pct ?? Infinity))[0]
    : null

  // Empty: nothing favorited yet
  if (mounted && favOpen.length === 0 && favClosed.length === 0) {
    return (
      <div className="dash-card" style={{ padding: 36, textAlign: 'center' }}>
        <div
          style={{
            width: 56, height: 56, margin: '0 auto 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '50%',
            background: 'rgba(201,169,110,0.08)',
            border: '1px solid var(--gold-line)',
            color: 'var(--gold)',
          }}
        >
          <IconStar width={26} height={26} />
        </div>
        <h2
          style={{
            fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 500,
            color: 'var(--ink)', margin: '0 0 6px',
          }}
        >
          No favorites yet
        </h2>
        <p style={{ color: 'var(--ink-mute)', fontSize: 13.5, maxWidth: 420, margin: '0 auto 22px', lineHeight: 1.6 }}>
          Tap the gold star on any position or closed trade to add it here. This page will then
          show the combined statistics for everything you&rsquo;ve picked.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/dashboard/holdings" className="dash-btn btn-gold">
            <IconStar width={13} height={13} /> Browse holdings
          </Link>
          <Link href="/dashboard/history" className="dash-btn btn-ghost">
            <IconArrowRight width={13} height={13} /> Browse trade history
          </Link>
        </div>
      </div>
    )
  }

  // Pre-mount: render skeleton-friendly empty container
  if (!mounted) {
    return (
      <div className="dash-card" style={{ padding: 36, textAlign: 'center', color: 'var(--ink-dim)' }}>
        Loading favorites…
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* KPI strip */}
      <div className="adm-kpi-grid">
        <div className="adm-kpi kpi-neutral">
          <div className="adm-kpi-label">
            Favorited Open <InfoTooltip term="open-positions" inheritColor />
          </div>
          <div className="adm-kpi-val">{favOpen.length}</div>
          <div className="adm-kpi-sub">Of {openPositions.length} total holdings</div>
        </div>
        <div className="adm-kpi kpi-neutral">
          <div className="adm-kpi-label">
            Favorited Closed
          </div>
          <div className="adm-kpi-val">{favClosed.length}</div>
          <div className="adm-kpi-sub">Of {closedTrades.length} total trades</div>
        </div>
        <div className={`adm-kpi ${wAvgUnrealized >= 0 ? 'kpi-up' : 'kpi-dn'}`}>
          <div className="adm-kpi-label">
            Weighted Unrealized <InfoTooltip term="unrealized-pnl" inheritColor />
          </div>
          <div className={`adm-kpi-val ${wAvgUnrealized >= 0 ? 'up' : 'dn'}`}>{fmtPct(wAvgUnrealized)}</div>
          <div className="adm-kpi-sub">{fmtEUR(totalUnrealized)} on {fmtEUR(totalOpenNav)} NAV</div>
        </div>
        <div className={`adm-kpi ${avgRealizedPct >= 0 ? 'kpi-up' : 'kpi-dn'}`}>
          <div className="adm-kpi-label">
            Avg Realized <InfoTooltip term="realized-pnl" inheritColor />
          </div>
          <div className={`adm-kpi-val ${avgRealizedPct >= 0 ? 'up' : 'dn'}`}>
            {favClosed.length > 0 ? fmtPct(avgRealizedPct) : '—'}
          </div>
          <div className="adm-kpi-sub">{fmtEUR(totalRealized)} total</div>
        </div>
        <div className={`adm-kpi ${winRate >= 50 ? 'kpi-up' : 'kpi-dn'}`}>
          <div className="adm-kpi-label">
            Win Rate <InfoTooltip term="win-rate" inheritColor />
          </div>
          <div className={`adm-kpi-val ${winRate >= 50 ? 'up' : 'dn'}`}>
            {favClosed.length > 0 ? `${winRate.toFixed(0)}%` : '—'}
          </div>
          <div className="adm-kpi-sub">{wins.length} / {favClosed.length} closed</div>
        </div>
      </div>

      {/* Best / Worst summary cards */}
      <div className="dash-grid">
        <div className="dash-col">
          {/* Open positions */}
          <div className="dash-card">
            <div className="dash-card-header">
              <div>
                <div className="dash-card-title" style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <IconStar width={13} height={13} style={{ marginRight: 6, color: 'var(--gold)' }} />
                  Favorited Open Positions
                </div>
                <div className="dash-card-sub">{favOpen.length} holding{favOpen.length === 1 ? '' : 's'}</div>
              </div>
            </div>
            <div className="dash-table-wrap" style={{ marginTop: 12 }}>
              <table className="dash-table">
                <thead>
                  <tr>
                    <th className="dash-th" style={{ width: 32, padding: '10px 6px' }} aria-label="Favorite" />
                    <th className="dash-th">Symbol</th>
                    <th className="dash-th">
                      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                        Weight <InfoTooltip term="weight" />
                      </span>
                    </th>
                    <th className="dash-th">Entry</th>
                    <th className="dash-th">Price</th>
                    <th className="dash-th">
                      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                        P&amp;L <InfoTooltip term="unrealized-pnl" />
                      </span>
                    </th>
                    <th className="dash-th">Return</th>
                  </tr>
                </thead>
                <tbody>
                  {favOpen.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="dash-empty" style={{ padding: '20px 16px' }}>
                        No open positions favorited yet.
                      </td>
                    </tr>
                  ) : favOpen.map(p => (
                    <tr key={p.symbol} className="dash-tr">
                      <td className="dash-td" style={{ padding: '6px 4px', textAlign: 'center' }}>
                        <FavoriteToggle kind="position" id={p.symbol} />
                      </td>
                      <td className="dash-td">
                        <span className="dash-symbol">{p.symbol}</span>
                        {p.trading_id && casesIndex[p.trading_id]?.sector && (
                          <div style={{ fontSize: 10, color: 'var(--ink-dim)', marginTop: 2, letterSpacing: '0.04em' }}>
                            {casesIndex[p.trading_id].sector}
                          </div>
                        )}
                      </td>
                      <td className="dash-td">
                        <span style={{ fontSize: 12, color: 'var(--ink)' }}>
                          {p.pct_of_nav != null ? `${p.pct_of_nav.toFixed(1)}%` : '—'}
                        </span>
                      </td>
                      <td className="dash-td"><span className="dash-date">{fmtShortDate(p.entry_date)}</span></td>
                      <td className="dash-td">
                        {p.current_price != null ? fmtEUR(p.current_price, 2) : '—'}
                      </td>
                      <td className="dash-td">
                        {p.unrealized_pnl != null ? fmtEUR(p.unrealized_pnl, 0) : '—'}
                      </td>
                      <td className="dash-td">
                        <span className={`ret-badge ${(p.unrealized_pnl_pct ?? 0) >= 0 ? 'up' : 'dn'}`}>
                          {fmtPct(p.unrealized_pnl_pct ?? 0)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Closed trades */}
          <div className="dash-card">
            <div className="dash-card-header">
              <div>
                <div className="dash-card-title" style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <IconStar width={13} height={13} style={{ marginRight: 6, color: 'var(--gold)' }} />
                  Favorited Closed Trades
                </div>
                <div className="dash-card-sub">{favClosed.length} trade{favClosed.length === 1 ? '' : 's'}</div>
              </div>
            </div>
            <div className="dash-table-wrap" style={{ marginTop: 12 }}>
              <table className="dash-table">
                <thead>
                  <tr>
                    <th className="dash-th" style={{ width: 32, padding: '10px 6px' }} aria-label="Favorite" />
                    <th className="dash-th">Symbol</th>
                    <th className="dash-th">Entry</th>
                    <th className="dash-th">Exit</th>
                    <th className="dash-th">P&amp;L</th>
                    <th className="dash-th">
                      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                        Return <InfoTooltip term="realized-pnl" />
                      </span>
                    </th>
                    <th className="dash-th">
                      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                        Held <InfoTooltip term="holding-period" />
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {favClosed.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="dash-empty" style={{ padding: '20px 16px' }}>
                        No closed trades favorited yet.
                      </td>
                    </tr>
                  ) : favClosed.map((t, i) => {
                    const key = closedTradeKey(t.symbol, t.entry_date, t.exit_date)
                    const held = t.holding_period_days ?? daysHeld(t.entry_date, t.exit_date)
                    return (
                      <tr key={`${key}-${i}`} className="dash-tr">
                        <td className="dash-td" style={{ padding: '6px 4px', textAlign: 'center' }}>
                          <FavoriteToggle kind="closed" id={key} />
                        </td>
                        <td className="dash-td">
                          <span className="dash-symbol">{t.symbol}</span>
                        </td>
                        <td className="dash-td"><span className="dash-date">{fmtShortDate(t.entry_date)}</span></td>
                        <td className="dash-td"><span className="dash-date">{fmtShortDate(t.exit_date)}</span></td>
                        <td className="dash-td">{t.realized_pnl != null ? fmtEUR(t.realized_pnl, 0) : '—'}</td>
                        <td className="dash-td">
                          <span className={`ret-badge ${(t.realized_pnl_pct ?? 0) >= 0 ? 'up' : 'dn'}`}>
                            {fmtPct(t.realized_pnl_pct ?? 0)}
                          </span>
                        </td>
                        <td className="dash-td">
                          <span style={{ fontSize: 11, color: 'var(--ink-dim)' }}>
                            {held != null ? `${held}d` : '—'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column: aggregate stats */}
        <div className="dash-col">
          {/* Combined performance */}
          <div className="dash-card">
            <div className="dash-card-header">
              <div>
                <div className="dash-card-title">Combined Performance</div>
                <div className="dash-card-sub">Across all favorites</div>
              </div>
            </div>
            <div className="dash-stats-stack" style={{ marginTop: 12 }}>
              <div className="dash-stat-cell">
                <div className="dash-stat-label">
                  Total Realized <InfoTooltip term="realized-pnl" />
                </div>
                <div className={`dash-stat-val ${totalRealized >= 0 ? 'up' : 'dn'}`}>{fmtEUR(totalRealized, 0)}</div>
                <div className={`dash-stat-glow ${totalRealized >= 0 ? 'up' : 'dn'}`} />
              </div>
              <div className="dash-stat-cell">
                <div className="dash-stat-label">
                  Total Unrealized <InfoTooltip term="unrealized-pnl" />
                </div>
                <div className={`dash-stat-val ${totalUnrealized >= 0 ? 'up' : 'dn'}`}>{fmtEUR(totalUnrealized, 0)}</div>
                <div className={`dash-stat-glow ${totalUnrealized >= 0 ? 'up' : 'dn'}`} />
              </div>
              <div className="dash-stat-cell">
                <div className="dash-stat-label">
                  Win Rate <InfoTooltip term="win-rate" />
                </div>
                <div className={`dash-stat-val ${winRate >= 50 ? 'up' : 'dn'}`}>
                  {favClosed.length > 0 ? `${winRate.toFixed(0)}%` : '—'}
                </div>
                <div className={`dash-stat-glow ${winRate >= 50 ? 'up' : 'dn'}`} />
              </div>
              <div className="dash-stat-cell">
                <div className="dash-stat-label">
                  Avg Holding <InfoTooltip term="avg-holding" />
                </div>
                <div className="dash-stat-val flat">{favClosed.length > 0 ? `${avgHold}d` : '—'}</div>
                <div className="dash-stat-glow flat" />
              </div>
              <div className="dash-stat-cell full-width">
                <div className="dash-stat-label">Favorited NAV</div>
                <div className="dash-stat-val flat">{fmtEUR(totalOpenNav, 0)}</div>
                <div className="dash-stat-glow flat" />
              </div>
            </div>
          </div>

          {/* Best / worst from favorites */}
          <div className="dash-card">
            <div className="dash-card-header">
              <div>
                <div className="dash-card-title">Best &amp; Worst</div>
                <div className="dash-card-sub">Across your favorites only</div>
              </div>
            </div>
            <div className="dash-stats-stack" style={{ marginTop: 12 }}>
              <div className="dash-stat-cell">
                <div className="dash-stat-label">
                  Best Open <InfoTooltip term="unrealized-pnl" />
                </div>
                <div className="dash-stat-val up">
                  {bestOpen ? fmtPct(bestOpen.unrealized_pnl_pct ?? 0) : '—'}
                </div>
                {bestOpen && (
                  <div style={{ marginTop: 4, fontSize: 11, color: 'var(--ink-mute)', fontFamily: 'var(--serif)' }}>
                    {bestOpen.symbol}
                  </div>
                )}
                <div className="dash-stat-glow up" />
              </div>
              <div className="dash-stat-cell">
                <div className="dash-stat-label">
                  Worst Open <InfoTooltip term="unrealized-pnl" />
                </div>
                <div className="dash-stat-val dn">
                  {worstOpen ? fmtPct(worstOpen.unrealized_pnl_pct ?? 0) : '—'}
                </div>
                {worstOpen && (
                  <div style={{ marginTop: 4, fontSize: 11, color: 'var(--ink-mute)', fontFamily: 'var(--serif)' }}>
                    {worstOpen.symbol}
                  </div>
                )}
                <div className="dash-stat-glow dn" />
              </div>
              <div className="dash-stat-cell">
                <div className="dash-stat-label">
                  Best Closed <InfoTooltip term="best-trade" />
                </div>
                <div className="dash-stat-val up">
                  {bestClosed ? fmtPct(bestClosed.realized_pnl_pct ?? 0) : '—'}
                </div>
                {bestClosed && (
                  <div style={{ marginTop: 4, fontSize: 11, color: 'var(--ink-mute)', fontFamily: 'var(--serif)' }}>
                    {bestClosed.symbol}
                  </div>
                )}
                <div className="dash-stat-glow up" />
              </div>
              <div className="dash-stat-cell">
                <div className="dash-stat-label">
                  Worst Closed <InfoTooltip term="worst-trade" />
                </div>
                <div className="dash-stat-val dn">
                  {worstClosed ? fmtPct(worstClosed.realized_pnl_pct ?? 0) : '—'}
                </div>
                {worstClosed && (
                  <div style={{ marginTop: 4, fontSize: 11, color: 'var(--ink-mute)', fontFamily: 'var(--serif)' }}>
                    {worstClosed.symbol}
                  </div>
                )}
                <div className="dash-stat-glow dn" />
              </div>
              <div className="dash-stat-cell full-width">
                <div className="dash-stat-label">Total trades favorited</div>
                <div className="dash-stat-val flat">{fmtNum(favOpen.length + favClosed.length)}</div>
                <div className="dash-stat-sub">{favOpen.length} open · {favClosed.length} closed</div>
                <div className="dash-stat-glow flat" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
