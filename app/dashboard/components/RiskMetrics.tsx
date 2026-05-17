interface BestWorstTrade { symbol: string; pct: number }

interface RiskMetricsProps {
  winRate: number
  avgReturn: number
  avgHoldingDays: number
  bestTrade: BestWorstTrade | null
  worstTrade: BestWorstTrade | null
  tradesYtd: number
  totalTrades: number
}

function fmtPct(v: number) { return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%` }

export default function RiskMetrics(props: RiskMetricsProps) {
  const { winRate, avgReturn, avgHoldingDays, bestTrade, worstTrade, tradesYtd, totalTrades } = props

  return (
    <div className="dash-card">
      <div className="dash-card-header">
        <div>
          <div className="dash-card-title">Risk &amp; Performance</div>
          <div className="dash-card-sub">{totalTrades} gesloten trades</div>
        </div>
      </div>
      <div className="dash-stats-stack" style={{ marginTop: 12 }}>
        <div className="dash-stat-cell">
          <div className="dash-stat-label">Win rate</div>
          <div className={`dash-stat-val ${winRate >= 50 ? 'up' : 'dn'}`}>
            {totalTrades > 0 ? `${winRate.toFixed(0)}%` : '—'}
          </div>
          <div className={`dash-stat-glow ${winRate >= 50 ? 'up' : 'dn'}`} />
        </div>
        <div className="dash-stat-cell">
          <div className="dash-stat-label">Avg return</div>
          <div className={`dash-stat-val ${avgReturn >= 0 ? 'up' : 'dn'}`}>
            {totalTrades > 0 ? fmtPct(avgReturn) : '—'}
          </div>
          <div className={`dash-stat-glow ${avgReturn >= 0 ? 'up' : 'dn'}`} />
        </div>
        <div className="dash-stat-cell">
          <div className="dash-stat-label">Avg holding</div>
          <div className="dash-stat-val flat">
            {totalTrades > 0 ? `${avgHoldingDays}d` : '—'}
          </div>
          <div className="dash-stat-glow flat" />
        </div>
        <div className="dash-stat-cell">
          <div className="dash-stat-label">Trades YTD</div>
          <div className="dash-stat-val flat">{tradesYtd}</div>
          <div className="dash-stat-glow flat" />
        </div>
        <div className="dash-stat-cell">
          <div className="dash-stat-label">Best trade</div>
          <div className="dash-stat-val up">
            {bestTrade ? fmtPct(bestTrade.pct) : '—'}
          </div>
          {bestTrade && (
            <div style={{ marginTop: 4, fontSize: 11, color: 'var(--ink-mute)', fontFamily: 'var(--serif)' }}>
              {bestTrade.symbol}
            </div>
          )}
          <div className="dash-stat-glow up" />
        </div>
        <div className="dash-stat-cell">
          <div className="dash-stat-label">Worst trade</div>
          <div className="dash-stat-val dn">
            {worstTrade ? fmtPct(worstTrade.pct) : '—'}
          </div>
          {worstTrade && (
            <div style={{ marginTop: 4, fontSize: 11, color: 'var(--ink-mute)', fontFamily: 'var(--serif)' }}>
              {worstTrade.symbol}
            </div>
          )}
          <div className="dash-stat-glow dn" />
        </div>
      </div>
    </div>
  )
}
