"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { dismissInsight } from "@/app/actions/insights";

interface Insight {
  id: string;
  priority: "critical" | "opportunity" | "pattern";
  category: string; 
  title: string;
  body: string;
  metric: string | null; // Value leaking, e.g., "$14,500/mo dropoff"
  is_dismissed: boolean;
}

interface DashboardClientProps {
  insights: Insight[];
  userName: string;
}

/* ============================ REMEDIATION ENGINE STUBS ============================ */

type AgentStatus = "intercepting" | "monitoring" | "paused";

const DISPATCHED_AGENTS = [
  { id: "ag-lead", name: "Speed-to-Lead Interceptor", status: "intercepting" as AgentStatus, vector: "Inbound Dropoff", recovered: 12400, handledToday: 34 },
  { id: "ag-quote", name: "Stale Quote Reactivator", status: "monitoring" as AgentStatus, vector: "Unsigned Proposals", recovered: 8900, handledToday: 12 },
  { id: "ag-churn", name: "Dormant Account Winback", status: "paused" as AgentStatus, vector: "Contract Expiration", recovered: 0, handledToday: 0 },
];

const REALTIME_LEAK_FEED = [
  { id: "feed-1", time: "14:22:05", agent: "Speed-to-Lead Interceptor", action: "Plugged pipeline leak", detail: "Captured dropoff lead at 12s back-contact time · Secured $3,500 quote value", style: "success" },
  { id: "feed-2", time: "13:05:11", agent: "Stale Quote Reactivator", action: "Analyzing pipeline friction step", detail: "Scanned 18 proposals stalling past 48h parameter threshold", style: "neutral" },
  { id: "feed-3", time: "10:44:59", agent: "Speed-to-Lead Interceptor", action: "Automated intervention initiated", detail: "Contacted inbound submission form timeout dropoff", style: "success" },
];

const HISTORIC_TREND = [4.2, 3.9, 5.1, 6.8, 6.2, 8.1, 9.4, 11.2];

/* ============================ UTILITIES ============================ */

