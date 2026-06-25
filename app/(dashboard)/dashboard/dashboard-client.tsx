"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { dismissInsight } from "@/app/actions/insights";

/* ------------------------------------------------------------------ *
 * Meridian — dashboard  (app/(dashboard)/dashboard/dashboard-client.tsx)
 * Apple liquid-glass, matching the landing page. Two tabs:
 *   • Insights  — the diagnostic (REAL data from the insights table)
 *   • Activity  — what the agent is doing + recovered + pause/approve
 *
 * Drop-in replacement: same props page.tsx already passes. The Insights
 * tab keeps your live data + dismiss/filter behavior. The Activity tab
 * and the top metrics run on DEMO data until the agent tables exist —
 * every stub is marked below.
 * ------------------------------------------------------------------ */

interface Insight {
  id: string;
  priority: "critical" | "opportunity" | "pattern";
  category: string;
  title: string;
  body: string;
  metric: string | null;
  is_dismissed: boolean;
}

interface DashboardClientProps {
  insights: Insight[];
  userName: string;
  // accepted so the existing page.tsx still type-checks; unused for now
  goals?: unknown[];
  stats?: Record<string, unknown>;
  records?: unknown[];
}

/* ============================ DEMO DATA ============================ *
 * Replace with a real `agent_activity` / `agents` table once agents
 * are live. Until then this is what makes the Activity tab render.
 * ================================================================== */

type AgentStatus = "active" | "paused";

const DEMO_AGENTS: { id: string; name: string; status: AgentStatus; handledToday: number; recovered: number }[] = [
  { id: "lead", name: "Lead Response", status: "active", handledToday: 42, recovered: 8400 },
  { id: "followup", name: "Follow-Up & Reactivation", status: "active", handledToday: 18, recovered: 6200 },
  { id: "schedule", name: "Scheduling & Dispatch", status: "paused", handledToday: 0, recovered: 0 },
  { id: "invoice", name: "Quote & Invoice", status: "active", handledToday: 11, recovered: 3800 },
];

const DEMO_ACTIVITY: {
  id: string; time: string; agent: string; action: string; detail: string;
  tone: "ok" | "accent" | "warn"; needsApproval?: boolean;
}[] = [
  { id: "a1", time: "09:14:02", agent: "Lead Response", action: "Answered + qualified inbound lead", detail: "Northgate Landscaping · est. $4.2K", tone: "ok" },
  { id: "a2", time: "09:13:41", agent: "Scheduling", action: "Booked estimate · Thu 2:00 PM", detail: "Auto-confirmed by text", tone: "ok" },
  { id: "a3", time: "09:11:30", agent: "Quote & Invoice", action: "Drafted follow-up on open quote", detail: "Quote #4471 · $3,200 · awaiting your OK", tone: "accent", needsApproval: true },
  { id: "a4", time: "09:08:55", agent: "Follow-Up", action: "Reactivated dormant lead", detail: "Quiet 38 days · replied, wants a call", tone: "accent" },
  { id: "a5", time: "09:05:12", agent: "Quote & Invoice", action: "Sent invoice reminder", detail: "Invoice #2210 · 14 days late · $1,850", tone: "warn" },
  { id: "a6", time: "08:52:09", agent: "Lead Response", action: "Routed after-hours call to voicemail-to-text", detail: "Summary sent to your phone", tone: "ok" },
  { id: "a7", time: "08:40:33", agent: "Follow-Up", action: "Third touch scheduled", detail: "Maple Court HOA · no reply yet", tone: "accent" },
];

// 8-week recovered trend for the sparkline (stub)
const DEMO_TREND = [3.1, 4.0, 3.6, 5.2, 6.1, 5.8, 7.4, 8.4];

/* ============================ helpers ============================ */

