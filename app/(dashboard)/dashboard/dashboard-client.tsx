"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { dismissInsight } from "@/app/actions/insights";
import { getAgents, listActivity, setAgentStatus, resolveActivity, triggerAgent } from "@/app/actions/agents";

/* ------------------------------------------------------------------ *
 * Adunda — dashboard  (app/(dashboard)/dashboard/dashboard-client.tsx)
 *
 * TWO STATES, ONE FILE:
 *   LOCKED  (no purchased agents) — the free diagnostic experience.
 *     • Hero metric = recoverable revenue FOUND (parsed from insights)
 *     • Every insight ends in "Deploy <agent> · $250/mo" → paywall
 *     • Agents tab = picker + pricing (mirrors the landing page)
 *     • Activity & Performance = blurred sample preview + unlock CTA
 *   UNLOCKED (≥1 agent row exists) — the operating experience.
 *     • Hero metric = recovered revenue, live feed, real charts
 *     • No demo data anywhere. Real rows only.
 *
 * unlocked = agent rows exist for this account (set by your Stripe →
 * n8n → Supabase provisioning flow after checkout).
 * ------------------------------------------------------------------ */

/* ----------------------------- CONFIG ------------------------------ */
const AGENT_PRICE = 250;
const BUNDLE_PRICE = 1000;
// Create these in Stripe → Payment Links, paste them here.
// Leave "" to fall back to Calendly checkout-by-call.
const STRIPE_AGENT_LINKS: Record<string, string> = {
  lead_response: "",
  follow_up: "",
  scheduling: "",
  quote_invoice: "",
  reviews: "",
};
const STRIPE_BUNDLE_LINK = "";
const CALENDLY_URL = "https://calendly.com/your-handle/adunda-demo";
/* ------------------------------------------------------------------- */

interface Insight {
  id: string;
  priority: "critical" | "opportunity" | "pattern";
  category: string;
  title: string;
  body: string;
  metric: string | null;
  is_dismissed: boolean;
}

interface ActivityRow {
  id: string;
  agent_type: string;
  action: string;
  detail: string | null;
  tone: "ok" | "accent" | "warn";
  needs_approval: boolean;
  recovered_cents: number;
  status?: string;
  created_at: string;
}
interface AgentRow {
  id: string;
  type: string;
  name: string;
  status: "active" | "paused";
}

interface DashboardClientProps {
  insights: Insight[];
  userName: string;
  userEmail?: string;
  activity?: ActivityRow[];
  agents?: AgentRow[];
  goals?: unknown[];
  stats?: Record<string, unknown>;
  records?: unknown[];
}

/* ---------------------- agent catalog + mapping --------------------- */

type AgentDef = { type: string; name: string; desc: string; categories: string[] };

const AGENT_DEFS: AgentDef[] = [
  { type: "lead_response", name: "Lead Response", desc: "Answers, qualifies, and books every new lead in seconds, 24/7.", categories: ["lead response", "lead", "missed call"] },
  { type: "follow_up", name: "Follow-Up & Reactivation", desc: "Works quiet leads and dormant customers until they convert or opt out.", categories: ["follow", "reactivation", "dormant"] },
  { type: "scheduling", name: "Scheduling & Dispatch", desc: "Books, confirms, reshuffles the calendar, and fills no-show gaps.", categories: ["schedul", "dispatch", "no-show", "no show"] },
  { type: "quote_invoice", name: "Quote & Invoice", desc: "Chases open quotes and unpaid invoices on a schedule.", categories: ["quote", "invoice"] },
  { type: "reviews", name: "Reviews & Reputation", desc: "Requests a review after every completed job and routes the responses.", categories: ["review", "reputation", "repeat"] },
];

const AGENT_LABEL: Record<string, string> = Object.fromEntries(AGENT_DEFS.map((a) => [a.type, a.name]));

function agentForCategory(category: string): AgentDef | null {
  const c = (category || "").toLowerCase();
  return AGENT_DEFS.find((a) => a.categories.some((k) => c.includes(k))) || null;
}

/* ============================ SAMPLE DATA ============================ *
 * Shown ONLY inside the locked-state blurred previews, always labeled.
 * Never mixed with real rows.
 * ==================================================================== */

const SAMPLE_ACTIVITY: ActivityRow[] = [
  { id: "s1", agent_type: "lead_response", action: "Answered + qualified inbound lead", detail: "est. $4.2K job", tone: "ok", needs_approval: false, recovered_cents: 420000, created_at: new Date(Date.now() - 4 * 60000).toISOString() },
  { id: "s2", agent_type: "scheduling", action: "Booked estimate · Thu 2:00 PM", detail: "Auto-confirmed by text", tone: "ok", needs_approval: false, recovered_cents: 0, created_at: new Date(Date.now() - 9 * 60000).toISOString() },
  { id: "s3", agent_type: "quote_invoice", action: "Follow-up sent on open quote", detail: "Quote #4471 · $3,200", tone: "accent", needs_approval: false, recovered_cents: 320000, created_at: new Date(Date.now() - 16 * 60000).toISOString() },
  { id: "s4", agent_type: "follow_up", action: "Reactivated dormant lead", detail: "Quiet 38 days · replied", tone: "accent", needs_approval: false, recovered_cents: 180000, created_at: new Date(Date.now() - 25 * 60000).toISOString() },
  { id: "s5", agent_type: "quote_invoice", action: "Invoice reminder delivered", detail: "Invoice #2210 · 14 days late", tone: "warn", needs_approval: false, recovered_cents: 185000, created_at: new Date(Date.now() - 33 * 60000).toISOString() },
];

const SAMPLE_WEEKLY = [3100, 4000, 3600, 5200, 6100, 5800, 7400, 8400].map((v, i) => ({ label: `W${i + 1}`, value: v }));

/* ============================ helpers ============================ */

