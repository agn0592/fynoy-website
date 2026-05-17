'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ResponsiveContainer, AreaChart, Area } from 'recharts'
import {
  IconStar, IconSearch, IconPlus, IconDelete, IconEdit,
  IconTrendingUp, IconTrendingDown, IconAlertCircle, IconCheck,
  IconBriefcase, IconClose,
} from '@/app/dashboard/components/Icons'

// ───────────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────────
interface WatchItem {
  symbol: string
  note: string
  target_price: number | null
  alert_above: boolean
  added_at: string
}

interface PricePoint { date: string; close: number }

interface PriceState {
  status: 'idle' | 'loading' | 'loaded' | 'error'
  history: PricePoint[]
  last: number | null
  prev: number | null
  changePct: number | null
}

type SortKey = 'symbol' | 'change' | 'target'

const STORAGE_KEY = 'fynoy-watchlist'

// ───────────────────────────────────────────────────────────────────
// Utilities
// ───────────────────────────────────────────────────────────────────
function loadWatchlist(): WatchItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((item: unknown) => {
        if (typeof item !== 'object' || item === null) return null
        const r = item as Record<string, unknown>
        const symbol = typeof r.symbol === 'string' ? r.symbol.toUpperCase() : ''
        if (!symbol) return null
        return {
          symbol,
          note: typeof r.note === 'string' ? r.note : '',
          target_price: typeof r.target_price === 'number' && Number.isFinite(r.target_price) ? r.target_price : null,
          alert_above: typeof r.alert_above === 'boolean' ? r.alert_above : true,
          added_at: typeof r.added_at === 'string' ? r.added_at : new Date().toISOString(),
        } as WatchItem
      })
      .filter((x): x is WatchItem => x !== null)
  } catch {
    return []
  }
}

function saveWatchlist(items: WatchItem[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // ignore quota errors
  }
}

function fromIsoNDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}

function fmtPrice(v: number | null): string {
  if (v === null || !Number.isFinite(v)) return '—'
  return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtPct(v: number): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
}

