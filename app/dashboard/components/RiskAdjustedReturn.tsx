import type { RiskMetricsResult } from '@/lib/risk-metrics'

interface Props {
  metrics: RiskMetricsResult | null
  inceptionDate: string
  rfSource: string                 // e.g. '10Y Duitse Bund'
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
            <div className="dash-card-title">Risico-gecorrigeerd Rendement</div>
            <div className="dash-card-sub">Capped M² · sinds {inceptionDate}</div>
          </div>
        </div>
        <div className="dash-card-body">
          <p style={{ color: 'var(--ink-dim)', fontSize: 13, margin: 0 }}>
            Onvoldoende data om M² te berekenen. Er zijn minimaal twee dagen met
            zowel een portfolio-return als een geldige benchmarkwaarde nodig.
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
          <div className="dash-card-title">Risico-gecorrigeerd Rendement</div>
          <div className="dash-card-sub">
            Capped M² · sinds {inceptionDate} · {metrics.sampleSize} handelsdagen
          </div>
        </div>
      </div>

      <div className="risk-adj-grid">
        <div className={`risk-adj-cell risk-adj-cell--primary`}>
          <div className="risk-adj-label">M²</div>
          <div className={`risk-adj-val ${m2Cls}`}>{pct(metrics.m2)}</div>
          <div className="risk-adj-sub">geannualiseerd</div>
          <div className={`dash-stat-glow ${m2Cls}`} />
        </div>

        <div className="risk-adj-cell">
          <div className="risk-adj-label">M² alpha <span className="risk-adj-mute">vs {benchmarkLabel}</span></div>
          <div className={`risk-adj-val ${alphaCls}`}>{pct(metrics.m2Alpha, { signed: true })}</div>
          <div className="risk-adj-sub">echte outperformance</div>
          <div className={`dash-stat-glow ${alphaCls}`} />
        </div>

        <div className="risk-adj-cell">
          <div className="risk-adj-label">Sharpe ratio</div>
          <div className={`risk-adj-val ${sharpeCls}`}>{num(metrics.sharpeRatio)}</div>
          <div className="risk-adj-sub">rendement per eenheid risico</div>
          <div className={`dash-stat-glow ${sharpeCls}`} />
        </div>

        <div className="risk-adj-cell">
          <div className="risk-adj-label">σ portefeuille</div>
          <div className="risk-adj-val flat">{pct(metrics.portfolioVolAnnual)}</div>
          <div className="risk-adj-sub">jouw volatiliteit p.j.</div>
        </div>

        <div className="risk-adj-cell">
          <div className="risk-adj-label">σ {benchmarkLabel}</div>
          <div className="risk-adj-val flat">{pct(metrics.benchmarkVolAnnual)}</div>
          <div className="risk-adj-sub">markt-volatiliteit p.j.</div>
        </div>

        <div className="risk-adj-cell">
          <div className="risk-adj-label">R<sub>f</sub> <span className="risk-adj-mute">{rfSource}</span></div>
          <div className="risk-adj-val flat">{pct(metrics.riskFreeAnnualUsed)}</div>
          <div className="risk-adj-sub">
            {rfStale ? 'gegevens verouderd' : 'risicovrije rente'}
          </div>
        </div>
      </div>

      {(metrics.capActive || metrics.volFloorActive) && (
        <div className="risk-adj-flags">
          {metrics.volFloorActive && (
            <span className="risk-adj-flag">⚠ portfolio-volatiliteit onder floor — M² is afgevlakt</span>
          )}
          {metrics.capActive && (
            <span className="risk-adj-flag">⚠ schaalratio σ<sub>b</sub>/σ<sub>p</sub> bereikte de cap (×3)</span>
          )}
        </div>
      )}

