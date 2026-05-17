import {
  IconBook, IconChart, IconBriefcase, IconShield, IconHelp,
  IconTrendingUp, IconAlertCircle, IconStar,
} from '@/app/dashboard/components/Icons'

import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Insights' }

// ───────────────────────────────────────────────────────────────────
// Static educational content for members.
// Pure server component — no interactivity beyond <details>/<summary>.
// ───────────────────────────────────────────────────────────────────

interface MetricEntry {
  name: string
  short: string
  body: string
  example: string
}

const METRICS: MetricEntry[] = [
  {
    name: 'TWR — Time-Weighted Return',
    short: 'Return that strips out the timing of deposits & withdrawals.',
    body:
      'TWR measures pure investment performance by linking together daily returns regardless of when capital flows in or out. ' +
      'It is the industry standard for comparing portfolios because it isolates manager skill from member cash decisions.',
    example: 'If the portfolio is up 4% on a day you deposit €10,000, that deposit does not inflate the TWR for that day.',
  },
  {
    name: 'Alpha (α)',
    short: 'Excess return over the benchmark, after adjusting for risk.',
    body:
      'Alpha is the portion of return that cannot be explained by simply moving with the market. A positive alpha means we have outperformed ' +
      'a passive benchmark holding (VWCE) over the same period.',
    example: 'If our TWR is +12% and VWCE returned +9%, alpha is roughly +3%.',
  },
  {
    name: 'Sharpe Ratio',
    short: 'Return per unit of total risk.',
    body:
      'Sharpe divides excess return by the standard deviation of returns. A higher Sharpe means we are getting more reward for each unit ' +
      'of volatility taken on. Above 1.0 is considered solid; above 2.0 is exceptional.',
    example: 'A 15% return with 10% volatility produces a Sharpe of ~1.5 (assuming 0% risk-free rate).',
  },
  {
    name: 'Sortino Ratio',
    short: 'Like Sharpe, but only penalises downside volatility.',
    body:
      'Sortino is a refinement of Sharpe that ignores upside volatility — because gains are not risk. It is a more honest measure of pain ' +
      'taken to achieve a return. Above 1.5 is healthy; above 3.0 is exceptional.',
    example: 'A portfolio that swings sharply higher but rarely lower will have a Sortino much higher than its Sharpe.',
  },
  {
    name: 'Max Drawdown',
    short: 'Largest peak-to-trough loss over the period.',
    body:
      'The deepest valley the portfolio has fallen into from any prior high. A critical psychological metric — it tells you the worst ' +
      'historical pain you would have endured by staying invested.',
    example: 'If the portfolio peaks at €120k and falls to €96k before recovering, max drawdown is −20%.',
  },
  {
    name: 'Volatility (σ)',
    short: 'Annualised standard deviation of daily returns.',
    body:
      'A statistical measure of how much returns vary day to day, scaled to a year. Higher volatility means a wilder ride. ' +
      'Concentrated equity portfolios typically run 15-25% annual volatility.',
    example: 'Daily standard deviation of 1% scales to roughly 16% annual volatility.',
  },
  {
    name: 'Beta (β)',
    short: 'Sensitivity to market movements.',
    body:
      'A beta of 1.0 means the portfolio moves in lock-step with the market. Above 1.0 is more aggressive; below 1.0 is more defensive. ' +
      'Beta does not measure skill — only directional exposure.',
    example: 'A beta of 1.3 means when VWCE moves +1%, the portfolio tends to move +1.3%.',
  },
  {
    name: 'Conviction Score',
    short: 'How strongly we believe in the thesis (1-10).',
    body:
      'A proprietary rating combining quality of fundamentals, clarity of catalyst, valuation support, and risk asymmetry. ' +
      'Higher conviction generally maps to larger position sizing.',
    example: 'A 9/10 conviction stock might be sized at 8% of NAV; a 6/10 at 3%.',
  },
  {
    name: 'Trigger Score',
    short: 'How close a setup is to the planned entry zone (1-10).',
    body:
      'Measures technical and fundamental readiness independent of conviction. A high conviction idea can have a low trigger score if ' +
      'price has already run; we wait for it to come back.',
    example: 'Conviction 9, trigger 4 → on the watchlist, not in the book.',
  },
  {
    name: 'Risk / Reward Ratio',
    short: 'Distance to take-profit divided by distance to stop-loss.',
    body:
      'A position with €1 of downside and €3 of upside has a 3:1 ratio. We require at least 2:1 on new entries and prefer 3:1 or better. ' +
      'It is a forward-looking estimate, not a guarantee.',
    example: 'Entry €100, stop €92, target €124 → risk €8, reward €24, ratio 3:1.',
  },
]

