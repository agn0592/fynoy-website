import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { buildNotifications } from '@/lib/notifications'
import NotificationsClient from './NotificationsClient'

import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Notifications' }

function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from('users').select('role').eq('id', user.id).maybeSingle()
    : { data: null }
  const isAdmin = profile?.role === 'admin'

  const service = getServiceClient()
  const [closedRes, openRes, commRes, snapRes] = await Promise.all([
    service
      .from('closed_trades')
      .select('symbol, exit_date, realized_pnl_pct, trading_id')
      .order('exit_date', { ascending: false })
      .limit(40),
    service
      .from('open_positions')
      .select('symbol, entry_date_actual, trading_id'),
    service
      .from('commentary')
      .select('id, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
    service
      .from('portfolio_snapshots')
      .select('snapshot_date, daily_twr')
      .order('snapshot_date', { ascending: true }),
  ])

  const items = buildNotifications({
    closedTrades: closedRes.data ?? [],
    openPositions: openRes.data ?? [],
    commentaries: commRes.data ?? [],
    snapshots: snapRes.data ?? [],
    isAdmin,
  })

  return (
    <>
      <div className="dash-page-head">
        <div className="dash-page-title-block">
          <h1 className="dash-page-title"><em>Notifications</em></h1>
          <div className="dash-page-sub">Recent portfolio activity and system events.</div>
        </div>
      </div>

      <NotificationsClient items={items} />
    </>
  )
}
