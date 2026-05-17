import { NextRequest } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function requireAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

interface CaseRow {
  trading_id: string
  ticker: string | null
  company_name: string | null
  sector: string | null
  status: string | null
  event_summary: string | null
  event_details: string | null
  initial_market_assessment: string | null
  catalyst_1: string | null
  catalyst_2: string | null
  catalyst_3: string | null
  catalyst_4: string | null
  risk_1: string | null
  risk_2: string | null
  risk_3: string | null
  risk_4: string | null
  competitive_advantage_defined: string | null
  trigger_score: number | null
  fundamental_score: number | null
  valuation_score: number | null
  technical_score: number | null
  total_score: number | null
  conviction_score: number | null
  expected_holding_period_months: number | null
  risk_reward_ratio: number | null
  ai_summary: string | null
}

function buildPrompt(c: CaseRow, opts: { realizedPnlPct?: number | null }) {
  const catalysts = [c.catalyst_1, c.catalyst_2, c.catalyst_3, c.catalyst_4].filter(Boolean).join('\n- ')
  const risks     = [c.risk_1, c.risk_2, c.risk_3, c.risk_4].filter(Boolean).join('\n- ')

  const scores = [
    `Trigger ${c.trigger_score ?? '?'}/7`,
    `Fundamental ${c.fundamental_score ?? '?'}/10`,
    `Valuation ${c.valuation_score ?? '?'}/8`,
    `Technical ${c.technical_score ?? '?'}/6`,
    `Total ${c.total_score ?? '?'}`,
    `Conviction ${c.conviction_score ?? '?'}/10`,
  ].join(' | ')

  const closedSection = opts.realizedPnlPct != null ? `

## Post-trade Reflectie
[Gegenereerd op basis van: entry thesis vs werkelijk resultaat van ${opts.realizedPnlPct >= 0 ? '+' : ''}${opts.realizedPnlPct.toFixed(2)}%. Wat klopte, wat niet? Maximaal 2-3 zinnen.]
` : ''

  return `Je bent een portfolio analist bij Fynoy Capital. Schrijf een beknopte investment summary voor de volgende positie. Gebruik markdown met duidelijke headers. Maximaal 350 woorden. Geen absolute prijzen of bedragen noemen — alleen percentages en kwalitatieve beschrijvingen. Schrijf in het Nederlands.

Bedrijf: ${c.company_name ?? c.ticker ?? c.trading_id} (${c.ticker ?? ''})
Sector: ${c.sector ?? 'onbekend'}
Status: ${c.status ?? 'onbekend'}

Event / aanleiding:
${c.event_summary ?? c.event_details ?? 'n/a'}

Investment thesis:
${c.initial_market_assessment ?? 'n/a'}

Catalysts:
- ${catalysts || 'n/a'}

Risico's:
- ${risks || 'n/a'}

Competitief voordeel:
${c.competitive_advantage_defined ?? 'n/a'}

Scores: ${scores}
Verwachte houdperiode: ${c.expected_holding_period_months ?? '?'} maanden
Risk/Reward: ${c.risk_reward_ratio ?? '?'}

Schrijf de summary in deze structuur:
## Waarom gekocht
[2-3 zinnen: event + thesis + waarom nu]

## Belangrijkste catalysts
[2-3 bullets]

## Risico's
[2-3 bullets]

## Conviction
[1-2 zinnen over scores en verwachting]${closedSection}`
}

async function generateAndCacheSummary(
  service: ReturnType<typeof getServiceClient>,
  caseData: CaseRow,
  realizedPnlPct?: number | null,
): Promise<string> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 700,
    messages: [{ role: 'user', content: buildPrompt(caseData, { realizedPnlPct: realizedPnlPct ?? null }) }],
  })

  const summary = message.content[0]?.type === 'text' ? message.content[0].text : ''

  // Cache only when there is no post-trade reflection (those depend on realized pnl)
  if (summary && realizedPnlPct == null) {
    await service.from('cases').update({ ai_summary: summary }).eq('trading_id', caseData.trading_id)
  }

  return summary
}

const FIELDS = `trading_id, ticker, company_name, sector, status, event_summary, event_details, initial_market_assessment, catalyst_1, catalyst_2, catalyst_3, catalyst_4, risk_1, risk_2, risk_3, risk_4, competitive_advantage_defined, trigger_score, fundamental_score, valuation_score, technical_score, total_score, conviction_score, expected_holding_period_months, risk_reward_ratio, ai_summary`

export async function GET(request: NextRequest) {
  const user = await requireAuthUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const tradingId = searchParams.get('trading_id')
  if (!tradingId) return Response.json({ error: 'trading_id required' }, { status: 400 })

  const service = getServiceClient()
  const { data: caseData } = await service
    .from('cases')
    .select(FIELDS)
    .eq('trading_id', tradingId)
    .single<CaseRow>()

  if (!caseData) return Response.json({ error: 'Case not found' }, { status: 404 })

  if (caseData.ai_summary) {
    return Response.json({ summary: caseData.ai_summary, cached: true })
  }

  const summary = await generateAndCacheSummary(service, caseData)
  return Response.json({ summary, cached: false })
}

export async function POST(request: NextRequest) {
  const user = await requireAuthUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null) as { trading_id?: string; realized_pnl_pct?: number } | null
  if (!body?.trading_id) return Response.json({ error: 'trading_id required' }, { status: 400 })

  const service = getServiceClient()
  const { data: caseData } = await service
    .from('cases')
    .select(FIELDS)
    .eq('trading_id', body.trading_id)
    .single<CaseRow>()

  if (!caseData) return Response.json({ error: 'Case not found' }, { status: 404 })

  // For closed trades, always regenerate with the post-trade reflection (don't cache)
  const summary = await generateAndCacheSummary(service, caseData, body.realized_pnl_pct ?? null)
  return Response.json({ summary, cached: false })
}
