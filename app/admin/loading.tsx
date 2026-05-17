export default function AdminLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="dash-skel" style={{ height: 60, width: '100%' }} />
      <div className="adm-kpi-grid">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="dash-skel" style={{ height: 80 }} />
        ))}
      </div>
      <div className="dash-grid">
        <div className="dash-col">
          <div className="dash-skel" style={{ height: 280, width: '100%' }} />
          <div className="dash-skel" style={{ height: 280, width: '100%' }} />
        </div>
        <div className="dash-col">
          <div className="dash-skel" style={{ height: 240, width: '100%' }} />
          <div className="dash-skel" style={{ height: 280, width: '100%' }} />
        </div>
      </div>
    </div>
  )
}
