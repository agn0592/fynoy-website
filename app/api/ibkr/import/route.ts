import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 60

function parseXmlAttributes(xml: string, tagName: string): Record<string, string>[] {
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

function parseIbkrDate(raw: string | undefined): string | null {
  if (!raw) return null
  const datePart = raw.split(';')[0].trim()
  if (/^\d{8}$/.test(datePart)) {
    return `${datePart.slice(0, 4)}-${datePart.slice(4, 6)}-${datePart.slice(6, 8)}`
  }
  return datePart || null
}

export async function POST(request: NextRequest) {
  const syncSecret = process.env.IBKR_SYNC_SECRET
  const headerSecret = request.headers.get('x-sync-secret')

  if (!syncSecret || headerSecret !== syncSecret) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const xml = await request.text()
  if (!xml || !xml.includes('FlexStatement')) {
    return Response.json({ error: 'Invalid or missing XML body' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

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

  // Open positions
  const rawOpen = parseXmlAttributes(xml, 'OpenPosition')
  const openRows = await Promise.all(
    rawOpen.filter(p => !!p.symbol).map(async pos => {
      const entryPrice = parseFloat(pos.openPrice ?? pos.costBasisPrice ?? '0')
      const positionSize = parseFloat(pos.position ?? pos.quantity ?? '0')
      const unrealizedPnl = parseFloat(pos.fifoPnlUnrealized ?? pos.unrealizedPL ?? '0')
      const denominator = entryPrice * positionSize
      return {
        trading_id: await resolveTradingId(pos.symbol),
        symbol: pos.symbol,
        entry_price_actual: entryPrice,
        entry_date_actual: parseIbkrDate(pos.openDateTime),
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
    if (error) console.error('open_positions error:', error)
    else openCount = openRows.length
  }

  // Closed trades
  const rawClosed = parseXmlAttributes(xml, 'ClosedPosition').length > 0
    ? parseXmlAttributes(xml, 'ClosedPosition')
    : parseXmlAttributes(xml, 'Trade')

  const closedRows = (await Promise.all(
    rawClosed.filter(t => !!t.symbol).map(async trade => {
      const entryDate = parseIbkrDate(trade.openDateTime)
      const exitDate = parseIbkrDate(trade.closeDateTime ?? trade.dateTime ?? trade.tradeDate)
      if (!entryDate || !exitDate) return null
      const entryPrice = parseFloat(trade.openPrice ?? trade.costBasis ?? '0')
      const exitPrice = parseFloat(trade.closePrice ?? trade.tradePrice ?? '0')
      const positionSize = parseFloat(trade.quantity ?? '0')
      const realizedPnl = parseFloat(trade.fifoPnl ?? trade.realizedPL ?? '0')
      const denominator = entryPrice * positionSize
      return {
        trading_id: await resolveTradingId(trade.symbol),
        symbol: trade.symbol,
        entry_price: entryPrice,
        exit_price: exitPrice,
        entry_date: entryDate,
        exit_date: exitDate,
        position_size: positionSize,
        realized_pnl: realizedPnl,
        realized_pnl_pct: denominator !== 0 ? (realizedPnl / denominator) * 100 : 0,
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
    if (error) console.error('closed_trades error:', error)
    else closedCount = closedRows.length
  }

  // NAV history
  const depositsMap = new Map<string, number>()
  for (const change of parseXmlAttributes(xml, 'ChangeInNAV')) {
    const date = parseIbkrDate(change.toDate ?? change.fromDate ?? change.reportDate)
    if (!date) continue
    depositsMap.set(date, (depositsMap.get(date) ?? 0) + parseFloat(change.depositsWithdrawals ?? '0'))
  }

  const navRows = parseXmlAttributes(xml, 'NetAssetValue')
    .map(nav => ({ date: parseIbkrDate(nav.reportDate), total: parseFloat(nav.total ?? '0') }))
    .filter(r => r.date && r.total !== 0)
    .map(r => ({
      snapshot_date: r.date!,
      total_nav: r.total,
      deposits_withdrawals: depositsMap.get(r.date!) ?? 0,
    }))

  let navCount = 0
  if (navRows.length > 0) {
    const { error } = await supabase.from('portfolio_snapshots').upsert(navRows, { onConflict: 'snapshot_date' })
    if (error) console.error('portfolio_snapshots error:', error)
    else navCount = navRows.length
  }

  return Response.json({ success: true, openPositions: openCount, closedTrades: closedCount, navDays: navCount })
}
