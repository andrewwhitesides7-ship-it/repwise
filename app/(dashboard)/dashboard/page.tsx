import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: insights }, { data: salesRecords }, { data: profile }] = await Promise.all([
    supabase
      .from("insights")
      .select("*")
      .eq("user_id", user!.id)
      .eq("is_dismissed", false)
      .order("created_at", { ascending: false }),
    supabase
      .from("sales_records")
      .select("*")
      .eq("user_id", user!.id),
    supabase
      .from("users")
      .select("full_name, plan, role")
      .eq("id", user!.id)
      .single(),
  ]);

  return (
    <DashboardClient
      insights={insights || []}
      salesRecords={salesRecords || []}
      profile={profile}
    />
  );
}
