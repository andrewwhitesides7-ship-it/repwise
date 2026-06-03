"use server";

import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";
import { redirect } from "next/navigation";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export type PlanId = "essential" | "professional" | "team";

export async function createCheckoutSession(plan: PlanId) {
  if (!stripe) throw new Error("Stripe not configured");
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("users")
    .select("stripe_customer_id, email")
    .eq("id", user.id)
    .single();

  let customerId = profile?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile?.email || user.email!,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    await supabase.from("users").update({ stripe_customer_id: customerId }).eq("id", user.id);
  }

  const priceIds: Record<PlanId, string> = {
    essential: process.env.STRIPE_ESSENTIAL_PRICE_ID!,
    professional: process.env.STRIPE_PROFESSIONAL_PRICE_ID!,
    team: process.env.STRIPE_TEAM_PRICE_ID!,
  };

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceIds[plan], quantity: 1 }],
    success_url: `https://tryrepwise.com/dashboard?upgraded=true`,
cancel_url: `https://tryrepwise.com/billing?canceled=true`,
    allow_promotion_codes: true,
    subscription_data: {
      trial_period_days: 14,
    },
    metadata: { supabase_user_id: user.id, plan },
  });

  redirect(session.url!);
}

export async function createPortalSession() {
  if (!stripe) throw new Error("Stripe not configured");
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("users")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_customer_id) throw new Error("No billing account found");

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
  });

  redirect(session.url);
}

s