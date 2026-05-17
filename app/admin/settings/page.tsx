import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import SettingsClient from './SettingsClient'

import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Settings' }

function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export interface GeneralSettings {
  inception_date?: string | null
  currency?: 'EUR' | 'USD' | 'GBP'
benchmark?: string
  risk_free_pct?: number
}

export interface SettingsPayload {
  general: GeneralSettings
  targetAllocation: Record<string, number>
  lastCommentary: { id: string; created_at: string } | null
  lastSync: string | null
  sectors: string[]
}

const DEFAULT_GENERAL: GeneralSettings = {
  inception_date: null,
  currency: 'EUR',
  benchmark: 'VWCE',
  risk_free_pct: 2.5,
}

export default async function SettingsPage() {
  const supabase = getServiceClient()

  const [settingsRes, commentaryRes, openRes, casesRes] = await Promise.all([
    supabase.from('settings').select('key, value').in('key', ['general', 'target_allocation']),
    supabase
      .from('commentary')
      .select('id, created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('open_positions')
      .select('last_synced_at')
      .order('last_synced_at', { ascending: false })
      .limit(1),
    supabase.from('cases').select('sector'),
  ])

  const rows: { key: string; value: unknown }[] = (settingsRes.data ?? []) as { key: string; value: unknown }[]
  const generalRow = rows.find((r) => r.key === 'general')
  const targetRow = rows.find((r) => r.key === 'target_allocation')

  const general: GeneralSettings = {
    ...DEFAULT_GENERAL,
    ...((generalRow?.value as Partial<GeneralSettings> | undefined) ?? {}),
  }

  const targetAllocation: Record<string, number> =
    targetRow?.value && typeof targetRow.value === 'object' && !Array.isArray(targetRow.value)
      ? (targetRow.value as Record<string, number>)
      : {}

  const sectors = Array.from(
    new Set(
      ((casesRes.data ?? []) as { sector: string | null }[])
        .map((c) => c.sector)
        .filter((s): s is string => !!s),
    ),
  ).sort()

  const lastCommentary = commentaryRes.data
    ? {
        id: String((commentaryRes.data as { id: unknown }).id),
        created_at: (commentaryRes.data as { created_at: string }).created_at,
      }
    : null

  const lastSync =
    ((openRes.data ?? [])[0]?.last_synced_at as string | null | undefined) ?? null

  const payload: SettingsPayload = {
    general,
    targetAllocation,
    lastCommentary,
    lastSync,
    sectors,
  }

  return <SettingsClient initial={payload} />
}
