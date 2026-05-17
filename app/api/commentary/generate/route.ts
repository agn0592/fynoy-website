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

async function authorize(request: NextRequest): Promise<{ ok: boolean; status?: number; reason?: string }> {
  // Scheduled-trigger path: shared secret header
  const headerSecret = request.headers.get('x-sync-secret')
  const expected = process.env.IBKR_SYNC_SECRET
  if (expected && headerSecret && headerSecret === expected) return { ok: true }

  // Admin path: session cookie + role check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, status: 401, reason: 'Unauthorized' }

  const serviceClient = getServiceClient()
  const { data: profile } = await serviceClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') return { ok: false, status: 403, reason: 'Forbidden' }

  return { ok: true }
}

export async function POST(request: NextRequest) {
  const auth = await authorize(request)
  if (!auth.ok) return Response.json({ error: auth.reason }, { status: auth.status })

  const serviceClient = getServiceClient()

  const [
    { data: openPositionsRaw },
    { data: closedTradesRaw },
    { data: snapshotsRaw },
    { data: casesRaw },
  ] = await Promise.all([
    serviceClient.from('open_positions').select('trading_id, symbol, current_price, position_size_actual, unrealized_pnl, unrealized_pnl_pct, pct_of_nav, entry_price_actual'),
    serviceClient
      .from('closed_trades')
      .select('symbol, entry_date, exit_date, realized_pnl_pct')
      .order('exit_date', { ascending: false })
      .limit(10),
    serviceClient
      .from('portfolio_snapshots')
      .select('snapshot_date, benchmark_value, daily_twr')
      .order('snapshot_date', { ascending: true }),
    serviceClient.from('cases').select('trading_id, sector'),
  ])

  const openPositions = openPositionsRaw ?? []
  const closedTrades = closedTradesRaw ?? []
  const snapshots = snapshotsRaw ?? []
  const cases = casesRaw ?? []

  // TWR since inception (chain-multiply daily_twr in %)
  let twrFactor = 1
  for (const s of snapshots) twrFactor *= 1 + (s.daily_twr ?? 0) / 100
  const twrPct = (twrFactor - 1) * 100

  // VWCE return since inception
  const firstBenchmark = snapshots.find(s => (s.benchmark_value ?? 0) > 0)
  const lastBenchmark = [...snapshots].reverse().find(s => (s.benchmark_value ?? 0) > 0)
  const vwcePct = firstBenchmark && lastBenchmark && firstBenchmark !== lastBenchmark
    ? ((lastBenchmark.benchmark_value - firstBenchmark.benchmark_value) / firstBenchmark.benchmark_value) * 100
    : 0
  const alphaPct = twrPct - vwcePct

  // Sector allocation
  const caseMap = new Map<string, string>(cases.map((c) => [c.trading_id, c.sector ?? 'Unknown']))
  const totalNav = openPositions.reduce((s, p) => s + p.current_price * p.position_size_actual, 0)
  const sectorAllocation: Record<string, number> = {}
  for (const pos of openPositions) {
    const sector = pos.trading_id ? (caseMap.get(pos.trading_id) ?? 'Unknown') : 'Unknown'
    const value = pos.current_price * pos.position_size_actual
    sectorAllocation[sector] = (sectorAllocation[sector] ?? 0) + value
  }
  const sectorPct = Object.entries(sectorAllocation)
    .map(([sector, value]) => `${sector}: ${totalNav > 0 ? ((value / totalNav) * 100).toFixed(1) : '0.0'}%`)
    .join(', ')

  const positionsList = openPositions
    .map(p => `${p.symbol} (weight ${(p.pct_of_nav ?? 0).toFixed(1)}%, unrealized ${(p.unrealized_pnl_pct ?? 0) >= 0 ? '+' : ''}${(p.unrealized_pnl_pct ?? 0).toFixed(2)}%)`)
    .join('; ')

  const closedList = closedTrades
    .map(t => `${t.symbol}: ${(t.realized_pnl_pct ?? 0) >= 0 ? '+' : ''}${(t.realized_pnl_pct ?? 0).toFixed(2)}%`)
    .join('; ')

  const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })

  const systemPrompt = `You are the lead portfolio analyst at Fynoy Capital, a transparent investment research platform that invests its own capital and shares every trade and reasoning in real-time. Write in a professional, institutional tone — concise, specific, no filler. Always respond in structured markdown with clear section headers. Never use phrases like "as of the reporting date" or generic disclaimers. Be direct and analytical.`

  const userPrompt = `Write today's portfolio commentary for Fynoy Capital. Use this exact structure:

## Performance Overview
[2-3 sentences: portfolio TWR vs VWCE benchmark, alpha/underperformance, context]

## Position Highlights
[For each open position with >5% move since entry: symbol, return %, brief thesis update in 1 sentence]

## Risk Observations
[3-4 bullet points: concentration risk, sector exposure, any stop-loss proximity, macro factors]

## Outlook & Next Actions
[2-3 sentences: what to watch, any positions near take-profit or stop-loss, general positioning]

---
*Generated: ${date} | Portfolio TWR: ${twrPct.toFixed(2)}% | vs VWCE: ${alphaPct >= 0 ? '+' : ''}${alphaPct.toFixed(2)}%*

Data:
- Date: ${date}
- Open positions: ${positionsList || 'none'}
- Portfolio TWR since inception: ${twrPct.toFixed(2)}%
- VWCE benchmark return: ${vwcePct.toFixed(2)}%
- Alpha: ${alphaPct >= 0 ? '+' : ''}${alphaPct.toFixed(2)}%
- Sector allocation: ${sectorPct || 'n/a'}
- Recent closed trades: ${closedList || 'none'}`

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 1500,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const content = message.content[0].type === 'text' ? message.content[0].text : ''

  const { error: insertError } = await serviceClient
    .from('commentary')
    .insert([{ content }])

  if (insertError) {
    return Response.json({ error: insertError.message }, { status: 500 })
  }

  return Response.json({ content })
}
