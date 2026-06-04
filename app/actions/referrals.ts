"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateVenmo(venmoUsername: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase
    .from("users")
    .update({ venmo_username: venmoUsername.replace("@", "").trim() })
    .eq("id", user.id);

  revalidatePath("/referrals");
}

export async function getReferralStats() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("users")
    .select("referral_code, venmo_username, referral_credits, referral_paid_out, plan")
    .eq("id", user.id)
    .single();

  const { data: referrals } = await supabase
    .from("users")
    .select("full_name, email, plan, created_at")
    .eq("referred_by", profile?.referral_code || "")
    .order("created_at", { ascending: false });

  const activeReferrals = referrals?.filter(r => r.plan !== "free") || [];
  const pendingPayout = activeReferrals.length * 20;

  return {
    profile,
    referrals: referrals || [],
    activeReferrals,
    pendingPayout,
  };
}

export async function getAllPendingPayouts() {
  const supabase = createServiceClient();

  const { data: users } = await supabase
    .from("users")
    .select("id, full_name, email, venmo_username, referral_credits, referral_paid_out, referral_code")
    .gt("referral_credits", 0)
    .not("venmo_username", "is", null)
    .order("referral_credits", { ascending: false });

  return users || [];
}

export async function markPayoutSent(userId: string, amount: number) {
  const supabase = createServiceClient();

  const { data: user } = await supabase
    .from("users")
    .select("referral_credits, referral_paid_out")
    .eq("id", userId)
    .single();

  if (!user) throw new Error("User not found");

  await supabase
    .from("users")
    .update({
      referral_credits: Math.max(0, (user.referral_credits || 0) - amount),
      referral_paid_out: (user.referral_paid_out || 0) + amount,
    })
    .eq("id", userId);

  revalidatePath("/admin/affiliates");
}
