'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  IconAlertCircle,
  IconArrowLeft,
  IconCheck,
  IconTrendingUp,
} from '@/app/dashboard/components/Icons'

export interface CaseFormInitial {
  id?: string
  trading_id?: string | null
  company_name?: string | null
  ticker?: string | null
  sector?: string | null
  industry?: string | null
  country_of_incorporation?: string | null
  current_phase?: string | null
  date_of_case?: string | null
  status?: string | null
  event_details?: string | null
  brand_summary?: string | null
  brand_type?: string | null
  impact_of_news?: string | null
  initial_market_assessment?: string | null
  trigger_score?: number | null
  company_fundamentals?: string | null
  business_model_explanation?: string | null
  key_products_services?: string | null
  business_model_outlook?: string | null
  earnings_quality?: string | null
  competitive_advantage?: string | null
  competitive_advantage_defined?: string | null
  market_position?: string | null
  esg_governance_quality_score?: number | null
  esg_governance_explanation?: string | null
  net_debt_ebitda?: string | null
  eps?: string | null
  operating_margin?: string | null
  layered_fcf_ttm?: string | null
  fundamental_score?: number | null
  valuation_metrics_peers?: string | null
  current_pe?: number | null
  forward_pe?: number | null
  ev_ebitda?: number | null
  current_vs_historical_multiples?: string | null
  top_3_competitors?: string | null
  prior_valuation_assessment?: string | null
  analyst_1y_price_target?: number | null
  valuation_score?: number | null
  risks?: string[] | null
  catalysts?: string[] | null
  conviction_score?: number | null
  primary_trend?: string | null
  overall_chart_assessment?: string | null
  tradingview_ta_score?: number | null
  technical_score?: number | null
  week_52_low?: number | null
  week_52_high?: number | null
  entry_price_target?: number | null
  take_profit?: number | null
  stop_loss?: number | null
  leverage?: number | null
  risk_reward_ratio?: number | null
  expected_holding_period_months?: number | null
  rematch?: boolean | null
  why_not_rematch?: string | null
  confidence_score?: number | null
}

interface CaseFormProps {
  mode: 'new' | 'edit'
  initial?: CaseFormInitial
}

interface SectionHeadingProps {
  number: number
  title: string
  sub?: string
}

function SectionHeading({ number, title, sub }: SectionHeadingProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <h2 className="dash-form-section-title">
        <span style={{ color: 'var(--gold)', marginRight: 8 }}>Section {number}</span>
        {title}
      </h2>
      {sub && <div style={{ fontSize: 11, color: 'var(--ink-dim)', letterSpacing: '0.04em' }}>{sub}</div>}
    </div>
  )
}

interface SliderProps {
  label: string
  min: number
  max: number
  value: number
  onChange: (v: number) => void
  hint?: string
}

function Slider({ label, min, max, value, onChange, hint }: SliderProps) {
  return (
    <div className="dash-form-group span-all">
      <label
        className="dash-form-label"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
      >
        <span>{label}</span>
        <span
          style={{
            fontFamily: 'var(--serif)',
            color: 'var(--gold)',
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: 0,
            textTransform: 'none',
          }}
        >
          {value}
          <span style={{ color: 'var(--ink-dim)', fontSize: 11, marginLeft: 2 }}>/ {max}</span>
        </span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="dash-range"
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink-dim)', fontSize: 10, letterSpacing: '0.06em' }}>
        <span>{min}</span>
        {hint && <span>{hint}</span>}
        <span>{max}</span>
      </div>
    </div>
  )
}

function strOrNull(v: FormDataEntryValue | null): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t === '' ? null : t
}

function numOrNull(v: FormDataEntryValue | null): number | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  if (t === '') return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

