import Link from 'next/link'
import { redirect } from 'next/navigation'
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
    ? await supabase.from('users').select('role, full_name').eq('id', user.id).single()
    : { data: null }

  const isAdmin = profile?.role === 'admin'

  if (isAdmin) redirect('/admin')

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Member'

  return (
    <div style={{ minHeight: '100vh', background: '#0a0c12', color: '#fff' }}>
      <nav
        style={{
          background: '#0f1117',
          borderBottom: '1px solid #1e2130',
          padding: '0 32px',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          <Link
            href="/dashboard"
            style={{
              color: '#fff',
              textDecoration: 'none',
              fontSize: '15px',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ color: '#3b82f6' }}>F</span>ynoy Capital
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              style={{
                color: '#6b7280',
                textDecoration: 'none',
                fontSize: '12px',
                fontWeight: 500,
                padding: '4px 10px',
                border: '1px solid #2a2d3e',
                borderRadius: '6px',
                letterSpacing: '0.02em',
                transition: 'color 0.15s',
              }}
            >
              Admin ↗
            </Link>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 700,
                color: '#fff',
                flexShrink: 0,
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
            <span style={{ color: '#4b5563', fontSize: '13px' }}>{displayName}</span>
          </div>
          <div style={{ width: '1px', height: '20px', background: '#1e2130' }} />
          <SignOutButton />
        </div>
      </nav>

      <main style={{ padding: '40px 32px', maxWidth: '1400px', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  )
}
