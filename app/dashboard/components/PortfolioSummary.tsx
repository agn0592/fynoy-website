interface PortfolioSummaryProps {
  unrealizedPnlPct: number
  realizedPnlYtdPct: number
  openPositionsCount: number
}

function fmt(v: number) {
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
}

export default function PortfolioSummary({ unrealizedPnlPct, realizedPnlYtdPct, openPositionsCount }: PortfolioSummaryProps) {
  const uCls = unrealizedPnlPct >= 0 ? 'up' : 'dn'
  const rCls = realizedPnlYtdPct >= 0 ? 'up' : 'dn'

  return (
    <div className="dash-card">
      <div className="dash-card-header">
        <div>
          <div className="dash-card-title">Key Metrics</div>
          <div className="dash-card-sub">Portfolio returns</div>
        </div>
      </div>
      <div className="dash-stats-stack" style={{ marginTop: 12 }}>
        <div className="dash-stat-cell">
          <div className="dash-stat-label">Unrealized</div>
          <div className={`dash-stat-val ${uCls}`}>{fmt(unrealizedPnlPct)}</div>
          <div className={`dash-stat-glow ${uCls}`} />
        </div>
        <div className="dash-stat-cell">
          <div className="dash-stat-label">YTD Realized</div>
          <div className={`dash-stat-val ${rCls}`}>{fmt(realizedPnlYtdPct)}</div>
          <div className={`dash-stat-glow ${rCls}`} />
        </div>
        <div className="dash-stat-cell full-width">
          <div className="dash-stat-label">Open Positions</div>
          <div className="dash-stat-val flat">{openPositionsCount}</div>
          <div className="dash-stat-glow flat" />
        </div>
      </div>
    </div>
  )
}
