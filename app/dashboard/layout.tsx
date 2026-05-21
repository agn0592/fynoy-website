import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import SidebarNav from './components/SidebarNav'
import SidebarLogo from './components/SidebarLogo'
import MobileBottomNav from './components/MobileBottomNav'
import TopBar from './components/TopBar'
import SageBubble from './components/SageBubble'
import ThemeToggle from './components/ThemeToggle'
import { buildNotifications } from '@/lib/notifications'
import './dashboard.css'
import '@/app/components/agent-chat.css'

function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase.from('users').select('role, full_name, email').eq('id', user.id).maybeSingle()
    : { data: null }

  const isAdmin = profile?.role === 'admin'

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Member'
  const initial = displayName.charAt(0).toUpperCase()
  const email = profile?.email || user?.email || ''

  // Build notifications from existing data (cheap reads)
  const service = getServiceClient()
  const [closedRes, openRes, commRes] = await Promise.all([
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
      .limit(3),
  ])

  const notifications = buildNotifications({
    closedTrades: closedRes.data ?? [],
    openPositions: openRes.data ?? [],
    commentaries: commRes.data ?? [],
    isAdmin,
  })

  return (
    <div className="dash-shell">
      {/* ── Desktop sidebar ── */}
      <aside className="dash-sidebar">
        <Link href="/" className="dash-sb-logo" aria-label="Back to homepage">
          <SidebarLogo />
        </Link>
        <nav className="dash-sb-nav">
          <SidebarNav />
        </nav>
        <ThemeToggle />
      </aside>

      {/* ── Content ── */}
      <div className="dash-content">
        <TopBar
          variant="member"
          title={<>Portfolio <em>Overview</em></>}
          displayName={displayName}
          email={email}
          initial={initial}
          isAdmin={isAdmin}
          notifications={notifications}
        />

        <main className="dash-main-wrap">
          {children}
        </main>

        {/* ── Mobile bottom nav ── */}
        <MobileBottomNav variant="member" />
      </div>

      {/* ── Floating Sage agent (read-only Q&A) ── */}
      {user && <SageBubble />}
    </div>
  )
}
