-- ============================================================
-- 007_risk_free_rates.sql
-- Daily cache of the German 10-year Bund yield, used as the
-- risk-free rate (R_f) in risk-adjusted return calculations
-- (Capped M² / Sharpe). Populated by /api/bund/refresh.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.risk_free_rates (
  date        date        PRIMARY KEY,
  rate        numeric     NOT NULL,                         -- annual yield as decimal (0.0245 = 2.45%)
  source      text        NOT NULL DEFAULT 'bundesbank-WT1010',
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS risk_free_rates_date_desc_idx
  ON public.risk_free_rates (date DESC);

ALTER TABLE public.risk_free_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "risk_free_rates: authenticated can select" ON public.risk_free_rates;
CREATE POLICY "risk_free_rates: authenticated can select"
  ON public.risk_free_rates FOR SELECT
  USING (auth.uid() IS NOT NULL);
