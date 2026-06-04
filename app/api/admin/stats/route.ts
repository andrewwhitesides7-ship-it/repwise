import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function GET(request: Request) {
  const supabase = createServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("users")
    .select("plan, role")
    .eq("id", user.id)
    .single();

  if (profile?.plan !== "team" && profile?.plan !== "enterprise") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    { count: totalUsers },
    { count: activeUsers },
    { count: totalUploads },
    { count: totalInsights },
    { data: recentUsers },
    { data: planBreakdown },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("users").select("*", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from("uploads").select("*", { count: "exact", head: true }),
    supabase.from("insights").select("*", { count: "exact", head: true }),
    supabase.from("users").select("full_name, email, plan, created_at").order("created_at", { ascending: false }).limit(10),
    supabase.from("users").select("plan"),
  ]);

  const plans = { free: 0, essential: 0, professional: 0, team: 0, enterprise: 0 };
  planBreakdown?.forEach((u: any) => { if (u.plan in plans) plans[u.plan as keyof typeof plans]++; });

  let stripeData = { mrr: 0, totalRevenue: 0, activeSubscriptions: 0 };
  if (process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const subscriptions = await stripe.subscriptions.list({ status: "active", limit: 100 });
      const mrr = subscriptions.data.reduce((sum, sub) => {
        return sum + sub.items.data.reduce((s, item) => s + ((item.price.unit_amount || 0) / 100), 0);
      }, 0);
      stripeData = { mrr: Math.round(mrr), totalRevenue: Math.round(mrr * 12), activeSubscriptions: subscriptions.data.length };
    } catch (e) {
      console.error("Stripe error:", e);
    }
  }

  return NextResponse.json({
    users: { total: totalUsers || 0, newThisMonth: activeUsers || 0, recent: recentUsers || [], planBreakdown: plans },
    uploads: { total: totalUploads || 0 },
    insights: { total: totalInsights || 0 },
    stripe: stripeData,
  });
}
