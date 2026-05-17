import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { createClient as createSessionClient } from '@/lib/supabase/server'
import { toolsForAgent, toolsForApi, getTool } from '@/lib/agent/tools'
import { systemPromptFor } from '@/lib/agent/prompts'
import { MODEL_DEFAULTS, computeCostUsd, trackChatCost } from '@/lib/agent/anthropic'
import { assertBudget, BudgetExceededError } from '@/lib/agent/budget'
import { sseFrame, sseHeartbeat, sseHeaders } from '@/lib/agent/sse'
import { logChatEvent } from '@/lib/agent/observability'
import type { AgentName, ChatMode, PlanActionSummary, StreamEvent, ErrorCode } from '@/lib/agent/types'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

const MAX_TOOL_TURNS = 10
const HEARTBEAT_MS = 8000
const HISTORY_TURNS = 20  // last N messages loaded as context

const bodySchema = z.object({
  conversation_id: z.string().uuid().nullable().optional(),
  user_message: z.string().min(1).max(8000),
  mode: z.enum(['fast', 'smart', 'deep']).default('smart'),
  images: z.array(z.object({
    filename: z.string().max(200),
    media_type: z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
    data: z.string().max(7_500_000),
  })).max(5).optional(),
})

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function resolveUser(): Promise<{ id: string; isAdmin: boolean } | null> {
  const supabase = await createSessionClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = adminClient()
  const { data } = await admin.from('users').select('role').eq('id', user.id).single()
  return { id: user.id, isAdmin: data?.role === 'admin' }
}

interface DbMessageRow {
  role: 'user' | 'assistant' | 'tool' | 'system'
  content: unknown
}

