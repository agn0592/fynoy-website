'use client'

import { useMemo } from 'react'

interface MonthReturn {
  year: number
  month: number
  pct: number
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function bucketClass(pct: number | null): string {
  if (pct === null) return 'hm-empty'
  const v = pct
  if (v > 6) return 'hm-up-5'
  if (v > 4) return 'hm-up-4'
  if (v > 2) return 'hm-up-3'
  if (v > 1) return 'hm-up-2'
  if (v > 0) return 'hm-up-1'
  if (v === 0) return 'hm-up-1'
  if (v > -1) return 'hm-dn-1'
  if (v > -2) return 'hm-dn-2'
  if (v > -4) return 'hm-dn-3'
  if (v > -6) return 'hm-dn-4'
  return 'hm-dn-5'
}

function formatPct(v: number): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`
}

export default function MonthlyHeatmap({ data }: { data: MonthReturn[] }) {
  const { years, lookup } = useMemo(() => {
    const ys = Array.from(new Set(data.map((d) => d.year))).sort((a, b) => b - a)
    const map = new Map<string, number>()
    for (const d of data) {
      map.set(`${d.year}-${d.month}`, d.pct)
    }
    return { years: ys, lookup: map }
  }, [data])

  if (years.length === 0) {
    return (
      <div className="dash-empty">No monthly return data yet.</div>
    )
  }

  return (
    <div
      className="heatmap-grid"
      style={{
        gridTemplateColumns: '40px repeat(12, 1fr)',
        gap: 3,
      }}
    >
      {/* Header row */}
      <div />
      {MONTH_LABELS.map((m) => (
        <div
          key={m}
          style={{
            fontSize: 9,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--ink-dim)',
            textAlign: 'center',
            padding: '2px 0 4px',
            fontWeight: 500,
          }}
        >
          {m}
        </div>
      ))}

      {/* Year rows */}
      {years.map((year) => (
        <YearRow key={year} year={year} lookup={lookup} />
      ))}
    </div>
  )
}

function YearRow({ year, lookup }: { year: number; lookup: Map<string, number> }) {
  return (
    <>
      <div
        style={{
          fontSize: 10,
          letterSpacing: '0.06em',
          color: 'var(--ink-dim)',
          display: 'flex',
          alignItems: 'center',
          fontFamily: 'var(--serif)',
        }}
      >
        {year}
      </div>
      {MONTH_LABELS.map((_, monthIdx) => {
        const pct = lookup.has(`${year}-${monthIdx}`) ? lookup.get(`${year}-${monthIdx}`)! : null
        const cls = bucketClass(pct)
        return (
          <div
            key={`${year}-${monthIdx}`}
            className={`heatmap-cell ${cls}`}
            title={pct !== null ? `${MONTH_LABELS[monthIdx]} ${year}: ${formatPct(pct)}` : `${MONTH_LABELS[monthIdx]} ${year}: no data`}
          >
            {pct !== null ? formatPct(pct) : ''}
          </div>
        )
      })}
    </>
  )
}
