"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from "recharts";

const demoInsights = [
  { id: "1", priority: "critical", category: "Time of Day", title: "You are knocking during dead hours", body: "73% of your closes happen between 2-6pm but you are spending 40% of your time knocking before noon. Shifting 3 hours of morning activity to afternoon could add 4 closes per week.", metric: "+4 closes/week" },
  { id: "2", priority: "critical", category: "Rep Performance", title: "Marcus is burning doors without converting", body: "Marcus knocked 54 doors last week with only 1 close — team average is 1 per 11 doors. This is costing the team an estimated $18,000 in lost revenue per month.", metric: "1 per 54 doors" },
  { id: "3", priority: "opportunity", category: "Territory", title: "ZIP 78704 delivers 34% close rate", body: "Your team has only knocked 15 doors in ZIP 78704 this month but closes 34% of contacts there vs 19% team average. This ZIP is massively underworked.", metric: "34% close rate" },
  { id: "4", priority: "pattern", category: "Follow-Ups", title: "12 warm leads were never called back", body: "You scheduled follow-ups with 12 contacts who showed interest and never returned. Based on your close rate, that is an estimated $28,000 in lost revenue sitting in your pipeline.", metric: "$28k est. lost" },
  { id: "5", priority: "opportunity", category: "Deal Value", title: "Sara closes 34% above team average", body: "Sara averages $23,400 per close while the team averages $17,500. Her opening approach on cold contacts is different — worth a team call to replicate her technique.", metric: "$23,400 avg deal" },
  { id: "6", priority: "pattern", category: "Day of Week", title: "Wednesday outperforms Tuesday by 28%", body: "Wednesday closes at 32% while Tuesday closes at 25%. Scheduling more knocks on Wednesday and reducing Tuesday activity could add 2-3 closes per week.", metric: "+28% vs Tuesday" },
  { id: "7", priority: "critical", category: "Contact Rate", title: "Evening contact rate dropping fast", body: "After 6pm your contact rate drops to 8% vs 31% in the afternoon. Your team is wasting significant door knocks in the evening window when nobody answers.", metric: "8% contact rate" },
  { id: "8", priority: "opportunity", category: "Pipeline", title: "Top 3 ZIPs generate 67% of all revenue", body: "ZIP codes 78704, 78745, and 78702 generate 67% of total revenue despite receiving only 31% of knocking activity. Doubling down here could significantly increase output.", metric: "67% of revenue" },
];

const demoStats = {
  totalClosed: 234,
  totalKnocked: 1000,
  closeRate: "30.2",
  totalRevenue: 4903200,
  avgDeal: 20954,
  topRep: "Priya Patel",
  topRepCloses: 72,
};

const timeOfDayData = [
  { name: "Morning", "Close Rate": 11 },
  { name: "Early PM", "Close Rate": 31 },
  { name: "Late PM", "Close Rate": 38 },
  { name: "Evening", "Close Rate": 8 },
];

const repData = [
  { name: "Priya", Closes: 72 },
  { name: "Sara", Closes: 61 },
  { name: "Jake", Closes: 54 },
  { name: "Tyler", Closes: 32 },
  { name: "Marcus", Closes: 15 },
];

const revenueData = [
  { date: "Jun 1", Revenue: 180000 },
  { date: "Jun 5", Revenue: 220000 },
  { date: "Jun 10", Revenue: 195000 },
  { date: "Jun 15", Revenue: 310000 },
  { date: "Jun 20", Revenue: 275000 },
  { date: "Jun 25", Revenue: 420000 },
  { date: "Jun 30", Revenue: 380000 },
];

const priorityConfig = {
  critical: { label: "Critical", badge: "bg-red-500/15 text-red-400 border border-red-500/20", dot: "bg-red-400" },
  opportunity: { label: "Opportunity", badge: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20", dot: "bg-emerald-400" },
  pattern: { label: "Pattern", badge: "bg-blue-500/15 text-blue-400 border border-blue-500/20", dot: "bg-blue-400" },
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>
          {p.name}: {p.name === "Revenue" ? "$" + Number(p.value).toLocaleString() : p.name === "Close Rate" ? p.value + "%" : p.value}
        </p>
      ))}
    </div>
  );
}

