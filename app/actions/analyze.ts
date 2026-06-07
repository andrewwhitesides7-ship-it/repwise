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
  return parseFloat(String(val).replace(/[$,\s%]/g, "").trim()) || 0;
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
  const get = (row: Record<string, string>, candidates: string[]) => findColumn(row, candidates);

  const repMetrics: Record<string, { contacts: number; closes: number; revenue: number }> = {};
  const customerTypeMetrics: Record<string, { contacts: number; closes: number; revenue: number }> = {};
  const responseTimeMetrics: Record<string, { contacts: number; closes: number }> = {};
  const contactMethodMetrics: Record<string, { contacts: number; closes: number }> = {};
  const timeMap: Record<string, { knocked: number; closed: number }> = {};
  const dayMap: Record<string, { knocked: number; closed: number }> = {};
  const zipMap: Record<string, { knocked: number; closed: number }> = {};

  let totalRevenue = 0;
  let totalCloses = 0;
  let unfollowedLeads = 0;

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  rows.forEach(r => {
    const repName = get(r, ["rep_name", "rep", "salesperson", "agent", "name", "employee", "sales_rep", "assigned_rep"]) || "Unknown";
    const outcome = String(get(r, ["outcome", "result", "status", "disposition"]) || "").toLowerCase();
    const dealAmount = parseNum(get(r, ["deal_amount", "deal_value", "revenue", "amount", "price", "value", "sale_value", "contract_value"]));
    const followupDone = ["yes", "y", "1", "true"].includes(
      String(get(r, ["followup_done", "follow_up_completed", "followup", "follow_up", "follow_up_scheduled", "callback"]) || "").toLowerCase()
    );
    const responseTime = String(get(r, ["response_time", "response_time_days", "response"]) || "");
    const customerType = get(r, ["customer_type", "type", "customer"]) || "Unknown";
    const contactMethod = get(r, ["contact_method", "method", "contacted_via", "channel"]) || "Unknown";

    const closedVal = parseNum(get(r, ["closed", "closes", "sales", "sold", "won", "deals_closed"]));
    const isClosed = outcome.includes("closed") || outcome.includes("won") || closedVal > 0;

    if (!repMetrics[repName]) repMetrics[repName] = { contacts: 0, closes: 0, revenue: 0 };
    repMetrics[repName].contacts++;
    if (isClosed) { repMetrics[repName].closes++; repMetrics[repName].revenue += dealAmount; }

    if (!customerTypeMetrics[customerType]) customerTypeMetrics[customerType] = { contacts: 0, closes: 0, revenue: 0 };
    customerTypeMetrics[customerType].contacts++;
    if (isClosed) { customerTypeMetrics[customerType].closes++; customerTypeMetrics[customerType].revenue += dealAmount; }

    const normalizedResponseTime =
      responseTime.toLowerCase().includes("same") || responseTime === "0" ? "same-day" :
      parseInt(responseTime) >= 3 ? "3+ days" : "1-2 days";
    if (!responseTimeMetrics[normalizedResponseTime]) responseTimeMetrics[normalizedResponseTime] = { contacts: 0, closes: 0 };
    responseTimeMetrics[normalizedResponseTime].contacts++;
    if (isClosed) responseTimeMetrics[normalizedResponseTime].closes++;

    if (!contactMethodMetrics[contactMethod]) contactMethodMetrics[contactMethod] = { contacts: 0, closes: 0 };
    contactMethodMetrics[contactMethod].contacts++;
    if (isClosed) contactMethodMetrics[contactMethod].closes++;

    if (!isClosed && !followupDone) unfollowedLeads++;
    if (isClosed) { totalCloses++; totalRevenue += dealAmount; }

    const timeVal = get(r, ["time_of_day", "time", "hour", "knock_time", "visit_time", "start_time"]);
    if (timeVal) {
      const cleaned = timeVal.trim().toLowerCase();
      let hour = -1;
      if (cleaned.includes(":")) {
        hour = parseInt(cleaned.split(":")[0]);
        if (cleaned.includes("pm") && hour < 12) hour += 12;
        if (cleaned.includes("am") && hour === 12) hour = 0;
      } else if (/^\d+$/.test(cleaned)) { hour = parseInt(cleaned); }
      if (hour >= 0 && hour <= 23) {
        let slot = "Unknown";
        if (hour >= 8 && hour < 12) slot = "Morning (8am-12pm)";
        else if (hour >= 12 && hour < 15) slot = "Early Afternoon (12pm-3pm)";
        else if (hour >= 15 && hour < 18) slot = "Late Afternoon (3pm-6pm)";
        else if (hour >= 18) slot = "Evening (6pm+)";
        else slot = "Early Morning (before 8am)";
        if (!timeMap[slot]) timeMap[slot] = { knocked: 0, closed: 0 };
        timeMap[slot].knocked += parseNum(get(r, ["knocked", "knocks", "doors", "visits"])) || 1;
        if (isClosed) timeMap[slot].closed++;
      }
    }

    const dateVal = get(r, ["date", "visit_date", "knock_date", "activity_date"]);
    if (dateVal) {
      const d = parseDate(dateVal);
      if (d) {
        const day = dayNames[d.getDay()];
        if (!dayMap[day]) dayMap[day] = { knocked: 0, closed: 0 };
        dayMap[day].knocked += parseNum(get(r, ["knocked", "knocks", "doors", "visits"])) || 1;
        if (isClosed) dayMap[day].closed++;
      }
    }

    const zip = get(r, ["zip", "zipcode", "zip_code", "postal_code", "territory", "area", "region"]);
    if (zip) {
      if (!zipMap[zip]) zipMap[zip] = { knocked: 0, closed: 0 };
      zipMap[zip].knocked += parseNum(get(r, ["knocked", "knocks", "doors", "visits"])) || 1;
      if (isClosed) zipMap[zip].closed++;
    }
  });

  const totalContacts = totalRows;
  const overallCloseRate = ((totalCloses / totalContacts) * 100).toFixed(1);
  const avgDealValue = totalCloses > 0 ? (totalRevenue / totalCloses) : 0;

  const repSummary = Object.entries(repMetrics)
    .map(([rep, m]) => {
      const rate = ((m.closes / m.contacts) * 100).toFixed(1);
      const avg = m.closes > 0 ? (m.revenue / m.closes).toFixed(0) : "0";
      return `  - ${rep}: ${m.closes}/${m.contacts} closes (${rate}%), $${m.revenue.toLocaleString()} revenue, $${avg} avg deal`;
    }).join("\n");

  const customerTypeSummary = Object.entries(customerTypeMetrics)
    .map(([type, m]) => {
      const rate = ((m.closes / m.contacts) * 100).toFixed(1);
      const avg = m.closes > 0 ? (m.revenue / m.closes).toFixed(0) : "0";
      return `  - ${type}: ${m.closes}/${m.contacts} closes (${rate}%), $${m.revenue.toLocaleString()} revenue, $${avg} avg deal`;
    }).join("\n");

  const responseTimeSummary = Object.entries(responseTimeMetrics)
    .map(([time, m]) => {
      const rate = ((m.closes / m.contacts) * 100).toFixed(1);
      return `  - ${time}: ${m.closes}/${m.contacts} closes (${rate}%)`;
    }).join("\n");

  const contactMethodSummary = Object.entries(contactMethodMetrics)
    .map(([method, m]) => {
      const rate = ((m.closes / m.contacts) * 100).toFixed(1);
      return `  - ${method}: ${m.closes}/${m.contacts} closes (${rate}%)`;
    }).join("\n");

  const timeSummary = Object.entries(timeMap)
    .map(([slot, m]) => {
      const rate = m.knocked > 0 ? ((m.closed / m.knocked) * 100).toFixed(1) : "0";
      return `  - ${slot}: ${m.knocked} knocks, ${m.closed} closes, ${rate}% close rate`;
    }).join("\n");

  const daySummary = Object.entries(dayMap)
    .map(([day, m]) => {
      const rate = m.knocked > 0 ? ((m.closed / m.knocked) * 100).toFixed(1) : "0";
      return `  - ${day}: ${m.knocked} knocks, ${m.closed} closes, ${rate}% close rate`;
    }).join("\n");

  const topZips = Object.entries(zipMap)
    .sort((a, b) => (b[1].closed / (b[1].knocked || 1)) - (a[1].closed / (a[1].knocked || 1)))
    .slice(0, 5)
    .map(([zip, m]) => {
      const rate = m.knocked > 0 ? ((m.closed / m.knocked) * 100).toFixed(1) : "0";
      return `  - ${zip}: ${m.knocked} knocks, ${m.closed} closes, ${rate}% close rate`;
    }).join("\n");

  const dateVals = rows.map(r => findColumn(r, ["date", "visit_date", "knock_date", "activity_date"])).filter(Boolean);

  return `
# SALES DATA SUMMARY

Total Contacts: ${totalContacts}
Total Closes: ${totalCloses}
Overall Close Rate: ${overallCloseRate}%
Total Revenue: $${totalRevenue.toLocaleString()}
Average Deal Value: $${avgDealValue.toLocaleString()}
Unfollowed Leads: ${unfollowedLeads}
Columns detected: ${columns.join(", ")}
Date range: ${dateVals.length > 0 ? dateVals[0] + " to " + dateVals[dateVals.length - 1] : "N/A"}

## REP PERFORMANCE
${repSummary || "No rep data detected"}

## CUSTOMER TYPE PERFORMANCE
${customerTypeSummary || "No customer type data detected"}

## RESPONSE TIME PERFORMANCE
${responseTimeSummary || "No response time data detected"}

## CONTACT METHOD PERFORMANCE
${contactMethodSummary || "No contact method data detected"}

## TIME OF DAY BREAKDOWN
${timeSummary || "No time data detected"}

## DAY OF WEEK BREAKDOWN
${daySummary || "No date data detected"}

## TOP TERRITORIES/ZIPS BY CLOSE RATE
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
      await supabase.from("uploads").update({ status: "failed", error_message: "Free limit reached" }).eq("id", uploadId);
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
      await supabase.from("uploads").update({ status: "failed", error_message: "No data rows found in CSV" }).eq("id", uploadId);
      throw new Error("CSV has no data rows");
    }

    await supabase.from("uploads").update({ row_count: rowCount }).eq("id", uploadId);

    const salesRecords = rows.map(r => {
      const get = (candidates: string[]) => findColumn(r, candidates);
      return {
        upload_id: uploadId,
        user_id: user.id,
        rep_name: get(["rep_name", "rep", "salesperson", "agent", "name", "employee", "sales_rep", "assigned_rep"]) || null,
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
        deal_value: parseNum(get(["deal_value", "value", "revenue", "amount", "price", "sale_value", "deal_amount"])) || 0,
        product: get(["product", "service", "package", "plan_type"]) || null,
        follow_up_scheduled: ["1", "true", "yes", "y"].includes(
          get(["follow_up", "followup", "follow_up_scheduled", "followup_done", "callback"]).toLowerCase()
        ),
        notes: get(["notes", "comments", "remarks"]) || null,
      };
    });

    if (salesRecords.length > 0) {
      await supabase.from("sales_records").insert(salesRecords);
    }

    const summary = buildSummary(rows);

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

    const businessType = profile?.business_type || "field sales";
    const mainChallenge = profile?.main_challenge || "improving close rates";
    const teamSize = profile?.team_size || "unknown";
    const industryDetail = industryContext[businessType] || industryContext.other;
    const challengeDetail = challengeContext[mainChallenge] || "";

    const businessContext = profile?.business_type
      ? `\nBUSINESS CONTEXT:\nIndustry: ${businessType} sales (${teamSize} reps)\nIndustry specifics: ${industryDetail}\nPrimary challenge: ${mainChallenge} — ${challengeDetail}\nTailor every insight to this specific industry and challenge.\n`
      : "";

    const perfectPrompt = `You are a world-class sales operations analyst. Your job is to find hidden revenue leaks and opportunities in sales data that founders don't see.
