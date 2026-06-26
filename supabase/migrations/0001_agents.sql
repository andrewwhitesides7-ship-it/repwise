-- Meridian agent stack — tables the agents write to and the dashboard reads from.
-- Apply via the Supabase SQL editor, or `supabase db push` if you use the CLI.

-- One row per deployed agent instance, per user.
create table if not exists public.agents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null,                       -- lead_response | follow_up | scheduling | quote_invoice | reviews
  name        text not null,
  status      text not null default 'active',      -- active | paused
  config      jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- The action log. This is what the dashboard Activity + Performance tabs render.
create table if not exists public.agent_activity (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  agent_id        uuid references public.agents(id) on delete set null,
  agent_type      text not null,
  action          text not null,                   -- short human-readable line
  detail          text,
  tone            text not null default 'ok',      -- ok | accent | warn
  status          text not null default 'done',    -- done | pending | approved | skipped
  needs_approval  boolean not null default false,
  recovered_cents integer not null default 0,      -- store money as integer cents
  payload         jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists agents_user_idx on public.agents (user_id);
create index if not exists agent_activity_user_created_idx on public.agent_activity (user_id, created_at desc);

-- Row level security: users only see/manage their own rows.
-- Inserts into agent_activity happen from the server via the service-role key, which bypasses RLS.
alter table public.agents enable row level security;
alter table public.agent_activity enable row level security;

drop policy if exists agents_select_own on public.agents;
drop policy if exists agents_update_own on public.agents;
drop policy if exists agents_insert_own on public.agents;
create policy agents_select_own on public.agents for select using (auth.uid() = user_id);
create policy agents_update_own on public.agents for update using (auth.uid() = user_id);
create policy agents_insert_own on public.agents for insert with check (auth.uid() = user_id);

drop policy if exists activity_select_own on public.agent_activity;
drop policy if exists activity_update_own on public.agent_activity;
create policy activity_select_own on public.agent_activity for select using (auth.uid() = user_id);
create policy activity_update_own on public.agent_activity for update using (auth.uid() = user_id);
