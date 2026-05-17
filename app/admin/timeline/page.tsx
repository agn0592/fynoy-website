import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { IconClock } from '@/app/dashboard/components/Icons'
import TimelineClient, { type PositionTimelineRow } from './_components/TimelineClient'

function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const DAY_MS = 86_400_000
const APPROACHING_DAYS = 30

function endDateMsFromEntry(entryIso: number, holdingMonths: number): number {
  const d = new Date(entryIso)
  d.setMonth(d.getMonth() + holdingMonths)
  return d.getTime()
}

export default async function TimelinePage() {
  const supabase = getServiceClient()

  const [posRes, casesRes] = await Promise.all([
    supabase
      .from('open_positions')
      .select('symbol, entry_date_actual, trading_id'),
    supabase
      .from('cases')
      .select('id, trading_id, expected_holding_period_months'),
  ])

  const caseByTradingId = new Map<string, { id: string; months: number | null }>()
  for (const c of casesRes.data ?? []) {
    if (c.trading_id) {
      caseByTradingId.set(c.trading_id, {
        id: c.id as string,
        months: c.expected_holding_period_months as number | null,
      })
    }
  }

  const positions: PositionTimelineRow[] = []
  for (const p of posRes.data ?? []) {
    if (!p.symbol || !p.entry_date_actual) continue
    const match = p.trading_id ? caseByTradingId.get(p.trading_id) : undefined
    const months = match?.months
    if (typeof months !== 'number' || months <= 0) continue
    const entryMs = new Date(p.entry_date_actual).getTime()
    if (!Number.isFinite(entryMs)) continue
    positions.push({
      symbol: p.symbol,
      trading_id: p.trading_id ?? null,
      caseId: match?.id ?? null,
      entry_date_actual: p.entry_date_actual,
      expected_holding_period_months: months,
      entry_iso: entryMs,
      end_iso: endDateMsFromEntry(entryMs, months),
    })
  }

  // Stable order — closest expiry first
  positions.sort((a, b) => a.end_iso - b.end_iso)

  // Render today on the server but the client will treat this as a static reference
  // (the timeline doesn't need to react to time-of-day changes).
  const todayMs = Date.now()

  // KPIs
  const activeCount = positions.length

  let closest: PositionTimelineRow | null = null
  let pastTarget = 0
  let timeRemainingSum = 0
  let timeRemainingCount = 0

  for (const p of positions) {
    const remaining = p.end_iso - todayMs
    if (remaining < 0) {
      pastTarget++
    } else {
      timeRemainingSum += remaining
      timeRemainingCount++
    }
    if (remaining >= 0) {
      if (!closest || p.end_iso < closest.end_iso) closest = p
    }
  }

  const avgDaysRemaining =
    timeRemainingCount === 0 ? null : Math.round(timeRemainingSum / timeRemainingCount / DAY_MS)

  const closestDays = closest ? Math.max(0, Math.round((closest.end_iso - todayMs) / DAY_MS)) : null

  return (
    <>
      <div className="dash-page-head">
        <div className="dash-page-title-block">
          <h1 className="dash-page-title">
            Position <em>Timeline</em>
          </h1>
          <div className="dash-page-sub">Visual map of expected holding periods.</div>
        </div>
        <div className="dash-page-actions">
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--ink-dim)',
              fontSize: 12,
            }}
          >
            <IconClock width={14} height={14} />
            {activeCount} tracked
          </span>
        </div>
      </div>

      {/* KPI strip */}
      <div
        className="adm-kpi-grid"
        style={{ marginBottom: 16, gridTemplateColumns: 'repeat(4, 1fr)' }}
      >
        <div className="adm-kpi kpi-neutral">
          <div className="adm-kpi-label">Active positions</div>
          <div className="adm-kpi-val">{activeCount}</div>
          <div className="adm-kpi-sub">With entry date & holding period</div>
        </div>

        <div
          className={`adm-kpi${
            closest && closestDays !== null && closestDays <= APPROACHING_DAYS ? ' kpi-dn' : ''
          }`}
        >
          <div className="adm-kpi-label">Closest to expiry</div>
          <div className="adm-kpi-val" style={{ fontSize: 18 }}>
            {closest ? closest.symbol : '—'}
          </div>
          <div className="adm-kpi-sub">
            {closest && closestDays !== null
              ? `${closestDays} day${closestDays === 1 ? '' : 's'} remaining`
              : 'No upcoming expiries'}
          </div>
        </div>

        <div className={`adm-kpi${pastTarget > 0 ? ' kpi-dn' : ' kpi-neutral'}`}>
          <div className="adm-kpi-label">Past target</div>
          <div
            className={`adm-kpi-val${pastTarget > 0 ? ' dn' : ''}`}
          >
            {pastTarget}
          </div>
          <div className="adm-kpi-sub">
            {pastTarget === 0 ? 'All within window' : 'Beyond expected window'}
          </div>
        </div>

        <div className="adm-kpi">
          <div className="adm-kpi-label">Avg time remaining</div>
          <div className="adm-kpi-val">
            {avgDaysRemaining === null ? '—' : `${avgDaysRemaining}d`}
          </div>
          <div className="adm-kpi-sub">
            {avgDaysRemaining === null
              ? 'No upcoming windows'
              : `Across ${timeRemainingCount} active position${timeRemainingCount === 1 ? '' : 's'}`}
          </div>
        </div>
      </div>

      {/* Legend (visual only) */}
      <div
        className="dash-chips"
        style={{ marginBottom: 16 }}
        aria-label="Timeline legend"
      >
        <span
          className="dash-chip is-active"
          style={{ cursor: 'default', borderColor: 'var(--gold-line)', color: 'var(--gold)' }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              background: 'linear-gradient(90deg, var(--gold), #e8c98a)',
            }}
          />
          On track
        </span>
        <span
          className="dash-chip"
          style={{
            cursor: 'default',
            color: 'var(--dash-orange)',
            borderColor: 'rgba(251,146,60,0.32)',
            background: 'rgba(251,146,60,0.06)',
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              background: 'var(--dash-orange)',
            }}
          />
          Approaching end (≤{APPROACHING_DAYS}d)
        </span>
        <span
          className="dash-chip"
          style={{
            cursor: 'default',
            color: 'var(--dash-red)',
            borderColor: 'rgba(248,113,113,0.32)',
            background: 'rgba(248,113,113,0.06)',
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              background: 'var(--dash-red)',
            }}
          />
          Past target
        </span>
      </div>

      <TimelineClient positions={positions} todayMs={todayMs} />
    </>
  )
}
