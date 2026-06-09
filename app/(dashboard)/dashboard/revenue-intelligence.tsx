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

function formatMoney(n: number): string {
  if (n >= 1000000) return "$" + (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return "$" + (n / 1000).toFixed(0) + "K";
  return "$" + Math.round(n).toLocaleString();
}

function useCountUp(target: number, duration = 1500) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(0);
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
  const [expanded, setExpanded] = useState(false);

  // Safeguard against empty data arrays
  if (!records || !records.length) return null;

  // 1. Calculate Aggregated Raw Totals from Dataset
  const totalKnocked = records.reduce((s, r) => s + (r.knocked || 0), 0) || records.length;
  const totalClosed = records.reduce((s, r) => s + (r.closed || 0), 0);
  const totalRevenue = records.reduce((s, r) => s + (r.deal_value || 0), 0);

  const closeRate = totalKnocked > 0 ? totalClosed / totalKnocked : 0;
  const avgDeal = totalClosed > 0 ? totalRevenue / totalClosed : 8500;

  // 2. --- TIME NORMALIZATION ENGINE ---
  // Safely find the span of days inside the data to calculate an accurate monthly baseline
  const validDates = records
    .map(r => (r.date ? new Date(r.date).getTime() : null))
    .filter((time): time is number => time !== null && !isNaN(time));

  let monthsInDataset = 1; // Fallback to 1 standard operational month

  if (validDates.length > 1) {
    const minDate = Math.min(...validDates);
    const maxDate = Math.max(...validDates);
    const diffTime = Math.abs(maxDate - minDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Convert total lifespan days into operational calendar months (avg 30.4 days/mo)
    // Minimum boundary set to 0.5 months to prevent radical division spikes on tiny tests
    monthsInDataset = Math.max(0.5, diffDays / 30.4);
  }

  // Derive stable monthly baselines across accumulated volume
  const monthlyRevenueBaseline = totalRevenue / monthsInDataset;
  const monthlyKnockedBaseline = totalKnocked / monthsInDataset;

  // 3. Build Rep Performance Mapping
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
      knocked: data.knocked / monthsInDataset, // Normalize per month
      closed: data.closed / monthsInDataset,   // Normalize per month
      revenue: data.revenue / monthsInDataset, // Normalize per month
      closeRate: data.knocked > 0 ? data.closed / data.knocked : 0,
    }))
    .sort((a, b) => b.closeRate - a.closeRate);

  const topRep = reps[0];
  const bottomReps = reps.filter(r => r.closeRate < closeRate * 0.85);

  // 4. Build Territory Mapping
  const zipMap: Record<string, { knocked: number; closed: number }> = {};
  records.forEach(r => {
    if (!r.zip) return;
    if (!zipMap[r.zip]) zipMap[r.zip] = { knocked: 0, closed: 0 };
    zipMap[r.zip].knocked += r.knocked || 1;
    zipMap[r.zip].closed += r.closed || 0;
  });

  const territories = Object.entries(zipMap)
    .map(([zip, data]) => ({
      zip,
      knocked: data.knocked / monthsInDataset,
      closed: data.closed / monthsInDataset,
      closeRate: data.knocked > 0 ? data.closed / data.knocked : 0
    }))
    .sort((a, b) => b.closeRate - a.closeRate);

  const topTerritory = territories[0];
  const bottomTerritories = territories.filter(t => t.closeRate < closeRate * 0.5);
  const wastedKnocksMonthly = bottomTerritories.reduce((s, t) => s + t.knocked, 0);

  // 5. Calculate Linear Non-Compounded Quick Win Impacts (Per Single Month Scale)
  const recoveryGoals = [
    {
      id: "coach_bottom",
      label: "Coach bottom reps to team average",
      impact: bottomReps.reduce((s, r) => s + Math.max(0, (closeRate - r.closeRate)) * r.knocked * avgDeal, 0),
      description: bottomReps.length > 0 ? bottomReps.length + " reps closing below " + (closeRate * 100).toFixed(0) + "% team average" : "All reps near team average",
      action: bottomReps.length > 0 ? "Have " + bottomReps.map(r => r.name).join(", ") + " shadow your top rep this week" : null,
    },
    {
      id: "shift_time",
      label: "Shift all knocking to peak hours",
      impact: monthlyRevenueBaseline * 0.08, // Conservative, realistic linear 8% lift on monthly baseline
      description: "Optimizing field calendars prevents burning premium residential open door opportunities",
      action: "Block 2-4pm daily as protected knocking time for every rep",
    },
    {
      id: "followup",
      label: "Recover all unfollowed warm leads",
      impact: avgDeal * Math.max(1, Math.round(monthlyKnockedBaseline * 0.03)), // Expect a safe 3% lead recovery rate on a monthly scale
      description: "Estimated " + Math.round(monthlyKnockedBaseline * 0.05) + " warm leads left without systematic multi-day touchpoints",
      action: "Call every lead from last 30 days who showed interest but never closed",
    },
    {
      id: "territory",
      label: "Stop knocking low-converting territories",
      impact: wastedKnocksMonthly * closeRate * avgDeal * 0.3,
      description: wastedKnocksMonthly > 0 ? Math.round(wastedKnocksMonthly) + " monthly knocks wasted on low-yielding neighborhoods" : "Territory metrics are balanced",
      action: topTerritory ? "Shift field assignments from bottom ZIPs directly to " + topTerritory.zip + " (" + (topTerritory.closeRate * 100).toFixed(0) + "% close rate)" : null,
    },
    {
      id: "replicate_top",
      label: "Replicate top rep approach team-wide",
      impact: topRep ? Math.max(0, (topRep.closeRate - closeRate)) * monthlyKnockedBaseline * avgDeal * 0.12 : 0, // 12% team strategy efficiency capture
      description: topRep ? topRep.name + " closes doors at " + (topRep.closeRate * 100).toFixed(0) + "% vs " + (closeRate * 100).toFixed(0) + "% team average" : "Rep history unavailable",
      action: topRep ? "Have " + topRep.name + " run a 30-min team briefing breaking down their door opener script" : null,
    },
  ].filter(g => g.impact > 50);

  // 6. Compute Consolidated 6-Month Projection Curves
  const activeImpactMonthly = recoveryGoals.reduce((s, g) => s + (activeGoals[g.id] ? g.impact : 0), 0);
  const totalPossibleImpactMonthly = recoveryGoals.reduce((s, g) => s + g.impact, 0);

  const base6m = monthlyRevenueBaseline * 6;
  const totalPossibleGap6m = totalPossibleImpactMonthly * 6;
  const optimized6mMax = base6m + totalPossibleGap6m;

  const selectedActiveGap6m = activeImpactMonthly * 6;
  const activeOptimized6m = base6m + selectedActiveGap6m;

  // Hook animation tracking directly to safe macro aggregate potential value
  const animatedGap = useCountUp(totalPossibleGap6m);

  // Generate clean linear progressive chart data
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const monthIndex = i + 1;
    return {
      month: `M${monthIndex}`,
      Current: Math.round(monthlyRevenueBaseline * monthIndex),
      Optimized: Math.round((monthlyRevenueBaseline * monthIndex) + (activeImpactMonthly * monthIndex)),
    };
  });

  return (
    <div className="space-y-4 mb-6">

      {/* Hero headline — always visible */}
      <div className="relative overflow-hidden bg-gradient-to-br from-red-950/50 via-[#0d0d18] to-[#0d0d18] border border-red-500/25 rounded-2xl p-7">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/6 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-red-900/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                <p className="text-red-400 text-xs font-black uppercase tracking-widest">Revenue Recovery Analysis</p>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-2">
                You are leaving{" "}
                <span className="text-red-400">{formatMoney(animatedGap)}</span>{" "}
                on the table.
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-5 max-w-xl">
                Based on your team data over {monthsInDataset.toFixed(1)} months — your current path generates {formatMoney(base6m)} over 6 months.
                With the optimizations below you could generate {formatMoney(optimized6mMax)}.
              </p>
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-black px-6 py-3 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-red-600/25 hover:-translate-y-0.5"
              >
                {expanded ? "Hide recovery plan" : "Show me how to recover it"}
                <svg className={"w-4 h-4 transition-transform duration-300 " + (expanded ? "rotate-180" : "")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Summary metrics widgets */}
            <div className="grid grid-cols-2 gap-3 flex-shrink-0">
              {[
                { label: "Current 6-mo Path", value: formatMoney(base6m), color: "text-gray-300" },
                { label: "Selected 6-mo Target", value: formatMoney(activeOptimized6m), color: "text-emerald-400" },
                { label: "Total Max Gap", value: formatMoney(totalPossibleGap6m), color: "text-red-400" },
                { label: "Quick Wins Found", value: String(recoveryGoals.length), color: "text-blue-400" },
              ].map(s => (
                <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center min-w-[145px]">
                  <p className="text-gray-400 text-xs mb-1">{s.label}</p>
                  <p className={"text-lg font-black " + s.color}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Interactive Action Section */}
      {expanded && (
        <>
          {/* Interactive goal builder checklist card */}
          <div className="bg-[#0d0d18] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-white font-black text-base">Build your recovery plan</h3>
                <p className="text-gray-500 text-xs mt-0.5">Toggle each action to see its revenue impact in real time</p>
              </div>
              <div className="text-right">
                <p className={"font-black text-xl transition-all duration-500 " + (activeImpactMonthly > 0 ? "text-emerald-400" : "text-gray-500")}>
                  {activeImpactMonthly > 0 ? "+" + formatMoney(activeImpactMonthly) + "/mo" : "Select actions below"}
                </p>
                <p className="text-gray-500 text-xs">selected monthly impact</p>
              </div>
            </div>

            <div className="space-y-3">
              {recoveryGoals.map(goal => (
                <div
                  key={goal.id}
                  className={"border rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 " + (
                    activeGoals[goal.id]
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-white/5 bg-white/5 hover:border-white/10"
                  )}
                  onClick={() => setActiveGoals(prev => ({ ...prev, [goal.id]: !prev[goal.id] }))}
                >
                  <div className="flex items-start gap-4 p-4">
                    <div className={"w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 mt-0.5 " + (
                      activeGoals[goal.id] ? "bg-emerald-500 border-emerald-500" : "border-white/20"
                    )}>
                      {activeGoals[goal.id] && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-white text-sm font-bold">{goal.label}</p>
                          <p className="text-gray-500 text-xs mt-0.5">{goal.description}</p>
                          {activeGoals[goal.id] && goal.action && (
                            <div className="mt-2 bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2">
                              <p className="text-blue-400 text-xs font-bold">ACTION: {goal.action}</p>
                            </div>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-emerald-400 font-black text-sm">+{formatMoney(goal.impact)}/mo</span>
                          <p className="text-gray-600 text-xs">+{formatMoney(goal.impact * 6)} over 6 mo</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {activeImpactMonthly > 0 && (
              <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-emerald-400 font-black text-sm">Selected goals total impact</p>
                  <p className="text-gray-500 text-xs mt-0.5">Implement these changes to start achieving localized run-rate uplifts</p>
                </div>
                <div className="text-right">
                  <p className="text-emerald-400 font-black text-2xl">+{formatMoney(activeImpactMonthly)}/mo</p>
                  <p className="text-emerald-600 text-xs">+{formatMoney(selectedActiveGap6m)} over 6 months</p>
                </div>
              </div>
            )}
          </div>

          {/* 6-month progressive trend area chart */}
          <div className="bg-[#0d0d18] border border-white/10 rounded-2xl p-6">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h3 className="text-white font-black text-base">Cumulative Revenue Path: Current vs Optimized</h3>
                <p className="text-gray-500 text-xs mt-0.5">
                  {activeImpactMonthly > 0 ? "Green line updates as you select plan actions above" : "Select individual action cards above to chart an optimized trajectory"}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {[
                  { color: "#374151", label: "Current Path" },
                  { color: "#10b981", label: "Optimized Path" },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
                    <span className="text-gray-400 text-xs">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="currentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#374151" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#374151" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="optimizedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => formatMoney(v)} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Current" stroke="#374151" strokeWidth={2} fill="url(#currentGrad)" name="Current Baseline" />
                <Area type="monotone" dataKey="Optimized" stroke="#10b981" strokeWidth={2.5} fill="url(#optimizedGrad)" name="Optimized Projection" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Month by month breakdown grid matrix table */}
          <div className="bg-[#0d0d18] border border-white/10 rounded-2xl p-6">
            <h3 className="text-white font-black text-base mb-4">Month-by-Month Cumulative Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left pb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Timeline</th>
                    <th className="text-left pb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Current Path</th>
                    <th className="text-left pb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Optimized Path</th>
                    <th className="text-left pb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Net Recovered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {chartData.map((row, i) => (
                    <tr key={row.month} className="hover:bg-white/5 transition-colors">
                      <td className="py-2.5 text-gray-400 text-sm font-semibold">Month {i + 1}</td>
                      <td className="py-2.5 text-gray-300 text-sm">{formatMoney(row.Current)}</td>
                      <td className="py-2.5 text-emerald-400 text-sm font-bold">{formatMoney(row.Optimized)}</td>
                      <td className="py-2.5">
                        <span className="text-emerald-400 text-sm font-black">+{formatMoney(row.Optimized - row.Current)}</span>
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-white/10">
                    <td className="py-3 text-white text-sm font-black">Total 6-month Aggregate</td>
                    <td className="py-3 text-gray-300 text-sm font-bold">{formatMoney(base6m)}</td>
                    <td className="py-3 text-emerald-400 text-sm font-black">{formatMoney(activeOptimized6m)}</td>
                    <td className="py-3 text-emerald-400 text-sm font-black">+{formatMoney(selectedActiveGap6m)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
