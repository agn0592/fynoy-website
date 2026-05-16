ALTER TABLE public.portfolio_snapshots
  ADD COLUMN IF NOT EXISTS daily_twr numeric DEFAULT 0;
