// Anthropic model selection + cost helpers.
// Pricing is pure; trackChatCost() is fire-and-forget I/O.

import { createClient } from '@supabase/supabase-js'
import type { AgentName, ChatMode } from './types'

export const MODEL_DEFAULTS: Record<ChatMode, string> = {
  fast: 'claude-haiku-4-5',
  smart: 'claude-sonnet-4-6',
  deep: 'claude-opus-4-7',
}

// Per-1k-token pricing in USD. Numbers are the public list prices for the
// current Claude 4.x family; tweak when Anthropic updates.
export const PRICING_PER_1K: Record<string, { input: number; output: number; cache_write?: number; cache_read?: number }> = {
  'claude-haiku-4-5':   { input: 0.001,  output: 0.005,  cache_write: 0.00125, cache_read: 0.00010 },
  'claude-sonnet-4-6':  { input: 0.003,  output: 0.015,  cache_write: 0.00375, cache_read: 0.00030 },
  'claude-opus-4-7':    { input: 0.015,  output: 0.075,  cache_write: 0.01875, cache_read: 0.00150 },
}

export interface CostInputs {
  model: string
  inputTokens: number
  outputTokens: number
  cacheCreationInputTokens?: number
  cacheReadInputTokens?: number
}

export function computeCostUsd({
  model,
  inputTokens,
  outputTokens,
  cacheCreationInputTokens = 0,
  cacheReadInputTokens = 0,
}: CostInputs): number {
  const price = PRICING_PER_1K[model] ?? PRICING_PER_1K['claude-sonnet-4-6']
  // Cached reads are billed at a fraction of normal input; cache writes have a
  // small premium over normal input. Anthropic counts both separately from
  // "regular" input_tokens.
  const inputCost  = (inputTokens / 1000) * price.input
  const writeCost  = (cacheCreationInputTokens / 1000) * (price.cache_write ?? price.input)
  const readCost   = (cacheReadInputTokens / 1000) * (price.cache_read ?? price.input)
  const outputCost = (outputTokens / 1000) * price.output
  return Number((inputCost + writeCost + readCost + outputCost).toFixed(6))
}

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export interface TrackChatCostArgs {
  userId: string | null
  agent: AgentName
  model: string
  inputTokens: number
  outputTokens: number
  costUsd: number
  purpose?: string
}

// Fire-and-forget. Errors are swallowed but logged — usage tracking should
// never break the chat flow.
export function trackChatCost(args: TrackChatCostArgs): void {
  void serviceClient()
    .from('llm_usage')
    .insert({
      user_id: args.userId,
      agent: args.agent,
      model: args.model,
      input_tokens: args.inputTokens,
      output_tokens: args.outputTokens,
      cost_usd: args.costUsd,
      purpose: args.purpose ?? null,
    })
    .then(({ error }) => {
      if (error) console.error('[trackChatCost]', error.message)
    })
}
