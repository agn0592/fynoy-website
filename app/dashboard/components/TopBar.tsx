import Link from 'next/link'
import MobileDrawer from './MobileDrawer'
import ProfileMenu from './ProfileMenu'
import NotificationBell, { type NotificationItem } from './NotificationBell'

interface TopBarProps {
  variant: 'member' | 'admin'
  title: React.ReactNode
  displayName: string
  email: string
  initial: string
  isAdmin: boolean
  avatarColor?: string | null
  notifications: NotificationItem[]
}

export default function TopBar({
  variant, title, displayName, email, initial,
  isAdmin, avatarColor, notifications,
}: TopBarProps) {
  return (
    <header className="dash-topbar">
      <div className="dash-topbar-left">
        <MobileDrawer variant={variant} isAdmin={isAdmin} />
        <span className="dash-topbar-title">{title}</span>
        {variant === 'admin' && (
          <span className="dash-admin-pill" style={{ marginLeft: 4 }}>Admin</span>
        )}
      </div>
      <div className="dash-topbar-right">
        {variant === 'member' && isAdmin && (
          <Link href="/admin" className="dash-admin-pill">Admin ↗</Link>
        )}
        {variant === 'admin' && (
          <Link href="/dashboard" className="dash-admin-pill">Member ↗</Link>
        )}
        <NotificationBell items={notifications} />
        <ProfileMenu
          displayName={displayName}
          email={email}
          initial={initial}
          isAdmin={isAdmin}
          avatarColor={avatarColor}
        />
      </div>
    </header>
  )
}
