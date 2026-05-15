interface PortfolioSummaryProps {
  unrealizedPnlPct: number
  realizedPnlYtdPct: number
  openPositionsCount: number
}

function formatPct(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

interface StatCardProps {
  label: string
  value: string
  valueColor?: string
  description?: string
}

function StatCard({ label, value, valueColor, description }: StatCardProps) {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #1a1d27 0%, #1e2130 100%)',
        border: '1px solid #2a2d3e',
        borderRadius: '12px',
        padding: '24px',
        flex: '1 1 200px',
        minWidth: '180px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: valueColor
            ? `linear-gradient(90deg, ${valueColor}40, ${valueColor}10)`
            : 'linear-gradient(90deg, #3b82f640, #3b82f610)',
        }}
      />
      <div
        style={{
          color: '#6b7280',
          fontSize: '11px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: '10px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          color: valueColor || '#ffffff',
          fontSize: '26px',
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </div>
      {description && (
        <div style={{ color: '#4b5563', fontSize: '12px', marginTop: '6px' }}>
          {description}
        </div>
      )}
    </div>
  )
}

export default function PortfolioSummary({
  unrealizedPnlPct,
  realizedPnlYtdPct,
  openPositionsCount,
}: PortfolioSummaryProps) {
  const unrealizedColor = unrealizedPnlPct >= 0 ? '#22c55e' : '#ef4444'
  const ytdColor = realizedPnlYtdPct >= 0 ? '#22c55e' : '#ef4444'

  return (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
      <StatCard
        label="Unrealized Return"
        value={formatPct(unrealizedPnlPct)}
        valueColor={unrealizedColor}
        description="Open positions"
      />
      <StatCard
        label="Realized Return YTD"
        value={formatPct(realizedPnlYtdPct)}
        valueColor={ytdColor}
        description="Closed trades this year"
      />
      <StatCard
        label="Open Positions"
        value={String(openPositionsCount)}
        description="Active holdings"
      />
    </div>
  )
}
