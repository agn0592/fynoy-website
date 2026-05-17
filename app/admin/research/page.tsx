import Link from 'next/link'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { IconBriefcase, IconChart, IconPlus, IconStar } from '@/app/dashboard/components/Icons'
import ResearchClient, { type CaseRow } from './_components/ResearchClient'

function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface SearchParams {
  sector?: string
  status?: string
  q?: string
}

const TOP_PICK_THRESHOLD = 35
const MAX_TOTAL = 48

type ChipKey = 'all' | 'active' | 'inactive' | 'top'

function chipFromStatus(status: string | undefined): ChipKey {
  if (status === 'Active') return 'active'
  if (status === 'Not Active') return 'inactive'
  if (status === 'top') return 'top'
  return 'all'
}

function avgTier(avg: number): 'up' | 'dn' | 'neutral' {
  const pct = (avg / MAX_TOTAL) * 100
  if (pct >= 75) return 'up'
  if (pct < 50) return 'dn'
  return 'neutral'
}

export default async function ResearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { sector, status, q } = await searchParams
  const supabase = getServiceClient()

  // Server-side text/sector filtering for the initial payload.
  let query = supabase
    .from('cases')
    .select(
      'id, trading_id, company_name, ticker, sector, status, trigger_score, fundamental_score, valuation_score, conviction_score, technical_score, total_score, date_of_case'
    )
    .order('total_score', { ascending: false, nullsFirst: false })

  if (sector && sector.trim() !== '') {
    query = query.eq('sector', sector)
  }
  if (q && q.trim() !== '') {
    const term = q.replace(/[%,]/g, '').trim()
    if (term.length > 0) {
      query = query.or(`company_name.ilike.%${term}%,ticker.ilike.%${term}%`)
    }
  }

  const { data: casesRaw, error } = await query

  if (error) {
    return (
      <>
        <div className="dash-page-head">
          <div className="dash-page-title-block">
            <h1 className="dash-page-title">
              <em>Research</em>
            </h1>
            <div className="dash-page-sub">All cases ranked by total score. Top picks border gold.</div>
          </div>
        </div>
        <div className="dash-alert alert-error">
          <div className="dash-alert-title">Failed to load cases</div>
          <div className="dash-alert-body">{error.message}</div>
        </div>
      </>
    )
  }

  const cases: CaseRow[] = (casesRaw ?? []) as CaseRow[]

  // Sectors list — derive from full table so the dropdown isn't filtered down by current query
  const { data: sectorRows } = await supabase.from('cases').select('sector')
  const sectors = Array.from(
    new Set(
      (sectorRows ?? [])
        .map((r) => r.sector)
        .filter((s): s is string => typeof s === 'string' && s.trim() !== '')
    )
  ).sort((a, b) => a.localeCompare(b))

  // KPI calculations across the (server-filtered) result set
  const totalCases = cases.length
  const topPicks = cases.filter((c) => (c.total_score ?? 0) >= TOP_PICK_THRESHOLD).length
  const scoredCases = cases.filter((c) => typeof c.total_score === 'number') as CaseRow[]
  const avgTotal =
    scoredCases.length === 0
      ? 0
      : scoredCases.reduce((sum, c) => sum + (c.total_score ?? 0), 0) / scoredCases.length

  // Most-researched sector
  const sectorCounts = new Map<string, number>()
  for (const c of cases) {
    if (c.sector) sectorCounts.set(c.sector, (sectorCounts.get(c.sector) ?? 0) + 1)
  }
  let topSector: { name: string; count: number } | null = null
  for (const [name, count] of sectorCounts) {
    if (!topSector || count > topSector.count) topSector = { name, count }
  }

  const avgAccent = scoredCases.length === 0 ? 'neutral' : avgTier(avgTotal)
  const initialChip = chipFromStatus(status)

  return (
    <>
      <div className="dash-page-head">
        <div className="dash-page-title-block">
          <h1 className="dash-page-title">
            <em>Research</em>
          </h1>
          <div className="dash-page-sub">
            All cases ranked by total score. Top picks border gold.
          </div>
        </div>
        <div className="dash-page-actions">
          <Link href="/admin/cases" className="dash-btn btn-ghost">
            <IconBriefcase width={14} height={14} />
            Open Cases →
          </Link>
          <Link href="/admin/cases/new" className="dash-btn btn-gold">
            <IconPlus width={14} height={14} />
            New Case
          </Link>
        </div>
      </div>

      {/* KPI strip */}
      <div
        className="adm-kpi-grid"
        style={{ marginBottom: 16, gridTemplateColumns: 'repeat(4, 1fr)' }}
      >
        <div className="adm-kpi kpi-neutral">
          <div className="adm-kpi-label">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <IconChart width={11} height={11} /> Total Cases
            </span>
          </div>
          <div className="adm-kpi-val">{totalCases}</div>
          <div className="adm-kpi-sub">
            {topPicks > 0 ? `${topPicks} flagged as top pick` : 'No top picks yet'}
          </div>
        </div>

        <div className={`adm-kpi${topPicks > 0 ? ' kpi-up' : ''}`}>
          <div className="adm-kpi-label">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <IconStar width={11} height={11} /> Top Picks ≥{TOP_PICK_THRESHOLD}
            </span>
          </div>
          <div
            className="adm-kpi-val"
            style={topPicks > 0 ? { color: 'var(--gold)' } : undefined}
          >
            {topPicks}
          </div>
          <div className="adm-kpi-sub">
            {totalCases > 0
              ? `${((topPicks / totalCases) * 100).toFixed(0)}% of researched cases`
              : '—'}
          </div>
        </div>

        <div
          className={`adm-kpi${avgAccent === 'up' ? ' kpi-up' : avgAccent === 'dn' ? ' kpi-dn' : ' kpi-neutral'}`}
        >
          <div className="adm-kpi-label">Avg Total Score</div>
          <div
            className={`adm-kpi-val${avgAccent === 'up' ? ' up' : avgAccent === 'dn' ? ' dn' : ''}`}
          >
            {scoredCases.length === 0 ? '—' : `${avgTotal.toFixed(1)}/${MAX_TOTAL}`}
          </div>
          <div className="adm-kpi-sub">
            {scoredCases.length === 0
              ? 'No scored cases'
              : `Across ${scoredCases.length} scored case${scoredCases.length === 1 ? '' : 's'}`}
          </div>
        </div>

        <div className="adm-kpi">
          <div className="adm-kpi-label">Most-Researched Sector</div>
          <div className="adm-kpi-val" style={{ fontSize: 18 }}>
            {topSector ? topSector.name : '—'}
          </div>
          <div className="adm-kpi-sub">
            {topSector
              ? `${topSector.count} case${topSector.count === 1 ? '' : 's'} researched`
              : 'No sector data'}
          </div>
        </div>
      </div>

      <ResearchClient
        cases={cases}
        sectors={sectors}
        initialChip={initialChip}
        initialSector={sector ?? ''}
        initialQuery={q ?? ''}
      />
    </>
  )
}
