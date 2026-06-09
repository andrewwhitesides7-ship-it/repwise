"use client";

import { useState } from "react";

interface SalesRecord {
  knocked: number;
  closed: number;
  deal_value: number;
  zip: string | null;
  rep_name: string | null;
}

function formatMoney(n: number): string {
  if (n >= 1000000) return "$" + (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return "$" + (n / 1000).toFixed(0) + "K";
  return "$" + Math.round(n).toLocaleString();
}

export default function TerritoryMap({ records }: { records: SalesRecord[] }) {
  const [showProjection, setShowProjection] = useState(false);

  if (!records.length) return null;

  const zipMap: Record<string, { knocked: number; closed: number; revenue: number; reps: Set<string> }> = {};

  records.forEach(r => {
    if (!r.zip) return;
    if (!zipMap[r.zip]) zipMap[r.zip] = { knocked: 0, closed: 0, revenue: 0, reps: new Set() };
    zipMap[r.zip].knocked += r.knocked || 1;
    zipMap[r.zip].closed += r.closed || 0;
    zipMap[r.zip].revenue += r.deal_value || 0;
    if (r.rep_name) zipMap[r.zip].reps.add(r.rep_name);
  });

  const totalKnocked = Object.values(zipMap).reduce((s, z) => s + z.knocked, 0);
  const avgDeal = records.reduce((s, r) => s + (r.deal_value || 0), 0) /
    Math.max(1, records.reduce((s, r) => s + (r.closed || 0), 0));

  const territories = Object.entries(zipMap)
    .map(([zip, data]) => ({
      zip,
      knocked: data.knocked,
      closed: data.closed,
      revenue: data.revenue,
      closeRate: data.knocked > 0 ? data.closed / data.knocked : 0,
      efficiency: data.knocked > 0 ? data.revenue / data.knocked : 0,
      reps: Array.from(data.reps),
      shareOfKnocks: data.knocked / totalKnocked,
    }))
    .sort((a, b) => b.closeRate - a.closeRate);

  const top3 = territories.slice(0, 3);
  const bottom3 = territories.slice(-3).reverse();

  const currentRevenue = territories.reduce((s, t) => s + t.revenue, 0);
  const top3Potential = top3.reduce((s, t) => {
    const additionalKnocks = totalKnocked * 0.3;
    return s + additionalKnocks * t.closeRate * avgDeal;
  }, 0);

  const teamCloseRate = territories.reduce((s, t) => s + t.closeRate * t.shareOfKnocks, 0);
  const wastedKnocks = territories
    .filter(t => t.closeRate < teamCloseRate * 0.5)
    .reduce((s, t) => s + t.knocked, 0);
  const wastedRevenue = wastedKnocks * teamCloseRate * avgDeal;

  return (
    <div className="bg-[#0d0d18] border border-white/6 rounded-2xl overflow-hidden">
      <div className="px-6 py-5 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-black text-base">Territory Intelligence</h3>
            <p className="text-gray-600 text-xs mt-0.5">{territories.length} territories analyzed</p>
          </div>
          <button
            onClick={() => setShowProjection(!showProjection)}
            className={"px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-200 " + (showProjection ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-white/4 text-gray-400 border-white/6 hover:text-white")}
          >
            {showProjection ? "Hide projection" : "Show revenue projection"}
          </button>
        </div>
      </div>

      {showProjection && (
        <div className="px-6 py-4 bg-blue-500/5 border-b border-blue-500/10">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-[#0d0d18] border border-white/6 rounded-xl p-4">
              <p className="text-gray-600 text-xs font-semibold uppercase tracking-wider mb-2">If you focused ONLY on top 3 ZIPs</p>
              <p className="text-emerald-400 text-2xl font-black">{formatMoney(currentRevenue + top3Potential)}</p>
              <p className="text-emerald-400 text-xs mt-1">+{formatMoney(top3Potential)} vs current</p>
            </div>
            <div className="bg-[#0d0d18] border border-white/6 rounded-xl p-4">
              <p className="text-gray-600 text-xs font-semibold uppercase tracking-wider mb-2">Knocks wasted on low performers</p>
              <p className="text-red-400 text-2xl font-black">{wastedKnocks.toLocaleString()}</p>
              <p className="text-red-400 text-xs mt-1">{formatMoney(wastedRevenue)} in lost opportunity</p>
            </div>
            <div className="bg-[#0d0d18] border border-white/6 rounded-xl p-4">
              <p className="text-gray-600 text-xs font-semibold uppercase tracking-wider mb-2">Best territory close rate</p>
              <p className="text-blue-400 text-2xl font-black">{(top3[0]?.closeRate * 100).toFixed(0)}%</p>
              <p className="text-blue-400 text-xs mt-1">ZIP {top3[0]?.zip} — {top3[0]?.knocked} knocks</p>
            </div>
          </div>
          {top3[0] && (
            <div className="mt-3 bg-emerald-500/8 border border-emerald-500/15 rounded-xl px-4 py-3">
              <p className="text-emerald-400 text-xs font-bold">
                ACTION: If you ONLY knocked ZIP {top3[0].zip} at {(top3[0].closeRate * 100).toFixed(0)}% close rate you would make {formatMoney(totalKnocked * top3[0].closeRate * avgDeal)} per period — {formatMoney(totalKnocked * top3[0].closeRate * avgDeal - currentRevenue)} more than now.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="p-6">
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <p className="text-emerald-400 text-xs font-black uppercase tracking-wider mb-3">Top Performing Territories</p>
            <div className="space-y-2">
              {top3.map((t, i) => (
                <div key={t.zip} className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-white text-sm font-bold">ZIP {t.zip}</p>
                      <span className="text-emerald-400 text-xs font-black">{(t.closeRate * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <span>{t.knocked} knocks</span>
                      <span>{t.closed} closes</span>
                      <span>{formatMoney(t.revenue)}</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1 mt-2">
                      <div
                        className="bg-emerald-500 h-1 rounded-full"
                        style={{ width: Math.min(t.closeRate * 200, 100) + "%" }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-red-400 text-xs font-black uppercase tracking-wider mb-3">Underperforming Territories</p>
            <div className="space-y-2">
              {bottom3.map((t, i) => (
                <div key={t.zip} className="flex items-center gap-3 bg-red-500/5 border border-red-500/10 rounded-xl p-3">
                  <div className="w-7 h-7 rounded-lg bg-red-600/60 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                    ↓
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-white text-sm font-bold">ZIP {t.zip}</p>
                      <span className="text-red-400 text-xs font-black">{(t.closeRate * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <span>{t.knocked} knocks wasted</span>
                      <span>{formatMoney(t.revenue)}</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1 mt-2">
                      <div
                        className="bg-red-500 h-1 rounded-full"
                        style={{ width: Math.min(t.closeRate * 200, 100) + "%" }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5">
          <p className="text-white text-xs font-bold uppercase tracking-wider mb-3">All Territories Ranked</p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left pb-2 text-xs font-bold text-gray-600">ZIP</th>
                  <th className="text-left pb-2 text-xs font-bold text-gray-600">Close Rate</th>
                  <th className="text-left pb-2 text-xs font-bold text-gray-600">Knocks</th>
                  <th className="text-left pb-2 text-xs font-bold text-gray-600">Revenue</th>
                  <th className="text-left pb-2 text-xs font-bold text-gray-600">Reps</th>
                  <th className="text-left pb-2 text-xs font-bold text-gray-600">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/3">
                {territories.map((t, i) => {
                  const isTop = i < 3;
                  const isBottom = t.closeRate < teamCloseRate * 0.5;
                  return (
                    <tr key={t.zip} className="hover:bg-white/2 transition-colors">
                      <td className="py-2.5 text-white text-sm font-semibold">{t.zip}</td>
                      <td className="py-2.5">
                        <span className={"text-sm font-black " + (isTop ? "text-emerald-400" : isBottom ? "text-red-400" : "text-white")}>
                          {(t.closeRate * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2.5 text-gray-400 text-sm">{t.knocked}</td>
                      <td className="py-2.5 text-gray-400 text-sm">{formatMoney(t.revenue)}</td>
                      <td className="py-2.5 text-gray-600 text-xs">{t.reps.join(", ")}</td>
                      <td className="py-2.5">
                        <span className={"text-xs font-bold px-2 py-0.5 rounded-full " + (
                          isTop ? "bg-emerald-500/10 text-emerald-400" :
                          isBottom ? "bg-red-500/10 text-red-400" :
                          "bg-white/4 text-gray-500"
                        )}>
                          {isTop ? "Double down" : isBottom ? "Abandon" : "Maintain"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