${businessContext}
## ABSOLUTE RULES - DO NOT VIOLATE
1. Return ONLY a JSON array. Nothing else. No markdown, no code blocks, no preamble, no explanation.
2. Start with [ and end with ]
3. Each object MUST have exactly these fields: priority, category, title, body, metric
4. If you cannot generate valid JSON, return an empty array []

## Output Format (MUST BE VALID JSON)
[
  {
    "priority": "critical|opportunity|pattern",
    "category": "Rep Performance|Lead Quality|Sales Cycle|Follow-up|Conversion|Response Time|Customer Type|Pipeline|Deal Value|Contact Method|Revenue Leakage",
    "title": "Specific, quantified headline with the number",
    "body": "2-3 sentences: the finding, why it matters, what it costs or gains",
    "metric": "The single most important number (e.g., '0% close rate', '$120K lost', '100% conversion')"
  }
]

## YOUR GOAL
Generate 8-10 insights that would make a sales manager say "oh shit, I didn't know that" or "I need to fix that immediately."

## INSIGHT QUALITY CRITERIA
An insight is ONLY good if it has ALL of these:
1. CONCRETE NUMBER: A specific metric (not "high" or "low", but "0%", "$50K", "100%")
2. COMPARISON: This vs that (Rep A vs Rep B, same-day vs 3-day, referral vs cold)
3. IMPACT: Either revenue lost or revenue opportunity (in dollars or percentage)
4. OWNERSHIP: Who specifically needs to act (rep name, customer type, time period)
5. ACTION: A single, immediate, doable next step

