"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createCheckoutSession, createPortalSession } from "@/app/actions/billing";

type Plan = "free" | "essential" | "professional" | "team" | "enterprise";

interface Profile {
  plan: Plan;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  email: string;
  full_name: string | null;
}

const plans = [
  {
    id: "free" as const,
    name: "Free",
    price: "$0",
    period: "/month",
    description: "See where you are losing deals. No credit card required.",
    features: ["3 insights per month", "1 CSV upload per month", "Basic dashboard view"],
    cta: null,
    highlight: false,
    badge: null,
  },
  {
    id: "essential" as const,
    name: "Essential",
    price: "$99",
    period: "/month",
    description: "Everything you need to improve your close rate.",
    features: ["Unlimited CSV uploads", "Unlimited AI insights", "Performance goal tracking", "Weekly email reports", "Export insights as PDF", "30-day history"],
    cta: "Start 14-day trial",
    highlight: false,
    badge: null,
  },
  {
    id: "professional" as const,
    name: "Professional",
    price: "$199",
    period: "/month",
    description: "Collaborate with your team. Get personalized coaching.",
    features: ["Everything in Essential", "Team collaboration (5 people)", "Advanced AI coaching", "Custom goals", "Team performance dashboard", "90-day history", "Priority email support"],
    cta: "Start 14-day trial",
    highlight: true,
    badge: "Most Popular",
  },
  {
    id: "team" as const,
    name: "Team",
    price: "$499",
    period: "/month",
    description: "Manage your entire team. Unlimited seats.",
    features: ["Everything in Professional", "Unlimited team members", "Full manager dashboard", "Team goals and leaderboards", "CRM integrations", "Custom insights", "Dedicated Slack support"],
    cta: "Start 14-day trial",
    highlight: false,
    badge: null,
  },
];

const planLabels: Record<Plan, string> = {
  free: "Free",
  essential: "Essential",
  professional: "Professional",
  team: "Team",
  enterprise: "Enterprise",
};

const planColors: Record<Plan, string> = {
  free: "text-gray-400 bg-gray-800 border-gray-700",
  essential: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  professional: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  team: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  enterprise: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
};

