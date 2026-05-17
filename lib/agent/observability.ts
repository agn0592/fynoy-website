// Structured event logging. Currently writes to console (Vercel ingests
// stdout into Log Drains automatically); easy to swap for a real sink later.

import type { AgentName, ErrorCode } from './types'

type LogEvent =
  | { event: 'chat.stream.start';     agent: AgentName; user_id: string; conversation_id: string; model: string; mode: string }
  | { event: 'chat.stream.tool_call'; agent: AgentName; user_id: string; conversation_id: string; tool_name: string; ok: boolean; duration_ms: number; risk: string; error?: string }
  | { event: 'chat.stream.token_throughput'; agent: AgentName; conversation_id: string; tokens_per_sec: number; total_tokens_out: number; prompt_cache_hit: boolean }
  | { event: 'chat.stream.plan_proposed'; agent: AgentName; conversation_id: string; action_count: number }
  | { event: 'chat.stream.done';      agent: AgentName; user_id: string; conversation_id: string; duration_ms: number; input_tokens: number; output_tokens: number; tool_calls: number; cost_usd: number }
  | { event: 'chat.stream.error';     agent: AgentName; user_id: string; conversation_id?: string; code: ErrorCode; detail?: string }
  | { event: 'chat.action.approved';  user_id: string; action_id: string; tool_name: string; ok: boolean; duration_ms: number; error?: string }

export function logChatEvent(evt: LogEvent): void {
  // Stringify with a stable key order so Log Drain ingestion is predictable.
  // Logged as a single line of JSON — Vercel parses these into structured logs.
  try {
    console.log(JSON.stringify({ ts: new Date().toISOString(), ...evt }))
  } catch {
    // Fallback for circular refs etc.
    console.log('[chat-event]', evt.event)
  }
}
