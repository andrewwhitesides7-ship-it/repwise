import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ReferralsClient from "./referrals-client";
import { getReferralStats } from "@/app/actions/referrals";

export default async function ReferralsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("plan")
    .eq("id", user.id)
    .single();

  const stats = await getReferralStats();

  return <ReferralsClient stats={stats} isPaid={profile?.plan !== "free"} />;
}
