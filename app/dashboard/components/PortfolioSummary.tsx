interface PortfolioSummaryProps {
  unrealizedPnlPct: number
  realizedPnlYtdPct: number
  openPositionsCount: number
}

function fmt(v: number): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
}

export default function PortfolioSummary({
  unrealizedPnlPct,
  realizedPnlYtdPct,
  openPositionsCount,
}: PortfolioSummaryProps) {
  const uClass = unrealizedPnlPct >= 0 ? 'up' : 'dn'
  const rClass = realizedPnlYtdPct >= 0 ? 'up' : 'dn'

  return (
    <div className="dash-stats">
      <div className="dash-stat">
        <div className="dash-stat-label">Unrealized Return</div>
        <div className={`dash-stat-value ${uClass}`}>{fmt(unrealizedPnlPct)}</div>
        <div className="dash-stat-sub">Open positions</div>
        <div className={`dash-stat-glow ${uClass}`} />
      </div>
      <div className="dash-stat">
        <div className="dash-stat-label">Realized Return YTD</div>
        <div className={`dash-stat-value ${rClass}`}>{fmt(realizedPnlYtdPct)}</div>
        <div className="dash-stat-sub">Closed trades {new Date().getFullYear()}</div>
        <div className={`dash-stat-glow ${rClass}`} />
      </div>
      <div className="dash-stat">
        <div className="dash-stat-label">Open Positions</div>
        <div className="dash-stat-value neutral">{openPositionsCount}</div>
        <div className="dash-stat-sub">Active holdings</div>
        <div className="dash-stat-glow neutral" />
      </div>
    </div>
  )
}
