import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 60

async function fetchVwceHistory(rangeDays: number): Promise<Map<string, number>> {
  const result = new Map<string, number>()
  const rangeParam =
    rangeDays <= 30 ? '1mo' :
    rangeDays <= 90 ? '3mo' :
    rangeDays <= 180 ? '6mo' :
    rangeDays <= 365 ? '1y' : '2y'

  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/VWCE.DE?interval=1d&range=${rangeParam}`,
    { headers: { 'User-Agent': 'Mozilla/5.0' } }
  )
  if (!res.ok) throw new Error(`Yahoo Finance returned ${res.status}`)

  const data = await res.json()
  const chartResult = data?.chart?.result?.[0]
  const timestamps: number[] = chartResult?.timestamp ?? []
  const closes: number[] = chartResult?.indicators?.quote?.[0]?.close ?? []

  for (let i = 0; i < timestamps.length; i++) {
    if (!timestamps[i] || !closes[i]) continue
    const date = new Date(timestamps[i] * 1000).toISOString().split('T')[0]
    result.set(date, closes[i])
  }

  return result
}

export async function POST(request: NextRequest) {
  const syncSecret = process.env.IBKR_SYNC_SECRET
  const headerSecret = request.headers.get('x-sync-secret')

  if (!syncSecret || headerSecret !== syncSecret) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Find all snapshots missing a benchmark value
    const { data: missing, error: fetchErr } = await supabase
      .from('portfolio_snapshots')
      .select('snapshot_date')
      .or('benchmark_value.is.null,benchmark_value.eq.0')
      .order('snapshot_date', { ascending: true })

    if (fetchErr) throw new Error(fetchErr.message)

    if (!missing || missing.length === 0) {
      return Response.json({ success: true, updated: 0, message: 'All snapshots already have benchmark values' })
    }

    const oldestDate = missing[0].snapshot_date as string
    const ageDays = Math.ceil((Date.now() - new Date(oldestDate).getTime()) / 86_400_000)

    const history = await fetchVwceHistory(ageDays + 5)

    const updates = missing
      .map(row => ({
        snapshot_date: row.snapshot_date as string,
        benchmark_value: history.get(row.snapshot_date as string),
      }))
      .filter((r): r is { snapshot_date: string; benchmark_value: number } => !!r.benchmark_value)

    if (updates.length === 0) {
      return Response.json({
        success: false,
        updated: 0,
        missing: missing.length,
        message: 'Yahoo Finance returned no matching dates. Check the range or try again later.',
      })
    }

    const { error: upsertErr } = await supabase
      .from('portfolio_snapshots')
      .upsert(updates, { onConflict: 'snapshot_date' })

    if (upsertErr) throw new Error(upsertErr.message)

    return Response.json({
      success: true,
      updated: updates.length,
      skipped: missing.length - updates.length,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('backfill-benchmark error:', message)
    return Response.json({ error: message }, { status: 500 })
  }
}
