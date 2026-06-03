import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function HistoryPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: uploads } = await supabase
    .from("uploads")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const { data: allInsights } = await supabase
    .from("insights")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const insightsByUpload = (uploads || []).map(upload => ({
    ...upload,
    insights: (allInsights || []).filter(i => i.upload_id === upload.id),
  }));

  const unlinkedInsights = (allInsights || []).filter(i => !i.upload_id);

  const priorityConfig = {
    critical: { label: "Critical", badge: "bg-red-500/15 text-red-400 border border-red-500/20", dot: "bg-red-400" },
    opportunity: { label: "Opportunity", badge: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20", dot: "bg-emerald-400" },
    pattern: { label: "Pattern", badge: "bg-blue-500/15 text-blue-400 border border-blue-500/20", dot: "bg-blue-400" },
  };

  if (!uploads?.length) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Insight History</h1>
          <p className="text-gray-400 text-sm">All your past AI analyses and insights in one place.</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 border-dashed rounded-2xl p-16 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-white font-semibold text-lg mb-2">No history yet</h3>
          <p className="text-gray-400 text-sm mb-6">Upload your first CSV to start building your insight history.</p>
          <Link href="/upload" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl text-sm transition">
            Upload Sales Data
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Insight History</h1>
          <p className="text-gray-400 text-sm">All your past AI analyses and insights in one place.</p>
        </div>
        <Link href="/upload" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition shadow-lg shadow-blue-500/20">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
          New upload
        </Link>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total uploads", value: uploads?.length || 0, icon: "📤" },
          { label: "Total insights generated", value: allInsights?.length || 0, icon: "🧠" },
          { label: "Active insights", value: allInsights?.filter(i => !i.is_dismissed).length || 0, icon: "✅" },
        ].map(stat => (
          <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">{stat.label}</span>
              <span className="text-lg">{stat.icon}</span>
            </div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Uploads with insights */}
      <div className="space-y-6">
        {insightsByUpload.map((upload) => (
          <div key={upload.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${
                  upload.status === "complete" ? "bg-emerald-400" :
                  upload.status === "failed" ? "bg-red-400" :
                  upload.status === "processing" ? "bg-yellow-400 animate-pulse" :
                  "bg-gray-500"
                }`} />
                <div>
                  <p className="text-white font-semibold text-sm">{upload.file_name}</p>
                  <p className="text-gray-500 text-xs">
                    {new Date(upload.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    {upload.row_count ? ` · ${upload.row_count} rows` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                  upload.status === "complete" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                  upload.status === "failed" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                  upload.status === "processing" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                  "bg-gray-500/10 text-gray-400 border-gray-500/20"
                }`}>
                  {upload.status}
                </span>
                <span className="text-xs text-gray-600">{upload.insights.length} insights</span>
              </div>
            </div>

            {upload.insights.length > 0 ? (
              <div className="p-4 space-y-2">
                {upload.insights.map((insight) => {
                  const config = priorityConfig[insight.priority as keyof typeof priorityConfig] || priorityConfig.pattern;
                  return (
                    <div key={insight.id} className={`p-4 rounded-xl border transition ${insight.is_dismissed ? "opacity-40 bg-gray-800/30 border-gray-800" : "bg-gray-800/50 border-gray-700/50"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${config.badge}`}>
                              <span className={`w-1 h-1 rounded-full ${config.dot}`} />
                              {config.label}
                            </span>
                            <span className="text-xs text-gray-600">{insight.category}</span>
                            {insight.metric && <span className="text-xs text-blue-400 font-semibold">{insight.metric}</span>}
                            {insight.is_dismissed && <span className="text-xs text-gray-600">Dismissed</span>}
                          </div>
                          <p className="text-white text-sm font-medium mb-1">{insight.title}</p>
                          <p className="text-gray-400 text-xs leading-relaxed">{insight.body}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-6 py-8 text-center">
                <p className="text-gray-600 text-sm">
                  {upload.status === "failed"
                    ? upload.error_message || "Analysis failed"
                    : upload.status === "processing"
                    ? "Analysis in progress..."
                    : "No insights generated for this upload"}
                </p>
              </div>
            )}
          </div>
        ))}

        {unlinkedInsights.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800">
              <p className="text-white font-semibold text-sm">CRM Synced Insights</p>
              <p className="text-gray-500 text-xs">{unlinkedInsights.length} insights from CRM connections</p>
            </div>
            <div className="p-4 space-y-2">
              {unlinkedInsights.map(insight => {
                const config = priorityConfig[insight.priority as keyof typeof priorityConfig] || priorityConfig.pattern;
                return (
                  <div key={insight.id} className={`p-4 rounded-xl border ${insight.is_dismissed ? "opacity-40 bg-gray-800/30 border-gray-800" : "bg-gray-800/50 border-gray-700/50"}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${config.badge}`}>
                        <span className={`w-1 h-1 rounded-full ${config.dot}`} />
                        {config.label}
                      </span>
                      <span className="text-xs text-gray-600">{insight.category}</span>
                      {insight.metric && <span className="text-xs text-blue-400 font-semibold">{insight.metric}</span>}
                    </div>
                    <p className="text-white text-sm font-medium mb-1">{insight.title}</p>
                    <p className="text-gray-400 text-xs leading-relaxed">{insight.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
