"use server";

import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { redirect } from "next/navigation";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

async function refreshHubSpotToken(refreshToken: string) {
  const response = await fetch("https://api.hubapi.com/oauth/v1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.HUBSPOT_CLIENT_ID!,
      client_secret: process.env.HUBSPOT_CLIENT_SECRET!,
      refresh_token: refreshToken,
    }),
  });
  return response.json();
}

async function fetchHubSpotData(accessToken: string) {
  const headers = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };

  const [dealsRes, contactsRes] = await Promise.all([
    fetch("https://api.hubapi.com/crm/v3/objects/deals?limit=100&properties=dealname,amount,dealstage,closedate,hs_deal_stage_probability,hubspot_owner_id", { headers }),
    fetch("https://api.hubapi.com/crm/v3/objects/contacts?limit=100&properties=firstname,lastname,email,hs_lead_status,lastmodifieddate,hubspot_owner_id", { headers }),
  ]);

  const deals = dealsRes.ok ? await dealsRes.json() : { results: [] };
  const contacts = contactsRes.ok ? await contactsRes.json() : { results: [] };

  return { deals: deals.results || [], contacts: contacts.results || [] };
}

export async function syncCRM(provider: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: connection } = await supabase
    .from("crm_connections")
    .select("*")
    .eq("user_id", user.id)
    .eq("provider", provider)
    .single();

  if (!connection) throw new Error("CRM not connected");

  let accessToken = connection.access_token;

  const isExpired = connection.expires_at && new Date(connection.expires_at) < new Date();
  if (isExpired && connection.refresh_token) {
    const newTokens = await refreshHubSpotToken(connection.refresh_token);
    if (newTokens.access_token) {
      accessToken = newTokens.access_token;
      await supabase.from("crm_connections").update({
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token || connection.refresh_token,
        expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
      }).eq("id", connection.id);
    }
  }

  let data;
  if (provider === "hubspot") {
    data = await fetchHubSpotData(accessToken);
  } else {
    throw new Error(`Provider ${provider} not yet supported`);
  }

  const totalDeals = data.deals.length;
  const closedDeals = data.deals.filter((d: any) => d.properties?.dealstage === "closedwon").length;
  const totalValue = data.deals.reduce((sum: number, d: any) => sum + (parseFloat(d.properties?.amount) || 0), 0);
  const avgDeal = closedDeals > 0 ? (totalValue / closedDeals).toFixed(0) : "0";

  const stageMap: Record<string, number> = {};
  data.deals.forEach((d: any) => {
    const stage = d.properties?.dealstage || "unknown";
    stageMap[stage] = (stageMap[stage] || 0) + 1;
  });
  const stageSummary = Object.entries(stageMap)
    .map(([stage, count]) => `${stage}: ${count} deals`)
    .join("\n");

  const summary = `
HUBSPOT CRM DATA SUMMARY
------------------------
Total deals: ${totalDeals}
Closed won: ${closedDeals}
Total pipeline value: $${totalValue.toLocaleString()}
Average deal value: $${avgDeal}
Total contacts: ${data.contacts.length}

DEAL STAGES:
${stageSummary}
  `.trim();

  const { data: upload } = await supabase
    .from("uploads")
    .insert({
      user_id: user.id,
      file_name: `HubSpot Sync - ${new Date().toLocaleDateString()}`,
      status: "processing",
    })
    .select()
    .single();

  // Archive all previous insights before generating new ones
  await supabase
    .from("insights")
    .update({ is_dismissed: true })
    .eq("user_id", user.id)
    .eq("is_dismissed", false);

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 3000,
    system: `You are RepWise, an AI sales intelligence engine. Analyze this CRM data and generate 8-10 specific, actionable insights. Return ONLY a JSON array with exactly 8-10 items. Each insight object: { priority: "critical"|"opportunity"|"pattern", category: string, title: string (under 10 words, action-oriented), body: string (2-3 sentences with specific numbers from the data), metric: string (key number or stat) }. No preamble, no markdown, just raw JSON array.`,
    messages: [{
      role: "user",
      content: `Analyze this HubSpot CRM data and generate exactly 8-10 insights:\n\n${summary}`,
    }],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "[]";
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const insights = JSON.parse(cleaned);

  if (upload) {
    await supabase
      .from("uploads")
      .update({ status: "complete" })
      .eq("id", upload.id);

    for (const insight of insights.slice(0, 10)) {
      await supabase.from("insights").insert({
        user_id: user.id,
        upload_id: upload.id,
        priority: insight.priority,
        category: insight.category,
        title: insight.title,
        body: insight.body,
        metric: insight.metric,
        is_dismissed: false,
      });
    }
  }

  redirect("/dashboard");
}
