-- ============================================================
-- 012_atlas_sage_chat.sql
-- Persistent backbone for the Atlas (admin) and Sage (member)
-- AI agents. Ported from CatalogOS / Otto, simplified for
-- Fynoy's single-owner + single-store model.
--
-- Tables:
--   chat_conversations   — per-user threads, agent='atlas'|'sage'
--   chat_messages        — Anthropic content blocks + token/cost meta
--   chat_write_actions   — propose-tier write tools awaiting approval
--   llm_usage            — append-only spend log per request
--   llm_budgets          — single-row monthly cap config (per agent)
-- ============================================================

-- ----------------------------------------------------------------
-- 1. ENUMs (guarded for idempotency)
-- ----------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_type where typname = 'agent_name') then
    create type public.agent_name as enum ('atlas', 'sage');
  end if;

  if not exists (select 1 from pg_type where typname = 'chat_message_role') then
    create type public.chat_message_role as enum ('user', 'assistant', 'tool', 'system');
  end if;

  if not exists (select 1 from pg_type where typname = 'chat_write_action_status') then
    create type public.chat_write_action_status as enum (
      'proposed', 'approved', 'rejected', 'executed', 'failed', 'expired'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'chat_message_aborted_reason') then
    create type public.chat_message_aborted_reason as enum (
      'user_aborted', 'budget_exceeded', 'provider_failure', 'timeout', 'tool_failed'
    );
  end if;
end $$;


