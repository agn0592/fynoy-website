// Monthly Anthropic spend cap. Throws BudgetExceededError before opening a
// stream if the cap has been hit. Caps live in public.llm_budgets and
// can be edited from the admin Settings page (Atlas-only).

import { createClient } from '@supabase/supabase-js'
import type { AgentName } from './types'

export class BudgetExceededError extends Error {
  public readonly agent: AgentName
  public readonly spentUsd: number
  public readonly capUsd: number
  constructor(agent: AgentName, spentUsd: number, capUsd: number) {
    super(`Monthly Anthropic budget exceeded for ${agent}: $${spentUsd.toFixed(2)} ≥ $${capUsd.toFixed(2)}.`)
    this.name = 'BudgetExceededError'
    this.agent = agent
    this.spentUsd = spentUsd
    this.capUsd = capUsd
  }
}

function service() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export interface BudgetStatus {
  agent: AgentName
  spent_usd: number
  cap_usd: number
  remaining_usd: number
  exceeded: boolean
}

export async function getBudgetStatus(agent: AgentName): Promise<BudgetStatus> {
  const supabase = service()
  const [{ data: spendRow, error: spendErr }, { data: capRow, error: capErr }] = await Promise.all([
    supabase.rpc('llm_spend_mtd', { p_agent: agent }),
    supabase.from('llm_budgets').select('monthly_cap_usd').eq('agent', agent).maybeSingle(),
  ])
  if (spendErr) throw new Error(`spend lookup failed: ${spendErr.message}`)
  if (capErr) throw new Error(`cap lookup failed: ${capErr.message}`)
  const spent = Number(spendRow ?? 0)
  const cap   = Number(capRow?.monthly_cap_usd ?? 50)
  return {
    agent,
    spent_usd: spent,
    cap_usd: cap,
    remaining_usd: Math.max(0, cap - spent),
    exceeded: spent >= cap,
  }
}

export async function assertBudget(agent: AgentName): Promise<BudgetStatus> {
  const status = await getBudgetStatus(agent)
  if (status.exceeded) throw new BudgetExceededError(agent, status.spent_usd, status.cap_usd)
  return status
}
