"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createCheckoutSession, createPortalSession } from "@/app/actions/billing";

type Plan = "free" | "solo" | "team";

interface Profile {
  plan: Plan;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  email: string;
  full_name: string | null;
}

const plans = [
  {
    id: "solo" as const,
    name: "Solo Rep",
    price: "$200",
    period: "/month",
    description: "For individual field reps who want a competitive edge.",
    features: [
      "Unlimited CSV uploads",
      "8–10 AI insights per upload",
      "Daily fresh insights",
      "Time of day analysis",
      "Territory breakdown",
      "Priority tagging",
      "Email support",
    ],
    highlight: false,
  },
  {
    id: "team" as const,
    name: "Team Plan",
    price: "$150",
    period: "/seat/month",
    description: "For managers running a team of field reps.",
    features: [
      "Everything in Solo",
      "Daily team insights",
      "Rep leaderboard",
      "Rep-by-rep breakdowns",
      "Manager dashboard",
      "Invite unlimited reps",
      "Priority support",
    ],
    highlight: true,
  },
];

const planLabels: Record<Plan, string> = {
  free: "Free",
  solo: "Solo Rep",
  team: "Team Plan",
};

const planColors: Record<Plan, string> = {
  free: "text-gray-400 bg-gray-800 border-gray-700",
  solo: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  team: "text-purple-400 bg-purple-500/10 border-purple-500/20",
};

export default function BillingClient({ profile }: { profile: Profile | null }) {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<"solo" | "team" | "portal" | null>(null);
  const upgraded = searchParams.get("upgraded");
  const canceled = searchParams.get("canceled");
  const currentPlan = profile?.plan || "free";

  async function handleUpgrade(plan: "solo" | "team") {
    setLoading(plan);
    try {
      await createCheckoutSession(plan);
    } catch (err) {
      if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) return;
      setLoading(null);
    }
  }

  async function handlePortal() {
    setLoading("portal");
    try {
      await createPortalSession();
    } catch (err) {
      if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) return;
      setLoading(null);
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Billing</h1>
        <p className="text-gray-400 text-sm">Manage your subscription and billing details.</p>
      </div>

      {upgraded && (
        <div className="mb-6 bg-green-500/10 border border-green-500/30 rounded-xl px-5 py-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-green-400 text-sm font-medium">You are now on the {planLabels[currentPlan]} plan. Welcome aboard!</p>
        </div>
      )}

      {canceled && (
        <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-5 py-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-yellow-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-yellow-400 text-sm">Checkout was canceled. No charges were made.</p>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
        <h2 className="text-white font-semibold mb-4">Current Plan</h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${planColors[currentPlan]}`}>
                {planLabels[currentPlan]}
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              {currentPlan === "free"
                ? "You are on the free plan. Upgrade to unlock full access."
                : `Active subscription · ${profile?.email}`}
            </p>
          </div>
          {currentPlan !== "free" && profile?.stripe_customer_id && (
            <button
              onClick={handlePortal}
              disabled={loading === "portal"}
              className="flex items-center gap-2 text-sm text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 px-4 py-2 rounded-lg transition disabled:opacity-50"
            >
              {loading === "portal" ? "Loading..." : "Manage Subscription"}
            </button>
          )}
        </div>
      </div>

      <h2 className="text-white font-semibold mb-4">
        {currentPlan === "free" ? "Choose a plan" : "Available plans"}
      </h2>
      <div className="grid md:grid-cols-2 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlan === plan.id;
          return (
            <div
              key={plan.id}
              className={`rounded-2xl p-8 border transition-all duration-300 ${
                plan.highlight
                  ? "bg-blue-600 border-blue-500 shadow-xl shadow-blue-500/20"
                  : "bg-gray-900 border-gray-800"
              }`}
            >
              {isCurrentPlan && (
                <div className="flex justify-end mb-2">
                  <span className="text-xs font-semibold text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
                    Current plan
                  </span>
                </div>
              )}
              <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
              <div className="flex items-end gap-1 mb-3">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                <span className={`text-sm mb-1 ${plan.highlight ? "text-blue-200" : "text-gray-400"}`}>
                  {plan.period}
                </span>
              </div>
              <p className={`text-sm mb-6 ${plan.highlight ? "text-blue-100" : "text-gray-400"}`}>
                {plan.description}
              </p>
              <ul className="space-y-2.5 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <svg className={`w-4 h-4 flex-shrink-0 ${plan.highlight ? "text-blue-200" : "text-blue-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className={plan.highlight ? "text-blue-50" : "text-gray-300"}>{f}</span>
                  </li>
                ))}
              </ul>
              {isCurrentPlan ? (
                <button disabled className={`w-full font-semibold px-6 py-3 rounded-xl text-sm cursor-not-allowed opacity-60 ${plan.highlight ? "bg-white text-blue-600" : "bg-gray-700 text-gray-300"}`}>
                  Current plan
                </button>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={!!loading}
                  className={`w-full font-semibold px-6 py-3 rounded-xl text-sm transition disabled:opacity-50 flex items-center justify-center gap-2 ${plan.highlight ? "bg-white text-blue-600 hover:bg-blue-50" : "bg-blue-600 hover:bg-blue-500 text-white"}`}
                >
                  {loading === plan.id ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Redirecting to Stripe...
                    </>
                  ) : (
                    `Upgrade to ${plan.name}`
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-5 bg-gray-900 border border-gray-800 rounded-2xl">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <div>
            <p className="text-gray-300 text-sm font-medium mb-1">Secure payments powered by Stripe</p>
            <p className="text-gray-500 text-xs leading-relaxed">
              All payments are processed securely by Stripe. We never store your card details. Cancel anytime from the billing portal with no fees or penalties.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

