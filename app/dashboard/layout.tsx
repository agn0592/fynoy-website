import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SignOutButton from './components/SignOutButton'

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
    ? await supabase.from('users').select('role').eq('id', user.id).single()
    : { data: null }

  const isAdmin = profile?.role === 'admin'

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', color: '#fff' }}>
      {/* Nav bar */}
      <nav
        style={{
          background: '#1a1d27',
          borderBottom: '1px solid #2a2d3e',
          padding: '0 24px',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        {/* Left: brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link
            href="/dashboard"
            style={{
              color: '#fff',
              textDecoration: 'none',
              fontSize: '15px',
              fontWeight: 700,
              letterSpacing: '-0.01em',
            }}
          >
            Fynoy Capital
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              style={{
                color: '#3b82f6',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 500,
                padding: '4px 10px',
                border: '1px solid #3b82f620',
                borderRadius: '6px',
                background: '#3b82f610',
              }}
            >
              Admin
            </Link>
          )}
        </div>

        {/* Right: user info + sign out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {user?.email && (
            <span style={{ color: '#6b7280', fontSize: '13px' }}>{user.email}</span>
          )}
          <SignOutButton />
        </div>
      </nav>

      {/* Page content */}
      <main style={{ padding: '32px 24px', maxWidth: '1400px', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  )
}
