"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { TimeOfDayChart, RepPerformanceChart, RevenueOverTimeChart, SalesFunnelChart, TopZipsChart } from "./charts";
import { toggleChecklistItem } from "@/app/actions/goals";

type Priority = "critical" | "opportunity" | "pattern";
type Filter = "all" | Priority;
type Tab = "insights" | "analytics";

interface Insight {
  id: string;
  priority: Priority;
  category: string;
  title: string;
  body: string;
  metric: string | null;
  created_at: string;
}

interface SalesRecord {
  knocked: number;
  contacted: number;
  pitched: number;
  closed: number;
  deal_value: number;
  rep_name: string | null;
  date: string | null;
  time_of_day: string | null;
  zip: string | null;
}

interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}

interface Goal {
  id: string;
  title: string;
  description: string | null;
  target_value: number | null;
  current_value: number;
  unit: string | null;
  is_ai_generated: boolean;
  ai_reasoning: string | null;
  goal_checklist_items: ChecklistItem[];
}

interface Profile {
  full_name: string | null;
  plan: string;
  role: string;
}

const priorityConfig = {
  critical: {
    label: "Critical",
    badge: "bg-red-500/10 text-red-400 border border-red-500/20",
    dot: "bg-red-400",
    glow: "hover:border-red-500/30 hover:shadow-red-500/5",
    bar: "bg-red-500",
  },
  opportunity: {
    label: "Opportunity",
    badge: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    dot: "bg-emerald-400",
    glow: "hover:border-emerald-500/30 hover:shadow-emerald-500/5",
    bar: "bg-emerald-500",
  },
  pattern: {
    label: "Pattern",
    badge: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    dot: "bg-blue-400",
    glow: "hover:border-blue-500/30 hover:shadow-blue-500/5",
    bar: "bg-blue-500",
  },
};

function computeStats(records: SalesRecord[]) {
  if (!records.length) return null;
  const totalKnocked = records.reduce((s, r) => s + (r.knocked || 0), 0);
  const totalClosed = records.reduce((s, r) => s + (r.closed || 0), 0);
  const totalRevenue = records.reduce((s, r) => s + (r.deal_value || 0), 0);
  const closeRate = totalKnocked > 0 ? ((totalClosed / totalKnocked) * 100).toFixed(1) : "0";
  const avgDeal = totalClosed > 0 ? (totalRevenue / totalClosed).toFixed(0) : "0";
  const repMap: Record<string, { closed: number }> = {};
  records.forEach(r => {
    const rep = r.rep_name || "Unknown";
    if (!repMap[rep]) repMap[rep] = { closed: 0 };
    repMap[rep].closed += r.closed || 0;
  });
  const topRepEntry = Object.entries(repMap).sort((a, b) => b[1].closed - a[1].closed)[0];
  return { totalKnocked, totalClosed, totalRevenue, closeRate, avgDeal, topRep: topRepEntry?.[0] || null, topRepCloses: topRepEntry?.[1].closed || 0 };
}

