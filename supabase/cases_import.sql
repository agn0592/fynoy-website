-- ============================================================
-- cases_import.sql
-- Idempotent INSERT/UPSERT template for importing case data.
-- Vul de waarden per case in vanuit de bron CSV en run dit in
-- de Supabase SQL editor. Run eerst migration 005_cases_fields.sql.
--
-- Kolom-mapping CSV → cases:
--   Trading ID                          -> trading_id
--   Company name                        -> company_name
--   Status (Active / Not Active)        -> status
--   Ticker                              -> ticker
--   Date of case                        -> date_of_case
--   Sector                              -> sector
--   Industry                            -> industry
--   Country of incorporation            -> country_of_incorporation
--   Current price ($ stripped)          -> current_price_at_case
--   52-Week High                        -> week_52_high
--   52-Week Low                         -> week_52_low
--   Analyst 1Y Price Target             -> analyst_1y_price_target
--   Event Summary                       -> event_summary
--   Event Type                          -> event_type
--   Event Classification                -> event_classification
--   Impact of News                      -> impact_of_news
--   Initial Market Assessment           -> initial_market_assessment
--   Catalyst 1..4                       -> catalyst_1..4
--   Trigger Score (1-7)                 -> trigger_score
--   Risk 1..4                           -> risk_1..4
--   Business Model Explanation          -> business_model_explanation
--   Key Products and Services           -> key_products_services
--   Business Model Outlook              -> business_model_outlook
--   Earnings Quality                    -> earnings_quality
--   Competitive Advantage (MOAT)        -> competitive_advantage
--   Competitive Advantage defined       -> competitive_advantage_defined
--   Market position                     -> market_position
--   ISS Governance Quality Score        -> esg_governance_quality_score
--   ISS Governance explanation          -> esg_governance_explanation
--   Net Debt / EBITDA ratio             -> net_debt_ebitda
--   Fundamental Score                   -> fundamental_score
--   Current P/E                         -> current_pe
--   Forward P/E                         -> forward_pe
--   EV/EBITDA                           -> ev_ebitda
--   Current vs Historical Multiples     -> current_vs_historical_multiples
--   Top 3 competitors                   -> top_3_competitors
--   Peer Valuation Assessment           -> prior_valuation_assessment
--   EPS                                 -> eps
--   Operating margin                    -> operating_margin
--   Levered FCF TTM                     -> layered_fcf_ttm
--   Valuation Score                     -> valuation_score
--   Primary Trend Daily/Weekly          -> primary_trend
--   Overall Chart Assessment            -> overall_chart_assessment
--   TradingView TA Score                -> tradingview_ta_score
--   Technical Score                     -> technical_score
--   Direction                           -> direction
--   Entry price target                  -> entry_price_target
--   Take profit                         -> take_profit
--   Stoploss                            -> stop_loss
--   Leverage                            -> leverage
--   Risk/Reward ratio                   -> risk_reward_ratio
--   Expected holding period (months)    -> expected_holding_period_months
--   Total Score (1-40)                  -> total_score
--   Confidence Score                    -> confidence_score
--   Execute? (checked = true)           -> execute
--   If, Why not executed                -> why_not_executed
--   Created                             -> created_at
--   Conviction Score                    -> conviction_score
-- ============================================================