async function loadHistory(conversationId: string): Promise<Anthropic.MessageParam[]> {
  const { data, error } = await adminClient()
    .from('chat_messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(HISTORY_TURNS * 2)
  if (error) throw new Error(`history load failed: ${error.message}`)
  return (data as DbMessageRow[] | null ?? [])
    .filter(r => r.role === 'user' || r.role === 'assistant')
    .map(r => ({ role: r.role as 'user' | 'assistant', content: r.content as Anthropic.ContentBlockParam[] }))
}

function classifyError(err: unknown): ErrorCode {
  if (err instanceof BudgetExceededError) return 'budget_exceeded'
  const code = (err as { status?: number })?.status
  if (code === 429) return 'provider_rate_limited'
  if (typeof code === 'number' && code >= 500) return 'provider_unavailable'
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase()
  if (msg.includes('network') || msg.includes('fetch failed')) return 'provider_unavailable'
  if (msg.includes('timeout')) return 'timeout'
  return 'internal'
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params
  if (name !== 'atlas' && name !== 'sage') {
    return Response.json({ error: 'unknown agent' }, { status: 404 })
  }
  const agent: AgentName = name

  const user = await resolveUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (agent === 'atlas' && !user.isAdmin) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await request.json())
  } catch (e) {
    return Response.json({ error: 'bad_request', detail: e instanceof Error ? e.message : 'invalid body' }, { status: 400 })
  }

  // Budget guard runs synchronously before opening the stream so a fast 402-like
  // response is possible. After this point we always go through the SSE channel.
  try {
    await assertBudget(agent)
  } catch (err) {
    const code = classifyError(err)
    logChatEvent({ event: 'chat.stream.error', agent, user_id: user.id, code, detail: err instanceof Error ? err.message : undefined })
    return Response.json({ error: code, detail: err instanceof Error ? err.message : undefined }, { status: 402 })
  }

  // Resolve / create conversation. Both ownership and agent must match.
  const supabaseService = adminClient()
  let conversationId = body.conversation_id ?? null
  let isNewConversation = false
  if (conversationId) {
    const { data: existing } = await supabaseService
      .from('chat_conversations')
      .select('id, user_id, agent')
      .eq('id', conversationId)
      .maybeSingle()
    if (!existing || existing.user_id !== user.id || existing.agent !== agent) {
      conversationId = null  // ignore stale/mismatched id, start fresh
    }
  }
  if (!conversationId) {
    const title = body.user_message.slice(0, 80)
    const { data: created, error: createErr } = await supabaseService
      .from('chat_conversations')
      .insert({ user_id: user.id, agent, title })
      .select('id')
      .single()
    if (createErr) return Response.json({ error: 'internal', detail: createErr.message }, { status: 500 })
    conversationId = created.id as string
    isNewConversation = true
  }

  // Build user message content blocks (text + optional images).
  const userBlocks: Anthropic.ContentBlockParam[] = []
  for (const img of body.images ?? []) {
    userBlocks.push({
      type: 'image',
      source: { type: 'base64', media_type: img.media_type, data: img.data },
    })
  }
  userBlocks.push({ type: 'text', text: body.user_message })

  // Persist the user message before opening the stream so it survives crashes.
  const { error: userMsgErr } = await supabaseService.from('chat_messages').insert({
    conversation_id: conversationId,
    role: 'user',
    content: userBlocks.map(b => b.type === 'image'
      // Don't persist base64 image data — drop it to keep the DB lean.
      // Filename + mime are kept for context.
      ? { type: 'image_placeholder', media_type: (b.source as { media_type: string }).media_type }
      : b),
  })
  if (userMsgErr) return Response.json({ error: 'internal', detail: userMsgErr.message }, { status: 500 })

  // ──────────────────────────────────────────────────────────────────────
  // Open the SSE stream.
  // ──────────────────────────────────────────────────────────────────────

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  const model = MODEL_DEFAULTS[(body.mode ?? 'smart') as ChatMode]
  const system = systemPromptFor(agent)
  const tools = toolsForApi(agent) as Anthropic.Tool[]

  // Build seed messages: history + current turn
  const history = await loadHistory(conversationId)
  const messages: Anthropic.MessageParam[] = [...history, { role: 'user', content: userBlocks }]

  const streamStart = Date.now()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (e: StreamEvent) => controller.enqueue(sseFrame(e))
      const heartbeat = setInterval(() => {
        try { controller.enqueue(sseHeartbeat()) } catch { /* closed */ }
      }, HEARTBEAT_MS)

      let totalInputTokens = 0
      let totalOutputTokens = 0
      let totalCacheCreation = 0
      let totalCacheRead = 0
      let promptCacheHit = false
      let toolCallCount = 0
      const planActions: PlanActionSummary[] = []
      let assistantMessageId: string | null = null
      let aborted: ErrorCode | null = null
      // Final assembled assistant content blocks (text + tool_use) across all turns.
      const allAssistantBlocks: Anthropic.ContentBlock[] = []

      try {
        emit({ type: 'conversation', conversation_id: conversationId!, is_new: isNewConversation })

        logChatEvent({ event: 'chat.stream.start', agent, user_id: user.id, conversation_id: conversationId!, model, mode: body.mode ?? 'smart' })

        for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
          const turnStart = Date.now()
          const response = await client.messages.stream({
            model,
            max_tokens: 4096,
            system,
            tools,
            tool_choice: { type: 'auto' },
            messages,
          })

          // Per-turn tool_use accumulator (Anthropic streams partial JSON for inputs).
          const toolUseAcc = new Map<number, { id: string; name: string; jsonAcc: string }>()

          for await (const event of response) {
            if (event.type === 'message_start') {
              const usage = event.message.usage as unknown as Record<string, number | undefined>
              totalInputTokens += usage.input_tokens ?? 0
              totalOutputTokens += usage.output_tokens ?? 0
              if ((usage.cache_read_input_tokens ?? 0) > 0) promptCacheHit = true
              totalCacheCreation += usage.cache_creation_input_tokens ?? 0
              totalCacheRead += usage.cache_read_input_tokens ?? 0
              continue
            }
            if (event.type === 'content_block_start') {
              const block = event.content_block
              if (block.type === 'tool_use') {
                toolUseAcc.set(event.index, { id: block.id, name: block.name, jsonAcc: '' })
                emit({ type: 'tool_call_start', tool_use_id: block.id, name: block.name })
              }
              continue
            }
            if (event.type === 'content_block_delta') {
              const delta = event.delta
              if (delta.type === 'text_delta') {
                emit({ type: 'token', text: delta.text })
              } else if (delta.type === 'input_json_delta') {
                const acc = toolUseAcc.get(event.index)
                if (acc) {
                  acc.jsonAcc += delta.partial_json
                  emit({ type: 'tool_call_args', tool_use_id: acc.id, partial_json: delta.partial_json })
                }
              }
              continue
            }
            if (event.type === 'message_delta') {
              const usage = event.usage as unknown as Record<string, number | undefined>
              totalOutputTokens += (usage.output_tokens ?? 0) - 0  // delta accumulator
              continue
            }
          }

          const finalMessage = await response.finalMessage()
          for (const block of finalMessage.content) allAssistantBlocks.push(block)
          const turnUsage = finalMessage.usage as unknown as Record<string, number | undefined>
          totalInputTokens  = Math.max(totalInputTokens,  turnUsage.input_tokens  ?? totalInputTokens)
          totalOutputTokens = Math.max(totalOutputTokens, turnUsage.output_tokens ?? totalOutputTokens)
          totalCacheCreation = Math.max(totalCacheCreation, turnUsage.cache_creation_input_tokens ?? totalCacheCreation)
          totalCacheRead     = Math.max(totalCacheRead,     turnUsage.cache_read_input_tokens     ?? totalCacheRead)

          // Append assistant turn to message history for the next iteration.
          messages.push({ role: 'assistant', content: finalMessage.content })

          // Emit a token-throughput event roughly once per turn.
          const turnSecs = Math.max((Date.now() - turnStart) / 1000, 0.001)
          logChatEvent({
            event: 'chat.stream.token_throughput',
            agent,
            conversation_id: conversationId!,
            tokens_per_sec: (turnUsage.output_tokens ?? 0) / turnSecs,
            total_tokens_out: totalOutputTokens,
            prompt_cache_hit: promptCacheHit,
          })

          if (finalMessage.stop_reason !== 'tool_use') break

          // Execute tool_use blocks. Read + auto_write run inline; propose_write
          // is staged and a placeholder tool_result is appended that tells the
          // model "the user will decide later".
          const toolUses = finalMessage.content.filter(
            (c): c is Anthropic.ToolUseBlock => c.type === 'tool_use',
          )
          toolCallCount += toolUses.length

          const toolResults: Anthropic.ToolResultBlockParam[] = []
          for (const tu of toolUses) {
            const def = getTool(tu.name, agent)
            const toolStart = Date.now()
            if (!def) {
              toolResults.push({ type: 'tool_result', tool_use_id: tu.id, content: `Unknown tool: ${tu.name}`, is_error: true })
              continue
            }
            // Zod validate.
            const parsed = def.schema.safeParse(tu.input ?? {})
            if (!parsed.success) {
              const detail = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')
              toolResults.push({ type: 'tool_result', tool_use_id: tu.id, content: `Invalid input: ${detail}`, is_error: true })
              logChatEvent({ event: 'chat.stream.tool_call', agent, user_id: user.id, conversation_id: conversationId!, tool_name: tu.name, ok: false, duration_ms: Date.now() - toolStart, risk: def.risk, error: detail })
              continue
            }
            const input = parsed.data
            if (def.risk === 'propose_write') {
              // Build diff + stage row. We need the assistant message inserted
              // FIRST so the FK on chat_write_actions.message_id is valid. To
              // keep things simple we insert a placeholder assistant message now
              // (we'll update its content at the end of the stream).
              if (!assistantMessageId) {
                const { data: created, error } = await supabaseService.from('chat_messages').insert({
                  conversation_id: conversationId,
                  role: 'assistant',
                  content: [],
                  model,
                }).select('id').single()
                if (error || !created) {
                  toolResults.push({ type: 'tool_result', tool_use_id: tu.id, content: `Failed to stage plan: ${error?.message ?? 'unknown'}`, is_error: true })
                  continue
                }
                assistantMessageId = created.id as string
              }
              try {
                const diff = await def.buildDiff!(input as never, { userId: user.id, agent })
                const { data: actionRow, error } = await supabaseService.from('chat_write_actions').insert({
                  message_id: assistantMessageId,
                  tool_use_id: tu.id,
                  tool_name: tu.name,
                  input,
                  diff,
                  status: 'proposed',
                  display_order: planActions.length,
                }).select('id, status').single()
                if (error || !actionRow) {
                  toolResults.push({ type: 'tool_result', tool_use_id: tu.id, content: `Failed to stage plan: ${error?.message ?? 'unknown'}`, is_error: true })
                  continue
                }
                planActions.push({
                  id: actionRow.id as string,
                  tool_use_id: tu.id,
                  tool_name: tu.name,
                  diff,
                  status: actionRow.status as 'proposed',
                })
                toolResults.push({
                  type: 'tool_result',
                  tool_use_id: tu.id,
                  content: `Plan staged for user approval (action ${actionRow.id}). Continue your response — describe the proposed change in natural language, then stop. The user will approve or reject via the plan card.`,
                })
                logChatEvent({ event: 'chat.stream.tool_call', agent, user_id: user.id, conversation_id: conversationId!, tool_name: tu.name, ok: true, duration_ms: Date.now() - toolStart, risk: def.risk })
              } catch (e) {
                const msg = e instanceof Error ? e.message : String(e)
                toolResults.push({ type: 'tool_result', tool_use_id: tu.id, content: `Could not build diff: ${msg}`, is_error: true })
                logChatEvent({ event: 'chat.stream.tool_call', agent, user_id: user.id, conversation_id: conversationId!, tool_name: tu.name, ok: false, duration_ms: Date.now() - toolStart, risk: def.risk, error: msg })
              }
              continue
            }
            // read or auto_write → execute inline
            try {
              const result = await def.handler(input as never, { userId: user.id, agent })
              toolResults.push({ type: 'tool_result', tool_use_id: tu.id, content: JSON.stringify(result) })
              if (def.risk === 'auto_write') {
                emit({ type: 'action_executed', tool_name: tu.name, result })
              }
              logChatEvent({ event: 'chat.stream.tool_call', agent, user_id: user.id, conversation_id: conversationId!, tool_name: tu.name, ok: true, duration_ms: Date.now() - toolStart, risk: def.risk })
            } catch (e) {
              const msg = e instanceof Error ? e.message : String(e)
              toolResults.push({ type: 'tool_result', tool_use_id: tu.id, content: `Error: ${msg}`, is_error: true })
              logChatEvent({ event: 'chat.stream.tool_call', agent, user_id: user.id, conversation_id: conversationId!, tool_name: tu.name, ok: false, duration_ms: Date.now() - toolStart, risk: def.risk, error: msg })
            }
          }
          // After-turn: append all tool_results as a single user message.
          messages.push({ role: 'user', content: toolResults })
          // Emit tool_call_end after results so the UI can collapse the args card.
          for (const tu of toolUses) emit({ type: 'tool_call_end', tool_use_id: tu.id, name: tu.name, input: tu.input })
        }

        // Plan-card event (after the loop, so the assistant text has streamed).
        if (planActions.length > 0) {
          emit({ type: 'plan', actions: planActions })
          logChatEvent({ event: 'chat.stream.plan_proposed', agent, conversation_id: conversationId!, action_count: planActions.length })
        }
      } catch (err) {
        aborted = classifyError(err)
        const detail = err instanceof Error ? err.message : String(err)
        emit({ type: 'error', code: aborted, detail, retryable: aborted === 'provider_rate_limited' || aborted === 'provider_unavailable' || aborted === 'timeout' })
        logChatEvent({ event: 'chat.stream.error', agent, user_id: user.id, conversation_id: conversationId!, code: aborted, detail })
      } finally {
        clearInterval(heartbeat)

        // Persist the assistant message (or update the placeholder if we
        // created one for plan staging).
        const costUsd = computeCostUsd({
          model,
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
          cacheCreationInputTokens: totalCacheCreation,
          cacheReadInputTokens: totalCacheRead,
        })

        const toolCallNames = allAssistantBlocks
          .filter((c): c is Anthropic.ToolUseBlock => c.type === 'tool_use')
          .map(c => ({ id: c.id, name: c.name }))

        const persistContent = allAssistantBlocks
        try {
          if (assistantMessageId) {
            await supabaseService.from('chat_messages').update({
              content: persistContent,
              tool_calls: toolCallNames,
              input_tokens: totalInputTokens,
              output_tokens: totalOutputTokens,
              cost_usd: costUsd,
              model,
              prompt_cache_hit: promptCacheHit,
              aborted_reason: aborted ? (aborted === 'budget_exceeded' ? 'budget_exceeded' : aborted === 'timeout' ? 'timeout' : 'provider_failure') : null,
            }).eq('id', assistantMessageId)
          } else {
            const { data: created } = await supabaseService.from('chat_messages').insert({
              conversation_id: conversationId,
              role: 'assistant',
              content: persistContent,
              tool_calls: toolCallNames,
              input_tokens: totalInputTokens,
              output_tokens: totalOutputTokens,
              cost_usd: costUsd,
              model,
              prompt_cache_hit: promptCacheHit,
              aborted_reason: aborted ? (aborted === 'budget_exceeded' ? 'budget_exceeded' : aborted === 'timeout' ? 'timeout' : 'provider_failure') : null,
            }).select('id').single()
            assistantMessageId = created?.id ?? null
          }
        } catch (e) {
          console.error('[stream] persist assistant message failed', e)
        }

        trackChatCost({
          userId: user.id,
          agent,
          model,
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
          costUsd,
          purpose: `chat:${agent}:${body.mode ?? 'smart'}`,
        })

        try {
          if (assistantMessageId) controller.enqueue(sseFrame({ type: 'message', message_id: assistantMessageId }))
          controller.enqueue(sseFrame({ type: 'done', cost_usd: costUsd, prompt_cache_hit: promptCacheHit }))
        } catch { /* already closed */ }

        logChatEvent({
          event: 'chat.stream.done',
          agent,
          user_id: user.id,
          conversation_id: conversationId!,
          duration_ms: Date.now() - streamStart,
          input_tokens: totalInputTokens,
          output_tokens: totalOutputTokens,
          tool_calls: toolCallCount,
          cost_usd: costUsd,
        })

        controller.close()
      }
    },
    cancel() {
      // Client disconnected. Nothing destructive to do — finally{} above
      // still runs because the loop is wrapped in try/finally.
    },
  })

  return new Response(stream, { headers: sseHeaders() })
}

// GET — agent capability advertisement (used by the UI to choose a model selector etc.)
export async function GET(_request: NextRequest, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params
  if (name !== 'atlas' && name !== 'sage') return Response.json({ error: 'unknown agent' }, { status: 404 })
  const agent: AgentName = name
  const user = await resolveUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (agent === 'atlas' && !user.isAdmin) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  return Response.json({
    agent,
    models: MODEL_DEFAULTS,
    tools: toolsForAgent(agent).map(t => ({ name: t.name, description: t.description, risk: t.risk })),
  })
}
