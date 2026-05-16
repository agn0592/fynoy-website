'use client'

import Link from 'next/link'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

export interface CommandCenterProps {
  syncAgeHours: number | null
  todayStr: string

  totalNav: number
  totalUnrealizedPnl: number
  unrealizedPct: number
  realizedPnlYtd: number
  closedYtdCount: number
  winRate: number | null
  profitableTrades: number
  totalTrades: number
  openPositionsCount: number
  navDelta: number | null

  navHistory: { date: string; nav: number }[]
  sectorChartData: { name: string; value: number }[]

  activeCasesCount: number
  inactiveCasesCount: number
  avgScore: number | null
  topCases: { id: string; ticker: string | null; trading_id: string; total_score: number | null }[]

  sectorRisks: { sector: string; actual: number; target: number; diff: number }[]

  positionAlerts: { symbol: string; daysLeft: number; holdMonths: number }[]
  overweightSectors: { sector: string; actual: number; target: number; diff: number }[]
  underweightSectors: { sector: string; actual: number; target: number; diff: number }[]
  totalAlerts: number

  recentCases: {
    id: string
    ticker: string | null
    company_name: string
    sector: string | null
    status: string
    total_score: number | null
    date_of_case: string | null
  }[]
}

const SECTOR_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
  '#ef4444', '#06b6d4', '#f97316', '#ec4899',
]

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  }).format(n)
}

function fmtShort(s: string) {
  return new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

function NavTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(9,11,18,0.96)',
      border: '1px solid rgba(59,130,246,0.2)',
      borderRadius: '8px',
      padding: '10px 14px',
      fontSize: '12px',
    }}>
      <div style={{ color: '#6b7280', marginBottom: '4px' }}>{label}</div>
      <div style={{ color: '#3b82f6', fontWeight: 700 }}>{fmt(payload[0].value)}</div>
    </div>
  )
}

function SectorTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(9,11,18,0.96)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '8px',
      padding: '10px 14px',
      fontSize: '12px',
    }}>
      <div style={{ color: '#fff', fontWeight: 600 }}>{payload[0].name}</div>
      <div style={{ color: '#6b7280', marginTop: '2px' }}>{payload[0].value.toFixed(1)}%</div>
    </div>
  )
}

