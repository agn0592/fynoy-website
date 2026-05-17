'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  IconSettings, IconCheck, IconAlertCircle, IconRefresh, IconCalendar,
  IconExternalLink, IconEdit,
} from '@/app/dashboard/components/Icons'
import type { SettingsPayload, GeneralSettings } from './page'

interface SettingsClientProps {
  initial: SettingsPayload
}

function relTime(iso: string | null): string {
  if (!iso) return 'never'
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 0) return 'just now'
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  return `${day}d ago`
}

function absoluteTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface ApiResponse {
  ok: boolean
  status: number
  body: unknown
  at: string
}

export default function SettingsClient({ initial }: SettingsClientProps) {
  const [general, setGeneral] = useState<GeneralSettings>(initial.general)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const fadeTimer = useRef<number | null>(null)

  // Sync / backfill / commentary state
  const [syncing, setSyncing] = useState(false)
  const [backfilling, setBackfilling] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [syncResp, setSyncResp] = useState<ApiResponse | null>(null)
  const [backfillResp, setBackfillResp] = useState<ApiResponse | null>(null)
  const [commentaryResp, setCommentaryResp] = useState<ApiResponse | null>(null)

  // last sync displayed (refreshed after a successful sync)
  const [displayLastSync, setDisplayLastSync] = useState<string | null>(initial.lastSync)
  const [displayLastCommentary, setDisplayLastCommentary] = useState<string | null>(
    initial.lastCommentary?.created_at ?? null,
  )

  useEffect(() => {
    return () => {
      if (fadeTimer.current) window.clearTimeout(fadeTimer.current)
    }
  }, [])

  function flashSaved() {
    setSavedAt(Date.now())
    if (fadeTimer.current) window.clearTimeout(fadeTimer.current)
    fadeTimer.current = window.setTimeout(() => setSavedAt(null), 1800)
  }

  async function saveGeneral() {
    setSaving(true)
    setSaveError(null)
    const supabase = createClient()
    const { error } = await supabase.from('settings').upsert({
      key: 'general',
      value: general,
      updated_at: new Date().toISOString(),
    })
    setSaving(false)
    if (error) {
      setSaveError(error.message)
      return
    }
    flashSaved()
  }

  async function callApi(
    path: string,
    setResp: (r: ApiResponse) => void,
    setBusy: (b: boolean) => void,
  ) {
    setBusy(true)
    try {
      const res = await fetch(path, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })
      let body: unknown = null
      try {
        body = await res.json()
      } catch {
        body = await res.text().catch(() => null)
      }
      setResp({ ok: res.ok, status: res.status, body, at: new Date().toISOString() })
      return { ok: res.ok, body }
    } catch (err) {
      setResp({
        ok: false,
        status: 0,
        body: (err as Error).message,
        at: new Date().toISOString(),
      })
      return { ok: false, body: null }
    } finally {
      setBusy(false)
    }
  }

  async function triggerSync() {
    const r = await callApi('/api/ibkr/sync', setSyncResp, setSyncing)
    if (r.ok) setDisplayLastSync(new Date().toISOString())
  }
  async function triggerBackfill() {
    await callApi('/api/ibkr/backfill-benchmark', setBackfillResp, setBackfilling)
  }
  async function triggerCommentary() {
    const r = await callApi('/api/commentary/generate', setCommentaryResp, setGenerating)
    if (r.ok) setDisplayLastCommentary(new Date().toISOString())
  }

  // Stable "now" snapshot — recomputed only on remount
  const [nowMs] = useState<number>(() => Date.now())
  const syncAgeHours =
    displayLastSync !== null
      ? (nowMs - new Date(displayLastSync).getTime()) / 3_600_000
      : null

  const sectorList = (() => {
    const merged = new Set<string>([
      ...initial.sectors,
      ...Object.keys(initial.targetAllocation),
    ])
    return Array.from(merged).sort()
  })()

  const totalTarget = Object.values(initial.targetAllocation).reduce(
    (acc, v) => acc + (typeof v === 'number' ? v : 0),
    0,
  )

  const showSaved = savedAt !== null
  const savedIndicator = (
    <span
      aria-live="polite"
      style={{
        fontSize: 11,
        color: 'var(--dash-green)',
        letterSpacing: '0.06em',
        opacity: showSaved ? 1 : 0,
        transition: 'opacity 0.3s',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <IconCheck width={12} height={12} /> Saved
    </span>
  )

  return (
    <>
      <div className="dash-page-head">
        <div className="dash-page-title-block">
          <h1 className="dash-page-title">
            System <em>Settings</em>
          </h1>
          <div className="dash-page-sub">Configure Fynoy Capital.</div>
        </div>
        <div className="dash-page-actions">
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--ink-dim)',
              fontSize: 12,
            }}
          >
            <IconSettings width={14} height={14} />
            settings table
          </span>
        </div>
      </div>

      {/* ── General ─────────────────────────────────────── */}
      <section className="dash-form-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <h2 className="dash-form-section-title">General</h2>
          <div style={{ marginLeft: 'auto' }}>{savedIndicator}</div>
        </div>
        <p className="dash-form-section-sub">
          Portfolio metadata used across reports and analytics.
        </p>

        <div className="dash-form-grid">
          <div className="dash-form-group">
            <label className="dash-form-label" htmlFor="inception">
              Portfolio inception date
            </label>
            <input
              id="inception"
              type="date"
              className="dash-input"
              value={general.inception_date ?? ''}
              onChange={(e) =>
                setGeneral({ ...general, inception_date: e.target.value || null })
              }
            />
            <div className="dash-form-hint">Used as t=0 for TWR and benchmark calculations.</div>
          </div>

          <div className="dash-form-group">
            <label className="dash-form-label" htmlFor="currency">
              Display currency
            </label>
            <select
              id="currency"
              className="dash-select"
              value={general.currency ?? 'EUR'}
              onChange={(e) =>
                setGeneral({ ...general, currency: e.target.value as 'EUR' | 'USD' | 'GBP' })
              }
            >
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>

          <div className="dash-form-group">
            <label className="dash-form-label" htmlFor="benchmark">
              Default benchmark
            </label>
            <input
              id="benchmark"
              type="text"
              className="dash-input"
              placeholder="VWCE"
              value={general.benchmark ?? ''}
              onChange={(e) => setGeneral({ ...general, benchmark: e.target.value })}
            />
            <div className="dash-form-hint">Ticker used for relative performance comparison.</div>
          </div>

          <div className="dash-form-group">
            <label className="dash-form-label" htmlFor="rfp">
              Risk-free rate (%)
            </label>
            <input
              id="rfp"
              type="number"
              step="0.01"
              className="dash-input"
              value={general.risk_free_pct ?? 0}
              onChange={(e) =>
                setGeneral({ ...general, risk_free_pct: Number(e.target.value) })
              }
            />
            <div className="dash-form-hint">Used for Sharpe and other risk-adjusted metrics.</div>
          </div>
        </div>

        {saveError && (
          <div className="dash-alert alert-error" style={{ marginTop: 14 }}>
            <div
              className="dash-alert-title"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <IconAlertCircle width={12} height={12} /> Save failed
            </div>
            <div className="dash-alert-body">{saveError}</div>
          </div>
        )}

        <div style={{ marginTop: 18, display: 'flex', gap: 10 }}>
          <button
            type="button"
            className="dash-btn btn-gold"
            disabled={saving}
            onClick={saveGeneral}
          >
            <IconCheck width={14} height={14} />
            {saving ? 'Saving…' : 'Save general settings'}
          </button>
        </div>
      </section>

      {/* ── Target Allocations (read-only) ──────────────── */}
      <section className="dash-form-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <h2 className="dash-form-section-title">Target allocations</h2>
        </div>
        <p className="dash-form-section-sub">
          Read-only view of current sector targets. Edits live in the dedicated tool.
        </p>

        {sectorList.length === 0 ? (
          <div className="dash-empty">No target allocations set yet.</div>
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th className="dash-th">Sector</th>
                  <th className="dash-th" style={{ textAlign: 'right' }}>
                    Target %
                  </th>
                </tr>
              </thead>
              <tbody>
                {sectorList.map((s) => {
                  const t = initial.targetAllocation[s] ?? 0
                  return (
                    <tr key={s} className="dash-tr">
                      <td className="dash-td">{s}</td>
                      <td className="dash-td" style={{ textAlign: 'right' }}>
                        <span
                          className={`ret-badge ${t > 0 ? 'up' : 'dn'}`}
                          style={{ minWidth: 64, justifyContent: 'flex-end' }}
                        >
                          {t.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
                <tr className="dash-tr">
                  <td className="dash-td" style={{ color: 'var(--ink-dim)' }}>
                    Total
                  </td>
                  <td
                    className="dash-td"
                    style={{
                      textAlign: 'right',
                      color: Math.abs(totalTarget - 100) < 0.5 ? 'var(--dash-green)' : 'var(--gold)',
                      fontFamily: 'var(--serif)',
                    }}
                  >
                    {totalTarget.toFixed(1)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/admin/rebalancing" className="dash-btn btn-outline">
            <IconEdit width={14} height={14} />
            Open dedicated rebalancing tool
            <IconExternalLink width={12} height={12} />
          </Link>
        </div>
      </section>

      {/* ── Sync Schedule ───────────────────────────────── */}
      <section className="dash-form-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <h2 className="dash-form-section-title">Sync schedule</h2>
        </div>
        <p className="dash-form-section-sub">
          Manual triggers for IBKR portfolio sync and benchmark backfill.
        </p>

        <div className="dash-form-grid">
          <div className="dash-form-group">
            <span className="dash-form-label">Last sync</span>
            <div
              style={{
                background: 'var(--navy-3)',
                border: '1px solid var(--line)',
                borderRadius: 2,
                padding: '11px 13px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <IconCalendar width={14} height={14} style={{ color: 'var(--gold)' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: 'var(--ink)', fontSize: 13 }}>
                  {relTime(displayLastSync)}
                </div>
                <div className="dash-form-hint" style={{ marginTop: 2 }}>
                  {absoluteTime(displayLastSync)}
                </div>
              </div>
              {syncAgeHours !== null && (
                <span
                  className={`status-badge ${syncAgeHours > 24 ? 'warning' : 'active'}`}
                >
                  {syncAgeHours.toFixed(0)}h old
                </span>
              )}
            </div>
          </div>

          <div className="dash-form-group">
            <span className="dash-form-label">Last commentary</span>
            <div
              style={{
                background: 'var(--navy-3)',
                border: '1px solid var(--line)',
                borderRadius: 2,
                padding: '11px 13px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <IconCalendar width={14} height={14} style={{ color: 'var(--gold)' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: 'var(--ink)', fontSize: 13 }}>
                  {relTime(displayLastCommentary)}
                </div>
                <div className="dash-form-hint" style={{ marginTop: 2 }}>
                  {absoluteTime(displayLastCommentary)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="dash-alert alert-info" style={{ marginTop: 16 }}>
          <div
            className="dash-alert-title"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <IconAlertCircle width={12} height={12} /> Authorization required
          </div>
          <div className="dash-alert-body">
            These endpoints require an <code>x-sync-secret</code> header. The browser-side button
            below sends the request with your session cookies — if the server route enforces a
            shared secret, you will see a 401 response.
          </div>
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="dash-btn btn-gold"
            onClick={triggerSync}
            disabled={syncing}
          >
            <IconRefresh width={14} height={14} />
            {syncing ? 'Syncing…' : 'Trigger manual sync now'}
          </button>
          <button
            type="button"
            className="dash-btn btn-outline"
            onClick={triggerBackfill}
            disabled={backfilling}
          >
            <IconRefresh width={14} height={14} />
            {backfilling ? 'Backfilling…' : 'Trigger benchmark backfill'}
          </button>
        </div>

        {syncResp && (
          <ApiResultPanel title="Sync response" resp={syncResp} />
        )}
        {backfillResp && (
          <ApiResultPanel title="Backfill response" resp={backfillResp} />
        )}
      </section>

      {/* ── AI Commentary ───────────────────────────────── */}
      <section className="dash-form-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <h2 className="dash-form-section-title">AI commentary</h2>
        </div>
        <p className="dash-form-section-sub">
          Trigger a portfolio commentary generation. See the dedicated page for full history.
        </p>

        <div className="dash-form-grid">
          <div className="dash-form-group span-2">
            <span className="dash-form-label">Latest generation</span>
            <div
              style={{
                background: 'var(--navy-3)',
                border: '1px solid var(--line)',
                borderRadius: 2,
                padding: '11px 13px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <IconCalendar width={14} height={14} style={{ color: 'var(--gold)' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: 'var(--ink)', fontSize: 13 }}>
                  {relTime(displayLastCommentary)}
                </div>
                <div className="dash-form-hint" style={{ marginTop: 2 }}>
                  {absoluteTime(displayLastCommentary)}
                </div>
              </div>
              <Link
                href="/admin/ai-commentary"
                className="dash-btn btn-ghost btn-sm"
                style={{ textDecoration: 'none' }}
              >
                View history <IconExternalLink width={12} height={12} />
              </Link>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="dash-btn btn-gold"
            onClick={triggerCommentary}
            disabled={generating}
          >
            <IconRefresh width={14} height={14} />
            {generating ? 'Generating…' : 'Generate now'}
          </button>
        </div>

        {commentaryResp && (
          <ApiResultPanel title="Commentary response" resp={commentaryResp} />
        )}
      </section>

      {/* ── Danger Zone ─────────────────────────────────── */}
      <section className="dash-form-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <h2 className="dash-form-section-title" style={{ color: 'var(--dash-red)' }}>
            Danger zone
          </h2>
        </div>
        <p className="dash-form-section-sub">
          Destructive operations — disabled until a confirmation flow is wired up.
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="dash-btn btn-danger"
            disabled
            title="Not implemented yet — requires explicit confirmation flow"
          >
            Reset portfolio data
          </button>
          <button
            type="button"
            className="dash-btn btn-danger"
            disabled
            title="Not implemented yet — requires explicit confirmation flow"
          >
            Clear price cache
          </button>
        </div>
      </section>
    </>
  )
}

function ApiResultPanel({ title, resp }: { title: string; resp: ApiResponse }) {
  const ok = resp.ok
  const cls = ok ? 'dash-alert' : 'dash-alert alert-error'
  return (
    <div className={cls} style={{ marginTop: 14 }}>
      <div
        className="dash-alert-title"
        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
      >
        {ok ? <IconCheck width={12} height={12} /> : <IconAlertCircle width={12} height={12} />}
        {title} — {resp.status || 'network error'}
      </div>
      <div className="dash-alert-body" style={{ marginTop: 6 }}>
        <pre
          style={{
            margin: 0,
            background: 'var(--navy-3)',
            border: '1px solid var(--line)',
            borderRadius: 2,
            padding: 10,
            fontSize: 11,
            color: 'var(--ink-mute)',
            overflowX: 'auto',
            maxHeight: 220,
            fontFamily: 'var(--mono, var(--sans))',
          }}
        >
          {typeof resp.body === 'string'
            ? resp.body
            : JSON.stringify(resp.body, null, 2)}
        </pre>
        <div className="dash-form-hint" style={{ marginTop: 4 }}>
          at {new Date(resp.at).toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
}
