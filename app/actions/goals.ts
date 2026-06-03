"use server";

import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { revalidatePath } from "next/cache";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function generateAIGoals() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const [{ data: salesRecords }, { data: insights }] = await Promise.all([
    supabase.from("sales_records").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(200),
    supabase.from("insights").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
  ]);

  if (!salesRecords?.length && !insights?.length) {
    throw new Error("No data found. Upload a CSV first to get AI goal recommendations.");
  }

  const totalKnocked = salesRecords?.reduce((s, r) => s + (r.knocked || 0), 0) || 0;
  const totalClosed = salesRecords?.reduce((s, r) => s + (r.closed || 0), 0) || 0;
  const totalRevenue = salesRecords?.reduce((s, r) => s + (r.deal_value || 0), 0) || 0;
  const closeRate = totalKnocked > 0 ? ((totalClosed / totalKnocked) * 100).toFixed(1) : "0";
  const avgDeal = totalClosed > 0 ? (totalRevenue / totalClosed).toFixed(0) : "0";

  const repMap: Record<string, { knocked: number; closed: number }> = {};
  salesRecords?.forEach(r => {
    const rep = r.rep_name || "Unknown";
    if (!repMap[rep]) repMap[rep] = { knocked: 0, closed: 0 };
    repMap[rep].knocked += r.knocked || 0;
    repMap[rep].closed += r.closed || 0;
  });

  const repSummary = Object.entries(repMap).map(([name, data]) => {
    const rate = data.knocked > 0 ? ((data.closed / data.knocked) * 100).toFixed(1) : "0";
    return `${name}: ${data.knocked} knocks, ${data.closed} closes, ${rate}% close rate`;
  }).join("\n");

  const insightSummary = insights?.map(i => `[${i.priority}] ${i.title}: ${i.body}`).join("\n") || "No insights yet";

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 2000,
    system: `You are RepWise, an AI sales coach. Based on sales data and insights, generate 5-6 specific, measurable, achievable goals for this sales team. Return ONLY a JSON array. Each goal object has: title (short, action-oriented, under 8 words), description (1 sentence explaining why this goal matters based on their data), target_value (a number), unit (e.g. "%" or "closes/week" or "doors/day" or "$"), ai_reasoning (1-2 sentences explaining what in their data led to this recommendation), checklist_items (array of 3-4 specific action strings the rep should do to achieve this goal). No preamble, no markdown, just the raw JSON array.`,
    messages: [{
      role: "user",
      content: `Generate goals based on this data:\n\nOVERALL METRICS:\nTotal knocks: ${totalKnocked}\nTotal closes: ${totalClosed}\nClose rate: ${closeRate}%\nAvg deal value: $${avgDeal}\n\nREP BREAKDOWN:\n${repSummary}\n\nLATEST INSIGHTS:\n${insightSummary}`,
    }],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const goals = JSON.parse(cleaned);

  const { data: existingAIGoals } = await supabase
    .from("goals")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_ai_generated", true)
    .eq("status", "active");

  if (existingAIGoals?.length) {
    await supabase.from("goals").delete().in("id", existingAIGoals.map(g => g.id));
  }

  for (const goal of goals) {
    const { data: newGoal } = await supabase
      .from("goals")
      .insert({
        user_id: user.id,
        title: goal.title,
        description: goal.description,
        target_value: goal.target_value,
        current_value: 0,
        unit: goal.unit,
        is_ai_generated: true,
        ai_reasoning: goal.ai_reasoning,
        status: "active",
      })
      .select()
      .single();

    if (newGoal && goal.checklist_items?.length) {
      await supabase.from("goal_checklist_items").insert(
        goal.checklist_items.map((item: string) => ({
          goal_id: newGoal.id,
          title: item,
          completed: false,
        }))
      );
    }
  }

  revalidatePath("/goals");
}

export async function createCustomGoal(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const target_value = parseFloat(formData.get("target_value") as string);
  const unit = formData.get("unit") as string;

  if (!title?.trim()) throw new Error("Title is required");

  await supabase.from("goals").insert({
    user_id: user.id,
    title: title.trim(),
    description: description?.trim() || null,
    target_value: isNaN(target_value) ? null : target_value,
    current_value: 0,
    unit: unit?.trim() || null,
    is_ai_generated: false,
    status: "active",
  });

  revalidatePath("/goals");
}

export async function updateGoalProgress(goalId: string, currentValue: number) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase
    .from("goals")
    .update({ current_value: currentValue })
    .eq("id", goalId)
    .eq("user_id", user.id);

  revalidatePath("/goals");
}

export async function completeGoal(goalId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase
    .from("goals")
    .update({ status: "completed" })
    .eq("id", goalId)
    .eq("user_id", user.id);

  revalidatePath("/goals");
}

export async function dismissGoal(goalId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase
    .from("goals")
    .update({ status: "dismissed" })
    .eq("id", goalId)
    .eq("user_id", user.id);

  revalidatePath("/goals");
}

export async function toggleChecklistItem(itemId: string, completed: boolean) {
  const supabase = createClient();
  await supabase
    .from("goal_checklist_items")
    .update({ completed })
    .eq("id", itemId);

  revalidatePath("/goals");
}
