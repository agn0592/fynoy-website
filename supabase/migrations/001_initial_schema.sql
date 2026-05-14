-- ============================================================
-- 001_initial_schema.sql
-- Run this in the Supabase SQL editor or via `supabase db push`.
-- ============================================================

-- ----------------------------------------------------------------
-- users (extends auth.users)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text        NOT NULL,
  full_name   text,
  role        text        NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Automatically provision a row when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ----------------------------------------------------------------
-- Helper: is the current user an admin?
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ----------------------------------------------------------------
-- cases
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cases (
  id                              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  trading_id                      text        UNIQUE NOT NULL,
  company_name                    text,
  ticker                          text,
  status                          text        CHECK (status IN ('Active', 'Not Active')),
  sector                          text,
  industry                        text,
  date_of_case                    date,
  country_of_incorporation        text,
  current_phase                   text,

  -- Investment Trigger
  event_details                   text,
  brand_summary                   text,
  brand_type                      text,
  impact_of_news                  text,
  initial_market_assessment       text,
  trigger_score                   int         CHECK (trigger_score BETWEEN 1 AND 7),

  -- Fundamental Analysis
  company_fundamentals            text,
  business_model_explanation      text,
  key_products_services           text,
  business_model_outlook          text,
  earnings_quality                text,
  competitive_advantage           text,
  competitive_advantage_defined   text,
  market_position                 text,
  esg_governance_quality_score    int         CHECK (esg_governance_quality_score BETWEEN 1 AND 10),
  esg_governance_explanation      text,
  net_debt_ebitda                 text,
  eps                             text,
  operating_margin                text,
  layered_fcf_ttm                 text,
  fundamental_score               int         CHECK (fundamental_score BETWEEN 1 AND 10),

  -- Valuation Analysis
  valuation_metrics_peers         text,
  current_pe                      numeric,
  forward_pe                      numeric,
  ev_ebitda                       numeric,
  current_vs_historical_multiples text,
  top_3_competitors               text,
  prior_valuation_assessment      text,
  analyst_1y_price_target         numeric,
  valuation_score                 int         CHECK (valuation_score BETWEEN 1 AND 8),

  -- Conviction & Risks
  risks                           text[],
  catalysts                       text[],
  conviction_score                int         CHECK (conviction_score BETWEEN 1 AND 10),

  -- Technical Analysis
  primary_trend                   text,
  overall_chart_assessment        text,
  tradingview_ta_score            numeric,
  technical_score                 int         CHECK (technical_score BETWEEN 1 AND 6),
  week_52_low                     numeric,
  week_52_high                    numeric,

  -- Execution Plan
  entry_price_target              numeric,
  take_profit                     numeric,
  stop_loss                       numeric,
  leverage                        numeric,
  risk_reward_ratio               numeric,
  expected_holding_period_months  int,
  rematch                         boolean,
  why_not_rematch                 text,

  -- Final Score
  total_score                     int         CHECK (total_score BETWEEN 1 AND 48),
  confidence_score                int         CHECK (confidence_score BETWEEN 1 AND 10),

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cases_updated_at ON public.cases;
CREATE TRIGGER cases_updated_at
  BEFORE UPDATE ON public.cases
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ----------------------------------------------------------------
-- open_positions
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.open_positions (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  trading_id            text        REFERENCES public.cases(trading_id) ON DELETE SET NULL,
  symbol                text        NOT NULL,
  entry_price_actual    numeric,
  entry_date_actual     date,
  position_size_actual  numeric,
  pct_of_nav            numeric,
  current_price         numeric,
  unrealized_pnl        numeric,
  unrealized_pnl_pct    numeric,
  last_synced_at        timestamptz
);

-- ----------------------------------------------------------------
-- closed_trades
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.closed_trades (
  id                  uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  trading_id          text    REFERENCES public.cases(trading_id) ON DELETE SET NULL,
  symbol              text    NOT NULL,
  entry_price         numeric,
  exit_price          numeric,
  entry_date          date,
  exit_date           date,
  position_size       numeric,
  realized_pnl        numeric,
  realized_pnl_pct    numeric,
  holding_period_days int,
  last_synced_at      timestamptz
);

-- ----------------------------------------------------------------
-- journal
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.journal (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  trading_id            text        REFERENCES public.cases(trading_id) ON DELETE SET NULL,
  entry_date            date,
  entry_type            text,
  notes                 text,
  post_trade_reflection text,
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------
-- portfolio_snapshots
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.portfolio_snapshots (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date         date        NOT NULL,
  total_nav             numeric,
  total_unrealized_pnl  numeric,
  total_realized_pnl    numeric,
  benchmark_value       numeric,
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- ================================================================
-- Row Level Security
-- ================================================================

ALTER TABLE public.users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.open_positions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.closed_trades       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_snapshots ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- users: each user can read/update their own row
-- ----------------------------------------------------------------
CREATE POLICY "users: read own row"
  ON public.users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "users: update own row"
  ON public.users FOR UPDATE
  USING (id = auth.uid());

-- ----------------------------------------------------------------
-- open_positions: SELECT for authenticated; INSERT/UPDATE/DELETE for admin
-- ----------------------------------------------------------------
CREATE POLICY "open_positions: authenticated can select"
  ON public.open_positions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "open_positions: admin can insert"
  ON public.open_positions FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "open_positions: admin can update"
  ON public.open_positions FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "open_positions: admin can delete"
  ON public.open_positions FOR DELETE
  USING (public.is_admin());

-- ----------------------------------------------------------------
-- closed_trades: SELECT for authenticated; INSERT/UPDATE/DELETE for admin
-- ----------------------------------------------------------------
CREATE POLICY "closed_trades: authenticated can select"
  ON public.closed_trades FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "closed_trades: admin can insert"
  ON public.closed_trades FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "closed_trades: admin can update"
  ON public.closed_trades FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "closed_trades: admin can delete"
  ON public.closed_trades FOR DELETE
  USING (public.is_admin());

-- ----------------------------------------------------------------
-- portfolio_snapshots: SELECT for authenticated; INSERT/UPDATE/DELETE for admin
-- ----------------------------------------------------------------
CREATE POLICY "portfolio_snapshots: authenticated can select"
  ON public.portfolio_snapshots FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "portfolio_snapshots: admin can insert"
  ON public.portfolio_snapshots FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "portfolio_snapshots: admin can update"
  ON public.portfolio_snapshots FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "portfolio_snapshots: admin can delete"
  ON public.portfolio_snapshots FOR DELETE
  USING (public.is_admin());

-- ----------------------------------------------------------------
-- cases: SELECT and all writes for admin only
-- ----------------------------------------------------------------
CREATE POLICY "cases: admin can select"
  ON public.cases FOR SELECT
  USING (public.is_admin());

CREATE POLICY "cases: admin can insert"
  ON public.cases FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "cases: admin can update"
  ON public.cases FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "cases: admin can delete"
  ON public.cases FOR DELETE
  USING (public.is_admin());

-- ----------------------------------------------------------------
-- journal: SELECT and all writes for admin only
-- ----------------------------------------------------------------
CREATE POLICY "journal: admin can select"
  ON public.journal FOR SELECT
  USING (public.is_admin());

CREATE POLICY "journal: admin can insert"
  ON public.journal FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "journal: admin can update"
  ON public.journal FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "journal: admin can delete"
  ON public.journal FOR DELETE
  USING (public.is_admin());
