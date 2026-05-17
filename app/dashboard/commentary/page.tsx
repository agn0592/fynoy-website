import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import AICommentary from '@/app/dashboard/components/AICommentary'
import CommentaryEntry from './CommentaryEntry'

import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Commentary' }

function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface CommentaryRow {
  id: string
  content: string
  created_at: string
}

export default async function CommentaryArchivePage() {
  const supabase = getServiceClient()
  const { data: rows } = await supabase
    .from('commentary')
    .select('id, content, created_at')
    .order('created_at', { ascending: false })

  const items: CommentaryRow[] = rows ?? []
  const [latest, ...older] = items

  return (
    <>
      <div className="dash-page-head">
        <div className="dash-page-title-block">
          <h1 className="dash-page-title"><em>Commentary</em></h1>
          <div className="dash-page-sub">Our AI-generated portfolio analysis archive.</div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="dash-alert">
          <div className="dash-alert-title">No commentary yet</div>
          <div className="dash-alert-body">Nog geen commentaar gepubliceerd — check binnenkort opnieuw.</div>
        </div>
      ) : (
        <>
          {/* Featured: latest */}
          <AICommentary commentary={latest.content} updatedAt={latest.created_at} />

          {/* Archive: older entries */}
          {older.length > 0 && (
            <>
              <div className="dash-section-sep" style={{ marginTop: 24 }}>Archive</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {older.map(item => (
                  <CommentaryEntry key={item.id} content={item.content} createdAt={item.created_at} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </>
  )
}
