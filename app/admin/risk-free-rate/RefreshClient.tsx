'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface RefreshResponse {
  success?: boolean
  updated?: number
  latest_date?: string
  latest_rate_pct?: string
  error?: string
}

interface RecentRow {
  date: string
  ratePct: number
  source: string
}

interface Props {
  latestDate: string | null
  latestRatePct: number | null
  latestSource: string | null
  totalRows: number
  sources: { source: string; n: number }[]
  recent: RecentRow[]
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function RefreshClient(props: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<RefreshResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleRefresh() {
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/bund/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })
      const data: RefreshResponse = await res.json()
      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`)
        return
      }
      setResult(data)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {/* Status + action */}
      <div
        style={{
          background: 'var(--navy-2)',
          border: '1px solid var(--line)',
          borderRadius: 2,
          padding: 24,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 24,
        }}
      >
        <Stat
          label="Latest date"
          value={props.latestDate ? formatDate(props.latestDate) : '—'}
          sub={props.latestSource ?? ''}
        />
        <Stat
          label="Latest yield"
          value={props.latestRatePct != null ? `${props.latestRatePct.toFixed(3)}%` : '—'}
          sub="annualized"
          accent
        />
        <Stat
          label="Total observations"
          value={props.totalRows.toLocaleString('en-GB')}
          sub={`${props.sources.length} source${props.sources.length === 1 ? '' : 's'}`}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
          {error && <span style={{ color: '#f87171', fontSize: 12, fontFamily: 'var(--serif)', fontStyle: 'italic' }}>{error}</span>}
          {result?.success && (
            <span style={{ color: '#4ade80', fontSize: 12, fontFamily: 'var(--serif)', fontStyle: 'italic' }}>
              +{result.updated} rows · {result.latest_rate_pct}%
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={busy}
            style={{
              background: busy ? 'rgba(201,169,110,0.08)' : 'rgba(201,169,110,0.12)',
              border: '1px solid var(--gold-line)',
              borderRadius: 2,
              color: 'var(--gold)',
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.06em',
              padding: '10px 18px',
              cursor: busy ? 'wait' : 'pointer',
              fontFamily: 'var(--sans)',
              textTransform: 'uppercase',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              transition: 'background 0.15s',
            }}
          >
            {busy && (
              <span
                style={{
                  display: 'inline-block',
                  width: 12,
                  height: 12,
                  border: '2px solid rgba(201,169,110,0.25)',
                  borderTopColor: 'var(--gold)',
                  borderRadius: '50%',
                  animation: 'rfr-spin 0.8s linear infinite',
                }}
              />
            )}
            {busy ? 'Fetching…' : 'Refresh Bund data'}
          </button>
        </div>
      </div>

      {/* Sources breakdown */}
      {props.sources.length > 0 && (
        <div
          style={{
            background: 'var(--navy-2)',
            border: '1px solid var(--line)',
            borderRadius: 2,
            padding: 20,
          }}
        >
          <div style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-dim)', marginBottom: 12 }}>
            Sources
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {props.sources.map(s => (
              <div
                key={s.source}
                style={{
                  fontSize: 12,
                  fontFamily: 'var(--serif)',
                  color: 'var(--ink)',
                  padding: '6px 12px',
                  border: '1px solid var(--line)',
                  borderRadius: 2,
                  background: 'rgba(232,228,220,0.02)',
                }}
              >
                {s.source} <span style={{ color: 'var(--ink-dim)' }}>· {s.n}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent observations */}
      <div
        style={{
          background: 'var(--navy-2)',
          border: '1px solid var(--line)',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 15, fontWeight: 500, color: 'var(--ink)' }}>
            Recent values
          </div>
          <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-dim)', marginTop: 3 }}>
            Latest 20 observations
          </div>
        </div>
        {props.recent.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-dim)', fontSize: 13, fontStyle: 'italic' }}>
            No data yet. Click &quot;Refresh Bund data&quot; to populate the table.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-dim)', fontWeight: 500, borderBottom: '1px solid var(--line)' }}>
                  Date
                </th>
                <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-dim)', fontWeight: 500, borderBottom: '1px solid var(--line)' }}>
                  Yield
                </th>
                <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-dim)', fontWeight: 500, borderBottom: '1px solid var(--line)' }}>
                  Source
                </th>
              </tr>
            </thead>
            <tbody>
              {props.recent.map((r, i) => (
                <tr key={`${r.date}-${i}`} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(232,228,220,0.02)' }}>
                  <td style={{ padding: '10px 20px', color: 'var(--ink)', fontFamily: 'var(--serif)' }}>{formatDate(r.date)}</td>
                  <td style={{ padding: '10px 20px', color: 'var(--ink)', fontFamily: 'var(--serif)', textAlign: 'right' }}>
                    {r.ratePct.toFixed(3)}%
                  </td>
                  <td style={{ padding: '10px 20px', color: 'var(--ink-mute)', fontFamily: 'var(--sans)', fontSize: 11 }}>
                    {r.source}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style>{`@keyframes rfr-spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-dim)', marginBottom: 8, fontWeight: 500 }}>
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--serif)',
          fontSize: 24,
          fontWeight: 500,
          letterSpacing: '-0.02em',
          lineHeight: 1,
          color: accent ? 'var(--gold)' : 'var(--ink)',
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ marginTop: 4, fontSize: 11, color: 'var(--ink-mute)', fontFamily: 'var(--serif)', fontStyle: 'italic' }}>
          {sub}
        </div>
      )}
    </div>
  )
}
