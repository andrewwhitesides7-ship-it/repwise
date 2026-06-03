import { createClient } from "@/lib/supabase/server";
import HistoryClient from "./history-client";

export default async function HistoryPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: uploads }, { data: allInsights }] = await Promise.all([
    supabase
      .from("uploads")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("insights")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <HistoryClient
      uploads={uploads || []}
      insights={allInsights || []}
    />
  );
}
