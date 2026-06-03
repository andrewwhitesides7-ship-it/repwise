import { createClient } from "@/lib/supabase/server";
import GoalsClient from "./goals-client";

export default async function GoalsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: goals }, { data: hasData }] = await Promise.all([
    supabase
      .from("goals")
      .select(`*, goal_checklist_items(*)`)
      .eq("user_id", user!.id)
      .in("status", ["active", "completed"])
      .order("created_at", { ascending: false }),
    supabase
      .from("sales_records")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user!.id),
  ]);

  return <GoalsClient goals={goals || []} hasData={!!hasData} />;
}
