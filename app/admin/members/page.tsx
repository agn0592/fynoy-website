import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import MembersClient from './MembersClient'

import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Members' }

function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface MemberRow {
  id: string
  email: string | null
  full_name: string | null
  role: string | null
  created_at: string | null
  last_seen_at?: string | null
}

function nowMs(): number {
  return Date.now()
}

function startOfMonthMs(): number {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export default async function MembersPage() {
  const supabase = getServiceClient()

  // Try to select with last_seen_at (may not exist if migration 007 not applied)
  let members: MemberRow[] = []
  let hasLastSeen = true

  const withLastSeen = await supabase
    .from('users')
.select('id, email, full_name, role, created_at, last_seen_at')
    .order('created_at', { ascending: false })

  if (withLastSeen.error) {
    hasLastSeen = false
    const fallback = await supabase
      .from('users')
      .select('id, email, full_name, role, created_at')
      .order('created_at', { ascending: false })
    members = (fallback.data ?? []) as MemberRow[]
  } else {
    members = (withLastSeen.data ?? []) as MemberRow[]
  }

  // KPIs
  const totalMembers = members.length
  const adminCount = members.filter((m) => m.role === 'admin').length

  const now = nowMs()
  const monthStartMs = startOfMonthMs()
  const joinedThisMonth = members.filter((m) => {
    if (!m.created_at) return false
    return new Date(m.created_at).getTime() >= monthStartMs
  }).length

  const sevenDays = 7 * 24 * 3_600_000
  const activeLast7: number | null = hasLastSeen
    ? members.filter(
        (m) => m.last_seen_at && now - new Date(m.last_seen_at).getTime() < sevenDays,
      ).length
    : null

  return (
    <MembersClient
      members={members}
      kpis={{
        totalMembers,
        adminCount,
        joinedThisMonth,
        activeLast7,
      }}
    />
  )
}
