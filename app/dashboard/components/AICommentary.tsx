interface AICommentaryProps {
  commentary: string | null
  updatedAt: string | null
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function AICommentary({ commentary, updatedAt }: AICommentaryProps) {
  return (
    <div className="dash-commentary">
      <div className="dash-commentary-inner">
        <div className="dash-commentary-header">
          <div>
            <div className="dash-commentary-title">Portfolio Commentary</div>
            <div className="dash-commentary-sub">AI-generated analysis</div>
          </div>
          {updatedAt && (
            <div className="dash-commentary-date">
              <div style={{ marginBottom: 2 }}>Last updated</div>
              {fmtDate(updatedAt)}
            </div>
          )}
        </div>
        {commentary
          ? <div className="dash-commentary-body">{commentary}</div>
          : <div className="dash-commentary-empty">No commentary available yet.</div>
        }
      </div>
    </div>
  )
}
