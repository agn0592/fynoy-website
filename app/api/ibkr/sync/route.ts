import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ── helpers ──────────────────────────────────────────────────────────────────

function parseXmlAttributes(
  xml: string,
  tagName: string
): Record<string, string>[] {
  const results: Record<string, string>[] = []
  const tagRegex = new RegExp(`<${tagName}\\s([^>]+?)\\s*/?>`, 'g')
  const attrRegex = /(\w+)="([^"]*)"/g
  let tagMatch
  while ((tagMatch = tagRegex.exec(xml)) !== null) {
    const attrs: Record<string, string> = {}
    let attrMatch
    // Reset lastIndex on the shared regex before each inner loop
    attrRegex.lastIndex = 0
    while ((attrMatch = attrRegex.exec(tagMatch[1])) !== null) {
      attrs[attrMatch[1]] = attrMatch[2]
    }
    results.push(attrs)
  }
  return results
}

function extractTag(xml: string, tagName: string): string {
  const match = xml.match(new RegExp(`<${tagName}>([^<]*)</${tagName}>`))
  return match ? match[1] : ''
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ── IBKR Flex fetch ──────────────────────────────────────────────────────────

async function fetchIbkrXml(): Promise<string> {
  const token = process.env.IBKR_FLEX_TOKEN
  const queryId = process.env.IBKR_FLEX_QUERY_ID

  if (!token || !queryId) {
    throw new Error('IBKR_FLEX_TOKEN or IBKR_FLEX_QUERY_ID not configured')
  }

  const step1Url =
    `https://gdcdyn.interactivebrokers.com/Universal/servlet/` +
    `FlexStatementService.SendRequest?t=${token}&q=${queryId}&v=3`

  // Step 1: request the report — retry on error 1001 (server busy)
  let referenceCode = ''
  let reportUrl = ''

  for (let attempt = 1; attempt <= 3; attempt++) {
    if (attempt > 1) await sleep(5000)

    const step1Res = await fetch(step1Url)
    if (!step1Res.ok) {
      throw new Error(`IBKR step-1 request failed: ${step1Res.status}`)
    }
    const step1Xml = await step1Res.text()

    // Error 1001 = server busy, try again shortly
    if (step1Xml.includes('<ErrorCode>1001</ErrorCode>')) {
      if (attempt < 3) continue
      throw new Error(`IBKR not ready after 3 attempts: ${step1Xml}`)
    }

    referenceCode = extractTag(step1Xml, 'ReferenceCode')
    reportUrl = extractTag(step1Xml, 'Url')

    if (!referenceCode || !reportUrl) {
      throw new Error(`Could not parse ReferenceCode/Url from IBKR response: ${step1Xml}`)
    }
    break
  }

  // Step 2: poll for the report (max 8 attempts, 3 s delay)
  const fetchUrl = `${reportUrl}?q=${referenceCode}&t=${token}&v=3`

  for (let attempt = 1; attempt <= 8; attempt++) {
    if (attempt > 1) await sleep(3000)

    const res = await fetch(fetchUrl)
    if (!res.ok) {
      throw new Error(`IBKR step-2 request failed (attempt ${attempt}): ${res.status}`)
    }
    const xml = await res.text()

    if (xml.includes('<FlexStatementResponse status="warn"')) {
      continue
    }

    return xml
  }

  throw new Error('IBKR report not ready after 8 attempts')
}

// ── Yahoo Finance benchmark ──────────────────────────────────────────────────

async function fetchBenchmarkPrice(): Promise<number> {
  try {
    const res = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/VWCE.DE',
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    )
    if (!res.ok) return 0
    const data = await res.json()
    return (data?.chart?.result?.[0]?.meta?.regularMarketPrice as number) ?? 0
  } catch {
    return 0
  }
}