const money = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${Math.round(n)}`);
const fmtFull = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const timeOf = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

/** Pull the largest dollar figure out of an insight's metric/title. */
function insightDollars(ins: Insight): number {
  const src = `${ins.metric || ""} ${ins.title || ""}`;
  const matches = src.match(/\$\s?([\d,]+(?:\.\d+)?)/g);
  if (!matches) return 0;
  return Math.max(...matches.map((m) => parseFloat(m.replace(/[$,\s]/g, "")) || 0));
}

function useCountUp(target: number, duration = 1100) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const t0 = Date.now();
    let raf = 0;
    const tick = () => {
      const p = Math.min((Date.now() - t0) / duration, 1);
      setV(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

function AreaChart({ data }: { data: { label: string; value: number }[] }) {
  const W = 640, H = 200, padX = 8, padTop = 16, padBottom = 26;
  const max = Math.max(...data.map((d) => d.value)) * 1.1 || 1;
  const innerW = W - padX * 2, innerH = H - padTop - padBottom;
  const x = (i: number) => padX + (i / Math.max(1, data.length - 1)) * innerW;
  const y = (v: number) => padTop + innerH - (v / max) * innerH;
  const line = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");
  const area = `${line} L${x(data.length - 1).toFixed(1)},${padTop + innerH} L${x(0).toFixed(1)},${padTop + innerH} Z`;
  const last = data[data.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="overflow-visible">
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a84ff" stopOpacity={0.22} />
          <stop offset="100%" stopColor="#0a84ff" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="areaLine" x1="0" y1="0" x2="1" y2="0">
          <stop stopColor="#0a84ff" /><stop offset="1" stopColor="#6a5cff" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((g, i) => (
        <line key={i} x1={padX} x2={W - padX} y1={padTop + innerH * g} y2={padTop + innerH * g} stroke="rgba(0,0,0,0.06)" strokeWidth={1} />
      ))}
      <path d={area} fill="url(#areaFill)" />
      <path d={line} fill="none" stroke="url(#areaLine)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {data.length > 0 && <circle cx={x(data.length - 1)} cy={y(last.value)} r={4} fill="#0a84ff" />}
      {data.map((d, i) => (
        <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize={11} fill="#6e6e73" className="md-mono">{d.label}</text>
      ))}
    </svg>
  );
}

const PRIORITY: Record<Insight["priority"], { label: string; color: string; tint: string }> = {
  critical: { label: "Critical", color: "#e5484d", tint: "rgba(229,72,77,0.10)" },
  opportunity: { label: "Opportunity", color: "#1aa251", tint: "rgba(26,162,81,0.10)" },
  pattern: { label: "Pattern", color: "#0a84ff", tint: "rgba(10,132,255,0.10)" },
};

/* ============================ paywall modal ============================ */

function PaywallModal({
  open,
  onClose,
  preselect,
  insights,
}: {
  open: boolean;
  onClose: () => void;
  preselect: string | null;
  insights: Insight[];
}) {
  const [sel, setSel] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (open) {
      setSel(Object.fromEntries(AGENT_DEFS.map((a) => [a.type, a.type === preselect])));
    }
  }, [open, preselect]);

  const count = Object.values(sel).filter(Boolean).length;
  const all = count === AGENT_DEFS.length;
  const raw = count * AGENT_PRICE;
  const total = all ? BUNDLE_PRICE : raw;
  const savings = all ? raw - BUNDLE_PRICE : 0;

  // dollars each agent would address, from the live diagnostic
  const dollarsByAgent = useMemo(() => {
    const m: Record<string, number> = {};
    for (const ins of insights.filter((i) => !i.is_dismissed)) {
      const a = agentForCategory(ins.category);
      if (a) m[a.type] = (m[a.type] || 0) + insightDollars(ins);
    }
    return m;
  }, [insights]);

  const selectedDollars = AGENT_DEFS.reduce((s, a) => s + (sel[a.type] ? dollarsByAgent[a.type] || 0 : 0), 0);

  const checkout = () => {
    if (count === 0) return;
    if (all && STRIPE_BUNDLE_LINK) { window.open(STRIPE_BUNDLE_LINK, "_blank"); return; }
    if (count === 1) {
      const only = AGENT_DEFS.find((a) => sel[a.type])!;
      if (STRIPE_AGENT_LINKS[only.type]) { window.open(STRIPE_AGENT_LINKS[only.type], "_blank"); return; }
    }
    // multi-select without links, or links not configured yet → close the sale on a call
    window.open(CALENDLY_URL, "_blank");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="Activate agents">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/25 backdrop-blur-[2px]" />
      <div className="glass relative rounded-[28px] w-full max-w-2xl max-h-[88vh] overflow-y-auto p-6 md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight">Activate your agents</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {fmtFull(AGENT_PRICE)}/mo per agent · all five for {fmtFull(BUNDLE_PRICE)}/mo · cancel anytime
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-lg grid place-items-center text-[var(--muted)] hover:bg-black/5 transition shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="mt-6 space-y-2.5">
          {AGENT_DEFS.map((a) => {
            const on = !!sel[a.type];
            const addr = dollarsByAgent[a.type] || 0;
            return (
              <button
                key={a.type}
                onClick={() => setSel((s) => ({ ...s, [a.type]: !s[a.type] }))}
                aria-pressed={on}
                className="w-full text-left rounded-2xl px-4 py-3.5 flex items-center gap-4 transition"
                style={{
                  background: on ? "rgba(10,132,255,0.07)" : "rgba(255,255,255,0.5)",
                  border: on ? "1.5px solid var(--accent)" : "1.5px solid rgba(0,0,0,0.07)",
                }}
              >
                <span
                  className="w-5 h-5 rounded-md grid place-items-center shrink-0 transition"
                  style={on ? { background: "linear-gradient(120deg,var(--accent),var(--accent2))" } : { border: "1.5px solid rgba(0,0,0,0.2)" }}
                >
                  {on && (
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6.2 5 9l5-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  )}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="font-semibold text-sm block">{a.name}</span>
                  <span className="text-[12px] text-[var(--muted)] block truncate">{a.desc}</span>
                </span>
                {addr > 0 && (
                  <span className="shrink-0 text-[12px] font-semibold grad-text text-right">
                    addresses {money(addr)}<span className="block text-[10px] font-normal text-[var(--muted)]">in your diagnostic</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-6 rounded-2xl px-5 py-4" style={{ background: "rgba(0,0,0,0.03)" }}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-baseline gap-2.5">
                <span className="text-3xl font-semibold tracking-tight grad-text tabular-nums">{fmtFull(total)}<span className="text-sm text-[var(--muted)] font-normal">/mo</span></span>
                {savings > 0 && (
                  <>
                    <span className="text-sm text-[var(--muted)] line-through tabular-nums">{fmtFull(raw)}</span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: "linear-gradient(120deg,var(--accent),var(--accent2))" }}>Save {fmtFull(savings)}</span>
                  </>
                )}
              </div>
              {selectedDollars > 0 && (
                <p className="mt-1 text-[12px] text-[var(--muted)]">
                  Targeting <span className="font-semibold text-[var(--ink)]">{fmtFull(selectedDollars)}</span> your diagnostic already found.
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!all && (
                <button onClick={() => setSel(Object.fromEntries(AGENT_DEFS.map((a) => [a.type, true])))} className="text-[13px] font-semibold px-3.5 py-2 rounded-full border border-black/8 hover:bg-black/[0.03] transition">
                  Select all · {fmtFull(BUNDLE_PRICE)}
                </button>
              )}
              <button onClick={checkout} disabled={count === 0} className="btn-primary disabled:opacity-40">
                Activate {count > 0 ? `${count} agent${count > 1 ? "s" : ""}` : ""}
              </button>
            </div>
          </div>
        </div>
        <p className="mt-3 text-center text-[11px] text-[var(--muted)]">Agents go live within days, tuned to the data from your diagnostic. Pause or cancel anytime.</p>
      </div>
    </div>
  );
}

/* ======================= locked preview wrapper ======================= */

function LockedPanel({ children, title, sub, onUnlock }: { children: React.ReactNode; title: string; sub: string; onUnlock: () => void }) {
  return (
    <div className="relative rounded-[26px] overflow-hidden">
      <div aria-hidden className="pointer-events-none select-none" style={{ filter: "blur(6px)", opacity: 0.55 }}>
        {children}
      </div>
      <div className="absolute inset-0 grid place-items-center p-6">
        <div className="glass rounded-[24px] px-7 py-8 text-center max-w-md">
          <span className="mx-auto w-10 h-10 rounded-xl grid place-items-center" style={{ background: "linear-gradient(135deg,var(--accent),var(--accent2))" }}>
            <svg className="w-4.5 h-4.5" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
          </span>
          <h3 className="mt-4 text-lg font-semibold tracking-tight">{title}</h3>
          <p className="mt-1.5 text-sm text-[var(--muted)]">{sub}</p>
          <p className="mt-2 md-mono text-[10px] tracking-[0.14em] uppercase text-[var(--muted)]">Preview shows sample data</p>
          <button onClick={onUnlock} className="btn-primary mt-5">Activate agents · from {fmtFull(AGENT_PRICE)}/mo</button>
        </div>
      </div>
    </div>
  );
}

/* ============================ component ============================ */

export default function DashboardClient({ insights, userName, userEmail, activity, agents }: DashboardClientProps) {
  const [tab, setTab] = useState<"insights" | "agents" | "activity" | "performance">("insights");
  const [filter, setFilter] = useState<"all" | Insight["priority"]>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [resolved, setResolved] = useState<Record<string, "approved" | "skipped">>({});
  const [mounted, setMounted] = useState(false);
  const [paywall, setPaywall] = useState(false);
  const [preselect, setPreselect] = useState<string | null>(null);

  // Live agent state — seeded from props, then polls real tables.
  const [liveAgents, setLiveAgents] = useState<AgentRow[]>(agents && agents.length ? agents : []);
  const [liveActivity, setLiveActivity] = useState<ActivityRow[]>(activity && activity.length ? activity : []);
  const [busy, setBusy] = useState<string | null>(null);

  // THE GATE: unlocked when this account has purchased/provisioned agents.
  const unlocked = liveAgents.length > 0;

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let alive = true;
    let stop = false;
    async function pull() {
      try {
        const [ag, act] = await Promise.all([getAgents(), listActivity(60)]);
        if (!alive) return;
        if (ag && ag.length) {
          setLiveAgents(ag as AgentRow[]);
          setLiveActivity((act as ActivityRow[]) || []);
        } else {
          stop = true; // no purchased agents — locked mode, stop polling
        }
      } catch {
        stop = true;
      }
    }
    pull();
    const id = setInterval(() => {
      if (stop) { clearInterval(id); return; }
      if (!document.hidden) pull();
    }, 5000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  const openPaywall = useCallback((agentType: string | null) => {
    setPreselect(agentType);
    setPaywall(true);
  }, []);

  async function toggleAgent(a: AgentRow) {
    const next = a.status === "active" ? "paused" : "active";
    setLiveAgents((prev) => prev.map((x) => (x.id === a.id ? { ...x, status: next } : x)));
    setBusy(a.id);
    await setAgentStatus(a.id, next).catch(() => {});
    setBusy(null);
  }

  async function resolveAct(row: ActivityRow, decision: "approved" | "skipped") {
    setResolved((p) => ({ ...p, [row.id]: decision }));
    await resolveActivity(row.id, decision).catch(() => {});
  }

  async function runTest(type: string) {
    setBusy(type);
    try {
      await triggerAgent(type as Parameters<typeof triggerAgent>[0], {
        name: "Test Lead",
        service: "demo run",
        message: "Triggered from your dashboard to test the agent.",
        ...(userEmail ? { email: userEmail } : {}),
      });
      const act = await listActivity(60);
      setLiveActivity((act as ActivityRow[]) || []);
    } catch {}
    setBusy(null);
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const rawFirst = (userName || "there").split(" ")[0];
  const first = rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1);

  const active = insights.filter((i) => !i.is_dismissed && !dismissed.has(i.id));
  const filtered = active.filter((i) => filter === "all" || i.priority === filter);
  const counts = {
    all: active.length,
    critical: active.filter((i) => i.priority === "critical").length,
    opportunity: active.filter((i) => i.priority === "opportunity").length,
    pattern: active.filter((i) => i.priority === "pattern").length,
  };

  const recoverableFound = useMemo(() => active.reduce((s, i) => s + insightDollars(i), 0), [active]);

  async function handleDismiss(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setDismissed((p) => new Set([...p, id]));
    await dismissInsight(id);
  }

  /* ---- real per-agent rollups (unlocked mode) ---- */
  const byAgent = liveAgents.map((a) => {
    const rows = liveActivity.filter((r) => r.agent_type === a.type);
    const on = a.status === "active";
    return {
      ...a,
      on,
      actions: rows.length,
      recovered: rows.reduce((s, r) => s + r.recovered_cents, 0) / 100,
    };
  });
  const maxActions = Math.max(1, ...byAgent.map((a) => a.actions));
  const maxRecovered = Math.max(1, ...byAgent.map((a) => a.recovered));
  const recovered = byAgent.reduce((s, a) => s + a.recovered, 0);
  const handled = byAgent.reduce((s, a) => s + a.actions, 0);
  const activeAgents = byAgent.filter((a) => a.on).length;

  /* ---- weekly chart from REAL activity (last 8 weeks) ---- */
  const weekly = useMemo(() => {
    const now = Date.now();
    const wk = 7 * 24 * 3600 * 1000;
    const buckets = Array.from({ length: 8 }, (_, i) => ({ label: `W${i + 1}`, value: 0 }));
    for (const r of liveActivity) {
      const age = now - new Date(r.created_at).getTime();
      const idx = 7 - Math.floor(age / wk);
      if (idx >= 0 && idx < 8) buckets[idx].value += r.recovered_cents / 100;
    }
    return buckets;
  }, [liveActivity]);

  const heroValue = useCountUp(Math.round(unlocked ? recovered : recoverableFound));
  const pending = liveActivity.filter((r) => r.needs_approval && !resolved[r.id] && r.status !== "approved" && r.status !== "skipped").length;
  const latest = liveActivity[0];
  const working = unlocked && latest ? Date.now() - new Date(latest.created_at).getTime() < 25000 : false;

  return (
    <div className="relative min-h-screen text-[var(--ink)] antialiased">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />

      <style jsx global>{`
        :root { --ink:#1d1d1f; --muted:#6e6e73; --field:#f5f5f7; --accent:#0a84ff; --accent2:#6a5cff; }
        .md-root { font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text","Inter",system-ui,sans-serif; letter-spacing:-0.01em; }
        .md-mono { font-family:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace; letter-spacing:0; }
        .grad-text { background:linear-gradient(120deg,var(--accent),var(--accent2)); -webkit-background-clip:text; background-clip:text; color:transparent; }
        .glass { position:relative; background:linear-gradient(135deg,rgba(255,255,255,0.72),rgba(255,255,255,0.42)); backdrop-filter:blur(22px) saturate(180%); -webkit-backdrop-filter:blur(22px) saturate(180%); border:1px solid rgba(255,255,255,0.7); box-shadow:0 10px 40px rgba(20,24,40,0.08), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(255,255,255,0.25); }
        .glass::before { content:""; position:absolute; inset:0; border-radius:inherit; background:linear-gradient(135deg,rgba(255,255,255,0.5),transparent 42%); pointer-events:none; }
        .glass-lift { transition:transform .4s cubic-bezier(.2,.8,.2,1), box-shadow .4s cubic-bezier(.2,.8,.2,1); }
        .glass-lift:hover { transform:translateY(-3px); box-shadow:0 20px 56px rgba(20,24,40,0.12), inset 0 1px 0 rgba(255,255,255,0.9); }
        .btn-primary { display:inline-flex; align-items:center; gap:.5rem; font-size:.875rem; font-weight:600; color:#fff; padding:.6rem 1.1rem; border-radius:999px; background:linear-gradient(120deg,var(--accent),var(--accent2)); box-shadow:0 8px 24px rgba(10,132,255,.32), inset 0 1px 0 rgba(255,255,255,.4); transition:transform .2s ease, filter .2s ease; }
        .btn-primary:hover { transform:translateY(-1px); filter:brightness(1.05); }
        .seg { background:rgba(255,255,255,0.5); border:1px solid rgba(0,0,0,0.06); border-radius:999px; padding:3px; backdrop-filter:blur(12px); }
        .seg-btn { padding:.4rem .85rem; border-radius:999px; font-size:.8rem; font-weight:600; color:var(--muted); transition:all .2s ease; }
        .seg-btn.on { background:#fff; color:var(--ink); box-shadow:0 1px 4px rgba(0,0,0,.08); }
        .md-mount { opacity:0; transform:translateY(14px); transition:opacity .6s cubic-bezier(.2,.8,.2,1), transform .6s cubic-bezier(.2,.8,.2,1); }
        .md-mount.in { opacity:1; transform:none; }
        .live-dot { width:7px; height:7px; border-radius:999px; background:#28c840; animation:mpulse 2s infinite; }
        .live-dot.idle { background:#b8b8bd; animation:none; }
        .barfill { height:8px; border-radius:999px; background:linear-gradient(90deg,var(--accent),var(--accent2)); transition:width .8s cubic-bezier(.2,.8,.2,1); }
        .scan { position:relative; height:5px; border-radius:999px; background:rgba(0,0,0,0.06); overflow:hidden; }
        .scan.on::after { content:""; position:absolute; top:0; bottom:0; left:-45%; width:45%; border-radius:999px; background:linear-gradient(90deg,transparent,var(--accent),var(--accent2),transparent); animation:scan 1.3s ease-in-out infinite; }
        @keyframes scan { 0%{left:-45%} 100%{left:100%} }
        @keyframes mpulse { 0%{box-shadow:0 0 0 0 rgba(40,200,64,.5)} 70%{box-shadow:0 0 0 7px rgba(40,200,64,0)} 100%{box-shadow:0 0 0 0 rgba(40,200,64,0)} }
        @keyframes mdrift { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(28px,-36px) scale(1.07)} }
        @media (prefers-reduced-motion: no-preference){ .md-blob{animation:mdrift 22s ease-in-out infinite} }
        @media (prefers-reduced-motion: reduce){ .md-mount{opacity:1!important;transform:none!important} }
        *:focus-visible { outline:2px solid var(--accent); outline-offset:3px; border-radius:6px; }
      `}</style>

      <div aria-hidden className="fixed inset-0 z-0 overflow-hidden" style={{ background: "var(--field)" }}>
        <div className="md-blob absolute -top-32 -left-24 w-[560px] h-[560px] rounded-full" style={{ background: "#bcd4ff", opacity: 0.45, filter: "blur(130px)" }} />
        <div className="md-blob absolute top-40 -right-32 w-[520px] h-[520px] rounded-full" style={{ background: "#e2d4ff", opacity: 0.4, filter: "blur(130px)", animationDelay: "-7s" }} />
        <div className="md-blob absolute bottom-0 left-1/3 w-[480px] h-[480px] rounded-full" style={{ background: "#cdeede", opacity: 0.36, filter: "blur(140px)", animationDelay: "-13s" }} />
      </div>

      <PaywallModal open={paywall} onClose={() => setPaywall(false)} preselect={preselect} insights={insights} />

      <div className="md-root relative z-10 max-w-6xl mx-auto px-5 md:px-7 py-7 md:py-9">

        {/* ------------------------------------------------ header */}
        <div className={`md-mount ${mounted ? "in" : ""} flex items-start justify-between gap-4 mb-7`}>
          <div>
            <h1 className="text-2xl md:text-[28px] font-semibold tracking-tight">{greeting}, {first}</h1>
            <div className="mt-1.5 flex items-center gap-4 text-sm text-[var(--muted)]">
              {unlocked ? (
                <span className="inline-flex items-center gap-1.5"><span className={`live-dot ${activeAgents ? "" : "idle"}`} /> {activeAgents} agent{activeAgents === 1 ? "" : "s"} working</span>
              ) : (
                <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full" style={{ background: "linear-gradient(120deg,var(--accent),var(--accent2))" }} /> Diagnostic complete</span>
              )}
              {counts.critical > 0 && (
                <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full" style={{ background: "#e5484d" }} /> {counts.critical} critical</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!unlocked && active.length > 0 && (
              <button onClick={() => openPaywall(null)} className="btn-primary">Activate agents</button>
            )}
            <Link href="/upload" className={unlocked || active.length === 0 ? "btn-primary" : "text-sm font-semibold px-4 py-2.5 rounded-full border border-black/8 hover:bg-black/[0.03] transition"}>
              Upload data
            </Link>
          </div>
        </div>

        {/* ------------------------------------------------ stat strip */}
        <div className={`md-mount ${mounted ? "in" : ""} grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7`} style={{ transitionDelay: "60ms" }}>
          <div className="glass rounded-[22px] p-5">
            <div className="md-mono text-[11px] tracking-[0.12em] uppercase text-[var(--muted)]">
              {unlocked ? "Recovered · period" : "Recoverable found"}
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight grad-text tabular-nums">{money(heroValue)}</div>
            <div className="mt-1 text-[12px] text-[var(--muted)]">
              {unlocked ? `across ${activeAgents} agent${activeAgents === 1 ? "" : "s"}` : `across ${counts.all} leak${counts.all === 1 ? "" : "s"} in your data`}
            </div>
          </div>
          {unlocked ? (
            <div className="glass rounded-[22px] p-5">
              <div className="md-mono text-[11px] tracking-[0.12em] uppercase text-[var(--muted)]">Actions logged</div>
              <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{handled}</div>
              <div className="mt-1 text-[12px] text-[var(--muted)]">most recent first</div>
            </div>
          ) : (
            <div className="glass rounded-[22px] p-5">
              <div className="md-mono text-[11px] tracking-[0.12em] uppercase text-[var(--muted)]">Critical leaks</div>
              <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums" style={{ color: counts.critical ? "#e5484d" : undefined }}>{counts.critical}</div>
              <div className="mt-1 text-[12px] text-[var(--muted)]">bleeding right now</div>
            </div>
          )}
          <div className="glass rounded-[22px] p-5">
            <div className="md-mono text-[11px] tracking-[0.12em] uppercase text-[var(--muted)]">{unlocked ? "Avg response" : "Agent response time"}</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">11s</div>
            <div className="mt-1 text-[12px] text-[var(--muted)]">to new leads</div>
          </div>
          <div className="glass rounded-[22px] p-5">
            <div className="md-mono text-[11px] tracking-[0.12em] uppercase text-[var(--muted)]">Open insights</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{counts.all}</div>
            <div className="mt-1 text-[12px] text-[var(--muted)]">{counts.critical} need attention</div>
          </div>
        </div>

        {/* ------------------------------------------------ tabs */}
        <div className={`md-mount ${mounted ? "in" : ""} flex items-center gap-2 mb-6`} style={{ transitionDelay: "120ms" }}>
          <div className="seg inline-flex flex-wrap">
            <button onClick={() => setTab("insights")} className={`seg-btn ${tab === "insights" ? "on" : ""}`}>
              Insights{counts.all > 0 && <span className="ml-1.5 text-[var(--muted)]">{counts.all}</span>}
            </button>
            <button onClick={() => setTab("agents")} className={`seg-btn ${tab === "agents" ? "on" : ""}`}>
              Agents{!unlocked && <span className="ml-1.5">🔒</span>}
            </button>
            <button onClick={() => setTab("activity")} className={`seg-btn ${tab === "activity" ? "on" : ""} inline-flex items-center gap-1.5`}>
              Activity {unlocked ? <span className={`live-dot ${working ? "" : "idle"}`} /> : <span>🔒</span>}
            </button>
            <button onClick={() => setTab("performance")} className={`seg-btn ${tab === "performance" ? "on" : ""}`}>
              Performance{!unlocked && <span className="ml-1.5">🔒</span>}
            </button>
          </div>
        </div>

        {/* ================================================= INSIGHTS */}
        {tab === "insights" && (
          <div className={`md-mount ${mounted ? "in" : ""}`} style={{ transitionDelay: "160ms" }}>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="text-lg font-semibold tracking-tight">Where your business is leaking</h2>
              <div className="seg inline-flex flex-wrap">
                {(["all", "critical", "opportunity", "pattern"] as const).map((f) => (
                  <button key={f} onClick={() => setFilter(f)} className={`seg-btn ${filter === f ? "on" : ""}`}>
                    {f === "all" ? `All ${counts.all}` : `${PRIORITY[f].label} ${counts[f]}`}
                  </button>
                ))}
              </div>
            </div>

            {active.length === 0 ? (
              <div className="glass rounded-[26px] p-12 text-center">
                <h3 className="text-lg font-semibold tracking-tight">No insights yet</h3>
                <p className="mt-2 text-[var(--muted)] text-sm">Upload your business data to run the free diagnostic.</p>
                <Link href="/upload" className="btn-primary mt-5 inline-flex">Upload data</Link>
              </div>
            ) : filtered.length === 0 ? (
              <div className="glass rounded-[26px] p-12 text-center">
                <h3 className="text-lg font-semibold tracking-tight">Nothing in this filter</h3>
                <p className="mt-2 text-[var(--muted)] text-sm">Switch filters or upload fresh data.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((ins) => {
                  const cfg = PRIORITY[ins.priority];
                  const open = expanded === ins.id;
                  const agent = agentForCategory(ins.category);
                  const owned = agent ? liveAgents.find((a) => a.type === agent.type) : undefined;
                  return (
                    <div key={ins.id} onClick={() => setExpanded(open ? null : ins.id)} className="glass glass-lift rounded-[22px] overflow-hidden cursor-pointer group">
                      <div className="relative pl-5 pr-4 py-4">
                        <span className="absolute left-0 top-0 bottom-0 w-1" style={{ background: cfg.color, opacity: 0.85 }} />
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: cfg.tint, color: cfg.color }}>
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />{cfg.label}
                              </span>
                              <span className="text-[11px] text-[var(--muted)] bg-black/5 px-2 py-1 rounded-full">{ins.category}</span>
                              {ins.metric && <span className="ml-auto text-sm font-semibold grad-text">{ins.metric}</span>}
                            </div>
                            <h3 className="mt-2.5 font-semibold tracking-tight leading-snug">{ins.title}</h3>
                            {open ? (
                              <div className="mt-3 space-y-3">
                                <p className="text-sm leading-relaxed text-[var(--muted)]">{ins.body}</p>
                                {agent && (
                                  <div className="rounded-2xl px-4 py-3.5 flex items-center justify-between gap-4 flex-wrap" style={{ background: "rgba(10,132,255,0.07)", border: "1px solid rgba(10,132,255,0.16)" }}>
                                    <div className="min-w-0">
                                      <p className="text-[11px] font-semibold tracking-wide grad-text">THE FIX: {agent.name.toUpperCase()} AGENT</p>
                                      <p className="mt-1 text-sm text-[var(--ink)]/80">{agent.desc}</p>
                                    </div>
                                    {owned ? (
                                      owned.status === "active" ? (
                                        <span className="text-[12px] font-semibold shrink-0" style={{ color: "#1aa251" }}>✓ Working on it</span>
                                      ) : (
                                        <button onClick={(e) => { e.stopPropagation(); toggleAgent(owned); }} className="btn-primary shrink-0 !text-[13px]">Resume agent</button>
                                      )
                                    ) : (
                                      <button onClick={(e) => { e.stopPropagation(); openPaywall(agent.type); }} className="btn-primary shrink-0 !text-[13px]">
                                        Deploy · {fmtFull(AGENT_PRICE)}/mo
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="mt-1 text-xs text-[var(--muted)]">Tap to see the fix</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button onClick={(e) => handleDismiss(ins.id, e)} aria-label="Dismiss insight" className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg grid place-items-center text-[var(--muted)] hover:bg-black/5 transition">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                            <svg className={`w-4 h-4 text-[var(--muted)] transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* bottom-of-list conversion bar (locked only) */}
                {!unlocked && recoverableFound > 0 && (
                  <div className="glass rounded-[22px] px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="font-semibold tracking-tight">Your diagnostic found <span className="grad-text">{fmtFull(recoverableFound)}</span> in recoverable revenue.</p>
                      <p className="mt-0.5 text-sm text-[var(--muted)]">The agents chase it automatically. From {fmtFull(AGENT_PRICE)}/mo, cancel anytime.</p>
                    </div>
                    <button onClick={() => openPaywall(null)} className="btn-primary shrink-0">Activate agents</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================================================= AGENTS */}
        {tab === "agents" && (
          <div className={`md-mount ${mounted ? "in" : ""}`} style={{ transitionDelay: "160ms" }}>
            {unlocked ? (
              <>
                <h2 className="text-lg font-semibold tracking-tight mb-4">Your agents</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {byAgent.map((a) => (
                    <div key={a.id} className="glass rounded-[22px] p-5">
                      <div className="flex items-start justify-between">
                        <span className="w-9 h-9 rounded-xl grid place-items-center" style={{ background: a.on ? "linear-gradient(135deg,var(--accent),var(--accent2))" : "rgba(0,0,0,0.08)" }}>
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: a.on ? "#fff" : "var(--muted)" }} />
                        </span>
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={a.on ? { background: "rgba(40,200,64,0.12)", color: "#1aa251" } : { background: "rgba(0,0,0,0.06)", color: "var(--muted)" }}>
                          {a.on ? "Active" : "Paused"}
                        </span>
                      </div>
                      <h3 className="mt-4 font-semibold tracking-tight leading-snug">{a.name}</h3>
                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span className="text-[var(--muted)]">{a.actions} actions</span>
                        <span className="font-semibold tabular-nums">{money(a.recovered)}</span>
                      </div>
                      <button onClick={() => toggleAgent(a)} disabled={busy === a.id} className="mt-4 w-full text-sm font-semibold py-2 rounded-full border border-black/8 hover:bg-black/[0.03] transition disabled:opacity-50">
                        {busy === a.id ? "…" : a.on ? "Pause agent" : "Resume agent"}
                      </button>
                      <button onClick={() => runTest(a.type)} disabled={busy === a.type || !a.on} className="mt-2 w-full text-[12px] font-semibold py-1.5 rounded-full text-[var(--accent)] hover:bg-[rgba(10,132,255,0.06)] transition disabled:opacity-40">
                        {busy === a.type ? "Running…" : "Run a test action"}
                      </button>
                    </div>
                  ))}
                </div>
                {liveAgents.length < AGENT_DEFS.length && (
                  <div className="glass rounded-[22px] mt-4 px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="font-semibold tracking-tight">Add more agents</p>
                      <p className="mt-0.5 text-sm text-[var(--muted)]">{AGENT_DEFS.length - liveAgents.length} more available · all five for {fmtFull(BUNDLE_PRICE)}/mo</p>
                    </div>
                    <button onClick={() => openPaywall(null)} className="btn-primary shrink-0">Add agents</button>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <h2 className="text-lg font-semibold tracking-tight">Deploy agents against your leaks</h2>
                  <span className="text-sm text-[var(--muted)]">{fmtFull(AGENT_PRICE)}/mo each · all five {fmtFull(BUNDLE_PRICE)}/mo</span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {AGENT_DEFS.map((a) => {
                    const addressed = active.filter((i) => agentForCategory(i.category)?.type === a.type);
                    const dollars = addressed.reduce((s, i) => s + insightDollars(i), 0);
                    return (
                      <div key={a.type} className="glass glass-lift rounded-[22px] p-5 flex flex-col">
                        <div className="flex items-start justify-between">
                          <span className="w-9 h-9 rounded-xl grid place-items-center" style={{ background: "linear-gradient(135deg,var(--accent),var(--accent2))" }}>
                            <span className="w-2.5 h-2.5 rounded-full bg-white/90" />
                          </span>
                          {dollars > 0 && (
                            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full grad-text" style={{ background: "rgba(10,132,255,0.08)" }}>
                              addresses {money(dollars)}
                            </span>
                          )}
                        </div>
                        <h3 className="mt-4 font-semibold tracking-tight leading-snug">{a.name}</h3>
                        <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--muted)] flex-1">{a.desc}</p>
                        {addressed.length > 0 && (
                          <p className="mt-2 text-[11px] text-[var(--muted)]">Fixes {addressed.length} finding{addressed.length > 1 ? "s" : ""} in your diagnostic</p>
                        )}
                        <button onClick={() => openPaywall(a.type)} className="btn-primary mt-4 justify-center">
                          Deploy · {fmtFull(AGENT_PRICE)}/mo
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div className="glass rounded-[22px] mt-4 px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-semibold tracking-tight">Want everything handled? All five agents for <span className="grad-text">{fmtFull(BUNDLE_PRICE)}/mo</span></p>
                    <p className="mt-0.5 text-sm text-[var(--muted)]">Instead of {fmtFull(AGENT_DEFS.length * AGENT_PRICE)}. Cancel anytime.</p>
                  </div>
                  <button onClick={() => openPaywall(null)} className="btn-primary shrink-0">Get the bundle</button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ================================================= ACTIVITY */}
        {tab === "activity" && (
          <div className={`md-mount ${mounted ? "in" : ""} space-y-5`} style={{ transitionDelay: "160ms" }}>
            {unlocked ? (
              <>
                <div className="glass rounded-[26px] p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`live-dot ${working ? "" : "idle"}`} />
                    <span className="text-sm font-semibold">{working ? "Working now" : "Agents idle"}</span>
                    <span className="md-mono text-[11px] text-[var(--muted)] ml-auto">live · updates every 5s</span>
                  </div>
                  <div className="rounded-2xl px-4 py-4" style={{ background: "rgba(0,0,0,0.025)", border: "1px solid rgba(0,0,0,0.05)" }}>
                    <div className="flex items-center gap-2 mb-3 min-w-0">
                      <span className="md-mono text-[11px] text-[var(--muted)] shrink-0">{latest ? (AGENT_LABEL[latest.agent_type] ?? latest.agent_type) : "Adunda"}</span>
                      <span className="md-mono text-[11px] text-[var(--muted)] shrink-0">›</span>
                      <span className="text-sm font-medium truncate">{latest ? latest.action : "Waiting for the next action…"}</span>
                    </div>
                    <div className={`scan ${working ? "on" : ""}`} />
                    <div className="mt-3 flex items-center gap-5 text-[12px] text-[var(--muted)]">
                      <span><span className="font-semibold text-[var(--ink)] tabular-nums">{handled}</span> actions</span>
                      <span><span className="font-semibold text-[var(--ink)] tabular-nums">{activeAgents}</span> live agents</span>
                      <span><span className="font-semibold text-[var(--ink)] tabular-nums">{pending}</span> need approval</span>
                    </div>
                  </div>
                </div>

                <div className="glass rounded-[26px] overflow-hidden">
                  <div className="flex items-center gap-3 px-6 py-4 border-b border-black/5">
                    <h2 className="font-semibold tracking-tight">Activity feed</h2>
                    <span className="inline-flex items-center gap-1.5 md-mono text-[11px] text-[var(--muted)] ml-auto"><span className={`live-dot ${working ? "" : "idle"}`} /> live</span>
                  </div>
                  <div className="divide-y divide-black/5 max-h-[440px] overflow-y-auto">
                    {liveActivity.length === 0 ? (
                      <div className="px-6 py-10 text-center text-sm text-[var(--muted)]">No actions yet. Run a test from the Agents tab, or wait for the next event.</div>
                    ) : liveActivity.map((r) => {
                      const state = resolved[r.id] || (r.status === "approved" ? "approved" : r.status === "skipped" ? "skipped" : undefined);
                      const pendingRow = r.needs_approval && !state;
                      return (
                        <div key={r.id} className="px-6 py-3.5">
                          <div className="flex items-center gap-4">
                            <span className="md-mono text-[11px] text-[var(--muted)] w-12 shrink-0">{timeOf(r.created_at)}</span>
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: r.tone === "warn" ? "#e0922f" : r.tone === "accent" ? "var(--accent)" : "#28c840" }} />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">{r.action}</p>
                              <p className="text-[12px] text-[var(--muted)] truncate">{AGENT_LABEL[r.agent_type] ?? r.agent_type}{r.detail ? ` · ${r.detail}` : ""}</p>
                            </div>
                            {pendingRow && (
                              <div className="flex items-center gap-2 shrink-0">
                                <button onClick={() => resolveAct(r, "approved")} className="btn-primary !py-1.5 !px-3 !text-[13px]">Approve</button>
                                <button onClick={() => resolveAct(r, "skipped")} className="text-[13px] font-semibold px-3 py-1.5 rounded-full border border-black/8 hover:bg-black/[0.03] transition">Skip</button>
                              </div>
                            )}
                            {r.needs_approval && state && (
                              <span className="text-[12px] font-semibold shrink-0" style={{ color: state === "approved" ? "#1aa251" : "var(--muted)" }}>{state === "approved" ? "✓ Approved" : "Skipped"}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <LockedPanel
                title="Watch your agents work, live"
                sub="Every call answered, quote chased, and invoice reminded shows up here in real time, with approve/skip control on anything sensitive."
                onUnlock={() => openPaywall(null)}
              >
                <div className="glass rounded-[26px] overflow-hidden">
                  <div className="flex items-center gap-3 px-6 py-4 border-b border-black/5">
                    <h2 className="font-semibold tracking-tight">Activity feed</h2>
                  </div>
                  <div className="divide-y divide-black/5">
                    {SAMPLE_ACTIVITY.map((r) => (
                      <div key={r.id} className="px-6 py-3.5 flex items-center gap-4">
                        <span className="md-mono text-[11px] text-[var(--muted)] w-12 shrink-0">{timeOf(r.created_at)}</span>
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: r.tone === "warn" ? "#e0922f" : r.tone === "accent" ? "var(--accent)" : "#28c840" }} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{r.action}</p>
                          <p className="text-[12px] text-[var(--muted)] truncate">{AGENT_LABEL[r.agent_type]}{r.detail ? ` · ${r.detail}` : ""}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </LockedPanel>
            )}
          </div>
        )}

        {/* ================================================= PERFORMANCE */}
        {tab === "performance" && (
          <div className={`md-mount ${mounted ? "in" : ""} space-y-5`} style={{ transitionDelay: "160ms" }}>
            {unlocked ? (
              <>
                <div className="glass rounded-[26px] p-6">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="font-semibold tracking-tight">Recovered over time</h2>
                    <span className="text-sm font-semibold grad-text">{money(recovered)} total</span>
                  </div>
                  <p className="text-[12px] text-[var(--muted)] mb-4">Revenue the agents recovered, by week</p>
                  <AreaChart data={weekly} />
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div className="glass rounded-[26px] p-6">
                    <h2 className="font-semibold tracking-tight mb-4">Actions by agent</h2>
                    <div className="space-y-4">
                      {byAgent.map((a) => (
                        <div key={a.id}>
                          <div className="flex items-center justify-between text-sm mb-1.5">
                            <span className="font-medium">{a.name}</span>
                            <span className="md-mono text-[12px] text-[var(--muted)]">{a.actions}</span>
                          </div>
                          <div className="h-2 rounded-full bg-black/[0.06] overflow-hidden">
                            <div className="barfill" style={{ width: `${(a.actions / maxActions) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="glass rounded-[26px] p-6">
                    <h2 className="font-semibold tracking-tight mb-4">Recovered by agent</h2>
                    <div className="space-y-4">
                      {byAgent.map((a) => (
                        <div key={a.id}>
                          <div className="flex items-center justify-between text-sm mb-1.5">
                            <span className="font-medium">{a.name}</span>
                            <span className="md-mono text-[12px] text-[var(--muted)]">{money(a.recovered)}</span>
                          </div>
                          <div className="h-2 rounded-full bg-black/[0.06] overflow-hidden">
                            <div className="barfill" style={{ width: `${(a.recovered / maxRecovered) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <LockedPanel
                title="Track every dollar recovered"
                sub="Weekly recovery totals, per-agent performance, and proof of what each $250 agent is returning. The chart pays for the subscription."
                onUnlock={() => openPaywall(null)}
              >
                <div className="glass rounded-[26px] p-6">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="font-semibold tracking-tight">Recovered over time</h2>
                    <span className="text-sm font-semibold grad-text">{money(SAMPLE_WEEKLY.reduce((s, d) => s + d.value, 0))} total</span>
                  </div>
                  <p className="text-[12px] text-[var(--muted)] mb-4">Revenue the agents recovered, by week</p>
                  <AreaChart data={SAMPLE_WEEKLY} />
                </div>
              </LockedPanel>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