export default function DemoPage() {
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"insights" | "analytics">("insights");
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const activeInsights = demoInsights.filter(i => !dismissed.has(i.id));
  const visibleInsights = activeInsights.filter(i => filter === "all" || i.priority === filter);

  const counts = {
    all: activeInsights.length,
    critical: activeInsights.filter(i => i.priority === "critical").length,
    opportunity: activeInsights.filter(i => i.priority === "opportunity").length,
    pattern: activeInsights.filter(i => i.priority === "pattern").length,
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Demo banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">DEMO</span>
            <p className="text-white text-sm font-medium">This is sample data. Upload your own CSV to see insights about your actual team.</p>
          </div>
          <Link href="/signup" className="flex-shrink-0 bg-white text-blue-600 hover:bg-blue-50 font-bold px-4 py-2 rounded-xl text-sm transition shadow-lg">
            Start free trial →
          </Link>
        </div>
      </div>

      {/* Nav */}
      <div className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">
            Try<span className="text-blue-500">Adunda</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition">Sign in</Link>
            <Link href="/signup" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-xl text-sm transition">
              Start free trial
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Good afternoon, Sarah 👋</h1>
            <p className="text-gray-500 text-sm">{counts.critical} critical · {counts.opportunity} opportunities · {counts.pattern} patterns</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl px-4 py-3 text-center">
            <p className="text-blue-400 text-xs font-medium mb-1">Want insights on your data?</p>
            <Link href="/signup" className="text-white text-xs font-bold hover:text-blue-300 transition">Upload your CSV free →</Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Total Closes", value: demoStats.totalClosed.toLocaleString(), sub: "of 1,000 doors", icon: "🎯", color: "text-blue-400" },
            { label: "Close Rate", value: demoStats.closeRate + "%", sub: "knock to close", icon: "📈", color: "text-emerald-400" },
            { label: "Revenue", value: "$4.9M", sub: "$20,954 avg deal", icon: "💰", color: "text-yellow-400" },
            { label: "Top Rep", value: "Priya", sub: "72 closes", icon: "🏆", color: "text-purple-400" },
          ].map(stat => (
            <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</span>
                <span>{stat.icon}</span>
              </div>
              <div className={"text-xl font-bold mb-0.5 " + stat.color}>{stat.value}</div>
              <div className="text-xs text-gray-600">{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 mb-6 w-fit">
          <button onClick={() => setActiveTab("insights")} className={"flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition " + (activeTab === "insights" ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-300")}>
            AI Insights <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">{counts.all}</span>
          </button>
          <button onClick={() => setActiveTab("analytics")} className={"px-4 py-2 rounded-lg text-sm font-medium transition " + (activeTab === "analytics" ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-300")}>
            Analytics
          </button>
        </div>

        {/* Analytics */}
        {activeTab === "analytics" && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-1">Close Rate by Time of Day</h3>
                <p className="text-gray-500 text-xs mb-5">When your team closes best</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={timeOfDayData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => v + "%"} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Close Rate" radius={[6, 6, 0, 0]} maxBarSize={48}>
                      {timeOfDayData.map((entry, i) => (
                        <Cell key={i} fill={entry["Close Rate"] === 38 ? "#3b82f6" : "#1e3a5f"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-1">Rep Performance</h3>
                <p className="text-gray-500 text-xs mb-5">Closes per rep this period</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={repData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={false} tickLine={false} width={50} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Closes" radius={[0, 6, 6, 0]} maxBarSize={28}>
                      {repData.map((_, i) => (
                        <Cell key={i} fill={["#3b82f6", "#6366f1", "#8b5cf6", "#a78bfa", "#374151"][i]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-1">Revenue Over Time</h3>
              <p className="text-gray-500 text-xs mb-5">Daily revenue from closed deals</p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="demoRevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => "$" + (v / 1000).toFixed(0) + "k"} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="Revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#demoRevGrad)" dot={{ fill: "#3b82f6", r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/10 border border-blue-500/20 rounded-2xl p-6 text-center">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="text-white font-bold text-lg mb-2">See charts for your actual data</h3>
              <p className="text-gray-400 text-sm mb-5">Upload your sales CSV and get real analytics for your team in under 2 minutes.</p>
              <Link href="/signup" className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl text-sm transition shadow-lg shadow-blue-500/20">
                Start free trial — no card needed
              </Link>
            </div>
          </div>
        )}

        {/* Insights */}
        {activeTab === "insights" && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold">AI Insights <span className="text-gray-500 text-sm font-normal">{counts.all} active</span></h2>
                <div className="flex items-center gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
                  {(["all", "critical", "opportunity", "pattern"] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)} className={"px-3 py-1.5 rounded-lg text-xs font-medium transition capitalize " + (filter === f ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-300")}>
                      {f === "all" ? "All " + counts.all : f === "critical" ? "🔴 " + counts.critical : f === "opportunity" ? "🟢 " + counts.opportunity : "🔵 " + counts.pattern}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                {visibleInsights.map(insight => {
                  const cfg = priorityConfig[insight.priority as keyof typeof priorityConfig];
                  const isExpanded = expanded === insight.id;
                  return (
                    <div
                      key={insight.id}
                      onClick={() => setExpanded(isExpanded ? null : insight.id)}
                      className="group bg-gray-900 border border-gray-800 rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:border-gray-700 hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={"inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full " + cfg.badge}>
                              <span className={"w-1.5 h-1.5 rounded-full " + cfg.dot} />
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
                            onClick={e => { e.stopPropagation(); setDismissed(prev => new Set([...prev, insight.id])); }}
                            className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-gray-400 transition p-1 rounded-lg hover:bg-gray-800"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                          <svg className={"w-4 h-4 text-gray-600 transition-transform duration-200 " + (isExpanded ? "rotate-180" : "")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right CTA */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/10 border border-blue-500/20 rounded-2xl p-6 text-center">
                <div className="text-4xl mb-3">🧠</div>
                <h3 className="text-white font-bold text-lg mb-2">Get insights on your data</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-5">Upload your sales CSV and see exactly where your team is losing deals. Takes 2 minutes.</p>
                <Link href="/signup" className="block bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-3 rounded-xl text-sm transition shadow-lg shadow-blue-500/20 mb-3">
                  Start free trial
                </Link>
                <p className="text-gray-600 text-xs">No card needed. 1 free upload.</p>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h3 className="text-white font-semibold text-sm mb-3">Sample goals</h3>
                <div className="space-y-3">
                  {[
                    { title: "Hit 25% close rate", progress: 30, target: 25, unit: "%" },
                    { title: "Double knocks in ZIP 78704", progress: 8, target: 20, unit: "knocks" },
                    { title: "Shift to 2-6pm window", progress: 60, target: 100, unit: "%" },
                  ].map(goal => (
                    <div key={goal.title}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-white text-xs font-medium">{goal.title}</p>
                        <div className="w-8 h-8 relative flex-shrink-0">
                          <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1f2937" strokeWidth="3" />
                            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray={goal.progress + " 100"} strokeLinecap="round" />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">{goal.progress}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-12 bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-transparent border border-blue-500/20 rounded-3xl p-10 text-center">
          <div className="text-4xl mb-4">🚀</div>
          <h2 className="text-3xl font-bold mb-4">Ready to see your real data?</h2>
          <p className="text-gray-400 text-lg mb-6">Upload your sales CSV and get 8-10 AI insights about where your team is losing deals. Takes 2 minutes.</p>
          <Link href="/signup" className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-xl text-sm transition shadow-xl shadow-blue-500/20 hover:-translate-y-0.5 duration-200">
            Start free — upload your first CSV
          </Link>
          <p className="text-gray-600 text-xs mt-4">No credit card required for first upload. 14-day trial to unlock unlimited access.</p>
        </div>
      </div>
    </div>
  );
}
