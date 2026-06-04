"use server";

import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";
import { redirect } from "next/navigation";

export type PlanId = "essential" | "professional" | "team";

export async function createCheckoutSession(plan: PlanId) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe secret key is not set");

  const stripe = new Stripe(key);
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

  const priceId = priceIds[plan];
  if (!priceId) throw new Error(`Price ID not found for plan: ${plan}`);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: "https://tryrepwise.com/dashboard?upgraded=true",
    cancel_url: "https://tryrepwise.com/billing?canceled=true",
    allow_promotion_codes: true,
    payment_method_collection: "always",
    subscription_data: {
      trial_period_days: 14,
      trial_settings: {
        end_behavior: {
          missing_payment_method: "cancel",
        },
      },
      metadata: { supabase_user_id: user.id, plan },
    },
    metadata: { supabase_user_id: user.id, plan },
  });

  if (!session.url) throw new Error("No checkout URL returned");
  redirect(session.url);
}

export async function createPortalSession() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe secret key is not set");

  const stripe = new Stripe(key);
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
    return_url: "https://tryrepwise.com/billing",
  });

  redirect(session.url);
}
