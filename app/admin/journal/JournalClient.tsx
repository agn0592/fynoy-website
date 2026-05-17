'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  IconBook,
  IconEdit,
  IconPlus,
  IconDelete,
  IconFilter,
  IconSearch,
  IconCalendar,
  IconCheck,
  IconAlertCircle,
  IconBriefcase,
} from '@/app/dashboard/components/Icons'
import type { JournalEntry, CaseRef, ClosedTradeRef } from './page'

interface JournalClientProps {
  initialEntries: JournalEntry[]
  cases: CaseRef[]
  closedTrades: ClosedTradeRef[]
}

const ENTRY_TYPES = [
  'Observation',
  'Pre-trade',
  'Mid-trade',
  'Post-trade',
  'Lesson',
  'Research note',
  'General',
] as const

type EntryType = (typeof ENTRY_TYPES)[number]

type FilterChip = 'all' | 'Observation' | 'Pre-trade' | 'Mid-trade' | 'Post-trade' | 'Lesson'
type DateRange = 'all' | 'year' | '30d' | '7d'

type ChipVariant = 'active' | 'info' | 'warning' | 'inactive'

interface TypeStyle {
  badge: ChipVariant
  dot: string
}

function getTypeStyle(type: string | null): TypeStyle {
  switch (type) {
    case 'Pre-trade':
      return { badge: 'info', dot: 'var(--dash-blue)' }
    case 'Mid-trade':
      return { badge: 'warning', dot: 'var(--gold)' }
    case 'Post-trade':
      return { badge: 'active', dot: 'var(--dash-green)' }
    case 'Observation':
      return { badge: 'inactive', dot: 'var(--ink-mute)' }
    case 'Lesson':
      return { badge: 'info', dot: 'var(--dash-purple)' }
    case 'Research note':
      return { badge: 'info', dot: 'var(--dash-blue)' }
    case 'General':
    default:
      return { badge: 'inactive', dot: 'var(--ink-dim)' }
  }
}

