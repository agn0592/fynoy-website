import Link from 'next/link'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'

function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface OpenPosition {
  id: string
  trading_id: string | null
  symbol: string
  entry_price_actual: number
  current_price: number
  position_size_actual: number
  pct_of_nav: number
  unrealized_pnl: number
  unrealized_pnl_pct: number
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#1a1d27',
        border: '1px solid #2a2d3e',
        borderRadius: '10px',
        padding: '24px',
      }}
    >
      <h2
        style={{
          color: '#3b82f6',
          fontSize: '14px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          margin: '0 0 20px',
          paddingBottom: '12px',
          borderBottom: '1px solid #2a2d3e',
        }}
      >
        {title}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
        {children}
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div style={{ color: '#6b7280', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
        {label}
      </div>
      <div style={{ color: '#d1d5db', fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
        {value ?? <span style={{ color: '#4b5563', fontStyle: 'italic' }}>—</span>}
      </div>
    </div>
  )
}

function ScoreBadge({ value, max }: { value: number | null; max: number }) {
  if (value === null) return <span style={{ color: '#4b5563', fontStyle: 'italic' }}>—</span>
  const pct = (value / max) * 100
  const color = pct >= 75 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <span style={{ color, fontSize: '16px', fontWeight: 700 }}>
      {value}/{max}
    </span>
  )
}

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = getServiceClient()

  const [{ data: caseData }, { data: openPositionsRaw }] = await Promise.all([
    supabase.from('cases').select('*').eq('id', id).single(),
    supabase.from('open_positions').select('*'),
  ])

  if (!caseData) {
    notFound()
  }

  const openPositions: OpenPosition[] = openPositionsRaw ?? []
  const linkedPosition = openPositions.find(
    (p) => p.trading_id === caseData.trading_id
  ) ?? null

  const risks: string[] = caseData.risks ?? []
  const catalysts: string[] = caseData.catalysts ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span
              style={{
                fontFamily: 'monospace',
                color: '#3b82f6',
                fontSize: '13px',
                padding: '3px 10px',
                border: '1px solid #3b82f640',
                borderRadius: '4px',
                background: '#3b82f610',
              }}
            >
              {caseData.trading_id}
            </span>
            <span
              style={{
                padding: '3px 10px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                background: caseData.status === 'Active' ? '#22c55e20' : '#6b728020',
                border: `1px solid ${caseData.status === 'Active' ? '#22c55e40' : '#6b728040'}`,
                color: caseData.status === 'Active' ? '#22c55e' : '#9ca3af',
              }}
            >
              {caseData.status ?? 'Not Active'}
            </span>
          </div>
          <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 700, margin: '0 0 4px' }}>
            {caseData.company_name}
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '15px', margin: 0 }}>
            {caseData.ticker}
            {caseData.sector ? ` · ${caseData.sector}` : ''}
            {caseData.industry ? ` · ${caseData.industry}` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {caseData.total_score !== null && (
            <div
              style={{
                background: '#1a1d27',
                border: '1px solid #2a2d3e',
                borderRadius: '10px',
                padding: '12px 20px',
                textAlign: 'center',
              }}
            >
              <div style={{ color: '#6b7280', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                Total Score
              </div>
              <ScoreBadge value={caseData.total_score} max={48} />
            </div>
          )}
          <Link
            href={`/admin/cases/${id}/edit`}
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
            Edit
          </Link>
          <Link
            href="/admin/cases"
            style={{
              background: 'transparent',
              border: '1px solid #2a2d3e',
              color: '#9ca3af',
              textDecoration: 'none',
              padding: '8px 18px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            Back to Cases
          </Link>
        </div>
      </div>

      {/* Linked Position */}
      {linkedPosition && (
        <div
          style={{
            background: '#1a1d27',
            border: '1px solid #22c55e40',
            borderRadius: '10px',
            padding: '20px 24px',
          }}
        >
          <h2 style={{ color: '#22c55e', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 16px' }}>
            Linked Open Position
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
            <Field label="Symbol" value={linkedPosition.symbol} />
            <Field label="Entry Price" value={`€${linkedPosition.entry_price_actual?.toFixed(2)}`} />
            <Field label="Current Price" value={`€${linkedPosition.current_price?.toFixed(2)}`} />
            <Field label="Position Size" value={linkedPosition.position_size_actual?.toLocaleString()} />
            <Field label="% of NAV" value={`${linkedPosition.pct_of_nav?.toFixed(2)}%`} />
            <Field
              label="Unrealized PnL"
              value={
                <span style={{ color: (linkedPosition.unrealized_pnl ?? 0) >= 0 ? '#22c55e' : '#ef4444' }}>
                  €{linkedPosition.unrealized_pnl?.toFixed(2)} ({linkedPosition.unrealized_pnl_pct?.toFixed(2)}%)
                </span>
              }
            />
          </div>
        </div>
      )}

      {/* Section 1 — Case Metadata */}
      <Section title="Case Metadata">
        <Field label="Company Name" value={caseData.company_name} />
        <Field label="Ticker" value={caseData.ticker} />
        <Field label="Sector" value={caseData.sector} />
        <Field label="Industry" value={caseData.industry} />
        <Field label="Country" value={caseData.country_of_incorporation} />
        <Field label="Current Phase" value={caseData.current_phase} />
        <Field
          label="Date of Case"
          value={
            caseData.date_of_case
              ? new Date(caseData.date_of_case).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : null
          }
        />
        <Field label="Status" value={caseData.status} />
      </Section>

      {/* Section 2 — Investment Trigger */}
      <Section title="Investment Trigger">
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Event Details" value={caseData.event_details} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Brand Summary" value={caseData.brand_summary} />
        </div>
        <Field label="Brand Type" value={caseData.brand_type} />
        <Field label="Impact of News" value={caseData.impact_of_news} />
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Initial Market Assessment" value={caseData.initial_market_assessment} />
        </div>
        <Field label="Trigger Score" value={<ScoreBadge value={caseData.trigger_score} max={7} />} />
      </Section>

      {/* Section 3 — Fundamental Analysis */}
      <Section title="Fundamental Analysis">
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Company Fundamentals" value={caseData.company_fundamentals} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Business Model Explanation" value={caseData.business_model_explanation} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Key Products & Services" value={caseData.key_products_services} />
        </div>
        <Field label="Business Model Outlook" value={caseData.business_model_outlook} />
        <Field label="Earnings Quality" value={caseData.earnings_quality} />
        <Field label="Competitive Advantage" value={caseData.competitive_advantage} />
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Competitive Advantage Defined" value={caseData.competitive_advantage_defined} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Market Position" value={caseData.market_position} />
        </div>
        <Field label="ESG / Governance Score" value={<ScoreBadge value={caseData.esg_governance_quality_score} max={10} />} />
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="ESG / Governance Explanation" value={caseData.esg_governance_explanation} />
        </div>
        <Field label="Net Debt / EBITDA" value={caseData.net_debt_ebitda} />
        <Field label="EPS" value={caseData.eps} />
        <Field label="Operating Margin" value={caseData.operating_margin} />
        <Field label="Layered FCF TTM" value={caseData.layered_fcf_ttm} />
        <Field label="Fundamental Score" value={<ScoreBadge value={caseData.fundamental_score} max={10} />} />
      </Section>

      {/* Section 4 — Valuation Analysis */}
      <Section title="Valuation Analysis">
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Valuation Metrics vs Peers" value={caseData.valuation_metrics_peers} />
        </div>
        <Field label="Current P/E" value={caseData.current_pe} />
        <Field label="Forward P/E" value={caseData.forward_pe} />
        <Field label="EV/EBITDA" value={caseData.ev_ebitda} />
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Current vs Historical Multiples" value={caseData.current_vs_historical_multiples} />
        </div>
        <Field label="Top 3 Competitors" value={caseData.top_3_competitors} />
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Prior Valuation Assessment" value={caseData.prior_valuation_assessment} />
        </div>
        <Field label="Analyst 1Y Price Target" value={caseData.analyst_1y_price_target ? `€${caseData.analyst_1y_price_target}` : null} />
        <Field label="Valuation Score" value={<ScoreBadge value={caseData.valuation_score} max={8} />} />
      </Section>

      {/* Section 5 — Conviction & Risks */}
      <Section title="Conviction & Risks">
        <div>
          <Field
            label="Risks"
            value={
              risks.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  {risks.map((r, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>{r}</li>
                  ))}
                </ul>
              ) : null
            }
          />
        </div>
        <div>
          <Field
            label="Catalysts"
            value={
              catalysts.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  {catalysts.map((c, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>{c}</li>
                  ))}
                </ul>
              ) : null
            }
          />
        </div>
        <Field label="Conviction Score" value={<ScoreBadge value={caseData.conviction_score} max={10} />} />
      </Section>

      {/* Section 6 — Technical Analysis */}
      <Section title="Technical Analysis">
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Primary Trend" value={caseData.primary_trend} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Overall Chart Assessment" value={caseData.overall_chart_assessment} />
        </div>
        <Field label="TradingView TA Score" value={caseData.tradingview_ta_score} />
        <Field label="Technical Score" value={<ScoreBadge value={caseData.technical_score} max={6} />} />
        <Field label="52-Week Low" value={caseData.week_52_low ? `€${caseData.week_52_low}` : null} />
        <Field label="52-Week High" value={caseData.week_52_high ? `€${caseData.week_52_high}` : null} />
      </Section>

      {/* Section 7 — Execution Plan */}
      <Section title="Execution Plan">
        <Field label="Entry Price Target" value={caseData.entry_price_target ? `€${caseData.entry_price_target}` : null} />
        <Field label="Take Profit" value={caseData.take_profit ? `€${caseData.take_profit}` : null} />
        <Field label="Stop Loss" value={caseData.stop_loss ? `€${caseData.stop_loss}` : null} />
        <Field label="Leverage" value={caseData.leverage ? `${caseData.leverage}x` : null} />
        <Field label="Risk/Reward Ratio" value={caseData.risk_reward_ratio ? `${Number(caseData.risk_reward_ratio).toFixed(2)}` : null} />
        <Field label="Expected Holding Period" value={caseData.expected_holding_period_months ? `${caseData.expected_holding_period_months} months` : null} />
        <Field label="Rematch" value={caseData.rematch === true ? 'Yes' : caseData.rematch === false ? 'No' : null} />
        {caseData.rematch === false && (
          <Field label="Why Not Rematch" value={caseData.why_not_rematch} />
        )}
      </Section>

      {/* Section 8 — Final Score */}
      <div
        style={{
          background: '#1a1d27',
          border: '1px solid #2a2d3e',
          borderRadius: '10px',
          padding: '24px',
        }}
      >
        <h2
          style={{
            color: '#3b82f6',
            fontSize: '14px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            margin: '0 0 20px',
            paddingBottom: '12px',
            borderBottom: '1px solid #2a2d3e',
          }}
        >
          Final Score
        </h2>
        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#6b7280', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Total Score
            </div>
            <div
              style={{
                color: '#fff',
                fontSize: '48px',
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {caseData.total_score ?? '—'}
              <span style={{ color: '#6b7280', fontSize: '24px' }}>/48</span>
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#6b7280', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Confidence Score
            </div>
            <div
              style={{
                color: '#3b82f6',
                fontSize: '36px',
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {caseData.confidence_score ?? '—'}
              <span style={{ color: '#6b7280', fontSize: '18px' }}>/10</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', flex: 1 }}>
            <Field label="Trigger" value={<ScoreBadge value={caseData.trigger_score} max={7} />} />
            <Field label="Fundamental" value={<ScoreBadge value={caseData.fundamental_score} max={10} />} />
            <Field label="Valuation" value={<ScoreBadge value={caseData.valuation_score} max={8} />} />
            <Field label="Conviction" value={<ScoreBadge value={caseData.conviction_score} max={10} />} />
            <Field label="Technical" value={<ScoreBadge value={caseData.technical_score} max={6} />} />
          </div>
        </div>
      </div>
    </div>
  )
}
