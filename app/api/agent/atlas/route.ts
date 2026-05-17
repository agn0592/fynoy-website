import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { createClient as createSessionClient } from '@/lib/supabase/server'
import { ATLAS_TOOLS, getTool, toolsForApi } from '@/lib/agent/tools'
import { ATLAS_SYSTEM } from '@/lib/agent/prompts'

export const maxDuration = 60

const MODEL = 'claude-sonnet-4-6'
const MAX_TOOL_TURNS = 6

async function isAdmin(): Promise<boolean> {
  const supabase = await createSessionClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { data } = await service.from('users').select('role').eq('id', user.id).single()
  return data?.role === 'admin'
}

interface ChatBody {
  messages: Anthropic.MessageParam[]
  // When set, the last assistant turn in messages contains a tool_use that the
  // user has just decided on. Backend executes it (or returns an error result)
  // then continues the conversation.
  approved?: { tool_use_id: string; approved: boolean; reason?: string }
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  const body = (await request.json()) as ChatBody
  const messages: Anthropic.MessageParam[] = [...(body.messages ?? [])]

  // If the user just confirmed/rejected a pending tool, resolve it now.
  if (body.approved) {
    const last = messages[messages.length - 1]
    if (last?.role !== 'assistant' || !Array.isArray(last.content)) {
      return Response.json({ error: 'No pending tool_use to resolve' }, { status: 400 })
    }
    const toolUse = last.content.find(
      (c): c is Anthropic.ToolUseBlock => c.type === 'tool_use' && c.id === body.approved!.tool_use_id,
    )
    if (!toolUse) {
      return Response.json({ error: 'tool_use_id not found in last assistant message' }, { status: 400 })
    }
    let toolResultContent: string
    let isError = false
    if (!body.approved.approved) {
      toolResultContent = `User declined to approve this action.${body.approved.reason ? ' Reason: ' + body.approved.reason : ''}`
      isError = true
    } else {
      try {
        const def = getTool(toolUse.name)
        if (!def) throw new Error(`Unknown tool: ${toolUse.name}`)
        const result = await def.handler(toolUse.input as Record<string, unknown>)
        toolResultContent = JSON.stringify(result)
      } catch (e) {
        toolResultContent = `Error: ${e instanceof Error ? e.message : String(e)}`
        isError = true
      }
    }
    messages.push({
      role: 'user',
      content: [{
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: toolResultContent,
        is_error: isError,
      }],
    })
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  // Run the tool-use loop. Auto-execute read-only tools; pause for writes.
  for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: ATLAS_SYSTEM,
      tools: toolsForApi() as Anthropic.Tool[],
      messages,
    })

    // Append assistant turn
    messages.push({ role: 'assistant', content: response.content })

    if (response.stop_reason !== 'tool_use') {
      // Done — return final messages
      return Response.json({ status: 'done', messages })
    }

    const toolUses = response.content.filter(
      (c): c is Anthropic.ToolUseBlock => c.type === 'tool_use',
    )

    // Check if any tool requires confirmation. If yes, pause.
    const pending = toolUses.find(tu => {
      const def = getTool(tu.name)
      return def?.requiresConfirmation
    })
    if (pending) {
      return Response.json({
        status: 'pending',
        messages,
        pending: {
          tool_use_id: pending.id,
          name: pending.name,
          input: pending.input,
          description: getTool(pending.name)?.description ?? '',
        },
      })
    }

    // Execute all read-only tool calls and append results.
    const toolResults: Anthropic.ToolResultBlockParam[] = []
    for (const tu of toolUses) {
      const def = getTool(tu.name)
      if (!def) {
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tu.id,
          content: `Unknown tool: ${tu.name}`,
          is_error: true,
        })
        continue
      }
      try {
        const result = await def.handler(tu.input as Record<string, unknown>)
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tu.id,
          content: JSON.stringify(result),
        })
      } catch (e) {
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tu.id,
          content: `Error: ${e instanceof Error ? e.message : String(e)}`,
          is_error: true,
        })
      }
    }
    messages.push({ role: 'user', content: toolResults })
  }

  // Safety: if we hit MAX_TOOL_TURNS without a final answer, return what we have.
  return Response.json({
    status: 'done',
    messages,
    warning: 'Reached max tool-use turns without final answer.',
  })
}

// Expose tool list for the frontend to render confirm cards nicely.
export async function GET() {
  if (!(await isAdmin())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return Response.json({
    model: MODEL,
    tools: ATLAS_TOOLS.map(t => ({
      name: t.name,
      description: t.description,
      requiresConfirmation: t.requiresConfirmation,
    })),
  })
}
