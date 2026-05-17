import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { createClient as createSessionClient } from '@/lib/supabase/server'
import { ALL_TOOLS } from '@/lib/agent/tools'
import { logChatEvent } from '@/lib/agent/observability'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  approved: z.boolean(),
  reason: z.string().max(500).optional(),
})

function service() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params

  const supabaseSession = await createSessionClient()
  const { data: { user } } = await supabaseSession.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await request.json())
  } catch (e) {
    return Response.json({ error: 'bad_request', detail: e instanceof Error ? e.message : 'invalid body' }, { status: 400 })
  }

  const supabase = service()
  // Load the action + verify ownership via the conversation owner.
  const { data: row, error: loadErr } = await supabase
    .from('chat_write_actions')
    .select('id, message_id, tool_use_id, tool_name, input, status, chat_messages!inner(conversation_id, chat_conversations!inner(user_id, agent))')
    .eq('id', id)
    .maybeSingle() as { data: ActionRow | null; error: { message: string } | null }
  if (loadErr) return Response.json({ error: 'internal', detail: loadErr.message }, { status: 500 })
  if (!row) return Response.json({ error: 'not_found' }, { status: 404 })
  const conv = row.chat_messages?.chat_conversations
  if (!conv || conv.user_id !== user.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  if (row.status !== 'proposed') {
    return Response.json({ error: 'bad_request', detail: `action already ${row.status}` }, { status: 400 })
  }

  if (!body.approved) {
    const { data: updated } = await supabase
      .from('chat_write_actions')
      .update({ status: 'rejected', approved_by: user.id, approved_at: new Date().toISOString(), error: body.reason ?? null })
      .eq('id', id)
      .select('id, status, approved_at, error')
      .single()
    logChatEvent({ event: 'chat.action.approved', user_id: user.id, action_id: id, tool_name: row.tool_name, ok: false, duration_ms: 0, error: body.reason })
    return Response.json({ action: updated })
  }

  // Approved — find tool def and execute.
  const def = ALL_TOOLS.find(t => t.name === row.tool_name)
  if (!def) return Response.json({ error: 'internal', detail: `tool ${row.tool_name} no longer registered` }, { status: 500 })
  if (def.surface !== 'both' && def.surface !== conv.agent) {
    return Response.json({ error: 'internal', detail: 'tool/agent mismatch' }, { status: 500 })
  }

  const parsed = def.schema.safeParse(row.input)
  if (!parsed.success) {
    const detail = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')
    await supabase.from('chat_write_actions').update({
      status: 'failed',
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      executed_at: new Date().toISOString(),
      error: `Input validation failed: ${detail}`,
    }).eq('id', id)
    return Response.json({ error: 'tool_failed', detail }, { status: 422 })
  }

  // Mark approved first so concurrent approvers can't race.
  const approvedAt = new Date().toISOString()
  await supabase
    .from('chat_write_actions')
    .update({ status: 'approved', approved_by: user.id, approved_at: approvedAt })
    .eq('id', id)

  const start = Date.now()
  try {
    const result = await def.handler(parsed.data as never, { userId: user.id, agent: conv.agent })
    const { data: updated } = await supabase
      .from('chat_write_actions')
      .update({ status: 'executed', executed_at: new Date().toISOString(), result })
      .eq('id', id)
      .select('id, status, executed_at, result')
      .single()
    logChatEvent({ event: 'chat.action.approved', user_id: user.id, action_id: id, tool_name: row.tool_name, ok: true, duration_ms: Date.now() - start })
    return Response.json({ action: updated })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await supabase
      .from('chat_write_actions')
      .update({ status: 'failed', executed_at: new Date().toISOString(), error: msg })
      .eq('id', id)
    logChatEvent({ event: 'chat.action.approved', user_id: user.id, action_id: id, tool_name: row.tool_name, ok: false, duration_ms: Date.now() - start, error: msg })
    return Response.json({ error: 'tool_failed', detail: msg }, { status: 500 })
  }
}

// Local row shape for the nested join — Supabase return type isn't precise
// enough on its own without generated types.
interface ActionRow {
  id: string
  message_id: string
  tool_use_id: string
  tool_name: string
  input: Record<string, unknown>
  status: 'proposed' | 'approved' | 'rejected' | 'executed' | 'failed' | 'expired'
  chat_messages: {
    conversation_id: string
    chat_conversations: { user_id: string; agent: 'atlas' | 'sage' } | null
  } | null
}