## SCORING YOUR INSIGHTS
Before returning an insight, ask yourself:
- Would a manager pay $200/month to know this? YES -> Keep it
- Is this a real pattern in the data or am I pattern-matching? Real -> Keep it
- Can they act on this today? YES -> Keep it
- Is this obvious/already known? NO -> Keep it
- Am I making up numbers or extrapolating? NO -> Keep it

## WHAT MAKES AN INSIGHT CRITICAL
Critical insights are costing deals RIGHT NOW. Examples:
- "Rep Sarah closes 0% of deals but is assigned 20% of leads (losing $150K/year)"
- "Team never responds same-day but same-day converts 100% vs 20% for delayed"
- "You're losing all referral leads to slow follow-up (they go cold in 24 hours)"
- "Your premium customers ($300K+) only close with 1 rep (John) at 95%, others fail"

## WHAT MAKES AN INSIGHT AN OPPORTUNITY
Opportunities are untapped potential. Examples:
- "Referral customers convert 100% but are only 10% of pipeline (should be 40%)"
- "Commercial customers close faster ($2K deals in 2 days, residential in 5 days)"
- "Your best rep (Marcus) closes $8.5K average deal, others average $5.2K (gap: $3.3K per deal)"
- "Multi-family customers have 0% churn but you focus on single-family"

