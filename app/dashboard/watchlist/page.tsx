import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import WatchlistClient from './WatchlistClient'

function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function WatchlistPage() {
  const service = getServiceClient()
  const { data } = await service.from('open_positions').select('symbol')
  const heldSymbols = (data ?? [])
    .map(r => (r?.symbol ?? '').toString().toUpperCase())
    .filter(s => s.length > 0)

  return <WatchlistClient heldSymbols={heldSymbols} />
}
