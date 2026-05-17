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
    .limit(10)

  const commentaries: Commentary[] = commentariesRaw ?? []

  return (
    <>
      <div className="dash-page-head">
        <div className="dash-page-title-block">
          <h1 className="dash-page-title">
            AI <em>Commentary</em>
          </h1>
          <div className="dash-page-sub">
            Generate and view AI-powered portfolio commentary using Claude.
          </div>
        </div>
      </div>

      <CommentaryClient initialCommentaries={commentaries} />
    </>
  )
}