// ───────────────────────────────────────────────────────────────────
// Sparkline
// ───────────────────────────────────────────────────────────────────
function Sparkline({ data, up }: { data: PricePoint[]; up: boolean }) {
  if (data.length < 2) return null
  const gradId = `spark-${Math.random().toString(36).slice(2, 8)}`
  const stroke = up ? 'var(--dash-green)' : 'var(--dash-red)'
  const fillStroke = up ? '#4ade80' : '#f87171'
  return (
    <div style={{ height: 56, marginTop: 12, marginInline: -4 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fillStroke} stopOpacity={0.28} />
              <stop offset="100%" stopColor={fillStroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="close"
            stroke={stroke}
            strokeWidth={1.6}
            fill={`url(#${gradId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ───────────────────────────────────────────────────────────────────
// Add form
// ───────────────────────────────────────────────────────────────────
interface AddFormProps {
  onAdd: (item: WatchItem) => void
  existingSymbols: string[]
}

function AddForm({ onAdd, existingSymbols }: AddFormProps) {
  const [symbol, setSymbol] = useState('')
  const [target, setTarget] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const sym = symbol.trim().toUpperCase()
    if (!sym) {
      setError('Symbol is required')
      return
    }
    if (!/^[A-Z0-9.\-]{1,12}$/.test(sym)) {
      setError('Symbol must contain only letters, numbers, dot, hyphen')
      return
    }
    if (existingSymbols.includes(sym)) {
      setError('Symbol already on your watchlist')
      return
    }
    const tp = target.trim() ? Number(target) : null
    if (target.trim() && (!Number.isFinite(tp) || (tp as number) <= 0)) {
      setError('Target price must be a positive number')
      return
    }
    onAdd({
      symbol: sym,
      note: note.trim(),
      target_price: tp,
      alert_above: true,
      added_at: new Date().toISOString(),
    })
    setSymbol('')
    setTarget('')
    setNote('')
  }

  return (
    <div className="dash-card">
      <div className="dash-card-header">
        <div>
          <div className="dash-card-title">Add to Watchlist</div>
          <div className="dash-card-sub">Track symbols you're researching</div>
        </div>
      </div>
      <div className="dash-card-body">
        <form onSubmit={handleSubmit}>
          <div className="dash-form-grid">
            <div className="dash-form-group" style={{ marginBottom: 0 }}>
              <label className="dash-form-label" htmlFor="wl-symbol">
                Symbol<span className="req">*</span>
              </label>
              <input
                id="wl-symbol"
                className="dash-input"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="e.g. AAPL"
                autoComplete="off"
                maxLength={12}
                style={{ textTransform: 'uppercase' }}
              />
            </div>
            <div className="dash-form-group" style={{ marginBottom: 0 }}>
              <label className="dash-form-label" htmlFor="wl-target">Target price</label>
              <input
                id="wl-target"
                className="dash-input"
                type="number"
                step="0.01"
                min="0"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="dash-form-group span-2" style={{ marginBottom: 0 }}>
              <label className="dash-form-label" htmlFor="wl-note">Note</label>
              <input
                id="wl-note"
                className="dash-input"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional thesis / reminder"
                maxLength={140}
              />
            </div>
          </div>
          {error && (
            <div className="dash-form-error" style={{ marginTop: 12 }}>{error}</div>
          )}
          <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="submit" className="dash-btn btn-gold">
              <IconPlus />
              Add symbol
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ───────────────────────────────────────────────────────────────────
// Watch card
// ───────────────────────────────────────────────────────────────────
interface CardProps {
  item: WatchItem
  price: PriceState | undefined
  isHeld: boolean
  onEdit: (next: WatchItem) => void
  onDelete: (symbol: string) => void
}

function WatchCard({ item, price, isHeld, onEdit, onDelete }: CardProps) {
  const [editing, setEditing] = useState(false)
  const [editTarget, setEditTarget] = useState(item.target_price !== null ? String(item.target_price) : '')
  const [editNote, setEditNote] = useState(item.note)
  const [editError, setEditError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const last = price?.last ?? null
  const changePct = price?.changePct ?? null
  const sparkData = useMemo(() => price?.history.slice(-30) ?? [], [price?.history])
  const isUp = (changePct ?? 0) >= 0

  const toTargetPct = useMemo(() => {
    if (item.target_price === null || last === null || last <= 0) return null
    return ((item.target_price - last) / last) * 100
  }, [item.target_price, last])

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    setEditError(null)
    const tp = editTarget.trim() ? Number(editTarget) : null
    if (editTarget.trim() && (!Number.isFinite(tp) || (tp as number) <= 0)) {
      setEditError('Target must be > 0')
      return
    }
    onEdit({
      ...item,
      target_price: tp,
      note: editNote.trim(),
    })
    setEditing(false)
  }

  const handleCancelEdit = () => {
    setEditTarget(item.target_price !== null ? String(item.target_price) : '')
    setEditNote(item.note)
    setEditError(null)
    setEditing(false)
  }

  return (
    <div className="dash-card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="dash-card-header" style={{ alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <span
              className="dash-symbol"
              style={{ fontSize: 22, letterSpacing: '0.01em' }}
            >
              {item.symbol}
            </span>
            {isHeld && (
              <span
                className="status-badge active"
                title="You already hold this position"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                <IconBriefcase width={10} height={10} />
                In portfolio
              </span>
            )}
          </div>
          <div className="dash-card-sub" style={{ marginTop: 4 }}>
            Added {new Date(item.added_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {!editing && !confirmDelete && (
            <>
              <button
                type="button"
                className="dash-btn btn-ghost btn-sm"
                onClick={() => setEditing(true)}
                aria-label={`Edit ${item.symbol}`}
                style={{ padding: '6px 8px', minWidth: 36, minHeight: 36, justifyContent: 'center' }}
              >
                <IconEdit width={14} height={14} />
              </button>
              <button
                type="button"
                className="dash-btn btn-ghost btn-sm"
                onClick={() => setConfirmDelete(true)}
                aria-label={`Remove ${item.symbol}`}
                style={{ padding: '6px 8px', minWidth: 36, minHeight: 36, justifyContent: 'center' }}
              >
                <IconDelete width={14} height={14} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="dash-card-body" style={{ paddingTop: 12, flex: 1 }}>
        {/* Current price + change */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-dim)', marginBottom: 2 }}>
              Last close
            </div>
            {price?.status === 'loading' || price === undefined ? (
              <div className="dash-skel" style={{ width: 90, height: 22 }} />
            ) : last !== null ? (
              <div style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--ink)', letterSpacing: '-0.01em', lineHeight: 1 }}>
                ${fmtPrice(last)}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--ink-dim)', fontStyle: 'italic', fontFamily: 'var(--serif)' }}>
                Unavailable
              </div>
            )}
          </div>
          {changePct !== null && (
            <span className={`ret-badge ${isUp ? 'up' : 'dn'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {isUp ? <IconTrendingUp width={11} height={11} /> : <IconTrendingDown width={11} height={11} />}
              {fmtPct(changePct)}
            </span>
          )}
        </div>

        {/* Sparkline */}
        {price?.status === 'loading' && sparkData.length === 0 && (
          <div className="dash-skel" style={{ height: 56, marginTop: 12 }} />
        )}
        {sparkData.length >= 2 && <Sparkline data={sparkData} up={isUp} />}

        {/* Target price */}
        {item.target_price !== null && (
          <div style={{
            marginTop: 14,
            padding: '10px 12px',
            background: 'rgba(201,169,110,0.04)',
            border: '1px solid var(--gold-line)',
            borderRadius: 2,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-dim)' }}>
                Target
              </span>
              <span style={{ fontFamily: 'var(--serif)', fontSize: 14, color: 'var(--gold)' }}>
                ${fmtPrice(item.target_price)}
              </span>
            </div>
            {toTargetPct !== null && (
              <div style={{ marginTop: 4, fontSize: 11, color: 'var(--ink-mute)' }}>
                {toTargetPct >= 0
                  ? <>{fmtPct(toTargetPct)} to target</>
                  : <>{fmtPct(Math.abs(toTargetPct))} past target</>}
              </div>
            )}
          </div>
        )}

        {/* Note */}
        {item.note && (
          <div style={{
            marginTop: 12,
            fontSize: 12,
            color: 'var(--ink-mute)',
            lineHeight: 1.5,
            fontStyle: 'italic',
            fontFamily: 'var(--serif)',
            borderLeft: '2px solid var(--line)',
            paddingLeft: 10,
          }}>
            {item.note}
          </div>
        )}

        {/* Edit form */}
        {editing && (
          <form onSubmit={handleSaveEdit} style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
            <div className="dash-form-group" style={{ marginBottom: 10 }}>
              <label className="dash-form-label" htmlFor={`edit-target-${item.symbol}`}>Target</label>
              <input
                id={`edit-target-${item.symbol}`}
                className="dash-input"
                type="number"
                step="0.01"
                min="0"
                value={editTarget}
                onChange={(e) => setEditTarget(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="dash-form-group" style={{ marginBottom: 10 }}>
              <label className="dash-form-label" htmlFor={`edit-note-${item.symbol}`}>Note</label>
              <input
                id={`edit-note-${item.symbol}`}
                className="dash-input"
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="Optional"
                maxLength={140}
              />
            </div>
            {editError && <div className="dash-form-error" style={{ marginBottom: 10 }}>{editError}</div>}
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="submit" className="dash-btn btn-gold btn-sm">
                <IconCheck width={12} height={12} />
                Save
              </button>
              <button type="button" className="dash-btn btn-ghost btn-sm" onClick={handleCancelEdit}>
                <IconClose width={12} height={12} />
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Delete confirm */}
        {confirmDelete && (
          <div style={{
            marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line)',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--dash-red)', fontSize: 12 }}>
              <IconAlertCircle width={14} height={14} />
              Remove {item.symbol} from watchlist?
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                className="dash-btn btn-danger btn-sm"
                onClick={() => onDelete(item.symbol)}
              >
                <IconDelete width={12} height={12} />
                Remove
              </button>
              <button
                type="button"
                className="dash-btn btn-ghost btn-sm"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ───────────────────────────────────────────────────────────────────
// Main client component
// ───────────────────────────────────────────────────────────────────
export default function WatchlistClient({ heldSymbols }: { heldSymbols: string[] }) {
  const [mounted, setMounted] = useState(false)
  const [items, setItems] = useState<WatchItem[]>([])
  const [prices, setPrices] = useState<Record<string, PriceState>>({})
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('symbol')
  const [filterMode, setFilterMode] = useState<'all' | 'held' | 'unheld' | 'targets'>('all')

  const heldSet = useMemo(() => new Set(heldSymbols.map(s => s.toUpperCase())), [heldSymbols])
  const fetchedRef = useRef<Set<string>>(new Set())

  // Mount: read localStorage
  useEffect(() => {
    setItems(loadWatchlist())
    setMounted(true)
  }, [])

  // Persist when items change (only after mount)
  useEffect(() => {
    if (!mounted) return
    saveWatchlist(items)
  }, [items, mounted])

  // Fetch prices for each symbol (once per symbol per session)
  const fetchPrice = useCallback(async (symbol: string) => {
    if (fetchedRef.current.has(symbol)) return
    fetchedRef.current.add(symbol)
    setPrices((prev) => ({
      ...prev,
      [symbol]: { status: 'loading', history: [], last: null, prev: null, changePct: null },
    }))
    try {
      const url = `/api/prices/history?symbol=${encodeURIComponent(symbol)}&from=${encodeURIComponent(fromIsoNDaysAgo(45))}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('fetch failed')
      const data = (await res.json()) as { prices?: PricePoint[] }
      const history = Array.isArray(data.prices) ? data.prices : []
      if (history.length === 0) {
        setPrices((prev) => ({
          ...prev,
          [symbol]: { status: 'error', history: [], last: null, prev: null, changePct: null },
        }))
        return
      }
      const last = history[history.length - 1]?.close ?? null
      const prev = history.length >= 2 ? history[history.length - 2]?.close ?? null : null
      const changePct = last !== null && prev !== null && prev !== 0
        ? ((last - prev) / prev) * 100
        : null
      setPrices((current) => ({
        ...current,
        [symbol]: { status: 'loaded', history, last, prev, changePct },
      }))
    } catch {
      setPrices((prev) => ({
        ...prev,
        [symbol]: { status: 'error', history: [], last: null, prev: null, changePct: null },
      }))
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    for (const item of items) {
      fetchPrice(item.symbol)
    }
  }, [mounted, items, fetchPrice])

  // ── Mutations ──────────────────────────────────────────────────
  const handleAdd = (item: WatchItem) => {
    setItems((prev) => {
      if (prev.some(p => p.symbol === item.symbol)) return prev
      return [...prev, item]
    })
  }

  const handleEdit = (next: WatchItem) => {
    setItems((prev) => prev.map(p => p.symbol === next.symbol ? next : p))
  }

  const handleDelete = (symbol: string) => {
    setItems((prev) => prev.filter(p => p.symbol !== symbol))
  }

  // ── Stats ──────────────────────────────────────────────────────
  const stats = useMemo(() => {
    let biggestGainer: { symbol: string; pct: number } | null = null
    let biggestLoser: { symbol: string; pct: number } | null = null
    for (const item of items) {
      const p = prices[item.symbol]
      if (!p || p.changePct === null) continue
      if (biggestGainer === null || p.changePct > biggestGainer.pct) {
        biggestGainer = { symbol: item.symbol, pct: p.changePct }
      }
      if (biggestLoser === null || p.changePct < biggestLoser.pct) {
        biggestLoser = { symbol: item.symbol, pct: p.changePct }
      }
    }
    return {
      total: items.length,
      biggestGainer,
      biggestLoser,
    }
  }, [items, prices])

  // ── Filter + sort ─────────────────────────────────────────────
  const visibleItems = useMemo(() => {
    const q = search.trim().toUpperCase()
    let filtered = items.filter(item => {
      if (q && !item.symbol.includes(q) && !item.note.toUpperCase().includes(q)) return false
      if (filterMode === 'held' && !heldSet.has(item.symbol)) return false
      if (filterMode === 'unheld' && heldSet.has(item.symbol)) return false
      if (filterMode === 'targets' && item.target_price === null) return false
      return true
    })

    filtered = [...filtered].sort((a, b) => {
      if (sortKey === 'symbol') return a.symbol.localeCompare(b.symbol)
      if (sortKey === 'change') {
        const ap = prices[a.symbol]?.changePct ?? -Infinity
        const bp = prices[b.symbol]?.changePct ?? -Infinity
        return bp - ap
      }
      if (sortKey === 'target') {
        const aLast = prices[a.symbol]?.last
        const bLast = prices[b.symbol]?.last
        const aDist = a.target_price !== null && aLast !== null && aLast !== undefined
          ? Math.abs((a.target_price - aLast) / aLast)
          : Infinity
        const bDist = b.target_price !== null && bLast !== null && bLast !== undefined
          ? Math.abs((b.target_price - bLast) / bLast)
          : Infinity
        return aDist - bDist
      }
      return 0
    })

    return filtered
  }, [items, search, sortKey, filterMode, heldSet, prices])

  // ── Render ────────────────────────────────────────────────────
  return (
    <>
      <div className="dash-page-head">
        <div className="dash-page-title-block">
          <h1 className="dash-page-title">
            Watchlist <em>& Targets</em>
          </h1>
          <div className="dash-page-sub">
            Symbols you're tracking — prices, sparklines, and target levels.
          </div>
        </div>
        <div className="dash-page-actions">
          <span style={{ fontSize: 11, color: 'var(--ink-dim)', letterSpacing: '0.04em' }}>
            Saved locally to your browser
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="dash-card" style={{ marginBottom: 16 }}>
        <div className="dash-stats-stack">
          <div className="dash-stat-cell">
            <div className="dash-stat-label">Symbols Watched</div>
            <div className="dash-stat-val flat">{mounted ? stats.total : '—'}</div>
            <div className="dash-stat-glow flat" />
          </div>
          <div className="dash-stat-cell">
            <div className="dash-stat-label">Biggest Gainer</div>
            <div className={`dash-stat-val ${stats.biggestGainer ? 'up' : 'flat'}`}>
              {stats.biggestGainer ? fmtPct(stats.biggestGainer.pct) : '—'}
            </div>
            <div className="dash-stat-sub">
              {stats.biggestGainer?.symbol ?? 'No data yet'}
            </div>
            <div className={`dash-stat-glow ${stats.biggestGainer ? 'up' : 'flat'}`} />
          </div>
          <div className="dash-stat-cell full-width">
            <div className="dash-stat-label">Biggest Loser</div>
            <div className={`dash-stat-val ${stats.biggestLoser ? 'dn' : 'flat'}`}>
              {stats.biggestLoser ? fmtPct(stats.biggestLoser.pct) : '—'}
            </div>
            <div className="dash-stat-sub">
              {stats.biggestLoser?.symbol ?? 'No data yet'}
            </div>
            <div className={`dash-stat-glow ${stats.biggestLoser ? 'dn' : 'flat'}`} />
          </div>
        </div>
      </div>

      {/* Add form */}
      <div style={{ marginBottom: 16 }}>
        <AddForm onAdd={handleAdd} existingSymbols={items.map(i => i.symbol)} />
      </div>

      {/* Filters / sort / search */}
      {mounted && items.length > 0 && (
        <div className="dash-card" style={{ marginBottom: 16 }}>
          <div className="dash-card-body" style={{ padding: '14px 20px' }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 160 }}>
                <input
                  className="dash-input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search symbol or note"
                  style={{ paddingLeft: 38 }}
                />
                <span style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--ink-dim)', pointerEvents: 'none',
                  display: 'flex',
                }}>
                  <IconSearch width={16} height={16} />
                </span>
              </div>
              <div className="dash-chips" role="tablist" aria-label="Filter watchlist">
                {[
                  { k: 'all', label: 'All' },
                  { k: 'held', label: 'Held' },
                  { k: 'unheld', label: 'Not held' },
                  { k: 'targets', label: 'With target' },
                ].map(opt => (
                  <button
                    key={opt.k}
                    type="button"
                    className={`dash-chip${filterMode === opt.k ? ' is-active' : ''}`}
                    onClick={() => setFilterMode(opt.k as typeof filterMode)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label htmlFor="wl-sort" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-dim)' }}>
                  Sort
                </label>
                <select
                  id="wl-sort"
                  className="dash-select"
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as SortKey)}
                  style={{ width: 'auto', minWidth: 150 }}
                >
                  <option value="symbol">Symbol (A-Z)</option>
                  <option value="change">Change % (desc)</option>
                  <option value="target">Closest to target</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid of cards */}
      {!mounted ? (
        <div className="dash-card">
          <div className="dash-empty">Loading watchlist…</div>
        </div>
      ) : items.length === 0 ? (
        <div className="dash-card">
          <div className="dash-card-body" style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 56, height: 56,
              border: '1px solid var(--gold-line)', borderRadius: 2,
              color: 'var(--gold)', marginBottom: 16,
            }}>
              <IconStar width={24} height={24} />
            </div>
            <div style={{
              fontFamily: 'var(--serif)', fontSize: 18, color: 'var(--ink)',
              marginBottom: 6, letterSpacing: '-0.01em',
            }}>
              Your watchlist is empty
            </div>
            <div style={{ color: 'var(--ink-mute)', fontSize: 13, maxWidth: 360, margin: '0 auto', lineHeight: 1.6 }}>
              Track symbols you're researching. Add a target price to monitor entries,
              or just a note to remind yourself why it's interesting.
            </div>
          </div>
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="dash-card">
          <div className="dash-empty">No symbols match your filters.</div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
        }}>
          {visibleItems.map(item => (
            <WatchCard
              key={item.symbol}
              item={item}
              price={prices[item.symbol]}
              isHeld={heldSet.has(item.symbol)}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </>
  )
}