// Returns a map of date string (YYYY-MM-DD) -> closing price for the past `rangeDays` days
async function fetchBenchmarkHistory(rangeDays: number): Promise<Map<string, number>> {
  const result = new Map<string, number>()
  try {
    const rangeParam = rangeDays <= 30 ? '1mo' : rangeDays <= 90 ? '3mo' : rangeDays <= 180 ? '6mo' : rangeDays <= 365 ? '1y' : '2y'
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/VWCE.DE?interval=1d&range=${rangeParam}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    )
    if (!res.ok) return result
    const data = await res.json()
    const chartResult = data?.chart?.result?.[0]
    const timestamps: number[] = chartResult?.timestamp ?? []
    const closes: number[] = chartResult?.indicators?.quote?.[0]?.close ?? []
    for (let i = 0; i < timestamps.length; i++) {
      if (!timestamps[i] || !closes[i]) continue
      const date = new Date(timestamps[i] * 1000).toISOString().split('T')[0]
      result.set(date, closes[i])
    }
  } catch {
    // fall through, return whatever we have
  }
  return result
}

// ── main handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // 1. Auth check
  const syncSecret = process.env.IBKR_SYNC_SECRET
  const headerSecret = request.headers.get('x-sync-secret')

  if (!syncSecret || headerSecret !== syncSecret) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Service-role Supabase client (no cookies needed here)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 2. Fetch IBKR Flex XML
    const xml = await fetchIbkrXml()

    // 3. Parse open positions
    const rawOpen = parseXmlAttributes(xml, 'OpenPosition')

    // 3b. Parse closed positions — try ClosedPosition first, fall back to Trade
    const rawClosed =
      parseXmlAttributes(xml, 'ClosedPosition').length > 0
        ? parseXmlAttributes(xml, 'ClosedPosition')
        : parseXmlAttributes(xml, 'Trade')

    // Helper: resolve trading_id for a symbol
    async function resolveTradingId(symbol: string): Promise<string | null> {
      const { data } = await supabase
        .from('cases')
        .select('trading_id')
        .eq('ticker', symbol)
        .eq('status', 'Active')
        .order('date_of_case', { ascending: false })
        .limit(1)
        .maybeSingle()
      return data?.trading_id ?? null
    }

    // 5 & 6. Upsert open positions
    let openCount = 0
    for (const pos of rawOpen) {
      const symbol = pos.symbol ?? ''
      if (!symbol) continue

      const entryPrice = parseFloat(pos.openPrice ?? '0')
      const positionSize = parseFloat(pos.position ?? '0')
      const unrealizedPnl = parseFloat(pos.fifoPnlUnrealized ?? '0')
      const denominator = entryPrice * positionSize
      const unrealizedPnlPct =
        denominator !== 0 ? (unrealizedPnl / denominator) * 100 : 0

      const trading_id = await resolveTradingId(symbol)

      const { error } = await supabase.from('open_positions').upsert(
        {
          trading_id,
          symbol,
          entry_price_actual: entryPrice,
          entry_date_actual: pos.openDateTime
            ? pos.openDateTime.split(' ')[0]
            : null,
          position_size_actual: positionSize,
          pct_of_nav: parseFloat(pos.percentOfNAV ?? '0'),
          current_price: parseFloat(pos.markPrice ?? '0'),
          unrealized_pnl: unrealizedPnl,
          unrealized_pnl_pct: unrealizedPnlPct,
          last_synced_at: new Date().toISOString(),
        },
        { onConflict: 'symbol' }
      )

      if (error) {
        console.error(`open_positions upsert error for ${symbol}:`, error)
      } else {
        openCount++
      }
    }

    // Upsert closed trades
    let closedCount = 0
    for (const trade of rawClosed) {
      const symbol = trade.symbol ?? ''
      if (!symbol) continue

      const entryDateRaw = trade.openDateTime ?? ''
      const exitDateRaw = trade.closeDateTime ?? ''
      const entryDate = entryDateRaw ? entryDateRaw.split(' ')[0] : null
      const exitDate = exitDateRaw ? exitDateRaw.split(' ')[0] : null

      const holdingPeriodDays =
        entryDate && exitDate
          ? Math.round(
              (new Date(exitDate).getTime() - new Date(entryDate).getTime()) /
                86_400_000
            )
          : null

      const entryPrice = parseFloat(trade.openPrice ?? '0')
      const exitPrice = parseFloat(trade.closePrice ?? '0')
      const positionSize = parseFloat(trade.quantity ?? '0')
      const realizedPnl = parseFloat(trade.fifoPnl ?? '0')
      const denominator = entryPrice * positionSize
      const realizedPnlPct =
        denominator !== 0 ? (realizedPnl / denominator) * 100 : 0

      const trading_id = await resolveTradingId(symbol)

      const { error } = await supabase.from('closed_trades').upsert(
        {
          trading_id,
          symbol,
          entry_price: entryPrice,
          exit_price: exitPrice,
          entry_date: entryDate,
          exit_date: exitDate,
          position_size: positionSize,
          realized_pnl: realizedPnl,
          realized_pnl_pct: realizedPnlPct,
          holding_period_days: holdingPeriodDays,
          last_synced_at: new Date().toISOString(),
        },
        { onConflict: 'symbol,entry_date,exit_date' }
      )

      if (error) {
        console.error(`closed_trades upsert error for ${symbol}:`, error)
      } else {
        closedCount++
      }
    }

    // 7. Portfolio snapshot
    const totalNav = rawOpen.reduce((sum, pos) => {
      return (
        sum +
        parseFloat(pos.markPrice ?? '0') * parseFloat(pos.position ?? '0')
      )
    }, 0)

    const totalUnrealizedPnl = rawOpen.reduce((sum, pos) => {
      return sum + parseFloat(pos.fifoPnlUnrealized ?? '0')
    }, 0)

    // Sum realized PnL for closed trades this calendar year
    const yearStart = `${new Date().getFullYear()}-01-01`
    const { data: ytdTrades } = await supabase
      .from('closed_trades')
      .select('realized_pnl')
      .gte('exit_date', yearStart)

    const totalRealizedPnl = (ytdTrades ?? []).reduce(
      (sum, row) => sum + (row.realized_pnl ?? 0),
      0
    )

    const benchmarkValue = await fetchBenchmarkPrice()
    const today = new Date().toISOString().split('T')[0]

    await supabase.from('portfolio_snapshots').upsert(
      {
        snapshot_date: today,
        total_nav: totalNav,
        total_unrealized_pnl: totalUnrealizedPnl,
        total_realized_pnl: totalRealizedPnl,
        benchmark_value: benchmarkValue,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'snapshot_date' }
    )

    // Backfill benchmark_value for snapshots that are missing it
    const { data: missingBenchmark } = await supabase
      .from('portfolio_snapshots')
      .select('snapshot_date')
      .or('benchmark_value.is.null,benchmark_value.eq.0')
      .neq('snapshot_date', today)
      .order('snapshot_date', { ascending: true })

    if (missingBenchmark && missingBenchmark.length > 0) {
      const oldestDate = missingBenchmark[0].snapshot_date as string
      const ageDays = Math.ceil(
        (Date.now() - new Date(oldestDate).getTime()) / 86_400_000
      )
      const history = await fetchBenchmarkHistory(ageDays + 5)

      for (const row of missingBenchmark) {
        const date = row.snapshot_date as string
        const price = history.get(date)
        if (!price) continue
        await supabase
          .from('portfolio_snapshots')
          .update({ benchmark_value: price })
          .eq('snapshot_date', date)
      }
    }

    // 8. Return summary
    return Response.json({
      success: true,
      openPositions: openCount,
      closedTrades: closedCount,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('IBKR sync error:', message)
    return Response.json({ error: message }, { status: 500 })
  }
}