-- Voorbeeld template — vul aan voor elke case in de CSV:
/*
INSERT INTO public.cases (
  trading_id, company_name, status, ticker,
  date_of_case, sector, industry, country_of_incorporation,
  current_price_at_case, week_52_high, week_52_low, analyst_1y_price_target,
  event_summary, event_type, event_classification, impact_of_news, initial_market_assessment,
  catalyst_1, catalyst_2, catalyst_3, catalyst_4, trigger_score,
  risk_1, risk_2, risk_3, risk_4,
  business_model_explanation, key_products_services, business_model_outlook, earnings_quality,
  competitive_advantage, competitive_advantage_defined, market_position,
  esg_governance_quality_score, esg_governance_explanation,
  net_debt_ebitda, fundamental_score,
  current_pe, forward_pe, ev_ebitda, current_vs_historical_multiples,
  top_3_competitors, prior_valuation_assessment, eps, operating_margin, layered_fcf_ttm,
  valuation_score,
  primary_trend, overall_chart_assessment, tradingview_ta_score, technical_score,
  direction, entry_price_target, take_profit, stop_loss, leverage,
  risk_reward_ratio, expected_holding_period_months,
  total_score, confidence_score, execute, why_not_executed, conviction_score
) VALUES (
  'TID-0001', 'Example Co.', 'Active', 'EXM',
  '2026-01-15', 'Technology', 'Software', 'US',
  100.00, 125.00, 80.00, 130.00,
  'Q4 earnings beat', 'Earnings', 'Positive', 'Stock up 8% after-hours', 'Beat on revenue and EPS, raised guidance.',
  'New product launch', 'Margin expansion', 'Buyback program', NULL, 6,
  'High customer concentration', 'Regulatory risk', NULL, NULL,
  'SaaS subscription', 'Platform + add-ons', 'Continued growth via AI features', 'High quality, recurring',
  'Yes', 'Network effects and switching costs', 'Leader in vertical SaaS',
  8, 'Strong independent board',
  '2.1x', 8,
  28.5, 24.0, 18.0, 'Slight premium to 5y avg',
  'A, B, C', 'In line with peers', '3.50', '22%', '€1.2B',
  6,
  'Up', 'Strong uptrend, breakout above resistance', 4.2, 5,
  'Long', 105.00, 130.00, 92.00, 1,
  2.5, 6,
  31, 8, true, NULL, 8
)
ON CONFLICT (trading_id) DO UPDATE SET
  company_name              = EXCLUDED.company_name,
  status                    = EXCLUDED.status,
  ticker                    = EXCLUDED.ticker,
  date_of_case              = EXCLUDED.date_of_case,
  sector                    = EXCLUDED.sector,
  industry                  = EXCLUDED.industry,
  country_of_incorporation  = EXCLUDED.country_of_incorporation,
  current_price_at_case     = EXCLUDED.current_price_at_case,
  week_52_high              = EXCLUDED.week_52_high,
  week_52_low               = EXCLUDED.week_52_low,
  analyst_1y_price_target   = EXCLUDED.analyst_1y_price_target,
  event_summary             = EXCLUDED.event_summary,
  event_type                = EXCLUDED.event_type,
  event_classification      = EXCLUDED.event_classification,
  impact_of_news            = EXCLUDED.impact_of_news,
  initial_market_assessment = EXCLUDED.initial_market_assessment,
  catalyst_1                = EXCLUDED.catalyst_1,
  catalyst_2                = EXCLUDED.catalyst_2,
  catalyst_3                = EXCLUDED.catalyst_3,
  catalyst_4                = EXCLUDED.catalyst_4,
  trigger_score             = EXCLUDED.trigger_score,
  risk_1                    = EXCLUDED.risk_1,
  risk_2                    = EXCLUDED.risk_2,
  risk_3                    = EXCLUDED.risk_3,
  risk_4                    = EXCLUDED.risk_4,
  business_model_explanation = EXCLUDED.business_model_explanation,
  key_products_services     = EXCLUDED.key_products_services,
  business_model_outlook    = EXCLUDED.business_model_outlook,
  earnings_quality          = EXCLUDED.earnings_quality,
  competitive_advantage     = EXCLUDED.competitive_advantage,
  competitive_advantage_defined = EXCLUDED.competitive_advantage_defined,
  market_position           = EXCLUDED.market_position,
  esg_governance_quality_score = EXCLUDED.esg_governance_quality_score,
  esg_governance_explanation = EXCLUDED.esg_governance_explanation,
  net_debt_ebitda           = EXCLUDED.net_debt_ebitda,
  fundamental_score         = EXCLUDED.fundamental_score,
  current_pe                = EXCLUDED.current_pe,
  forward_pe                = EXCLUDED.forward_pe,
  ev_ebitda                 = EXCLUDED.ev_ebitda,
  current_vs_historical_multiples = EXCLUDED.current_vs_historical_multiples,
  top_3_competitors         = EXCLUDED.top_3_competitors,
  prior_valuation_assessment = EXCLUDED.prior_valuation_assessment,
  eps                       = EXCLUDED.eps,
  operating_margin          = EXCLUDED.operating_margin,
  layered_fcf_ttm           = EXCLUDED.layered_fcf_ttm,
  valuation_score           = EXCLUDED.valuation_score,
  primary_trend             = EXCLUDED.primary_trend,
  overall_chart_assessment  = EXCLUDED.overall_chart_assessment,
  tradingview_ta_score      = EXCLUDED.tradingview_ta_score,
  technical_score           = EXCLUDED.technical_score,
  direction                 = EXCLUDED.direction,
  entry_price_target        = EXCLUDED.entry_price_target,
  take_profit               = EXCLUDED.take_profit,
  stop_loss                 = EXCLUDED.stop_loss,
  leverage                  = EXCLUDED.leverage,
  risk_reward_ratio         = EXCLUDED.risk_reward_ratio,
  expected_holding_period_months = EXCLUDED.expected_holding_period_months,
  total_score               = EXCLUDED.total_score,
  confidence_score          = EXCLUDED.confidence_score,
  execute                   = EXCLUDED.execute,
  why_not_executed          = EXCLUDED.why_not_executed,
  conviction_score          = EXCLUDED.conviction_score;
*/
