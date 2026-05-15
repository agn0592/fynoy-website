'use client'

const TICKERS = [
  { sym: 'MSFT', pct: '+1.24%', up: true },
  { sym: 'NVDA', pct: '+3.41%', up: true },
  { sym: 'ASML', pct: '+1.87%', up: true },
  { sym: 'AAPL', pct: '+0.63%', up: true },
  { sym: 'META', pct: '+2.15%', up: true },
  { sym: 'AMZN', pct: '-0.48%', up: false },
  { sym: 'NOVO', pct: '+2.39%', up: true },
  { sym: 'LVMH', pct: '+0.72%', up: true },
  { sym: 'JPM',  pct: '+0.41%', up: true },
  { sym: 'TSLA', pct: '-1.18%', up: false },
  { sym: 'SAP',  pct: '+1.05%', up: true },
  { sym: 'SHEL', pct: '+0.34%', up: true },
  { sym: 'GOOGL',pct: '+1.62%', up: true },
  { sym: 'UNH',  pct: '-0.71%', up: false },
  { sym: 'NESN', pct: '-0.22%', up: false },
]

const items = [...TICKERS, ...TICKERS]

export default function StockTicker() {
  return (
    <div className="ticker-wrap" aria-hidden="true">
      <div className="ticker-track">
        {items.map((t, i) => (
          <span key={i} className="ticker-item">
            <span className="ticker-sym">{t.sym}</span>
            {' '}
            <span className={t.up ? 'ticker-up' : 'ticker-dn'}>{t.pct}</span>
            <span className="ticker-sep">·</span>
          </span>
        ))}
      </div>
    </div>
  )
}
