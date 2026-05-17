import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import AuditClient from './AuditClient'

import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Audit Log' }

function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export interface AuditEvent {
  id: string
  action: string
  actor_id: string | null
  actor_name: string | null
  actor_email: string | null
  target: string | null
  detail: unknown
  created_at: string
  synthetic?: boolean
}

const RANGES = ['24h', '7d', '30d', 'all'] as const
type Range = (typeof RANGES)[number]

function rangeStart(range: Range): number | null {
  if (range === 'all') return null
  const now = Date.now()
  if (range === '24h') return now - 24 * 3_600_000
  if (range === '7d') return now - 7 * 24 * 3_600_000
  if (range === '30d') return now - 30 * 24 * 3_600_000
  return null
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams?: Promise<{ range?: string; category?: string }>
}) {
  const params = (await searchParams) ?? {}
  const rangeParam = (params.range as Range) ?? '7d'
  const range: Range = (RANGES as readonly string[]).includes(rangeParam) ? rangeParam : '7d'

  const supabase = getServiceClient()

  // Try audit_log
  let auditAvailable = true
  let auditEvents: AuditEvent[] = []

  const auditRes = await supabase
    .from('audit_log')
    .select('id, action, actor_id, target, detail, created_at')
    .order('created_at', { ascending: false })
    .limit(500)

  if (auditRes.error) {
    auditAvailable = false
  } else {
    const rows = auditRes.data ?? []
    // Resolve actor names
    const actorIds = Array.from(
      new Set(
        rows
          .map((r) => r.actor_id as string | null)
          .filter((v): v is string => typeof v === 'string'),
      ),
    )
    const actorMap = new Map<string, { name: string | null; email: string | null }>()
    if (actorIds.length > 0) {
      const { data: usersData } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', actorIds)
      for (const u of usersData ?? []) {
        actorMap.set(u.id as string, {
          name: (u.full_name as string | null) ?? null,
          email: (u.email as string | null) ?? null,
        })
      }
    }
    auditEvents = rows.map((r) => {
      const actor = r.actor_id ? actorMap.get(r.actor_id as string) : undefined
      return {
        id: String(r.id),
        action: (r.action as string) ?? 'unknown',
        actor_id: (r.actor_id as string | null) ?? null,
        actor_name: actor?.name ?? null,
        actor_email: actor?.email ?? null,
        target: (r.target as string | null) ?? null,
        detail: r.detail ?? null,
        created_at: (r.created_at as string) ?? new Date().toISOString(),
      }
    })
  }

  // Synthetic events — always pulled so the page feels populated
  const [{ data: commentaryRaw }, { data: closedRaw }, { data: openRaw }] = await Promise.all([
    supabase
      .from('commentary')
      .select('id, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('closed_trades')
      .select('id, symbol, exit_date, realized_pnl, last_synced_at')
      .order('exit_date', { ascending: false })
      .limit(5),
    supabase
      .from('open_positions')
      .select('symbol, last_synced_at')
      .order('last_synced_at', { ascending: false })
      .limit(3),
  ])

  const synthetic: AuditEvent[] = []
  for (const c of commentaryRaw ?? []) {
    synthetic.push({
      id: `syn-comm-${c.id}`,
      action: 'commentary.generated',
      actor_id: null,
      actor_name: 'system',
      actor_email: null,
      target: `commentary/${String(c.id).slice(0, 8)}`,
      detail: null,
      created_at: c.created_at as string,
      synthetic: true,
    })
  }
  for (const t of closedRaw ?? []) {
    if (!t.exit_date) continue
    synthetic.push({
      id: `syn-trade-${t.id}`,
      action: 'trade.closed',
      actor_id: null,
      actor_name: 'system',
      actor_email: null,
      target: (t.symbol as string) ?? null,
      detail: { realized_pnl: t.realized_pnl },
      created_at: new Date(`${t.exit_date}T12:00:00Z`).toISOString(),
      synthetic: true,
    })
  }
  // For ibkr.sync, dedupe by sync timestamp (one event per sync, not per symbol)
  const syncTimes = new Set<string>()
  for (const p of openRaw ?? []) {
    if (!p.last_synced_at) continue
    const ts = p.last_synced_at as string
    if (syncTimes.has(ts)) continue
    syncTimes.add(ts)
    synthetic.push({
      id: `syn-sync-${ts}`,
      action: 'ibkr.sync',
      actor_id: null,
      actor_name: 'system',
      actor_email: null,
      target: (p.symbol as string) ?? null,
      detail: null,
      created_at: ts,
      synthetic: true,
    })
    if (syncTimes.size >= 3) break
  }

  // KPI data: last sync, last commentary
  const lastSync = (openRaw ?? [])
    .map((p) => p.last_synced_at as string | null)
    .filter((v): v is string => !!v)
    .sort()
    .pop() ?? null
  const lastCommentary = ((commentaryRaw ?? [])[0]?.created_at as string | null) ?? null

  return (
    <AuditClient
      auditAvailable={auditAvailable}
      auditEvents={auditEvents}
      synthetic={synthetic}
      range={range}
      rangeStartMs={rangeStart(range)}
      lastSync={lastSync}
      lastCommentary={lastCommentary}
    />
  )
}
