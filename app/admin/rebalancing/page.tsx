import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import RebalancingView from './RebalancingView'

import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Rebalancing' }

function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface Position {
  trading_id: string | null
  symbol: string
  current_price: number
  position_size_actual: number
}

interface Case {
  trading_id: string
  sector: string | null
}

interface SettingsRow {
  key: string
  value: unknown
}

export default async function RebalancingPage() {
  const supabase = getServiceClient()

  const [
    { data: positionsRaw },
    { data: casesRaw },
    { data: settingsRaw },
  ] = await Promise.all([
    supabase.from('open_positions').select('trading_id, symbol, current_price, position_size_actual'),
    supabase.from('cases').select('trading_id, sector'),
    supabase.from('settings').select('key, value').eq('key', 'target_allocation').maybeSingle(),
  ])

  const positions: Position[] = positionsRaw ?? []
  const cases: Case[] = casesRaw ?? []

  const setting = settingsRaw as SettingsRow | null
  const targetAllocation: Record<string, number> =
    setting?.value && typeof setting.value === 'object' && !Array.isArray(setting.value)
      ? (setting.value as Record<string, number>)
      : {}

  return (
    <>
      <div className="dash-page-head">
        <div className="dash-page-title-block">
          <h1 className="dash-page-title">
            <em>Rebalancing</em>
          </h1>
          <div className="dash-page-sub">
            Compare actual vs target sector allocations and update targets.
          </div>
        </div>
      </div>

      <RebalancingView
        positions={positions}
        cases={cases}
        targetAllocation={targetAllocation}
      />
    </>
  )
}
