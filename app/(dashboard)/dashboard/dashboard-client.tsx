"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { dismissInsight } from "@/app/actions/insights";
import {
  TimeOfDayChart,
  RepPerformanceChart,
  RevenueOverTimeChart,
  SalesFunnelChart,
  TopZipsChart,
} from "./charts";

interface Insight {
  id: string;
  priority: "critical" | "opportunity" | "pattern";
  category: string;
  title: string;
  body: string;
  metric: string | null;
  is_dismissed: boolean;
}

interface Goal {
  id: string;
  title: string;
  current_value: number;
  target_value: number;
  unit: string;
  status: string;
}

interface Stats {
  totalClosed: number;
  totalKnocked: number;
  closeRate: string;
  totalRevenue: number;
  avgDeal: number;
  topRep: string;
  topRepCloses: number;
}

interface DashboardClientProps {
  insights: Insight[];
  goals: Goal[];
  stats: Stats;
  userName: string;
  records?: any[];
}

const priorityConfig = {
  critical: {
    label: "Critical",
    badge: "bg-red-500/10 text-red-400 border-red-500/20",
    dot: "bg-red-400",
    bar: "bg-red-500",
  },
  opportunity: {
    label: "Opportunity",
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    dot: "bg-emerald-400",
    bar: "bg-emerald-500",
  },
  pattern: {
    label: "Pattern",
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    dot: "bg-blue-400",
    bar: "bg-blue-500",
  },
};

