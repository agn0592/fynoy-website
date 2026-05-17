import { NextRequest } from 'next/server'
import { createClient as createSessionClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params

  const supabase = await createSessionClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // RLS handles ownership check on both tables.
  const { data: conversation, error: convErr } = await supabase
    .from('chat_conversations')
    .select('id, title, agent, created_at, updated_at')
    .eq('id', id)
    .maybeSingle()
  if (convErr) return Response.json({ error: 'internal', detail: convErr.message }, { status: 500 })
  if (!conversation) return Response.json({ error: 'not_found' }, { status: 404 })

  const { data: messages, error: msgErr } = await supabase
    .from('chat_messages')
    .select('id, role, content, tool_calls, model, cost_usd, prompt_cache_hit, aborted_reason, created_at')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })
  if (msgErr) return Response.json({ error: 'internal', detail: msgErr.message }, { status: 500 })

  // Plan-card rows attached to messages (for resuming a conversation with
  // unresolved approval requests).
  const messageIds = (messages ?? []).map(m => m.id)
  let writeActions: unknown[] = []
  if (messageIds.length > 0) {
    const { data: actions } = await supabase
      .from('chat_write_actions')
      .select('id, message_id, tool_use_id, tool_name, input, diff, status, approved_at, executed_at, error, created_at')
      .in('message_id', messageIds)
      .order('created_at', { ascending: true })
    writeActions = actions ?? []
  }

  return Response.json({ conversation, messages: messages ?? [], write_actions: writeActions })
}

export async function DELETE(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params

  const supabase = await createSessionClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase.from('chat_conversations').delete().eq('id', id)
  if (error) return Response.json({ error: 'internal', detail: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