      <div className="risk-adj-explain">
        <h3 className="risk-adj-h3">Wat is M²?</h3>
        <p>
          De <strong>M²-maatstaf</strong> (Modigliani–Modigliani) is de gouden standaard voor het meten van risico-gecorrigeerd
          rendement, ontwikkeld door Nobelprijswinnaar Franco Modigliani in 1997. Hij schaalt jouw portefeuille
          hypothetisch zodat hij dezelfde volatiliteit zou hebben als de markt (in ons geval {benchmarkLabel}), en
          berekent vervolgens welk rendement er onder die voorwaarde zou zijn behaald.
        </p>
        <p>
          Vergelijk de M²-waarde direct met het {benchmarkLabel}-rendement: ligt M² hoger, dan presteer je
          <em> risico-gecorrigeerd</em> beter dan de markt. Ligt hij lager, dan heb je je extra rendement
          alleen behaald door meer risico te nemen.
        </p>

        <h3 className="risk-adj-h3">Hoe lees je het?</h3>
        <p>
          Op dit moment is jouw M² <strong>{pct(metrics.m2)}</strong> per jaar, tegen een {benchmarkLabel}-rendement
          van <strong>{pct(metrics.benchmarkReturnAnnual)}</strong>. Het verschil — de
          <strong> M² alpha</strong> van <strong>{pct(metrics.m2Alpha, { signed: true })}</strong> — is wat je daadwerkelijk
          toevoegt nadat je risico is verrekend. Een gewone alpha (rendement minus benchmark) houdt geen rekening met
          hoeveel risico je hebt genomen om dat rendement te bereiken; M² wel.
        </p>

        <h3 className="risk-adj-h3">De formule</h3>
        <p className="risk-adj-formula">
          M² = (R<sub>p</sub> − R<sub>f</sub>) × min(σ<sub>b</sub> / σ<sub>p</sub>, 3) + R<sub>f</sub>
        </p>
        <p>
          We gebruiken een <strong>cap</strong> van 3 op de verhouding σ<sub>b</sub>/σ<sub>p</sub> en een
          volatiliteits-floor, conform de Capped M²-variant die B&amp;R Beurs Erasmus Investment Society hanteert in
          haar wekelijkse ranking. Dit voorkomt absurde uitkomsten wanneer een portefeuille bijna geen volatiliteit
          vertoont (delen door bijna nul).
        </p>

        <h3 className="risk-adj-h3">Per metric</h3>
        <dl className="risk-adj-dl">
          <dt>M²</dt>
          <dd>Risico-gecorrigeerd geannualiseerd rendement, in procenten. Direct vergelijkbaar met de benchmark.</dd>
          <dt>M² alpha</dt>
          <dd>M² minus het benchmark-rendement. Positief = je verslaat de markt na risico-correctie.</dd>
          <dt>Sharpe ratio</dt>
          <dd>Excess return per eenheid volatiliteit: (R<sub>p</sub> − R<sub>f</sub>) / σ<sub>p</sub>. Dimensieloos.</dd>
          <dt>σ portefeuille</dt>
          <dd>Geannualiseerde standaarddeviatie van dagelijkse portfolio-returns. Hoe hoger, hoe risicovoller.</dd>
          <dt>σ {benchmarkLabel}</dt>
          <dd>Idem maar voor de benchmark — de marktvolatiliteit waar we tegen schalen.</dd>
          <dt>R<sub>f</sub></dt>
          <dd>Risicovrije rente: het rendement op de 10-jaars Duitse Bund. Wat je &apos;gratis&apos; kunt krijgen zonder risico.</dd>
        </dl>

        <p className="risk-adj-credit">
          Methodiek: <a href="https://en.wikipedia.org/wiki/Modigliani_risk-adjusted_performance" target="_blank" rel="noopener noreferrer">Modigliani &amp; Modigliani (1997)</a>,
          variant zoals gebruikt door <a href="https://bnrbeurs.nl/investment-competition/competition-rules" target="_blank" rel="noopener noreferrer">B&amp;R Beurs Erasmus</a>.
        </p>
      </div>
    </div>
  )
}
