interface ScoreBadgeProps {
  value: number | null | undefined
  max: number
}

export function scoreClass(value: number | null | undefined, max: number): 'high' | 'medium' | 'low' | 'mute' {
  if (value === null || value === undefined) return 'mute'
  const pct = (value / max) * 100
  if (pct >= 70) return 'high'
  if (pct >= 45) return 'medium'
  return 'low'
}

export function ScoreBadge({ value, max }: ScoreBadgeProps) {
  if (value === null || value === undefined) {
    return <span style={{ color: 'var(--ink-dim)', fontStyle: 'italic', fontFamily: 'var(--serif)' }}>—</span>
  }
  const cls = scoreClass(value, max)
  const badgeCls = cls === 'mute' ? '' : cls
  return (
    <span className={`score-badge ${badgeCls}`}>
      {value}
      <span className="max">/{max}</span>
    </span>
  )
}

interface ScoreBarProps {
  value: number | null | undefined
  max: number
  label?: string
  width?: number | string
}

export function ScoreBar({ value, max, label, width = 80 }: ScoreBarProps) {
  const pct = value !== null && value !== undefined ? Math.max(0, Math.min(100, (value / max) * 100)) : 0
  const cls = scoreClass(value, max)
  const fillColor =
    cls === 'high'
      ? 'var(--dash-green)'
      : cls === 'low'
        ? 'var(--dash-red)'
        : 'var(--gold)'

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      {label && (
        <span
          style={{
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--ink-dim)',
            fontWeight: 500,
          }}
        >
          {label}
        </span>
      )}
      <span
        className="weight-bar-track"
        style={{ width, height: 4, background: 'rgba(232,228,220,0.07)' }}
      >
        <span
          style={{
            display: 'block',
            height: '100%',
            width: `${pct}%`,
            background: fillColor,
            transition: 'width 0.4s cubic-bezier(0.34,1.56,0.64,1)',
            borderRadius: 1,
          }}
        />
      </span>
      <ScoreBadge value={value ?? null} max={max} />
    </div>
  )
}
