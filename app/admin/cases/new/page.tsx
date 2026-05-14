'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#0f1117',
  border: '1px solid #2a2d3e',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '14px',
  padding: '8px 12px',
  outline: 'none',
  boxSizing: 'border-box',
}

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: 'vertical',
  minHeight: '80px',
  fontFamily: 'inherit',
}

const labelStyle: React.CSSProperties = {
  color: '#9ca3af',
  fontSize: '12px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  marginBottom: '4px',
  display: 'block',
}

const fieldStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
}

const sectionStyle: React.CSSProperties = {
  background: '#1a1d27',
  border: '1px solid #2a2d3e',
  borderRadius: '10px',
  padding: '24px',
  marginBottom: '24px',
}

const sectionTitleStyle: React.CSSProperties = {
  color: '#3b82f6',
  fontSize: '14px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  margin: '0 0 20px',
  paddingBottom: '12px',
  borderBottom: '1px solid #2a2d3e',
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: '16px',
}

function SliderField({
  label,
  name,
  min,
  max,
  value,
  onChange,
}: {
  label: string
  name: string
  min: number
  max: number
  value: number
  onChange: (val: number) => void
}) {
  return (
    <div style={fieldStyle}>
      <label style={labelStyle}>
        {label}{' '}
        <span
          style={{
            color: '#3b82f6',
            fontWeight: 700,
            fontSize: '14px',
          }}
        >
          {value}
        </span>
        <span style={{ color: '#6b7280' }}>/{max}</span>
      </label>
      <input
        type="range"
        name={name}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#3b82f6', cursor: 'pointer' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280', fontSize: '11px' }}>
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}

export default function NewCasePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Scores
  const [triggerScore, setTriggerScore] = useState(4)
  const [fundamentalScore, setFundamentalScore] = useState(5)
  const [valuationScore, setValuationScore] = useState(4)
  const [convictionScore, setConvictionScore] = useState(5)
  const [technicalScore, setTechnicalScore] = useState(3)
  const [confidenceScore, setConfidenceScore] = useState(5)
  const [esgScore, setEsgScore] = useState(5)

  // Execution
  const [entryPrice, setEntryPrice] = useState('')
  const [takeProfit, setTakeProfit] = useState('')
  const [stopLoss, setStopLoss] = useState('')
  const [rematch, setRematch] = useState(true)

  const totalScore = triggerScore + fundamentalScore + valuationScore + convictionScore + technicalScore

  const rrr =
    entryPrice && takeProfit && stopLoss && Number(entryPrice) !== Number(stopLoss)
      ? (
          (Number(takeProfit) - Number(entryPrice)) /
          (Number(entryPrice) - Number(stopLoss))
        ).toFixed(2)
      : ''

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = e.currentTarget
    const fd = new FormData(form)

    const ticker = (fd.get('ticker') as string).toUpperCase().trim()
    const dateOfCase = fd.get('date_of_case') as string

    // Generate trading_id
    const d = dateOfCase ? new Date(dateOfCase) : new Date()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yy = String(d.getFullYear()).slice(2)
    const tradingId = `${ticker}-${totalScore}-${mm}${yy}`

    // risks and catalysts arrays
    const risks = [
      fd.get('risk_1') as string,
      fd.get('risk_2') as string,
      fd.get('risk_3') as string,
      fd.get('risk_4') as string,
    ].filter(Boolean)

    const catalysts = [
      fd.get('catalyst_1') as string,
      fd.get('catalyst_2') as string,
      fd.get('catalyst_3') as string,
      fd.get('catalyst_4') as string,
    ].filter(Boolean)

    const numOrNull = (key: string) => {
      const v = fd.get(key) as string
      return v && v.trim() !== '' ? Number(v) : null
    }

    const strOrNull = (key: string) => {
      const v = fd.get(key) as string
      return v && v.trim() !== '' ? v.trim() : null
    }

    const payload = {
      trading_id: tradingId,
      company_name: fd.get('company_name') as string,
      ticker,
      sector: strOrNull('sector'),
      industry: strOrNull('industry'),
      country_of_incorporation: strOrNull('country_of_incorporation'),
      current_phase: strOrNull('current_phase'),
      date_of_case: dateOfCase || null,
      status: fd.get('status') as string,
      event_details: strOrNull('event_details'),
      brand_summary: strOrNull('brand_summary'),
      brand_type: strOrNull('brand_type'),
      impact_of_news: strOrNull('impact_of_news'),
      initial_market_assessment: strOrNull('initial_market_assessment'),
      trigger_score: triggerScore,
      company_fundamentals: strOrNull('company_fundamentals'),
      business_model_explanation: strOrNull('business_model_explanation'),
      key_products_services: strOrNull('key_products_services'),
      business_model_outlook: strOrNull('business_model_outlook'),
      earnings_quality: strOrNull('earnings_quality'),
      competitive_advantage: strOrNull('competitive_advantage'),
      competitive_advantage_defined: strOrNull('competitive_advantage_defined'),
      market_position: strOrNull('market_position'),
      esg_governance_quality_score: esgScore,
      esg_governance_explanation: strOrNull('esg_governance_explanation'),
      net_debt_ebitda: strOrNull('net_debt_ebitda'),
      eps: strOrNull('eps'),
      operating_margin: strOrNull('operating_margin'),
      layered_fcf_ttm: strOrNull('layered_fcf_ttm'),
      fundamental_score: fundamentalScore,
      valuation_metrics_peers: strOrNull('valuation_metrics_peers'),
      current_pe: numOrNull('current_pe'),
      forward_pe: numOrNull('forward_pe'),
      ev_ebitda: numOrNull('ev_ebitda'),
      current_vs_historical_multiples: strOrNull('current_vs_historical_multiples'),
      top_3_competitors: strOrNull('top_3_competitors'),
      prior_valuation_assessment: strOrNull('prior_valuation_assessment'),
      analyst_1y_price_target: numOrNull('analyst_1y_price_target'),
      valuation_score: valuationScore,
      risks: risks.length > 0 ? risks : null,
      catalysts: catalysts.length > 0 ? catalysts : null,
      conviction_score: convictionScore,
      primary_trend: strOrNull('primary_trend'),
      overall_chart_assessment: strOrNull('overall_chart_assessment'),
      tradingview_ta_score: numOrNull('tradingview_ta_score'),
      technical_score: technicalScore,
      week_52_low: numOrNull('week_52_low'),
      week_52_high: numOrNull('week_52_high'),
      entry_price_target: entryPrice ? Number(entryPrice) : null,
      take_profit: takeProfit ? Number(takeProfit) : null,
      stop_loss: stopLoss ? Number(stopLoss) : null,
      leverage: numOrNull('leverage'),
      risk_reward_ratio: rrr ? Number(rrr) : null,
      expected_holding_period_months: numOrNull('expected_holding_period_months'),
      rematch,
      why_not_rematch: !rematch ? strOrNull('why_not_rematch') : null,
      total_score: totalScore,
      confidence_score: confidenceScore,
    }

    const supabase = createClient()
    const { error: insertError } = await supabase.from('cases').insert([payload])

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push('/admin/cases')
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, margin: '0 0 4px' }}>
          New Case
        </h1>
        <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
          Complete all sections to create a new investment case.
        </p>
      </div>

      {error && (
        <div
          style={{
            background: '#ef444420',
            border: '1px solid #ef444440',
            borderRadius: '6px',
            padding: '12px 16px',
            color: '#ef4444',
            fontSize: '14px',
            marginBottom: '24px',
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Section 1 — Case Metadata */}
        <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
          <div style={sectionStyle}>
            <legend style={sectionTitleStyle}>Section 1 — Case Metadata</legend>
            <div style={gridStyle}>
              <div style={fieldStyle}>
                <label style={labelStyle} htmlFor="company_name">Company Name *</label>
                <input id="company_name" name="company_name" type="text" required style={inputStyle} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle} htmlFor="ticker">Ticker *</label>
                <input
                  id="ticker"
                  name="ticker"
                  type="text"
                  required
                  style={{ ...inputStyle, textTransform: 'uppercase' }}
                  onChange={(e) => { e.target.value = e.target.value.toUpperCase() }}
                />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle} htmlFor="sector">Sector</label>
                <input id="sector" name="sector" type="text" style={inputStyle} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle} htmlFor="industry">Industry</label>
                <input id="industry" name="industry" type="text" style={inputStyle} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle} htmlFor="country_of_incorporation">Country of Incorporation</label>
                <input id="country_of_incorporation" name="country_of_incorporation" type="text" style={inputStyle} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle} htmlFor="current_phase">Current Phase</label>
                <input id="current_phase" name="current_phase" type="text" style={inputStyle} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle} htmlFor="date_of_case">Date of Case *</label>
                <input id="date_of_case" name="date_of_case" type="date" required style={inputStyle} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle} htmlFor="status">Status</label>
                <select id="status" name="status" style={{ ...inputStyle, cursor: 'pointer' }} defaultValue="Active">
                  <option value="Active">Active</option>
                  <option value="Not Active">Not Active</option>
                </select>
              </div>
            </div>
          </div>
        </fieldset>

        {/* Section 2 — Investment Trigger */}
        <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
          <div style={sectionStyle}>
            <legend style={sectionTitleStyle}>Section 2 — Investment Trigger</legend>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={fieldStyle}>
                <label style={labelStyle} htmlFor="event_details">Event Details</label>
                <textarea id="event_details" name="event_details" style={textareaStyle} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle} htmlFor="brand_summary">Brand Summary</label>
                <textarea id="brand_summary" name="brand_summary" style={textareaStyle} />
              </div>
              <div style={gridStyle}>
                <div style={fieldStyle}>
                  <label style={labelStyle} htmlFor="brand_type">Brand Type</label>
                  <input id="brand_type" name="brand_type" type="text" style={inputStyle} />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle} htmlFor="impact_of_news">Impact of News</label>
                  <input id="impact_of_news" name="impact_of_news" type="text" style={inputStyle} />
                </div>
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle} htmlFor="initial_market_assessment">Initial Market Assessment</label>
                <textarea id="initial_market_assessment" name="initial_market_assessment" style={textareaStyle} />
              </div>
              <SliderField label="Trigger Score" name="trigger_score" min={1} max={7} value={triggerScore} onChange={setTriggerScore} />
            </div>
          </div>
        </fieldset>

        {/* Section 3 — Fundamental Analysis */}
        <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
          <div style={sectionStyle}>
            <legend style={sectionTitleStyle}>Section 3 — Fundamental Analysis</legend>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={fieldStyle}>
                <label style={labelStyle} htmlFor="company_fundamentals">Company Fundamentals</label>
                <textarea id="company_fundamentals" name="company_fundamentals" style={textareaStyle} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle} htmlFor="business_model_explanation">Business Model Explanation</label>
                <textarea id="business_model_explanation" name="business_model_explanation" style={textareaStyle} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle} htmlFor="key_products_services">Key Products & Services</label>
                <textarea id="key_products_services" name="key_products_services" style={textareaStyle} />
              </div>
              <div style={gridStyle}>
                <div style={fieldStyle}>
                  <label style={labelStyle} htmlFor="business_model_outlook">Business Model Outlook</label>
                  <input id="business_model_outlook" name="business_model_outlook" type="text" style={inputStyle} />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle} htmlFor="earnings_quality">Earnings Quality</label>
                  <input id="earnings_quality" name="earnings_quality" type="text" style={inputStyle} />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle} htmlFor="competitive_advantage">Competitive Advantage</label>
                  <input id="competitive_advantage" name="competitive_advantage" type="text" style={inputStyle} />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle} htmlFor="market_position">Market Position</label>
                  <input id="market_position" name="market_position" type="text" style={inputStyle} />
                </div>
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle} htmlFor="competitive_advantage_defined">Competitive Advantage Defined</label>
                <textarea id="competitive_advantage_defined" name="competitive_advantage_defined" style={textareaStyle} />
              </div>
              <SliderField label="ESG / Governance Quality Score" name="esg_governance_quality_score" min={1} max={10} value={esgScore} onChange={setEsgScore} />
              <div style={fieldStyle}>
                <label style={labelStyle} htmlFor="esg_governance_explanation">ESG / Governance Explanation</label>
                <textarea id="esg_governance_explanation" name="esg_governance_explanation" style={textareaStyle} />
              </div>
              <div style={gridStyle}>
                <div style={fieldStyle}>
                  <label style={labelStyle} htmlFor="net_debt_ebitda">Net Debt / EBITDA</label>
                  <input id="net_debt_ebitda" name="net_debt_ebitda" type="text" style={inputStyle} />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle} htmlFor="eps">EPS</label>
                  <input id="eps" name="eps" type="text" style={inputStyle} />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle} htmlFor="operating_margin">Operating Margin</label>
                  <input id="operating_margin" name="operating_margin" type="text" style={inputStyle} />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle} htmlFor="layered_fcf_ttm">Layered FCF TTM</label>
                  <input id="layered_fcf_ttm" name="layered_fcf_ttm" type="text" style={inputStyle} />
                </div>
              </div>
              <SliderField label="Fundamental Score" name="fundamental_score" min={1} max={10} value={fundamentalScore} onChange={setFundamentalScore} />
            </div>
          </div>
        </fieldset>

        {/* Section 4 — Valuation Analysis */}
        <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
          <div style={sectionStyle}>
            <legend style={sectionTitleStyle}>Section 4 — Valuation Analysis</legend>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={fieldStyle}>
                <label style={labelStyle} htmlFor="valuation_metrics_peers">Valuation Metrics vs Peers</label>
                <textarea id="valuation_metrics_peers" name="valuation_metrics_peers" style={textareaStyle} />
              </div>
              <div style={gridStyle}>
                <div style={fieldStyle}>
                  <label style={labelStyle} htmlFor="current_pe">Current P/E</label>
                  <input id="current_pe" name="current_pe" type="number" step="0.01" style={inputStyle} />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle} htmlFor="forward_pe">Forward P/E</label>
                  <input id="forward_pe" name="forward_pe" type="number" step="0.01" style={inputStyle} />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle} htmlFor="ev_ebitda">EV/EBITDA</label>
                  <input id="ev_ebitda" name="ev_ebitda" type="number" step="0.01" style={inputStyle} />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle} htmlFor="analyst_1y_price_target">Analyst 1Y Price Target</label>
                  <input id="analyst_1y_price_target" name="analyst_1y_price_target" type="number" step="0.01" style={inputStyle} />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle} htmlFor="top_3_competitors">Top 3 Competitors</label>
                  <input id="top_3_competitors" name="top_3_competitors" type="text" style={inputStyle} />
                </div>
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle} htmlFor="current_vs_historical_multiples">Current vs Historical Multiples</label>
                <textarea id="current_vs_historical_multiples" name="current_vs_historical_multiples" style={textareaStyle} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle} htmlFor="prior_valuation_assessment">Prior Valuation Assessment</label>
                <textarea id="prior_valuation_assessment" name="prior_valuation_assessment" style={textareaStyle} />
              </div>
              <SliderField label="Valuation Score" name="valuation_score" min={1} max={8} value={valuationScore} onChange={setValuationScore} />
            </div>
          </div>
        </fieldset>

        {/* Section 5 — Conviction & Risks */}
        <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
          <div style={sectionStyle}>
            <legend style={sectionTitleStyle}>Section 5 — Conviction & Risks</legend>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={gridStyle}>
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} style={fieldStyle}>
                    <label style={labelStyle} htmlFor={`risk_${n}`}>Risk {n}</label>
                    <input id={`risk_${n}`} name={`risk_${n}`} type="text" style={inputStyle} />
                  </div>
                ))}
              </div>
              <div style={gridStyle}>
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} style={fieldStyle}>
                    <label style={labelStyle} htmlFor={`catalyst_${n}`}>Catalyst {n}</label>
                    <input id={`catalyst_${n}`} name={`catalyst_${n}`} type="text" style={inputStyle} />
                  </div>
                ))}
              </div>
              <SliderField label="Conviction Score" name="conviction_score" min={1} max={10} value={convictionScore} onChange={setConvictionScore} />
            </div>
          </div>
        </fieldset>

        {/* Section 6 — Technical Analysis */}
        <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
          <div style={sectionStyle}>
            <legend style={sectionTitleStyle}>Section 6 — Technical Analysis</legend>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={fieldStyle}>
                <label style={labelStyle} htmlFor="primary_trend">Primary Trend</label>
                <textarea id="primary_trend" name="primary_trend" style={textareaStyle} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle} htmlFor="overall_chart_assessment">Overall Chart Assessment</label>
                <textarea id="overall_chart_assessment" name="overall_chart_assessment" style={textareaStyle} />
              </div>
              <div style={gridStyle}>
                <div style={fieldStyle}>
                  <label style={labelStyle} htmlFor="tradingview_ta_score">TradingView TA Score</label>
                  <input id="tradingview_ta_score" name="tradingview_ta_score" type="number" step="0.01" style={inputStyle} />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle} htmlFor="week_52_low">52-Week Low</label>
                  <input id="week_52_low" name="week_52_low" type="number" step="0.01" style={inputStyle} />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle} htmlFor="week_52_high">52-Week High</label>
                  <input id="week_52_high" name="week_52_high" type="number" step="0.01" style={inputStyle} />
                </div>
              </div>
              <SliderField label="Technical Score" name="technical_score" min={1} max={6} value={technicalScore} onChange={setTechnicalScore} />
            </div>
          </div>
        </fieldset>

        {/* Section 7 — Execution Plan */}
        <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
          <div style={sectionStyle}>
            <legend style={sectionTitleStyle}>Section 7 — Execution Plan</legend>
            <div style={gridStyle}>
              <div style={fieldStyle}>
                <label style={labelStyle} htmlFor="entry_price_target">Entry Price Target</label>
                <input
                  id="entry_price_target"
                  name="entry_price_target"
                  type="number"
                  step="0.01"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle} htmlFor="take_profit">Take Profit</label>
                <input
                  id="take_profit"
                  name="take_profit"
                  type="number"
                  step="0.01"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle} htmlFor="stop_loss">Stop Loss</label>
                <input
                  id="stop_loss"
                  name="stop_loss"
                  type="number"
                  step="0.01"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle} htmlFor="leverage">Leverage</label>
                <input id="leverage" name="leverage" type="number" step="0.1" style={inputStyle} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Risk / Reward Ratio (auto)</label>
                <div
                  style={{
                    ...inputStyle,
                    background: '#0a0c14',
                    color: rrr ? '#22c55e' : '#6b7280',
                    fontWeight: 600,
                    cursor: 'default',
                  }}
                >
                  {rrr ? `${rrr} : 1` : 'Enter prices above'}
                </div>
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle} htmlFor="expected_holding_period_months">Expected Holding Period (months)</label>
                <input id="expected_holding_period_months" name="expected_holding_period_months" type="number" step="1" style={inputStyle} />
              </div>
            </div>
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  id="rematch"
                  name="rematch"
                  type="checkbox"
                  checked={rematch}
                  onChange={(e) => setRematch(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#3b82f6', cursor: 'pointer' }}
                />
                <label htmlFor="rematch" style={{ color: '#d1d5db', fontSize: '14px', cursor: 'pointer' }}>
                  Rematch
                </label>
              </div>
              {!rematch && (
                <div style={fieldStyle}>
                  <label style={labelStyle} htmlFor="why_not_rematch">Why Not Rematch</label>
                  <input id="why_not_rematch" name="why_not_rematch" type="text" style={inputStyle} />
                </div>
              )}
            </div>
          </div>
        </fieldset>

        {/* Section 8 — Final Score */}
        <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
          <div style={{ ...sectionStyle, border: '1px solid #3b82f640' }}>
            <legend style={sectionTitleStyle}>Section 8 — Final Score</legend>
            <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#6b7280', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  Total Score (auto)
                </div>
                <div style={{ color: '#fff', fontSize: '56px', fontWeight: 700, lineHeight: 1 }}>
                  {totalScore}
                  <span style={{ color: '#6b7280', fontSize: '24px' }}>/48</span>
                </div>
                <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '8px' }}>
                  = {triggerScore} + {fundamentalScore} + {valuationScore} + {convictionScore} + {technicalScore}
                </div>
              </div>
            </div>
            <SliderField label="Confidence Score" name="confidence_score" min={1} max={10} value={confidenceScore} onChange={setConfidenceScore} />
            <div style={{ marginTop: '32px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: loading ? '#1e3a5f' : '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  padding: '12px 32px',
                  borderRadius: '6px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'Saving...' : 'Save Case'}
              </button>
              <a
                href="/admin/cases"
                style={{
                  background: 'transparent',
                  border: '1px solid #2a2d3e',
                  color: '#9ca3af',
                  textDecoration: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  fontSize: '15px',
                  fontWeight: 500,
                  display: 'inline-block',
                }}
              >
                Cancel
              </a>
            </div>
          </div>
        </fieldset>
      </form>
    </div>
  )
}
