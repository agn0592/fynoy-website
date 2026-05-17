import Link from 'next/link'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import {
  IconBriefcase,
  IconPlus,
  IconSearch,
  IconStar,
} from '@/app/dashboard/components/Icons'
import { scoreClass } from './_components/ScoreBadge'

import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Cases' }

function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

interface CaseRow {
  id: string
  trading_id: string
  company_name: string | null
  ticker: string | null
  status: string | null
  sector: string | null
  date_of_case: string | null
  total_score: number | null
  confidence_score: number | null
}

interface SearchParams {
  filter?: string
  q?: string
}

function formatDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const filter = sp.filter ?? 'all'
  const q = (sp.q ?? '').trim()

  const supabase = getServiceClient()

  // Fetch full list (we filter in-memory for "top" + search; status filter goes to SQL)
  const { data: casesRaw } = await supabase
    .from('cases')
    .select(
      'id, trading_id, company_name, ticker, status, sector, date_of_case, total_score, confidence_score',
    )
    .order('date_of_case', { ascending: false, nullsFirst: false })

  const allCases: CaseRow[] = casesRaw ?? []

  // KPIs computed on full list
  const totalCases = allCases.length
  const activeCases = allCases.filter((c) => c.status === 'Active').length
  const scored = allCases.filter((c): c is CaseRow & { total_score: number } => c.total_score !== null)
  const avgTotal =
    scored.length > 0
      ? Math.round((scored.reduce((s, c) => s + c.total_score, 0) / scored.length) * 10) / 10
      : null
  const topPick =
    scored.length > 0
      ? scored.reduce((best, c) => (c.total_score > best.total_score ? c : best), scored[0])
      : null

  // Apply filter
  let filtered = allCases
  if (filter === 'active') filtered = filtered.filter((c) => c.status === 'Active')
  else if (filter === 'inactive') filtered = filtered.filter((c) => c.status === 'Not Active')
  else if (filter === 'top') filtered = filtered.filter((c) => (c.total_score ?? 0) >= 35)

  if (q) {
    const ql = q.toLowerCase()
    filtered = filtered.filter(
      (c) =>
        (c.company_name ?? '').toLowerCase().includes(ql) ||
        (c.ticker ?? '').toLowerCase().includes(ql),
    )
  }

  const chipHref = (key: string) => {
    const params = new URLSearchParams()
    if (key !== 'all') params.set('filter', key)
    if (q) params.set('q', q)
    const qs = params.toString()
    return qs ? `/admin/cases?${qs}` : '/admin/cases'
  }

  const chips: { key: string; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: totalCases },
    { key: 'active', label: 'Active', count: activeCases },
    { key: 'inactive', label: 'Not Active', count: totalCases - activeCases },
    {
      key: 'top',
      label: 'Top picks',
      count: allCases.filter((c) => (c.total_score ?? 0) >= 35).length,
    },
  ]

  return (
    <>
      <div className="dash-page-head">
        <div className="dash-page-title-block">
          <h1 className="dash-page-title">
            <em>Cases</em>
          </h1>
          <div className="dash-page-sub">Investment research repository.</div>
        </div>
        <div className="dash-page-actions">
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--ink-dim)',
              fontSize: 12,
            }}
          >
            <IconBriefcase width={14} height={14} />
            {totalCases} total
          </span>
          <Link href="/admin/cases/new" className="dash-btn btn-gold">
            <IconPlus width={14} height={14} />
            New Case
          </Link>
        </div>
      </div>

      {/* KPI strip */}
      <div className="adm-kpi-grid" style={{ marginBottom: 16, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="adm-kpi">
          <div className="adm-kpi-label">Total cases</div>
          <div className="adm-kpi-val">{totalCases}</div>
        </div>
        <div className={`adm-kpi ${activeCases > 0 ? 'kpi-up' : 'kpi-neutral'}`}>
          <div className="adm-kpi-label">Active cases</div>
          <div className={`adm-kpi-val ${activeCases > 0 ? 'up' : ''}`}>{activeCases}</div>
          {totalCases > 0 && (
            <div className="adm-kpi-sub">
              {Math.round((activeCases / totalCases) * 100)}% of total
            </div>
          )}
        </div>
        <div className="adm-kpi kpi-neutral">
          <div className="adm-kpi-label">Average score</div>
          <div className="adm-kpi-val">{avgTotal !== null ? avgTotal.toFixed(1) : '—'}</div>
          {avgTotal !== null && <div className="adm-kpi-sub">out of 48</div>}
        </div>
        <div className="adm-kpi">
          <div className="adm-kpi-label">Top scoring</div>
          <div className="adm-kpi-val">
            {topPick ? (
              <span>
                {topPick.ticker ?? '—'}
                <span style={{ color: 'var(--gold)', marginLeft: 8, fontSize: 14 }}>
                  {topPick.total_score}
                </span>
              </span>
            ) : (
              '—'
            )}
          </div>
          {topPick && (
            <div className="adm-kpi-sub" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {topPick.company_name}
            </div>
          )}
        </div>
      </div>

      {/* Filter chips + search */}
      <div
        className="dash-card"
        style={{
          padding: '14px 18px',
          marginBottom: 16,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div className="dash-chips">
          {chips.map((c) => (
            <Link
              key={c.key}
              href={chipHref(c.key)}
              className={`dash-chip${filter === c.key ? ' is-active' : ''}`}
            >
              {c.label}
              <span
                style={{
                  marginLeft: 4,
                  padding: '0 5px',
                  borderRadius: 2,
                  background: 'rgba(232,228,220,0.04)',
                  fontSize: 10,
                  color: 'var(--ink-dim)',
                }}
              >
                {c.count}
              </span>
            </Link>
          ))}
        </div>
        <form
          method="GET"
          action="/admin/cases"
          style={{
            marginLeft: 'auto',
            position: 'relative',
            minWidth: 220,
            flex: '0 1 320px',
          }}
        >
          {filter !== 'all' && <input type="hidden" name="filter" value={filter} />}
          <IconSearch
            width={14}
            height={14}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--ink-dim)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="search"
            name="q"
            defaultValue={q}
            className="dash-input"
            placeholder="Search by company or ticker…"
            style={{ paddingLeft: 34 }}
          />
        </form>
      </div>

      {/* Table */}
      <div className="dash-card">
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th className="dash-th">Trading ID</th>
                <th className="dash-th">Company</th>
                <th className="dash-th">Ticker</th>
                <th className="dash-th">Status</th>
                <th className="dash-th">Score</th>
                <th className="dash-th">Confidence</th>
                <th className="dash-th">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td className="dash-td" colSpan={7}>
                    <div className="dash-empty">
                      {q || filter !== 'all'
                        ? 'No cases match your filter.'
                        : (
                          <>
                            No cases yet.{' '}
                            <Link href="/admin/cases/new" style={{ color: 'var(--gold)' }}>
                              Create the first case
                            </Link>
                            .
                          </>
                        )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const isTopPick = (c.total_score ?? 0) >= 35
                  const sCls = scoreClass(c.total_score, 48)
                  const pct =
                    c.total_score !== null ? Math.max(0, Math.min(100, (c.total_score / 48) * 100)) : 0
                  const fillColor =
                    sCls === 'high'
                      ? 'var(--dash-green)'
                      : sCls === 'low'
                        ? 'var(--dash-red)'
                        : 'var(--gold)'
                  const isActive = c.status === 'Active'
                  return (
                    <tr
                      key={c.id}
                      className="dash-tr"
                      style={isTopPick ? { borderLeft: '2px solid var(--gold)' } : undefined}
                    >
                      <td className="dash-td">
                        <Link
                          href={`/admin/cases/${c.id}`}
                          style={{
                            color: 'var(--gold)',
                            fontFamily: 'var(--serif)',
                            fontSize: 12,
                            textDecoration: 'none',
                            letterSpacing: '0.02em',
                          }}
                        >
                          {c.trading_id}
                        </Link>
                      </td>
                      <td className="dash-td">
                        <Link
                          href={`/admin/cases/${c.id}`}
                          style={{
                            display: 'inline-flex',
                            flexDirection: 'column',
                            gap: 2,
                            textDecoration: 'none',
                          }}
                        >
                          <span className="dash-symbol" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            {isTopPick && <IconStar width={11} height={11} style={{ color: 'var(--gold)' }} />}
                            {c.company_name ?? '—'}
                          </span>
                          {c.sector && (
                            <span
                              style={{
                                fontSize: 10,
                                color: 'var(--ink-dim)',
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                              }}
                            >
                              {c.sector}
                            </span>
                          )}
                        </Link>
                      </td>
                      <td className="dash-td">
                        <span
                          style={{
                            fontFamily: 'var(--serif)',
                            color: 'var(--ink)',
                            fontSize: 13,
                            fontWeight: 500,
                          }}
                        >
                          {c.ticker ?? '—'}
                        </span>
                      </td>
                      <td className="dash-td">
                        <span className={`status-badge ${isActive ? 'active' : 'inactive'}`}>
                          {c.status ?? 'Not Active'}
                        </span>
                      </td>
                      <td className="dash-td">
                        {c.total_score !== null ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <span
                              className="weight-bar-track"
                              style={{ width: 60, height: 4, background: 'rgba(232,228,220,0.07)' }}
                            >
                              <span
                                style={{
                                  display: 'block',
                                  height: '100%',
                                  width: `${pct}%`,
                                  background: fillColor,
                                  borderRadius: 1,
                                  transition: 'width 0.4s cubic-bezier(0.34,1.56,0.64,1)',
                                }}
                              />
                            </span>
                            <span className={`score-badge ${sCls === 'mute' ? '' : sCls}`}>
                              {c.total_score}
                              <span className="max">/48</span>
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--ink-dim)', fontStyle: 'italic', fontFamily: 'var(--serif)' }}>—</span>
                        )}
                      </td>
                      <td className="dash-td">
                        {c.confidence_score !== null ? (
                          <span
                            className={`score-badge ${scoreClass(c.confidence_score, 10) === 'mute' ? '' : scoreClass(c.confidence_score, 10)}`}
                          >
                            {c.confidence_score}
                            <span className="max">/10</span>
                          </span>
                        ) : (
                          <span style={{ color: 'var(--ink-dim)', fontStyle: 'italic', fontFamily: 'var(--serif)' }}>—</span>
                        )}
                      </td>
                      <td className="dash-td">
                        <span className="dash-date">{formatDate(c.date_of_case)}</span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="dash-pagination">
            <span className="dash-page-info">
              Showing {filtered.length} of {totalCases}
            </span>
          </div>
        )}
      </div>
    </>
  )
}
