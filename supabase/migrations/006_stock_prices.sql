-- ============================================================
-- 006_stock_prices.sql
-- Cache for historical close prices per symbol, populated by the
-- /api/prices/history route (Yahoo Finance fallback).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.stock_prices (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol     text        NOT NULL,
  date       date        NOT NULL,
  close      numeric     NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(symbol, date)
);

CREATE INDEX IF NOT EXISTS stock_prices_symbol_date_idx
  ON public.stock_prices (symbol, date);

ALTER TABLE public.stock_prices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stock_prices: authenticated can select" ON public.stock_prices;
CREATE POLICY "stock_prices: authenticated can select"
  ON public.stock_prices FOR SELECT
  USING (auth.uid() IS NOT NULL);
