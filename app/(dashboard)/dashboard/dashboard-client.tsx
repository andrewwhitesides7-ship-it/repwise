"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TimeOfDayChart, RepPerformanceChart, RevenueOverTimeChart, SalesFunnelChart, TopZipsChart } from "./charts";

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

interface Profile {
  full_name: string | null;
  plan: string;
  role: string;
}

const priorityConfig = {
  critical: {
    label: "Critical",
    badge: "bg-red-500/15 text-red-400 border border-red-500/20",
    dot: "bg-red-400",
    border: "border-red-500/20",
    hover: "hover:border-red-500/30",
  },
  opportunity: {
    label: "Opportunity",
    badge: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
    dot: "bg-emerald-400",
    border: "border-emerald-500/20",
    hover: "hover:border-emerald-500/30",
  },
  pattern: {
    label: "Pattern",
    badge: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
    dot: "bg-blue-400",
    border: "border-blue-500/20",
    hover: "hover:border-blue-500/30",
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
  records.forEach((r) => {
    const rep = r.rep_name || "Unknown";
    if (!repMap[rep]) repMap[rep] = { closed: 0 };
    repMap[rep].closed += r.closed || 0;
  });
  const topRepEntry = Object.entries(repMap).sort((a, b) => b[1].closed - a[1].closed)[0];
  return {
    totalKnocked, totalClosed, totalRevenue, closeRate, avgDeal,
    topRep: topRepEntry?.[0] || null,
    topRepCloses: topRepEntry?.[1].closed || 0,
  };
}

export default function DashboardClient({
  insights, salesRecords, profile,
}: {
  insights: Insight[];
  salesRecords: SalesRecord[];
  profile: Profile | null;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("insights");

  const stats = computeStats(salesRecords);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = profile?.full_name?.split(" ")[0] || "there";

  const activeInsights = insights.filter((i) => !dismissed.has(i.id));
  const visibleInsights = activeInsights.filter((i) => filter === "all" || i.priority === filter);
  const counts = {
    all: activeInsights.length,
    critical: activeInsights.filter((i) => i.priority === "critical").length,
    opportunity: activeInsights.filter((i) => i.priority === "opportunity").length,
    pattern: activeInsights.filter((i) => i.priority === "pattern").length,
  };

  const filterTabs: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "All", count: counts.all },
    { key: "critical", label: "Critical", count: counts.critical },
    { key: "opportunity", label: "Opportunity", count: counts.opportunity },
    { key: "pattern", label: "Pattern", count: counts.pattern },
  ];

  async function handleDismiss(id: string) {
    setDismissed((prev) => new Set([...prev, id]));
    const supabase = createClient();
    await supabase.from("insights").update({ is_dismissed: true }).eq("id", id);
  }

  return (
    <div className="min-h-screen bg-gray-950 px-6 py-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">{greeting}, {firstName} 👋</h1>
          <p className="text-gray-400 text-sm">
            {insights.length > 0
              ? `${counts.critical} critical · ${counts.opportunity} opportunities · ${counts.pattern} patterns`
              : "Upload your sales data to get AI-powered insights."}
          </p>
        </div>
        <a href="/upload" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:-translate-y-0.5 duration-200">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          Upload Data
        </a>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Closes", value: stats.totalClosed.toLocaleString(), sub: `of ${stats.totalKnocked.toLocaleString()} doors`, icon: "🎯", color: "text-blue-400" },
            { label: "Close Rate", value: `${stats.closeRate}%`, sub: "knock to close", icon: "📈", color: "text-emerald-400" },
            { label: "Revenue", value: `$${(stats.totalRevenue / 1000).toFixed(0)}k`, sub: `$${Number(stats.avgDeal).toLocaleString()} avg deal`, icon: "💰", color: "text-yellow-400" },
            { label: "Top Rep", value: stats.topRep?.split(" ")[0] || "—", sub: `${stats.topRepCloses} closes`, icon: "🏆", color: "text-purple-400" },
          ].map((stat) => (
            <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{stat.label}</span>
                <span className="text-xl">{stat.icon}</span>
              </div>
              <div className={`text-2xl font-bold mb-1 truncate ${stat.color}`}>{stat.value}</div>
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
            {counts.all > 0 && (
              <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">{counts.all}</span>
            )}
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
            <p className="text-gray-400 text-sm mb-6">Upload a CSV to see your analytics charts.</p>
            <a href="/upload" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl text-sm transition">
              Upload Sales Data
            </a>
          </div>
        )
      )}

      {/* Insights tab */}
      {activeTab === "insights" && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-white font-semibold text-lg">
              AI Insights
              {counts.all > 0 && <span className="ml-2 text-sm text-gray-500 font-normal">{counts.all} active</span>}
            </h2>
            {insights.length > 0 && (
              <div className="flex items-center gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
                {filterTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${filter === tab.key ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-300"}`}
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === tab.key ? "bg-gray-700 text-gray-300" : "bg-gray-800 text-gray-600"}`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {insights.length === 0 && (
            <div className="bg-gray-900 border border-gray-800 border-dashed rounded-2xl p-16 text-center">
              <div className="text-5xl mb-4">🧠</div>
              <h3 className="text-white font-semibold text-lg mb-2">No insights yet</h3>
              <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
                Upload your sales data CSV and our AI will analyze it and surface 8-10 insights about where you are losing deals.
              </p>
              <a href="/upload" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl text-sm transition">
                Upload Sales Data
              </a>
            </div>
          )}

          {insights.length > 0 && visibleInsights.length === 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
              <div className="text-4xl mb-3">✅</div>
              <h3 className="text-white font-semibold mb-1">All caught up</h3>
              <p className="text-gray-400 text-sm">
                {filter !== "all" ? `No ${filter} insights. Try a different filter.` : "Upload new data to get fresh insights."}
              </p>
            </div>
          )}

          <div className="space-y-3">
            {visibleInsights.map((insight) => {
              const config = priorityConfig[insight.priority];
              const isExpanded = expanded === insight.id;
              return (
                <div
                  key={insight.id}
                  onClick={() => setExpanded(isExpanded ? null : insight.id)}
                  className={`bg-gray-900 border rounded-2xl p-5 transition-all duration-200 cursor-pointer ${config.border} ${config.hover} hover:bg-gray-800/50 hover:-translate-y-0.5 hover:shadow-lg`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${config.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                          {config.label}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-800 px-2.5 py-1 rounded-full">{insight.category}</span>
                        {insight.metric && <span className="text-xs text-blue-400 font-semibold">{insight.metric}</span>}
                      </div>
                      <h3 className="text-white font-semibold text-sm leading-snug">{insight.title}</h3>
                      {isExpanded && <p className="text-gray-400 text-sm leading-relaxed mt-2">{insight.body}</p>}
                      {!isExpanded && <p className="text-gray-600 text-xs mt-1">Click to expand</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDismiss(insight.id); }}
                        className="text-gray-600 hover:text-gray-400 transition p-1 rounded-lg hover:bg-gray-700"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <svg className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
