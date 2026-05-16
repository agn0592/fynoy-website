import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 60

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

// IBKR dates come as yyyyMMdd or yyyyMMdd;HHmmss — convert to yyyy-MM-dd
function parseIbkrDate(raw: string | undefined): string | null {
  if (!raw) return null
  const datePart = raw.split(';')[0].trim()
  if (/^\d{8}$/.test(datePart)) {
    return `${datePart.slice(0, 4)}-${datePart.slice(4, 6)}-${datePart.slice(6, 8)}`
  }
  return datePart || null
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

  for (let attempt = 1; attempt <= 3; attempt++) {
    if (attempt > 1) await sleep(5000)

    const step1Res = await fetch(step1Url)
    if (!step1Res.ok) {
      throw new Error(`IBKR step-1 request failed: ${step1Res.status}`)
    }
    const step1Xml = await step1Res.text()

    if (step1Xml.includes('<ErrorCode>1001</ErrorCode>')) {
      if (attempt < 3) continue
      throw new Error(`IBKR not ready after 3 attempts: ${step1Xml}`)
    }

    referenceCode = extractTag(step1Xml, 'ReferenceCode')

    if (!referenceCode) {
      throw new Error(`Could not parse ReferenceCode from IBKR response: ${step1Xml}`)
    }
    break
  }

  // Step 2: poll for the report (max 5 attempts, 3 s delay after initial 10 s wait)
  const fetchUrl =
    `https://gdcdyn.interactivebrokers.com/Universal/servlet/` +
    `FlexStatementService.GetStatement?q=${referenceCode}&t=${token}&v=3`

  await sleep(5000)

  for (let attempt = 1; attempt <= 5; attempt++) {
    if (attempt > 1) await sleep(2000)

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

  throw new Error('IBKR report not ready after 5 attempts')
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
    // fall through
  }
  return result
}

