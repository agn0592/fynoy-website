import Link from 'next/link'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import {
  IconArrowLeft,
  IconCalendar,
  IconEdit,
  IconStar,
  IconTrendingDown,
  IconTrendingUp,
} from '@/app/dashboard/components/Icons'
import { Field } from '../_components/Field'
import { ScoreBadge, scoreClass } from '../_components/ScoreBadge'

function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

interface OpenPosition {
  id: string
  trading_id: string | null
  symbol: string
  entry_price_actual: number | null
  current_price: number | null
  position_size_actual: number | null
  pct_of_nav: number | null
  unrealized_pnl: number | null
  unrealized_pnl_pct: number | null
}

function fmtCurrency(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—'
  return `€${Number(v).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtPct(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—'
  return `${Number(v).toFixed(2)}%`
}

function fmtNum(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—'
  return Number(v).toLocaleString('en-GB')
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function SectionCard({
  title,
  sub,
  right,
  children,
}: {
  title: string
  sub?: string
  right?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="dash-card">
      <div className="dash-card-header" style={{ paddingBottom: 14, borderBottom: '1px solid var(--line)' }}>
        <div>
          <h2 className="dash-card-title">{title}</h2>
          {sub && <div className="dash-card-sub">{sub}</div>}
        </div>
        {right}
      </div>
      <div className="dash-card-body">
        <div className="dash-form-grid">{children}</div>
      </div>
    </div>
  )
}

function ScoreChip({
  label,
  value,
  max,
}: {
  label: string
  value: number | null
  max: number
}) {
  const cls = scoreClass(value, max)
  const pct = value !== null ? Math.max(0, Math.min(100, (value / max) * 100)) : 0
  const fill = cls === 'high' ? 'var(--dash-green)' : cls === 'low' ? 'var(--dash-red)' : 'var(--gold)'
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '12px 14px',
        background: 'var(--navy-3)',
        border: '1px solid var(--line)',
        borderRadius: 2,
        minWidth: 130,
        flex: '1 1 130px',
      }}
    >
      <div
        style={{
          fontSize: 9,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--ink-dim)',
          fontWeight: 500,
        }}
      >
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <ScoreBadge value={value} max={max} />
      </div>
      <span className="weight-bar-track" style={{ width: '100%', height: 4, background: 'rgba(232,228,220,0.07)' }}>
        <span
          style={{
            display: 'block',
            height: '100%',
            width: `${pct}%`,
            background: fill,
            borderRadius: 1,
            transition: 'width 0.4s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        />
      </span>
    </div>
  )
}

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = getServiceClient()

  const { data: caseData } = await supabase
    .from('cases')
    .select('*')
    .eq('id', id)
    .single()

  if (!caseData) notFound()

  // Linked open position (best-effort; ignore errors)
  let linkedPosition: OpenPosition | null = null
  if (caseData.trading_id) {
    const { data: posRaw } = await supabase
      .from('open_positions')
      .select('*')
      .eq('trading_id', caseData.trading_id)
      .maybeSingle()
    linkedPosition = (posRaw as OpenPosition | null) ?? null
  }

  const risks: string[] = Array.isArray(caseData.risks) ? caseData.risks : []
  const catalysts: string[] = Array.isArray(caseData.catalysts) ? caseData.catalysts : []

  const totalScore: number | null = caseData.total_score ?? null
  const totalCls = scoreClass(totalScore, 48)
  const totalColor =
    totalCls === 'high'
      ? 'var(--dash-green)'
      : totalCls === 'low'
        ? 'var(--dash-red)'
        : 'var(--gold)'
  const isTopPick = (totalScore ?? 0) >= 35
  const isActive = caseData.status === 'Active'

  const pnl = linkedPosition?.unrealized_pnl ?? null
  const pnlPos = pnl !== null && pnl >= 0

  return (
    <>
      {/* Page head */}
      <div className="dash-page-head">
        <div className="dash-page-title-block">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                fontFamily: 'var(--serif)',
                color: 'var(--gold)',
                fontSize: 12,
                padding: '3px 10px',
                border: '1px solid var(--gold-line)',
                background: 'rgba(201,169,110,0.06)',
                borderRadius: 2,
                letterSpacing: '0.06em',
              }}
            >
              {caseData.trading_id}
            </span>
            <span className={`status-badge ${isActive ? 'active' : 'inactive'}`}>
              {caseData.status ?? 'Not Active'}
            </span>
            {isTopPick && (
              <span className="status-badge warning" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <IconStar width={11} height={11} />
                Top Pick
              </span>
            )}
          </div>
          <h1 className="dash-page-title">
            {caseData.company_name ?? <em>Unnamed</em>}
          </h1>
          <div
            className="dash-page-sub"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 4 }}
          >
            <span style={{ color: 'var(--ink-mute)', fontFamily: 'var(--serif)' }}>{caseData.ticker ?? '—'}</span>
            {caseData.sector && <span>· {caseData.sector}</span>}
            {caseData.industry && <span>· {caseData.industry}</span>}
            {caseData.date_of_case && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 4 }}>
                <IconCalendar width={11} height={11} />
                {fmtDate(caseData.date_of_case)}
              </span>
            )}
          </div>
        </div>
        <div className="dash-page-actions">
          <Link href="/admin/cases" className="dash-btn btn-ghost">
            <IconArrowLeft width={14} height={14} />
            Back
          </Link>
          <Link href={`/admin/cases/${id}/edit`} className="dash-btn btn-gold">
            <IconEdit width={14} height={14} />
            Edit Case
          </Link>
        </div>
      </div>

      {/* Final Score banner */}
      <div
        className="dash-card"
        style={{
          marginBottom: 16,
          background: 'var(--navy-2)',
          borderLeft: `2px solid ${totalColor}`,
        }}
      >
        <div
          className="dash-card-body"
          style={{
            display: 'flex',
            gap: 28,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 180 }}>
            <div
              style={{
                fontSize: 10,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--ink-dim)',
                fontWeight: 500,
                marginBottom: 6,
              }}
            >
              Total Score
            </div>
            <div
              style={{
                fontFamily: 'var(--serif)',
                fontSize: 'clamp(40px, 6vw, 60px)',
                fontWeight: 600,
                color: totalColor,
                lineHeight: 1,
                letterSpacing: '-0.02em',
              }}
            >
              {totalScore ?? '—'}
              <span style={{ color: 'var(--ink-dim)', fontSize: '0.4em', marginLeft: 4 }}>/ 48</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 140 }}>
            <div
              style={{
                fontSize: 10,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--ink-dim)',
                fontWeight: 500,
                marginBottom: 6,
              }}
            >
              Confidence
            </div>
            <div
              style={{
                fontFamily: 'var(--serif)',
                fontSize: 'clamp(28px, 4vw, 40px)',
                fontWeight: 600,
                color: 'var(--ink)',
                lineHeight: 1,
                letterSpacing: '-0.02em',
              }}
            >
              {caseData.confidence_score ?? '—'}
              <span style={{ color: 'var(--ink-dim)', fontSize: '0.5em', marginLeft: 4 }}>/ 10</span>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 8,
              flex: 1,
              flexWrap: 'wrap',
              minWidth: 280,
            }}
          >
            <ScoreChip label="Trigger" value={caseData.trigger_score} max={7} />
            <ScoreChip label="Fundamental" value={caseData.fundamental_score} max={10} />
            <ScoreChip label="Valuation" value={caseData.valuation_score} max={8} />
            <ScoreChip label="Conviction" value={caseData.conviction_score} max={10} />
            <ScoreChip label="Technical" value={caseData.technical_score} max={6} />
          </div>
        </div>
      </div>

      {/* Linked Open Position */}
      {linkedPosition && (
        <div
          className="dash-card"
          style={{
            marginBottom: 16,
            borderLeft: '2px solid var(--dash-green)',
          }}
        >
          <div
            className="dash-card-header"
            style={{ paddingBottom: 14, borderBottom: '1px solid var(--line)' }}
          >
            <div>
              <h2 className="dash-card-title">Linked Position</h2>
              <div className="dash-card-sub">
                Live position tied to this case via {caseData.trading_id}
              </div>
            </div>
            <span
              className={`ret-badge ${pnlPos ? 'up' : 'dn'}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              {pnlPos ? <IconTrendingUp width={11} height={11} /> : <IconTrendingDown width={11} height={11} />}
              {fmtPct(linkedPosition.unrealized_pnl_pct)}
            </span>
          </div>
          <div className="dash-card-body">
            <div className="dash-form-grid">
              <Field label="Symbol" value={<span className="dash-symbol">{linkedPosition.symbol}</span>} />
              <Field label="Entry Price" value={fmtCurrency(linkedPosition.entry_price_actual)} />
              <Field label="Current Price" value={fmtCurrency(linkedPosition.current_price)} />
              <Field label="Position Size" value={fmtNum(linkedPosition.position_size_actual)} />
              <Field label="% of NAV" value={fmtPct(linkedPosition.pct_of_nav)} />
              <Field
                label="Unrealized P&L"
                value={
                  <span style={{ color: pnlPos ? 'var(--dash-green)' : 'var(--dash-red)', fontFamily: 'var(--serif)' }}>
                    {fmtCurrency(linkedPosition.unrealized_pnl)}
                  </span>
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* Sections grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SectionCard title="Case Metadata" sub="Identification" >
          <Field label="Company Name" value={caseData.company_name} />
          <Field label="Ticker" value={<span className="dash-symbol">{caseData.ticker ?? '—'}</span>} />
          <Field label="Sector" value={caseData.sector} />
          <Field label="Industry" value={caseData.industry} />
          <Field label="Country" value={caseData.country_of_incorporation} />
          <Field label="Current Phase" value={caseData.current_phase} />
          <Field label="Date of Case" value={fmtDate(caseData.date_of_case)} />
          <Field label="Status" value={
            <span className={`status-badge ${isActive ? 'active' : 'inactive'}`}>{caseData.status ?? 'Not Active'}</span>
          } />
        </SectionCard>

        <SectionCard
          title="Investment Trigger"
          sub="Event narrative & catalyst score"
          right={<ScoreBadge value={caseData.trigger_score} max={7} />}
        >
          <Field label="Event Details" value={caseData.event_details} spanAll />
          <Field label="Brand Summary" value={caseData.brand_summary} spanAll />
          <Field label="Brand Type" value={caseData.brand_type} />
          <Field label="Impact of News" value={caseData.impact_of_news} />
          <Field label="Initial Market Assessment" value={caseData.initial_market_assessment} spanAll />
        </SectionCard>

        <SectionCard
          title="Fundamental Analysis"
          sub="Business quality & financial profile"
          right={<ScoreBadge value={caseData.fundamental_score} max={10} />}
        >
          <Field label="Company Fundamentals" value={caseData.company_fundamentals} spanAll />
          <Field label="Business Model Explanation" value={caseData.business_model_explanation} spanAll />
          <Field label="Key Products & Services" value={caseData.key_products_services} spanAll />
          <Field label="Business Model Outlook" value={caseData.business_model_outlook} />
          <Field label="Earnings Quality" value={caseData.earnings_quality} />
          <Field label="Competitive Advantage" value={caseData.competitive_advantage} />
          <Field label="Market Position" value={caseData.market_position} />
          <Field label="Competitive Advantage Defined" value={caseData.competitive_advantage_defined} spanAll />
          <Field
            label="ESG / Governance Score"
            value={<ScoreBadge value={caseData.esg_governance_quality_score} max={10} />}
          />
          <Field label="ESG / Governance Explanation" value={caseData.esg_governance_explanation} spanAll />
          <Field label="Net Debt / EBITDA" value={caseData.net_debt_ebitda} />
          <Field label="EPS" value={caseData.eps} />
          <Field label="Operating Margin" value={caseData.operating_margin} />
          <Field label="Layered FCF TTM" value={caseData.layered_fcf_ttm} />
        </SectionCard>

        <SectionCard
          title="Valuation Analysis"
          sub="Multiples vs peers & target price"
          right={<ScoreBadge value={caseData.valuation_score} max={8} />}
        >
          <Field label="Valuation Metrics vs Peers" value={caseData.valuation_metrics_peers} spanAll />
          <Field label="Current P/E" value={caseData.current_pe} />
          <Field label="Forward P/E" value={caseData.forward_pe} />
          <Field label="EV / EBITDA" value={caseData.ev_ebitda} />
          <Field
            label="Analyst 1Y Target"
            value={caseData.analyst_1y_price_target !== null && caseData.analyst_1y_price_target !== undefined ? fmtCurrency(caseData.analyst_1y_price_target) : null}
          />
          <Field label="Top 3 Competitors" value={caseData.top_3_competitors} />
          <Field label="Current vs Historical Multiples" value={caseData.current_vs_historical_multiples} spanAll />
          <Field label="Prior Valuation Assessment" value={caseData.prior_valuation_assessment} spanAll />
        </SectionCard>

        <SectionCard
          title="Conviction & Risks"
          sub="What could go right; what could go wrong"
          right={<ScoreBadge value={caseData.conviction_score} max={10} />}
        >
          <Field
            label="Risks"
            spanAll
            value={
              risks.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {risks.map((r, i) => (
                    <li
                      key={i}
                      style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: 'var(--ink)' }}
                    >
                      <span
                        style={{
                          color: 'var(--gold)',
                          marginTop: 6,
                          width: 4,
                          height: 4,
                          borderRadius: '50%',
                          background: 'var(--gold)',
                          flexShrink: 0,
                        }}
                        aria-hidden
                      />
                      <span style={{ flex: 1, lineHeight: 1.55 }}>{r}</span>
                    </li>
                  ))}
                </ul>
              ) : null
            }
          />
          <Field
            label="Catalysts"
            spanAll
            value={
              catalysts.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {catalysts.map((c, i) => (
                    <li
                      key={i}
                      style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: 'var(--ink)' }}
                    >
                      <span
                        style={{
                          color: 'var(--gold)',
                          marginTop: 6,
                          width: 4,
                          height: 4,
                          borderRadius: '50%',
                          background: 'var(--gold)',
                          flexShrink: 0,
                        }}
                        aria-hidden
                      />
                      <span style={{ flex: 1, lineHeight: 1.55 }}>{c}</span>
                    </li>
                  ))}
                </ul>
              ) : null
            }
          />
        </SectionCard>

        <SectionCard
          title="Technical Analysis"
          sub="Trend & chart positioning"
          right={<ScoreBadge value={caseData.technical_score} max={6} />}
        >
          <Field label="Primary Trend" value={caseData.primary_trend} spanAll />
          <Field label="Overall Chart Assessment" value={caseData.overall_chart_assessment} spanAll />
          <Field label="TradingView TA Score" value={caseData.tradingview_ta_score} />
          <Field
            label="52-Week Low"
            value={caseData.week_52_low !== null && caseData.week_52_low !== undefined ? fmtCurrency(caseData.week_52_low) : null}
          />
          <Field
            label="52-Week High"
            value={caseData.week_52_high !== null && caseData.week_52_high !== undefined ? fmtCurrency(caseData.week_52_high) : null}
          />
        </SectionCard>

        <SectionCard title="Execution Plan" sub="Entry, exits, and leverage">
          <Field
            label="Entry Price Target"
            value={caseData.entry_price_target !== null && caseData.entry_price_target !== undefined ? fmtCurrency(caseData.entry_price_target) : null}
          />
          <Field
            label="Take Profit"
            value={
              caseData.take_profit !== null && caseData.take_profit !== undefined ? (
                <span style={{ color: 'var(--dash-green)', fontFamily: 'var(--serif)' }}>{fmtCurrency(caseData.take_profit)}</span>
              ) : null
            }
          />
          <Field
            label="Stop Loss"
            value={
              caseData.stop_loss !== null && caseData.stop_loss !== undefined ? (
                <span style={{ color: 'var(--dash-red)', fontFamily: 'var(--serif)' }}>{fmtCurrency(caseData.stop_loss)}</span>
              ) : null
            }
          />
          <Field
            label="Leverage"
            value={caseData.leverage !== null && caseData.leverage !== undefined ? `${caseData.leverage}x` : null}
          />
          <Field
            label="Risk / Reward"
            value={
              caseData.risk_reward_ratio !== null && caseData.risk_reward_ratio !== undefined
                ? `${Number(caseData.risk_reward_ratio).toFixed(2)} : 1`
                : null
            }
          />
          <Field
            label="Holding Period"
            value={
              caseData.expected_holding_period_months !== null && caseData.expected_holding_period_months !== undefined
                ? `${caseData.expected_holding_period_months} months`
                : null
            }
          />
          <Field
            label="Re-match"
            value={
              caseData.rematch === true ? (
                <span className="status-badge active">Yes</span>
              ) : caseData.rematch === false ? (
                <span className="status-badge inactive">No</span>
              ) : null
            }
          />
          {caseData.rematch === false && (
            <Field label="Why Not Re-match" value={caseData.why_not_rematch} spanAll />
          )}
        </SectionCard>
      </div>
    </>
  )
}
