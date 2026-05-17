import Link from 'next/link'
import {
  IconStar,
  IconBook,
  IconActivity,
  IconClock,
  IconArrowRight,
} from './Icons'

interface QuickAction {
  href: string
  title: string
  description: string
  icon: React.ReactNode
}

const TILES: QuickAction[] = [
  {
    href: '/dashboard/watchlist',
    title: 'Watchlist',
    description: "Track symbols you're considering",
    icon: <IconStar />,
  },
  {
    href: '/dashboard/insights',
    title: 'Insights',
    description: 'Understand the metrics & philosophy',
    icon: <IconBook />,
  },
  {
    href: '/dashboard/performance',
    title: 'Performance',
    description: 'Deep analytics & drawdown',
    icon: <IconActivity />,
  },
  {
    href: '/dashboard/history',
    title: 'History',
    description: 'Full trade journal',
    icon: <IconClock />,
  },
]

export default function QuickActions() {
  return (
    <div className="dash-card">
      <div className="dash-card-header">
        <div>
          <div className="dash-card-title">Explore</div>
          <div className="dash-card-sub">Quick links to deeper views</div>
        </div>
      </div>
      <div className="dash-card-body">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 12,
          }}
        >
          {TILES.map(tile => (
            <Link
              key={tile.href}
              href={tile.href}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                padding: '16px 16px 14px',
                background: 'var(--navy-3, rgba(0,0,0,0.18))',
                border: '1px solid var(--line)',
                borderLeft: '2px solid var(--gold)',
                borderRadius: 2,
                textDecoration: 'none',
                color: 'var(--ink)',
                transition:
                  'border-color 0.18s ease, background 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease',
                minHeight: 96,
              }}
              className="quick-tile"
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  color: 'var(--gold)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    border: '1px solid var(--gold-line)',
                    borderRadius: 2,
                    color: 'var(--gold)',
                  }}
                >
                  {tile.icon}
                </div>
                <span
                  style={{
                    color: 'var(--ink-dim)',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                  aria-hidden
                >
                  <IconArrowRight width={14} height={14} />
                </span>
              </div>
              <div
                style={{
                  fontFamily: 'var(--serif)',
                  fontSize: 15,
                  fontWeight: 500,
                  color: 'var(--ink)',
                  letterSpacing: '-0.01em',
                }}
              >
                {tile.title}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--ink-mute)',
                  lineHeight: 1.45,
                }}
              >
                {tile.description}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
