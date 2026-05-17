import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient as createSessionClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const agentSchema = z.enum(['atlas', 'sage'])

export async function GET(request: NextRequest) {
  const supabase = await createSessionClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const agent = url.searchParams.get('agent')
  const parsed = agentSchema.safeParse(agent)
  if (!parsed.success) return Response.json({ error: 'bad_request', detail: 'agent must be atlas or sage' }, { status: 400 })

  if (parsed.data === 'atlas') {
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('chat_conversations')
    .select('id, title, agent, created_at, updated_at')
    .eq('agent', parsed.data)
    .order('updated_at', { ascending: false })
    .limit(50)
  if (error) return Response.json({ error: 'internal', detail: error.message }, { status: 500 })
  return Response.json({ conversations: data ?? [] })
}

const postSchema = z.object({
  agent: agentSchema,
  title: z.string().max(200).optional(),
})

export async function POST(request: NextRequest) {
  const supabase = await createSessionClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body: z.infer<typeof postSchema>
  try {
    body = postSchema.parse(await request.json())
  } catch (e) {
    return Response.json({ error: 'bad_request', detail: e instanceof Error ? e.message : 'invalid body' }, { status: 400 })
  }

  if (body.agent === 'atlas') {
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('chat_conversations')
    .insert({ user_id: user.id, agent: body.agent, title: body.title ?? null })
    .select('id, title, agent, created_at, updated_at')
    .single()
  if (error) return Response.json({ error: 'internal', detail: error.message }, { status: 500 })
  return Response.json({ conversation: data })
}