function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const ref = useRef<boolean>(false);
  useEffect(() => {
    if (ref.current) return;
    ref.current = true;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return count;
}

function StatCard({ label, value, sub, icon, color, prefix = "", suffix = "" }: {
  label: string;
  value: number;
  sub: string;
  icon: string;
  color: string;
  prefix?: string;
  suffix?: string;
}) {
  const count = useCountUp(value);
  return (
    <div className="group relative bg-[#0d0d18] border border-white/6 rounded-2xl p-5 hover:border-blue-500/20 transition-all duration-300 hover:-translate-y-0.5 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{label}</span>
          <span className="text-xl">{icon}</span>
        </div>
        <div className={"text-2xl font-black mb-1 " + color}>
          {prefix}{value > 999 ? (count / 1000).toFixed(1) + "k" : count}{suffix}
        </div>
        <div className="text-xs text-gray-600">{sub}</div>
      </div>
    </div>
  );
}

export default function DashboardClient({ insights, goals, stats, userName, records = [] }: DashboardClientProps) {
  const [filter, setFilter] = useState<"all" | "critical" | "opportunity" | "pattern">("all");
  const [activeTab, setActiveTab] = useState<"insights" | "analytics">("insights");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const greetingEmoji = hour < 12 ? "☀️" : hour < 17 ? "👋" : "🌙";

  const activeInsights = insights.filter(i => !i.is_dismissed && !dismissed.has(i.id));
  const filtered = activeInsights.filter(i => filter === "all" || i.priority === filter);

  const counts = {
    all: activeInsights.length,
    critical: activeInsights.filter(i => i.priority === "critical").length,
    opportunity: activeInsights.filter(i => i.priority === "opportunity").length,
    pattern: activeInsights.filter(i => i.priority === "pattern").length,
  };

  async function handleDismiss(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setDismissed(prev => new Set([...prev, id]));
    await dismissInsight(id);
  }

  const topGoals = goals.filter(g => g.status !== "completed").slice(0, 3);

  return (
    <div className="min-h-screen bg-[#080810] p-5 md:p-7">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/4 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-600/3 rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">

        {/* Header */}
        <div className={"flex items-start justify-between mb-8 transition-all duration-700 " + (mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white mb-1 flex items-center gap-2">
              {greeting}, {userName.split(" ")[0]} <span>{greetingEmoji}</span>
            </h1>
            <div className="flex items-center gap-4 text-xs text-gray-600">
              {counts.critical > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  {counts.critical} critical
                </span>
              )}
              {counts.opportunity > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {counts.opportunity} opportunities
                </span>
              )}
              {counts.pattern > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  {counts.pattern} patterns
                </span>
              )}
            </div>
          </div>
          <Link
            href="/upload"
            className="group flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-blue-600/25 hover:-translate-y-0.5"
          >
            <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Upload Data
          </Link>
        </div>

        {/* Stats */}
        <div className={"grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 transition-all duration-700 delay-100 " + (mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
          <StatCard label="Total Closes" value={stats.totalClosed} sub={"of " + stats.totalKnocked.toLocaleString() + " doors"} icon="🎯" color="text-blue-400" />
          <StatCard label="Close Rate" value={parseFloat(stats.closeRate)} sub="knock to close" icon="📈" color="text-emerald-400" suffix="%" />
          <StatCard label="Revenue" value={stats.totalRevenue} sub={"$" + stats.avgDeal.toLocaleString() + " avg deal"} icon="💰" color="text-yellow-400" prefix="$" />
          <div className="group relative bg-[#0d0d18] border border-white/6 rounded-2xl p-5 hover:border-purple-500/20 transition-all duration-300 hover:-translate-y-0.5 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Top Rep</span>
                <span className="text-xl">🏆</span>
              </div>
              <div className="text-2xl font-black text-purple-400 mb-1">{stats.topRep || "—"}</div>
              <div className="text-xs text-gray-600">{stats.topRepCloses} closes</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={"flex items-center justify-between mb-6 transition-all duration-700 delay-200 " + (mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
          <div className="flex items-center gap-1 bg-[#0d0d18] border border-white/6 rounded-xl p-1">
            <button
              onClick={() => setActiveTab("insights")}
              className={"flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 " + (activeTab === "insights" ? "bg-white/8 text-white" : "text-gray-600 hover:text-gray-300")}
            >
              AI Insights
              {counts.all > 0 && (
                <span className={"text-xs px-1.5 py-0.5 rounded-full font-black " + (activeTab === "insights" ? "bg-blue-500/20 text-blue-400" : "bg-white/8 text-gray-400")}>
                  {counts.all}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={"flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 " + (activeTab === "analytics" ? "bg-white/8 text-white" : "text-gray-600 hover:text-gray-300")}
            >
              Analytics
            </button>
          </div>
        </div>

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className={"grid md:grid-cols-2 gap-4 transition-all duration-500 " + (mounted ? "opacity-100" : "opacity-0")}>
            <div className="bg-[#0d0d18] border border-white/6 rounded-2xl p-5">
              <h3 className="text-white font-bold text-sm mb-4">Close Rate by Time of Day</h3>
              <TimeOfDayChart records={records} />
            </div>
            <div className="bg-[#0d0d18] border border-white/6 rounded-2xl p-5">
              <h3 className="text-white font-bold text-sm mb-4">Rep Performance</h3>
              <RepPerformanceChart records={records} />
            </div>
            <div className="bg-[#0d0d18] border border-white/6 rounded-2xl p-5">
              <h3 className="text-white font-bold text-sm mb-4">Revenue Over Time</h3>
              <RevenueOverTimeChart records={records} />
            </div>
            <div className="bg-[#0d0d18] border border-white/6 rounded-2xl p-5">
              <h3 className="text-white font-bold text-sm mb-4">Sales Funnel</h3>
              <SalesFunnelChart records={records} />
            </div>
            <div className="bg-[#0d0d18] border border-white/6 rounded-2xl p-5 md:col-span-2">
              <h3 className="text-white font-bold text-sm mb-4">Top ZIPs by Close Rate</h3>
              <TopZipsChart records={records} />
            </div>
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === "insights" && (
          <div className={"grid lg:grid-cols-3 gap-6 transition-all duration-700 delay-300 " + (mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>

            {/* Insights list */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-black text-base">
                  AI Insights
                  <span className="text-gray-600 font-semibold text-sm ml-2">{counts.all} active</span>
                </h2>
                <div className="flex items-center gap-1 bg-[#0d0d18] border border-white/6 rounded-xl p-1">
                  {(["all", "critical", "opportunity", "pattern"] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={"px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 " + (filter === f ? "bg-white/8 text-white" : "text-gray-600 hover:text-gray-300")}
                    >
                      {f === "all" ? "All " + counts.all :
                       f === "critical" ? "🔴 " + counts.critical :
                       f === "opportunity" ? "🟢 " + counts.opportunity :
                       "🔵 " + counts.pattern}
                    </button>
                  ))}
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="bg-[#0d0d18] border border-white/6 border-dashed rounded-2xl p-12 text-center">
                  <div className="text-4xl mb-3">🎉</div>
                  <h3 className="text-white font-bold mb-1">All caught up</h3>
                  <p className="text-gray-600 text-sm mb-4">Upload new data to get fresh insights.</p>
                  <Link href="/upload" className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all duration-200">
                    Upload data
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((insight, i) => {
                    const cfg = priorityConfig[insight.priority];
                    const isExpanded = expanded === insight.id;
                    return (
                      <div
                        key={insight.id}
                        className={"group relative bg-[#0d0d18] border rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-0.5 " + (isExpanded ? "border-blue-500/25 shadow-xl shadow-blue-500/5" : "border-white/6 hover:border-white/12")}
                        onClick={() => setExpanded(isExpanded ? null : insight.id)}
                      >
                        <div className={"absolute left-0 top-0 bottom-0 w-0.5 opacity-60 " + cfg.bar} />
                        <div className="px-4 py-3.5 pl-5">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <span className={"inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border " + cfg.badge}>
                                  <span className={"w-1 h-1 rounded-full " + cfg.dot} />
                                  {cfg.label}
                                </span>
                                <span className="text-xs text-gray-600 bg-white/4 px-2 py-0.5 rounded-full">{insight.category}</span>
                                {insight.metric && (
                                  <span className="text-xs text-blue-400 font-black ml-auto">{insight.metric}</span>
                                )}
                              </div>
                              <h3 className="text-white font-bold text-sm leading-snug">{insight.title}</h3>
                              {isExpanded && <p className="text-gray-500 text-xs leading-relaxed mt-2">{insight.body}</p>}
                              {!isExpanded && <p className="text-gray-700 text-xs mt-0.5">Tap to expand</p>}
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button
                                onClick={(e) => handleDismiss(insight.id, e)}
                                className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg flex items-center justify-center text-gray-600 hover:text-gray-300 hover:bg-white/8 transition-all duration-200"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                              <svg
                                className={"w-4 h-4 text-gray-600 transition-all duration-300 " + (isExpanded ? "rotate-180 text-blue-400" : "group-hover:text-gray-400")}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right panel */}
            <div className="space-y-4">
              <div className="bg-[#0d0d18] border border-white/6 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-black text-sm">Goals</h3>
                  <Link href="/goals" className="text-blue-400 hover:text-blue-300 text-xs font-bold transition-colors duration-200">View all →</Link>
                </div>
                {topGoals.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-600 text-xs mb-3">No active goals yet.</p>
                    <Link href="/goals" className="text-blue-400 text-xs font-bold hover:text-blue-300">Create a goal →</Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {topGoals.map(goal => {
                      const pct = Math.min(Math.round((goal.current_value / goal.target_value) * 100), 100);
                      const circumference = 2 * Math.PI * 16;
                      const offset = circumference - (pct / 100) * circumference;
                      return (
                        <div key={goal.id} className="flex items-start gap-3">
                          <div className="relative w-10 h-10 flex-shrink-0">
                            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                              <circle cx="18" cy="18" r="16" fill="none" stroke="#ffffff08" strokeWidth="3" />
                              <circle cx="18" cy="18" r="16" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000" />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-white text-[9px] font-black">{pct}%</span>
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <p className="text-white text-xs font-bold leading-tight mb-0.5">{goal.title}</p>
                            <p className="text-gray-600 text-xs">{goal.current_value} / {goal.target_value} {goal.unit}</p>
                            <div className="w-full bg-white/5 rounded-full h-1 mt-2">
                              <div className="bg-blue-500 h-1 rounded-full transition-all duration-1000" style={{ width: pct + "%" }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="bg-[#0d0d18] border border-white/6 rounded-2xl p-5">
                <h3 className="text-white font-black text-sm mb-3">Quick actions</h3>
                <div className="space-y-2">
                  {[
                    { href: "/upload", icon: "📤", label: "Upload new data", sub: "CSV or HubSpot sync" },
                    { href: "/team", icon: "👥", label: "Manage team", sub: "Invite reps and managers" },
                    { href: "/history", icon: "📋", label: "View history", sub: "All past insights" },
                    { href: "/referrals", icon: "💰", label: "Refer and earn", sub: "Get $20/month per referral" },
                  ].map(action => (
                    <Link key={action.href} href={action.href} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/4 border border-transparent hover:border-white/6 transition-all duration-200 group">
                      <span className="text-lg group-hover:scale-110 transition-transform duration-200">{action.icon}</span>
                      <div>
                        <p className="text-white text-xs font-bold">{action.label}</p>
                        <p className="text-gray-600 text-xs">{action.sub}</p>
                      </div>
                      <svg className="w-3.5 h-3.5 text-gray-700 ml-auto group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
