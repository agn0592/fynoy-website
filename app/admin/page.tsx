import Link from 'next/link'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface OpenPosition {
  trading_id: string | null
  symbol: string
  entry_date_actual: string | null
  current_price: number
  position_size_actual: number
  unrealized_pnl: number
  last_synced_at: string | null
}

interface ClosedTrade {
  exit_date: string
  realized_pnl: number
}

interface Case {
  id: string
  trading_id: string
  company_name: string
  ticker: string | null
  status: string
  sector: string | null
  date_of_case: string | null
  total_score: number | null
  expected_holding_period_months: number | null
}

interface PortfolioSnapshot {
  total_nav: number
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n)
}

function fmtShortDate(s: string) {
  return new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

export default async function AdminPage() {
  const supabase = getServiceClient()

  const [
    { data: openPositionsRaw },
    { data: closedTradesRaw },
    { data: casesRaw },
    { data: snapshotsRaw },
    { data: settingsRaw },
  ] = await Promise.all([
    supabase
      .from('open_positions')
      .select('trading_id, symbol, entry_date_actual, current_price, position_size_actual, unrealized_pnl, last_synced_at'),
    supabase
      .from('closed_trades')
      .select('exit_date, realized_pnl')
      .order('exit_date', { ascending: false }),
    supabase
      .from('cases')
      .select('id, trading_id, company_name, ticker, status, sector, date_of_case, total_score, expected_holding_period_months')
      .order('date_of_case', { ascending: false }),
    supabase
      .from('portfolio_snapshots')
      .select('total_nav')
      .order('snapshot_date', { ascending: false })
      .limit(2),
    supabase
      .from('settings')
      .select('value')
      .eq('key', 'target_allocation')
      .maybeSingle(),
  ])

  const openPositions: OpenPosition[] = openPositionsRaw ?? []
  const closedTrades: ClosedTrade[] = closedTradesRaw ?? []
  const cases: Case[] = casesRaw ?? []
  const snapshots: PortfolioSnapshot[] = snapshotsRaw ?? []
  const targetAllocation: Record<string, number> =
    (settingsRaw?.value as Record<string, number>) ?? {}

  // --- KPIs ---
  const totalNav = openPositions.reduce(
    (sum, p) => sum + p.current_price * p.position_size_actual,
    0
  )
  const totalUnrealizedPnl = openPositions.reduce((sum, p) => sum + (p.unrealized_pnl ?? 0), 0)

  const ytdStart = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10)
  const closedYtd = closedTrades.filter((t) => t.exit_date >= ytdStart)
  const realizedPnlYtd = closedYtd.reduce((sum, t) => sum + (t.realized_pnl ?? 0), 0)

  const profitableTrades = closedTrades.filter((t) => (t.realized_pnl ?? 0) > 0).length
  const winRate = closedTrades.length > 0 ? (profitableTrades / closedTrades.length) * 100 : null

  const latestNav = snapshots[0]?.total_nav ?? 0
  const prevNav = snapshots[1]?.total_nav ?? 0
  const navDelta = prevNav > 0 ? ((latestNav - prevNav) / prevNav) * 100 : null

  // --- Sync freshness ---
  const lastSyncedAt = openPositions.reduce<string | null>(
    (latest, p) =>
      p.last_synced_at && (latest === null || p.last_synced_at > latest)
        ? p.last_synced_at
        : latest,
    null
  )
  const syncAgeHours =
    lastSyncedAt ? (Date.now() - new Date(lastSyncedAt).getTime()) / 3_600_000 : null
  const staleSyncAlert = syncAgeHours !== null && syncAgeHours > 24

  // --- Case pipeline ---
  const activeCases = cases.filter((c) => c.status === 'Active')
  const inactiveCases = cases.filter((c) => c.status !== 'Active')
  const scoredActive = activeCases.filter((c) => c.total_score !== null)
  const avgScore =
    scoredActive.length > 0
      ? scoredActive.reduce((sum, c) => sum + (c.total_score ?? 0), 0) / scoredActive.length
      : null
  const topCasesByScore = [...activeCases]
    .sort((a, b) => (b.total_score ?? 0) - (a.total_score ?? 0))
    .slice(0, 5)

  // --- Sector risk ---
  const caseMap = new Map<string, string>(
    cases.map((c) => [c.trading_id, c.sector ?? 'Unknown'])
  )
  const sectorValues = new Map<string, number>()
  for (const pos of openPositions) {
    const sector = pos.trading_id ? (caseMap.get(pos.trading_id) ?? 'Unknown') : 'Unknown'
    const val = pos.current_price * pos.position_size_actual
    sectorValues.set(sector, (sectorValues.get(sector) ?? 0) + val)
  }
  const allSectors = Array.from(
    new Set([...sectorValues.keys(), ...Object.keys(targetAllocation)])
  ).sort()
  const sectorRisks = allSectors
    .map((sector) => {
      const val = sectorValues.get(sector) ?? 0
      const actual = totalNav > 0 ? (val / totalNav) * 100 : 0
      const target = targetAllocation[sector] ?? 0
      const diff = actual - target
      return { sector, actual, target, diff }
    })
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))

  // --- Position timeline alerts (≤ 30 days remaining or past) ---
  const today = new Date()
  const caseHoldingMap = new Map<string, number>(
    cases.map((c) => [c.trading_id, c.expected_holding_period_months ?? 12])
  )
  const positionAlerts = openPositions
    .filter((p) => p.entry_date_actual && p.trading_id)
    .map((p) => {
      const holdMonths = caseHoldingMap.get(p.trading_id!) ?? 12
      const start = new Date(p.entry_date_actual!)
      const end = new Date(start)
      end.setMonth(end.getMonth() + holdMonths)
      const daysLeft = Math.round((end.getTime() - today.getTime()) / 86_400_000)
      return { symbol: p.symbol, end, daysLeft, holdMonths }
    })
    .filter((p) => p.daysLeft <= 30)
    .sort((a, b) => a.daysLeft - b.daysLeft)

  // --- Alert totals ---
  const overweightSectors = sectorRisks.filter((s) => s.diff > 5)
  const underweightSectors = sectorRisks.filter((s) => s.diff < -5)
  const totalAlerts =
    positionAlerts.length +
    overweightSectors.length +
    underweightSectors.length +
    (staleSyncAlert ? 1 : 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, margin: '0 0 2px', letterSpacing: '-0.01em' }}>
            Command Center
          </h1>
          <p style={{ color: '#4b5563', fontSize: '13px', margin: 0 }}>
            {today.toLocaleDateString('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        {syncAgeHours !== null && (
          <span
            style={{
              fontSize: '12px',
              color: staleSyncAlert ? '#ef4444' : '#22c55e',
              background: staleSyncAlert ? '#ef444415' : '#22c55e15',
              border: `1px solid ${staleSyncAlert ? '#ef444435' : '#22c55e35'}`,
              borderRadius: '6px',
              padding: '5px 12px',
              alignSelf: 'flex-start',
            }}
          >
            {staleSyncAlert ? '⚠ ' : ''}Synced {Math.round(syncAgeHours)}h ago
          </span>
        )}
      </div>

      {/* ── Alert Banner ── */}
      {totalAlerts > 0 && (
        <div
          style={{
            background: '#17120a',
            border: '1px solid #f59e0b40',
            borderLeft: '3px solid #f59e0b',
            borderRadius: '8px',
            padding: '14px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
          }}
        >
          <div
            style={{
              color: '#f59e0b',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              marginBottom: '6px',
            }}
          >
            {totalAlerts} item{totalAlerts !== 1 ? 's' : ''} need attention
          </div>
          {positionAlerts.map((a) => (
            <div key={a.symbol} style={{ color: '#d1d5db', fontSize: '13px' }}>
              {a.daysLeft < 0
                ? `❌  ${a.symbol} — past target exit date by ${Math.abs(a.daysLeft)} days`
                : `⚠  ${a.symbol} — ${a.daysLeft} day${a.daysLeft !== 1 ? 's' : ''} until target exit`}
            </div>
          ))}
          {overweightSectors.map((s) => (
            <div key={`ow-${s.sector}`} style={{ color: '#d1d5db', fontSize: '13px' }}>
              ↑  {s.sector} overweight {s.diff.toFixed(1)}% &nbsp;(actual {s.actual.toFixed(1)}% vs target {s.target}%)
            </div>
          ))}
          {underweightSectors.map((s) => (
            <div key={`uw-${s.sector}`} style={{ color: '#d1d5db', fontSize: '13px' }}>
              ↓  {s.sector} underweight {Math.abs(s.diff).toFixed(1)}% &nbsp;(actual {s.actual.toFixed(1)}% vs target {s.target}%)
            </div>
          ))}
          {staleSyncAlert && (
            <div style={{ color: '#d1d5db', fontSize: '13px' }}>
              ⚠  Position data stale — last synced {Math.round(syncAgeHours!)} hours ago
            </div>
          )}
        </div>
      )}

      {/* ── Quick Actions ── */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {(
          [
            { href: '/admin/cases/new',     label: '+ New Case',          color: '#3b82f6' },
            { href: '/admin/rebalancing',   label: 'Rebalancing',         color: '#f59e0b' },
            { href: '/admin/ai-commentary', label: 'Generate Commentary', color: '#ec4899' },
            { href: '/admin/timeline',      label: 'Timeline',            color: '#a78bfa' },
            { href: '/admin/research',      label: 'Research',            color: '#22c55e' },
          ] as { href: string; label: string; color: string }[]
        ).map((action) => (
          <Link
            key={action.href}
            href={action.href}
            style={{
              color: action.color,
              background: `${action.color}18`,
              border: `1px solid ${action.color}40`,
              borderRadius: '7px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {action.label}
          </Link>
        ))}
      </div>

      {/* ── KPI Strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: '12px' }}>
        {(
          [
            {
              label: 'Total NAV',
              value: fmt(totalNav),
              sub: navDelta !== null
                ? `${navDelta > 0 ? '+' : ''}${navDelta.toFixed(2)}% vs prev`
                : 'no prior snapshot',
              color: '#fff',
            },
            {
              label: 'Unrealized P&L',
              value: fmt(totalUnrealizedPnl),
              sub: totalNav > 0
                ? `${((totalUnrealizedPnl / totalNav) * 100).toFixed(2)}% of NAV`
                : '—',
              color: totalUnrealizedPnl >= 0 ? '#22c55e' : '#ef4444',
            },
            {
              label: 'Realized YTD',
              value: fmt(realizedPnlYtd),
              sub: `${closedYtd.length} trade${closedYtd.length !== 1 ? 's' : ''} closed`,
              color: realizedPnlYtd >= 0 ? '#22c55e' : '#ef4444',
            },
            {
              label: 'Win Rate',
              value: winRate !== null ? `${winRate.toFixed(0)}%` : '—',
              sub: `${profitableTrades} / ${closedTrades.length} trades`,
              color: winRate === null ? '#6b7280' : winRate >= 50 ? '#22c55e' : '#ef4444',
            },
            {
              label: 'Open Positions',
              value: String(openPositions.length),
              sub: `${activeCases.length} active case${activeCases.length !== 1 ? 's' : ''}`,
              color: '#fff',
            },
          ] as { label: string; value: string; sub: string; color: string }[]
        ).map((kpi) => (
          <div
            key={kpi.label}
            style={{
              background: '#1a1d27',
              border: '1px solid #2a2d3e',
              borderRadius: '8px',
              padding: '16px 18px',
            }}
          >
            <div
              style={{
                color: '#6b7280',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '6px',
              }}
            >
              {kpi.label}
            </div>
            <div style={{ color: kpi.color, fontSize: '21px', fontWeight: 700, letterSpacing: '-0.01em' }}>
              {kpi.value}
            </div>
            <div style={{ color: '#4b5563', fontSize: '11px', marginTop: '3px' }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Case Pipeline + Sector Risk ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        {/* Case Pipeline */}
        <div
          style={{
            background: '#1a1d27',
            border: '1px solid #2a2d3e',
            borderRadius: '10px',
            padding: '20px 24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ color: '#fff', fontSize: '14px', fontWeight: 600, margin: 0 }}>Case Pipeline</h2>
            <Link href="/admin/cases" style={{ color: '#3b82f6', fontSize: '12px', textDecoration: 'none' }}>
              View all →
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '20px' }}>
            {[
              { label: 'Active',     value: String(activeCases.length),   color: '#22c55e' },
              { label: 'Not Active', value: String(inactiveCases.length), color: '#6b7280' },
              { label: 'Avg Score',  value: avgScore !== null ? `${avgScore.toFixed(1)}/48` : '—', color: '#3b82f6' },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  background: '#0f1117',
                  borderRadius: '6px',
                  padding: '10px 8px',
                  textAlign: 'center',
                }}
              >
                <div style={{ color: stat.color, fontSize: '18px', fontWeight: 700 }}>{stat.value}</div>
                <div style={{ color: '#6b7280', fontSize: '11px', marginTop: '2px' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {topCasesByScore.length === 0 ? (
              <div style={{ color: '#4b5563', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>
                No active cases
              </div>
            ) : (
              topCasesByScore.map((c) => {
                const pct = ((c.total_score ?? 0) / 48) * 100
                const barColor = pct >= 73 ? '#22c55e' : pct >= 52 ? '#f59e0b' : '#ef4444'
                return (
                  <Link key={c.id} href={`/admin/cases/${c.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          color: '#d1d5db',
                          fontSize: '12px',
                          fontWeight: 600,
                          fontFamily: 'monospace',
                          width: '56px',
                          flexShrink: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {c.ticker ?? c.trading_id}
                      </div>
                      <div
                        style={{
                          flex: 1,
                          height: '6px',
                          background: '#0f1117',
                          borderRadius: '3px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: '100%',
                            background: barColor,
                            borderRadius: '3px',
                          }}
                        />
                      </div>
                      <div
                        style={{
                          color: barColor,
                          fontSize: '12px',
                          fontWeight: 700,
                          width: '42px',
                          textAlign: 'right',
                          flexShrink: 0,
                        }}
                      >
                        {c.total_score ?? '—'}/48
                      </div>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>

        {/* Sector Risk */}
        <div
          style={{
            background: '#1a1d27',
            border: '1px solid #2a2d3e',
            borderRadius: '10px',
            padding: '20px 24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ color: '#fff', fontSize: '14px', fontWeight: 600, margin: 0 }}>Sector Risk</h2>
            <Link href="/admin/rebalancing" style={{ color: '#3b82f6', fontSize: '12px', textDecoration: 'none' }}>
              Rebalance →
            </Link>
          </div>

          {sectorRisks.length === 0 ? (
            <div style={{ color: '#4b5563', fontSize: '13px', textAlign: 'center', padding: '32px 0' }}>
              No positions or targets set
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sectorRisks.slice(0, 7).map((s) => {
                const isOver = s.diff > 5
                const isUnder = s.diff < -5
                const barColor = isOver ? '#ef4444' : isUnder ? '#3b82f6' : '#22c55e'
                const diffLabel = isOver
                  ? `+${s.diff.toFixed(1)}%`
                  : isUnder
                  ? `${s.diff.toFixed(1)}%`
                  : 'OK'
                return (
                  <div key={s.sector} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        color: '#9ca3af',
                        fontSize: '12px',
                        width: '88px',
                        flexShrink: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {s.sector}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        position: 'relative',
                        height: '6px',
                        background: '#0f1117',
                        borderRadius: '3px',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: `${Math.min(s.actual, 100)}%`,
                          background: barColor,
                          borderRadius: '3px',
                          opacity: 0.8,
                        }}
                      />
                      {s.target > 0 && (
                        <div
                          style={{
                            position: 'absolute',
                            left: `${Math.min(s.target, 100)}%`,
                            top: '-3px',
                            bottom: '-3px',
                            width: '2px',
                            background: '#fff',
                            opacity: 0.35,
                          }}
                        />
                      )}
                    </div>
                    <div
                      style={{
                        color: '#6b7280',
                        fontSize: '11px',
                        width: '30px',
                        textAlign: 'right',
                        flexShrink: 0,
                      }}
                    >
                      {s.actual.toFixed(0)}%
                    </div>
                    <div
                      style={{
                        color: barColor,
                        fontSize: '11px',
                        fontWeight: 700,
                        width: '38px',
                        textAlign: 'right',
                        flexShrink: 0,
                      }}
                    >
                      {diffLabel}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Position Timeline Alerts ── */}
      {positionAlerts.length > 0 && (
        <div
          style={{
            background: '#1a1d27',
            border: '1px solid #2a2d3e',
            borderRadius: '10px',
            padding: '20px 24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ color: '#fff', fontSize: '14px', fontWeight: 600, margin: 0 }}>
              Positions Needing Attention
            </h2>
            <Link href="/admin/timeline" style={{ color: '#3b82f6', fontSize: '12px', textDecoration: 'none' }}>
              Full timeline →
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {positionAlerts.map((a) => {
              const isPast = a.daysLeft < 0
              const barColor = isPast ? '#ef4444' : '#f59e0b'
              const totalDays = a.holdMonths * 30
              const elapsed = isPast ? totalDays + Math.abs(a.daysLeft) : totalDays - a.daysLeft
              const progressPct = Math.min((elapsed / totalDays) * 100, 100)
              return (
                <div key={a.symbol} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      width: '70px',
                      flexShrink: 0,
                    }}
                  >
                    {a.symbol}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      height: '8px',
                      background: '#0f1117',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${progressPct}%`,
                        height: '100%',
                        background: barColor,
                        borderRadius: '4px',
                      }}
                    />
                  </div>
                  <div
                    style={{
                      color: barColor,
                      fontSize: '12px',
                      fontWeight: 600,
                      width: '148px',
                      textAlign: 'right',
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {isPast
                      ? `${Math.abs(a.daysLeft)}d past exit`
                      : `${a.daysLeft}d remaining`}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Recent Research ── */}
      <div
        style={{
          background: '#1a1d27',
          border: '1px solid #2a2d3e',
          borderRadius: '10px',
          padding: '20px 24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ color: '#fff', fontSize: '14px', fontWeight: 600, margin: 0 }}>Recent Research</h2>
          <Link href="/admin/research" style={{ color: '#3b82f6', fontSize: '12px', textDecoration: 'none' }}>
            All research →
          </Link>
        </div>

        {cases.length === 0 ? (
          <div style={{ color: '#4b5563', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>
            No cases yet.{' '}
            <Link href="/admin/cases/new" style={{ color: '#3b82f6', textDecoration: 'none' }}>
              Create the first one →
            </Link>
          </div>
        ) : (
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '72px 1fr 100px 80px 56px 72px',
                gap: '8px',
                padding: '0 0 8px',
                borderBottom: '1px solid #2a2d3e',
                marginBottom: '4px',
              }}
            >
              {['Ticker', 'Company', 'Sector', 'Status', 'Score', 'Date'].map((h) => (
                <div
                  key={h}
                  style={{
                    color: '#4b5563',
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {h}
                </div>
              ))}
            </div>
            {cases.slice(0, 7).map((c, i) => {
              const pct = ((c.total_score ?? 0) / 48) * 100
              const scoreColor = pct >= 73 ? '#22c55e' : pct >= 52 ? '#f59e0b' : '#ef4444'
              return (
                <Link key={c.id} href={`/admin/cases/${c.id}`} style={{ textDecoration: 'none' }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '72px 1fr 100px 80px 56px 72px',
                      gap: '8px',
                      padding: '9px 0',
                      borderBottom: i < 6 ? '1px solid #1f2233' : 'none',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        color: '#9ca3af',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {c.ticker ?? '—'}
                    </div>
                    <div
                      style={{
                        color: '#fff',
                        fontSize: '13px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {c.company_name}
                    </div>
                    <div
                      style={{
                        color: '#6b7280',
                        fontSize: '12px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {c.sector ?? '—'}
                    </div>
                    <div>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: c.status === 'Active' ? '#22c55e20' : '#6b728020',
                          color: c.status === 'Active' ? '#22c55e' : '#6b7280',
                        }}
                      >
                        {c.status ?? '—'}
                      </span>
                    </div>
                    <div style={{ color: scoreColor, fontSize: '13px', fontWeight: 700 }}>
                      {c.total_score !== null ? `${c.total_score}/48` : '—'}
                    </div>
                    <div style={{ color: '#4b5563', fontSize: '12px' }}>
                      {c.date_of_case ? fmtShortDate(c.date_of_case) : '—'}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