// ── main handler ─────────────────────────────────────────────────────────────

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

    const xml = await fetchIbkrXml()

    // ── Open positions ────────────────────────────────────────────────────────
    const allOpenPos = parseXmlAttributes(xml, 'OpenPosition').filter(p => !!p.symbol && p.assetCategory === 'STK')
    // SUMMARY rows: one per symbol, aggregated position data
    const rawOpen = allOpenPos.filter(p => p.levelOfDetail === 'SUMMARY')
    // LOT rows: one per purchase lot — use to find earliest entry date per symbol
    const lotOpen = allOpenPos.filter(p => p.levelOfDetail === 'LOT')

    // Build earliest entry date + weighted avg entry price from LOT data
    const entryBySymbol = new Map<string, { date: string; price: number }>()
    for (const lot of lotOpen) {
      const dt = parseIbkrDate(lot.openDateTime)
      if (!dt) continue
      const ex = entryBySymbol.get(lot.symbol)
      if (!ex || dt < ex.date) {
        entryBySymbol.set(lot.symbol, {
          date: dt,
          price: parseFloat(lot.openPrice ?? lot.costBasisPrice ?? '0'),
        })
      }
    }

    const tradingIdCache = new Map<string, string | null>()
    async function resolveTradingId(symbol: string): Promise<string | null> {
      if (tradingIdCache.has(symbol)) return tradingIdCache.get(symbol)!
      const { data } = await supabase
        .from('cases')
        .select('trading_id')
        .eq('ticker', symbol)
        .eq('status', 'Active')
        .order('date_of_case', { ascending: false })
        .limit(1)
        .maybeSingle()
      const id = data?.trading_id ?? null
      tradingIdCache.set(symbol, id)
      return id
    }

    const now = new Date().toISOString()
    const openRows = await Promise.all(
      rawOpen.map(async pos => {
        const entry = entryBySymbol.get(pos.symbol)
        const entryPrice = entry?.price ?? parseFloat(pos.openPrice ?? pos.costBasisPrice ?? '0')
        const entryDate = entry?.date ?? parseIbkrDate(pos.openDateTime)
        const positionSize = parseFloat(pos.position ?? pos.quantity ?? '0')
        const unrealizedPnl = parseFloat(pos.fifoPnlUnrealized ?? pos.unrealizedPL ?? '0')
        const denominator = entryPrice * positionSize
        return {
          trading_id: await resolveTradingId(pos.symbol),
          symbol: pos.symbol,
          entry_price_actual: entryPrice,
          entry_date_actual: entryDate,
          position_size_actual: positionSize,
          pct_of_nav: parseFloat(pos.percentOfNAV ?? '0'),
          current_price: parseFloat(pos.markPrice ?? '0'),
          unrealized_pnl: unrealizedPnl,
          unrealized_pnl_pct: denominator !== 0 ? (unrealizedPnl / denominator) * 100 : 0,
          last_synced_at: now,
        }
      })
    )

    let openCount = 0
    if (openRows.length > 0) {
      const { error } = await supabase.from('open_positions').upsert(openRows, { onConflict: 'symbol' })
      if (error) console.error('open_positions batch upsert error:', error)
      else openCount = openRows.length
    }

    // ── Closed trades ─────────────────────────────────────────────────────────
    // Flex Query with "Closed Lots" exports <Lot> tags where:
    //   tradePrice = entry price (opening trade price)
    //   cost       = total entry cost in trade currency
    //   fifoPnlRealized = realized PnL in base currency (EUR)
    //   exit price is derived: (cost + pnlInLocalCurrency) / qty
    const closedLots = parseXmlAttributes(xml, 'Lot').filter(
      l => l.buySell === 'SELL' && !!l.symbol && l.assetCategory === 'STK'
    )
    const closedRows = (await Promise.all(
      closedLots.map(async lot => {
        const entryDate = parseIbkrDate(lot.openDateTime)
        const exitDate = parseIbkrDate(lot.dateTime ?? lot.tradeDate)
        if (!entryDate || !exitDate) return null

        const qty = Math.abs(parseFloat(lot.quantity ?? '0'))
        const entryPrice = parseFloat(lot.tradePrice ?? '0')
        const cost = Math.abs(parseFloat(lot.cost ?? '0'))
        const fx = parseFloat(lot.fxRateToBase ?? '1')
        const realizedPnl = parseFloat(lot.fifoPnlRealized ?? '0')
        const realizedPnlLocal = realizedPnl / fx
        const exitPrice = qty !== 0 ? (cost + realizedPnlLocal) / qty : 0
        const realizedPct = cost !== 0 ? (realizedPnlLocal / cost) * 100 : 0
        return {
          trading_id: await resolveTradingId(lot.symbol),
          symbol: lot.symbol,
          entry_price: entryPrice,
          exit_price: exitPrice,
          entry_date: entryDate,
          exit_date: exitDate,
          position_size: qty,
          realized_pnl: realizedPnl,
          realized_pnl_pct: realizedPct,
          holding_period_days: Math.round(
            (new Date(exitDate).getTime() - new Date(entryDate).getTime()) / 86_400_000
          ),
          last_synced_at: now,
        }
      })
    )).filter((r): r is NonNullable<typeof r> => r !== null)

    let closedCount = 0
    if (closedRows.length > 0) {
      const { error } = await supabase.from('closed_trades').upsert(closedRows, { onConflict: 'symbol,entry_date,exit_date' })
      if (error) console.error('closed_trades batch upsert error:', error)
      else closedCount = closedRows.length
    }

    // ── NAV history from ChangeInNAV (one row per day, includes deposits) ───────
    // ChangeInNAV.endingValue is the authoritative daily NAV in base currency (EUR).
    // Unrealized PnL is summed from OpenPosition SUMMARY rows per date.
    const unrealizedByDate = new Map<string, number>()
    for (const pos of rawOpen) {
      const date = parseIbkrDate(pos.reportDate)
      if (!date) continue
      const fx = parseFloat(pos.fxRateToBase ?? '1')
      const upnl = parseFloat(pos.fifoPnlUnrealized ?? pos.unrealizedPL ?? '0') * fx
      unrealizedByDate.set(date, (unrealizedByDate.get(date) ?? 0) + upnl)
    }

    const navRows = parseXmlAttributes(xml, 'ChangeInNAV')
      .filter(r => r.currency === 'EUR' && !!r.toDate)
      .map(r => {
        const date = parseIbkrDate(r.toDate)!
        return {
          snapshot_date: date,
          total_nav: parseFloat(r.endingValue ?? '0'),
          total_unrealized_pnl: unrealizedByDate.get(date) ?? 0,
          deposits_withdrawals: parseFloat(r.depositsWithdrawals ?? '0'),
          daily_twr: parseFloat(r.twr ?? '0'),
        }
      })
      .filter(r => r.total_nav !== 0)

    let navCount = 0
    if (navRows.length > 0) {
      const { error } = await supabase.from('portfolio_snapshots').upsert(navRows, { onConflict: 'snapshot_date' })
      if (error) console.error('portfolio_snapshots batch upsert error:', error)
      else navCount = navRows.length
    }

    // ── Today's snapshot: add live benchmark ─────────────────────────────────
    const today = new Date().toISOString().split('T')[0]
    const benchmarkValue = await fetchBenchmarkPrice()

    await supabase.from('portfolio_snapshots').upsert(
      { snapshot_date: today, benchmark_value: benchmarkValue },
      { onConflict: 'snapshot_date' }
    )

    // ── Backfill missing benchmark values ────────────────────────────────────
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

    return Response.json({
      success: true,
      openPositions: openCount,
      closedTrades: closedCount,
      navDays: navCount,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('IBKR sync error:', message)
    return Response.json({ error: message }, { status: 500 })
  }
}