## WHAT MAKES A PATTERN
Patterns are trends worth monitoring. Examples:
- "Close rate improves 3% for every day earlier in the week (Mon best, Fri worst)"
- "Deals under $5K close in 2 days, over $10K close in 5 days (2.5x difference)"
- "Customers who respond same-day close 60%, those who wait close 30%"

## EXAMPLES OF PERFECT INSIGHTS
{
  "priority": "critical",
  "category": "Rep Performance",
  "title": "Sarah: 0% Close Rate On 60 Contacts ($312K Lost Revenue)",
  "body": "Sarah has contacted 60 customers and closed 0 deals (0% close rate). Team average is 45% (28/62 deals closed). At $5.2K avg deal value, her 0 closes costs $312K in potential revenue. Marcus shows this is not a market problem, it is rep performance.",
  "metric": "0% close rate vs 45% team avg = $312K lost"
},
{
  "priority": "critical",
  "category": "Response Time",
  "title": "Same-Day Response = 100% Close (25/25) vs 3-Day = 20% (2/10)",
  "body": "Contacts who respond same-day close 100% of the time (25 deals). Contacts who take 3+ days to respond close only 20% (2 deals). This 5x difference is your biggest conversion lever. Even moving from 3-day to 2-day response would unlock $50K+ in revenue.",
  "metric": "Same-day = 100%, 3+ day = 20% (5x difference)"
},
{
  "priority": "opportunity",
  "category": "Contact Method",
  "title": "Referral Customers Are 100% Conversion vs 60% Door-Knock (3x More Effective)",
  "body": "Referral customers (15 total) close 100% of the time. Door-knock customers (40 total) close 60% of the time. Your team spends 80% effort on door-knock, 20% on referrals. Flipping this ratio could double your close rate.",
  "metric": "Referral 100% vs door-knock 60% = 3x better"
}

