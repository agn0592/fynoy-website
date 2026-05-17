import type { AdvancedMetrics as AdvancedMetricsShape } from '@/lib/analytics'
import { fmtRatio } from '@/lib/analytics'
import InfoTooltip from './InfoTooltip'

interface AdvancedMetricsProps {
  metrics: AdvancedMetricsShape
}

function ratioTier(v: number): 'up' | 'flat' | 'dn' {
  if (!isFinite(v)) return 'flat'
  if (v >= 1.5) return 'up'
  if (v >= 0.5) return 'flat'
  return 'dn'
}

export default function AdvancedMetrics({ metrics }: AdvancedMetricsProps) {
  const sharpeCls = ratioTier(metrics.sharpeRatio)
  const sortinoCls = ratioTier(metrics.sortinoRatio)
  const calmarCls = ratioTier(metrics.calmarRatio)

  return (
    <div className="dash-card">
      <div className="dash-card-header">
        <div>
          <div className="dash-card-title">Advanced Metrics</div>
          <div className="dash-card-sub">Risk-adjusted performance</div>
        </div>
      </div>
      <div className="dash-stats-stack" style={{ marginTop: 12 }}>
        <div className="dash-stat-cell">
          <div className="dash-stat-label">
            Sharpe Ratio
            <InfoTooltip term="sharpe" />
          </div>
          <div className={`dash-stat-val ${sharpeCls}`}>{fmtRatio(metrics.sharpeRatio)}</div>
          <div className="dash-stat-sub">Annualized</div>
          <div className={`dash-stat-glow ${sharpeCls}`} />
        </div>
        <div className="dash-stat-cell">
          <div className="dash-stat-label">
            Sortino Ratio
            <InfoTooltip term="sortino" />
          </div>
          <div className={`dash-stat-val ${sortinoCls}`}>{fmtRatio(metrics.sortinoRatio)}</div>
          <div className="dash-stat-sub">Downside only</div>
          <div className={`dash-stat-glow ${sortinoCls}`} />
        </div>
        <div className="dash-stat-cell">
          <div className="dash-stat-label">
            Volatility
            <InfoTooltip term="volatility" />
          </div>
          <div className="dash-stat-val flat">{metrics.volatilityPct.toFixed(2)}%</div>
          <div className="dash-stat-sub">Annualized</div>
          <div className="dash-stat-glow flat" />
        </div>
        <div className="dash-stat-cell">
          <div className="dash-stat-label">
            Max Drawdown
            <InfoTooltip term="max-drawdown" />
          </div>
          <div className="dash-stat-val dn">{metrics.maxDrawdownPct.toFixed(2)}%</div>
          <div className="dash-stat-sub">{metrics.maxDrawdownDays}d</div>
          <div className="dash-stat-glow dn" />
        </div>
        <div className="dash-stat-cell">
          <div className="dash-stat-label">
            Calmar Ratio
            <InfoTooltip term="calmar" />
          </div>
          <div className={`dash-stat-val ${calmarCls}`}>{fmtRatio(metrics.calmarRatio)}</div>
          <div className="dash-stat-sub">Return / Max DD</div>
          <div className={`dash-stat-glow ${calmarCls}`} />
        </div>
        <div className="dash-stat-cell">
          <div className="dash-stat-label">
            Beta vs VWCE
            <InfoTooltip term="beta" />
          </div>
          <div className="dash-stat-val flat">
            {metrics.betaVsBenchmark != null ? fmtRatio(metrics.betaVsBenchmark) : '—'}
          </div>
          <div className="dash-stat-sub">Market sensitivity</div>
          <div className="dash-stat-glow flat" />
        </div>
      </div>
    </div>
  )
}
