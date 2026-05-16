ALTER TABLE public.portfolio_snapshots
  ADD COLUMN IF NOT EXISTS deposits_withdrawals numeric DEFAULT 0;

-- Unique constraints required for upserts (idempotent)
ALTER TABLE public.open_positions
  DROP CONSTRAINT IF EXISTS open_positions_symbol_key;
ALTER TABLE public.open_positions
  ADD CONSTRAINT open_positions_symbol_key UNIQUE (symbol);

ALTER TABLE public.closed_trades
  DROP CONSTRAINT IF EXISTS closed_trades_symbol_entry_exit_key;
ALTER TABLE public.closed_trades
  ADD CONSTRAINT closed_trades_symbol_entry_exit_key
  UNIQUE (symbol, entry_date, exit_date);

ALTER TABLE public.portfolio_snapshots
  DROP CONSTRAINT IF EXISTS portfolio_snapshots_snapshot_date_key;
ALTER TABLE public.portfolio_snapshots
  ADD CONSTRAINT portfolio_snapshots_snapshot_date_key
  UNIQUE (snapshot_date);