export default function DashboardClient({
  insights, salesRecords, profile, goals,
}: {
  insights: Insight[];
  salesRecords: SalesRecord[];
  profile: Profile | null;
  goals: Goal[];
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("insights");

  const stats = computeStats(salesRecords);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = profile?.full_name?.split(" ")[0] || "there";

  const activeInsights = insights.filter(i => !dismissed.has(i.id));
  const visibleInsights = activeInsights.filter(i => filter === "all" || i.priority === filter);
  const counts = {
    all: activeInsights.length,
    critical: activeInsights.filter(i => i.priority === "critical").length,
    opportunity: activeInsights.filter(i => i.priority === "opportunity").length,
    pattern: activeInsights.filter(i => i.priority === "pattern").length,
  };

  async function handleDismiss(id: string) {
    setDismissed(prev => new Set([...prev, id]));
    const supabase = createClient();
    await supabase.from("insights").update({ is_dismissed: true }).eq("id", id);
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{greeting}, {firstName} 👋</h1>
            <p className="text-gray-500 text-sm">
              {activeInsights.length > 0
                ? `${counts.critical} critical · ${counts.opportunity} opportunities · ${counts.pattern} patterns`
                : "Upload your sales data to get AI-powered insights."}
            </p>
          </div>
          <Link
            href="/upload"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition shadow-lg shadow-blue-500/20 hover:-translate-y-0.5 duration-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Upload Data
          </Link>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[
              { label: "Total Closes", value: stats.totalClosed.toLocaleString(), sub: `of ${stats.totalKnocked.toLocaleString()} doors`, icon: "🎯", color: "text-blue-400" },
              { label: "Close Rate", value: `${stats.closeRate}%`, sub: "knock to close", icon: "📈", color: "text-emerald-400" },
              { label: "Revenue", value: `$${(stats.totalRevenue / 1000).toFixed(0)}k`, sub: `$${Number(stats.avgDeal).toLocaleString()} avg deal`, icon: "💰", color: "text-yellow-400" },
              { label: "Top Rep", value: stats.topRep?.split(" ")[0] || "—", sub: `${stats.topRepCloses} closes`, icon: "🏆", color: "text-purple-400" },
            ].map(stat => (
              <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 hover:border-gray-700 hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{stat.label}</span>
                  <span className="text-lg">{stat.icon}</span>
                </div>
                <div className={`text-xl font-bold mb-0.5 truncate ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-gray-600">{stat.sub}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tab switcher */}
        {(insights.length > 0 || salesRecords.length > 0) && (
          <div className="flex items-center gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 mb-6 w-fit">
            <button
              onClick={() => setActiveTab("insights")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === "insights" ? "bg-gray-800 text-white shadow-sm" : "text-gray-500 hover:text-gray-300"}`}
            >
              AI Insights
              {counts.all > 0 && <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">{counts.all}</span>}
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === "analytics" ? "bg-gray-800 text-white shadow-sm" : "text-gray-500 hover:text-gray-300"}`}
            >
              Analytics
            </button>
          </div>
        )}

        {/* Analytics tab */}
        {activeTab === "analytics" && (
          salesRecords.length > 0 ? (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <TimeOfDayChart records={salesRecords} />
                <RepPerformanceChart records={salesRecords} />
              </div>
              <RevenueOverTimeChart records={salesRecords} />
              <div className="grid md:grid-cols-2 gap-4">
                <SalesFunnelChart records={salesRecords} />
                <TopZipsChart records={salesRecords} />
              </div>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 border-dashed rounded-2xl p-16 text-center">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-white font-semibold text-lg mb-2">No data yet</h3>
              <p className="text-gray-400 text-sm mb-6">Upload a CSV to see your analytics.</p>
              <Link href="/upload" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl text-sm transition">
                Upload Sales Data
              </Link>
            </div>
          )
        )}

        {/* Insights tab */}
        {activeTab === "insights" && (
          <div className="grid lg:grid-cols-3 gap-6">

            {/* Left — Insights */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold">
                  AI Insights
                  {counts.all > 0 && <span className="ml-2 text-sm text-gray-500 font-normal">{counts.all} active</span>}
                </h2>
                {insights.length > 0 && (
                  <div className="flex items-center gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
                    {(["all", "critical", "opportunity", "pattern"] as Filter[]).map(f => (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition capitalize ${filter === f ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-300"}`}
                      >
                        {f === "all" ? `All ${counts.all}` : f === "critical" ? `🔴 ${counts.critical}` : f === "opportunity" ? `🟢 ${counts.opportunity}` : `🔵 ${counts.pattern}`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {insights.length === 0 && (
                <div className="bg-gray-900 border border-gray-800 border-dashed rounded-2xl p-12 text-center">
                  <div className="text-5xl mb-4">🧠</div>
                  <h3 className="text-white font-semibold text-lg mb-2">No insights yet</h3>
                  <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">Upload your sales data CSV and our AI will analyze it and surface 8-10 insights about where you are losing deals.</p>
                  <Link href="/upload" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl text-sm transition">
                    Upload Sales Data
                  </Link>
                </div>
              )}

              {insights.length > 0 && visibleInsights.length === 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
                  <div className="text-4xl mb-3">✅</div>
                  <h3 className="text-white font-semibold mb-1">All caught up</h3>
                  <p className="text-gray-400 text-sm">{filter !== "all" ? `No ${filter} insights.` : "Upload new data for fresh insights."}</p>
                </div>
              )}

              <div className="space-y-2.5">
                {visibleInsights.map(insight => {
                  const cfg = priorityConfig[insight.priority];
                  const isExpanded = expanded === insight.id;
                  return (
                    <div
                      key={insight.id}
                      onClick={() => setExpanded(isExpanded ? null : insight.id)}
                      className={`group bg-gray-900 border border-gray-800 rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:border-gray-700 hover:-translate-y-0.5 hover:shadow-lg ${cfg.glow}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.badge}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                              {cfg.label}
                            </span>
                            <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">{insight.category}</span>
                            {insight.metric && <span className="text-xs text-blue-400 font-semibold">{insight.metric}</span>}
                          </div>
                          <h3 className="text-white font-semibold text-sm leading-snug">{insight.title}</h3>
                          {isExpanded && <p className="text-gray-400 text-sm leading-relaxed mt-2">{insight.body}</p>}
                          {!isExpanded && <p className="text-gray-600 text-xs mt-1">Tap to expand</p>}
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={e => { e.stopPropagation(); handleDismiss(insight.id); }}
                            className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-gray-400 transition p-1 rounded-lg hover:bg-gray-800"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                          <svg className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-gray-800">
                          <div className={`h-1 rounded-full ${cfg.bar} opacity-30`} style={{ width: "100%" }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right — Goals */}
            <div className="lg:col-span-1">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold">Goals</h2>
                <Link href="/goals" className="text-xs text-blue-400 hover:text-blue-300 transition">
                  View all →
                </Link>
              </div>

              {goals.length === 0 ? (
                <div className="bg-gray-900 border border-gray-800 border-dashed rounded-2xl p-8 text-center">
                  <div className="text-3xl mb-3">🎯</div>
                  <p className="text-white font-semibold text-sm mb-1">No goals yet</p>
                  <p className="text-gray-500 text-xs mb-4">Generate AI goals based on your sales data.</p>
                  <Link href="/goals" className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 border border-blue-500/20 px-3 py-2 rounded-xl transition">
                    <span>🧠</span> Generate goals
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {goals.map(goal => {
                    const progress = goal.target_value ? Math.min((goal.current_value / goal.target_value) * 100, 100) : 0;
                    const checklist = goal.goal_checklist_items || [];
                    const completedItems = checklist.filter(i => i.completed).length;
                    return (
                      <div key={goal.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 hover:border-gray-700 transition-all duration-200">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              {goal.is_ai_generated && (
                                <span className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded-full">🧠 AI</span>
                              )}
                            </div>
                            <p className="text-white font-semibold text-sm leading-snug">{goal.title}</p>
                            {goal.target_value && (
                              <p className="text-gray-500 text-xs mt-0.5">
                                {goal.current_value} / {goal.target_value} {goal.unit}
                              </p>
                            )}
                          </div>
                          {goal.target_value && (
                            <div className="flex-shrink-0 w-10 h-10 relative">
                              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1f2937" strokeWidth="3" />
                                <circle
                                  cx="18" cy="18" r="15.9" fill="none"
                                  stroke={progress >= 100 ? "#10b981" : "#3b82f6"}
                                  strokeWidth="3"
                                  strokeDasharray={`${progress} 100`}
                                  strokeLinecap="round"
                                />
                              </svg>
                              <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                                {Math.round(progress)}%
                              </span>
                            </div>
                          )}
                        </div>

                        {checklist.length > 0 && (
                          <div className="space-y-1.5">
                            {checklist.slice(0, 3).map(item => (
                              <label key={item.id} className="flex items-center gap-2 cursor-pointer group">
                                <div
                                  onClick={e => { e.preventDefault(); toggleChecklistItem(item.id, !item.completed); }}
                                  className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center transition-all ${item.completed ? "bg-blue-600 border-blue-600" : "border-gray-600 group-hover:border-gray-500"}`}
                                >
                                  {item.completed && (
                                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                  )}
                                </div>
                                <span className={`text-xs leading-relaxed ${item.completed ? "text-gray-600 line-through" : "text-gray-400"}`}>{item.title}</span>
                              </label>
                            ))}
                            {checklist.length > 3 && (
                              <p className="text-gray-600 text-xs pl-5">+{checklist.length - 3} more steps</p>
                            )}
                          </div>
                        )}

                        {checklist.length > 0 && (
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-xs text-gray-600">{completedItems}/{checklist.length} steps done</span>
                            <div className="flex-1 mx-3 bg-gray-800 rounded-full h-1">
                              <div
                                className="h-1 rounded-full bg-blue-500 transition-all duration-300"
                                style={{ width: checklist.length > 0 ? `${(completedItems / checklist.length) * 100}%` : "0%" }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <Link
                    href="/goals"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-gray-900 border border-gray-800 border-dashed rounded-2xl text-gray-500 hover:text-gray-300 hover:border-gray-700 text-xs font-medium transition"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    Manage all goals
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
