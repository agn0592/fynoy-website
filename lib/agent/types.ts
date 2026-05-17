// Shared types for the Atlas (admin) and Sage (member) agents.

export type AgentName = 'atlas' | 'sage'

export type ChatMode = 'fast' | 'smart' | 'deep'

// Three-tier risk model — ported from Otto.
//   read         — pure data fetch. Auto-runs.
//   auto_write   — reversible / low-risk mutation. Auto-runs; emits an
//                  action chip in the UI.
//   propose_write — destructive / irreversible mutation. Inserts a row
//                   in chat_write_actions and waits for the user to
//                   approve via the plan card.
export type AgentRisk = 'read' | 'auto_write' | 'propose_write'

// Which agent the tool is exposed to. Both = Sage and Atlas.
export type AgentSurface = 'atlas' | 'sage' | 'both'

// Discriminated union of diff shapes shown on the plan card before
// the user approves a propose-tier action.
export type PlanDiff =
  | {
      kind: 'case_update'
      trading_id: string
      ticker?: string | null
      company_name?: string | null
      changes: { field: string; from: unknown; to: unknown }[]
    }
  | {
      kind: 'position_update'
      symbol: string
      changes: { field: string; from: unknown; to: unknown }[]
    }
  | {
      kind: 'generic'
      title: string
      summary: string
      payload: Record<string, unknown>
    }

// SSE event names emitted by the streaming route.
export type StreamEvent =
  | { type: 'conversation'; conversation_id: string; is_new: boolean }
  | { type: 'token'; text: string }
  | { type: 'tool_call_start'; tool_use_id: string; name: string }
  | { type: 'tool_call_args'; tool_use_id: string; partial_json: string }
  | { type: 'tool_call_end'; tool_use_id: string; name: string; input: unknown }
  | { type: 'action_executed'; tool_name: string; result: unknown }
  | { type: 'plan'; actions: PlanActionSummary[] }
  | { type: 'chart'; spec: Record<string, unknown> }
  | { type: 'message'; message_id: string }
  | {
      type: 'error'
      code: ErrorCode
      detail?: string
      retryable: boolean
    }
  | { type: 'done'; cost_usd: number; prompt_cache_hit: boolean }

export interface PlanActionSummary {
  id: string                  // chat_write_actions.id
  tool_use_id: string
  tool_name: string
  diff: PlanDiff
  status: 'proposed' | 'approved' | 'rejected' | 'executed' | 'failed' | 'expired'
}

export type ErrorCode =
  | 'unauthorized'
  | 'budget_exceeded'
  | 'provider_rate_limited'
  | 'provider_unavailable'
  | 'tool_failed'
  | 'timeout'
  | 'internal'
  | 'bad_request'

export interface ChatRequestBody {
  conversation_id?: string | null
  user_message: string
  mode?: ChatMode
  images?: { filename: string; media_type: string; data: string }[]
}
