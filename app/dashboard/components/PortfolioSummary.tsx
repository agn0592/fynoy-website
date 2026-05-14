interface PortfolioSummaryProps {
  nav: number
  unrealizedPnl: number
  unrealizedPnlPct: number
  realizedPnlYtd: number
  openPositionsCount: number
}

function formatEur(value: number): string {
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatPct(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

interface StatCardProps {
  label: string
  value: string
  subValue?: string
  valueColor?: string
}

function StatCard({ label, value, subValue, valueColor }: StatCardProps) {
  return (
    <div
      style={{
        background: '#1a1d27',
        border: '1px solid #2a2d3e',
        borderRadius: '10px',
        padding: '20px 24px',
        flex: '1 1 200px',
        minWidth: '180px',
      }}
    >
      <div style={{ color: '#6b7280', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
        {label}
      </div>
      <div style={{ color: valueColor || '#ffffff', fontSize: '24px', fontWeight: 600, lineHeight: 1.2 }}>
        {value}
      </div>
      {subValue && (
        <div style={{ color: valueColor || '#9ca3af', fontSize: '13px', marginTop: '4px' }}>
          {subValue}
        </div>
      )}
    </div>
  )
}

export default function PortfolioSummary({
  nav,
  unrealizedPnl,
  unrealizedPnlPct,
  realizedPnlYtd,
  openPositionsCount,
}: PortfolioSummaryProps) {
  const pnlColor = unrealizedPnl >= 0 ? '#22c55e' : '#ef4444'
  const ytdColor = realizedPnlYtd >= 0 ? '#22c55e' : '#ef4444'

  return (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
      <StatCard label="Total NAV" value={formatEur(nav)} />
      <StatCard
        label="Unrealized PnL"
        value={formatEur(unrealizedPnl)}
        subValue={formatPct(unrealizedPnlPct)}
        valueColor={pnlColor}
      />
      <StatCard
        label="Realized PnL YTD"
        value={formatEur(realizedPnlYtd)}
        valueColor={ytdColor}
      />
      <StatCard
        label="Open Positions"
        value={String(openPositionsCount)}
      />
    </div>
  )
}
