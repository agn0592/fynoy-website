import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 60

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

    const today = new Date().toISOString().split('T')[0]

    const { data: missing, error: fetchErr } = await supabase
      .from('portfolio_snapshots')
      .select('snapshot_date')
      .or(`benchmark_value.is.null,benchmark_value.eq.0,snapshot_date.eq.${today}`)
      .order('snapshot_date', { ascending: true })

    if (fetchErr) throw new Error(fetchErr.message)
    if (!missing || missing.length === 0) {
      return Response.json({ success: true, updated: 0, message: 'Niets te updaten' })
    }

    const oldestDate = missing[0].snapshot_date as string
    const ageDays = Math.ceil((Date.now() - new Date(oldestDate).getTime()) / 86_400_000)
    const rangeParam =
      ageDays <= 30 ? '1mo' :
      ageDays <= 90 ? '3mo' :
      ageDays <= 180 ? '6mo' :
      ageDays <= 365 ? '1y' : '2y'

    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/VWCE.DE?interval=1d&range=${rangeParam}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    )
    if (!res.ok) throw new Error(`Yahoo Finance: ${res.status}`)

    const data = await res.json()
    const chartResult = data?.chart?.result?.[0]
    const timestamps: number[] = chartResult?.timestamp ?? []
    const closes: number[] = chartResult?.indicators?.quote?.[0]?.close ?? []

    // Build sorted list of known trading-day prices
    const sortedDates: { date: string; price: number }[] = []
    for (let i = 0; i < timestamps.length; i++) {
      if (!timestamps[i] || !closes[i]) continue
      const date = new Date(timestamps[i] * 1000).toISOString().split('T')[0]
      sortedDates.push({ date, price: closes[i] })
    }
    sortedDates.sort((a, b) => a.date.localeCompare(b.date))

    const history = new Map(sortedDates.map(d => [d.date, d.price]))

    // For dates with no Yahoo Finance data (holidays), use the previous trading day's price
    function resolvePrice(date: string): number | undefined {
      if (history.has(date)) return history.get(date)
      // Walk back up to 5 days to find a previous trading day
      const d = new Date(date)
      for (let i = 1; i <= 5; i++) {
        d.setDate(d.getDate() - 1)
        const prev = d.toISOString().split('T')[0]
        if (history.has(prev)) return history.get(prev)
      }
      return undefined
    }

    const updates = missing
      .map(row => ({
        snapshot_date: row.snapshot_date as string,
        benchmark_value: resolvePrice(row.snapshot_date as string),
      }))
      .filter((r): r is { snapshot_date: string; benchmark_value: number } => !!r.benchmark_value)

    if (updates.length === 0) {
      return Response.json({
        success: false,
        updated: 0,
        missing: missing.length,
        message: 'Geen overeenkomende datums in Yahoo Finance',
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
