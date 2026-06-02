"use server";

import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { redirect } from "next/navigation";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

async function fetchHubSpotData(accessToken: string) {
  const headers = { Authorization: `Bearer ${accessToken}` };

  const [dealsRes, contactsRes] = await Promise.all([
    fetch("https://api.hubapi.com/crm/v3/objects/deals?limit=100&properties=dealname,amount,dealstage,closedate,hs_deal_stage_probability,pipeline", { headers }),
    fetch("https://api.hubapi.com/crm/v3/objects/contacts?limit=100&properties=firstname,lastname,email,phone,hs_lead_status,lifecyclestage", { headers }),
  ]);

  const deals = await dealsRes.json();
  const contacts = await contactsRes.json();

  const dealList = deals.results || [];
  const contactList = contacts.results || [];

  const totalDeals = dealList.length;
  const closedWon = dealList.filter((d: Record<string, Record<string, string>>) => d.properties?.dealstage === "closedwon").length;
  const closedLost = dealList.filter((d: Record<string, Record<string, string>>) => d.properties?.dealstage === "closedlost").length;
  const totalValue = dealList.reduce((sum: number, d: Record<string, Record<string, string>>) => sum + (parseFloat(d.properties?.amount) || 0), 0);
  const avgDeal = closedWon > 0 ? (totalValue / closedWon).toFixed(0) : "0";
  const closeRate = totalDeals > 0 ? ((closedWon / totalDeals) * 100).toFixed(1) : "0";

  const stageMap: Record<string, number> = {};
  dealList.forEach((d: Record<string, Record<string, string>>) => {
    const stage = d.properties?.dealstage || "unknown";
    stageMap[stage] = (stageMap[stage] || 0) + 1;
  });

  const stageSummary = Object.entries(stageMap)
    .map(([stage, count]) => `  - ${stage}: ${count} deals`)
    .join("\n");

  return `
HUBSPOT CRM DATA SUMMARY
========================
Total deals: ${totalDeals}
Closed won: ${closedWon}
Closed lost: ${closedLost}
Close rate: ${closeRate}%
Total pipeline value: $${totalValue.toLocaleString()}
Average deal value: $${avgDeal}
Total contacts: ${contactList.length}

DEAL STAGES
-----------
${stageSummary}
`.trim();
}

async function fetchSalesforceData(accessToken: string) {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  const instanceUrl = "https://login.salesforce.com";

  const [oppsRes, activitiesRes] = await Promise.all([
    fetch(`${instanceUrl}/services/data/v58.0/query?q=SELECT+Id,Name,Amount,StageName,CloseDate,Probability,OwnerId+FROM+Opportunity+LIMIT+100`, { headers }),
    fetch(`${instanceUrl}/services/data/v58.0/query?q=SELECT+Id,Subject,Status,ActivityDate,OwnerId+FROM+Task+LIMIT+100`, { headers }),
  ]);

  const opps = await oppsRes.json();
  const activities = await activitiesRes.json();

  const oppList = opps.records || [];
  const actList = activities.records || [];

  const closedWon = oppList.filter((o: Record<string, string>) => o.StageName === "Closed Won").length;
  const closedLost = oppList.filter((o: Record<string, string>) => o.StageName === "Closed Lost").length;
  const totalValue = oppList.reduce((sum: number, o: Record<string, string>) => sum + (parseFloat(o.Amount) || 0), 0);
  const closeRate = oppList.length > 0 ? ((closedWon / oppList.length) * 100).toFixed(1) : "0";

  const stageMap: Record<string, number> = {};
  oppList.forEach((o: Record<string, string>) => {
    stageMap[o.StageName] = (stageMap[o.StageName] || 0) + 1;
  });

  const stageSummary = Object.entries(stageMap)
    .map(([stage, count]) => `  - ${stage}: ${count} opportunities`)
    .join("\n");

  return `
SALESFORCE CRM DATA SUMMARY
============================
Total opportunities: ${oppList.length}
Closed won: ${closedWon}
Closed lost: ${closedLost}
Close rate: ${closeRate}%
Total pipeline value: $${totalValue.toLocaleString()}
Total activities: ${actList.length}

OPPORTUNITY STAGES
------------------
${stageSummary}
`.trim();
}

