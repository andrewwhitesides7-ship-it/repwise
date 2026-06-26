// Meridian agent stack — the runner. Trigger-agnostic: call runAgent() from an
// API route, a cron sweep, a queue worker, or a server action. It calls Claude,
// parses a structured result, and writes one agent_activity row.

import Anthropic from "@anthropic-ai/sdk";
import { createServiceClient } from "@/lib/supabase/server";
import { getModule } from "./registry";
import type { AgentType, AgentResult } from "./types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";

const JSON_INSTRUCTION = `\n\nRespond ONLY with a JSON object, no prose and no markdown fences:
{"action": string, "detail": string, "tone": "ok" | "accent" | "warn", "needs_approval": boolean, "recovered_cents": number}`;

export async function runAgent(opts: {
  userId: string;
  agentId?: string | null;
  type: AgentType;
  payload?: Record<string, any>;
}): Promise<{ result: AgentResult; activityId: string | null }> {
  const mod = getModule(opts.type);
  if (!mod) throw new Error(`Unknown agent type: ${opts.type}`);

  // Safe default so a model/parse failure still logs something useful.
  let result: AgentResult = { action: `${mod.name} processed an event`, tone: "ok", recovered_cents: 0 };

  try {
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: mod.system + JSON_INSTRUCTION,
      messages: [{ role: "user", content: mod.buildInput(opts.payload || {}) }],
    });

    const text = msg.content.map((b: any) => (b.type === "text" ? b.text : "")).join("").trim();
    const clean = text.replace(/```json|```/g, "").trim();

    // Never throw out of the parse block — fall back to the default result.
    try {
      const parsed = JSON.parse(clean);
      result = { ...result, ...parsed };
    } catch {
      result.detail = "Agent ran, but the response was not structured JSON.";
      result.tone = "warn";
    }
  } catch {
    result = { action: `${mod.name} could not complete`, detail: "Run failed — check server logs.", tone: "warn", recovered_cents: 0 };
  }

  // Service client bypasses RLS so the server can write activity for any user.
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("agent_activity")
    .insert({
      user_id: opts.userId,
      agent_id: opts.agentId ?? null,
      agent_type: opts.type,
      action: result.action,
      detail: result.detail ?? null,
      tone: result.tone ?? "ok",
      status: result.needs_approval ? "pending" : "done",
      needs_approval: !!result.needs_approval,
      recovered_cents: Math.round(result.recovered_cents ?? 0),
      payload: result.payload ?? {},
    })
    .select("id")
    .single();

  if (error) console.error("[agents] activity insert failed:", error.message);
  return { result, activityId: data?.id ?? null };
}
