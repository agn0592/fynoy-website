'use client'

import { useState } from 'react'
import type { PlanActionSummary, PlanDiff } from '@/lib/agent/types'

interface Props {
  action: PlanActionSummary
  onResolved: (action: PlanActionSummary) => void
}

function fmtValue(v: unknown): string {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'number') return Number.isFinite(v) ? v.toLocaleString('en-US') : String(v)
  if (typeof v === 'string') return v
  return JSON.stringify(v)
}

function DiffRows({ diff }: { diff: PlanDiff }) {
  if (diff.kind === 'case_update') {
    return (
      <>
        <div className="agent-plan-target">
          <span className="agent-plan-target-label">Case</span>
          <span className="agent-plan-target-value">
            {diff.ticker ?? diff.trading_id}
            {diff.company_name ? <span className="agent-plan-target-sub"> · {diff.company_name}</span> : null}
          </span>
        </div>
        <div className="agent-plan-rows">
          {diff.changes.map((c, i) => (
            <div key={i} className="agent-plan-row">
              <code>{c.field}</code>
              <span className="agent-plan-from">{fmtValue(c.from)}</span>
              <span className="agent-plan-arrow">→</span>
              <span className="agent-plan-to">{fmtValue(c.to)}</span>
            </div>
          ))}
        </div>
      </>
    )
  }
  if (diff.kind === 'position_update') {
    return (
      <>
        <div className="agent-plan-target">
          <span className="agent-plan-target-label">Position</span>
          <span className="agent-plan-target-value">{diff.symbol}</span>
        </div>
        <div className="agent-plan-rows">
          {diff.changes.map((c, i) => (
            <div key={i} className="agent-plan-row">
              <code>{c.field}</code>
              <span className="agent-plan-from">{fmtValue(c.from)}</span>
              <span className="agent-plan-arrow">→</span>
              <span className="agent-plan-to">{fmtValue(c.to)}</span>
            </div>
          ))}
        </div>
      </>
    )
  }
  return (
    <>
      <div className="agent-plan-target">
        <span className="agent-plan-target-label">{diff.title}</span>
      </div>
      <p className="agent-plan-summary">{diff.summary}</p>
      <pre className="agent-plan-payload">{JSON.stringify(diff.payload, null, 2)}</pre>
    </>
  )
}

export default function PlanCard({ action, onResolved }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [state, setState] = useState<PlanActionSummary>(action)

  async function resolve(approved: boolean) {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/agent/actions/${state.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ approved }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.detail ?? data.error ?? `HTTP ${res.status}`)
        return
      }
      const next: PlanActionSummary = { ...state, status: data.action?.status ?? (approved ? 'executed' : 'rejected') }
      setState(next)
      onResolved(next)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error')
    } finally {
      setBusy(false)
    }
  }

  const status = state.status
  const settled = status !== 'proposed'

  return (
    <div className={`agent-plan agent-plan--${status}`}>
      <div className="agent-plan-head">
        <div className="agent-plan-icon">⏵</div>
        <div className="agent-plan-head-text">
          <div className="agent-plan-title">
            Proposed action: <code>{state.tool_name}</code>
          </div>
          <div className="agent-plan-sub">Review and approve before this runs.</div>
        </div>
        <div className={`agent-plan-status agent-plan-status--${status}`}>{status}</div>
      </div>

      <div className="agent-plan-body">
        <DiffRows diff={state.diff} />
      </div>

      {error && <div className="agent-plan-error">⚠ {error}</div>}

      {!settled && (
        <div className="agent-plan-foot">
          <button className="agent-btn agent-btn--ghost" onClick={() => resolve(false)} disabled={busy}>
            Reject
          </button>
          <button className="agent-btn agent-btn--primary" style={{ background: 'var(--gold)' }} onClick={() => resolve(true)} disabled={busy}>
            {busy ? 'Running…' : 'Approve & run'}
          </button>
        </div>
      )}
    </div>
  )
}