-- ----------------------------------------------------------------
-- 2. chat_conversations
-- ----------------------------------------------------------------
create table if not exists public.chat_conversations (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  agent      public.agent_name not null,
  title      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_chat_conversations_user_agent
  on public.chat_conversations(user_id, agent, updated_at desc);

alter table public.chat_conversations enable row level security;

drop policy if exists "chat_conversations_select"     on public.chat_conversations;
drop policy if exists "chat_conversations_insert_own" on public.chat_conversations;
drop policy if exists "chat_conversations_update_own" on public.chat_conversations;
drop policy if exists "chat_conversations_delete_own" on public.chat_conversations;

-- Owner sees own conversations. Atlas (admin) conversations require the
-- agent='atlas' + admin role check on the server side; RLS is owner-only.
create policy "chat_conversations_select" on public.chat_conversations
  for select using (user_id = auth.uid());

create policy "chat_conversations_insert_own" on public.chat_conversations
  for insert with check (user_id = auth.uid());

create policy "chat_conversations_update_own" on public.chat_conversations
  for update
  using    (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "chat_conversations_delete_own" on public.chat_conversations
  for delete using (user_id = auth.uid());


-- ----------------------------------------------------------------
-- 3. chat_messages
-- ----------------------------------------------------------------
create table if not exists public.chat_messages (
  id              uuid        primary key default gen_random_uuid(),
  conversation_id uuid        not null references public.chat_conversations(id) on delete cascade,
  role            public.chat_message_role not null,
  -- Full Anthropic content blocks: [{type:'text',text:'…'}, {type:'tool_use',...}, …]
  content         jsonb       not null,
  -- Denormalised tool_use names for fast filtering / observability.
  tool_calls      jsonb,
  input_tokens    integer,
  output_tokens   integer,
  cost_usd        numeric(10, 6),
  model           text,
  prompt_cache_hit boolean,
  aborted_reason  public.chat_message_aborted_reason,
  created_at      timestamptz not null default now()
);

create index if not exists idx_chat_messages_conversation
  on public.chat_messages(conversation_id, created_at);

alter table public.chat_messages enable row level security;

drop policy if exists "chat_messages_select"     on public.chat_messages;
drop policy if exists "chat_messages_insert_own" on public.chat_messages;
drop policy if exists "chat_messages_delete_own" on public.chat_messages;

create policy "chat_messages_select" on public.chat_messages
  for select using (
    exists (
      select 1 from public.chat_conversations c
      where c.id = chat_messages.conversation_id
        and c.user_id = auth.uid()
    )
  );

create policy "chat_messages_insert_own" on public.chat_messages
  for insert with check (
    exists (
      select 1 from public.chat_conversations c
      where c.id = chat_messages.conversation_id
        and c.user_id = auth.uid()
    )
  );

create policy "chat_messages_delete_own" on public.chat_messages
  for delete using (
    exists (
      select 1 from public.chat_conversations c
      where c.id = chat_messages.conversation_id
        and c.user_id = auth.uid()
    )
  );


-- ----------------------------------------------------------------
-- 4. chat_write_actions — propose-tier plan rows awaiting approval
-- ----------------------------------------------------------------
create table if not exists public.chat_write_actions (
  id              uuid    primary key default gen_random_uuid(),
  message_id      uuid    not null references public.chat_messages(id) on delete cascade,
  tool_use_id     text    not null,           -- Anthropic tool_use.id from the originating message
  tool_name       text    not null,           -- e.g. 'update_case'
  input           jsonb   not null,           -- raw tool input
  diff            jsonb   not null,           -- discriminated-union diff for the plan card
  status          public.chat_write_action_status not null default 'proposed',
  approved_by     uuid    references auth.users(id) on delete set null,
  approved_at     timestamptz,
  executed_at     timestamptz,
  result          jsonb,                      -- handler return value on success
  error           text,                       -- error message on failure
  display_order   integer not null default 0,
  ord_seq         bigint  generated always as identity,
  created_at      timestamptz not null default now()
);

create index if not exists idx_chat_write_actions_message
  on public.chat_write_actions(message_id);

create index if not exists idx_chat_write_actions_status
  on public.chat_write_actions(status, created_at desc);

alter table public.chat_write_actions enable row level security;

drop policy if exists "chat_write_actions_select" on public.chat_write_actions;
drop policy if exists "chat_write_actions_insert" on public.chat_write_actions;
drop policy if exists "chat_write_actions_update" on public.chat_write_actions;

create policy "chat_write_actions_select" on public.chat_write_actions
  for select using (
    exists (
      select 1
      from public.chat_messages m
      join public.chat_conversations c on c.id = m.conversation_id
      where m.id = chat_write_actions.message_id
        and c.user_id = auth.uid()
    )
  );

create policy "chat_write_actions_insert" on public.chat_write_actions
  for insert with check (
    exists (
      select 1
      from public.chat_messages m
      join public.chat_conversations c on c.id = m.conversation_id
      where m.id = chat_write_actions.message_id
        and c.user_id = auth.uid()
    )
  );

create policy "chat_write_actions_update" on public.chat_write_actions
  for update using (
    exists (
      select 1
      from public.chat_messages m
      join public.chat_conversations c on c.id = m.conversation_id
      where m.id = chat_write_actions.message_id
        and c.user_id = auth.uid()
    )
  );


-- ----------------------------------------------------------------
-- 5. llm_usage — append-only Anthropic spend log
-- ----------------------------------------------------------------
create table if not exists public.llm_usage (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        references auth.users(id) on delete set null,
  agent         public.agent_name,
  model         text        not null,
  input_tokens  integer     not null,
  output_tokens integer     not null,
  cost_usd      numeric(10, 6) not null,
  purpose       text,
  created_at    timestamptz not null default now()
);

create index if not exists idx_llm_usage_agent_date
  on public.llm_usage(agent, created_at desc);

create index if not exists idx_llm_usage_user_date
  on public.llm_usage(user_id, created_at desc);

alter table public.llm_usage enable row level security;

drop policy if exists "llm_usage_select_admin" on public.llm_usage;

-- Only admins can read the cost log.
create policy "llm_usage_select_admin" on public.llm_usage
  for select using (public.is_admin());
-- No client-side INSERT policy: writes happen via service role only.


-- ----------------------------------------------------------------
-- 6. llm_budgets — monthly cap per agent (single-row config)
-- ----------------------------------------------------------------
create table if not exists public.llm_budgets (
  agent              public.agent_name primary key,
  monthly_cap_usd    numeric(10, 2) not null default 50.00,
  updated_at         timestamptz not null default now(),
  updated_by         uuid references auth.users(id) on delete set null
);

alter table public.llm_budgets enable row level security;

drop policy if exists "llm_budgets_select_authenticated" on public.llm_budgets;
drop policy if exists "llm_budgets_update_admin" on public.llm_budgets;
drop policy if exists "llm_budgets_insert_admin" on public.llm_budgets;

create policy "llm_budgets_select_authenticated" on public.llm_budgets
  for select using (auth.role() = 'authenticated');

create policy "llm_budgets_update_admin" on public.llm_budgets
  for update using (public.is_admin())
  with check (public.is_admin());

create policy "llm_budgets_insert_admin" on public.llm_budgets
  for insert with check (public.is_admin());

-- Seed defaults — Atlas gets a higher cap because admin work uses larger contexts.
insert into public.llm_budgets (agent, monthly_cap_usd)
values ('atlas', 75.00), ('sage', 25.00)
on conflict (agent) do nothing;


-- ----------------------------------------------------------------
-- 7. month-to-date spend helper (used by the budget guard)
-- ----------------------------------------------------------------
create or replace function public.llm_spend_mtd(p_agent public.agent_name)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(cost_usd), 0)::numeric
  from public.llm_usage
  where agent = p_agent
    and created_at >= date_trunc('month', now() at time zone 'UTC');
$$;

revoke all on function public.llm_spend_mtd(public.agent_name) from public;
grant execute on function public.llm_spend_mtd(public.agent_name) to authenticated, service_role;


-- ----------------------------------------------------------------
-- 8. updated_at trigger for chat_conversations
-- ----------------------------------------------------------------
create or replace function public.touch_chat_conversation()
returns trigger
language plpgsql
as $$
begin
  update public.chat_conversations
     set updated_at = now()
   where id = new.conversation_id;
  return new;
end$$;

drop trigger if exists trg_chat_messages_touch_conversation on public.chat_messages;
create trigger trg_chat_messages_touch_conversation
  after insert on public.chat_messages
  for each row execute function public.touch_chat_conversation();
