import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import RefreshClient from './RefreshClient'

function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

interface RfRow {
  date: string
  rate: number
  source: string
  updated_at: string
}

export default async function RiskFreeRatePage() {
  const supabase = getServiceClient()

  const [{ count }, { data: latestRaw }, { data: recentRaw }, { data: bySource }] = await Promise.all([
    supabase.from('risk_free_rates').select('*', { count: 'exact', head: true }),
    supabase
      .from('risk_free_rates')
      .select('*')
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('risk_free_rates')
      .select('*')
      .order('date', { ascending: false })
      .limit(20),
    supabase
      .from('risk_free_rates')
      .select('source'),
  ])

  const total = count ?? 0
  const latest = latestRaw as RfRow | null
  const recent = (recentRaw ?? []) as RfRow[]

  const sourceCounts = new Map<string, number>()
  for (const r of (bySource ?? []) as { source: string }[]) {
    sourceCounts.set(r.source, (sourceCounts.get(r.source) ?? 0) + 1)
  }
  const sources = Array.from(sourceCounts.entries())
    .map(([source, n]) => ({ source, n }))
    .sort((a, b) => b.n - a.n)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ color: 'var(--ink)', fontSize: 24, fontWeight: 600, margin: '0 0 4px', fontFamily: 'var(--serif)' }}>
          Risk-free Rate
        </h1>
        <p style={{ color: 'var(--ink-dim)', fontSize: 13, margin: 0 }}>
          10Y Duitse Bund yield — gebruikt als R<sub>f</sub> in de M²-berekening op het dashboard.
          Bundesbank Time Series WT1010, dagelijks ververst om 06:00 UTC via Vercel cron.
        </p>
      </div>

      <RefreshClient
        latestDate={latest?.date ?? null}
        latestRatePct={latest ? Number(latest.rate) * 100 : null}
        latestSource={latest?.source ?? null}
        totalRows={total}
        sources={sources}
        recent={recent.map(r => ({
          date: r.date,
          ratePct: Number(r.rate) * 100,
          source: r.source,
        }))}
      />
    </div>
  )
}
