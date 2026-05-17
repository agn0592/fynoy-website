import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient as createSessionClient } from '@/lib/supabase/server'
import { SAGE_TOOLS, getTool } from '@/lib/agent/tools'
import { SAGE_SYSTEM } from '@/lib/agent/prompts'

export const maxDuration = 60

const MODEL = 'claude-sonnet-4-6'
const MAX_TOOL_TURNS = 6

async function isAuthenticated(): Promise<boolean> {
  const supabase = await createSessionClient()
  const { data: { user } } = await supabase.auth.getUser()
  return !!user
}

interface ChatBody {
  messages: Anthropic.MessageParam[]
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  const body = (await request.json()) as ChatBody
  const messages: Anthropic.MessageParam[] = [...(body.messages ?? [])]

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const sageToolsForApi = SAGE_TOOLS.map(t => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema,
  })) as Anthropic.Tool[]

  for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: SAGE_SYSTEM,
      tools: sageToolsForApi,
      messages,
    })

    messages.push({ role: 'assistant', content: response.content })

    if (response.stop_reason !== 'tool_use') {
      return Response.json({ status: 'done', messages })
    }

    const toolUses = response.content.filter(
      (c): c is Anthropic.ToolUseBlock => c.type === 'tool_use',
    )

    const toolResults: Anthropic.ToolResultBlockParam[] = []
    for (const tu of toolUses) {
      const def = getTool(tu.name)
      // Defense in depth: Sage should never see a write tool, but reject any
      // that slipped past.
      if (!def || def.requiresConfirmation) {
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tu.id,
          content: `Tool "${tu.name}" is not available to Sage (read-only).`,
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

  return Response.json({
    status: 'done',
    messages,
    warning: 'Reached max tool-use turns without final answer.',
  })
}
