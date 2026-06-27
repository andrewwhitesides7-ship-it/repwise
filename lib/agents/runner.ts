// Meridian agent stack — the runner. Trigger-agnostic: call runAgent() from an
// API route, a cron sweep, a queue worker, or a server action. It asks Claude what
// to do, drafts the real customer-facing message, ACTS on it (sends via Resend) or
// holds it for owner approval, and writes one agent_activity row.

import Anthropic from "@anthropic-ai/sdk";
import { createServiceClient } from "@/lib/supabase/server";
import { getModule } from "./registry";
import { sendEmail } from "./send";
import type { AgentType, AgentResult } from "./types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";

// Agents that send a customer-facing email. (Scheduling needs a calendar integration first.)
const SENDING_TYPES: AgentType[] = ["lead_response", "follow_up", "quote_invoice", "reviews"];

const JSON_INSTRUCTION = `\n\nRespond ONLY with a JSON object, no prose and no markdown fences:
{"action": string, "detail": string, "tone": "ok" | "accent" | "warn", "needs_approval": boolean, "recovered_cents": number, "email_subject": string, "email_body": string}
- action + detail: a short log line for the owner's dashboard (what you did).
- email_subject + email_body: the ACTUAL customer-facing message, real and ready to send (plain text). If no message should be sent, set both to "".`;

type RunResult = AgentResult & { email_subject?: string; email_body?: string };

export async function runAgent(opts: {
  userId: string;
  agentId?: string | null;
  type: AgentType;
  payload?: Record<string, any>;
}): Promise<{ result: AgentResult; activityId: string | null; sent: boolean }> {
  const mod = getModule(opts.type);
  if (!mod) throw new Error(`Unknown agent type: ${opts.type}`);
  const payload = opts.payload || {};
  const to: string | undefined = payload.email || payload.to;

  let result: RunResult = { action: `${mod.name} processed an event`, tone: "ok", recovered_cents: 0 };

  try {
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: mod.system + JSON_INSTRUCTION,
      messages: [{ role: "user", content: mod.buildInput(payload) }],
    });
    const text = msg.content.map((b: any) => (b.type === "text" ? b.text : "")).join("").trim();
    const clean = text.replace(/```json|```/g, "").trim();
    // Never throw out of the parse block — fall back to the default result.
    try {
      result = { ...result, ...JSON.parse(clean) };
    } catch {
      result.detail = "Agent ran, but the response was not structured JSON.";
      result.tone = "warn";
    }
  } catch {
    result = { action: `${mod.name} could not complete`, detail: "Run failed — check server logs.", tone: "warn", recovered_cents: 0 };
  }

  // Act: send now, or hold the draft for the owner to approve.
  const hasMessage = !!result.email_subject && !!result.email_body;
  const canSend = SENDING_TYPES.includes(opts.type) && !!to && hasMessage;
  let sent = false;
  let draft: { to: string; subject: string; body: string } | undefined;

  if (canSend) {
    if (result.needs_approval) {
      draft = { to: to!, subject: result.email_subject!, body: result.email_body! };
      result.detail = result.detail || `Drafted a message to ${to} — awaiting your approval.`;
    } else {
      const res = await sendEmail({ to: to!, subject: result.email_subject!, body: result.email_body! });
      sent = res.sent;
      result.detail = res.sent ? `Sent to ${to}.` : result.detail || `Could not send: ${res.reason}`;
      if (!res.sent) result.tone = "warn";
    }
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
      payload: draft ? { email: draft, sent: false } : { sent },
    })
    .select("id")
    .single();

  if (error) console.error("[agents] activity insert failed:", error.message);
  return { result, activityId: data?.id ?? null, sent };
}