interface DashboardGuideEntry {
  icon: React.ReactNode
  title: string
  body: string
}

const DASHBOARD_GUIDE: DashboardGuideEntry[] = [
  {
    icon: <IconChart />,
    title: 'Performance chart',
    body:
      'The solid gold line is our portfolio indexed to 0% at the start of the selected window. The dashed grey line is VWCE — our ' +
      'global-equity benchmark. The gap between them is our alpha.',
  },
  {
    icon: <IconBriefcase />,
    title: 'Open positions table',
    body:
      'Each row shows a live holding: symbol, portfolio weight, and unrealised return. Click a row to expand the underlying case note — ' +
      'the thesis, entry plan, take-profit and stop-loss levels.',
  },
  {
    icon: <IconTrendingUp />,
    title: 'Coloured badges',
    body:
      'Green badges indicate positive returns or upside, red badges indicate losses or downside, and gold badges signal a benchmark, ' +
      'target, or status marker. They share the same scale across every screen.',
  },
  {
    icon: <IconShield />,
    title: 'Risk metrics',
    body:
      'Win rate, average return, average holding period, best and worst trade — all computed from closed positions only. ' +
      'These tell you whether the long-term process is working, separate from short-term mark-to-market noise.',
  },
  {
    icon: <IconStar />,
    title: 'Watchlist & alerts',
    body:
      'Your watchlist is private to your browser. Add symbols you are researching, set an optional target price, and the daily change ' +
      'will tell you when the setup is approaching your level.',
  },
]

interface FaqEntry { q: string; a: string }

const FAQS: FaqEntry[] = [
  {
    q: 'Why do you use VWCE as the benchmark?',
    a:
      'VWCE (Vanguard FTSE All-World ETF) is the cleanest, lowest-cost global equity benchmark available to a European retail investor. ' +
      'It covers roughly 3,700 stocks across developed and emerging markets. If we cannot consistently beat the cost of simply buying ' +
      'VWCE, an active strategy is not justified — and we want to be held to that bar publicly.',
  },
  {
    q: 'How is daily TWR calculated?',
    a:
      'Each day we take the change in portfolio value, neutralise any deposits or withdrawals, and divide by the prior day\'s capital. ' +
      'Daily TWRs are then chain-linked geometrically (multiplied together) to produce cumulative TWR over any window. ' +
      'This is the same methodology used by professional fund administrators.',
  },
  {
    q: 'What is the conviction score and how is it used?',
    a:
      'Conviction is a 1-10 internal rating combining fundamentals, catalyst clarity, valuation, and downside protection. It directly ' +
      'informs position sizing: higher conviction earns more capital, capped at ~10% of NAV per name. A low-conviction idea will never ' +
      'become a large position regardless of how attractive the chart looks.',
  },
  {
    q: 'How often is portfolio data synced?',
    a:
      'Positions and trades are pulled from Interactive Brokers at end-of-day. Live prices on the dashboard refresh during market hours ' +
      'from a market data provider. The portfolio snapshot used for TWR is taken once daily after the US close.',
  },
  {
    q: 'Why do you publish stop-loss levels publicly?',
    a:
      'Transparency is the entire point of this project. We would rather show you exactly where we plan to exit — and then live with that ' +
      'plan — than hide our risk management. Publishing the stop is also a commitment device: it makes it harder for us to widen the stop ' +
      'in the heat of the moment.',
  },
  {
    q: 'Can I copy the trades directly?',
    a:
      'You can, but we do not recommend it. Position sizing has to match your own capital, risk tolerance, and tax situation. ' +
      'Use the dashboard as a research feed and a discipline benchmark, not as a blind signal service. We do not give personal advice ' +
      'and we are not your financial advisor.',
  },
  {
    q: 'What happens when a position is closed?',
    a:
      'The position moves from Open Positions to Trade History with full realised P&L. We then publish a post-trade reflection — ' +
      'did the thesis play out, what we got right, what we missed. The closed-trade reflection is the most important part of our ' +
      'feedback loop and the main reason this dashboard exists at all.',
  },
]

