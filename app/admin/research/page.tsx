import Link from 'next/link'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface Case {
  id: string
  trading_id: string
  company_name: string
  ticker: string
  sector: string | null
  status: string
  trigger_score: number | null
  fundamental_score: number | null
  valuation_score: number | null
  conviction_score: number | null
  technical_score: number | null
  total_score: number | null
}

interface SearchParams {
  sector?: string
  status?: string
}

function ScoreCell({ value, max }: { value: number | null; max: number }) {
  if (value === null) return <span style={{ color: '#4b5563' }}>—</span>
  const pct = (value / max) * 100
  const color = pct >= 75 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444'
  return <span style={{ color, fontWeight: 600 }}>{value}</span>
}

export default async function ResearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { sector, status } = await searchParams
  const supabase = getServiceClient()

  let query = supabase
    .from('cases')
    .select('id, trading_id, company_name, ticker, sector, status, trigger_score, fundamental_score, valuation_score, conviction_score, technical_score, total_score')
    .order('total_score', { ascending: false })

  if (sector && sector.trim() !== '') {
    query = query.ilike('sector', `%${sector}%`)
  }
  if (status && (status === 'Active' || status === 'Not Active')) {
    query = query.eq('status', status)
  }

  const { data: casesRaw } = await query
  const cases: Case[] = casesRaw ?? []

  // Unique sectors for filter dropdown
  const { data: allCasesRaw } = await supabase.from('cases').select('sector')
  const sectors = Array.from(
    new Set((allCasesRaw ?? []).map((c) => c.sector).filter(Boolean) as string[])
  ).sort()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, margin: '0 0 4px' }}>
          Research
        </h1>
        <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
          All cases ranked by total score. Gold border = total score ≥ 35.
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <form method="GET" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            name="sector"
            defaultValue={sector ?? ''}
            style={{
              background: '#0f1117',
              border: '1px solid #2a2d3e',
              borderRadius: '6px',
              color: '#d1d5db',
              fontSize: '13px',
              padding: '6px 12px',
              cursor: 'pointer',
            }}
          >
            <option value="">All Sectors</option>
            {sectors.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            name="status"
            defaultValue={status ?? ''}
            style={{
              background: '#0f1117',
              border: '1px solid #2a2d3e',
              borderRadius: '6px',
              color: '#d1d5db',
              fontSize: '13px',
              padding: '6px 12px',
              cursor: 'pointer',
            }}
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Not Active">Not Active</option>
          </select>
          <button
            type="submit"
            style={{
              background: '#3b82f6',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              padding: '6px 16px',
              cursor: 'pointer',
            }}
          >
            Filter
          </button>
          {(sector || status) && (
            <Link
              href="/admin/research"
              style={{
                color: '#6b7280',
                textDecoration: 'none',
                fontSize: '13px',
              }}
            >
              Clear
            </Link>
          )}
        </form>
        <span style={{ color: '#6b7280', fontSize: '13px', marginLeft: 'auto' }}>
          {cases.length} case{cases.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div
        style={{
          background: '#1a1d27',
          border: '1px solid #2a2d3e',
          borderRadius: '10px',
          overflow: 'auto',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2a2d3e' }}>
              {[
                'Trading ID',
                'Company',
                'Ticker',
                'Sector',
                'Status',
                `Trigger /7`,
                `Fundamental /10`,
                `Valuation /8`,
                `Conviction /10`,
                `Technical /6`,
                `Total /48`,
              ].map((col) => (
                <th
                  key={col}
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    color: '#6b7280',
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cases.length === 0 ? (
              <tr>
                <td
                  colSpan={11}
                  style={{
                    padding: '48px 16px',
                    textAlign: 'center',
                    color: '#6b7280',
                    fontSize: '14px',
                  }}
                >
                  No cases found.
                </td>
              </tr>
            ) : (
              cases.map((c, i) => {
                const isTopPick = (c.total_score ?? 0) >= 35
                return (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: i < cases.length - 1 ? '1px solid #2a2d3e' : 'none',
                      borderLeft: isTopPick ? '3px solid #f59e0b' : '3px solid transparent',
                    }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <Link
                        href={`/admin/cases/${c.id}`}
                        style={{
                          color: '#3b82f6',
                          textDecoration: 'none',
                          fontSize: '12px',
                          fontFamily: 'monospace',
                        }}
                      >
                        {c.trading_id}
                      </Link>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#fff', fontSize: '14px' }}>
                      <Link
                        href={`/admin/cases/${c.id}`}
                        style={{ color: '#fff', textDecoration: 'none' }}
                      >
                        {c.company_name}
                      </Link>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#d1d5db', fontSize: '13px', fontFamily: 'monospace' }}>
                      {c.ticker}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#9ca3af', fontSize: '13px' }}>
                      {c.sector ?? '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: c.status === 'Active' ? '#22c55e20' : '#6b728020',
                          color: c.status === 'Active' ? '#22c55e' : '#9ca3af',
                        }}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <ScoreCell value={c.trigger_score} max={7} />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <ScoreCell value={c.fundamental_score} max={10} />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <ScoreCell value={c.valuation_score} max={8} />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <ScoreCell value={c.conviction_score} max={10} />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <ScoreCell value={c.technical_score} max={6} />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          color: isTopPick ? '#f59e0b' : '#fff',
                          fontWeight: 700,
                          fontSize: '15px',
                        }}
                      >
                        {c.total_score ?? '—'}
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
