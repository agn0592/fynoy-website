import type { RiskMetricsResult } from '@/lib/risk-metrics'

interface Props {
  metrics: RiskMetricsResult | null
  inceptionDate: string
  rfSource: string                 // e.g. '10Y German Bund'
  rfStale: boolean                 // true if no recent R_f data
  benchmarkLabel: string           // e.g. 'VWCE'
}

function pct(v: number, opts: { signed?: boolean; digits?: number } = {}) {
  const digits = opts.digits ?? 2
  const sign = opts.signed && v >= 0 ? '+' : ''
  return `${sign}${(v * 100).toFixed(digits)}%`
}

function num(v: number, digits = 2) {
  return v.toFixed(digits)
}

function cls(v: number): 'up' | 'dn' | 'flat' {
  if (v > 0) return 'up'
  if (v < 0) return 'dn'
  return 'flat'
}

export default function RiskAdjustedReturn({ metrics, inceptionDate, rfSource, rfStale, benchmarkLabel }: Props) {
  if (!metrics) {
    return (
      <div className="dash-card">
        <div className="dash-card-header">
          <div>
            <div className="dash-card-title">Risk-adjusted Return</div>
            <div className="dash-card-sub">Capped M² · since {inceptionDate}</div>
          </div>
        </div>
        <div className="dash-card-body">
          <p style={{ color: 'var(--ink-dim)', fontSize: 13, margin: 0 }}>
            Not enough data to compute M² yet. We need at least two days with
            both a portfolio return and a valid benchmark value.
          </p>
        </div>
      </div>
    )
  }

  const m2Cls = cls(metrics.m2 - metrics.benchmarkReturnAnnual)
  const alphaCls = cls(metrics.m2Alpha)
  const sharpeCls = cls(metrics.sharpeRatio)

  return (
    <div className="dash-card">
      <div className="dash-card-header">
        <div>
          <div className="dash-card-title">Risk-adjusted Return</div>
          <div className="dash-card-sub">
            Capped M² · since {inceptionDate} · {metrics.sampleSize} trading days
          </div>
        </div>
      </div>

      <div className="risk-adj-grid">
        <div className={`risk-adj-cell risk-adj-cell--primary`}>
          <div className="risk-adj-label">M²</div>
          <div className={`risk-adj-val ${m2Cls}`}>{pct(metrics.m2)}</div>
          <div className="risk-adj-sub">annualized</div>
          <div className={`dash-stat-glow ${m2Cls}`} />
        </div>

        <div className="risk-adj-cell">
          <div className="risk-adj-label">M² alpha <span className="risk-adj-mute">vs {benchmarkLabel}</span></div>
          <div className={`risk-adj-val ${alphaCls}`}>{pct(metrics.m2Alpha, { signed: true })}</div>
          <div className="risk-adj-sub">true outperformance</div>
          <div className={`dash-stat-glow ${alphaCls}`} />
        </div>

        <div className="risk-adj-cell">
          <div className="risk-adj-label">Sharpe ratio</div>
          <div className={`risk-adj-val ${sharpeCls}`}>{num(metrics.sharpeRatio)}</div>
          <div className="risk-adj-sub">return per unit of risk</div>
          <div className={`dash-stat-glow ${sharpeCls}`} />
        </div>

        <div className="risk-adj-cell">
          <div className="risk-adj-label">σ portfolio</div>
          <div className="risk-adj-val flat">{pct(metrics.portfolioVolAnnual)}</div>
          <div className="risk-adj-sub">your volatility / yr</div>
        </div>

        <div className="risk-adj-cell">
          <div className="risk-adj-label">σ {benchmarkLabel}</div>
          <div className="risk-adj-val flat">{pct(metrics.benchmarkVolAnnual)}</div>
          <div className="risk-adj-sub">market volatility / yr</div>
        </div>

        <div className="risk-adj-cell">
          <div className="risk-adj-label">R<sub>f</sub> <span className="risk-adj-mute">{rfSource}</span></div>
          <div className="risk-adj-val flat">{pct(metrics.riskFreeAnnualUsed)}</div>
          <div className="risk-adj-sub">
            {rfStale ? 'data is stale' : 'risk-free rate'}
          </div>
        </div>
      </div>

      {(metrics.capActive || metrics.volFloorActive) && (
        <div className="risk-adj-flags">
          {metrics.volFloorActive && (
            <span className="risk-adj-flag">⚠ portfolio volatility below floor — M² has been smoothed</span>
          )}
          {metrics.capActive && (
            <span className="risk-adj-flag">⚠ scaling ratio σ<sub>b</sub>/σ<sub>p</sub> hit the cap (×3)</span>
          )}
        </div>
      )}

      <div className="risk-adj-explain">
        <h3 className="risk-adj-h3">What is M²?</h3>
        <p>
          The <strong>M² measure</strong> (Modigliani–Modigliani) is the gold standard for measuring risk-adjusted
          return, developed by Nobel laureate Franco Modigliani in 1997. It hypothetically rescales the portfolio so
          that it would have the same volatility as the market (in our case {benchmarkLabel}), and then computes the
          return that would have been achieved under those conditions.
        </p>
        <p>
          Compare the M² value directly with the {benchmarkLabel} return: if M² is higher, the portfolio is
          <em> risk-adjusted</em> beating the market. If it&apos;s lower, the extra return only came from taking on
          more risk.
        </p>

        <h3 className="risk-adj-h3">How to read it</h3>
        <p>
          Right now M² is <strong>{pct(metrics.m2)}</strong> per year, against a {benchmarkLabel} return of
          <strong> {pct(metrics.benchmarkReturnAnnual)}</strong>. The gap — the
          <strong> M² alpha</strong> of <strong>{pct(metrics.m2Alpha, { signed: true })}</strong> — is what we
          genuinely add after accounting for risk. A plain alpha (return minus benchmark) does not adjust for how
          much risk was taken to get there; M² does.
        </p>

        <h3 className="risk-adj-h3">The formula</h3>
        <p className="risk-adj-formula">
          M² = (R<sub>p</sub> − R<sub>f</sub>) × min(σ<sub>b</sub> / σ<sub>p</sub>, 3) + R<sub>f</sub>
        </p>
        <p>
          We use a <strong>cap</strong> of 3 on the σ<sub>b</sub>/σ<sub>p</sub> ratio and a volatility floor — the
          Capped M² variant used by B&amp;R Beurs Erasmus Investment Society in its weekly ranking. This prevents
          absurd outcomes when a portfolio has almost no volatility (dividing by near-zero).
        </p>

        <h3 className="risk-adj-h3">Per metric</h3>
        <dl className="risk-adj-dl">
          <dt>M²</dt>
          <dd>Risk-adjusted annualized return, in percent. Directly comparable with the benchmark.</dd>
          <dt>M² alpha</dt>
          <dd>M² minus the benchmark return. Positive = beating the market after adjusting for risk.</dd>
          <dt>Sharpe ratio</dt>
          <dd>Excess return per unit of volatility: (R<sub>p</sub> − R<sub>f</sub>) / σ<sub>p</sub>. Dimensionless.</dd>
          <dt>σ portfolio</dt>
          <dd>Annualized standard deviation of daily portfolio returns. Higher = riskier.</dd>
          <dt>σ {benchmarkLabel}</dt>
          <dd>Same, but for the benchmark — the market volatility we scale against.</dd>
          <dt>R<sub>f</sub></dt>
          <dd>Risk-free rate: the yield on the 10-year German Bund. What you can get without taking risk.</dd>
        </dl>

        <p className="risk-adj-credit">
          Methodology: <a href="https://en.wikipedia.org/wiki/Modigliani_risk-adjusted_performance" target="_blank" rel="noopener noreferrer">Modigliani &amp; Modigliani (1997)</a>,
          variant as used by <a href="https://bnrbeurs.nl/investment-competition/competition-rules" target="_blank" rel="noopener noreferrer">B&amp;R Beurs Erasmus</a>.
        </p>
      </div>
    </div>
  )
}
