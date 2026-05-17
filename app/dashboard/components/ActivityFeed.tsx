export interface ActivityEvent {
  date: string
  type: 'position_opened' | 'position_closed' | 'commentary_updated'
  symbol?: string
  pct?: number
  label: string
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
}

function dotColorFor(ev: ActivityEvent): string {
  if (ev.type === 'commentary_updated') return 'var(--gold)'
  if (ev.type === 'position_opened') return '#22c55e'
  if (ev.type === 'position_closed') {
    return (ev.pct ?? 0) >= 0 ? '#4ade80' : '#f87171'
  }
  return 'var(--ink-mute)'
}

export default function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  return (
    <div className="dash-card">
      <div className="dash-card-header">
        <div>
          <div className="dash-card-title">Activity</div>
          <div className="dash-card-sub">Recent events</div>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="dash-card-body" style={{ color: 'var(--ink-dim)', fontStyle: 'italic', fontFamily: 'var(--serif)', fontSize: 14 }}>
          No activity yet.
        </div>
      ) : (
        <ul className="activity-list">
          {events.map((ev, i) => (
            <li key={`${ev.date}-${i}`} className="activity-item">
              <span className="activity-dot" style={{ background: dotColorFor(ev) }} />
              <div className="activity-content">
                <div className="activity-label">{ev.label}</div>
                <div className="activity-date">{fmtDate(ev.date)}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
