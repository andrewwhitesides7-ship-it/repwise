"use server";

import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import Papa from "papaparse";
import { redirect } from "next/navigation";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

function buildSummary(rows: Record<string, string>[]): string {
  if (!rows.length) return "No data found.";

  const columns = Object.keys(rows[0]);
  const totalRows = rows.length;
  const num = (v: string) => parseFloat(v) || 0;

  const totalKnocked = rows.reduce((s, r) => s + num(r.knocked), 0);
  const totalContacted = rows.reduce((s, r) => s + num(r.contacted), 0);
  const totalPitched = rows.reduce((s, r) => s + num(r.pitched), 0);
  const totalClosed = rows.reduce((s, r) => s + num(r.closed), 0);
  const totalValue = rows.reduce((s, r) => s + num(r.deal_value), 0);
  const closeRate = totalKnocked > 0 ? ((totalClosed / totalKnocked) * 100).toFixed(1) : "0";
  const contactRate = totalKnocked > 0 ? ((totalContacted / totalKnocked) * 100).toFixed(1) : "0";
  const followUps = rows.filter(r => r.follow_up_scheduled === "1" || r.follow_up_scheduled === "true").length;
  const missedFollowUps = rows.filter(r => (r.follow_up_scheduled === "1" || r.follow_up_scheduled === "true") && num(r.closed) === 0).length;

  const repMap: Record<string, { knocked: number; closed: number; value: number }> = {};
  rows.forEach(r => {
    const rep = r.rep_name || "Unknown";
    if (!repMap[rep]) repMap[rep] = { knocked: 0, closed: 0, value: 0 };
    repMap[rep].knocked += num(r.knocked);
    repMap[rep].closed += num(r.closed);
    repMap[rep].value += num(r.deal_value);
  });

  const repSummary = Object.entries(repMap).map(([name, data]) => {
    const rate = data.knocked > 0 ? ((data.closed / data.knocked) * 100).toFixed(1) : "0";
    const avgDeal = data.closed > 0 ? (data.value / data.closed).toFixed(0) : "0";
    return `  - ${name}: ${data.knocked} knocks, ${data.closed} closes, ${rate}% close rate, $${avgDeal} avg deal`;
  }).join("\n");

  const timeMap: Record<string, { knocked: number; closed: number }> = {};
  rows.forEach(r => {
    if (!r.time_of_day) return;
    const hour = parseInt(r.time_of_day.split(":")[0]);
    let slot = "Unknown";
    if (hour >= 8 && hour < 12) slot = "Morning (8am-12pm)";
    else if (hour >= 12 && hour < 15) slot = "Early Afternoon (12pm-3pm)";
    else if (hour >= 15 && hour < 18) slot = "Late Afternoon (3pm-6pm)";
    else if (hour >= 18) slot = "Evening (6pm+)";
    if (!timeMap[slot]) timeMap[slot] = { knocked: 0, closed: 0 };
    timeMap[slot].knocked += num(r.knocked);
    timeMap[slot].closed += num(r.closed);
  });

  const timeSummary = Object.entries(timeMap).map(([slot, data]) => {
    const rate = data.knocked > 0 ? ((data.closed / data.knocked) * 100).toFixed(1) : "0";
    return `  - ${slot}: ${data.knocked} knocks, ${data.closed} closes, ${rate}% close rate`;
  }).join("\n");

  const dayMap: Record<string, { knocked: number; closed: number }> = {};
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  rows.forEach(r => {
    if (!r.date) return;
    const d = new Date(r.date);
    const day = dayNames[d.getDay()] || "Unknown";
    if (!dayMap[day]) dayMap[day] = { knocked: 0, closed: 0 };
    dayMap[day].knocked += num(r.knocked);
    dayMap[day].closed += num(r.closed);
  });

  const daySummary = Object.entries(dayMap).map(([day, data]) => {
    const rate = data.knocked > 0 ? ((data.closed / data.knocked) * 100).toFixed(1) : "0";
    return `  - ${day}: ${data.knocked} knocks, ${data.closed} closes, ${rate}% close rate`;
  }).join("\n");

  const zipMap: Record<string, { knocked: number; closed: number }> = {};
  rows.forEach(r => {
    if (!r.zip) return;
    if (!zipMap[r.zip]) zipMap[r.zip] = { knocked: 0, closed: 0 };
    zipMap[r.zip].knocked += num(r.knocked);
    zipMap[r.zip].closed += num(r.closed);
  });

  const topZips = Object.entries(zipMap)
    .sort((a, b) => (b[1].closed / (b[1].knocked || 1)) - (a[1].closed / (a[1].knocked || 1)))
    .slice(0, 5)
    .map(([zip, data]) => {
      const rate = data.knocked > 0 ? ((data.closed / data.knocked) * 100).toFixed(1) : "0";
      return `  - ZIP ${zip}: ${data.knocked} knocks, ${data.closed} closes, ${rate}% close rate`;
    }).join("\n");

  return `
SALES DATA SUMMARY
==================
Total rows: ${totalRows}
Columns: ${columns.join(", ")}
Date range: ${rows[0]?.date || "N/A"} to ${rows[rows.length - 1]?.date || "N/A"}

OVERALL METRICS
---------------
Total knocks: ${totalKnocked}
Total contacts: ${totalContacted} (${contactRate}% contact rate)
Total pitches: ${totalPitched}
Total closes: ${totalClosed}
Overall close rate: ${closeRate}%
Total revenue: $${totalValue.toLocaleString()}
Average deal value: $${totalClosed > 0 ? (totalValue / totalClosed).toFixed(0) : 0}
Follow-ups scheduled: ${followUps}
Follow-ups not yet closed: ${missedFollowUps}

REP BREAKDOWN
-------------
${repSummary}

TIME OF DAY BREAKDOWN
---------------------
${timeSummary}

DAY OF WEEK BREAKDOWN
---------------------
${daySummary}

TOP ZIP CODES BY CLOSE RATE
----------------------------
${topZips}
`.trim();
}

