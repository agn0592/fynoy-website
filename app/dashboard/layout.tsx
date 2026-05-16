import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SignOutButton from './components/SignOutButton'
import './dashboard.css'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase.from('users').select('role, full_name').eq('id', user.id).single()
    : { data: null }

  const isAdmin = profile?.role === 'admin'

  if (isAdmin) redirect('/admin')

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Member'
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <div className="dash-page">
      <nav className="dash-nav">
        <div className="dash-nav-inner">
          <Link href="/dashboard" className="brand">
            <span className="brand-name">
              <b>Fynoy</b> <i>Capital</i>
            </span>
          </Link>

          {isAdmin && (
            <Link href="/admin" className="dash-admin-link">
              Admin ↗
            </Link>
          )}

          <div className="dash-user">
            <div className="dash-avatar">{initial}</div>
            <span className="dash-username">{displayName}</span>
            <div className="dash-divider" />
            <SignOutButton />
          </div>
        </div>
      </nav>

      <main className="dash-main">
        {children}
      </main>
    </div>
  )
}
