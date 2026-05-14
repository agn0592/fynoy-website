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

export async function POST(request: NextRequest) {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check admin role
  const serviceClient = getServiceClient()
  const { data: profile } = await serviceClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Fetch portfolio data
  const [
    { data: openPositionsRaw },
    { data: closedTradesRaw },
    { data: snapshotsRaw },
    { data: casesRaw },
  ] = await Promise.all([
    serviceClient.from('open_positions').select('trading_id, symbol, current_price, position_size_actual, unrealized_pnl, unrealized_pnl_pct, pct_of_nav'),
    serviceClient
      .from('closed_trades')
      .select('symbol, entry_date, exit_date, realized_pnl, realized_pnl_pct')
      .order('exit_date', { ascending: false })
      .limit(10),
    serviceClient
      .from('portfolio_snapshots')
      .select('snapshot_date, total_nav, benchmark_value')
      .order('snapshot_date', { ascending: false })
      .limit(2),
    serviceClient.from('cases').select('trading_id, sector'),
  ])

  const openPositions = openPositionsRaw ?? []
  const closedTrades = closedTradesRaw ?? []
  const snapshots = snapshotsRaw ?? []
  const cases = casesRaw ?? []

  // Calculate portfolio metrics
  const totalNav = openPositions.reduce(
    (sum, p) => sum + p.current_price * p.position_size_actual,
    0
  )

  const ytdStart = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10)
  const ytdPnl = (closedTradesRaw ?? [])
    .filter((t) => t.exit_date >= ytdStart)
    .reduce((sum, t) => sum + (t.realized_pnl ?? 0), 0)

  // Benchmark YTD from snapshots
  const latestSnapshot = snapshots[0]
  const earliestSnapshot = snapshots[snapshots.length - 1]
  const benchmarkYtd =
    latestSnapshot && earliestSnapshot && earliestSnapshot.benchmark_value > 0
      ? (((latestSnapshot.benchmark_value - earliestSnapshot.benchmark_value) / earliestSnapshot.benchmark_value) * 100).toFixed(2) + '%'
      : 'N/A'

  // Sector allocation
  const caseMap = new Map<string, string>(cases.map((c) => [c.trading_id, c.sector ?? 'Unknown']))
  const sectorAllocation: Record<string, number> = {}
  for (const pos of openPositions) {
    const sector = pos.trading_id ? (caseMap.get(pos.trading_id) ?? 'Unknown') : 'Unknown'
    const value = pos.current_price * pos.position_size_actual
    sectorAllocation[sector] = (sectorAllocation[sector] ?? 0) + value
  }

  const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })

  // Call Claude
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 1024,
    system: 'You are a professional portfolio analyst for Fynoy Capital, a proprietary trading firm. Write in an institutional, disciplined tone. Be concise and specific.',
    messages: [
      {
        role: 'user',
        content: `Portfolio date: ${date}\nOpen positions: ${JSON.stringify(openPositions)}\nTotal NAV: €${totalNav.toFixed(2)}\nYTD PnL: €${ytdPnl.toFixed(2)}\nBenchmark (FTSE All-World) YTD: ${benchmarkYtd}\nSector allocation: ${JSON.stringify(sectorAllocation)}\nRecent closed trades: ${JSON.stringify(closedTrades)}\n\nWrite a concise portfolio commentary covering:\n1. Overall portfolio performance vs benchmark\n2. Key position highlights\n3. Risk observations\n4. Outlook based on current positioning`,
      },
    ],
  })

  const content = message.content[0].type === 'text' ? message.content[0].text : ''

  // Save to commentary table
  const { error: insertError } = await serviceClient
    .from('commentary')
    .insert([{ content }])

  if (insertError) {
    return Response.json({ error: insertError.message }, { status: 500 })
  }

  return Response.json({ content })
}
