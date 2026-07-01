"use server";

import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import Papa from "papaparse";
import { redirect } from "next/navigation";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

/* ------------------------------------------------------------------ *
 * Helpers (unchanged signatures so the sales_records mapping still works)
 * ------------------------------------------------------------------ */

function normalizeKey(key: string): string {
  return key.toLowerCase().trim().replace(/[\s\-\/\\().]+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
}

function findColumn(row: Record<string, string>, candidates: string[]): string {
  const keys = Object.keys(row);
  for (const candidate of candidates) {
    const match = keys.find((k) => normalizeKey(k) === candidate || normalizeKey(k).includes(candidate));
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

/* ------------------------------------------------------------------ *
 * Schema-agnostic profiler. Works on ANY service-business export —
 * no assumed column names. Types every column, then auto-detects a
 * status column + money column and rolls the rows into a funnel with
 * dollars attached, so leak surfaces are quantified up front.
 * ------------------------------------------------------------------ */

type ColType = "date" | "money" | "number" | "category" | "text" | "empty";

interface ColInfo {
  col: string;
  type: ColType;
  fill: number;
  distinct: number;
  nonEmpty: string[];
  sum?: number;
  avg?: number;
  min?: number;
  max?: number;
  minDate?: Date;
  maxDate?: Date;
  dist?: [string, number][];
}

// Funnel stages, in order. Each matches the messy status words real tools export.
const STATUS_BUCKETS: { key: string; label: string; re: RegExp }[] = [
  { key: "uncontacted", label: "New / uncontacted", re: /(^new$|^lead$|^open$|inbound|unassigned|^received$|no\s?response|to\s?contact|not\s?contacted)/ },
  { key: "quoted", label: "Quoted / estimate out", re: /(quote|quoted|estimate|proposal|bid|pending|awaiting|sent|in\s?review|negotiat)/ },
  { key: "scheduled", label: "Booked / scheduled", re: /(schedul|booked|appointment|confirmed|upcoming|dispatched)/ },
  { key: "won", label: "Won / sold / completed", re: /(won|sold|closed\s?won|complete|completed|^done$|^paid$|active|fulfilled|installed)/ },
  { key: "lost", label: "Lost / dead", re: /(lost|dead|declin|reject|closed\s?lost|unqualified|no\s?sale|^no$|gone\s?cold)/ },
  { key: "cancelled", label: "Cancelled / no-show", re: /(cancel|no\s?show|noshow|missed|rescheduled\s?out|abandon)/ },
  { key: "unpaid", label: "Unpaid / overdue", re: /(unpaid|overdue|outstanding|past\s?due|owing|owed|delinquent|^due$)/ },
];

function bucketOf(v: string): string | null {
  const s = v.toLowerCase().trim();
  for (const b of STATUS_BUCKETS) if (b.re.test(s)) return b.key;
  return null;
}

function profileColumns(rows: Record<string, string>[]): ColInfo[] {
  const total = rows.length;
  const cols = Object.keys(rows[0] || {});
  return cols.map((col) => {
    const values = rows.map((r) => (r[col] ?? "").toString().trim());
    const nonEmpty = values.filter((v) => v !== "");
    const fill = total ? nonEmpty.length / total : 0;
    const distinct = new Set(nonEmpty.map((v) => v.toLowerCase())).size;
    const sample = nonEmpty.slice(0, 30);
    const nk = normalizeKey(col);

    const dateParsed = sample.map(parseDate).filter(Boolean) as Date[];
    const dateRatio = sample.length ? dateParsed.length / sample.length : 0;
    const dateHeader = /(date|day|created|closed|sold|received|sent|due|schedul|complet|when|timestamp|month|year|opened)/.test(nk);
    const isDate = nonEmpty.length > 0 && (dateRatio >= 0.8 || (dateRatio >= 0.5 && dateHeader));

    const numLike = nonEmpty.filter((v) => /\d/.test(v) && /^[\s$€£,.\d%()+-]+$/.test(v));
    const numRatio = nonEmpty.length ? numLike.length / nonEmpty.length : 0;
    const isNumeric = !isDate && numRatio >= 0.7;
    const moneyHeader = /(amount|value|revenue|price|total|cost|paid|invoice|quote|deal|estimate|balance|fee|charge|sale|payment|ticket|bill|charged|subtotal)/.test(nk);
    const hasCurrency = sample.some((v) => /[$€£]/.test(v));
    const isMoney = isNumeric && (moneyHeader || hasCurrency);

    let type: ColType = "text";
    if (fill === 0) type = "empty";
    else if (isDate) type = "date";
    else if (isMoney) type = "money";
    else if (isNumeric) type = "number";
    else if (distinct > 0 && distinct <= 20 && distinct < nonEmpty.length * 0.7) type = "category";

    const info: ColInfo = { col, type, fill, distinct, nonEmpty };

    if (type === "money" || type === "number") {
      const nums = nonEmpty.map(parseNum).filter((n) => !isNaN(n));
      const nonZero = nums.filter((n) => n !== 0);
      info.sum = nums.reduce((a, b) => a + b, 0);
      info.avg = nonZero.length ? info.sum / nonZero.length : 0;
      info.min = nums.length ? Math.min(...nums) : 0;
      info.max = nums.length ? Math.max(...nums) : 0;
    }
    if (type === "date") {
      const ds = nonEmpty.map(parseDate).filter(Boolean) as Date[];
      if (ds.length) {
        info.minDate = new Date(Math.min(...ds.map((d) => d.getTime())));
        info.maxDate = new Date(Math.max(...ds.map((d) => d.getTime())));
      }
    }
    if (type === "category") {
      const counts: Record<string, number> = {};
      nonEmpty.forEach((v) => { counts[v] = (counts[v] || 0) + 1; });
      info.dist = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 12);
    }
    return info;
  });
}

function buildSummary(rows: Record<string, string>[]): string {
  if (!rows.length) return "No data found.";
  const total = rows.length;
  const cols = Object.keys(rows[0]);
  const infos = profileColumns(rows);

  // Pick the primary money column (largest total).
  const moneyCol = infos.filter((i) => i.type === "money").sort((a, b) => (b.sum || 0) - (a.sum || 0))[0];

  // Pick the status column: the category column whose values best match funnel stages.
  let statusCol: ColInfo | undefined;
  let bestMatched = 0;
  for (const c of infos.filter((i) => i.type === "category")) {
    const matched = c.nonEmpty.filter((v) => bucketOf(v)).length;
    const ratio = c.nonEmpty.length ? matched / c.nonEmpty.length : 0;
    if (ratio > 0.4 && matched > bestMatched) { bestMatched = matched; statusCol = c; }
  }

  // Roll rows into a funnel with dollars attached.
  let funnelText = "";
  let leakText = "";
  if (statusCol) {
    const buckets: Record<string, { count: number; sum: number }> = {};
    rows.forEach((r) => {
      const sv = (r[statusCol!.col] ?? "").toString().trim();
      if (!sv) return;
      const k = bucketOf(sv) || "other";
      if (!buckets[k]) buckets[k] = { count: 0, sum: 0 };
      buckets[k].count++;
      if (moneyCol) buckets[k].sum += parseNum((r[moneyCol.col] ?? "").toString());
    });
    funnelText = STATUS_BUCKETS.map((b) => {
      const x = buckets[b.key];
      if (!x || !x.count) return null;
      const money = moneyCol && x.sum > 0 ? `, ~$${Math.round(x.sum).toLocaleString()} attached` : "";
      const pct = ((x.count / total) * 100).toFixed(0);
      return `  - ${b.label}: ${x.count} (${pct}%)${money}`;
    }).filter(Boolean).join("\n");

    // Explicit leak callouts the model can turn into dollar-denominated insights.
    const leaks: string[] = [];
    const q = buckets["quoted"]; const u = buckets["uncontacted"]; const c = buckets["cancelled"]; const p = buckets["unpaid"];
    if (q && q.sum > 0) leaks.push(`  - Quoted but not won: ${q.count} deals worth ~$${Math.round(q.sum).toLocaleString()} sitting open.`);
    if (u && u.count) leaks.push(`  - New / uncontacted: ${u.count} leads with no recorded contact${moneyCol && u.sum > 0 ? ` (~$${Math.round(u.sum).toLocaleString()} potential)` : ""}.`);
    if (c && c.count) leaks.push(`  - Cancelled / no-show: ${c.count} appointments${moneyCol && c.sum > 0 ? ` (~$${Math.round(c.sum).toLocaleString()})` : ""}.`);
    if (p && p.sum > 0) leaks.push(`  - Unpaid / overdue: ${p.count} invoices worth ~$${Math.round(p.sum).toLocaleString()}.`);
    leakText = leaks.join("\n");
  }

  // Overall date span + recency.
  const dateInfos = infos.filter((i) => i.type === "date" && i.maxDate);
  let recencyText = "No date column detected.";
  if (dateInfos.length) {
    const newest = new Date(Math.max(...dateInfos.map((i) => i.maxDate!.getTime())));
    const oldest = new Date(Math.min(...dateInfos.map((i) => i.minDate!.getTime())));
    const daysOld = Math.round((Date.now() - newest.getTime()) / 86400000);
    recencyText = `Date span: ${oldest.toISOString().slice(0, 10)} → ${newest.toISOString().slice(0, 10)}. Newest record is ${daysOld} day(s) old.`;
  }

  const colDetail = infos.filter((i) => i.type !== "empty").map((i) => {
    const fill = `${Math.round(i.fill * 100)}% filled`;
    if (i.type === "date") return `  - ${i.col} — date, ${fill}, ${i.minDate?.toISOString().slice(0, 10)} → ${i.maxDate?.toISOString().slice(0, 10)}`;
    if (i.type === "money") return `  - ${i.col} — money, ${fill}, total $${Math.round(i.sum || 0).toLocaleString()}, avg $${Math.round(i.avg || 0).toLocaleString()}, range $${Math.round(i.min || 0).toLocaleString()}–$${Math.round(i.max || 0).toLocaleString()}`;
    if (i.type === "number") return `  - ${i.col} — number, ${fill}, total ${Math.round(i.sum || 0).toLocaleString()}, avg ${(i.avg || 0).toFixed(1)}`;
    if (i.type === "category") return `  - ${i.col} — category, ${fill}, ${i.distinct} values: ${i.dist!.map(([v, c]) => `${v} (${c})`).join(", ")}`;
    return `  - ${i.col} — text, ${fill}, ${i.distinct} distinct values`;
  }).join("\n");

  const moneyText = moneyCol
    ? `Primary value column: ${moneyCol.col} — total $${Math.round(moneyCol.sum || 0).toLocaleString()} across ${moneyCol.nonEmpty.length} rows, avg $${Math.round(moneyCol.avg || 0).toLocaleString()}.`
    : "No clear money column detected — dollar-denominate cautiously.";

  const sampleRows = rows.slice(0, 5).map((r, idx) => {
    const obj: Record<string, string> = {};
    cols.slice(0, 12).forEach((c) => {
      const v = (r[c] ?? "").toString().trim();
      if (v) obj[c] = v.length > 40 ? v.slice(0, 40) + "…" : v;
    });
    return `  ${idx + 1}) ${JSON.stringify(obj)}`;
  }).join("\n");

  return `
# BUSINESS DATA PROFILE

Rows: ${total}
Columns (${cols.length}): ${cols.join(", ")}

## COLUMN DETAIL
${colDetail}

## MONEY
${moneyText}

## FUNNEL (status column: ${statusCol ? statusCol.col : "none detected"})
${funnelText || "  No status/stage column detected — infer the funnel from dates and amounts."}

## LIKELY LEAK SURFACES
${leakText || "  No status-based leaks computed. Look for missing follow-up dates, aging open records, and gaps between created date and any contact/close date."}

## RECENCY
${recencyText}

## SAMPLE ROWS (raw)
${sampleRows}
`.trim();
}

/* ------------------------------------------------------------------ *
 * Main action — plumbing identical to before.
 * ------------------------------------------------------------------ */

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

    // Best-effort row storage. Wrapped so a schema mismatch can never fail the analysis.
    try {
      const salesRecords = rows.map((r) => {
        const get = (candidates: string[]) => findColumn(r, candidates);
        return {
          upload_id: uploadId,
          user_id: user.id,
          rep_name: get(["rep_name", "rep", "salesperson", "agent", "assigned", "owner", "technician", "tech", "employee", "name"]) || null,
          date: get(["date", "created", "created_date", "job_date", "service_date", "activity_date"]) || null,
          time_of_day: get(["time_of_day", "time", "hour", "start_time"]) || null,
          address: get(["address", "street", "location"]) || null,
          city: get(["city", "town"]) || null,
          state: get(["state", "province"]) || null,
          zip: get(["zip", "zipcode", "zip_code", "postal_code"]) || null,
          knocked: 1,
          contacted: 0,
          pitched: 0,
          closed: Math.round(parseNum(get(["closed", "won", "sold", "completed", "deals_closed"]))) || 0,
          deal_value: parseNum(get(["deal_value", "value", "revenue", "amount", "price", "total", "invoice", "quote", "estimate"])) || 0,
          product: get(["product", "service", "service_type", "job_type", "package", "plan_type"]) || null,
          follow_up_scheduled: ["1", "true", "yes", "y"].includes(
            get(["follow_up", "followup", "follow_up_scheduled", "followup_done", "callback"]).toLowerCase()
          ),
          notes: get(["notes", "comments", "remarks", "description"]) || null,
        };
      });
      if (salesRecords.length > 0) await supabase.from("sales_records").insert(salesRecords);
    } catch (recErr) {
      console.error("sales_records insert skipped:", recErr);
    }

    const summary = buildSummary(rows);

    // Light service-industry flavor by vertical. No door-knocking, no rep scorecards.
    const verticalContext: Record<string, string> = {
      pest: "Pest control: recurring plans vs one-offs, seasonal demand, missed renewals, and quotes that go cold.",
      roofing: "Roofing: insurance/storm jobs, high-ticket estimates that sit unaccepted, and slow follow-up on bids.",
      hvac: "HVAC: maintenance plans, emergency vs scheduled work, install quotes left open, and overdue invoices.",
      landscaping: "Landscaping/lawn: recurring service retention, seasonal re-activation, and unconverted estimates.",
      cleaning: "Commercial/residential cleaning: recurring contracts, churned accounts, and quote-to-booking gaps.",
      security: "Home security: monitoring contracts, install scheduling, and abandoned quotes.",
      solar: "Solar: long sales cycles, proposals that stall, and financing follow-up.",
      insurance: "Insurance: policy follow-up, renewals, and referral conversion.",
      staffing: "Staffing: open reqs, candidate/client follow-up speed, and placements that stall.",
      other: "General service business: the money leaks live in slow lead response, unconverted quotes, no-shows, unpaid invoices, and missed repeat/review business.",
    };
    const vertical = (profile?.business_type || "other").toLowerCase();
    const verticalDetail = verticalContext[vertical] || verticalContext.other;
    const businessContext = `\nBUSINESS CONTEXT\nThis is a small service business${profile?.business_type ? ` (${profile.business_type})` : ""}. ${verticalDetail}\nThe owner runs the business — there is no sales team to benchmark. Do NOT frame anything around individual reps.\n`;

    const perfectPrompt = `You are Adunda's revenue-leak diagnostician for small, owner-run service businesses (HVAC, plumbing, roofing, electrical, pest control, landscaping, cleaning, security, solar, and similar). You are given a structured PROFILE of ONE business's exported data — already parsed into COLUMN DETAIL, a MONEY summary, a FUNNEL of status buckets with counts and attached dollars, explicit LIKELY LEAK SURFACES, RECENCY, and SAMPLE ROWS. Read that profile and surface where money is leaking through their deal flow, tying each leak to the one Adunda agent that plugs it.
${businessContext}
The deal flow, where money leaks at every seam:
lead in → first response → quote/estimate → booking/scheduling → job completed → invoice/payment → review & repeat

## GROUNDING — THESE RULES OUTRANK EVERYTHING BELOW
1. EVERY number you write must come directly from the PROFILE. The only permitted sources are: FUNNEL bucket counts and their attached dollars, LIKELY LEAK SURFACES, MONEY totals/averages, COLUMN DETAIL figures, and simple arithmetic on those alone (a percentage = a bucket count ÷ total rows; a subtotal = summing given buckets).
2. NEVER invent, estimate, extrapolate, or project a number. No fabricated dollar "recovery," no invented benchmarks, no "industry average" figures, no numbers that a reader holding this same profile could not reproduce exactly.
3. Do NOT state external statistics as if measured (e.g. "5-minute response converts 9x"). You may give at most one short clause of qualitative reasoning, and it must contain NO figure.
4. If there is no money column in the profile, use counts and percentages only — never attach a dollar sign to a number that isn't in the profile.
5. When in doubt about a number, leave it out. A smaller, fully-grounded report is the goal.

## THE SIX ADUNDA AGENTS (every insight maps to exactly one)
- Lead Response — new/uncontacted leads, slow or missing first response
- Follow-Up & Reactivation — quotes/estimates gone cold, dormant leads, no second touch
- Scheduling & Dispatch — no-shows, cancellations, unfilled calendar gaps
- Quote & Invoice — quotes sitting open/unaccepted, overdue or unpaid invoices
- Reviews & Reputation — completed jobs with no review request or repeat outreach
- Revenue Concentration — structural risk where one service/period/customer carries the revenue (monitoring only; no agent — always priority "pattern")

## SEVERITY
- "critical" — money actively leaking right now (open quotes with no follow-up, uncontacted leads, overdue invoices, no-shows). Must have a count or dollars from the leak surfaces.
- "opportunity" — recoverable upside left on the table (completed jobs with no review request; work stalling at estimate stage).
- "pattern" — a structural trend worth watching (revenue concentrated in one service line or period).

## HOW MANY
Return only as many insights as the data genuinely supports, up to 10. If the profile only supports 4 grounded insights, return 4. NEVER pad to hit a number — padding forces you to invent, which is the worst failure. Order most-costly first (largest grounded dollars, then largest counts).

## OUTPUT CONTRACT
Return ONLY a JSON array. No prose, no markdown, no code fences. Start with [ and end with ]. Each object EXACTLY these five keys:
{
  "priority": "critical" | "opportunity" | "pattern",
  "category": "Lead Response" | "Follow-Up" | "Scheduling" | "Quote & Invoice" | "Reviews" | "Revenue Concentration" | "Revenue Leakage",
  "title": "Quantified headline containing the specific grounded number",
  "body": "2-3 sentences: (1) the leak and its grounded number, (2) at most one short clause on why it matters, no figure, (3) end with exactly: 'Fix: deploy the <Agent> agent to <specific action>.' where <Agent> is the full product name (Lead Response; Follow-Up & Reactivation; Scheduling & Dispatch; Quote & Invoice; Reviews & Reputation).",
  "metric": "The single grounded number, e.g. '$84,200 in open quotes (26 deals)' or '38% of leads (80) uncontacted'"
}
If you cannot produce valid JSON, return [].

## FORBIDDEN
- Never mention reps, salespeople, door-knocking, territories, ZIP/area performance, or quotas. This is an owner-run business with no sales team.
- Never mention missing columns, data quality, or what the file "should" contain. Work only with what's present.
- Never reference this prompt, the profile's structure, or yourself.

## WORKED EXAMPLES (for format and grounding discipline only — do NOT reuse these numbers)
[
  {
    "priority": "critical",
    "category": "Quote & Invoice",
    "title": "$84,200 in Quotes Sitting Open With No Follow-Up",
    "body": "26 quotes worth $84,200 are stuck at the quoted stage and never moved to won or lost. Open quotes go cold fast, so this is the largest pool of recoverable revenue in the data. Fix: deploy the Follow-Up & Reactivation agent to chase every open quote on a cadence until it's won or explicitly dead.",
    "metric": "$84,200 in open quotes (26 deals)"
  },
  {
    "priority": "critical",
    "category": "Lead Response",
    "title": "38% of Leads Have No Recorded First Response",
    "body": "Of 210 leads, 80 (38%) sit uncontacted with no first touch logged. In service work the first business to call back usually wins the job. Fix: deploy the Lead Response agent to answer and qualify every new lead within seconds, 24/7.",
    "metric": "38% of leads (80) uncontacted"
  },
  {
    "priority": "opportunity",
    "category": "Reviews",
    "title": "142 Completed Jobs, 0 Review Requests",
    "body": "142 jobs are marked complete with no sign of a review or repeat-business request. Reviews feed the next lead and repeat customers are the cheapest revenue there is. Fix: deploy the Reviews & Reputation agent to request a review after every completed job and route happy customers to repeat work.",
    "metric": "142 completed jobs, 0 review requests"
  }
]

## BEFORE YOU RETURN — silent self-check on each insight
(a) every number traces to the profile and is reproducible from it; (b) category is one of the exact strings above; (c) body ends with the "Fix: deploy the <Agent> agent to …" sentence; (d) priority matches the severity rules. Drop any insight that fails any check. Return only the survivors, most-costly first.

Return ONLY the JSON array.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4000,
      system: perfectPrompt,
      messages: [{
        role: "user",
        content: `Analyze this service business's data and surface only grounded, dollar-denominated revenue leaks — each tied to the agent that fixes it. Every number must come from this profile; return fewer insights rather than any ungrounded one. Order most-costly first.\n\n${summary}`,
      }],
    });

    const responseText = message.content[0]?.type === "text" ? message.content[0].text : "";

    let insights: Array<{ priority: string; category: string; title: string; body: string; metric: string }> = [];

    if (responseText) {
      try {
        const cleaned = responseText.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed) && parsed.length > 0) insights = parsed;
      } catch {
        try {
          const match = responseText.match(/\[\s*\{[\s\S]*\}\s*\]/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            if (Array.isArray(parsed)) insights = parsed;
          }
        } catch {
          console.error("JSON parse failed, using fallback insight");
        }
      }
    }

    if (!Array.isArray(insights) || insights.length === 0) {
      insights = [{
        priority: "pattern",
        category: "Revenue Leakage",
        title: "Data uploaded — add a status, date, and amount column for a sharper diagnostic",
        body: "Your data was saved but structured insights couldn't be generated. The engine reads any export, but it finds the most money when your file has a status/stage column (e.g. new, quoted, won, lost), a date column, and a dollar amount column. Add those and re-upload.",
        metric: "Check CSV format",
      }];
    }

    await supabase
      .from("insights")
      .update({ is_dismissed: true })
      .eq("user_id", user.id)
      .neq("upload_id", uploadId);

    const insightRows = insights
      .filter((i) => i.priority && i.category && i.title && i.body && i.metric)
      .slice(0, 10)
      .map((insight) => ({
        upload_id: uploadId,
        user_id: user.id,
        priority: ["critical", "opportunity", "pattern"].includes(insight.priority) ? insight.priority : "pattern",
        category: insight.category || "Revenue Leakage",
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
    await supabase.from("uploads").update({ status: "failed", error_message: errMsg }).eq("id", uploadId);
    console.error("Upload error:", err);
  }

  redirect("/dashboard");
}
