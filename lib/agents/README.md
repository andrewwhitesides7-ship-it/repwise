# Adunda agent stack

Modular AI agents for small service businesses. Each agent is a small module that
takes an event, asks Claude what to do, and logs one row to `agent_activity` — which
is what the dashboard renders.

## Layout

```
lib/agents/
  types.ts            Shared types (AgentType, AgentModule, AgentResult)
  registry.ts         Maps agent type -> module. Register new agents here.
  runner.ts           Calls Claude, parses the result, writes agent_activity
  modules/
    lead-response.ts
    follow-up.ts
    scheduling.ts
    quote-invoice.ts
    reviews.ts
app/actions/agents.ts        Server actions the dashboard calls (read activity, pause, approve, trigger)
app/api/agents/[agent]/route.ts   Default trigger (on-demand / webhook) — swappable
supabase/migrations/0001_agents.sql   The two tables + RLS
```

## Setup

1. Apply the migration: paste `supabase/migrations/0001_agents.sql` into the Supabase
   SQL editor and run it (or `supabase db push` with the CLI).
2. Make sure these env vars exist (most already do):
   - `ANTHROPIC_API_KEY`
   - `ANTHROPIC_MODEL` (optional, defaults to claude-sonnet-4-20250514)
   - `AGENT_WEBHOOK_SECRET` (any random string — required by the trigger route)
   - `SUPABASE_SERVICE_ROLE_KEY` (used by `createServiceClient`)
3. Create an agent row per user, e.g.:
   ```sql
   insert into public.agents (user_id, type, name)
   values ('<user-uuid>', 'lead_response', 'Lead Response');
   ```

## Triggering an agent

```bash
curl -X POST https://yourapp.com/api/agents/lead_response \
  -H "Content-Type: application/json" \
  -d '{"userId":"<uuid>","secret":"<AGENT_WEBHOOK_SECRET>","payload":{"name":"Jane","service":"lawn care","message":"need a quote"}}'
```

Or from anywhere in the app: `triggerAgent("lead_response", { ...payload })`.

## Adding a new agent

1. Add `lib/agents/modules/my-agent.ts` exporting an `AgentModule`.
2. Add its type to `AgentType` in `types.ts`.
3. Register it in `registry.ts`.

That's it — the runner, activity logging, dashboard, and trigger route all pick it up.

## Swapping the trigger to a schedule

Delete `app/api/agents/[agent]/route.ts` and call `runAgent()` from a cron route
(e.g. a Vercel Cron hitting `/api/cron/sweep`) or a queue worker. The agent logic
in `lib/agents` does not change.
