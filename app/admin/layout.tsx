import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SignOutButton from '@/app/dashboard/components/SignOutButton'

const NAV_LINKS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/cases', label: 'Cases' },
  { href: '/admin/research', label: 'Research' },
  { href: '/admin/rebalancing', label: 'Rebalancing' },
  { href: '/admin/timeline', label: 'Timeline' },
  { href: '/admin/ai-commentary', label: 'AI Commentary' },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

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
        {/* Left: brand + nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link
            href="/admin"
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
          <span
            style={{
              color: '#f59e0b',
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '2px 8px',
              border: '1px solid #f59e0b40',
              borderRadius: '4px',
              background: '#f59e0b10',
            }}
          >
            Admin
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  color: '#9ca3af',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: 500,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  transition: 'color 0.15s',
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right: dashboard link + user email + sign out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link
            href="/dashboard"
            style={{
              color: '#6b7280',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 500,
              padding: '4px 10px',
              border: '1px solid #2a2d3e',
              borderRadius: '6px',
            }}
          >
            Dashboard
          </Link>
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
