// Atlas — admin agent tool definitions for the Command Center.
// Each tool defines its Anthropic input_schema, whether it requires user
// confirmation (write tools = yes), and a handler that runs server-side.

import { createClient } from '@supabase/supabase-js'

function service() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export interface ToolDef {
  name: string
  description: string
  // Anthropic-compatible JSON schema for the tool's input.
  input_schema: Record<string, unknown>
  // True for write/destructive tools — frontend must confirm before execution.
  requiresConfirmation: boolean
  handler: (input: Record<string, unknown>) => Promise<unknown>
}

// ─── READ tools ────────────────────────────────────────────────────────

const listCases: ToolDef = {
  name: 'list_cases',
  description: 'List all investment cases with a compact summary. Useful for finding the right trading_id before editing.',
  input_schema: {
    type: 'object',
    properties: {
      status: { type: 'string', enum: ['Active', 'Not Active'], description: 'Optional status filter.' },
    },
  },
  requiresConfirmation: false,
  async handler(input) {
    const status = input.status as string | undefined
    let q = service().from('cases').select('trading_id, ticker, company_name, sector, status, total_score, take_profit, stop_loss, expected_holding_period_months, date_of_case')
    if (status) q = q.eq('status', status)
    const { data, error } = await q.order('date_of_case', { ascending: false })
    if (error) throw new Error(error.message)
    return data ?? []
  },
}

const getCase: ToolDef = {
  name: 'get_case',
  description: 'Get the full record of one case by trading_id, including every field.',
  input_schema: {
    type: 'object',
    required: ['trading_id'],
    properties: {
      trading_id: { type: 'string' },
    },
  },
  requiresConfirmation: false,
  async handler(input) {
    const tid = input.trading_id as string
    const { data, error } = await service().from('cases').select('*').eq('trading_id', tid).maybeSingle()
    if (error) throw new Error(error.message)
    if (!data) throw new Error(`No case found with trading_id "${tid}"`)
    return data
  },
}

const lookupCaseBySymbol: ToolDef = {
  name: 'lookup_case_by_symbol',
  description: 'Find the case (and its trading_id) that corresponds to a stock ticker or symbol. Use this to translate "MSFT" → trading_id before editing.',
  input_schema: {
    type: 'object',
    required: ['symbol'],
    properties: { symbol: { type: 'string', description: 'Ticker like MSFT, ORCL, etc.' } },
  },
  requiresConfirmation: false,
  async handler(input) {
    const symbol = (input.symbol as string).toUpperCase()
    const supabase = service()
    const { data: pos } = await supabase
      .from('open_positions')
      .select('symbol, trading_id')
      .ilike('symbol', symbol)
      .maybeSingle()
    if (pos?.trading_id) {
      const { data: c } = await supabase.from('cases').select('trading_id, ticker, company_name, status').eq('trading_id', pos.trading_id).maybeSingle()
      return { matched_via: 'open_position', ...c }
    }
    const { data: c2 } = await supabase
      .from('cases')
      .select('trading_id, ticker, company_name, status')
      .ilike('ticker', symbol)
      .limit(5)
    return { matched_via: 'ticker', candidates: c2 ?? [] }
  },
}

const listPositions: ToolDef = {
  name: 'list_positions',
  description: 'List all currently open positions with their symbol, trading_id, P&L and last sync time.',
  input_schema: { type: 'object', properties: {} },
  requiresConfirmation: false,
  async handler() {
    const { data, error } = await service()
      .from('open_positions')
      .select('symbol, trading_id, entry_price_actual, current_price, position_size_actual, unrealized_pnl, unrealized_pnl_pct, pct_of_nav, entry_date_actual, last_synced_at')
    if (error) throw new Error(error.message)
    return data ?? []
  },
}

const getPortfolioSummary: ToolDef = {
  name: 'get_portfolio_summary',
  description: 'High-level portfolio snapshot: total NAV, latest TWR, # open positions, latest M² risk-adjusted return.',
  input_schema: { type: 'object', properties: {} },
  requiresConfirmation: false,
  async handler() {
    const supabase = service()
    const [{ data: positions }, { data: snaps }, { data: rates }] = await Promise.all([
      supabase.from('open_positions').select('symbol, current_price, position_size_actual, unrealized_pnl'),
      supabase.from('portfolio_snapshots').select('snapshot_date, total_nav, benchmark_value, daily_twr').order('snapshot_date', { ascending: true }),
      supabase.from('risk_free_rates').select('rate').order('date', { ascending: false }).limit(1),
    ])
    const totalNav = (positions ?? []).reduce((s, p) => s + (p.current_price * p.position_size_actual), 0)
    const totalUnrealized = (positions ?? []).reduce((s, p) => s + (p.unrealized_pnl ?? 0), 0)
    let twrFactor = 1
    for (const s of snaps ?? []) twrFactor *= 1 + (s.daily_twr ?? 0) / 100
    return {
      total_nav_eur: totalNav,
      total_unrealized_pnl_eur: totalUnrealized,
      open_positions_count: positions?.length ?? 0,
      twr_since_inception_pct: (twrFactor - 1) * 100,
      latest_risk_free_rate_pct: rates?.[0] ? Number(rates[0].rate) * 100 : null,
      snapshots_count: snaps?.length ?? 0,
    }
  },
}

