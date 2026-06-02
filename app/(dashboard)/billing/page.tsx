import { createClient } from "@/lib/supabase/server";
import BillingClient from "./billing-client";

export default async function BillingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("plan, stripe_customer_id, stripe_subscription_id, email, full_name")
    .eq("id", user!.id)
    .single();

  return <BillingClient profile={profile} />;
}
