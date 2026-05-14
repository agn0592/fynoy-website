import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import CommentaryClient from './CommentaryClient'

function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface Commentary {
  id: string
  content: string
  created_at: string
}

export default async function AICommentaryPage() {
  const supabase = getServiceClient()

  const { data: commentariesRaw } = await supabase
    .from('commentary')
    .select('id, content, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  const commentaries: Commentary[] = commentariesRaw ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, margin: '0 0 4px' }}>
          AI Commentary
        </h1>
        <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
          Generate and view AI-powered portfolio commentary using Claude.
        </p>
      </div>

      <CommentaryClient initialCommentaries={commentaries} />
    </div>
  )
}
