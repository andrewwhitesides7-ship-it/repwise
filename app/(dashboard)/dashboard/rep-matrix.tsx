"use client";

import { useState } from "react";

interface SalesRecord {
  rep_name: string | null;
  knocked: number;
  closed: number;
  deal_value: number;
  time_of_day: string | null;
  zip: string | null;
}

function getMostFrequent(arr: string[]): string {
  if (!arr.length) return "Unknown";
  const freq: Record<string, number> = {};
  arr.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || "Unknown";
}

function getTimeSlot(time: string): string {
  const hour = parseInt(time.split(":")[0]);
  if (isNaN(hour)) return "Unknown";
  if (hour >= 8 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 15) return "Early PM";
  if (hour >= 15 && hour < 18) return "Late PM";
  return "Evening";
}

export default function RepMatrix({ records }: { records: SalesRecord[] }) {
  const [sortBy, setSortBy] = useState<"closeRate" | "revenue" | "knocked">("closeRate");

  if (!records.length) return null;

  const repMap: Record<string, {
    knocked: number;
    closed: number;
    revenue: number;
    times: string[];
    zips: string[];
  }> = {};

  records.forEach(r => {
    const rep = r.rep_name || "Unknown";
    if (!repMap[rep]) repMap[rep] = { knocked: 0, closed: 0, revenue: 0, times: [], zips: [] };
    repMap[rep].knocked += r.knocked || 1;
    repMap[rep].closed += r.closed || 0;
    repMap[rep].revenue += r.deal_value || 0;
    if (r.time_of_day) repMap[rep].times.push(r.time_of_day);
    if (r.zip) repMap[rep].zips.push(r.zip);
  });

  const reps = Object.entries(repMap).map(([name, data]) => ({
    name,
    knocked: data.knocked,
    closed: data.closed,
    revenue: data.revenue,
    closeRate: data.knocked > 0 ? data.closed / data.knocked : 0,
    avgDeal: data.closed > 0 ? data.revenue / data.closed : 0,
    topTime: data.times.length > 0 ? getTimeSlot(getMostFrequent(data.times)) : "Unknown",
    topZip: data.zips.length > 0 ? getMostFrequent(data.zips) : "Unknown",
    knocksPerDay: Math.round(data.knocked / Math.max(1, new Set(records.filter(r => r.rep_name === name).map(r => r.zip)).size)),
  }));

  const sorted = [...reps].sort((a, b) => {
    if (sortBy === "closeRate") return b.closeRate - a.closeRate;
    if (sortBy === "revenue") return b.revenue - a.revenue;
    return b.knocked - a.knocked;
  });

  const teamAvgCloseRate = reps.reduce((s, r) => s + r.closeRate, 0) / reps.length;
  const topRep = sorted[0];
  const bottomRep = sorted[sorted.length - 1];

  return (
    <div className="bg-[#0d0d18] border border-white/6 rounded-2xl overflow-hidden">
      <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
        <div>
          <h3 className="text-white font-black text-base">Rep Performance Matrix</h3>
          <p className="text-gray-600 text-xs mt-0.5">Team average close rate: {(teamAvgCloseRate * 100).toFixed(1)}%</p>
        </div>
        <div className="flex items-center gap-1 bg-white/4 border border-white/6 rounded-xl p-1">
          {(["closeRate", "revenue", "knocked"] as const).map(s => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={"px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 " + (sortBy === s ? "bg-white/8 text-white" : "text-gray-600 hover:text-gray-300")}
            >
              {s === "closeRate" ? "Close Rate" : s === "revenue" ? "Revenue" : "Volume"}
            </button>
          ))}
        </div>
      </div>

      {topRep && bottomRep && topRep.name !== bottomRep.name && (
        <div className="px-6 py-4 bg-amber-500/5 border-b border-amber-500/10">
          <p className="text-amber-400 text-xs font-bold mb-2">WHY WINNERS WIN — KEY DIFFERENCE</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-emerald-500/8 border border-emerald-500/15 rounded-xl p-3">
              <p className="text-emerald-400 text-xs font-black mb-2">🏆 {topRep.name} — {(topRep.closeRate * 100).toFixed(0)}% close rate</p>
              <div className="space-y-1">
                <p className="text-gray-400 text-xs">• Knocks {topRep.topTime} — peak conversion window</p>
                <p className="text-gray-400 text-xs">• Top territory: {topRep.topZip}</p>
                <p className="text-gray-400 text-xs">• ${Math.round(topRep.avgDeal).toLocaleString()} average deal value</p>
              </div>
            </div>
            <div className="bg-red-500/8 border border-red-500/15 rounded-xl p-3">
              <p className="text-red-400 text-xs font-black mb-2">⚠️ {bottomRep.name} — {(bottomRep.closeRate * 100).toFixed(0)}% close rate</p>
              <div className="space-y-1">
                <p className="text-gray-400 text-xs">• Knocks {bottomRep.topTime} — lower conversion window</p>
                <p className="text-gray-400 text-xs">• Top territory: {bottomRep.topZip}</p>
                <p className="text-gray-400 text-xs">• ${Math.round(bottomRep.avgDeal).toLocaleString()} average deal value</p>
              </div>
            </div>
          </div>
          <div className="mt-3 bg-blue-500/8 border border-blue-500/15 rounded-xl px-3 py-2">
            <p className="text-blue-400 text-xs font-bold">
              ACTION: Move {bottomRep.name} to {topRep.topTime} time slot and {topRep.topZip} territory. Est. impact: +{((topRep.closeRate - bottomRep.closeRate) * bottomRep.knocked * (bottomRep.avgDeal || 1000)).toLocaleString()} revenue.
            </p>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-5 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Rep</th>
              <th className="text-left px-5 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-gray-300 transition-colors" onClick={() => setSortBy("closeRate")}>Close Rate</th>
              <th className="text-left px-5 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-gray-300 transition-colors" onClick={() => setSortBy("revenue")}>Revenue</th>
              <th className="text-left px-5 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Avg Deal</th>
              <th className="text-left px-5 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-gray-300 transition-colors" onClick={() => setSortBy("knocked")}>Knocks</th>
              <th className="text-left px-5 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Best Time</th>
              <th className="text-left px-5 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Top ZIP</th>
              <th className="text-left px-5 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">vs Team</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/4">
            {sorted.map((rep, i) => {
              const vsTeam = rep.closeRate - teamAvgCloseRate;
              const isTop = i === 0;
              const isBottom = rep.closeRate < teamAvgCloseRate * 0.7;
              return (
                <tr key={rep.name} className={"hover:bg-white/2 transition-colors duration-150 " + (isTop ? "bg-emerald-500/3" : isBottom ? "bg-red-500/3" : "")}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className={"w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-black flex-shrink-0 " + (isTop ? "bg-emerald-600" : isBottom ? "bg-red-600/60" : "bg-blue-600/40")}>
                        {rep.name[0]?.toUpperCase()}
                      </div>
                      <span className="text-white text-sm font-semibold">{rep.name}</span>
                      {isTop && <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full font-black">TOP</span>}
                      {isBottom && <span className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-full font-black">NEEDS HELP</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-white/5 rounded-full h-1.5">
                        <div
                          className={"h-1.5 rounded-full " + (isTop ? "bg-emerald-500" : isBottom ? "bg-red-500" : "bg-blue-500")}
                          style={{ width: Math.min(rep.closeRate * 100 * 2, 100) + "%" }}
                        />
                      </div>
                      <span className={"text-sm font-black " + (isTop ? "text-emerald-400" : isBottom ? "text-red-400" : "text-white")}>
                        {(rep.closeRate * 100).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-white text-sm font-semibold">${rep.revenue > 1000 ? (rep.revenue / 1000).toFixed(0) + "K" : Math.round(rep.revenue)}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-gray-400 text-sm">${Math.round(rep.avgDeal).toLocaleString()}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-gray-400 text-sm">{rep.knocked}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={"text-xs font-semibold px-2 py-1 rounded-lg " + (rep.topTime === topRep?.topTime ? "bg-emerald-500/10 text-emerald-400" : "bg-white/4 text-gray-400")}>
                      {rep.topTime}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-gray-500 text-xs">{rep.topZip}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={"text-xs font-black " + (vsTeam >= 0 ? "text-emerald-400" : "text-red-400")}>
                      {vsTeam >= 0 ? "+" : ""}{(vsTeam * 100).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
