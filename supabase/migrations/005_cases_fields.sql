-- ============================================================
-- 005_cases_fields.sql
-- Adds the case fields that exist in the source CSV but were not
-- in the original schema, plus the ai_summary cache column used
-- by /api/cases/summary.
-- ============================================================

ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS event_summary           text,
  ADD COLUMN IF NOT EXISTS event_type              text,
  ADD COLUMN IF NOT EXISTS event_classification    text,
  ADD COLUMN IF NOT EXISTS direction               text,
  ADD COLUMN IF NOT EXISTS execute                 boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS why_not_executed        text,
  ADD COLUMN IF NOT EXISTS current_price_at_case   numeric,
  ADD COLUMN IF NOT EXISTS catalyst_1              text,
  ADD COLUMN IF NOT EXISTS catalyst_2              text,
  ADD COLUMN IF NOT EXISTS catalyst_3              text,
  ADD COLUMN IF NOT EXISTS catalyst_4              text,
  ADD COLUMN IF NOT EXISTS risk_1                  text,
  ADD COLUMN IF NOT EXISTS risk_2                  text,
  ADD COLUMN IF NOT EXISTS risk_3                  text,
  ADD COLUMN IF NOT EXISTS risk_4                  text,
  ADD COLUMN IF NOT EXISTS ai_summary              text;

-- The source CSV stores tradingview_ta_score as text ("Buy" / "Sell" /
-- "Neutral"). The original schema (001) typed it as numeric — relax to
-- text so the import works.
ALTER TABLE public.cases
  ALTER COLUMN tradingview_ta_score TYPE text USING tradingview_ta_score::text;

-- conviction_score check constraint is already in 001 but ensure it exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   information_schema.columns
    WHERE  table_schema = 'public' AND table_name = 'cases' AND column_name = 'conviction_score'
  ) THEN
    ALTER TABLE public.cases ADD COLUMN conviction_score int CHECK (conviction_score BETWEEN 1 AND 10);
  END IF;
END $$;

-- Authenticated users need read access to case data for the member dashboard.
-- (Cases were previously admin-only via 001 policies — relax SELECT for auth users.)
DROP POLICY IF EXISTS "cases: admin can select" ON public.cases;
DROP POLICY IF EXISTS "cases: authenticated can select" ON public.cases;
CREATE POLICY "cases: authenticated can select"
  ON public.cases FOR SELECT
  USING (auth.uid() IS NOT NULL);
