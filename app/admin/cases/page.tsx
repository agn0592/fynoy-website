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
  status: string
  sector: string | null
  date_of_case: string | null
  total_score: number | null
  confidence_score: number | null
}

interface SearchParams {
  status?: string
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === 'Active'
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 600,
        background: isActive ? '#22c55e20' : '#6b728020',
        border: `1px solid ${isActive ? '#22c55e40' : '#6b728040'}`,
        color: isActive ? '#22c55e' : '#9ca3af',
      }}
    >
      {status}
    </span>
  )
}

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { status } = await searchParams
  const supabase = getServiceClient()

  let query = supabase
    .from('cases')
    .select('id, trading_id, company_name, ticker, status, sector, date_of_case, total_score, confidence_score')
    .order('date_of_case', { ascending: false })

  if (status && (status === 'Active' || status === 'Not Active')) {
    query = query.eq('status', status)
  }

  const { data: casesRaw } = await query
  const cases: Case[] = casesRaw ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, margin: '0 0 4px' }}>
            Cases
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
            {cases.length} case{cases.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <Link
          href="/admin/cases/new"
          style={{
            background: '#3b82f6',
            color: '#fff',
            textDecoration: 'none',
            padding: '8px 18px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          + New Case
        </Link>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[
          { label: 'All', value: undefined },
          { label: 'Active', value: 'Active' },
          { label: 'Not Active', value: 'Not Active' },
        ].map((f) => {
          const isSelected = (status ?? undefined) === f.value
          return (
            <Link
              key={f.label}
              href={f.value ? `/admin/cases?status=${encodeURIComponent(f.value)}` : '/admin/cases'}
              style={{
                padding: '5px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
                textDecoration: 'none',
                border: '1px solid',
                borderColor: isSelected ? '#3b82f6' : '#2a2d3e',
                background: isSelected ? '#3b82f620' : 'transparent',
                color: isSelected ? '#3b82f6' : '#6b7280',
              }}
            >
              {f.label}
            </Link>
          )
        })}
      </div>

      {/* Table */}
      <div
        style={{
          background: '#1a1d27',
          border: '1px solid #2a2d3e',
          borderRadius: '10px',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2a2d3e' }}>
              {['Trading ID', 'Company', 'Ticker', 'Status', 'Sector', 'Date', 'Total Score', 'Confidence'].map((col) => (
                <th
                  key={col}
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    color: '#6b7280',
                    fontSize: '12px',
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
                <td colSpan={8} style={{ padding: '48px 16px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                  No cases found.{' '}
                  <Link href="/admin/cases/new" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                    Create the first case
                  </Link>
                </td>
              </tr>
            ) : (
              cases.map((c, i) => (
                <tr
                  key={c.id}
                  style={{
                    borderBottom: i < cases.length - 1 ? '1px solid #2a2d3e' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <Link
                      href={`/admin/cases/${c.id}`}
                      style={{
                        color: '#3b82f6',
                        textDecoration: 'none',
                        fontSize: '13px',
                        fontWeight: 500,
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
                  <td style={{ padding: '12px 16px' }}>
                    <StatusBadge status={c.status ?? 'Not Active'} />
                  </td>
                  <td style={{ padding: '12px 16px', color: '#9ca3af', fontSize: '13px' }}>
                    {c.sector ?? '—'}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#9ca3af', fontSize: '13px', whiteSpace: 'nowrap' }}>
                    {c.date_of_case
                      ? new Date(c.date_of_case).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        color: '#fff',
                        fontSize: '14px',
                        fontWeight: 600,
                      }}
                    >
                      {c.total_score !== null ? `${c.total_score}/48` : '—'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#9ca3af', fontSize: '13px' }}>
                    {c.confidence_score !== null ? `${c.confidence_score}/10` : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
