// Meridian agent stack — DEFAULT TRIGGER (on-demand / webhook).
//
// POST /api/agents/lead_response
//   body: { "userId": "...", "secret": "...", "payload": { ...event fields... } }
//
// This is the swappable trigger layer. Point your lead source / form / phone
// system / Zapier at it. To run agents on a schedule instead, delete this file
// and call runAgent() from a cron route or queue worker — lib/agents stays the same.

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { runAgent } from "@/lib/agents/runner";
import { getModule } from "@/lib/agents/registry";
import type { AgentType } from "@/lib/agents/types";

export async function POST(req: NextRequest, { params }: { params: { agent: string } }) {
  const type = params.agent as AgentType;
  if (!getModule(type)) {
    return NextResponse.json({ error: `unknown agent: ${type}` }, { status: 404 });
  }

  const body = await req.json().catch(() => ({} as any));

  // Shared-secret check. Set AGENT_WEBHOOK_SECRET in your env and send it in the body.
  // Replace with per-source auth (signature verification, etc.) when you wire real sources.
  if (!process.env.AGENT_WEBHOOK_SECRET || body.secret !== process.env.AGENT_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!body.userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: agent } = await supabase
    .from("agents")
    .select("id, status")
    .eq("user_id", body.userId)
    .eq("type", type)
    .maybeSingle();

  if (agent?.status === "paused") {
    return NextResponse.json({ ok: true, skipped: "agent paused" });
  }

  const { result } = await runAgent({
    userId: body.userId,
    agentId: agent?.id ?? null,
    type,
    payload: body.payload || {},
  });

  return NextResponse.json({ ok: true, result });
}