const money = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${Math.round(n)}`);

function useCountUp(target: number, duration = 1000) {
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
  const w = 120, h = 34, max = Math.max(...data), min = Math.min(...data);
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
          <stop offset="0%" stopColor="#0a84ff" stopOpacity={0.25} />
          <stop offset="100%" stopColor="#0a84ff" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark)" />
      <path d={line} fill="none" stroke="url(#mgrad)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={2.5} fill="#0a84ff" />
    </svg>
  );
}

const PRIORITY_THEME: Record<string, { label: string; color: string; tint: string }> = {
  critical: { label: "Critical Leak", color: "#e5484d", tint: "rgba(229,72,77,0.08)" },
  opportunity: { label: "Optimization Vector", color: "#1aa251", tint: "rgba(26,162,81,0.08)" },
  pattern: { label: "Structural Friction", color: "#0a84ff", tint: "rgba(10,132,255,0.08)" },
};

export default function DashboardClient({ insights, userName }: DashboardClientProps) {
  const [tab, setTab] = useState<"leaks" | "agents">("leaks");
  const [filter, setFilter] = useState<"all" | "critical" | "opportunity" | "pattern">("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [agents, setAgents] = useState(DISPATCHED_AGENTS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeLeaks = insights.filter((i) => !i.is_dismissed && !dismissed.has(i.id));
  const filteredLeaks = activeLeaks.filter((i) => filter === "all" || i.priority === filter);

  const totalRecovered = agents.reduce((sum, current) => sum + (current.status !== "paused" ? current.recovered : 0), 0);
  const activeDispatches = agents.filter(a => a.status !== "paused").length;
  const metricsToday = agents.reduce((sum, current) => sum + current.handledToday, 0);
  const counterValue = useCountUp(totalRecovered);

  async function handleDismiss(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setDismissed((prev) => new Set([...prev, id]));
    await dismissInsight(id);
  }

  const toggleAgent = (id: string) => {
    setAgents(prev => prev.map(a => {
      if (a.id === id) {
        return { ...a, status: a.status === "paused" ? "intercepting" : "paused" };
      }
      return a;
    }));
  };

  return (
    <div className="relative min-h-screen text-[#1d1d1f] antialiased p-6 md:p-8">
      {/* Layout Primitives Design Layer */}
      <style jsx global>{`
        .glass {
          background: linear-gradient(135deg, rgba(255,255,255,0.7), rgba(255,255,255,0.4));
          backdrop-filter: blur(24px) saturate(180%); -webkit-backdrop-filter: blur(24px) saturate(180%);
          border: 1px solid rgba(255,255,255,0.6);
          box-shadow: 0 8px 32px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.8);
        }
        .grad-text { background: linear-gradient(120deg, #0a84ff, #6a5cff); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .pulse-dot { animation: pulse 2s infinite; }
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(10,132,255,0.4); } 70% { box-shadow: 0 0 0 6px rgba(10,132,255,0); } 100% { box-shadow: 0 0 0 0 rgba(10,132,255,0); } }
      `}</style>
      
      <svg width="0" height="0" className="absolute"><defs>
        <linearGradient id="mgrad" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#0a84ff" /><stop offset="1" stopColor="#6a5cff" /></linearGradient>
      </defs></svg>

      <div className={`max-w-5xl mx-auto transition-opacity duration-300 ${mounted ? "opacity-100" : "opacity-0"}`}>
        
        {/* Top Diagnostic Summary Control Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#1d1d1f]">Pipeline Diagnostics</h1>
            <p className="text-xs text-[#6e6e73] mt-0.5">Automated pipeline scanning active for {userName || "Authorized Workspace"}.</p>
          </div>
          <Link href="/upload" className="bg-gradient-to-r from-[#0a84ff] to-[#6a5cff] text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm hover:brightness-105 transition-all flex items-center gap-2">
            <span>📥</span> Ingest Inbound Logs
          </Link>
        </div>

        {/* Core System Performance Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-8">
          <div className="glass rounded-2xl p-4.5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#6e6e73]">Capital Recovered</span>
            <div className="mt-1.5 flex items-end justify-between">
              <span className="text-xl font-bold font-mono tracking-tight grad-text">{money(counterValue)}</span>
              <Sparkline data={HISTORIC_TREND} />
            </div>
          </div>

          <div className="glass rounded-2xl p-4.5 border-l-2 border-l-[#e5484d]">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#e5484d] font-bold">Unmitigated Leaks</span>
            <div className="text-xl font-bold tracking-tight text-[#1d1d1f] mt-1.5">{activeLeaks.length} Drops</div>
            <span className="text-[10px] text-[#6e6e73] block mt-0.5">Identified via latest ingestion</span>
          </div>

          <div className="glass rounded-2xl p-4.5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#6e6e73]">Active Agents</span>
            <div className="text-xl font-bold tracking-tight text-[#1d1d1f] mt-1.5 flex items-center gap-1.5">
              {activeDispatches} Deployments <span className="w-1.5 h-1.5 rounded-full bg-[#0a84ff] pulse-dot" />
            </div>
            <span className="text-[10px] text-[#6e6e73] block mt-0.5">Plugging dropoff points</span>
          </div>

          <div className="glass rounded-2xl p-4.5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#6e6e73]">Automations Run</span>
            <div className="text-xl font-bold tracking-tight text-[#1d1d1f] mt-1.5">{metricsToday} Interceptions</div>
            <span className="text-[10px] text-[#6e6e73] block mt-0.5">Within last 24h cycle</span>
          </div>
        </div>

        {/* Structural Navigation Tabs */}
        <div className="flex bg-black/[0.03] border border-black/5 p-1 rounded-xl w-fit mb-6 text-xs font-semibold">
          <button onClick={() => setTab("leaks")} className={`px-4 py-1.5 rounded-lg transition-all ${tab === "leaks" ? "bg-white shadow-sm text-[#1d1d1f]" : "text-[#6e6e73]"}`}>
            Pipeline Gaps Detected ({activeLeaks.length})
          </button>
          <button onClick={() => setTab("agents")} className={`px-4 py-1.5 rounded-lg transition-all ${tab === "agents" ? "bg-white shadow-sm text-[#1d1d1f]" : "text-[#6e6e73]"}`}>
            Remediation Agents ({agents.length})
          </button>
        </div>

        {/* ============================ THE LEAKS RUNTIME ============================ */}
        {tab === "leaks" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold tracking-tight text-[#6e6e73] uppercase">Isolation Matrix</h2>
              <div className="flex gap-2 text-[10px] font-bold uppercase tracking-wider text-[#6e6e73]">
                {(["all", "critical", "opportunity", "pattern"] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)} className={`px-2 py-1 rounded ${filter === f ? "bg-black/5 text-black" : ""}`}>{f}</button>
                ))}
              </div>
            </div>

            {filteredLeaks.length === 0 ? (
              <div className="glass rounded-2xl p-10 text-center border-dashed border-black/10">
                <span className="text-xl block mb-2">🛡️</span>
                <p className="text-xs font-semibold text-[#1d1d1f]">Pipeline fully reinforced</p>
                <p className="text-[11px] text-[#6e6e73] mt-0.5">No immediate revenue friction anomalies isolated.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredLeaks.map((leak) => {
                  const theme = PRIORITY_THEME[leak.priority] || PRIORITY_THEME.pattern;
                  const isOpen = expanded === leak.id;

                  return (
                    <div key={leak.id} onClick={() => setExpanded(isOpen ? null : leak.id)} className="glass rounded-xl p-4 cursor-pointer hover:border-black/10 transition-all duration-150 group">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 font-mono rounded font-semibold" style={{ backgroundColor: theme.tint, color: theme.color }}>
                              {theme.label}
                            </span>
                            <span className="text-[10px] text-[#6e6e73] bg-black/[0.04] px-2 py-0.5 rounded">{leak.category}</span>
                          </div>
                          <h3 className="text-sm font-semibold text-[#1d1d1f] mt-2 group-hover:text-[#0a84ff] transition-colors">{leak.title}</h3>
                          
                          {isOpen ? (
                            <div className="mt-3 text-xs space-y-3 text-[#6e6e73] leading-relaxed">
                              <p>{leak.body}</p>
                              <div className="bg-[#0a84ff]/[0.04] border border-[#0a84ff]/10 rounded-xl p-3 flex justify-between items-center gap-4 text-[#1d1d1f]">
                                <div>
                                  <p className="font-semibold text-[11px] tracking-wide text-[#0a84ff] uppercase">Autonomous Remediation Available</p>
                                  <p className="text-[11px] text-[#6e6e73] mt-0.5">Deploy trained context handler to patch this vector dynamically.</p>
                                </div>
                                <button className="bg-gradient-to-r from-[#0a84ff] to-[#6a5cff] text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap">
                                  Instantiate Agent
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] text-[#6e6e73] block mt-1">Click to analyze breakdown & deploy automated patch agent</span>
                          )}
                        </div>
                        
                        <div className="text-right shrink-0 flex flex-col items-end gap-3 font-mono">
                          <span className="text-xs font-bold text-[#e5484d]">{leak.metric || "Pending Sweep"}</span>
                          <button onClick={(e) => handleDismiss(leak.id, e)} className="opacity-0 group-hover:opacity-100 p-1 text-[#6e6e73] hover:bg-black/5 rounded transition-opacity">
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================ THE AGENTS VIEW ============================ */}
        {tab === "agents" && (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-3 gap-4">
              {agents.map((agent) => {
                const isActive = agent.status !== "paused";
                return (
                  <div key={agent.id} className="glass rounded-xl p-4.5 flex flex-col justify-between min-h-[140px]">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className={`w-2 h-2 rounded-full ${agent.status === "intercepting" ? "bg-[#28c840] pulse-dot" : agent.status === "monitoring" ? "bg-[#0a84ff]" : "bg-gray-300"}`} />
                        <span className="text-[9px] uppercase font-mono px-2 py-0.5 bg-black/[0.04] text-[#6e6e73] rounded font-bold">{agent.status}</span>
                      </div>
                      <h3 className="text-xs font-bold text-[#1d1d1f] tracking-tight">{agent.name}</h3>
                      <p className="text-[10px] text-[#6e6e73] mt-0.5">Target Layer: <span className="font-mono">{agent.vector}</span></p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between text-[11px]">
                      <div>
                        <span className="text-[9px] uppercase text-[#6e6e73] block">Recovered</span>
                        <span className="font-bold font-mono text-[#1d1d1f]">{money(agent.recovered)}</span>
                      </div>
                      <button onClick={() => toggleAgent(agent.id)} className="px-2.5 py-1 border border-black/10 rounded-md font-semibold text-[10px] hover:bg-black/[0.02]">
                        {isActive ? "Pause Run" : "Deploy Live"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pipeline Automation Logs Activity Feed */}
            <div className="glass rounded-2xl overflow-hidden border border-black/5">
              <div className="px-5 py-3 border-b border-black/5 flex justify-between items-center bg-white/40">
                <h3 className="text-[10px] font-bold uppercase font-mono tracking-wider text-[#6e6e73]">Autonomous Mitigation Log</h3>
                <span className="text-[10px] font-mono text-[#28c840] flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#28c840] pulse-dot" /> Live sync</span>
              </div>
              <div className="divide-y divide-black/5 bg-white/10 font-mono text-[11px]">
                {REALTIME_LEAK_FEED.map((feed) => (
                  <div key={feed.id} className="p-3.5 flex gap-4 items-start">
                    <span className="text-[#6e6e73] shrink-0">{feed.time}</span>
                    <div>
                      <p className={`font-semibold ${feed.style === "success" ? "text-emerald-600" : "text-[#1d1d1f]"}`}>{feed.action}</p>
                      <p className="text-[10px] text-[#6e6e73] mt-0.5">{feed.agent} · {feed.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
