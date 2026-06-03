"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

interface Upload {
  id: string;
  file_name: string;
  status: string;
  created_at: string;
  row_count: number | null;
}

interface Insight {
  id: string;
  upload_id: string | null;
  priority: "critical" | "opportunity" | "pattern";
  category: string;
  title: string;
  body: string;
  metric: string | null;
  is_dismissed: boolean;
  created_at: string;
}

type SortField = "created_at" | "priority" | "category" | "title";
type SortDir = "asc" | "desc";
type PriorityFilter = "all" | "critical" | "opportunity" | "pattern";
type StatusFilter = "all" | "active" | "dismissed";

const priorityConfig = {
  critical: { label: "Critical", badge: "bg-red-500/15 text-red-400 border border-red-500/20", dot: "bg-red-400", order: 0 },
  opportunity: { label: "Opportunity", badge: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20", dot: "bg-emerald-400", order: 1 },
  pattern: { label: "Pattern", badge: "bg-blue-500/15 text-blue-400 border border-blue-500/20", dot: "bg-blue-400", order: 2 },
};

export default function HistoryClient({ uploads, insights }: { uploads: Upload[]; insights: Insight[] }) {
  const [activeTab, setActiveTab] = useState<"uploads" | "insights">("uploads");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUpload, setSelectedUpload] = useState<string | null>(null);

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  }

  const filteredInsights = useMemo(() => {
    let filtered = [...insights];
    if (priorityFilter !== "all") filtered = filtered.filter(i => i.priority === priorityFilter);
    if (statusFilter === "active") filtered = filtered.filter(i => !i.is_dismissed);
    if (statusFilter === "dismissed") filtered = filtered.filter(i => i.is_dismissed);
    if (selectedUpload) filtered = filtered.filter(i => i.upload_id === selectedUpload);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(i => i.title.toLowerCase().includes(q) || i.body.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
    }
    filtered.sort((a, b) => {
      let aVal: string | number = a[sortField] || "";
      let bVal: string | number = b[sortField] || "";
      if (sortField === "priority") {
        aVal = priorityConfig[a.priority]?.order ?? 99;
        bVal = priorityConfig[b.priority]?.order ?? 99;
      }
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return filtered;
  }, [insights, priorityFilter, statusFilter, selectedUpload, searchQuery, sortField, sortDir]);

  const SortIcon = ({ field }: { field: SortField }) => (
    <svg className={`w-3.5 h-3.5 ml-1 inline transition-colors ${sortField === field ? "text-blue-400" : "text-gray-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      {sortField === field && sortDir === "asc"
        ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        : <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />}
    </svg>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">History</h1>
          <p className="text-gray-400 text-sm">All your past uploads and every insight ever generated.</p>
        </div>
        <Link href="/upload" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition shadow-lg shadow-blue-500/20">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
          New upload
        </Link>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total uploads", value: uploads.length, icon: "📤", color: "text-blue-400" },
          { label: "Total insights", value: insights.length, icon: "🧠", color: "text-purple-400" },
          { label: "Active insights", value: insights.filter(i => !i.is_dismissed).length, icon: "✅", color: "text-emerald-400" },
          { label: "Archived", value: insights.filter(i => i.is_dismissed).length, icon: "📦", color: "text-gray-400" },
        ].map(stat => (
          <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">{stat.label}</span>
              <span>{stat.icon}</span>
            </div>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 mb-6 w-fit">
        <button onClick={() => setActiveTab("uploads")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === "uploads" ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-300"}`}>
          Uploads
          <span className="text-xs bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded-full">{uploads.length}</span>
        </button>
        <button onClick={() => setActiveTab("insights")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === "insights" ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-300"}`}>
          All Insights
          <span className="text-xs bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded-full">{insights.length}</span>
        </button>
      </div>

      {/* Uploads tab */}
      {activeTab === "uploads" && (
        <div>
          {uploads.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 border-dashed rounded-2xl p-16 text-center">
              <div className="text-5xl mb-4">📋</div>
              <h3 className="text-white font-semibold text-lg mb-2">No uploads yet</h3>
              <p className="text-gray-400 text-sm mb-6">Upload your first CSV to start building your history.</p>
              <Link href="/upload" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl text-sm transition">Upload data</Link>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">File</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Insights</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-5 py-3.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {uploads.map(upload => {
                      const uploadInsights = insights.filter(i => i.upload_id === upload.id);
                      const isSelected = selectedUpload === upload.id;
                      return (
                        <tr key={upload.id} className={`hover:bg-gray-800/30 transition ${isSelected ? "bg-blue-500/5" : ""}`}>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-center text-sm flex-shrink-0">
                                {upload.file_name.includes("HubSpot") ? "🟠" : upload.file_name.includes("Salesforce") ? "☁️" : "📄"}
                              </div>
                              <div>
                                <p className="text-white text-sm font-medium">{upload.file_name}</p>
                                {upload.row_count && <p className="text-gray-500 text-xs">{upload.row_count} rows</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
                              upload.status === "complete" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                              upload.status === "failed" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                              "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${upload.status === "complete" ? "bg-emerald-400" : upload.status === "failed" ? "bg-red-400" : "bg-yellow-400"}`} />
                              {upload.status}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-white text-sm font-semibold">{uploadInsights.length}</span>
                              <div className="flex gap-1">
                                {["critical", "opportunity", "pattern"].map(p => {
                                  const count = uploadInsights.filter(i => i.priority === p).length;
                                  if (!count) return null;
                                  return (
                                    <span key={p} className={`text-xs px-1.5 py-0.5 rounded-full ${
                                      p === "critical" ? "bg-red-500/10 text-red-400" :
                                      p === "opportunity" ? "bg-emerald-500/10 text-emerald-400" :
                                      "bg-blue-500/10 text-blue-400"
                                    }`}>{count}</span>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-gray-400 text-sm">{new Date(upload.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                          </td>
                          <td className="px-5 py-4">
                            <button
                              onClick={() => {
                                setSelectedUpload(isSelected ? null : upload.id);
                                setActiveTab("insights");
                              }}
                              className="text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg transition"
                            >
                              View insights
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Insights tab */}
      {activeTab === "insights" && (
        <div>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <div className="relative flex-1 min-w-48">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                type="text"
                placeholder="Search insights..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 text-white placeholder-gray-600 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <div className="flex items-center gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
              {(["all", "critical", "opportunity", "pattern"] as PriorityFilter[]).map(p => (
                <button key={p} onClick={() => setPriorityFilter(p)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition capitalize ${priorityFilter === p ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-300"}`}>
                  {p === "all" ? "All" : p === "critical" ? "🔴 Critical" : p === "opportunity" ? "🟢 Opportunity" : "🔵 Pattern"}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
              {(["all", "active", "dismissed"] as StatusFilter[]).map(s => (
                <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition capitalize ${statusFilter === s ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-300"}`}>
                  {s}
                </button>
              ))}
            </div>

            {selectedUpload && (
              <button onClick={() => setSelectedUpload(null)} className="flex items-center gap-1.5 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-xl transition hover:bg-blue-500/20">
                Filtered by upload
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}

            <span className="text-gray-600 text-xs ml-auto">{filteredInsights.length} results</span>
          </div>

          {/* Table */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-300 transition" onClick={() => handleSort("priority")}>
                      Priority <SortIcon field="priority" />
                    </th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-300 transition" onClick={() => handleSort("category")}>
                      Category <SortIcon field="category" />
                    </th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-300 transition" onClick={() => handleSort("title")}>
                      Insight <SortIcon field="title" />
                    </th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Metric</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-300 transition" onClick={() => handleSort("created_at")}>
                      Date <SortIcon field="created_at" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredInsights.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-gray-500 text-sm">
                        No insights match your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredInsights.map(insight => {
                      const cfg = priorityConfig[insight.priority] || priorityConfig.pattern;
                      return (
                        <tr key={insight.id} className={`hover:bg-gray-800/30 transition ${insight.is_dismissed ? "opacity-50" : ""}`}>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                              <span className={`w-1 h-1 rounded-full ${cfg.dot}`} />
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-gray-400 text-xs bg-gray-800 px-2 py-1 rounded-lg">{insight.category}</span>
                          </td>
                          <td className="px-5 py-4 max-w-xs">
                            <p className="text-white text-sm font-medium leading-snug">{insight.title}</p>
                            <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{insight.body}</p>
                          </td>
                          <td className="px-5 py-4">
                            {insight.metric && <span className="text-blue-400 text-xs font-semibold">{insight.metric}</span>}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${insight.is_dismissed ? "bg-gray-800 text-gray-500" : "bg-emerald-500/10 text-emerald-400"}`}>
                              {insight.is_dismissed ? "Archived" : "Active"}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-gray-500 text-xs">{new Date(insight.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
