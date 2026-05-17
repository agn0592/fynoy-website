import { concentrationStats, type PositionInput } from '@/lib/analytics'
import InfoTooltip from './InfoTooltip'

interface ConcentrationCardProps {
  positions: PositionInput[]
}

const SEGMENT_TONES = [
  'var(--gold)',
  '#d8be84',
  '#c2a468',
  '#a98a4f',
  '#8c7038',
]

function fmtWeight(v: number, digits = 1): string {
  return `${v.toFixed(digits)}%`
}

export default function ConcentrationCard({ positions }: ConcentrationCardProps) {
  const stats = concentrationStats(positions)

  const top5 = [...positions]
    .map(p => ({ symbol: p.symbol, pct: p.pct_of_nav ?? 0 }))
    .filter(p => p.pct > 0)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5)
  const top5Total = top5.reduce((s, p) => s + p.pct, 0)

  if (positions.length === 0) {
    return (
      <div className="dash-card">
        <div className="dash-card-header">
          <div>
            <div className="dash-card-title">Concentration</div>
            <div className="dash-card-sub">Position weight distribution</div>
          </div>
        </div>
        <div className="dash-card-body">
          <div className="dash-empty">No positions yet</div>
        </div>
      </div>
    )
  }

  return (
    <div className="dash-card">
      <div className="dash-card-header">
        <div>
          <div className="dash-card-title">Concentration</div>
          <div className="dash-card-sub">Position weight distribution</div>
        </div>
      </div>
      <div className="dash-stats-stack" style={{ marginTop: 12 }}>
        <div className="dash-stat-cell">
          <div className="dash-stat-label">
            Top 1 weight
            <InfoTooltip term="top-1" />
          </div>
          <div className="dash-stat-val flat">{fmtWeight(stats.top1Pct)}</div>
          <div className="dash-stat-sub">{stats.largest?.symbol ?? '—'}</div>
          <div className="dash-stat-glow flat" />
        </div>
        <div className="dash-stat-cell">
          <div className="dash-stat-label">
            Top 3 weights
            <InfoTooltip term="top-3" />
          </div>
          <div className="dash-stat-val flat">{fmtWeight(stats.top3Pct)}</div>
          <div className="dash-stat-sub">Combined</div>
          <div className="dash-stat-glow flat" />
        </div>
        <div className="dash-stat-cell">
          <div className="dash-stat-label">
            Top 5 weights
            <InfoTooltip term="top-5" />
          </div>
          <div className="dash-stat-val flat">{fmtWeight(stats.top5Pct)}</div>
          <div className="dash-stat-sub">Combined</div>
          <div className="dash-stat-glow flat" />
        </div>
        <div className="dash-stat-cell">
          <div className="dash-stat-label">
            Effective #
            <InfoTooltip term="effective-holdings" />
          </div>
          <div className="dash-stat-val flat">
            {stats.effectiveCount >= 10
              ? stats.effectiveCount.toFixed(0)
              : stats.effectiveCount.toFixed(1)}
          </div>
          <div className="dash-stat-sub">1/HHI ratio</div>
          <div className="dash-stat-glow flat" />
        </div>
        <div className="dash-stat-cell full-width">
          <div className="dash-stat-label">
            HHI
            <InfoTooltip term="hhi" />
          </div>
          <div className="dash-stat-val flat">{stats.herfindahl.toFixed(0)}</div>
          <div className="dash-stat-sub">Index of concentration</div>
          <div className="dash-stat-glow flat" />
        </div>
      </div>

      {top5.length > 0 && (
        <div style={{ padding: '16px 20px 20px' }}>
          <div
            style={{
              fontSize: 9,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--ink-dim)',
              fontWeight: 500,
              marginBottom: 8,
            }}
          >
            Top 5 distribution
          </div>
          <div
            style={{
              display: 'flex',
              width: '100%',
              height: 8,
              borderRadius: 2,
              overflow: 'hidden',
              background: 'rgba(232,228,220,0.05)',
              border: '1px solid var(--line)',
            }}
          >
            {top5.map((p, i) => (
              <div
                key={p.symbol}
                style={{
                  width: `${top5Total > 0 ? (p.pct / top5Total) * 100 : 0}%`,
                  background: SEGMENT_TONES[i % SEGMENT_TONES.length],
                  transition: 'width 0.4s cubic-bezier(0.34,1.56,0.64,1)',
                }}
                title={`${p.symbol}: ${fmtWeight(p.pct)}`}
              />
            ))}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${top5.length}, 1fr)`,
              gap: 4,
              marginTop: 8,
            }}
          >
            {top5.map((p, i) => (
              <div
                key={p.symbol}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 11,
                    color: 'var(--ink-mute)',
                    fontFamily: 'var(--serif)',
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      background: SEGMENT_TONES[i % SEGMENT_TONES.length],
                      flexShrink: 0,
                      borderRadius: 1,
                    }}
                  />
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {p.symbol}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: 'var(--ink-dim)',
                    letterSpacing: '0.04em',
                  }}
                >
                  {fmtWeight(p.pct)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