const money = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${Math.round(n)}`);

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

function Sparkline({ data }: { data: number[] }) {
  const w = 120, h = 36, max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / (max - min || 1)) * (h - 6) - 3;
    return [x, y];
  });
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a84ff" stopOpacity={0.28} />
          <stop offset="100%" stopColor="#0a84ff" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark)" />
      <path d={line} fill="none" stroke="url(#mgrad)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={2.6} fill="#0a84ff" />
    </svg>
  );
}

const PRIORITY: Record<Insight["priority"], { label: string; color: string; tint: string }> = {
  critical: { label: "Critical", color: "#e5484d", tint: "rgba(229,72,77,0.10)" },
  opportunity: { label: "Opportunity", color: "#1aa251", tint: "rgba(26,162,81,0.10)" },
  pattern: { label: "Pattern", color: "#0a84ff", tint: "rgba(10,132,255,0.10)" },
};

/* ============================ component ============================ */

export default function DashboardClient({ insights, userName }: DashboardClientProps) {
  const [tab, setTab] = useState<"insights" | "activity">("insights");
  const [filter, setFilter] = useState<"all" | Insight["priority"]>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [agentState, setAgentState] = useState<Record<string, AgentStatus>>(
    Object.fromEntries(DEMO_AGENTS.map((a) => [a.id, a.status]))
  );
  const [resolved, setResolved] = useState<Record<string, "approved" | "skipped">>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const first = (userName || "there").split(" ")[0];

  const active = insights.filter((i) => !i.is_dismissed && !dismissed.has(i.id));
  const filtered = active.filter((i) => filter === "all" || i.priority === filter);
  const counts = {
    all: active.length,
    critical: active.filter((i) => i.priority === "critical").length,
    opportunity: active.filter((i) => i.priority === "opportunity").length,
    pattern: active.filter((i) => i.priority === "pattern").length,
  };

  async function handleDismiss(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setDismissed((p) => new Set([...p, id]));
    await dismissInsight(id);
  }

  // top metrics (DEMO except open insights)
  const recovered = DEMO_AGENTS.reduce((s, a) => s + (agentState[a.id] === "active" ? a.recovered : 0), 0);
  const handled = DEMO_AGENTS.reduce((s, a) => s + (agentState[a.id] === "active" ? a.handledToday : 0), 0);
  const activeAgents = DEMO_AGENTS.filter((a) => agentState[a.id] === "active").length;
  const recoveredAnim = useCountUp(recovered);

  return (
    <div className="relative min-h-screen text-[var(--ink)] antialiased">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />

      <style jsx global>{`
        :root {
          --ink: #1d1d1f; --muted: #6e6e73; --field: #f5f5f7;
          --accent: #0a84ff; --accent2: #6a5cff;
        }
        .md-root {
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Inter", system-ui, sans-serif;
          letter-spacing: -0.01em;
        }
        .md-mono { font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: 0; }
        .grad-text { background: linear-gradient(120deg, var(--accent), var(--accent2)); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .glass {
          position: relative;
          background: linear-gradient(135deg, rgba(255,255,255,0.72), rgba(255,255,255,0.42));
          backdrop-filter: blur(22px) saturate(180%); -webkit-backdrop-filter: blur(22px) saturate(180%);
          border: 1px solid rgba(255,255,255,0.7);
          box-shadow: 0 10px 40px rgba(20,24,40,0.08), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(255,255,255,0.25);
        }
        .glass::before { content:""; position:absolute; inset:0; border-radius:inherit; background:linear-gradient(135deg, rgba(255,255,255,0.5), transparent 42%); pointer-events:none; }
        .glass-lift { transition: transform .4s cubic-bezier(.2,.8,.2,1), box-shadow .4s cubic-bezier(.2,.8,.2,1); }
        .glass-lift:hover { transform: translateY(-3px); box-shadow: 0 20px 56px rgba(20,24,40,0.12), inset 0 1px 0 rgba(255,255,255,0.9); }
        .btn-primary { display:inline-flex; align-items:center; gap:.5rem; font-size:.875rem; font-weight:600; color:#fff; padding:.6rem 1.1rem; border-radius:999px; background:linear-gradient(120deg, var(--accent), var(--accent2)); box-shadow:0 8px 24px rgba(10,132,255,.32), inset 0 1px 0 rgba(255,255,255,.4); transition:transform .2s ease, filter .2s ease; }
        .btn-primary:hover { transform: translateY(-1px); filter: brightness(1.05); }
        .seg { background: rgba(255,255,255,0.5); border:1px solid rgba(0,0,0,0.06); border-radius:999px; padding:3px; backdrop-filter: blur(12px); }
        .seg-btn { padding:.4rem .85rem; border-radius:999px; font-size:.8rem; font-weight:600; color:var(--muted); transition: all .2s ease; }
        .seg-btn.on { background:#fff; color:var(--ink); box-shadow:0 1px 4px rgba(0,0,0,.08); }
        .md-mount { opacity:0; transform: translateY(14px); transition: opacity .6s cubic-bezier(.2,.8,.2,1), transform .6s cubic-bezier(.2,.8,.2,1); }
        .md-mount.in { opacity:1; transform:none; }
        .live-dot { width:7px; height:7px; border-radius:999px; background:#28c840; animation: mpulse 2s infinite; }
        @keyframes mpulse { 0%{box-shadow:0 0 0 0 rgba(40,200,64,.5)} 70%{box-shadow:0 0 0 7px rgba(40,200,64,0)} 100%{box-shadow:0 0 0 0 rgba(40,200,64,0)} }
        @keyframes mdrift { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(28px,-36px) scale(1.07)} }
        @media (prefers-reduced-motion: no-preference) { .md-blob{ animation: mdrift 22s ease-in-out infinite; } }
        @media (prefers-reduced-motion: reduce) { .md-mount{opacity:1!important;transform:none!important} }
        *:focus-visible { outline:2px solid var(--accent); outline-offset:3px; border-radius:6px; }
      `}</style>
      <svg width="0" height="0" className="absolute"><defs>
        <linearGradient id="mgrad" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#0a84ff" /><stop offset="1" stopColor="#6a5cff" /></linearGradient>
      </defs></svg>

      {/* ambient field */}
      <div aria-hidden className="fixed inset-0 z-0 overflow-hidden" style={{ background: "var(--field)" }}>
        <div className="md-blob absolute -top-32 -left-24 w-[560px] h-[560px] rounded-full" style={{ background: "#bcd4ff", opacity: 0.45, filter: "blur(130px)" }} />
        <div className="md-blob absolute top-40 -right-32 w-[520px] h-[520px] rounded-full" style={{ background: "#e2d4ff", opacity: 0.4, filter: "blur(130px)", animationDelay: "-7s" }} />
        <div className="md-blob absolute bottom-0 left-1/3 w-[480px] h-[480px] rounded-full" style={{ background: "#cdeede", opacity: 0.36, filter: "blur(140px)", animationDelay: "-13s" }} />
      </div>

      <div className="md-root relative z-10 max-w-6xl mx-auto px-5 md:px-7 py-7 md:py-9">

        {/* Header */}
        <div className={`md-mount ${mounted ? "in" : ""} flex items-start justify-between gap-4 mb-7`}>
          <div>
            <h1 className="text-2xl md:text-[28px] font-semibold tracking-tight">{greeting}, {first}</h1>
            <div className="mt-1.5 flex items-center gap-4 text-sm text-[var(--muted)]">
              <span className="inline-flex items-center gap-1.5"><span className="live-dot" /> {activeAgents} agents working</span>
              {counts.critical > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#e5484d" }} /> {counts.critical} critical
                </span>
              )}
            </div>
          </div>
          <Link href="/upload" className="btn-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
            Upload data
          </Link>
        </div>

        {/* Top metrics */}
        <div className={`md-mount ${mounted ? "in" : ""} grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7`} style={{ transitionDelay: "60ms" }}>
          <div className="glass rounded-[22px] p-5">
            <div className="md-mono text-[11px] tracking-[0.12em] uppercase text-[var(--muted)]">Recovered · this month</div>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-2xl font-semibold tracking-tight grad-text tabular-nums">{money(recoveredAnim)}</span>
              <Sparkline data={DEMO_TREND} />
            </div>
          </div>
          <div className="glass rounded-[22px] p-5">
            <div className="md-mono text-[11px] tracking-[0.12em] uppercase text-[var(--muted)]">Actions today</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{handled}</div>
            <div className="mt-1 text-[12px] text-[var(--muted)]">across {activeAgents} agents</div>
          </div>
          <div className="glass rounded-[22px] p-5">
            <div className="md-mono text-[11px] tracking-[0.12em] uppercase text-[var(--muted)]">Avg response</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">11s</div>
            <div className="mt-1 text-[12px] text-[var(--muted)]">to new leads</div>
          </div>
          <div className="glass rounded-[22px] p-5">
            <div className="md-mono text-[11px] tracking-[0.12em] uppercase text-[var(--muted)]">Open insights</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{counts.all}</div>
            <div className="mt-1 text-[12px] text-[var(--muted)]">{counts.critical} need attention</div>
          </div>
        </div>

        {/* Tabs */}
        <div className={`md-mount ${mounted ? "in" : ""} flex items-center gap-2 mb-6`} style={{ transitionDelay: "120ms" }}>
          <div className="seg inline-flex">
            <button onClick={() => setTab("insights")} className={`seg-btn ${tab === "insights" ? "on" : ""}`}>
              Insights{counts.all > 0 && <span className="ml-1.5 text-[var(--muted)]">{counts.all}</span>}
            </button>
            <button onClick={() => setTab("activity")} className={`seg-btn ${tab === "activity" ? "on" : ""} inline-flex items-center gap-1.5`}>
              Activity <span className="live-dot" />
            </button>
          </div>
        </div>

        {/* ---------------- INSIGHTS TAB (real data) ---------------- */}
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
                <p className="mt-2 text-[var(--muted)] text-sm">Upload your business data to run the diagnostic.</p>
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
                  return (
                    <div
                      key={ins.id}
                      onClick={() => setExpanded(open ? null : ins.id)}
                      className="glass glass-lift rounded-[22px] overflow-hidden cursor-pointer group"
                    >
                      <div className="relative pl-5 pr-4 py-4">
                        <span className="absolute left-0 top-0 bottom-0 w-1" style={{ background: cfg.color, opacity: 0.85 }} />
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: cfg.tint, color: cfg.color }}>
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
                                {cfg.label}
                              </span>
                              <span className="text-[11px] text-[var(--muted)] bg-black/5 px-2 py-1 rounded-full">{ins.category}</span>
                              {ins.metric && <span className="ml-auto text-sm font-semibold grad-text">{ins.metric}</span>}
                            </div>
                            <h3 className="mt-2.5 font-semibold tracking-tight leading-snug">{ins.title}</h3>
                            {open ? (
                              <div className="mt-3 space-y-3">
                                <p className="text-sm leading-relaxed text-[var(--muted)]">{ins.body}</p>
                                <div className="rounded-2xl px-4 py-3" style={{ background: "rgba(10,132,255,0.07)", border: "1px solid rgba(10,132,255,0.16)" }}>
                                  <p className="text-[11px] font-semibold tracking-wide grad-text">MERIDIAN CAN AUTOMATE THIS</p>
                                  <p className="mt-1 text-sm text-[var(--ink)]/80">Deploy an agent to close this gap automatically — talk to us on your next check-in.</p>
                                </div>
                              </div>
                            ) : (
                              <p className="mt-1 text-xs text-[var(--muted)]">Tap to see the fix</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={(e) => handleDismiss(ins.id, e)}
                              aria-label="Dismiss insight"
                              className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg grid place-items-center text-[var(--muted)] hover:bg-black/5 transition"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                            <svg className={`w-4 h-4 text-[var(--muted)] transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ---------------- ACTIVITY TAB (demo) ---------------- */}
        {tab === "activity" && (
          <div className={`md-mount ${mounted ? "in" : ""} space-y-6`} style={{ transitionDelay: "160ms" }}>

            {/* Agent status cards */}
            <div>
              <h2 className="text-lg font-semibold tracking-tight mb-4">Your agents</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {DEMO_AGENTS.map((a) => {
                  const on = agentState[a.id] === "active";
                  return (
                    <div key={a.id} className="glass rounded-[22px] p-5">
                      <div className="flex items-start justify-between">
                        <span className="w-9 h-9 rounded-xl grid place-items-center" style={{ background: on ? "linear-gradient(135deg,var(--accent),var(--accent2))" : "rgba(0,0,0,0.08)" }}>
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: on ? "#fff" : "var(--muted)" }} />
                        </span>
                        <button
                          onClick={() => setAgentState((p) => ({ ...p, [a.id]: on ? "paused" : "active" }))}
                          className="text-[11px] font-semibold px-2.5 py-1 rounded-full transition"
                          style={on
                            ? { background: "rgba(40,200,64,0.12)", color: "#1aa251" }
                            : { background: "rgba(0,0,0,0.06)", color: "var(--muted)" }}
                        >
                          {on ? "Active" : "Paused"}
                        </button>
                      </div>
                      <h3 className="mt-4 font-semibold tracking-tight leading-snug">{a.name}</h3>
                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span className="text-[var(--muted)]">{on ? `${a.handledToday} today` : "Idle"}</span>
                        <span className="font-semibold tabular-nums">{on ? money(a.recovered) : "—"}</span>
                      </div>
                      <button
                        onClick={() => setAgentState((p) => ({ ...p, [a.id]: on ? "paused" : "active" }))}
                        className="mt-4 w-full text-sm font-semibold py-2 rounded-full border border-black/8 hover:bg-black/[0.03] transition"
                      >
                        {on ? "Pause agent" : "Resume agent"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live activity feed */}
            <div className="glass rounded-[26px] overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-black/5">
                <h2 className="font-semibold tracking-tight">Live activity</h2>
                <span className="inline-flex items-center gap-1.5 md-mono text-[11px] text-[var(--muted)] ml-auto"><span className="live-dot" /> updating</span>
              </div>
              <div className="divide-y divide-black/5">
                {DEMO_ACTIVITY.map((r) => {
                  const state = resolved[r.id];
                  return (
                    <div key={r.id} className="px-6 py-3.5">
                      <div className="flex items-center gap-4">
                        <span className="md-mono text-[11px] text-[var(--muted)] w-16 shrink-0">{r.time}</span>
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: r.tone === "warn" ? "#e0922f" : r.tone === "accent" ? "var(--accent)" : "#28c840" }} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{r.action}</p>
                          <p className="text-[12px] text-[var(--muted)] truncate">{r.agent} · {r.detail}</p>
                        </div>
                        {r.needsApproval && !state && (
                          <div className="flex items-center gap-2 shrink-0">
                            <button onClick={() => setResolved((p) => ({ ...p, [r.id]: "approved" }))} className="btn-primary !py-1.5 !px-3 !text-[13px]">Approve</button>
                            <button onClick={() => setResolved((p) => ({ ...p, [r.id]: "skipped" }))} className="text-[13px] font-semibold px-3 py-1.5 rounded-full border border-black/8 hover:bg-black/[0.03] transition">Skip</button>
                          </div>
                        )}
                        {r.needsApproval && state && (
                          <span className="text-[12px] font-semibold shrink-0" style={{ color: state === "approved" ? "#1aa251" : "var(--muted)" }}>
                            {state === "approved" ? "✓ Approved" : "Skipped"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="text-xs text-[var(--muted)] text-center">
              Showing sample agent activity. Live actions appear here once your agents are connected.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
