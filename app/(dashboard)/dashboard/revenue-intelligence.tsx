"use client";

import { useState, useEffect, useRef } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";

interface SalesRecord {
  rep_name: string | null;
  knocked: number;
  closed: number;
  deal_value: number;
  time_of_day: string | null;
  zip: string | null;
  date: string | null;
}

function getMostFrequent(arr: string[]): string {
  const freq: Record<string, number> = {};
  arr.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || "Unknown";
}

function formatMoney(n: number): string {
  if (n >= 1000000) return "$" + (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return "$" + (n / 1000).toFixed(0) + "K";
  return "$" + Math.round(n).toLocaleString();
}

function useCountUp(target: number, duration = 1500) {
  const [count, setCount] = useState(0);
  const ref = useRef(false);
  useEffect(() => {
    if (ref.current || target === 0) return;
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

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0d0d18] border border-white/10 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-bold" style={{ color: p.color }}>
          {p.name}: {formatMoney(p.value)}
        </p>
      ))}
    </div>
  );
}

export default function RevenueIntelligence({ records }: { records: SalesRecord[] }) {
  const [activeGoals, setActiveGoals] = useState<Record<string, boolean>>({});
  const [showBreakdown, setShowBreakdown] = useState(false);

  if (!records.length) return null;

  const totalKnocked = records.reduce((s, r) => s + (r.knocked || 0), 0) || records.length;
  const totalClosed = records.reduce((s, r) => s + (r.closed || 0), 0);
  const totalRevenue = records.reduce((s, r) => s + (r.deal_value || 0), 0);
  const closeRate = totalKnocked > 0 ? totalClosed / totalKnocked : 0;
  const avgDeal = totalClosed > 0 ? totalRevenue / totalClosed : 0;

  const repMap: Record<string, { knocked: number; closed: number; revenue: number }> = {};
  records.forEach(r => {
    const rep = r.rep_name || "Unknown";
    if (!repMap[rep]) repMap[rep] = { knocked: 0, closed: 0, revenue: 0 };
    repMap[rep].knocked += r.knocked || 1;
    repMap[rep].closed += r.closed || 0;
    repMap[rep].revenue += r.deal_value || 0;
  });

  const reps = Object.entries(repMap)
    .map(([name, data]) => ({
      name,
      closeRate: data.knocked > 0 ? data.closed / data.knocked : 0,
      revenue: data.revenue,
      knocked: data.knocked,
      closed: data.closed,
    }))
    .sort((a, b) => b.closeRate - a.closeRate);

  const topRep = reps[0];
  const bottomReps = reps.filter(r => r.closeRate < closeRate * 0.7);

  const recoveryGoals = [
    {
      id: "coach_bottom",
      label: "Coach bottom reps to team average",
      impact: bottomReps.reduce((s, r) => {
        const gap = closeRate - r.closeRate;
        return s + gap * r.knocked * avgDeal;
      }, 0),
      description: bottomReps.length + " reps below average",
    },
    {
      id: "shift_time",
      label: "Shift knocking to peak hours",
      impact: totalRevenue * 0.12,
      description: "Est. 12% lift from time optimization",
    },
    {
      id: "followup",
      label: "Follow up on all warm leads",
      impact: avgDeal * Math.round(totalKnocked * 0.08),
      description: "Est. " + Math.round(totalKnocked * 0.08) + " unfollowed leads",
    },
    {
      id: "territory",
      label: "Focus on top converting territories",
      impact: totalRevenue * 0.15,
      description: "Est. 15% lift from territory focus",
    },
    {
      id: "replicate_top",
      label: "Replicate top rep approach",
      impact: topRep ? (topRep.closeRate - closeRate) * totalKnocked * avgDeal * 0.5 : 0,
      description: topRep ? topRep.name + " closes at " + (topRep.closeRate * 100).toFixed(0) + "%" : "",
    },
  ];

  const totalImpact = recoveryGoals.reduce((s, g) => s + (activeGoals[g.id] ? g.impact : 0), 0);
  const baseRevenue6m = totalRevenue * 6;
  const optimized6m = baseRevenue6m + totalImpact * 6;

  const chartData = Array.from({ length: 6 }, (_, i) => ({
    month: ["Month 1", "Month 2", "Month 3", "Month 4", "Month 5", "Month 6"][i],
    Current: Math.round(totalRevenue * (1 + i * 0.01)),
    Optimized: Math.round(totalRevenue * (1 + i * 0.01) + totalImpact * Math.min((i + 1) / 3, 1)),
  }));

  const gap = optimized6m - baseRevenue6m;
  const gapCount = useCountUp(Math.round(gap / 1000));

  return (
    <div className="space-y-4">

      {/* Headline hook */}
      <div className="relative overflow-hidden bg-gradient-to-br from-red-950/40 via-[#0d0d18] to-[#0d0d18] border border-red-500/20 rounded-2xl p-7">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full blur-3xl" />
        <div className="relative z-10">
          <p className="text-red-400 text-xs font-black uppercase tracking-widest mb-3">Revenue Recovery Analysis</p>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-2">
            You are leaving{" "}
            <span className="text-red-400">
              ${gapCount}K
            </span>{" "}
            on the table.
          </h2>
          <p className="text-gray-400 text-base mb-6">
            Based on your team data — here is exactly where the money is leaking and how to recover it.
          </p>
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-black px-6 py-3 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-red-600/25 hover:-translate-y-0.5"
          >
            {showBreakdown ? "Hide breakdown" : "Show me how to recover it"}
            <svg className={"w-4 h-4 transition-transform duration-200 " + (showBreakdown ? "rotate-180" : "")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {showBreakdown && (
        <>
          {/* Revenue gap cards */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Current 6-month path", value: formatMoney(baseRevenue6m), sub: "If nothing changes", color: "text-gray-300", border: "border-white/6" },
              { label: "Optimized 6-month path", value: formatMoney(optimized6m), sub: "With all goals active", color: "text-emerald-400", border: "border-emerald-500/20" },
              { label: "Money being left behind", value: formatMoney(gap), sub: "Your recovery opportunity", color: "text-red-400", border: "border-red-500/20" },
            ].map(card => (
              <div key={card.label} className={"bg-[#0d0d18] border " + card.border + " rounded-2xl p-5"}>
                <p className="text-gray-600 text-xs font-semibold uppercase tracking-wider mb-2">{card.label}</p>
                <p className={"text-2xl font-black " + card.color}>{card.value}</p>
                <p className="text-gray-600 text-xs mt-1">{card.sub}</p>
              </div>
            ))}
          </div>

          {/* Interactive goal toggles */}
          <div className="bg-[#0d0d18] border border-white/6 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-white font-black text-base">Build your recovery plan</h3>
                <p className="text-gray-600 text-xs mt-0.5">Toggle goals to see real-time revenue impact</p>
              </div>
              <div className="text-right">
                <p className="text-emerald-400 font-black text-xl">{formatMoney(totalImpact)}</p>
                <p className="text-gray-600 text-xs">monthly recovery potential</p>
              </div>
            </div>
            <div className="space-y-3">
              {recoveryGoals.filter(g => g.impact > 0).map(goal => (
                <div
                  key={goal.id}
                  onClick={() => setActiveGoals(prev => ({ ...prev, [goal.id]: !prev[goal.id] }))}
                  className={"flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-200 " + (
                    activeGoals[goal.id]
                      ? "bg-emerald-500/5 border-emerald-500/25"
                      : "bg-white/2 border-white/6 hover:border-white/12"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={"w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 " + (
                      activeGoals[goal.id] ? "bg-emerald-500 border-emerald-500" : "border-white/20"
                    )}>
                      {activeGoals[goal.id] && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">{goal.label}</p>
                      <p className="text-gray-600 text-xs">{goal.description}</p>
                    </div>
                  </div>
                  <span className="text-emerald-400 font-black text-sm flex-shrink-0 ml-4">
                    +{formatMoney(goal.impact)}/mo
                  </span>
                </div>
              ))}
            </div>
            {totalImpact > 0 && (
              <div className="mt-4 bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-center justify-between">
                <p className="text-emerald-400 text-sm font-bold">All selected goals implemented</p>
                <p className="text-emerald-400 font-black">+{formatMoney(totalImpact * 6)} over 6 months</p>
              </div>
            )}
          </div>

          {/* 6-month projection chart */}
          <div className="bg-[#0d0d18] border border-white/6 rounded-2xl p-6">
            <div className="mb-5">
              <h3 className="text-white font-black text-base">Your Revenue Path: Current vs Optimized</h3>
              <p className="text-gray-600 text-xs mt-0.5">Toggle goals above to see the green line move</p>
            </div>
            <div className="flex items-center gap-6 mb-4">
              {[
                { color: "#374151", label: "Current trajectory" },
                { color: "#10b981", label: "With selected goals" },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: l.color }} />
                  <span className="text-gray-500 text-xs">{l.label}</span>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="currentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#374151" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#374151" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="optimizedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => "$" + (v / 1000).toFixed(0) + "k"} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Current" stroke="#374151" strokeWidth={2} fill="url(#currentGrad)" name="Current" />
                <Area type="monotone" dataKey="Optimized" stroke="#10b981" strokeWidth={2.5} fill="url(#optimizedGrad)" name="Optimized" dot={{ fill: "#10b981", r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
