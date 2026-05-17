import { fmtPct } from '@/lib/analytics'

interface MonthlyHeatmapProps {
  months: { year: number; month: number; pct: number }[]
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function heatmapClass(pct: number): string {
  if (pct === 0) return 'hm-empty'
  if (pct >= 6) return 'hm-up-5'
  if (pct >= 4) return 'hm-up-4'
  if (pct >= 2) return 'hm-up-3'
  if (pct >= 1) return 'hm-up-2'
  if (pct > 0) return 'hm-up-1'
  if (pct <= -6) return 'hm-dn-5'
  if (pct <= -4) return 'hm-dn-4'
  if (pct <= -2) return 'hm-dn-3'
  if (pct <= -1) return 'hm-dn-2'
  return 'hm-dn-1'
}

function fmtCell(pct: number): string {
  const sign = pct > 0 ? '+' : pct < 0 ? '-' : ''
  return `${sign}${Math.abs(pct).toFixed(1)}%`
}

export default function MonthlyHeatmap({ months }: MonthlyHeatmapProps) {
  const years = Array.from(new Set(months.map(m => m.year))).sort((a, b) => b - a)
  const cellByKey = new Map<string, number>(months.map(m => [`${m.year}-${m.month}`, m.pct]))

  // annual compounded return per year
  const annualByYear = new Map<number, number>()
  for (const y of years) {
    let factor = 1
    let hasAny = false
    for (let m = 0; m < 12; m++) {
      const v = cellByKey.get(`${y}-${m}`)
      if (v != null) {
        factor *= 1 + v / 100
        hasAny = true
      }
    }
    annualByYear.set(y, hasAny ? (factor - 1) * 100 : 0)
  }

  return (
    <div className="dash-card">
      <div className="dash-card-header">
        <div>
          <div className="dash-card-title">Monthly Returns</div>
          <div className="dash-card-sub">Compounded daily TWR by month</div>
        </div>
      </div>
      <div className="dash-card-body">
        {years.length === 0 ? (
          <div className="dash-empty">No monthly data yet</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <div
              className="heatmap-grid"
              style={{
                gridTemplateColumns: '40px repeat(12, minmax(34px, 1fr)) 50px',
                gap: 3,
                alignItems: 'center',
                minWidth: 540,
              }}
            >
              {/* Header row */}
              <div />
              {MONTH_LABELS.map(m => (
                <div
                  key={m}
                  style={{
                    fontSize: 9,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--ink-dim)',
                    textAlign: 'center',
                    padding: '4px 0',
                  }}
                >
                  {m}
                </div>
              ))}
              <div
                style={{
                  fontSize: 9,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-dim)',
                  textAlign: 'right',
                  padding: '4px 0',
                }}
              >
                YTD
              </div>

              {/* Year rows */}
              {years.map(year => {
                const annual = annualByYear.get(year) ?? 0
                const annualCls = annual > 0 ? 'up' : annual < 0 ? 'dn' : 'flat'
                return (
                  <div key={year} style={{ display: 'contents' }}>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--ink-mute)',
                        display: 'flex',
                        alignItems: 'center',
                        fontFamily: 'var(--serif)',
                      }}
                    >
                      {year}
                    </div>
                    {MONTH_LABELS.map((_, mi) => {
                      const key = `${year}-${mi}`
                      const pct = cellByKey.get(key)
                      if (pct == null) {
                        return <div key={key} className="heatmap-cell hm-empty" title="No data" />
                      }
                      return (
                        <div
                          key={key}
                          className={`heatmap-cell ${heatmapClass(pct)}`}
                          title={`${MONTH_LABELS[mi]} ${year}: ${fmtPct(pct)}`}
                        >
                          {Math.abs(pct) >= 0.1 ? fmtCell(pct) : ''}
                        </div>
                      )
                    })}
                    <div
                      style={{
                        fontSize: 11,
                        fontFamily: 'var(--serif)',
                        textAlign: 'right',
                        color:
                          annualCls === 'up'
                            ? 'var(--dash-green)'
                            : annualCls === 'dn'
                              ? 'var(--dash-red)'
                              : 'var(--ink-mute)',
                        fontWeight: 600,
                      }}
                    >
                      {fmtPct(annual, 1)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