export default function CaseForm({ mode, initial }: CaseFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Scores
  const [triggerScore, setTriggerScore] = useState<number>(initial?.trigger_score ?? 4)
  const [fundamentalScore, setFundamentalScore] = useState<number>(initial?.fundamental_score ?? 5)
  const [valuationScore, setValuationScore] = useState<number>(initial?.valuation_score ?? 4)
  const [convictionScore, setConvictionScore] = useState<number>(initial?.conviction_score ?? 5)
  const [technicalScore, setTechnicalScore] = useState<number>(initial?.technical_score ?? 3)
  const [confidenceScore, setConfidenceScore] = useState<number>(initial?.confidence_score ?? 5)
  const [esgScore, setEsgScore] = useState<number>(initial?.esg_governance_quality_score ?? 5)

  // Execution
  const [entryPrice, setEntryPrice] = useState<string>(
    initial?.entry_price_target !== undefined && initial.entry_price_target !== null
      ? String(initial.entry_price_target)
      : '',
  )
  const [takeProfit, setTakeProfit] = useState<string>(
    initial?.take_profit !== undefined && initial.take_profit !== null
      ? String(initial.take_profit)
      : '',
  )
  const [stopLoss, setStopLoss] = useState<string>(
    initial?.stop_loss !== undefined && initial.stop_loss !== null
      ? String(initial.stop_loss)
      : '',
  )
  const [rematch, setRematch] = useState<boolean>(initial?.rematch ?? true)

  const totalScore = triggerScore + fundamentalScore + valuationScore + convictionScore + technicalScore

  const rrr = useMemo(() => {
    const e = Number(entryPrice)
    const t = Number(takeProfit)
    const s = Number(stopLoss)
    if (!entryPrice || !takeProfit || !stopLoss) return ''
    if (!Number.isFinite(e) || !Number.isFinite(t) || !Number.isFinite(s)) return ''
    if (e === s) return ''
    return ((t - e) / (e - s)).toFixed(2)
  }, [entryPrice, takeProfit, stopLoss])

  const totalScoreClass =
    totalScore >= 35 ? 'high' : totalScore >= 24 ? 'medium' : 'low'
  const totalColor =
    totalScoreClass === 'high'
      ? 'var(--dash-green)'
      : totalScoreClass === 'medium'
        ? 'var(--gold)'
        : 'var(--dash-red)'

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = e.currentTarget
    const fd = new FormData(form)

    const tickerRaw = strOrNull(fd.get('ticker'))
    const ticker = tickerRaw ? tickerRaw.toUpperCase() : ''
    const dateOfCase = strOrNull(fd.get('date_of_case'))

    // Generate trading_id only in new mode (preserve existing in edit mode)
    let tradingId = initial?.trading_id ?? null
    if (mode === 'new') {
      const d = dateOfCase ? new Date(dateOfCase) : new Date()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const yy = String(d.getFullYear()).slice(2)
      tradingId = `${ticker}-${totalScore}-${mm}${yy}`
    }

    const risks = [
      strOrNull(fd.get('risk_1')),
      strOrNull(fd.get('risk_2')),
      strOrNull(fd.get('risk_3')),
      strOrNull(fd.get('risk_4')),
    ].filter((v): v is string => v !== null)

    const catalysts = [
      strOrNull(fd.get('catalyst_1')),
      strOrNull(fd.get('catalyst_2')),
      strOrNull(fd.get('catalyst_3')),
      strOrNull(fd.get('catalyst_4')),
    ].filter((v): v is string => v !== null)

    const payload: Record<string, unknown> = {
      company_name: strOrNull(fd.get('company_name')),
      ticker,
      sector: strOrNull(fd.get('sector')),
      industry: strOrNull(fd.get('industry')),
      country_of_incorporation: strOrNull(fd.get('country_of_incorporation')),
      current_phase: strOrNull(fd.get('current_phase')),
      date_of_case: dateOfCase,
      status: strOrNull(fd.get('status')) ?? 'Active',
      event_details: strOrNull(fd.get('event_details')),
      brand_summary: strOrNull(fd.get('brand_summary')),
      brand_type: strOrNull(fd.get('brand_type')),
      impact_of_news: strOrNull(fd.get('impact_of_news')),
      initial_market_assessment: strOrNull(fd.get('initial_market_assessment')),
      trigger_score: triggerScore,
      company_fundamentals: strOrNull(fd.get('company_fundamentals')),
      business_model_explanation: strOrNull(fd.get('business_model_explanation')),
      key_products_services: strOrNull(fd.get('key_products_services')),
      business_model_outlook: strOrNull(fd.get('business_model_outlook')),
      earnings_quality: strOrNull(fd.get('earnings_quality')),
      competitive_advantage: strOrNull(fd.get('competitive_advantage')),
      competitive_advantage_defined: strOrNull(fd.get('competitive_advantage_defined')),
      market_position: strOrNull(fd.get('market_position')),
      esg_governance_quality_score: esgScore,
      esg_governance_explanation: strOrNull(fd.get('esg_governance_explanation')),
      net_debt_ebitda: strOrNull(fd.get('net_debt_ebitda')),
      eps: strOrNull(fd.get('eps')),
      operating_margin: strOrNull(fd.get('operating_margin')),
      layered_fcf_ttm: strOrNull(fd.get('layered_fcf_ttm')),
      fundamental_score: fundamentalScore,
      valuation_metrics_peers: strOrNull(fd.get('valuation_metrics_peers')),
      current_pe: numOrNull(fd.get('current_pe')),
      forward_pe: numOrNull(fd.get('forward_pe')),
      ev_ebitda: numOrNull(fd.get('ev_ebitda')),
      current_vs_historical_multiples: strOrNull(fd.get('current_vs_historical_multiples')),
      top_3_competitors: strOrNull(fd.get('top_3_competitors')),
      prior_valuation_assessment: strOrNull(fd.get('prior_valuation_assessment')),
      analyst_1y_price_target: numOrNull(fd.get('analyst_1y_price_target')),
      valuation_score: valuationScore,
      risks: risks.length > 0 ? risks : null,
      catalysts: catalysts.length > 0 ? catalysts : null,
      conviction_score: convictionScore,
      primary_trend: strOrNull(fd.get('primary_trend')),
      overall_chart_assessment: strOrNull(fd.get('overall_chart_assessment')),
      tradingview_ta_score: numOrNull(fd.get('tradingview_ta_score')),
      technical_score: technicalScore,
      week_52_low: numOrNull(fd.get('week_52_low')),
      week_52_high: numOrNull(fd.get('week_52_high')),
      entry_price_target: entryPrice !== '' ? Number(entryPrice) : null,
      take_profit: takeProfit !== '' ? Number(takeProfit) : null,
      stop_loss: stopLoss !== '' ? Number(stopLoss) : null,
      leverage: numOrNull(fd.get('leverage')),
      risk_reward_ratio: rrr !== '' ? Number(rrr) : null,
      expected_holding_period_months: numOrNull(fd.get('expected_holding_period_months')),
      rematch,
      why_not_rematch: !rematch ? strOrNull(fd.get('why_not_rematch')) : null,
      total_score: totalScore,
      confidence_score: confidenceScore,
    }

    if (mode === 'new') {
      payload.trading_id = tradingId
    }

    const supabase = createClient()

    if (mode === 'new') {
      const { data, error: insertError } = await supabase
        .from('cases')
        .insert([payload])
        .select('id')
        .single()
      if (insertError) {
        setError(insertError.message)
        setLoading(false)
        return
      }
      const newId = (data as { id: string } | null)?.id
      router.push(newId ? `/admin/cases/${newId}` : '/admin/cases')
      router.refresh()
    } else {
      if (!initial?.id) {
        setError('Missing case id for edit.')
        setLoading(false)
        return
      }
      const { error: updateError } = await supabase
        .from('cases')
        .update(payload)
        .eq('id', initial.id)
      if (updateError) {
        setError(updateError.message)
        setLoading(false)
        return
      }
      router.push(`/admin/cases/${initial.id}`)
      router.refresh()
    }
  }

  // helper for date input (must be YYYY-MM-DD string)
  const initialDate = initial?.date_of_case
    ? new Date(initial.date_of_case).toISOString().slice(0, 10)
    : ''

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="dash-alert alert-error" style={{ marginBottom: 16 }}>
          <div className="dash-alert-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <IconAlertCircle width={12} height={12} />
            Save failed
          </div>
          <div className="dash-alert-body">{error}</div>
        </div>
      )}

      {/* SECTION 1 — Case Metadata (always open) */}
      <details className="dash-form-section" open style={{ padding: 0 }}>
        <summary
          style={{
            listStyle: 'none',
            cursor: 'pointer',
            padding: '22px 24px 14px',
            borderBottom: '1px solid var(--line)',
            marginBottom: 18,
          }}
        >
          <SectionHeading number={1} title="Case Metadata" sub="Identification and classification of the investment case." />
        </summary>
        <div style={{ padding: '0 24px 22px' }}>
          <div className="dash-form-grid">
            <div className="dash-form-group">
              <label className="dash-form-label" htmlFor="company_name">
                Company Name<span className="req">*</span>
              </label>
              <input
                id="company_name"
                name="company_name"
                type="text"
                required
                className="dash-input"
                defaultValue={initial?.company_name ?? ''}
              />
            </div>
            <div className="dash-form-group">
              <label className="dash-form-label" htmlFor="ticker">
                Ticker<span className="req">*</span>
              </label>
              <input
                id="ticker"
                name="ticker"
                type="text"
                required
                className="dash-input"
                style={{ textTransform: 'uppercase', fontFamily: 'var(--serif)' }}
                defaultValue={initial?.ticker ?? ''}
              />
            </div>
            <div className="dash-form-group">
              <label className="dash-form-label" htmlFor="sector">Sector</label>
              <input id="sector" name="sector" type="text" className="dash-input" defaultValue={initial?.sector ?? ''} />
            </div>
            <div className="dash-form-group">
              <label className="dash-form-label" htmlFor="industry">Industry</label>
              <input id="industry" name="industry" type="text" className="dash-input" defaultValue={initial?.industry ?? ''} />
            </div>
            <div className="dash-form-group">
              <label className="dash-form-label" htmlFor="country_of_incorporation">Country</label>
              <input id="country_of_incorporation" name="country_of_incorporation" type="text" className="dash-input" defaultValue={initial?.country_of_incorporation ?? ''} />
            </div>
            <div className="dash-form-group">
              <label className="dash-form-label" htmlFor="current_phase">Current Phase</label>
              <input id="current_phase" name="current_phase" type="text" className="dash-input" defaultValue={initial?.current_phase ?? ''} />
            </div>
            <div className="dash-form-group">
              <label className="dash-form-label" htmlFor="date_of_case">
                Date of Case<span className="req">*</span>
              </label>
              <input id="date_of_case" name="date_of_case" type="date" required className="dash-input" defaultValue={initialDate} />
            </div>
            <div className="dash-form-group">
              <label className="dash-form-label" htmlFor="status">Status</label>
              <select id="status" name="status" className="dash-select" defaultValue={initial?.status ?? 'Active'}>
                <option value="Active">Active</option>
                <option value="Not Active">Not Active</option>
              </select>
            </div>
          </div>
        </div>
      </details>

      {/* SECTION 2 — Investment Trigger */}
      <details className="dash-form-section" open={mode === 'edit'} style={{ padding: 0 }}>
        <summary
          style={{
            listStyle: 'none',
            cursor: 'pointer',
            padding: '22px 24px 14px',
            borderBottom: '1px solid var(--line)',
            marginBottom: 18,
          }}
        >
          <SectionHeading number={2} title="Investment Trigger" sub="What event prompted the case?" />
        </summary>
        <div style={{ padding: '0 24px 22px' }}>
          <div className="dash-form-grid">
            <div className="dash-form-group span-all">
              <label className="dash-form-label" htmlFor="event_details">Event Details</label>
              <textarea id="event_details" name="event_details" className="dash-textarea" defaultValue={initial?.event_details ?? ''} />
            </div>
            <div className="dash-form-group span-all">
              <label className="dash-form-label" htmlFor="brand_summary">Brand Summary</label>
              <textarea id="brand_summary" name="brand_summary" className="dash-textarea" defaultValue={initial?.brand_summary ?? ''} />
            </div>
            <div className="dash-form-group">
              <label className="dash-form-label" htmlFor="brand_type">Brand Type</label>
              <input id="brand_type" name="brand_type" type="text" className="dash-input" defaultValue={initial?.brand_type ?? ''} />
            </div>
            <div className="dash-form-group">
              <label className="dash-form-label" htmlFor="impact_of_news">Impact of News</label>
              <input id="impact_of_news" name="impact_of_news" type="text" className="dash-input" defaultValue={initial?.impact_of_news ?? ''} />
            </div>
            <div className="dash-form-group span-all">
              <label className="dash-form-label" htmlFor="initial_market_assessment">Initial Market Assessment</label>
              <textarea id="initial_market_assessment" name="initial_market_assessment" className="dash-textarea" defaultValue={initial?.initial_market_assessment ?? ''} />
            </div>
            <Slider label="Trigger Score" min={1} max={7} value={triggerScore} onChange={setTriggerScore} />
          </div>
        </div>
      </details>

      {/* SECTION 3 — Fundamental Analysis */}
      <details className="dash-form-section" open={mode === 'edit'} style={{ padding: 0 }}>
        <summary
          style={{
            listStyle: 'none',
            cursor: 'pointer',
            padding: '22px 24px 14px',
            borderBottom: '1px solid var(--line)',
            marginBottom: 18,
          }}
        >
          <SectionHeading number={3} title="Fundamental Analysis" sub="Business model, profitability, and quality." />
        </summary>
        <div style={{ padding: '0 24px 22px' }}>
          <div className="dash-form-grid">
            <div className="dash-form-group span-all">
              <label className="dash-form-label" htmlFor="company_fundamentals">Company Fundamentals</label>
              <textarea id="company_fundamentals" name="company_fundamentals" className="dash-textarea" defaultValue={initial?.company_fundamentals ?? ''} />
            </div>
            <div className="dash-form-group span-all">
              <label className="dash-form-label" htmlFor="business_model_explanation">Business Model Explanation</label>
              <textarea id="business_model_explanation" name="business_model_explanation" className="dash-textarea" defaultValue={initial?.business_model_explanation ?? ''} />
            </div>
            <div className="dash-form-group span-all">
              <label className="dash-form-label" htmlFor="key_products_services">Key Products &amp; Services</label>
              <textarea id="key_products_services" name="key_products_services" className="dash-textarea" defaultValue={initial?.key_products_services ?? ''} />
            </div>
            <div className="dash-form-group">
              <label className="dash-form-label" htmlFor="business_model_outlook">Business Model Outlook</label>
              <input id="business_model_outlook" name="business_model_outlook" type="text" className="dash-input" defaultValue={initial?.business_model_outlook ?? ''} />
            </div>
            <div className="dash-form-group">
              <label className="dash-form-label" htmlFor="earnings_quality">Earnings Quality</label>
              <input id="earnings_quality" name="earnings_quality" type="text" className="dash-input" defaultValue={initial?.earnings_quality ?? ''} />
            </div>
            <div className="dash-form-group">
              <label className="dash-form-label" htmlFor="competitive_advantage">Competitive Advantage</label>
              <input id="competitive_advantage" name="competitive_advantage" type="text" className="dash-input" defaultValue={initial?.competitive_advantage ?? ''} />
            </div>
            <div className="dash-form-group">
              <label className="dash-form-label" htmlFor="market_position">Market Position</label>
              <input id="market_position" name="market_position" type="text" className="dash-input" defaultValue={initial?.market_position ?? ''} />
            </div>
            <div className="dash-form-group span-all">
              <label className="dash-form-label" htmlFor="competitive_advantage_defined">Competitive Advantage Defined</label>
              <textarea id="competitive_advantage_defined" name="competitive_advantage_defined" className="dash-textarea" defaultValue={initial?.competitive_advantage_defined ?? ''} />
            </div>
            <Slider label="ESG / Governance Quality Score" min={1} max={10} value={esgScore} onChange={setEsgScore} />
            <div className="dash-form-group span-all">
              <label className="dash-form-label" htmlFor="esg_governance_explanation">ESG / Governance Explanation</label>
              <textarea id="esg_governance_explanation" name="esg_governance_explanation" className="dash-textarea" defaultValue={initial?.esg_governance_explanation ?? ''} />
            </div>
            <div className="dash-form-group">
              <label className="dash-form-label" htmlFor="net_debt_ebitda">Net Debt / EBITDA</label>
              <input id="net_debt_ebitda" name="net_debt_ebitda" type="text" className="dash-input" defaultValue={initial?.net_debt_ebitda ?? ''} />
            </div>
            <div className="dash-form-group">
              <label className="dash-form-label" htmlFor="eps">EPS</label>
              <input id="eps" name="eps" type="text" className="dash-input" defaultValue={initial?.eps ?? ''} />
            </div>
            <div className="dash-form-group">
              <label className="dash-form-label" htmlFor="operating_margin">Operating Margin</label>
              <input id="operating_margin" name="operating_margin" type="text" className="dash-input" defaultValue={initial?.operating_margin ?? ''} />
            </div>
            <div className="dash-form-group">
              <label className="dash-form-label" htmlFor="layered_fcf_ttm">Layered FCF TTM</label>
              <input id="layered_fcf_ttm" name="layered_fcf_ttm" type="text" className="dash-input" defaultValue={initial?.layered_fcf_ttm ?? ''} />
            </div>
            <Slider label="Fundamental Score" min={1} max={10} value={fundamentalScore} onChange={setFundamentalScore} />
          </div>
        </div>
      </details>

      {/* SECTION 4 — Valuation */}
      <details className="dash-form-section" open={mode === 'edit'} style={{ padding: 0 }}>
        <summary
          style={{
            listStyle: 'none',
            cursor: 'pointer',
            padding: '22px 24px 14px',
            borderBottom: '1px solid var(--line)',
            marginBottom: 18,
          }}
        >
          <SectionHeading number={4} title="Valuation Analysis" sub="Multiples, peers, and target." />
        </summary>
        <div style={{ padding: '0 24px 22px' }}>
          <div className="dash-form-grid">
            <div className="dash-form-group span-all">
              <label className="dash-form-label" htmlFor="valuation_metrics_peers">Valuation Metrics vs Peers</label>
              <textarea id="valuation_metrics_peers" name="valuation_metrics_peers" className="dash-textarea" defaultValue={initial?.valuation_metrics_peers ?? ''} />
            </div>
            <div className="dash-form-group">
              <label className="dash-form-label" htmlFor="current_pe">Current P/E</label>
              <input id="current_pe" name="current_pe" type="number" step="0.01" className="dash-input" defaultValue={initial?.current_pe ?? ''} />
            </div>
            <div className="dash-form-group">
              <label className="dash-form-label" htmlFor="forward_pe">Forward P/E</label>
              <input id="forward_pe" name="forward_pe" type="number" step="0.01" className="dash-input" defaultValue={initial?.forward_pe ?? ''} />
            </div>
            <div className="dash-form-group">
              <label className="dash-form-label" htmlFor="ev_ebitda">EV / EBITDA</label>
              <input id="ev_ebitda" name="ev_ebitda" type="number" step="0.01" className="dash-input" defaultValue={initial?.ev_ebitda ?? ''} />
            </div>
            <div className="dash-form-group">
              <label className="dash-form-label" htmlFor="analyst_1y_price_target">Analyst 1Y Target</label>
              <input id="analyst_1y_price_target" name="analyst_1y_price_target" type="number" step="0.01" className="dash-input" defaultValue={initial?.analyst_1y_price_target ?? ''} />
            </div>
            <div className="dash-form-group">
              <label className="dash-form-label" htmlFor="top_3_competitors">Top 3 Competitors</label>
              <input id="top_3_competitors" name="top_3_competitors" type="text" className="dash-input" defaultValue={initial?.top_3_competitors ?? ''} />
            </div>
            <div className="dash-form-group span-all">
              <label className="dash-form-label" htmlFor="current_vs_historical_multiples">Current vs Historical Multiples</label>
              <textarea id="current_vs_historical_multiples" name="current_vs_historical_multiples" className="dash-textarea" defaultValue={initial?.current_vs_historical_multiples ?? ''} />
            </div>
            <div className="dash-form-group span-all">
              <label className="dash-form-label" htmlFor="prior_valuation_assessment">Prior Valuation Assessment</label>
              <textarea id="prior_valuation_assessment" name="prior_valuation_assessment" className="dash-textarea" defaultValue={initial?.prior_valuation_assessment ?? ''} />
            </div>
            <Slider label="Valuation Score" min={1} max={8} value={valuationScore} onChange={setValuationScore} />
          </div>
        </div>
      </details>

      {/* SECTION 5 — Conviction & Risks */}
      <details className="dash-form-section" open={mode === 'edit'} style={{ padding: 0 }}>
        <summary
          style={{
            listStyle: 'none',
            cursor: 'pointer',
            padding: '22px 24px 14px',
            borderBottom: '1px solid var(--line)',
            marginBottom: 18,
          }}
        >
          <SectionHeading number={5} title="Conviction &amp; Risks" sub="What could go right; what could go wrong." />
        </summary>
        <div style={{ padding: '0 24px 22px' }}>
          <div className="dash-form-grid">
            {[1, 2, 3, 4].map((n) => (
              <div key={`risk-${n}`} className="dash-form-group">
                <label className="dash-form-label" htmlFor={`risk_${n}`}>Risk {n}</label>
                <input id={`risk_${n}`} name={`risk_${n}`} type="text" className="dash-input" defaultValue={initial?.risks?.[n - 1] ?? ''} />
              </div>
            ))}
            {[1, 2, 3, 4].map((n) => (
              <div key={`catalyst-${n}`} className="dash-form-group">
                <label className="dash-form-label" htmlFor={`catalyst_${n}`}>Catalyst {n}</label>
                <input id={`catalyst_${n}`} name={`catalyst_${n}`} type="text" className="dash-input" defaultValue={initial?.catalysts?.[n - 1] ?? ''} />
              </div>
            ))}
            <Slider label="Conviction Score" min={1} max={10} value={convictionScore} onChange={setConvictionScore} />
          </div>
        </div>
      </details>

      {/* SECTION 6 — Technical Analysis */}
      <details className="dash-form-section" open={mode === 'edit'} style={{ padding: 0 }}>
        <summary
          style={{
            listStyle: 'none',
            cursor: 'pointer',
            padding: '22px 24px 14px',
            borderBottom: '1px solid var(--line)',
            marginBottom: 18,
          }}
        >
          <SectionHeading number={6} title="Technical Analysis" sub="Trend and chart context." />
        </summary>
        <div style={{ padding: '0 24px 22px' }}>
          <div className="dash-form-grid">
            <div className="dash-form-group span-all">
              <label className="dash-form-label" htmlFor="primary_trend">Primary Trend</label>
              <textarea id="primary_trend" name="primary_trend" className="dash-textarea" defaultValue={initial?.primary_trend ?? ''} />
            </div>
            <div className="dash-form-group span-all">
              <label className="dash-form-label" htmlFor="overall_chart_assessment">Overall Chart Assessment</label>
              <textarea id="overall_chart_assessment" name="overall_chart_assessment" className="dash-textarea" defaultValue={initial?.overall_chart_assessment ?? ''} />
            </div>
            <div className="dash-form-group">
              <label className="dash-form-label" htmlFor="tradingview_ta_score">TradingView TA Score</label>
              <input id="tradingview_ta_score" name="tradingview_ta_score" type="number" step="0.01" className="dash-input" defaultValue={initial?.tradingview_ta_score ?? ''} />
            </div>
            <div className="dash-form-group">
              <label className="dash-form-label" htmlFor="week_52_low">52-Week Low</label>
              <input id="week_52_low" name="week_52_low" type="number" step="0.01" className="dash-input" defaultValue={initial?.week_52_low ?? ''} />
            </div>
            <div className="dash-form-group">
              <label className="dash-form-label" htmlFor="week_52_high">52-Week High</label>
              <input id="week_52_high" name="week_52_high" type="number" step="0.01" className="dash-input" defaultValue={initial?.week_52_high ?? ''} />
            </div>
            <Slider label="Technical Score" min={1} max={6} value={technicalScore} onChange={setTechnicalScore} />
          </div>
        </div>
      </details>

      {/* SECTION 7 — Execution Plan */}
      <details className="dash-form-section" open={mode === 'edit'} style={{ padding: 0 }}>
        <summary
          style={{
            listStyle: 'none',
            cursor: 'pointer',
            padding: '22px 24px 14px',
            borderBottom: '1px solid var(--line)',
            marginBottom: 18,
          }}
        >
          <SectionHeading number={7} title="Execution Plan" sub="Entry, exits, leverage, and re-match." />
        </summary>
        <div style={{ padding: '0 24px 22px' }}>
          <div className="dash-form-grid">
            <div className="dash-form-group">
              <label className="dash-form-label" htmlFor="entry_price_target">Entry Price Target</label>
              <input
                id="entry_price_target"
                name="entry_price_target"
                type="number"
                step="0.01"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className="dash-input"
              />
            </div>
            <div className="dash-form-group">
              <label className="dash-form-label" htmlFor="take_profit">Take Profit</label>
              <input
                id="take_profit"
                name="take_profit"
                type="number"
                step="0.01"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                className="dash-input"
              />
            </div>
            <div className="dash-form-group">
              <label className="dash-form-label" htmlFor="stop_loss">Stop Loss</label>
              <input
                id="stop_loss"
                name="stop_loss"
                type="number"
                step="0.01"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                className="dash-input"
              />
            </div>
            <div className="dash-form-group">
              <label className="dash-form-label" htmlFor="leverage">Leverage</label>
              <input id="leverage" name="leverage" type="number" step="0.1" className="dash-input" defaultValue={initial?.leverage ?? ''} />
            </div>
            <div className="dash-form-group">
              <label className="dash-form-label">Risk / Reward (auto)</label>
              <div
                className="dash-input"
                aria-readonly
                style={{
                  background: 'var(--navy)',
                  color: rrr ? 'var(--dash-green)' : 'var(--ink-dim)',
                  fontFamily: 'var(--serif)',
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'default',
                }}
              >
                {rrr ? `${rrr} : 1` : 'Enter entry, TP & SL'}
              </div>
            </div>
            <div className="dash-form-group">
              <label className="dash-form-label" htmlFor="expected_holding_period_months">Holding Period (months)</label>
              <input id="expected_holding_period_months" name="expected_holding_period_months" type="number" step="1" className="dash-input" defaultValue={initial?.expected_holding_period_months ?? ''} />
            </div>
            <div className="dash-form-group span-all" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <label
                className="dash-toggle"
                style={{ flexShrink: 0 }}
                aria-label="Re-match"
                htmlFor="rematch"
              >
                <input
                  id="rematch"
                  type="checkbox"
                  checked={rematch}
                  onChange={(e) => setRematch(e.target.checked)}
                />
                <span className="dash-toggle-slider" />
              </label>
              <span style={{ color: 'var(--ink)', fontSize: 13, fontFamily: 'var(--sans)' }}>Re-match</span>
              <span style={{ color: 'var(--ink-dim)', fontSize: 11 }}>Available for re-entry per playbook</span>
            </div>
            {!rematch && (
              <div className="dash-form-group span-all">
                <label className="dash-form-label" htmlFor="why_not_rematch">Why Not Re-match</label>
                <input id="why_not_rematch" name="why_not_rematch" type="text" className="dash-input" defaultValue={initial?.why_not_rematch ?? ''} />
              </div>
            )}
          </div>
        </div>
      </details>

      {/* SECTION 8 — Final Score */}
      <details className="dash-form-section" open style={{ padding: 0 }}>
        <summary
          style={{
            listStyle: 'none',
            cursor: 'pointer',
            padding: '22px 24px 14px',
            borderBottom: '1px solid var(--line)',
            marginBottom: 18,
          }}
        >
          <SectionHeading number={8} title="Final Score" sub="Aggregated rating and confidence." />
        </summary>
        <div style={{ padding: '0 24px 22px' }}>
          <div
            style={{
              display: 'flex',
              gap: 24,
              flexWrap: 'wrap',
              alignItems: 'center',
              padding: '18px 20px',
              border: '1px solid var(--gold-line)',
              background: 'rgba(201,169,110,0.04)',
              borderRadius: 2,
              marginBottom: 18,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-dim)',
                  fontWeight: 500,
                }}
              >
                Total Score (auto)
              </div>
              <div
                style={{
                  fontFamily: 'var(--serif)',
                  fontSize: 'clamp(36px, 6vw, 56px)',
                  fontWeight: 600,
                  color: totalColor,
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                }}
              >
                {totalScore}
                <span style={{ color: 'var(--ink-dim)', fontSize: '0.4em', marginLeft: 4 }}>/ 48</span>
              </div>
              <div style={{ color: 'var(--ink-dim)', fontSize: 11, letterSpacing: '0.02em' }}>
                {triggerScore} + {fundamentalScore} + {valuationScore} + {convictionScore} + {technicalScore}
              </div>
            </div>
            {totalScore >= 35 && (
              <span
                className="status-badge active"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                <IconTrendingUp width={11} height={11} />
                Top Pick
              </span>
            )}
          </div>

          <Slider label="Confidence Score" min={1} max={10} value={confidenceScore} onChange={setConfidenceScore} />

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 22 }}>
            <button
              type="submit"
              disabled={loading}
              className="dash-btn btn-gold btn-lg"
            >
              {loading ? (
                'Saving…'
              ) : (
                <>
                  <IconCheck width={14} height={14} />
                  {mode === 'edit' ? 'Save Changes' : 'Create Case'}
                </>
              )}
            </button>
            <Link
              href={mode === 'edit' && initial?.id ? `/admin/cases/${initial.id}` : '/admin/cases'}
              className="dash-btn btn-ghost btn-lg"
            >
              <IconArrowLeft width={14} height={14} />
              Cancel
            </Link>
          </div>
        </div>
      </details>
    </form>
  )
}