export async function analyzeUpload(uploadId: string, fileContent: string) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase
    .from("uploads")
    .update({ status: "processing" })
    .eq("id", uploadId);

  try {
    const parsed = Papa.parse<Record<string, string>>(fileContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
    });

    const rows = parsed.data;
    const rowCount = rows.length;

    await supabase
      .from("uploads")
      .update({ row_count: rowCount })
      .eq("id", uploadId);

    const salesRecords = rows.map(r => ({
      upload_id: uploadId,
      user_id: user.id,
      rep_name: r.rep_name || null,
      date: r.date || null,
      time_of_day: r.time_of_day || null,
      address: r.address || null,
      city: r.city || null,
      state: r.state || null,
      zip: r.zip || null,
      knocked: parseInt(r.knocked) || 0,
      contacted: parseInt(r.contacted) || 0,
      pitched: parseInt(r.pitched) || 0,
      closed: parseInt(r.closed) || 0,
      deal_value: parseFloat(r.deal_value) || 0,
      product: r.product || null,
      follow_up_scheduled: r.follow_up_scheduled === "1" || r.follow_up_scheduled === "true",
      notes: r.notes || null,
    }));

    if (salesRecords.length > 0) {
      await supabase.from("sales_records").insert(salesRecords);
    }

    const summary = buildSummary(rows);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: `You are RepWise, an AI sales analyst. Analyze this sales data and return ONLY a JSON array of 8 to 10 insight objects. Each object has: priority (critical or opportunity or pattern), category (a short 1-3 word label like "Time of Day" or "Rep Performance" or "Territory" or "Follow-Ups" or "Deal Value" or "Contact Rate"), title (under 10 words, specific and punchy), body (2 sentences with specific numbers from the data), metric (the key stat as a short string like "+3.2 closes/week" or "34% contact rate"). No preamble, no markdown, no code blocks, just the raw JSON array.`,
      messages: [
        {
          role: "user",
          content: `Analyze this sales data and return 8-10 insights as a JSON array:\n\n${summary}`,
        },
      ],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";

    let insights: Array<{
      priority: string;
      category: string;
      title: string;
      body: string;
      metric: string;
    }> = [];

    try {
      const cleaned = raw.replace(/```json|```/g, "").trim();
      insights = JSON.parse(cleaned);
    } catch {
      throw new Error("Failed to parse AI response as JSON");
    }

    const insightRows = insights.map(insight => ({
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
