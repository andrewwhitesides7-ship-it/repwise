import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: insights }, { data: salesRecords }, { data: profile }, { data: goals }] = await Promise.all([
    supabase
      .from("insights")
      .select("*")
      .eq("user_id", user!.id)
      .eq("is_dismissed", false)
      .order("created_at", { ascending: false }),
    supabase
      .from("sales_records")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(1000),
    supabase
      .from("users")
      .select("full_name, plan, role")
      .eq("id", user!.id)
      .single(),
    supabase
      .from("goals")
      .select("*, goal_checklist_items(*)")
      .eq("user_id", user!.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(4),
  ]);

  const records = salesRecords || [];

  const totalKnocked = records.reduce((s: number, r: any) => s + (Number(r.knocked) || 0), 0);
  const totalClosed = records.reduce((s: number, r: any) => s + (Number(r.closed) || 0), 0);
  const totalRevenue = records.reduce((s: number, r: any) => s + (Number(r.deal_value) || 0), 0);
  const closeRate = totalKnocked > 0 ? ((totalClosed / totalKnocked) * 100).toFixed(1) : "0.0";
  const avgDeal = totalClosed > 0 ? Math.round(totalRevenue / totalClosed) : 0;

  const repMap: Record<string, { closes: number; knocked: number; revenue: number }> = {};
  records.forEach((r: any) => {
    if (!r.rep_name) return;
    if (!repMap[r.rep_name]) repMap[r.rep_name] = { closes: 0, knocked: 0, revenue: 0 };
    repMap[r.rep_name].closes += Number(r.closed) || 0;
    repMap[r.rep_name].knocked += Number(r.knocked) || 0;
    repMap[r.rep_name].revenue += Number(r.deal_value) || 0;
  });

  const topRepEntry = Object.entries(repMap)
    .sort((a, b) => b[1].closes - a[1].closes)[0];

  const topRep = topRepEntry?.[0] || "";
  const topRepCloses = topRepEntry?.[1]?.closes || 0;

  const stats = {
    totalClosed,
    totalKnocked,
    closeRate,
    totalRevenue,
    avgDeal,
    topRep,
    topRepCloses,
    totalRecords: records.length,
  };

  return (
    <DashboardClient
      insights={insights || []}
      goals={goals || []}
      stats={stats}
      userName={profile?.full_name || user?.email || ""}
      records={records}
    />
  );
}
