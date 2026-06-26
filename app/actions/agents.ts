"use server";

// Meridian agent stack — server actions used by the dashboard.

import { createClient } from "@/lib/supabase/server";
import { runAgent } from "@/lib/agents/runner";
import type { AgentType } from "@/lib/agents/types";

export async function getAgents() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("agents")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });
  return data || [];
}

export async function listActivity(limit = 50) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("agent_activity")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data || [];
}

export async function setAgentStatus(agentId: string, status: "active" | "paused") {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized" };
  const { error } = await supabase
    .from("agents")
    .update({ status })
    .eq("id", agentId)
    .eq("user_id", user.id);
  return { error: error?.message ?? null };
}

export async function resolveActivity(activityId: string, decision: "approved" | "skipped") {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized" };
  const { error } = await supabase
    .from("agent_activity")
    .update({ status: decision, needs_approval: false })
    .eq("id", activityId)
    .eq("user_id", user.id);
  return { error: error?.message ?? null };
}

// Manually fire an agent (handy for testing from a button or the console).
export async function triggerAgent(type: AgentType, payload: Record<string, any> = {}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized" };
  const { data: agent } = await supabase
    .from("agents")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("type", type)
    .maybeSingle();
  if (agent?.status === "paused") return { error: "agent is paused" };
  await runAgent({ userId: user.id, agentId: agent?.id ?? null, type, payload });
  return { error: null };
}
