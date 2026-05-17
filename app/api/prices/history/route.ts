import { NextRequest } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// European tickers traded on Xetra etc. need a Yahoo suffix.
const YAHOO_SUFFIX: Record<string, string> = {
  RHM: 'RHM.DE',
}

function toYahooSymbol(symbol: string): string {
  return YAHOO_SUFFIX[symbol] ?? symbol
}

interface PricePoint { date: string; close: number }

interface YahooChartResponse {
  chart?: {
    result?: Array<{
      timestamp?: number[]
      indicators?: {
        quote?: Array<{
          close?: (number | null)[]
        }>
      }
    }>
  }
}

async function fetchFromYahoo(symbol: string, fromIso: string): Promise<PricePoint[]> {
  const fromTs = Math.floor(new Date(fromIso).getTime() / 1000)
  const toTs   = Math.floor(Date.now() / 1000)
  if (!Number.isFinite(fromTs) || fromTs <= 0) return []

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${toYahooSymbol(symbol)}?interval=1d&period1=${fromTs}&period2=${toTs}`

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      // Yahoo sometimes hangs — short timeout via AbortController
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return []

    const data = await res.json() as YahooChartResponse
    const result = data.chart?.result?.[0]
    const timestamps = result?.timestamp ?? []
    const closes = result?.indicators?.quote?.[0]?.close ?? []

    const out: PricePoint[] = []
    for (let i = 0; i < timestamps.length; i++) {
      const close = closes[i]
      if (close == null || !Number.isFinite(close)) continue
      out.push({
        date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
        close,
      })
    }
    return out
  } catch {
    return []
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')
  const from = searchParams.get('from')

  if (!symbol || !from) {
    return Response.json({ error: 'symbol and from are required' }, { status: 400 })
  }

  const service = getServiceClient()

  // 1. Try cached data
  const { data: cached } = await service
    .from('stock_prices')
    .select('date, close')
    .eq('symbol', symbol)
    .gte('date', from)
    .order('date', { ascending: true })

  // If we have at least 2 cached points and the newest cached point is recent (<= 2 days old), use the cache.
  const todayIso = new Date().toISOString().split('T')[0]
  const yesterdayMs = Date.now() - 2 * 24 * 60 * 60 * 1000
  const latestCached = cached?.[cached.length - 1]?.date

  if (cached && cached.length >= 2 && latestCached && new Date(latestCached).getTime() >= yesterdayMs) {
    return Response.json({ prices: cached, source: 'cache' })
  }

  // 2. Fetch from Yahoo
  const fresh = await fetchFromYahoo(symbol, from)
  if (fresh.length === 0) {
    // Return whatever was cached even if stale
    return Response.json({ prices: cached ?? [], source: 'cache-stale' })
  }

  // 3. Upsert into the cache (fire and forget; don't block the response)
  const rows = fresh.map(p => ({ symbol, date: p.date, close: p.close }))
  void service.from('stock_prices').upsert(rows, { onConflict: 'symbol,date' }).then(() => {}, () => {})

  // Optionally include today's price if we have a current_price on open_positions
  const lastDate = fresh[fresh.length - 1]?.date
  if (lastDate && lastDate < todayIso) {
    const { data: pos } = await service
      .from('open_positions')
      .select('current_price, last_synced_at')
      .eq('symbol', symbol)
      .maybeSingle()
    if (pos?.current_price) {
      fresh.push({ date: todayIso, close: Number(pos.current_price) })
    }
  }

  return Response.json({ prices: fresh, source: 'yahoo' })
}
