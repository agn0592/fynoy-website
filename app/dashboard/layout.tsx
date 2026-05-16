import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SidebarNav from './components/SidebarNav'
import SignOutButton from './components/SignOutButton'
import ThemeToggle from './components/ThemeToggle'
import './dashboard.css'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase.from('users').select('role, full_name').eq('id', user.id).single()
    : { data: null }

  const isAdmin = profile?.role === 'admin'
  if (isAdmin) redirect('/admin')

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Member'
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <div className="dash-shell">
      {/* ── Sidebar ── */}
      <aside className="dash-sidebar">
        <div className="dash-sb-logo">
          <Image src="/fynoy-square.png" alt="Fynoy" width={32} height={32} style={{ objectFit: 'contain' }} />
        </div>

        <nav className="dash-sb-nav">
          <SidebarNav />
        </nav>

        <div className="dash-sb-foot">
          <ThemeToggle />
          <SignOutButton />
        </div>
      </aside>

      {/* ── Content ── */}
      <div className="dash-content">
        <header className="dash-topbar">
          <div className="dash-topbar-left">
            <span className="dash-topbar-title">Portfolio <em>Overview</em></span>
          </div>
          <div className="dash-topbar-right">
            {isAdmin && (
              <Link href="/admin" className="dash-admin-pill">Admin ↗</Link>
            )}
            <div className="dash-topbar-user">
              <div className="dash-avatar">{initial}</div>
              <span className="dash-topbar-name">{displayName}</span>
            </div>
          </div>
        </header>

        <main className="dash-main-wrap">
          {children}
        </main>
      </div>
    </div>
  )
}
