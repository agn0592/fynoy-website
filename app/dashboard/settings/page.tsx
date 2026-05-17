import { createClient } from '@/lib/supabase/server'
import SettingsClient from './SettingsClient'

import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase.from('users').select('full_name, email, role').eq('id', user.id).maybeSingle()
: { data: null }

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Member'
  const email = profile?.email || user?.email || ''
  const role = profile?.role ?? 'member'

  return (
    <>
      <div className="dash-page-head">
        <div className="dash-page-title-block">
          <h1 className="dash-page-title"><em>Settings</em></h1>
          <div className="dash-page-sub">Preferences saved locally to this device.</div>
        </div>
      </div>

      <SettingsClient displayName={displayName} email={email} role={role} />
    </>
  )
}
