import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import AdminSidebarNav from './components/AdminSidebarNav'
import SidebarLogo from '@/app/dashboard/components/SidebarLogo'
import MobileBottomNav from '@/app/dashboard/components/MobileBottomNav'
import TopBar from '@/app/dashboard/components/TopBar'
import { buildNotifications } from '@/lib/notifications'
import '../dashboard/dashboard.css'

function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/dashboard')

  const { data: profile } = await supabase
    .from('users')
    .select('role, full_name, email')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Admin'
  const initial = displayName.charAt(0).toUpperCase()
  const email = profile?.email || user?.email || ''

  const service = getServiceClient()
  const [closedRes, openRes, commRes, snapRes] = await Promise.all([
    service
      .from('closed_trades')
      .select('symbol, exit_date, realized_pnl_pct, trading_id')
      .order('exit_date', { ascending: false })
      .limit(15),
    service
      .from('open_positions')
      .select('symbol, entry_date_actual, trading_id'),
    service
      .from('commentary')
      .select('id, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    service
      .from('portfolio_snapshots')
      .select('snapshot_date, daily_twr')
      .order('snapshot_date', { ascending: false })
      .limit(60),
  ])

  const notifications = buildNotifications({
    closedTrades: closedRes.data ?? [],
    openPositions: openRes.data ?? [],
    commentaries: commRes.data ?? [],
    snapshots: snapRes.data ?? [],
    isAdmin: true,
  })

  return (
    <div className="dash-shell">
      {/* ── Desktop sidebar ── */}
      <aside className="dash-sidebar">
        <Link href="/" className="dash-sb-logo" aria-label="Go to homepage">
          <SidebarLogo />
        </Link>
        <nav className="dash-sb-nav">
          <AdminSidebarNav />
        </nav>
      </aside>

      {/* ── Content ── */}
      <div className="dash-content">
        <TopBar
          variant="admin"
          title={<>Command <em>Center</em></>}
          displayName={displayName}
          email={email}
          initial={initial}
          isAdmin={true}
          notifications={notifications}
        />

        <main className="dash-main-wrap">
          {children}
        </main>

        {/* ── Mobile bottom nav ── */}
        <MobileBottomNav variant="admin" />
      </div>
    </div>
  )
}
