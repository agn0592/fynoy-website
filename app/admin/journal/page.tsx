import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import JournalClient from './JournalClient'

function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export interface JournalEntry {
  id: string
  trading_id: string | null
  entry_date: string | null
  entry_type: string | null
  notes: string | null
  post_trade_reflection: string | null
  created_at: string
}

export interface CaseRef {
  id: string
  trading_id: string
  company_name: string | null
  ticker: string | null
  sector: string | null
  status: string | null
}

export interface ClosedTradeRef {
  symbol: string | null
  trading_id: string | null
  entry_date: string | null
  exit_date: string | null
  realized_pnl_pct: number | null
}

export default async function JournalPage() {
  const supabase = getServiceClient()

  const [
    { data: journalRaw },
    { data: casesRaw },
    { data: closedRaw },
  ] = await Promise.all([
    supabase
      .from('journal')
      .select('id, trading_id, entry_date, entry_type, notes, post_trade_reflection, created_at')
      .order('entry_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('cases')
      .select('id, trading_id, company_name, ticker, sector, status')
      .order('trading_id', { ascending: true }),
    supabase
      .from('closed_trades')
      .select('symbol, trading_id, entry_date, exit_date, realized_pnl_pct')
      .order('exit_date', { ascending: false })
      .limit(20),
  ])

  const journal: JournalEntry[] = journalRaw ?? []
  const cases: CaseRef[] = casesRaw ?? []
  const closedTrades: ClosedTradeRef[] = closedRaw ?? []

  return (
    <JournalClient
      initialEntries={journal}
      cases={cases}
      closedTrades={closedTrades}
    />
  )
}