async function fetchPipedriveData(accessToken: string) {
  const headers = { Authorization: `Bearer ${accessToken}` };

  const [dealsRes, activitiesRes] = await Promise.all([
    fetch("https://api.pipedrive.com/v1/deals?limit=100&status=all_not_deleted", { headers }),
    fetch("https://api.pipedrive.com/v1/activities?limit=100", { headers }),
  ]);

  const deals = await dealsRes.json();
  const activities = await activitiesRes.json();

  const dealList = deals.data || [];
  const actList = activities.data || [];

  const won = dealList.filter((d: Record<string, string>) => d.status === "won").length;
  const lost = dealList.filter((d: Record<string, string>) => d.status === "lost").length;
  const open = dealList.filter((d: Record<string, string>) => d.status === "open").length;
  const totalValue = dealList.filter((d: Record<string, string>) => d.status === "won")
    .reduce((sum: number, d: Record<string, string>) => sum + (parseFloat(d.value) || 0), 0);
  const closeRate = dealList.length > 0 ? ((won / dealList.length) * 100).toFixed(1) : "0";

  const stageMap: Record<string, number> = {};
  dealList.forEach((d: Record<string, Record<string, string>>) => {
    const stage = d.stage_id?.toString() || "unknown";
    stageMap[stage] = (stageMap[stage] || 0) + 1;
  });

  const actTypeMap: Record<string, number> = {};
  actList.forEach((a: Record<string, string>) => {
    const type = a.type || "unknown";
    actTypeMap[type] = (actTypeMap[type] || 0) + 1;
  });

  const actSummary = Object.entries(actTypeMap)
    .map(([type, count]) => `  - ${type}: ${count}`)
    .join("\n");

  return `
PIPEDRIVE CRM DATA SUMMARY
===========================
Total deals: ${dealList.length}
Won: ${won}
Lost: ${lost}
Open: ${open}
Close rate: ${closeRate}%
Total won value: $${totalValue.toLocaleString()}
Total activities: ${actList.length}

ACTIVITY TYPES
--------------
${actSummary}
`.trim();
}

export async function syncCRM(provider: "hubspot" | "salesforce" | "pipedrive") {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: connection } = await supabase
    .from("crm_connections")
    .select("*")
    .eq("user_id", user.id)
    .eq("provider", provider)
    .single();

  if (!connection) throw new Error(`No ${provider} connection found`);

  const { data: upload } = await supabase
    .from("uploads")
    .insert({
      user_id: user.id,
      file_name: `${provider}_sync_${new Date().toISOString().split("T")[0]}.json`,
      file_path: null,
      status: "processing",
    })
    .select()
    .single();

  if (!upload) throw new Error("Failed to create upload record");

  let summary = "";

  if (provider === "hubspot") {
    summary = await fetchHubSpotData(connection.access_token);
  } else if (provider === "salesforce") {
    summary = await fetchSalesforceData(connection.access_token);
  } else if (provider === "pipedrive") {
    summary = await fetchPipedriveData(connection.access_token);
  }

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    system: `You are RepWise, an AI sales analyst. Analyze this CRM data and return ONLY a JSON array of 8 to 10 insight objects. Each object has: priority (critical or opportunity or pattern), category (a short 1-3 word label), title (under 10 words, specific and punchy), body (2 sentences with specific numbers from the data), metric (the key stat as a short string). No preamble, no markdown, no code blocks, just the raw JSON array.`,
    messages: [{ role: "user", content: `Analyze this CRM data and return 8-10 insights:\n\n${summary}` }],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const insights = JSON.parse(cleaned);

  const insightRows = insights.map((insight: Record<string, string>) => ({
    upload_id: upload.id,
    user_id: user.id,
    priority: ["critical", "opportunity", "pattern"].includes(insight.priority) ? insight.priority : "pattern",
    category: insight.category || "General",
    title: insight.title,
    body: insight.body,
    metric: insight.metric || null,
    is_dismissed: false,
  }));

  await supabase.from("insights").insert(insightRows);
  await supabase.from("uploads").update({ status: "complete" }).eq("id", upload.id);

  redirect("/dashboard");
}