function formatDate(d: string | null | undefined): string {
  if (!d) return '—'
  return new Date(`${d}T12:00:00Z`).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function todayISO(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

interface FormState {
  trading_id: string
  entry_date: string
  entry_type: EntryType
  notes: string
  post_trade_reflection: string
}

function emptyForm(): FormState {
  return {
    trading_id: '',
    entry_date: todayISO(),
    entry_type: 'Observation',
    notes: '',
    post_trade_reflection: '',
  }
}

export default function JournalClient({
  initialEntries,
  cases,
  closedTrades,
}: JournalClientProps) {
  const [entries, setEntries] = useState<JournalEntry[]>(initialEntries)
  const [filter, setFilter] = useState<FilterChip>('all')
  const [dateRange, setDateRange] = useState<DateRange>('all')
  const [query, setQuery] = useState('')
  const [tradingFilter, setTradingFilter] = useState<string>('all')

  // Add form
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const formRef = useRef<HTMLDivElement | null>(null)

  // Edit form
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<FormState>(emptyForm())
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // Map trading_id -> case
  const caseByTradingId = useMemo(() => {
    const m = new Map<string, CaseRef>()
    for (const c of cases) {
      if (c.trading_id) m.set(c.trading_id, c)
    }
    return m
  }, [cases])

  // Pending reflections
  const pending = useMemo(() => {
    const postSet = new Set(
      entries
        .filter((e) => e.entry_type === 'Post-trade' && e.trading_id)
        .map((e) => e.trading_id as string),
    )
    return closedTrades.filter((t) => t.trading_id && !postSet.has(t.trading_id))
  }, [entries, closedTrades])

  // KPI counts
  const monthStartMs = useMemo(() => {
    const d = new Date()
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
    return d.getTime()
  }, [])

  const totalEntries = entries.length
  const thisMonthCount = useMemo(
    () =>
      entries.filter((e) => {
        const d = e.entry_date ?? e.created_at
        if (!d) return false
        return new Date(d).getTime() >= monthStartMs
      }).length,
    [entries, monthStartMs],
  )
  const reflectionCount = useMemo(
    () =>
      entries.filter(
        (e) => e.post_trade_reflection && e.post_trade_reflection.trim().length > 0,
      ).length,
    [entries],
  )
  const reflectionPct =
    totalEntries > 0 ? Math.round((reflectionCount / totalEntries) * 100) : 0

  // Filtered list
  const filteredEntries = useMemo(() => {
    const q = query.trim().toLowerCase()
    const now = Date.now()
    let cutoff: number | null = null
    if (dateRange === 'year') {
      const d = new Date()
      d.setMonth(0, 1)
      d.setHours(0, 0, 0, 0)
      cutoff = d.getTime()
    } else if (dateRange === '30d') {
      cutoff = now - 30 * 24 * 3_600_000
    } else if (dateRange === '7d') {
      cutoff = now - 7 * 24 * 3_600_000
    }
    return entries.filter((e) => {
      if (filter !== 'all' && e.entry_type !== filter) return false
      if (cutoff !== null) {
        const d = e.entry_date ?? e.created_at
        if (!d) return false
        if (new Date(d).getTime() < cutoff) return false
      }
      if (tradingFilter !== 'all') {
        if (tradingFilter === '__none__' && e.trading_id) return false
        if (tradingFilter !== '__none__' && e.trading_id !== tradingFilter) return false
      }
      if (q.length > 0) {
        const notes = (e.notes ?? '').toLowerCase()
        const refl = (e.post_trade_reflection ?? '').toLowerCase()
        if (!notes.includes(q) && !refl.includes(q)) return false
      }
      return true
    })
  }, [entries, filter, dateRange, query, tradingFilter])

  function buildInsertPayload(state: FormState) {
    const isPostTrade = state.entry_type === 'Post-trade'
    return {
      trading_id: state.trading_id ? state.trading_id : null,
      entry_date: state.entry_date || null,
      entry_type: state.entry_type,
      notes: state.notes.trim() || null,
      post_trade_reflection: isPostTrade && state.post_trade_reflection.trim()
        ? state.post_trade_reflection.trim()
        : null,
    }
  }

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError(null)
    if (form.notes.trim().length < 4) {
      setFormError('Notes must be at least 4 characters.')
      return
    }
    setSaving(true)
    const supabase = createClient()
    const payload = buildInsertPayload(form)
    const { data, error } = await supabase
      .from('journal')
      .insert([payload])
      .select('id, trading_id, entry_date, entry_type, notes, post_trade_reflection, created_at')
    if (error) {
      setFormError(error.message)
      setSaving(false)
      return
    }
    const newRows = (data ?? []) as JournalEntry[]
    setEntries((prev) => [...newRows, ...prev])
    setForm(emptyForm())
    setSaving(false)
    setAddOpen(false)
  }

  function startEdit(entry: JournalEntry) {
    setEditingId(entry.id)
    setEditError(null)
    const entryType = (ENTRY_TYPES as readonly string[]).includes(entry.entry_type ?? '')
      ? (entry.entry_type as EntryType)
      : 'General'
    setEditForm({
      trading_id: entry.trading_id ?? '',
      entry_date: entry.entry_date ?? todayISO(),
      entry_type: entryType,
      notes: entry.notes ?? '',
      post_trade_reflection: entry.post_trade_reflection ?? '',
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditError(null)
    setEditForm(emptyForm())
  }

  async function handleUpdate(id: string, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEditError(null)
    if (editForm.notes.trim().length < 4) {
      setEditError('Notes must be at least 4 characters.')
      return
    }
    setEditSaving(true)
    const supabase = createClient()
    const payload = buildInsertPayload(editForm)
    const { data, error } = await supabase
      .from('journal')
      .update(payload)
      .eq('id', id)
      .select('id, trading_id, entry_date, entry_type, notes, post_trade_reflection, created_at')
    if (error) {
      setEditError(error.message)
      setEditSaving(false)
      return
    }
    const updated = ((data ?? []) as JournalEntry[])[0]
    if (updated) {
      setEntries((prev) => prev.map((r) => (r.id === id ? updated : r)))
    }
    setEditSaving(false)
    cancelEdit()
  }

  async function handleDelete(id: string) {
    const ok = window.confirm('Delete this journal entry? This cannot be undone.')
    if (!ok) return
    const supabase = createClient()
    const prior = entries
    setEntries((prev) => prev.filter((r) => r.id !== id))
    const { error } = await supabase.from('journal').delete().eq('id', id)
    if (error) {
      setEntries(prior)
      window.alert(`Failed to delete: ${error.message}`)
    }
  }

  function fillFromPending(t: ClosedTradeRef) {
    setAddOpen(true)
    setForm({
      trading_id: t.trading_id ?? '',
      entry_date: t.exit_date ?? todayISO(),
      entry_type: 'Post-trade',
      notes: '',
      post_trade_reflection: '',
    })
    setFormError(null)
    requestAnimationFrame(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    })
  }

  const chips: { key: FilterChip; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'Observation', label: 'Observation' },
    { key: 'Pre-trade', label: 'Pre-trade' },
    { key: 'Mid-trade', label: 'Mid-trade' },
    { key: 'Post-trade', label: 'Post-trade' },
    { key: 'Lesson', label: 'Lesson' },
  ]

  const rangeOptions: { key: DateRange; label: string }[] = [
    { key: 'all', label: 'All time' },
    { key: 'year', label: 'This year' },
    { key: '30d', label: 'Last 30 days' },
    { key: '7d', label: 'Last 7 days' },
  ]

  return (
    <>
      <div className="dash-page-head">
        <div className="dash-page-title-block">
          <h1 className="dash-page-title">
            Trading <em>Journal</em>
          </h1>
          <div className="dash-page-sub">Notes, observations, and post-trade reflections.</div>
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
            <IconBook width={14} height={14} />
            {totalEntries} entries
          </span>
        </div>
      </div>

      {/* KPI strip */}
      <div
        className="adm-kpi-grid"
        style={{ marginBottom: 16, gridTemplateColumns: 'repeat(4, 1fr)' }}
      >
        <Kpi label="Total entries" value={String(totalEntries)} />
        <Kpi
          label="This month"
          value={String(thisMonthCount)}
          accent={thisMonthCount > 0 ? 'up' : 'neutral'}
        />
        <Kpi
          label="With reflections"
          value={String(reflectionCount)}
          sub={totalEntries > 0 ? `${reflectionPct}% of total` : undefined}
          accent="neutral"
        />
        <Kpi
          label="Pending reflections"
          value={String(pending.length)}
          accent={pending.length > 0 ? 'dn' : 'up'}
          sub={pending.length > 0 ? 'closed trades without notes' : 'all caught up'}
        />
      </div>

      {/* Quick add form */}
      <div ref={formRef} className="dash-form-section" style={{ padding: 0 }}>
        <details
          open={addOpen}
          onToggle={(e) => setAddOpen((e.target as HTMLDetailsElement).open)}
          style={{ width: '100%' }}
        >
          <summary
            style={{
              listStyle: 'none',
              cursor: 'pointer',
              padding: '18px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span className="dash-form-section-title">New entry</span>
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--ink-dim)',
                  letterSpacing: '0.04em',
                }}
              >
                Capture an observation, pre-trade thesis, or post-trade reflection.
              </span>
            </div>
            <span
              className="dash-btn btn-outline btn-sm"
              style={{ pointerEvents: 'none' }}
              aria-hidden
            >
              <IconPlus width={12} height={12} />
              {addOpen ? 'Close' : 'Add entry'}
            </span>
          </summary>

          <form
            onSubmit={handleAdd}
            style={{
              padding: '0 24px 22px',
              borderTop: '1px solid var(--line)',
            }}
          >
            {formError && (
              <div
                className="dash-alert alert-error"
                style={{ marginTop: 16, marginBottom: 4 }}
              >
                <div
                  className="dash-alert-title"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <IconAlertCircle width={12} height={12} />
                  Could not save
                </div>
                <div className="dash-alert-body" style={{ marginTop: 4 }}>
                  {formError}
                </div>
              </div>
            )}

            <div className="dash-form-grid" style={{ marginTop: 16 }}>
              <div className="dash-form-group">
                <label className="dash-form-label" htmlFor="add_trading_id">
                  Trading ID
                </label>
                <select
                  id="add_trading_id"
                  className="dash-select"
                  value={form.trading_id}
                  onChange={(e) => setForm((s) => ({ ...s, trading_id: e.target.value }))}
                >
                  <option value="">(no case)</option>
                  {cases.map((c) => (
                    <option key={c.id} value={c.trading_id}>
                      {(c.ticker ?? '—') + ' — ' + (c.company_name ?? c.trading_id)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="dash-form-group">
                <label className="dash-form-label" htmlFor="add_entry_date">
                  Entry date
                </label>
                <input
                  id="add_entry_date"
                  type="date"
                  className="dash-input"
                  value={form.entry_date}
                  onChange={(e) => setForm((s) => ({ ...s, entry_date: e.target.value }))}
                />
              </div>

              <div className="dash-form-group">
                <label className="dash-form-label" htmlFor="add_entry_type">
                  Entry type
                </label>
                <select
                  id="add_entry_type"
                  className="dash-select"
                  value={form.entry_type}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, entry_type: e.target.value as EntryType }))
                  }
                >
                  {ENTRY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="dash-form-group span-all">
                <label className="dash-form-label" htmlFor="add_notes">
                  Notes <span className="req">*</span>
                </label>
                <textarea
                  id="add_notes"
                  className="dash-textarea"
                  rows={4}
                  required
                  minLength={4}
                  placeholder="What happened? What did you observe?"
                  value={form.notes}
                  onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
                />
              </div>

              {form.entry_type === 'Post-trade' && (
                <div className="dash-form-group span-all">
                  <label className="dash-form-label" htmlFor="add_reflection">
                    Post-trade reflection
                  </label>
                  <textarea
                    id="add_reflection"
                    className="dash-textarea"
                    rows={4}
                    placeholder="What worked? What didn't? Lessons learned."
                    value={form.post_trade_reflection}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, post_trade_reflection: e.target.value }))
                    }
                  />
                  <div className="dash-form-hint">
                    Shown only for Post-trade entries. Optional.
                  </div>
                </div>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
                marginTop: 8,
              }}
            >
              <button
                type="submit"
                disabled={saving}
                className="dash-btn btn-gold"
              >
                <IconPlus width={12} height={12} />
                {saving ? 'Saving…' : 'Add entry'}
              </button>
              <button
                type="button"
                className="dash-btn btn-ghost"
                onClick={() => {
                  setForm(emptyForm())
                  setFormError(null)
                }}
                disabled={saving}
              >
                Reset
              </button>
            </div>
          </form>
        </details>
      </div>

      {/* Filter bar */}
      <div
        className="dash-card"
        style={{
          padding: '14px 18px',
          marginBottom: 16,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div className="dash-chips">
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              className={`dash-chip${filter === c.key ? ' is-active' : ''}`}
              onClick={() => setFilter(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--ink-dim)',
              fontSize: 11,
            }}
          >
            <IconCalendar width={13} height={13} />
            <select
              className="dash-select"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRange)}
              style={{ padding: '6px 28px 6px 10px', fontSize: 12, width: 'auto' }}
              aria-label="Date range"
            >
              {rangeOptions.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--ink-dim)',
              fontSize: 11,
            }}
          >
            <IconFilter width={13} height={13} />
            <select
              className="dash-select"
              value={tradingFilter}
              onChange={(e) => setTradingFilter(e.target.value)}
              style={{ padding: '6px 28px 6px 10px', fontSize: 12, width: 'auto' }}
              aria-label="Filter by trading ID"
            >
              <option value="all">All trading IDs</option>
              <option value="__none__">(no case)</option>
              {cases.map((c) => (
                <option key={c.id} value={c.trading_id}>
                  {(c.ticker ?? '—') + ' — ' + (c.company_name ?? c.trading_id)}
                </option>
              ))}
            </select>
          </div>

          <div style={{ position: 'relative', minWidth: 200 }}>
            <IconSearch
              width={14}
              height={14}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--ink-dim)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="search"
              className="dash-input"
              placeholder="Search notes…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ paddingLeft: 34, fontSize: 12, padding: '6px 10px 6px 32px' }}
            />
          </div>
        </div>
      </div>

      {/* Pending reflections */}
      {pending.length > 0 && (
        <div className="dash-card" style={{ marginBottom: 16 }}>
          <div className="dash-card-header">
            <div>
              <h3 className="dash-card-title">Pending reflections</h3>
              <div className="dash-card-sub">
                Closed trades without a post-trade entry
              </div>
            </div>
            <span
              className="status-badge warning"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <IconAlertCircle width={11} height={11} />
              {pending.length}
            </span>
          </div>
          <div className="dash-card-body" style={{ padding: 0 }}>
            <ul className="activity-list">
              {pending.map((t, idx) => {
                const pnl = t.realized_pnl_pct ?? 0
                const up = pnl >= 0
                const c = t.trading_id ? caseByTradingId.get(t.trading_id) : undefined
                return (
                  <li
                    key={`${t.trading_id ?? 'na'}-${idx}`}
                    className="activity-item"
                  >
                    <span
                      className="activity-dot"
                      style={{
                        background: up ? 'var(--dash-green)' : 'var(--dash-red)',
                      }}
                    />
                    <div className="activity-content">
                      <div
                        className="activity-label"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'var(--serif)',
                            fontWeight: 600,
                            color: 'var(--ink)',
                          }}
                        >
                          {t.symbol ?? '—'}
                        </span>
                        {c && (
                          <span style={{ color: 'var(--ink-mute)', fontSize: 12 }}>
                            {c.company_name ?? c.trading_id}
                          </span>
                        )}
                        <span
                          style={{
                            color: up ? 'var(--dash-green)' : 'var(--dash-red)',
                            fontWeight: 600,
                            fontSize: 12,
                          }}
                        >
                          {up ? '+' : ''}
                          {pnl.toFixed(2)}%
                        </span>
                      </div>
                      <div className="activity-date">
                        Exited {formatDate(t.exit_date)}
                        {t.trading_id ? ` · ${t.trading_id}` : ''}
                      </div>
                    </div>
                    <div className="activity-meta">
                      <button
                        type="button"
                        className="dash-btn btn-outline btn-sm"
                        onClick={() => fillFromPending(t)}
                      >
                        Add reflection →
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}

      {/* Entry list */}
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        {filteredEntries.length === 0 ? (
          <div className="dash-card">
            <div className="dash-empty">
              {entries.length === 0
                ? 'No journal entries yet. Add your first observation above.'
                : 'No entries match your filters.'}
            </div>
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const style = getTypeStyle(entry.entry_type)
            const c = entry.trading_id ? caseByTradingId.get(entry.trading_id) : undefined
            const isEditing = editingId === entry.id
            return (
              <div className="dash-card" key={entry.id} style={{ padding: 0 }}>
                {isEditing ? (
                  <form
                    onSubmit={(e) => handleUpdate(entry.id, e)}
                    style={{ padding: '18px 22px' }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 14,
                        gap: 8,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div className="dash-form-section-title" style={{ margin: 0 }}>
                        Edit entry
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: 'var(--ink-dim)',
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {entry.id.slice(0, 8)}
                      </div>
                    </div>

                    {editError && (
                      <div
                        className="dash-alert alert-error"
                        style={{ marginBottom: 12 }}
                      >
                        <div
                          className="dash-alert-title"
                          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          <IconAlertCircle width={12} height={12} />
                          Could not save
                        </div>
                        <div className="dash-alert-body" style={{ marginTop: 4 }}>
                          {editError}
                        </div>
                      </div>
                    )}

                    <div className="dash-form-grid">
                      <div className="dash-form-group">
                        <label
                          className="dash-form-label"
                          htmlFor={`edit_trading_${entry.id}`}
                        >
                          Trading ID
                        </label>
                        <select
                          id={`edit_trading_${entry.id}`}
                          className="dash-select"
                          value={editForm.trading_id}
                          onChange={(e) =>
                            setEditForm((s) => ({ ...s, trading_id: e.target.value }))
                          }
                        >
                          <option value="">(no case)</option>
                          {cases.map((cc) => (
                            <option key={cc.id} value={cc.trading_id}>
                              {(cc.ticker ?? '—') +
                                ' — ' +
                                (cc.company_name ?? cc.trading_id)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="dash-form-group">
                        <label
                          className="dash-form-label"
                          htmlFor={`edit_date_${entry.id}`}
                        >
                          Entry date
                        </label>
                        <input
                          id={`edit_date_${entry.id}`}
                          type="date"
                          className="dash-input"
                          value={editForm.entry_date}
                          onChange={(e) =>
                            setEditForm((s) => ({ ...s, entry_date: e.target.value }))
                          }
                        />
                      </div>

                      <div className="dash-form-group">
                        <label
                          className="dash-form-label"
                          htmlFor={`edit_type_${entry.id}`}
                        >
                          Entry type
                        </label>
                        <select
                          id={`edit_type_${entry.id}`}
                          className="dash-select"
                          value={editForm.entry_type}
                          onChange={(e) =>
                            setEditForm((s) => ({
                              ...s,
                              entry_type: e.target.value as EntryType,
                            }))
                          }
                        >
                          {ENTRY_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="dash-form-group span-all">
                        <label
                          className="dash-form-label"
                          htmlFor={`edit_notes_${entry.id}`}
                        >
                          Notes <span className="req">*</span>
                        </label>
                        <textarea
                          id={`edit_notes_${entry.id}`}
                          className="dash-textarea"
                          rows={4}
                          required
                          minLength={4}
                          value={editForm.notes}
                          onChange={(e) =>
                            setEditForm((s) => ({ ...s, notes: e.target.value }))
                          }
                        />
                      </div>

                      {editForm.entry_type === 'Post-trade' && (
                        <div className="dash-form-group span-all">
                          <label
                            className="dash-form-label"
                            htmlFor={`edit_refl_${entry.id}`}
                          >
                            Post-trade reflection
                          </label>
                          <textarea
                            id={`edit_refl_${entry.id}`}
                            className="dash-textarea"
                            rows={4}
                            value={editForm.post_trade_reflection}
                            onChange={(e) =>
                              setEditForm((s) => ({
                                ...s,
                                post_trade_reflection: e.target.value,
                              }))
                            }
                          />
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        gap: 8,
                        flexWrap: 'wrap',
                        marginTop: 4,
                      }}
                    >
                      <button
                        type="submit"
                        className="dash-btn btn-gold"
                        disabled={editSaving}
                      >
                        <IconCheck width={12} height={12} />
                        {editSaving ? 'Saving…' : 'Save changes'}
                      </button>
                      <button
                        type="button"
                        className="dash-btn btn-ghost"
                        onClick={cancelEdit}
                        disabled={editSaving}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div style={{ padding: '16px 20px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 10,
                        flexWrap: 'wrap',
                        marginBottom: 12,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          className="activity-dot"
                          style={{
                            background: style.dot,
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            display: 'inline-block',
                          }}
                        />
                        <span
                          style={{
                            fontFamily: 'var(--serif)',
                            fontSize: 14,
                            color: 'var(--ink)',
                            fontWeight: 500,
                          }}
                        >
                          {formatDate(entry.entry_date)}
                        </span>
                        <span className={`status-badge ${style.badge}`}>
                          {entry.entry_type ?? 'General'}
                        </span>
                        {entry.trading_id &&
                          (c ? (
                            <Link
                              href={`/admin/cases/${c.id}`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                color: 'var(--gold)',
                                fontSize: 12,
                                textDecoration: 'none',
                                fontFamily: 'var(--serif)',
                              }}
                            >
                              <IconBriefcase width={12} height={12} />
                              {(c.ticker ?? entry.trading_id) +
                                (c.company_name ? ` · ${c.company_name}` : '')}
                            </Link>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                color: 'var(--ink-mute)',
                                fontSize: 12,
                              }}
                            >
                              <IconBriefcase width={12} height={12} />
                              {entry.trading_id}
                            </span>
                          ))}
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          className="dash-btn btn-ghost btn-sm"
                          onClick={() => startEdit(entry)}
                          aria-label="Edit entry"
                        >
                          <IconEdit width={12} height={12} />
                          Edit
                        </button>
                        <button
                          type="button"
                          className="dash-btn btn-danger btn-sm"
                          onClick={() => handleDelete(entry.id)}
                          aria-label="Delete entry"
                        >
                          <IconDelete width={12} height={12} />
                          Delete
                        </button>
                      </div>
                    </div>

                    <div
                      style={{
                        color: 'var(--ink)',
                        fontSize: 14,
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'var(--sans)',
                      }}
                    >
                      {entry.notes ?? ''}
                    </div>

                    {entry.post_trade_reflection &&
                      entry.post_trade_reflection.trim().length > 0 && (
                        <div
                          style={{
                            marginTop: 14,
                            paddingTop: 14,
                            borderTop: '1px solid var(--line)',
                          }}
                        >
                          <div
                            style={{
                              fontSize: 10,
                              letterSpacing: '0.14em',
                              textTransform: 'uppercase',
                              color: 'var(--gold)',
                              marginBottom: 6,
                              fontWeight: 600,
                            }}
                          >
                            Post-trade reflection
                          </div>
                          <div
                            style={{
                              color: 'var(--ink)',
                              fontSize: 14,
                              lineHeight: 1.6,
                              whiteSpace: 'pre-wrap',
                              fontFamily: 'var(--sans)',
                            }}
                          >
                            {entry.post_trade_reflection}
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </>
  )
}

function Kpi({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string
  sub?: string
  accent?: 'up' | 'dn' | 'neutral'
}) {
  const cls =
    accent === 'up'
      ? 'adm-kpi kpi-up'
      : accent === 'dn'
      ? 'adm-kpi kpi-dn'
      : accent === 'neutral'
      ? 'adm-kpi kpi-neutral'
      : 'adm-kpi'
  return (
    <div className={cls}>
      <div className="adm-kpi-label">{label}</div>
      <div className="adm-kpi-val">{value}</div>
      {sub && <div className="adm-kpi-sub">{sub}</div>}
    </div>
  )
}
