import Link from 'next/link'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import PortfolioSummary from '@/app/dashboard/components/PortfolioSummary'
import PerformanceChart from '@/app/dashboard/components/PerformanceChart'

function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface OpenPosition {
  trading_id: string | null
  symbol: string
  current_price: number
  position_size_actual: number
  unrealized_pnl: number
}

interface ClosedTrade {
  exit_date: string
  realized_pnl: number
}

interface PortfolioSnapshot {
  snapshot_date: string
  total_nav: number
  benchmark_value: number
}

interface Case {
  id: string
  company_name: string
  ticker: string
  status: string
  total_score: number | null
}

const ADMIN_SECTIONS = [
  { href: '/admin/cases', label: 'Cases', description: 'Manage all investment cases', color: '#3b82f6' },
  { href: '/admin/research', label: 'Research', description: 'Ranked case research overview', color: '#22c55e' },
  { href: '/admin/rebalancing', label: 'Rebalancing', description: 'Target vs actual sector allocation', color: '#f59e0b' },
  { href: '/admin/timeline', label: 'Timeline', description: 'Position holding period view', color: '#a78bfa' },
  { href: '/admin/ai-commentary', label: 'AI Commentary', description: 'Generate & view portfolio commentary', color: '#ec4899' },
]

export default async function AdminPage() {
  const supabase = getServiceClient()

  const [
    { data: openPositionsRaw },
    { data: closedTradesRaw },
    { data: snapshotsRaw },
    { data: casesRaw },
  ] = await Promise.all([
    supabase.from('open_positions').select('trading_id, symbol, current_price, position_size_actual, unrealized_pnl'),
    supabase.from('closed_trades').select('exit_date, realized_pnl').order('exit_date', { ascending: false }),
    supabase.from('portfolio_snapshots').select('snapshot_date, total_nav, benchmark_value').order('snapshot_date', { ascending: true }),
    supabase.from('cases').select('id, company_name, ticker, status, total_score'),
  ])

  const openPositions: OpenPosition[] = openPositionsRaw ?? []
  const closedTrades: ClosedTrade[] = closedTradesRaw ?? []
  const snapshots: PortfolioSnapshot[] = snapshotsRaw ?? []
  const cases: Case[] = casesRaw ?? []

  const totalNav = openPositions.reduce(
    (sum, p) => sum + p.current_price * p.position_size_actual,
    0
  )
  const totalUnrealizedPnl = openPositions.reduce((sum, p) => sum + (p.unrealized_pnl ?? 0), 0)
  const totalUnrealizedPnlPct = totalNav > 0 ? (totalUnrealizedPnl / totalNav) * 100 : 0

  const ytdStart = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10)
  const realizedPnlYtd = closedTrades
    .filter((t) => t.exit_date >= ytdStart)
    .reduce((sum, t) => sum + (t.realized_pnl ?? 0), 0)

  const chartData = snapshots.map((s) => ({
    date: s.snapshot_date,
    nav: s.total_nav ?? 0,
    benchmark: s.benchmark_value ?? 0,
  }))

  const totalCases = cases.length
  const activeCases = cases.filter((c) => c.status === 'Active').length
  const topPick = cases.reduce<Case | null>(
    (best, c) =>
      c.total_score !== null && (best === null || (c.total_score ?? 0) > (best.total_score ?? 0))
        ? c
        : best,
    null
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, margin: '0 0 4px' }}>
          Admin Overview
        </h1>
        <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
          Fynoy Capital — Proprietary Trading Platform
        </p>
      </div>

      {/* Portfolio Summary */}
      <PortfolioSummary
        nav={totalNav}
        unrealizedPnl={totalUnrealizedPnl}
        unrealizedPnlPct={totalUnrealizedPnlPct}
        realizedPnlYtd={realizedPnlYtd}
        openPositionsCount={openPositions.length}
      />

      {/* Quick Stats */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <div
          style={{
            background: '#1a1d27',
            border: '1px solid #2a2d3e',
            borderRadius: '10px',
            padding: '20px 24px',
            flex: '1 1 200px',
          }}
        >
          <div style={{ color: '#6b7280', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Total Cases
          </div>
          <div style={{ color: '#fff', fontSize: '28px', fontWeight: 600 }}>{totalCases}</div>
        </div>
        <div
          style={{
            background: '#1a1d27',
            border: '1px solid #2a2d3e',
            borderRadius: '10px',
            padding: '20px 24px',
            flex: '1 1 200px',
          }}
        >
          <div style={{ color: '#6b7280', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Active Cases
          </div>
          <div style={{ color: '#22c55e', fontSize: '28px', fontWeight: 600 }}>{activeCases}</div>
        </div>
        <div
          style={{
            background: '#1a1d27',
            border: '1px solid #2a2d3e',
            borderRadius: '10px',
            padding: '20px 24px',
            flex: '2 1 300px',
          }}
        >
          <div style={{ color: '#6b7280', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Top Pick (Highest Score)
          </div>
          {topPick ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ color: '#fff', fontSize: '20px', fontWeight: 600 }}>
                {topPick.ticker} — {topPick.company_name}
              </div>
              <div
                style={{
                  background: '#3b82f620',
                  border: '1px solid #3b82f640',
                  borderRadius: '6px',
                  padding: '2px 10px',
                  color: '#3b82f6',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                {topPick.total_score}/48
              </div>
            </div>
          ) : (
            <div style={{ color: '#6b7280', fontSize: '14px' }}>No cases yet</div>
          )}
        </div>
      </div>

      {/* Performance Chart */}
      <PerformanceChart data={chartData} />

      {/* Navigation Cards */}
      <div>
        <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
          Admin Sections
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
          {ADMIN_SECTIONS.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              style={{ textDecoration: 'none' }}
            >
              <div
                style={{
                  background: '#1a1d27',
                  border: '1px solid #2a2d3e',
                  borderRadius: '10px',
                  padding: '20px 24px',
                  cursor: 'pointer',
                  borderLeft: `3px solid ${section.color}`,
                  transition: 'border-color 0.15s',
                }}
              >
                <div
                  style={{
                    color: section.color,
                    fontSize: '15px',
                    fontWeight: 600,
                    marginBottom: '6px',
                  }}
                >
                  {section.label}
                </div>
                <div style={{ color: '#6b7280', fontSize: '13px', lineHeight: '1.4' }}>
                  {section.description}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
