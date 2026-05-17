import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createSessionClient } from '@/lib/supabase/server'

export const maxDuration = 60

// Bundesbank Time Series WT1010: yield on listed Federal securities,
// 10-year residual maturity, daily. Free, no auth required.
const BUNDESBANK_URL = 'https://api.statistiken.bundesbank.de/rest/data/BBK01/WT1010?format=csv'
const SERIES_LABEL = 'bundesbank-WT1010'

async function isAuthorized(request: NextRequest): Promise<boolean> {
  const auth = request.headers.get('authorization')
  if (auth && process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`) {
    return true
  }
  const manual = request.headers.get('x-sync-secret')
  if (manual && process.env.IBKR_SYNC_SECRET && manual === process.env.IBKR_SYNC_SECRET) {
    return true
  }
  const supabase = await createSessionClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { data: profile } = await service
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  return profile?.role === 'admin'
}

async function handle(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const res = await fetch(BUNDESBANK_URL, {
      headers: { 'User-Agent': 'fynoy-capital/1.0' },
    })
    if (!res.ok) {
      throw new Error(`Bundesbank API responded ${res.status}`)
    }
    const csv = await res.text()
    const rows = parseBundesbankCsv(csv)
    if (rows.length === 0) {
      throw new Error('No parseable observations in Bundesbank CSV')
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const records = rows.map(r => ({
      date: r.date,
      rate: r.rate,
      source: SERIES_LABEL,
      updated_at: new Date().toISOString(),
    }))

    const { error } = await supabase
      .from('risk_free_rates')
      .upsert(records, { onConflict: 'date' })

    if (error) throw new Error(error.message)

    const latest = rows[rows.length - 1]
    return Response.json({
      success: true,
      updated: rows.length,
      latest_date: latest.date,
      latest_rate_pct: (latest.rate * 100).toFixed(3),
    })
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    )
  }
}

// The Bundesbank CSV is observation-per-row but the exact column layout varies
// between series. We scan every row for the first ISO date and the first
// numeric token after it, which is robust to both ';' and ',' delimiters and
// to extra status/title columns.
function parseBundesbankCsv(csv: string): { date: string; rate: number }[] {
  const rows: { date: string; rate: number }[] = []
  for (const rawLine of csv.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue
    const cells = line.split(/[;,]/).map(c => c.replace(/^"|"$/g, '').trim())
    const dateIdx = cells.findIndex(c => /^\d{4}-\d{2}-\d{2}$/.test(c))
    if (dateIdx === -1) continue
    let rate: number | null = null
    for (let i = dateIdx + 1; i < cells.length; i++) {
      const v = cells[i].replace(',', '.')
      if (v === '' || v === '.' || v === '-') continue
      const num = Number(v)
      if (Number.isFinite(num)) {
        rate = num
        break
      }
    }
    if (rate === null) continue
    rows.push({ date: cells[dateIdx], rate: rate / 100 })
  }
  rows.sort((a, b) => a.date.localeCompare(b.date))
  return rows
}

export const GET = handle
export const POST = handle
