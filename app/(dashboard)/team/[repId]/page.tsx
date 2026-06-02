import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function RepInsightsPage({
  params,
}: {
  params: { repId: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: currentUser } = await supabase
    .from("users")
    .select("role, team_id")
    .eq("id", user!.id)
    .single();

  if (currentUser?.role !== "manager") {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-400">Access denied.</p>
      </div>
    );
  }

  const { data: rep } = await supabase
    .from("users")
    .select("full_name, email, role")
    .eq("id", params.repId)
    .single();

  const { data: insights } = await supabase
    .from("insights")
    .select("*")
    .eq("user_id", params.repId)
    .order("created_at", { ascending: false });

  const { data: salesRecords } = await supabase
    .from("sales_records")
    .select("knocked, closed, deal_value")
    .eq("user_id", params.repId);

  const totalKnocked = salesRecords?.reduce((s, r) => s + (r.knocked || 0), 0) || 0;
  const totalClosed = salesRecords?.reduce((s, r) => s + (r.closed || 0), 0) || 0;
  const totalRevenue = salesRecords?.reduce((s, r) => s + (r.deal_value || 0), 0) || 0;
  const closeRate = totalKnocked > 0 ? ((totalClosed / totalKnocked) * 100).toFixed(1) : "0";

  const priorityConfig = {
    critical: { label: "Critical", badge: "bg-red-500/15 text-red-400 border border-red-500/20", dot: "bg-red-400" },
    opportunity: { label: "Opportunity", badge: "bg-green-500/15 text-green-400 border border-green-500/20", dot: "bg-green-400" },
    pattern: { label: "Pattern", badge: "bg-blue-500/15 text-blue-400 border border-blue-500/20", dot: "bg-blue-400" },
  };

  const repName = rep?.full_name || "Unknown Rep";
  const initials = repName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/team" className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm mb-4 transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Team
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 font-bold">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{repName}</h1>
            <p className="text-gray-400 text-sm">{rep?.email}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Closes", value: totalClosed.toLocaleString(), icon: "🎯" },
          { label: "Close Rate", value: `${closeRate}%`, icon: "📈" },
          { label: "Total Revenue", value: `$${totalRevenue.toLocaleString()}`, icon: "💰" },
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">{stat.label}</span>
              <span>{stat.icon}</span>
            </div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      <h2 className="text-white font-semibold mb-4">
        Insight History
        <span className="ml-2 text-sm text-gray-500 font-normal">{insights?.length || 0} total</span>
      </h2>

      {!insights?.length && (
        <div className="bg-gray-900 border border-gray-800 border-dashed rounded-2xl p-12 text-center">
          <p className="text-gray-400 text-sm">No insights yet for this rep.</p>
        </div>
      )}

      <div className="space-y-3">
        {insights?.map((insight) => {
          const config = priorityConfig[insight.priority as keyof typeof priorityConfig] || priorityConfig.pattern;
          return (
            <div key={insight.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${config.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                  {config.label}
                </span>
                <span className="text-xs text-gray-500 bg-gray-800 px-2.5 py-1 rounded-full">{insight.category}</span>
                {insight.metric && <span className="text-xs text-blue-400 font-semibold">{insight.metric}</span>}
              </div>
              <h3 className="text-white font-semibold text-sm mb-1">{insight.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{insight.body}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
