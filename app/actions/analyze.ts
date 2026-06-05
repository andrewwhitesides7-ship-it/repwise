"use server";

import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import Papa from "papaparse";
import { redirect } from "next/navigation";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

function normalizeKey(key: string): string {
  return key.toLowerCase().trim().replace(/[\s\-\/\\().]+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
}

function findColumn(row: Record<string, string>, candidates: string[]): string {
  const keys = Object.keys(row);
  for (const candidate of candidates) {
    const match = keys.find(k => normalizeKey(k) === candidate || normalizeKey(k).includes(candidate));
    if (match) return row[match] || "";
  }
  return "";
}

function parseNum(val: string): number {
  if (!val) return 0;
  const cleaned = String(val).replace(/[$,\s%]/g, "").trim();
  return parseFloat(cleaned) || 0;
}

function parseDate(val: string): Date | null {
  if (!val) return null;
  const formats = [
    val,
    val.replace(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/, "$3-$1-$2"),
    val.replace(/(\d{1,2})-(\d{1,2})-(\d{2,4})/, "$3-$1-$2"),
  ];
  for (const f of formats) {
    const d = new Date(f);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function buildSummary(rows: Record<string, string>[]): string {
  if (!rows.length) return "No data found.";

  const columns = Object.keys(rows[0]);
  const totalRows = rows.length;

  const totalKnocked = rows.reduce((s, r) => s + parseNum(findColumn(r, ["knocked", "knocks", "doors_knocked", "doors", "visits", "attempts"])), 0);
  const totalContacted = rows.reduce((s, r) => s + parseNum(findColumn(r, ["contacted", "contacts", "contact", "reached", "answered"])), 0);
  const totalPitched = rows.reduce((s, r) => s + parseNum(findColumn(r, ["pitched", "pitches", "presented", "demos"])), 0);
  const totalClosed = rows.reduce((s, r) => s + parseNum(findColumn(r, ["closed", "closes", "sales", "sold", "won", "deals_closed", "converted"])), 0);
  const totalValue = rows.reduce((s, r) => s + parseNum(findColumn(r, ["deal_value", "value", "revenue", "amount", "price", "sale_value", "contract_value"])), 0);

  const closeRate = totalKnocked > 0 ? ((totalClosed / totalKnocked) * 100).toFixed(1) : "0";
  const contactRate = totalKnocked > 0 ? ((totalContacted / totalKnocked) * 100).toFixed(1) : "0";

  const followUps = rows.filter(r => {
    const val = findColumn(r, ["follow_up", "followup", "follow_up_scheduled", "callback", "callbacks"]).toLowerCase();
    return val === "1" || val === "true" || val === "yes" || val === "y";
  }).length;

  const repMap: Record<string, { knocked: number; closed: number; value: number; rows: number }> = {};
  rows.forEach(r => {
    const rep = findColumn(r, ["rep_name", "rep", "salesperson", "agent", "name", "employee", "sales_rep", "representative"]) || "Unknown";
    if (!repMap[rep]) repMap[rep] = { knocked: 0, closed: 0, value: 0, rows: 0 };
    repMap[rep].knocked += parseNum(findColumn(r, ["knocked", "knocks", "doors_knocked", "doors", "visits", "attempts"]));
    repMap[rep].closed += parseNum(findColumn(r, ["closed", "closes", "sales", "sold", "won", "deals_closed"]));
    repMap[rep].value += parseNum(findColumn(r, ["deal_value", "value", "revenue", "amount", "price"]));
    repMap[rep].rows++;
  });

  const repSummary = Object.entries(repMap)
    .sort((a, b) => b[1].closed - a[1].closed)
    .map(([name, data]) => {
      const rate = data.knocked > 0 ? ((data.closed / data.knocked) * 100).toFixed(1) : "0";
      const avgDeal = data.closed > 0 ? (data.value / data.closed).toFixed(0) : "0";
      return `  - ${name}: ${data.knocked} knocks, ${data.closed} closes, ${rate}% close rate, $${avgDeal} avg deal`;
    }).join("\n");

  const timeMap: Record<string, { knocked: number; closed: number }> = {};
  rows.forEach(r => {
    const timeVal = findColumn(r, ["time_of_day", "time", "hour", "knock_time", "visit_time", "start_time"]);
    if (!timeVal) return;
    const cleaned = timeVal.trim().toLowerCase();
    let hour = -1;
    if (cleaned.includes(":")) {
      hour = parseInt(cleaned.split(":")[0]);
      if (cleaned.includes("pm") && hour < 12) hour += 12;
      if (cleaned.includes("am") && hour === 12) hour = 0;
    } else if (/^\d+$/.test(cleaned)) {
      hour = parseInt(cleaned);
    }
    if (hour < 0) return;
    let slot = "Unknown";
    if (hour >= 8 && hour < 12) slot = "Morning (8am-12pm)";
    else if (hour >= 12 && hour < 15) slot = "Early Afternoon (12pm-3pm)";
    else if (hour >= 15 && hour < 18) slot = "Late Afternoon (3pm-6pm)";
    else if (hour >= 18) slot = "Evening (6pm+)";
    else if (hour < 8) slot = "Early Morning (before 8am)";
    if (!timeMap[slot]) timeMap[slot] = { knocked: 0, closed: 0 };
    timeMap[slot].knocked += parseNum(findColumn(r, ["knocked", "knocks", "doors_knocked", "doors", "visits"]));
    timeMap[slot].closed += parseNum(findColumn(r, ["closed", "closes", "sales", "sold", "won"]));
  });

  const timeSummary = Object.entries(timeMap).map(([slot, data]) => {
    const rate = data.knocked > 0 ? ((data.closed / data.knocked) * 100).toFixed(1) : "0";
    return `  - ${slot}: ${data.knocked} knocks, ${data.closed} closes, ${rate}% close rate`;
  }).join("\n");

  const dayMap: Record<string, { knocked: number; closed: number }> = {};
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  rows.forEach(r => {
    const dateVal = findColumn(r, ["date", "visit_date", "knock_date", "activity_date", "day"]);
    if (!dateVal) return;
    const d = parseDate(dateVal);
    if (!d) return;
    const day = dayNames[d.getDay()] || "Unknown";
    if (!dayMap[day]) dayMap[day] = { knocked: 0, closed: 0 };
    dayMap[day].knocked += parseNum(findColumn(r, ["knocked", "knocks", "doors_knocked", "doors", "visits"]));
    dayMap[day].closed += parseNum(findColumn(r, ["closed", "closes", "sales", "sold", "won"]));
  });

  const daySummary = Object.entries(dayMap).map(([day, data]) => {
    const rate = data.knocked > 0 ? ((data.closed / data.knocked) * 100).toFixed(1) : "0";
    return `  - ${day}: ${data.knocked} knocks, ${data.closed} closes, ${rate}% close rate`;
  }).join("\n");

  const zipMap: Record<string, { knocked: number; closed: number }> = {};
  rows.forEach(r => {
    const zip = findColumn(r, ["zip", "zipcode", "zip_code", "postal_code", "territory", "area", "region"]);
    if (!zip) return;
    if (!zipMap[zip]) zipMap[zip] = { knocked: 0, closed: 0 };
    zipMap[zip].knocked += parseNum(findColumn(r, ["knocked", "knocks", "doors_knocked", "doors", "visits"])) || 1;
    zipMap[zip].closed += parseNum(findColumn(r, ["closed", "closes", "sales", "sold", "won"]));
  });

  const topZips = Object.entries(zipMap)
    .sort((a, b) => (b[1].closed / (b[1].knocked || 1)) - (a[1].closed / (a[1].knocked || 1)))
    .slice(0, 5)
    .map(([zip, data]) => {
      const rate = data.knocked > 0 ? ((data.closed / data.knocked) * 100).toFixed(1) : "0";
      return `  - ${zip}: ${data.knocked} knocks, ${data.closed} closes, ${rate}% close rate`;
    }).join("\n");

  const dateVals = rows.map(r => findColumn(r, ["date", "visit_date", "knock_date", "activity_date"])).filter(Boolean);
  const dateRange = dateVals.length > 0 ? `${dateVals[0]} to ${dateVals[dateVals.length - 1]}` : "N/A";

  return `
SALES DATA SUMMARY
==================
Total rows: ${totalRows}
Columns detected: ${columns.join(", ")}
Date range: ${dateRange}

OVERALL METRICS
---------------
Total knocks/visits: ${totalKnocked || totalRows}
Total contacts: ${totalContacted}
Total pitches: ${totalPitched}
Total closes: ${totalClosed}
Overall close rate: ${closeRate}%
Contact rate: ${contactRate}%
Total revenue: $${totalValue.toLocaleString()}
Average deal value: $${totalClosed > 0 ? (totalValue / totalClosed).toFixed(0) : 0}
Follow-ups scheduled: ${followUps}

REP BREAKDOWN
-------------
${repSummary || "No rep data detected"}

TIME OF DAY BREAKDOWN
---------------------
${timeSummary || "No time data detected"}

DAY OF WEEK BREAKDOWN
---------------------
${daySummary || "No date data detected"}

TOP TERRITORIES/ZIPS BY CLOSE RATE
------------------------------------
${topZips || "No territory data detected"}
`.trim();
}

export async function analyzeUpload(uploadId: string, fileContent: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("users")
    .select("plan, business_type, main_challenge, team_size")
    .eq("id", user.id)
    .single();

  if (profile?.plan === "free") {
    const { count: uploadCount } = await supabase
      .from("uploads")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "complete");

    if ((uploadCount || 0) >= 1) {
      await supabase
        .from("uploads")
        .update({ status: "failed", error_message: "Free limit reached" })
        .eq("id", uploadId);
      redirect("/billing?limit=uploads");
    }
  }

  await supabase.from("uploads").update({ status: "processing" }).eq("id", uploadId);

  try {
    const parsed = Papa.parse<Record<string, string>>(fileContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
    });

    const rows = parsed.data;
    const rowCount = rows.length;

    if (rowCount === 0) {
      await supabase
        .from("uploads")
        .update({ status: "failed", error_message: "No data rows found in CSV" })
        .eq("id", uploadId);
      throw new Error("CSV has no data rows");
    }

    await supabase.from("uploads").update({ row_count: rowCount }).eq("id", uploadId);

    const salesRecords = rows.map(r => {
      const get = (candidates: string[]) => findColumn(r, candidates);
      return {
        upload_id: uploadId,
        user_id: user.id,
        rep_name: get(["rep_name", "rep", "salesperson", "agent", "name", "employee", "sales_rep"]) || null,
        date: get(["date", "visit_date", "knock_date", "activity_date"]) || null,
        time_of_day: get(["time_of_day", "time", "hour", "knock_time", "visit_time"]) || null,
        address: get(["address", "street", "location"]) || null,
        city: get(["city", "town"]) || null,
        state: get(["state", "province"]) || null,
        zip: get(["zip", "zipcode", "zip_code", "postal_code", "territory"]) || null,
        knocked: Math.round(parseNum(get(["knocked", "knocks", "doors_knocked", "doors", "visits", "attempts"]))) || 1,
        contacted: Math.round(parseNum(get(["contacted", "contacts", "contact", "reached"]))) || 0,
        pitched: Math.round(parseNum(get(["pitched", "pitches", "presented", "demos"]))) || 0,
        closed: Math.round(parseNum(get(["closed", "closes", "sales", "sold", "won", "deals_closed"]))) || 0,
        deal_value: parseNum(get(["deal_value", "value", "revenue", "amount", "price", "sale_value"])) || 0,
        product: get(["product", "service", "package", "plan_type"]) || null,
        follow_up_scheduled: ["1", "true", "yes", "y"].includes(
          get(["follow_up", "followup", "follow_up_scheduled", "callback"]).toLowerCase()
        ),
        notes: get(["notes", "comments", "remarks"]) || null,
      };
    });

    if (salesRecords.length > 0) {
      await supabase.from("sales_records").insert(salesRecords);
    }

    const summary = buildSummary(rows);

    const businessType = profile?.business_type || "field sales";
    const mainChallenge = profile?.main_challenge || "improving close rates";
    const teamSize = profile?.team_size || "unknown";

    const industryContext: Record<string, string> = {
  solar: "Solar sales teams typically struggle with roof assessments, utility bill objections, financing conversations, and seasonal territory patterns. Key metrics are cost per watt, system size, and install-to-close time.",
  pest: "Pest control teams focus on recurring service plans vs one-time treatments. Key metrics are service agreement rate, seasonal infestation patterns by ZIP, and upsell rate to annual plans.",
  security: "Home security teams deal with renter vs owner objections, equipment cost resistance, and monitoring contract length. Key metrics are equipment package size, monitoring ARR, and referral rate from installs.",
  telecom: "Telecom door-to-door teams compete with existing providers. Key metrics are switch rate, bundle attach rate, and churn prediction by neighborhood demographics.",
  roofing: "Roofing teams are heavily weather and season dependent. Key metrics are storm chaser timing, insurance claim conversion, material upsell rate, and referral rate from completed jobs.",
  insurance: "Insurance field teams face trust and complexity objections. Key metrics are policy bundle rate, referral conversion, follow-up close rate, and policy value per household.",
  saas: "Field SaaS sales teams focus on decision maker access, trial conversion, and expansion revenue. Key metrics are demo-to-close rate, contract size, and time to first value.",
  other: "Focus on territory efficiency, rep consistency, and follow-up conversion as universal sales metrics.",
};

const challengeContext: Record<string, string> = {
  close_rate: "Pay special attention to close rate patterns by time, rep, and territory. Identify the highest and lowest performing segments and what differentiates them.",
  follow_ups: "Focus heavily on follow-up data. Flag any warm leads that were not followed up on and estimate revenue impact. Identify patterns in when follow-ups convert.",
  territory: "Analyze territory data deeply. Find ZIP codes or areas that are underworked relative to their conversion rate. Identify territory overlap or gaps.",
  rep_performance: "Benchmark every rep against each other and against team average. Identify skill gaps, coaching opportunities, and reps at risk of burning out.",
  data_visibility: "Focus on surfacing patterns the manager cannot see without data — time of day, day of week, territory, and rep benchmarking insights.",
  time_of_day: "Do a deep analysis of time-of-day and day-of-week patterns. Find peak conversion windows and identify time being wasted in low-conversion periods.",
};

const industryDetail = industryContext[businessType] || industryContext.other;
const challengeDetail = challengeContext[mainChallenge] || "";

const businessContext = profile?.business_type
  ? `BUSINESS CONTEXT:
Industry: ${businessType} sales (${teamSize} reps)
Industry specifics: ${industryDetail}
Primary challenge: ${mainChallenge} — ${challengeDetail}
Tailor every insight to this specific industry and challenge. Use industry-specific terminology and benchmarks.`
  : "";

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 3000,
      system: `You are RepWise, an expert AI sales analyst for field sales and door-to-door teams. ${businessContext}

Analyze the sales data summary and generate 8-10 specific, actionable insights. Even if data is incomplete or columns are missing, find patterns and generate useful insights based on whatever data is available.

Rules:
- Always generate insights even with partial data
- Use specific numbers from the data
- Focus on actionable recommendations
- If a metric is 0 it might mean the column was missing — work with what you have
- Prioritize insights that could directly increase close rates or revenue

Return ONLY a raw JSON array. No preamble, no markdown, no code blocks.
Each insight object: { priority: "critical"|"opportunity"|"pattern", category: string, title: string, body: string, metric: string }

priority definitions:
- critical: something costing deals RIGHT NOW that needs immediate action
- opportunity: untapped potential that could increase revenue
- pattern: trend worth knowing and tracking`,

      messages: [{
        role: "user",
        content: `Analyze this sales data and return 8-10 insights as a JSON array:\n\n${summary}`,
      }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    let insights: Array<{ priority: string; category: string; title: string; body: string; metric: string }> = [];

    try {
      const cleaned = raw.replace(/```json|```/g, "").trim();
      insights = JSON.parse(cleaned);
    } catch {
      throw new Error("Failed to parse AI response");
    }

    await supabase
      .from("insights")
      .update({ is_dismissed: true })
      .eq("user_id", user.id)
      .neq("upload_id", uploadId);

    const insightRows = insights.slice(0, 10).map(insight => ({
      upload_id: uploadId,
      user_id: user.id,
      priority: ["critical", "opportunity", "pattern"].includes(insight.priority) ? insight.priority : "pattern",
      category: insight.category || "General",
      title: insight.title,
      body: insight.body,
      metric: insight.metric || null,
      is_dismissed: false,
    }));

    await supabase.from("insights").insert(insightRows);
    await supabase
      .from("uploads")
      .update({ status: "complete", row_count: rowCount })
      .eq("id", uploadId);

  } catch (err) {
    await supabase
      .from("uploads")
      .update({ status: "failed", error_message: String(err) })
      .eq("id", uploadId);
    throw err;
  }

  redirect("/dashboard");
}