## WARNINGS (DO NOT VIOLATE)
- Never mention incomplete data or missing columns
- Never use vague words like "some", "many", "potentially", "appears"
- Never generate insights without specific numbers
- Never give advice on metrics you cannot calculate from the data
- Never compare against unknown benchmarks like industry average
- Never make an insight critical unless it is actually costing deals
- Never make an insight if the same pattern appears in all reps equally

## CALCULATION RULES
- Close rate = closed deals / total contacts
- Revenue impact = deals lost times avg deal value or deals gained times avg deal value
- Follow-up execution rate = follow-ups completed / total contacts times 100%
- Average deal value = total revenue / total closed deals
- Lost revenue = unfollowed leads times average deal value

You are an expert. Generate insights that would be worth $200/month to a sales manager. Return ONLY a JSON array.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4000,
      system: perfectPrompt,
      messages: [{
        role: "user",
        content: `Analyze this sales data and generate 8-10 insights. Calculate metrics carefully and use the framework provided:\n\n${summary}`,
      }],
    });

    const responseText = message.content[0]?.type === "text" ? message.content[0].text : "";
    if (!responseText) throw new Error("No response from AI");

    let insights: Array<{ priority: string; category: string; title: string; body: string; metric: string }> = [];

    try {
  const cleaned = responseText.replace(/```json|```/g, "").trim();
  insights = JSON.parse(cleaned);
} catch {
  try {
    const jsonMatch = responseText.match(/\[\s*\{[\s\S]*?\}\s*\]/);
    if (jsonMatch) {
      insights = JSON.parse(jsonMatch[0]);
    } else {
      const objectMatches = responseText.match(/\{[^{}]*"priority"[^{}]*\}/g);
      if (objectMatches && objectMatches.length > 0) {
        insights = objectMatches
          .map(m => { try { return JSON.parse(m); } catch { return null; } })
          .filter(Boolean);
      }
    }
  } catch {
    console.error("All JSON parsing attempts failed. Raw response:", responseText);
  }
}

if (!Array.isArray(insights) || insights.length === 0) {
  insights = [{
    priority: "pattern",
    category: "Data Analysis",
    title: "Upload processed — review your data quality",
    body: "Your data was uploaded successfully but the AI could not generate structured insights. This usually happens with very small datasets or unusual data formats. Try uploading a CSV with at least 20 rows and columns like rep_name, closed, knocked, and date.",
    metric: "Check data format",
  }];
}

  

    await supabase
      .from("insights")
      .update({ is_dismissed: true })
      .eq("user_id", user.id)
      .neq("upload_id", uploadId);

    const insightRows = insights
      .filter(i => i.priority && i.category && i.title && i.body && i.metric)
      .slice(0, 10)
      .map(insight => ({
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
    await supabase.from("uploads").update({ status: "complete", row_count: rowCount }).eq("id", uploadId);

 } catch (err) {
  const errMsg = String(err);
  if (errMsg.includes("NEXT_REDIRECT")) throw err;
  await supabase
    .from("uploads")
    .update({ status: "failed", error_message: errMsg })
    .eq("id", uploadId);
  console.error("Upload analysis error:", err);
}

  redirect("/dashboard");
}
