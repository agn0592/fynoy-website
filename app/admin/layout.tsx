import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminSidebarNav from './components/AdminSidebarNav'
import SignOutButton from '@/app/dashboard/components/SignOutButton'
import '../dashboard/dashboard.css'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/dashboard')

  const { data: profile } = await supabase
    .from('users')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Admin'
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <div className="dash-shell">
      {/* ── Sidebar ── */}
      <aside className="dash-sidebar">
        <div className="dash-sb-logo">F</div>

        <nav className="dash-sb-nav">
          <AdminSidebarNav />
        </nav>

        <div className="dash-sb-foot">
          <Link href="/dashboard" className="dash-sb-item" title="Member View">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span className="dash-sb-tooltip">Member View</span>
          </Link>
          <SignOutButton />
        </div>
      </aside>

      {/* ── Content ── */}
      <div className="dash-content">
        <header className="dash-topbar">
          <div className="dash-topbar-left">
            <Image src="/fynoy-horizontal.png" alt="Fynoy Capital" height={22} width={110} style={{ objectFit: 'contain' }} />
            <span className="dash-admin-pill">Admin</span>
          </div>
          <div className="dash-topbar-right">
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
