export default function DashboardLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="dash-skel" style={{ height: 88, width: '100%' }} />
      <div className="dash-grid">
        <div className="dash-col">
          <div className="dash-skel" style={{ height: 320, width: '100%' }} />
          <div className="dash-skel" style={{ height: 240, width: '100%' }} />
        </div>
        <div className="dash-col">
          <div className="dash-skel" style={{ height: 220, width: '100%' }} />
          <div className="dash-skel" style={{ height: 240, width: '100%' }} />
        </div>
      </div>
    </div>
  )
}