// ─── WRITE tools (require confirmation) ────────────────────────────────

const updateCase: ToolDef = {
  name: 'update_case',
  description: 'Update one or more fields on a case. Pass the trading_id and an object of fields to change. Only the fields supplied are touched; everything else stays the same.',
  input_schema: {
    type: 'object',
    required: ['trading_id', 'updates'],
    properties: {
      trading_id: { type: 'string' },
      updates: {
        type: 'object',
        description: 'Fields to update — e.g. { take_profit: 520, stop_loss: 380, expected_holding_period_months: 9, status: "Active" }. Use exact column names from the cases table.',
        additionalProperties: true,
      },
    },
  },
  requiresConfirmation: true,
  async handler(input) {
    const tid = input.trading_id as string
    const updates = input.updates as Record<string, unknown>
    if (!updates || Object.keys(updates).length === 0) throw new Error('updates is empty')
    const { data, error } = await service()
      .from('cases')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('trading_id', tid)
      .select()
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (!data) throw new Error(`No case updated — trading_id "${tid}" not found`)
    return { updated_fields: Object.keys(updates), case: data }
  },
}

const updatePosition: ToolDef = {
  name: 'update_position',
  description: 'Update fields on an open position (rarely needed — most position-level edits should go to the linked case via update_case). Use this only for things like manual entry_price_actual corrections.',
  input_schema: {
    type: 'object',
    required: ['symbol', 'updates'],
    properties: {
      symbol: { type: 'string' },
      updates: { type: 'object', additionalProperties: true },
    },
  },
  requiresConfirmation: true,
  async handler(input) {
    const sym = (input.symbol as string).toUpperCase()
    const updates = input.updates as Record<string, unknown>
    const { data, error } = await service()
      .from('open_positions')
      .update(updates)
      .ilike('symbol', sym)
      .select()
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (!data) throw new Error(`No position found with symbol "${sym}"`)
    return { updated_fields: Object.keys(updates), position: data }
  },
}

const refreshBundData: ToolDef = {
  name: 'refresh_bund_data',
  description: 'Trigger an immediate refresh of the 10Y German Bund yield from Bundesbank into the risk_free_rates table. Used as R_f for the Capped M² calculation.',
  input_schema: { type: 'object', properties: {} },
  requiresConfirmation: false,
  async handler() {
    const url = 'https://api.statistiken.bundesbank.de/rest/data/BBSIS/D.I.ZAR.ZI.EUR.S1311.B.A604.R10XX.R.A.A._Z._Z.A?format=csv&lang=en'
    const res = await fetch(url, { headers: { 'User-Agent': 'fynoy-capital-atlas/1.0' } })
    if (!res.ok) throw new Error(`Bundesbank: ${res.status}`)
    const csv = await res.text()
    const rows: { date: string; rate: number }[] = []
    for (const rawLine of csv.split(/\r?\n/)) {
      const line = rawLine.trim()
      if (!line) continue
      const cells = line.split(/[;,]/).map(c => c.replace(/^"|"$/g, '').trim())
      const di = cells.findIndex(c => /^\d{4}-\d{2}-\d{2}$/.test(c))
      if (di === -1) continue
      let rate: number | null = null
      for (let i = di + 1; i < cells.length; i++) {
        const v = cells[i].replace(',', '.')
        if (v === '' || v === '.' || v === '-') continue
        const num = Number(v)
        if (Number.isFinite(num)) { rate = num; break }
      }
      if (rate === null) continue
      rows.push({ date: cells[di], rate: rate / 100 })
    }
    if (rows.length === 0) throw new Error('No parseable rows in Bundesbank response')
    const records = rows.map(r => ({ date: r.date, rate: r.rate, source: 'bundesbank-BBSIS-10Y', updated_at: new Date().toISOString() }))
    const { error } = await service().from('risk_free_rates').upsert(records, { onConflict: 'date' })
    if (error) throw new Error(error.message)
    const last = rows[rows.length - 1]
    return { updated: rows.length, latest_date: last.date, latest_rate_pct: (last.rate * 100).toFixed(3) }
  },
}

// ─── Registry ─────────────────────────────────────────────────────────

export const ATLAS_TOOLS: ToolDef[] = [
  listCases,
  getCase,
  lookupCaseBySymbol,
  listPositions,
  getPortfolioSummary,
  updateCase,
  updatePosition,
  refreshBundData,
]

export function getTool(name: string): ToolDef | undefined {
  return ATLAS_TOOLS.find(t => t.name === name)
}

export function toolsForApi(): { name: string; description: string; input_schema: Record<string, unknown> }[] {
  return ATLAS_TOOLS.map(t => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema,
  }))
}

// Read-only subset for Sage (member-facing agent).
export const SAGE_TOOLS: ToolDef[] = ATLAS_TOOLS.filter(t => !t.requiresConfirmation)