export default function BillingClient({
  profile,
  uploadCount,
  insightCount,
}: {
  profile: Profile | null;
  uploadCount: number;
  insightCount: number;
}) {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);
  const upgraded = searchParams.get("upgraded");
  const canceled = searchParams.get("canceled");
  const limitHit = searchParams.get("limit");
  const currentPlan = profile?.plan || "free";
  const hitUploadLimit = uploadCount >= 1;
  const hitInsightLimit = insightCount >= 3;
  const hitFreeLimit = hitUploadLimit || hitInsightLimit;
  {limitHit && (
  <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl px-5 py-4 flex items-center gap-3">
    <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
    <p className="text-red-400 text-sm font-medium">
      {limitHit === "uploads"
        ? "You have used your free CSV upload. Upgrade to continue uploading data."
        : "You have used your 3 free insights. Upgrade to unlock unlimited insights."}
    </p>
  </div>
)}

  async function handleUpgrade(plan: "essential" | "professional" | "team") {
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
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Billing</h1>
        <p className="text-gray-400 text-sm">Manage your subscription and billing details.</p>
      </div>

      {upgraded && (
        <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-5 py-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-emerald-400 text-sm font-medium">You are now on the {planLabels[currentPlan]} plan. Welcome aboard!</p>
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

      {/* Current plan */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-semibold mb-2">Current Plan</h2>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${planColors[currentPlan]}`}>
                {planLabels[currentPlan]}
              </span>
              <p className="text-gray-400 text-sm">
                {currentPlan === "free"
                  ? "Upgrade to unlock unlimited insights and more."
                  : `Active subscription · ${profile?.email}`}
              </p>
            </div>
          </div>
          {currentPlan !== "free" && profile?.stripe_customer_id && (
            <button
              onClick={handlePortal}
              disabled={loading === "portal"}
              className="flex items-center gap-2 text-sm text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 px-4 py-2 rounded-xl transition disabled:opacity-50"
            >
              {loading === "portal" ? "Loading..." : "Manage Subscription"}
            </button>
          )}
        </div>
      </div>

      {/* Free tier usage */}
      {currentPlan === "free" && (
        <div className={`border rounded-2xl p-6 mb-6 ${hitFreeLimit ? "bg-red-500/5 border-red-500/20" : "bg-blue-500/5 border-blue-500/20"}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${hitFreeLimit ? "bg-red-500/10" : "bg-blue-500/10"}`}>
              {hitFreeLimit ? "⚠️" : "📊"}
            </div>
            <div>
              <p className="text-white text-sm font-medium">
                {hitFreeLimit ? "You have hit your free limit" : "Free tier usage"}
              </p>
              <p className="text-gray-400 text-xs mt-0.5">
                {hitFreeLimit
                  ? "Upgrade to continue using RepWise with unlimited access."
                  : "You get 3 insights and 1 upload per month on the free plan."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-900 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-xs">CSV Uploads</span>
                <span className={`text-xs font-bold ${hitUploadLimit ? "text-red-400" : "text-emerald-400"}`}>
                  {uploadCount}/1
                </span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${hitUploadLimit ? "bg-red-500" : "bg-emerald-500"}`}
                  style={{ width: `${Math.min((uploadCount / 1) * 100, 100)}%` }}
                />
              </div>
              {hitUploadLimit && <p className="text-red-400 text-xs mt-1.5 font-medium">Limit reached</p>}
            </div>
            <div className="bg-gray-900 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-xs">AI Insights</span>
                <span className={`text-xs font-bold ${hitInsightLimit ? "text-red-400" : "text-emerald-400"}`}>
                  {insightCount}/3
                </span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${hitInsightLimit ? "bg-red-500" : "bg-emerald-500"}`}
                  style={{ width: `${Math.min((insightCount / 3) * 100, 100)}%` }}
                />
              </div>
              {hitInsightLimit && <p className="text-red-400 text-xs mt-1.5 font-medium">Limit reached</p>}
            </div>
          </div>

          <button
            onClick={() => handleUpgrade("essential")}
            disabled={!!loading}
            className={`w-full font-semibold px-4 py-3 rounded-xl text-sm transition disabled:opacity-50 ${
              hitFreeLimit
                ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                : "bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700"
            }`}
          >
            {loading === "essential" ? "Loading..." : hitFreeLimit ? "Upgrade now — $99/month" : "Upgrade to Essential — $99/month"}
          </button>
        </div>
      )}

      {/* Pricing grid */}
      <h2 className="text-white font-semibold mb-5">
        {currentPlan === "free" ? "Choose a plan" : "Available plans"}
      </h2>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlan === plan.id;
          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-6 border transition-all duration-300 flex flex-col ${
                plan.highlight
                  ? "bg-gradient-to-b from-blue-600 to-blue-700 border-blue-500 shadow-xl shadow-blue-500/20"
                  : "bg-gray-900 border-gray-800 hover:border-gray-700 hover:-translate-y-0.5"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-blue-600 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-lg">
                  {plan.badge}
                </div>
              )}
              {isCurrentPlan && (
                <div className="absolute -top-3 right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  Current
                </div>
              )}

              <h3 className="text-white font-bold mb-1">{plan.name}</h3>
              <div className="flex items-end gap-1 mb-2">
                <span className="text-3xl font-bold text-white">{plan.price}</span>
                <span className={`text-xs mb-1 ${plan.highlight ? "text-blue-200" : "text-gray-500"}`}>{plan.period}</span>
              </div>
              <p className={`text-xs mb-4 leading-relaxed ${plan.highlight ? "text-blue-100" : "text-gray-500"}`}>
                {plan.description}
              </p>

              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs">
                    <svg className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${plan.highlight ? "text-blue-200" : "text-blue-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className={plan.highlight ? "text-blue-50" : "text-gray-400"}>{f}</span>
                  </li>
                ))}
              </ul>

              {plan.cta && !isCurrentPlan ? (
                <button
                  onClick={() => handleUpgrade(plan.id as "essential" | "professional" | "team")}
                  disabled={!!loading}
                  className={`w-full font-semibold px-4 py-2.5 rounded-xl text-sm transition disabled:opacity-50 flex items-center justify-center gap-2 ${
                    plan.highlight
                      ? "bg-white text-blue-600 hover:bg-blue-50"
                      : "bg-blue-600 hover:bg-blue-500 text-white"
                  }`}
                >
                  {loading === plan.id ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Loading...
                    </>
                  ) : hitFreeLimit && currentPlan === "free" ? `Subscribe — ${plan.price}/mo` : plan.cta}
                </button>
              ) : isCurrentPlan ? (
                <div className={`w-full text-center font-semibold px-4 py-2.5 rounded-xl text-sm opacity-60 ${plan.highlight ? "bg-white/20 text-white" : "bg-gray-800 text-gray-400"}`}>
                  Current plan
                </div>
              ) : (
                <div className={`w-full text-center font-semibold px-4 py-2.5 rounded-xl text-sm ${plan.highlight ? "bg-white/10 text-blue-200" : "bg-gray-800 text-gray-500"}`}>
                  Free forever
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Enterprise */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex items-center justify-between hover:border-gray-700 transition mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center text-2xl">🏢</div>
          <div>
            <h3 className="text-white font-bold">Enterprise</h3>
            <p className="text-gray-400 text-sm">Custom pricing for large franchises and enterprises (50+ reps). API access, white-label, dedicated support.</p>
          </div>
        </div>
        <a href="/contact" className="flex-shrink-0 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition ml-6">
          Contact us
        </a>
      </div>

      {/* Trial note */}
      <div className="p-5 bg-gray-900 border border-gray-800 rounded-2xl">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <div>
            <p className="text-gray-300 text-sm font-medium mb-1">14-day free trial on all paid plans</p>
            <p className="text-gray-500 text-xs leading-relaxed">All paid plans include a 14-day free trial. No charge until the trial ends. Cancel anytime with no fees.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
