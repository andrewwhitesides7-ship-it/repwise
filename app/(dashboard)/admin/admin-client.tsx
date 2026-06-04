"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface AdminStats {
  users: {
    total: number;
    newThisMonth: number;
    recent: { full_name: string; email: string; plan: string; created_at: string }[];
    planBreakdown: Record<string, number>;
  };
  uploads: { total: number };
  insights: { total: number };
  stripe: { mrr: number; totalRevenue: number; activeSubscriptions: number };
}

const planColors: Record<string, string> = {
  free: "bg-gray-800 text-gray-400",
  essential: "bg-blue-500/10 text-blue-400",
  professional: "bg-purple-500/10 text-purple-400",
  team: "bg-emerald-500/10 text-emerald-400",
  enterprise: "bg-yellow-500/10 text-yellow-400",
};

export default function AdminClient() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3 text-gray-400">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Loading admin data...
        </div>
      </div>
    );
  }

  if (!stats) return <div className="p-8 text-red-400">Failed to load admin data.</div>;

  const totalPaid = (stats.users.planBreakdown.essential || 0) +
    (stats.users.planBreakdown.professional || 0) +
    (stats.users.planBreakdown.team || 0) +
    (stats.users.planBreakdown.enterprise || 0);

  const conversionRate = stats.users.total > 0
    ? ((totalPaid / stats.users.total) * 100).toFixed(1)
    : "0";

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">Private</span>
          </div>
          <p className="text-gray-400 text-sm">RepWise business metrics — only visible to you.</p>
        </div>
        <Link href="/admin/social" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition shadow-lg shadow-blue-500/20">
          🤖 Social Posting
        </Link>
      </div>

      {/* Revenue stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Monthly Recurring Revenue", value: `$${stats.stripe.mrr.toLocaleString()}`, sub: "from active subscriptions", icon: "💰", color: "text-emerald-400" },
          { label: "Active Subscriptions", value: stats.stripe.activeSubscriptions.toString(), sub: "paying customers", icon: "💳", color: "text-blue-400" },
          { label: "Conversion Rate", value: `${conversionRate}%`, sub: "free to paid", icon: "📈", color: "text-yellow-400" },
          { label: "ARR Estimate", value: `$${(stats.stripe.mrr * 12).toLocaleString()}`, sub: "annualized revenue", icon: "🚀", color: "text-purple-400" },
        ].map(stat => (
          <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">{stat.label}</span>
              <span className="text-lg">{stat.icon}</span>
            </div>
            <div className={`text-2xl font-bold mb-0.5 ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-gray-600">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* User stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Users", value: stats.users.total, sub: "all time signups", icon: "👥", color: "text-blue-400" },
          { label: "New This Month", value: stats.users.newThisMonth, sub: "last 30 days", icon: "✨", color: "text-emerald-400" },
          { label: "Total Uploads", value: stats.uploads.total, sub: "CSVs analyzed", icon: "📤", color: "text-yellow-400" },
          { label: "Insights Generated", value: stats.insights.total, sub: "all time", icon: "🧠", color: "text-purple-400" },
        ].map(stat => (
          <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">{stat.label}</span>
              <span className="text-lg">{stat.icon}</span>
            </div>
            <div className={`text-2xl font-bold mb-0.5 ${stat.color}`}>{stat.value.toLocaleString()}</div>
            <div className="text-xs text-gray-600">{stat.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Plan breakdown */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-4">Plan Breakdown</h2>
          <div className="space-y-3">
            {Object.entries(stats.users.planBreakdown).map(([plan, count]) => {
              const pct = stats.users.total > 0 ? ((count / stats.users.total) * 100).toFixed(0) : "0";
              return (
                <div key={plan}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${planColors[plan] || "bg-gray-800 text-gray-400"}`}>{plan}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-xs">{pct}%</span>
                      <span className="text-white text-sm font-bold">{count}</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${plan === "free" ? "bg-gray-600" : plan === "essential" ? "bg-blue-500" : plan === "professional" ? "bg-purple-500" : plan === "team" ? "bg-emerald-500" : "bg-yellow-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent signups */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-4">Recent Signups</h2>
          <div className="space-y-3">
            {stats.users.recent.length === 0 ? (
              <p className="text-gray-600 text-sm">No users yet.</p>
            ) : (
              stats.users.recent.map((user, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500/10 rounded-xl flex items-center justify-center text-white text-xs font-bold">
                      {(user.full_name || user.email)?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="text-white text-xs font-medium">{user.full_name || "Unknown"}</p>
                      <p className="text-gray-500 text-xs">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${planColors[user.plan] || "bg-gray-800 text-gray-400"}`}>{user.plan}</span>
                    <span className="text-gray-600 text-xs">{new Date(user.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