export default function CommandCenter(props: CommandCenterProps) {
  const {
    syncAgeHours, todayStr, totalNav, totalUnrealizedPnl, unrealizedPct,
    realizedPnlYtd, closedYtdCount, winRate, profitableTrades, totalTrades,
    openPositionsCount, navDelta, navHistory, sectorChartData,
    activeCasesCount, inactiveCasesCount, avgScore, topCases, sectorRisks,
    positionAlerts, overweightSectors, underweightSectors, totalAlerts, recentCases,
  } = props

  const staleSyncAlert = syncAgeHours !== null && syncAgeHours > 24

  const today = new Date(todayStr)
  const formattedDate = today.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const CARD = {
    background: 'rgba(15,19,32,0.8)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '14px',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  } as const

  return (
    <>
      <style>{`
        .adm-card {
          transition: border-color 0.22s ease, box-shadow 0.22s ease, transform 0.22s ease;
        }
        .adm-card:hover {
          border-color: rgba(59,130,246,0.22) !important;
          box-shadow: 0 0 0 1px rgba(59,130,246,0.06), 0 12px 40px rgba(0,0,0,0.55) !important;
          transform: translateY(-2px);
        }
        .adm-kpi:hover {
          border-color: rgba(255,255,255,0.12) !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(0,0,0,0.4) !important;
        }
        .adm-action {
          transition: transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease;
          cursor: pointer;
        }
        .adm-action:hover {
          transform: translateY(-2px) scale(1.02);
          filter: brightness(1.15);
          box-shadow: 0 6px 20px rgba(0,0,0,0.4);
        }
        .adm-row { transition: background 0.15s ease; }
        .adm-row:hover { background: rgba(255,255,255,0.02) !important; }
        .adm-case-link { transition: opacity 0.15s ease; }
        .adm-case-link:hover { opacity: 0.75; }
        @keyframes adm-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(245,158,11,0.45); }
          70%  { box-shadow: 0 0 0 8px rgba(245,158,11,0); }
          100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); }
        }
        @keyframes adm-fade {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes adm-glow-red {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.55; }
        }
        .adm-pulse  { animation: adm-pulse 2.2s infinite; }
        .adm-fade   { animation: adm-fade 0.45s cubic-bezier(0.16,1,0.3,1) both; }
        .adm-d1 { animation-delay: 0.05s; }
        .adm-d2 { animation-delay: 0.10s; }
        .adm-d3 { animation-delay: 0.15s; }
        .adm-d4 { animation-delay: 0.20s; }
        .adm-d5 { animation-delay: 0.25s; }
        .adm-d6 { animation-delay: 0.30s; }
        .adm-glow-red { animation: adm-glow-red 1.8s ease-in-out infinite; }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* ── Header ── */}
        <div className="adm-fade" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{
              fontSize: '26px', fontWeight: 800, letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, #fff 30%, #6b7280)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              marginBottom: '4px',
            }}>
              Command Center
            </div>
            <div style={{ color: '#374151', fontSize: '13px', letterSpacing: '0.01em' }}>
              {formattedDate}
            </div>
          </div>
          {syncAgeHours !== null && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '6px 14px',
              background: staleSyncAlert ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
              border: `1px solid ${staleSyncAlert ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`,
              borderRadius: '20px', fontSize: '12px', fontWeight: 500,
              color: staleSyncAlert ? '#ef4444' : '#10b981',
            }}>
              <span style={{
                width: '7px', height: '7px', borderRadius: '50%',
                background: staleSyncAlert ? '#ef4444' : '#10b981',
                display: 'inline-block',
                ...(staleSyncAlert ? {} : { boxShadow: '0 0 0 3px rgba(16,185,129,0.25)' }),
              }} />
              {staleSyncAlert ? `Stale — ${Math.round(syncAgeHours)}h ago` : `Live — ${Math.round(syncAgeHours)}h ago`}
            </div>
          )}
        </div>

        {/* ── Alert Banner ── */}
        {totalAlerts > 0 && (
          <div
            className="adm-fade adm-d1 adm-pulse"
            style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(239,68,68,0.05))',
              border: '1px solid rgba(245,158,11,0.3)',
              borderLeft: '3px solid #f59e0b',
              borderRadius: '12px',
              padding: '16px 20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <span style={{ fontSize: '16px' }}>⚠</span>
              <span style={{ color: '#f59e0b', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {totalAlerts} item{totalAlerts !== 1 ? 's' : ''} need attention
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {positionAlerts.map((a) => (
                <div key={a.symbol} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                  <span className={a.daysLeft < 0 ? 'adm-glow-red' : ''} style={{ color: a.daysLeft < 0 ? '#ef4444' : '#f59e0b', fontFamily: 'monospace', fontWeight: 700, minWidth: '64px' }}>
                    {a.symbol}
                  </span>
                  <span style={{ color: '#9ca3af' }}>
                    {a.daysLeft < 0
                      ? `Past target exit by ${Math.abs(a.daysLeft)} days`
                      : `${a.daysLeft} day${a.daysLeft !== 1 ? 's' : ''} until target exit`}
                  </span>
                </div>
              ))}
              {overweightSectors.map((s) => (
                <div key={`ow-${s.sector}`} style={{ fontSize: '13px', color: '#9ca3af' }}>
                  <span style={{ color: '#ef4444', fontWeight: 600 }}>↑ {s.sector}</span>
                  {' '}overweight {s.diff.toFixed(1)}% &nbsp;<span style={{ color: '#4b5563' }}>(actual {s.actual.toFixed(1)}% · target {s.target}%)</span>
                </div>
              ))}
              {underweightSectors.map((s) => (
                <div key={`uw-${s.sector}`} style={{ fontSize: '13px', color: '#9ca3af' }}>
                  <span style={{ color: '#3b82f6', fontWeight: 600 }}>↓ {s.sector}</span>
                  {' '}underweight {Math.abs(s.diff).toFixed(1)}% &nbsp;<span style={{ color: '#4b5563' }}>(actual {s.actual.toFixed(1)}% · target {s.target}%)</span>
                </div>
              ))}
              {staleSyncAlert && (
                <div style={{ fontSize: '13px', color: '#9ca3af' }}>
                  <span style={{ color: '#ef4444', fontWeight: 600 }}>⚡ Sync</span> — position data is {Math.round(syncAgeHours!)} hours old
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Quick Actions ── */}
        <div className="adm-fade adm-d2" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {(
            [
              { href: '/admin/cases/new',     label: '+ New Case',          color: '#3b82f6', glow: 'rgba(59,130,246,0.35)' },
              { href: '/admin/rebalancing',   label: 'Rebalancing',         color: '#f59e0b', glow: 'rgba(245,158,11,0.35)' },
              { href: '/admin/ai-commentary', label: 'Generate Commentary', color: '#ec4899', glow: 'rgba(236,72,153,0.35)' },
              { href: '/admin/timeline',      label: 'Timeline',            color: '#a78bfa', glow: 'rgba(167,139,250,0.35)' },
              { href: '/admin/research',      label: 'Research',            color: '#10b981', glow: 'rgba(16,185,129,0.35)' },
            ] as { href: string; label: string; color: string; glow: string }[]
          ).map((a) => (
            <Link key={a.href} href={a.href} className="adm-action" style={{
              color: a.color,
              background: `radial-gradient(ellipse at top, ${a.glow.replace('0.35', '0.12')}, transparent 70%), rgba(255,255,255,0.03)`,
              border: `1px solid ${a.color}35`,
              borderRadius: '10px',
              padding: '9px 18px',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}>
              {a.label}
            </Link>
          ))}
        </div>

        {/* ── KPI Strip ── */}
        <div className="adm-fade adm-d3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
          {(
            [
              {
                label: 'Total NAV', value: fmt(totalNav),
                sub: navDelta !== null ? `${navDelta > 0 ? '+' : ''}${navDelta.toFixed(2)}% vs prev` : '—',
                color: '#fff', accent: '#3b82f6',
              },
              {
                label: 'Unrealized P&L', value: fmt(totalUnrealizedPnl),
                sub: `${unrealizedPct.toFixed(2)}% of NAV`,
                color: totalUnrealizedPnl >= 0 ? '#10b981' : '#ef4444',
                accent: totalUnrealizedPnl >= 0 ? '#10b981' : '#ef4444',
              },
              {
                label: 'Realized YTD', value: fmt(realizedPnlYtd),
                sub: `${closedYtdCount} trade${closedYtdCount !== 1 ? 's' : ''} closed`,
                color: realizedPnlYtd >= 0 ? '#10b981' : '#ef4444',
                accent: realizedPnlYtd >= 0 ? '#10b981' : '#ef4444',
              },
              {
                label: 'Win Rate', value: winRate !== null ? `${winRate.toFixed(0)}%` : '—',
                sub: `${profitableTrades} / ${totalTrades} trades`,
                color: winRate === null ? '#6b7280' : winRate >= 50 ? '#10b981' : '#ef4444',
                accent: winRate === null ? '#374151' : winRate >= 50 ? '#10b981' : '#ef4444',
              },
              {
                label: 'Open Positions', value: String(openPositionsCount),
                sub: `${activeCasesCount} active case${activeCasesCount !== 1 ? 's' : ''}`,
                color: '#fff', accent: '#8b5cf6',
              },
            ] as { label: string; value: string; sub: string; color: string; accent: string }[]
          ).map((kpi) => (
            <div key={kpi.label} className="adm-kpi" style={{
              ...CARD,
              padding: '18px 20px',
              borderTop: `2px solid ${kpi.accent}`,
              position: 'relative',
              overflow: 'hidden',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '60px',
                background: `radial-gradient(ellipse at top, ${kpi.accent}12, transparent)`,
                pointerEvents: 'none',
              }} />
              <div style={{ color: '#4b5563', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                {kpi.label}
              </div>
              <div style={{ color: kpi.color, fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>
                {kpi.value}
              </div>
              <div style={{ color: '#374151', fontSize: '11px', marginTop: '5px' }}>{kpi.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Charts Row: NAV Trend + Sector Donut ── */}
        <div className="adm-fade adm-d4" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px' }}>

          {/* NAV Trend */}
          <div className="adm-card" style={{ ...CARD, padding: '22px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <div style={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>NAV Performance</div>
                <div style={{ color: '#374151', fontSize: '12px', marginTop: '2px' }}>Portfolio value over time</div>
              </div>
              <div style={{ color: '#3b82f6', fontSize: '13px', fontWeight: 700 }}>{fmt(totalNav)}</div>
            </div>
            {navHistory.length > 1 ? (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={navHistory} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="navGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tickFormatter={fmtShort}
                    tick={{ fill: '#374151', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip content={<NavTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="nav"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#navGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151', fontSize: '13px' }}>
                Not enough snapshot data yet
              </div>
            )}
          </div>

          {/* Sector Allocation Donut */}
          <div className="adm-card" style={{ ...CARD, padding: '22px 24px' }}>
            <div style={{ color: '#fff', fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>Sector Allocation</div>
            <div style={{ color: '#374151', fontSize: '12px', marginBottom: '16px' }}>Current portfolio mix</div>
            {sectorChartData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={sectorChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={2}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={800}
                    >
                      {sectorChartData.map((_, i) => (
                        <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<SectorTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '4px' }}>
                  {sectorChartData.slice(0, 4).map((s, i) => (
                    <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: SECTOR_COLORS[i % SECTOR_COLORS.length], flexShrink: 0 }} />
                      <div style={{ color: '#6b7280', fontSize: '11px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                      <div style={{ color: '#9ca3af', fontSize: '11px', fontWeight: 600 }}>{s.value.toFixed(1)}%</div>
                    </div>
                  ))}
                  {sectorChartData.length > 4 && (
                    <div style={{ color: '#374151', fontSize: '11px', marginTop: '2px' }}>+{sectorChartData.length - 4} more sectors</div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151', fontSize: '13px' }}>
                No positions yet
              </div>
            )}
          </div>
        </div>

        {/* ── Case Pipeline + Sector Risk ── */}
        <div className="adm-fade adm-d5" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

          {/* Case Pipeline */}
          <div className="adm-card" style={{ ...CARD, padding: '22px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <div style={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>Case Pipeline</div>
                <div style={{ color: '#374151', fontSize: '12px', marginTop: '2px' }}>Active investment thesis</div>
              </div>
              <Link href="/admin/cases" style={{ color: '#3b82f6', fontSize: '12px', textDecoration: 'none', fontWeight: 500 }}>View all →</Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '20px' }}>
              {[
                { label: 'Active',     value: activeCasesCount,   color: '#10b981', bg: 'rgba(16,185,129,0.08)'  },
                { label: 'Not Active', value: inactiveCasesCount, color: '#374151', bg: 'rgba(255,255,255,0.03)' },
                { label: 'Avg Score',  value: avgScore !== null ? `${avgScore.toFixed(1)}/48` : '—', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
              ].map((s) => (
                <div key={s.label} style={{
                  background: s.bg,
                  border: '1px solid rgba(255,255,255,0.04)',
                  borderRadius: '8px',
                  padding: '12px',
                  textAlign: 'center',
                }}>
                  <div style={{ color: s.color, fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em' }}>{s.value}</div>
                  <div style={{ color: '#374151', fontSize: '11px', marginTop: '3px' }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
              {topCases.length === 0 ? (
                <div style={{ color: '#374151', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No active cases</div>
              ) : (
                topCases.map((c) => {
                  const pct = ((c.total_score ?? 0) / 48) * 100
                  const barColor = pct >= 73 ? '#10b981' : pct >= 52 ? '#f59e0b' : '#ef4444'
                  return (
                    <Link key={c.id} href={`/admin/cases/${c.id}`} className="adm-case-link" style={{ textDecoration: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          color: '#d1d5db', fontSize: '12px', fontWeight: 700,
                          fontFamily: 'monospace', width: '52px', flexShrink: 0,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {c.ticker ?? c.trading_id}
                        </div>
                        <div style={{ flex: 1, height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${pct}%`, height: '100%',
                            background: `linear-gradient(90deg, ${barColor}aa, ${barColor})`,
                            borderRadius: '3px',
                            transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
                          }} />
                        </div>
                        <div style={{ color: barColor, fontSize: '12px', fontWeight: 700, width: '40px', textAlign: 'right', flexShrink: 0 }}>
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
          <div className="adm-card" style={{ ...CARD, padding: '22px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <div style={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>Sector Risk</div>
                <div style={{ color: '#374151', fontSize: '12px', marginTop: '2px' }}>Actual vs target weight</div>
              </div>
              <Link href="/admin/rebalancing" style={{ color: '#3b82f6', fontSize: '12px', textDecoration: 'none', fontWeight: 500 }}>Rebalance →</Link>
            </div>

            {sectorRisks.length === 0 ? (
              <div style={{ color: '#374151', fontSize: '13px', textAlign: 'center', padding: '40px 0' }}>No positions or targets set</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {sectorRisks.slice(0, 7).map((s) => {
                  const isOver  = s.diff > 5
                  const isUnder = s.diff < -5
                  const barColor = isOver ? '#ef4444' : isUnder ? '#3b82f6' : '#10b981'
                  const badge = isOver ? `+${s.diff.toFixed(1)}%` : isUnder ? `${s.diff.toFixed(1)}%` : 'OK'
                  return (
                    <div key={s.sector}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ color: '#9ca3af', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>
                          {s.sector}
                        </span>
                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                          <span style={{ color: '#4b5563', fontSize: '11px' }}>{s.actual.toFixed(1)}%</span>
                          <span style={{
                            color: barColor, fontSize: '11px', fontWeight: 700,
                            background: `${barColor}15`, borderRadius: '4px',
                            padding: '0px 6px',
                          }}>{badge}</span>
                        </div>
                      </div>
                      <div style={{ height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{
                          position: 'absolute', left: 0, top: 0, bottom: 0,
                          width: `${Math.min(s.actual, 100)}%`,
                          background: `linear-gradient(90deg, ${barColor}88, ${barColor})`,
                          borderRadius: '3px',
                          transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
                        }} />
                        {s.target > 0 && (
                          <div style={{
                            position: 'absolute', left: `${Math.min(s.target, 100)}%`,
                            top: '-1px', bottom: '-1px', width: '2px',
                            background: 'rgba(255,255,255,0.3)',
                          }} />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Position Alerts ── */}
        {positionAlerts.length > 0 && (
          <div className="adm-card adm-fade adm-d6" style={{ ...CARD, padding: '22px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <div style={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>Positions Needing Attention</div>
                <div style={{ color: '#374151', fontSize: '12px', marginTop: '2px' }}>Approaching or past target exit</div>
              </div>
              <Link href="/admin/timeline" style={{ color: '#3b82f6', fontSize: '12px', textDecoration: 'none', fontWeight: 500 }}>Full timeline →</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {positionAlerts.map((a) => {
                const isPast = a.daysLeft < 0
                const barColor = isPast ? '#ef4444' : a.daysLeft <= 7 ? '#f97316' : '#f59e0b'
                const totalDays = a.holdMonths * 30
                const elapsed = isPast ? totalDays + Math.abs(a.daysLeft) : totalDays - a.daysLeft
                const pct = Math.min((elapsed / totalDays) * 100, 100)
                return (
                  <div key={a.symbol}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: '#fff', fontSize: '13px', fontWeight: 700, fontFamily: 'monospace' }}>{a.symbol}</span>
                      <span style={{ color: barColor, fontSize: '12px', fontWeight: 600 }}>
                        {isPast ? `${Math.abs(a.daysLeft)}d past exit` : `${a.daysLeft}d remaining`}
                      </span>
                    </div>
                    <div style={{ height: '7px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${pct}%`, height: '100%',
                        background: `linear-gradient(90deg, ${barColor}88, ${barColor})`,
                        borderRadius: '4px',
                        transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Recent Research ── */}
        <div className="adm-card" style={{ ...CARD, padding: '22px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <div style={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>Recent Research</div>
              <div style={{ color: '#374151', fontSize: '12px', marginTop: '2px' }}>Latest investment cases</div>
            </div>
            <Link href="/admin/research" style={{ color: '#3b82f6', fontSize: '12px', textDecoration: 'none', fontWeight: 500 }}>All research →</Link>
          </div>

          {recentCases.length === 0 ? (
            <div style={{ color: '#374151', fontSize: '13px', textAlign: 'center', padding: '32px 0' }}>
              No cases yet.{' '}
              <Link href="/admin/cases/new" style={{ color: '#3b82f6', textDecoration: 'none' }}>Create the first one →</Link>
            </div>
          ) : (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '64px 1fr 100px 76px 60px 68px',
                gap: '12px',
                padding: '0 12px 10px',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                marginBottom: '4px',
              }}>
                {['Ticker', 'Company', 'Sector', 'Status', 'Score', 'Date'].map((h) => (
                  <div key={h} style={{ color: '#374151', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</div>
                ))}
              </div>
              {recentCases.map((c, i) => {
                const pct = ((c.total_score ?? 0) / 48) * 100
                const scoreColor = pct >= 73 ? '#10b981' : pct >= 52 ? '#f59e0b' : '#ef4444'
                return (
                  <Link key={c.id} href={`/admin/cases/${c.id}`} style={{ textDecoration: 'none' }}>
                    <div
                      className="adm-row"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '64px 1fr 100px 76px 60px 68px',
                        gap: '12px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        alignItems: 'center',
                        borderBottom: i < recentCases.length - 1 ? '1px solid rgba(255,255,255,0.02)' : 'none',
                      }}
                    >
                      <div style={{ color: '#6b7280', fontSize: '12px', fontFamily: 'monospace', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.ticker ?? '—'}
                      </div>
                      <div style={{ color: '#e5e7eb', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.company_name}
                      </div>
                      <div style={{ color: '#4b5563', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.sector ?? '—'}
                      </div>
                      <div>
                        <span style={{
                          padding: '3px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: 600,
                          background: c.status === 'Active' ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)',
                          color: c.status === 'Active' ? '#10b981' : '#4b5563',
                          border: `1px solid ${c.status === 'Active' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)'}`,
                        }}>
                          {c.status ?? '—'}
                        </span>
                      </div>
                      <div style={{ color: scoreColor, fontSize: '13px', fontWeight: 700 }}>
                        {c.total_score !== null ? `${c.total_score}/48` : '—'}
                      </div>
                      <div style={{ color: '#374151', fontSize: '12px' }}>
                        {c.date_of_case ? fmtShort(c.date_of_case) : '—'}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </>
          )}
        </div>

      </div>
    </>
  )
}
