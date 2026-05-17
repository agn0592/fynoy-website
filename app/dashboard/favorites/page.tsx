import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Metadata } from 'next'
import FavoritesClient, { type OpenPositionInput, type ClosedTradeInput } from './FavoritesClient'

export const metadata: Metadata = { title: 'Favorites' }

function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export default async function FavoritesPage() {
  const supabase = getServiceClient()

  const [{ data: openRaw }, { data: closedRaw }, { data: casesRaw }] = await Promise.all([
    supabase
      .from('open_positions')
      .select('id, trading_id, symbol, entry_price_actual, current_price, position_size_actual, pct_of_nav, unrealized_pnl, unrealized_pnl_pct, entry_date_actual'),
    supabase
      .from('closed_trades')
      .select('symbol, entry_date, exit_date, entry_price, exit_price, position_size, realized_pnl, realized_pnl_pct, holding_period_days, trading_id')
      .order('exit_date', { ascending: false }),
    supabase
      .from('cases')
      .select('trading_id, sector, take_profit, stop_loss'),
  ])

  const open: OpenPositionInput[] = (openRaw ?? []).map(p => ({
    symbol: p.symbol,
    trading_id: p.trading_id,
    entry_price: p.entry_price_actual,
    current_price: p.current_price,
    position_size: p.position_size_actual,
    pct_of_nav: p.pct_of_nav,
    unrealized_pnl: p.unrealized_pnl,
    unrealized_pnl_pct: p.unrealized_pnl_pct,
    entry_date: p.entry_date_actual,
  }))

  const closed: ClosedTradeInput[] = (closedRaw ?? []).map(t => ({
    symbol: t.symbol,
    entry_date: t.entry_date,
    exit_date: t.exit_date,
    entry_price: t.entry_price,
    exit_price: t.exit_price,
    position_size: t.position_size,
    realized_pnl: t.realized_pnl,
    realized_pnl_pct: t.realized_pnl_pct,
    holding_period_days: t.holding_period_days,
    trading_id: t.trading_id,
  }))

  const casesIndex = Object.fromEntries(
    ((casesRaw ?? []) as { trading_id: string; sector: string | null; take_profit: number | null; stop_loss: number | null }[])
      .map(c => [c.trading_id, c]),
  )

  return (
    <>
      <div className="dash-page-head">
        <div className="dash-page-title-block">
          <h1 className="dash-page-title">
            Your <em>Favorites</em>
          </h1>
          <div className="dash-page-sub">
            Stats for the positions and closed trades you&rsquo;ve starred.
          </div>
        </div>
      </div>

      <FavoritesClient
        openPositions={open}
        closedTrades={closed}
        casesIndex={casesIndex}
      />
    </>
  )
}
