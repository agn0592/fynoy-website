-- ============================================================
-- 010_trading_id_backfill.sql
-- One-off backfill: link open_positions and closed_trades to the
-- right case via trading_id. This was empty for rows that synced
-- from IBKR before the cases data was imported. Future IBKR syncs
-- already populate trading_id via resolveTradingId() in the route.
-- ============================================================

UPDATE public.open_positions op
SET trading_id = c.trading_id
FROM (
  SELECT DISTINCT ON (ticker) trading_id, ticker
  FROM public.cases
  WHERE status = 'Active'
  ORDER BY ticker, date_of_case DESC
) c
WHERE c.ticker = op.symbol AND op.trading_id IS NULL;

UPDATE public.closed_trades ct
SET trading_id = c.trading_id
FROM (
  SELECT DISTINCT ON (ticker) trading_id, ticker
  FROM public.cases
  ORDER BY ticker, date_of_case DESC
) c
WHERE c.ticker = ct.symbol AND ct.trading_id IS NULL;
