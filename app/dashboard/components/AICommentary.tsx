import ReactMarkdown from 'react-markdown'

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
          ? (
            <div className="dash-commentary-body">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h1 className="commentary-h1">{children}</h1>,
                  h2: ({ children }) => <h2 className="commentary-h2">{children}</h2>,
                  h3: ({ children }) => <h3 className="commentary-h3">{children}</h3>,
                  p:  ({ children }) => <p  className="commentary-p">{children}</p>,
                  ul: ({ children }) => <ul className="commentary-ul">{children}</ul>,
                  li: ({ children }) => <li className="commentary-li">{children}</li>,
                  strong: ({ children }) => <strong className="commentary-strong">{children}</strong>,
                  em: ({ children }) => <em className="commentary-em">{children}</em>,
                  hr: () => <hr className="commentary-hr" />,
                }}
              >
                {commentary}
              </ReactMarkdown>
            </div>
          )
          : <div className="dash-commentary-empty">No commentary available yet.</div>
        }
      </div>
    </div>
  )
}
