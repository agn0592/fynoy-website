import { createClient } from '@/lib/supabase/server'
import ProfileForm from './ProfileForm'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase.from('users').select('id, email, full_name, role, created_at').eq('id', user.id).maybeSingle()
    : { data: null }

  const fullName = profile?.full_name ?? ''
  const email = profile?.email ?? user?.email ?? ''
  const role = profile?.role ?? 'member'
  const createdAt = profile?.created_at ?? null
  const userId = profile?.id ?? user?.id ?? ''
  const initial = (fullName || email || 'M').charAt(0).toUpperCase()

  return (
    <>
      <div className="dash-page-head">
        <div className="dash-page-title-block">
          <h1 className="dash-page-title">Profile <em>& Account</em></h1>
          <div className="dash-page-sub">Manage your identity, account settings, and preferences.</div>
        </div>
      </div>

      <ProfileForm
        userId={userId}
        initialFullName={fullName}
        email={email}
        role={role}
        createdAt={createdAt}
        initial={initial}
      />
    </>
  )
}
