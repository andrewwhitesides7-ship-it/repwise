"use server";

import { createClient } from "@/lib/supabase/server";

export async function checkUserLimits() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { canUpload: false, canGetInsights: false, plan: "free", uploadCount: 0, insightCount: 0 };

  const { data: profile } = await supabase
    .from("users")
    .select("plan")
    .eq("id", user.id)
    .single();

  const plan = profile?.plan || "free";

  if (plan !== "free") {
    return { canUpload: true, canGetInsights: true, plan, uploadCount: 0, insightCount: 0 };
  }

  const [{ count: uploadCount }, { count: insightCount }] = await Promise.all([
   supabase.from("uploads").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "complete"),
    supabase.from("insights").select("*", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  return {
    canUpload: (uploadCount || 0) < 1,
    canGetInsights: true,
    plan,
    uploadCount: uploadCount || 0,
    insightCount: insightCount || 0,
  };
}