export default function InsightsPage() {
  return (
    <>
      <div className="dash-page-head">
        <div className="dash-page-title-block">
          <h1 className="dash-page-title">
            Insights <em>& Knowledge</em>
          </h1>
          <div className="dash-page-sub">
            Understanding our portfolio philosophy and metrics.
          </div>
        </div>
      </div>

      {/* ── Investment philosophy ─────────────────────────────────── */}
      <section style={{ marginBottom: 20 }}>
        <div className="dash-section-sep">Investment philosophy</div>
        <div className="dash-card">
          <div className="dash-card-header">
            <div>
              <div className="dash-card-title">How we think about capital</div>
              <div className="dash-card-sub">From the desk of Fynoy Capital</div>
            </div>
          </div>
          <div className="dash-card-body" style={{ paddingTop: 16 }}>
            <p style={{
              fontFamily: 'var(--serif)', fontSize: 18, fontStyle: 'italic',
              color: 'var(--gold)', lineHeight: 1.6, margin: '0 0 24px',
              paddingLeft: 16, borderLeft: '2px solid var(--gold)',
            }}>
              We invest with our own money, in the open. Our mistakes are real, and so are our wins.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, color: 'var(--ink-mute)', fontSize: 14, lineHeight: 1.8 }}>
              <p style={{ margin: 0 }}>
                Our approach starts from one stubborn idea: <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>long-term ownership of
                great businesses</strong> outperforms almost everything else over a full cycle. We are not traders chasing momentum; we are
                researchers underwriting companies. A typical position is held for six to thirty-six months, and we are happy to do nothing
                for weeks at a time when nothing on our watchlist trades at a price we like.
              </p>
              <p style={{ margin: 0 }}>
                Every position begins with a written case: revenue quality, competitive moat, balance-sheet strength, management track
                record, valuation framework, and a clear set of catalysts. We size by conviction — never by emotion or recent performance —
                and we cap any single name at roughly <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>10% of NAV</strong>. The
                portfolio rarely holds more than fifteen positions because we want to know each holding deeply, not vaguely.
              </p>
              <p style={{ margin: 0 }}>
                Above all, we are committed to <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>radical transparency</strong>. Every
                entry, every exit, every stop-loss is published in this dashboard before or as it happens. We post the losers as loudly as
                the winners. We believe that is the only honest way to demonstrate skill — and the only way to give you something genuinely
                useful, rather than a curated highlight reel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Metric glossary ───────────────────────────────────────── */}
      <section style={{ marginBottom: 20 }}>
        <div className="dash-section-sep">Metric definitions</div>
        <div className="dash-card">
          <div className="dash-card-header">
            <div>
              <div className="dash-card-title">A glossary for the numbers you see</div>
              <div className="dash-card-sub">Ten metrics, ten plain-English definitions</div>
            </div>
            <span style={{ color: 'var(--gold)', display: 'flex' }}>
              <IconBook />
            </span>
          </div>
          <div className="dash-card-body" style={{ paddingTop: 16 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 20,
            }}>
              {METRICS.map((m) => (
                <div key={m.name} style={{
                  padding: '16px 18px',
                  background: 'rgba(232,228,220,0.02)',
                  border: '1px solid var(--line)',
                  borderRadius: 2,
                  borderLeft: '2px solid var(--gold)',
                }}>
                  <div style={{
                    fontFamily: 'var(--serif)', fontSize: 15, fontWeight: 500,
                    color: 'var(--ink)', marginBottom: 4, letterSpacing: '-0.005em',
                  }}>
                    {m.name}
                  </div>
                  <div style={{
                    fontSize: 11, color: 'var(--gold)', marginBottom: 10,
                    letterSpacing: '0.04em',
                  }}>
                    {m.short}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--ink-mute)', lineHeight: 1.65, marginBottom: 10 }}>
                    {m.body}
                  </div>
                  <div style={{
                    fontSize: 12, color: 'var(--ink-dim)', lineHeight: 1.55,
                    fontStyle: 'italic', fontFamily: 'var(--serif)',
                    paddingTop: 10, borderTop: '1px solid var(--line)',
                  }}>
                    <span style={{
                      fontFamily: 'var(--sans)', fontStyle: 'normal',
                      fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase',
                      color: 'var(--ink-dim)', marginRight: 8,
                    }}>
                      Example
                    </span>
                    {m.example}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Reading the dashboard ─────────────────────────────────── */}
      <section style={{ marginBottom: 20 }}>
        <div className="dash-section-sep">Reading the dashboard</div>
        <div className="dash-card">
          <div className="dash-card-header">
            <div>
              <div className="dash-card-title">A visual guide</div>
              <div className="dash-card-sub">What each card means, at a glance</div>
            </div>
            <span style={{ color: 'var(--gold)', display: 'flex' }}>
              <IconChart />
            </span>
          </div>
          <div className="dash-card-body" style={{ paddingTop: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {DASHBOARD_GUIDE.map((entry, idx) => (
                <div key={entry.title} style={{
                  display: 'grid',
                  gridTemplateColumns: '44px 1fr',
                  gap: 16,
                  padding: '16px 0',
                  borderBottom: idx < DASHBOARD_GUIDE.length - 1 ? '1px solid var(--line)' : 'none',
                }}>
                  <div style={{
                    width: 36, height: 36,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--gold)',
                    border: '1px solid var(--gold-line)',
                    borderRadius: 2,
                    flexShrink: 0,
                  }}>
                    {entry.icon}
                  </div>
                  <div>
                    <div style={{
                      fontFamily: 'var(--serif)', fontSize: 15, fontWeight: 500,
                      color: 'var(--ink)', marginBottom: 6,
                    }}>
                      {entry.title}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--ink-mute)', lineHeight: 1.65 }}>
                      {entry.body}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────── */}
      <section style={{ marginBottom: 20 }}>
        <div className="dash-section-sep">Frequently asked</div>
        <div className="dash-card">
          <div className="dash-card-header">
            <div>
              <div className="dash-card-title">Member questions, answered</div>
              <div className="dash-card-sub">Click each question to expand the answer</div>
            </div>
            <span style={{ color: 'var(--gold)', display: 'flex' }}>
              <IconHelp />
            </span>
          </div>
          <div className="dash-card-body" style={{ paddingTop: 8 }}>
            {FAQS.map((faq, idx) => (
              <details
                key={faq.q}
                style={{
                  borderBottom: idx < FAQS.length - 1 ? '1px solid var(--line)' : 'none',
                  padding: '14px 0',
                }}
              >
                <summary style={{
                  cursor: 'pointer',
                  listStyle: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  fontFamily: 'var(--serif)',
                  fontSize: 15,
                  color: 'var(--ink)',
                  fontWeight: 500,
                  letterSpacing: '-0.005em',
                  padding: '6px 0',
                  minHeight: 40,
                  userSelect: 'none',
                }}>
                  <span style={{ flex: 1 }}>{faq.q}</span>
                  <span style={{
                    color: 'var(--gold)',
                    fontSize: 18,
                    fontWeight: 300,
                    width: 24, height: 24,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    +
                  </span>
                </summary>
                <div style={{
                  fontSize: 13.5,
                  color: 'var(--ink-mute)',
                  lineHeight: 1.75,
                  paddingTop: 10,
                  paddingRight: 36,
                }}>
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer note ──────────────────────────────────────────── */}
      <div className="dash-alert" style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span style={{ color: 'var(--gold)', display: 'flex', flexShrink: 0, marginTop: 2 }}>
            <IconAlertCircle />
          </span>
          <div>
            <div className="dash-alert-title">A note on this content</div>
            <div className="dash-alert-body">
              Nothing in this dashboard constitutes personal financial advice. All metrics shown are
              historical, computed from our own trading account, and offered for educational purposes
              within the Fynoy Capital research community.
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
