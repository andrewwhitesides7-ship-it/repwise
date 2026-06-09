"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createCheckoutSession, createPortalSession } from "@/app/actions/billing";

type Plan = "free" | "team";

interface Profile {
  plan: Plan;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  email: string;
  full_name: string | null;
}

const PREMIUM_TEAM_PLAN = {
  id: "team" as const,
  name: "The Revenue Recovery Plan",
  price: "$500",
  period: "/month",
  description: "Unlimited seats. Unlimited pipelines. Comprehensive recovery diagnostics for your entire sales force.",
  features: [
    "Unlimited team member accounts & managers",
    "Unlimited CSV data uploads and history processing",
    "Full interactive assessment analytics & ZIP diagnostics",
    "Automated milestone coaching action cards every week",
    "Secure 1-click CRM data synchronization loops",
    "Dedicated premium priority system access loops",
  ],
  cta: "Deploy to Your Sales Team",
};

const planLabels: Record<Plan, string> = {
  free: "Diagnostic Free",
  team: "Revenue Recovery Plan",
};

const planColors: Record<Plan, string> = {
  free: "text-[#86868b] bg-[#1c1c1e] border-[#2d2d2f]",
  team: "text-[#30d158] bg-[#30d158]/10 border-[#30d158]/20",
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

  async function handleUpgrade(plan: "team") {
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

  const isCurrentPlanActive = currentPlan === "team";

  return (
    <div className="p-6 md:p-12 max-w-4xl mx-auto bg-black text-[#f5f5f7] min-h-screen">
      
      {/* Header frame */}
      <div className="mb-10">
        <h1 className="text-2xl md:text-3xl font-semibold text-white tracking-tight mb-2">Account Management</h1>
        <p className="text-[#86868b] text-sm">Review your active deployment limits and system invoicing details.</p>
      </div>

      {/* Dynamic Alerts */}
      {limitHit && (
        <div className="mb-6 bg-[#ff453a]/10 border border-[#ff453a]/30 rounded-xl px-5 py-4 flex items-center gap-3 animate-fade-in">
          <span className="text-lg">⚠️</span>
          <p className="text-[#ff453a] text-sm font-medium">
            {limitHit === "uploads"
              ? "You have used your diagnostic CSV upload. Upgrade to unlock continuous data integration."
              : "You have exhausted your test tier limits. Upgrade to deploy unlimited tracking cards."}
          </p>
        </div>
      )}

      {upgraded && (
        <div className="mb-6 bg-[#30d158]/10 border border-[#30d158]/30 rounded-xl px-5 py-4 flex items-center gap-3 animate-fade-in">
          <span className="text-lg">✓</span>
          <p className="text-[#30d158] text-sm font-medium">System successfully upgraded to the {planLabels[currentPlan]}. Welcome aboard.</p>
        </div>
      )}

      {canceled && (
        <div className="mb-6 bg-[#ff9500]/10 border border-[#ff9500]/30 rounded-xl px-5 py-4 flex items-center gap-3">
          <span className="text-lg">ℹ️</span>
          <p className="text-[#ff9500] text-sm font-medium">Checkout path was closed out safely. No active transaction statements processed.</p>
        </div>
      )}

      {/* Current Subscription Status Panel */}
      <div className="bg-[#1c1c1e] border border-[#2d2d2f] rounded-2xl p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-3">
            <h2 className="text-[#86868b] text-xs font-semibold uppercase tracking-wider">Current Account Trajectory</h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full border self-start ${planColors[currentPlan]}`}>
                {planLabels[currentPlan]}
              </span>
              <p className="text-[#a1a1a6] text-sm font-medium">
                {currentPlan === "free"
                  ? "Upgrade to unlock unlimited processing engines for your field force."
                  : `Active Enterprise System License · ${profile?.email}`}
              </p>
            </div>
          </div>
          
          {isCurrentPlanActive && profile?.stripe_customer_id && (
            <button
              onClick={handlePortal}
              disabled={loading === "portal"}
              className="w-full sm:w-auto bg-[#2d2d2f] hover:bg-[#3a3a3c] text-white text-xs font-bold px-5 py-3 rounded-full transition disabled:opacity-50"
            >
              {loading === "portal" ? "Accessing Gateway..." : "Manage Invoicing & Sub"}
            </button>
          )}
        </div>
      </div>

      {/* Interactive Limits Checker (Only displays if on baseline Diagnostic Free) */}
      {currentPlan === "free" && (
        <div className={`border rounded-2xl p-6 mb-10 ${hitFreeLimit ? "bg-[#ff453a]/5 border-[#ff453a]/20" : "bg-[#0071e3]/5 border-[#0071e3]/20"}`}>
          <div className="flex items-start gap-4 mb-6">
            <div className="text-2xl pt-0.5">{hitFreeLimit ? "⚠️" : "📊"}</div>
            <div>
              <p className="text-white text-base font-semibold">
                {hitFreeLimit ? "Diagnostic evaluation limit reached" : "Initial File Progress"}
              </p>
              <p className="text-[#a1a1a6] text-xs mt-1 leading-relaxed font-medium">
                {hitFreeLimit
                  ? "Your team's sample threshold metrics are full. Advance to full deployment to clear data pipelines."
                  : "Free accounts feature exactly 1 data file analysis and 3 targeted recovery cards to test code logic."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-black border border-[#2d2d2f] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#86868b] text-xs font-medium">CSV Data Sets Processed</span>
                <span className={`text-xs font-bold ${hitUploadLimit ? "text-[#ff453a]" : "text-[#30d158]"}`}>
                  {uploadCount} / 1
                </span>
              </div>
              <div className="w-full bg-[#1c1c1e] rounded-full h-1">
                <div
                  className={`h-1 rounded-full transition-all ${hitUploadLimit ? "bg-[#ff453a]" : "bg-[#30d158]"}`}
                  style={{ width: `${Math.min((uploadCount / 1) * 100, 100)}%` }}
                />
              </div>
            </div>
            
            <div className="bg-black border border-[#2d2d2f] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#86868b] text-xs font-medium">Active Recovery Cards Generated</span>
                <span className={`text-xs font-bold ${hitInsightLimit ? "text-[#ff453a]" : "text-[#30d158]"}`}>
                  {insightCount} / 3
                </span>
              </div>
              <div className="w-full bg-[#1c1c1e] rounded-full h-1">
                <div
                  className={`h-1 rounded-full transition-all ${hitInsightLimit ? "bg-[#ff453a]" : "bg-[#30d158]"}`}
                  style={{ width: `${Math.min((insightCount / 3) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {!isCurrentPlanActive && (
            <button
              onClick={() => handleUpgrade("team")}
              disabled={!!loading}
              className="w-full bg-[#0071e3] hover:bg-[#147ce5] text-white font-bold py-3.5 rounded-full text-sm transition shadow-md disabled:opacity-40"
            >
              {loading === "team" ? "Opening Secure Stripe Gateway..." : "Unlock Full Team Access — $500/mo"}
            </button>
          )}
        </div>
      )}

      {/* Single Elite Subscription Box Tier Display */}
      <div className="space-y-4">
        <h3 className="text-white text-lg font-semibold tracking-tight">Available Enterprise System Licenses</h3>
        
        <div className="bg-[#1c1c1e] border-2 border-[#ff453a]/30 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden">
          
          <div className="absolute top-0 right-0 bg-[#ff453a] text-white text-[9px] font-black uppercase tracking-widest px-4 py-1 rounded-bl-xl">
            Unified Team Plan
          </div>

          <div className="space-y-4 max-w-xl">
            <div>
              <h4 className="text-xl font-bold text-white tracking-tight">{PREMIUM_TEAM_PLAN.name}</h4>
              <p className="text-sm text-[#a1a1a6] mt-1 font-medium leading-relaxed">{PREMIUM_TEAM_PLAN.description}</p>
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 pt-2">
              {PREMIUM_TEAM_PLAN.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-xs text-[#e5e5ea] font-medium">
                  <span className="text-[#30d158] font-bold">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col items-stretch md:items-end justify-center min-w-[200px] space-y-4 flex-shrink-0 border-t md:border-t-0 md:border-l border-[#2d2d2f] pt-6 md:pt-0 md:pl-8">
            <div className="text-left md:text-right space-y-0.5">
              <p className="text-xs text-[#86868b] font-medium">Flat Roster Subscription</p>
              <div className="flex items-end justify-start md:justify-end gap-1">
                <span className="text-4xl font-black text-white tracking-tight">{PREMIUM_TEAM_PLAN.price}</span>
                <span className="text-[#86868b] text-sm font-semibold mb-1">{PREMIUM_TEAM_PLAN.period}</span>
              </div>
            </div>

            {isCurrentPlanActive ? (
              <div className="w-full text-center bg-[#2d2d2f] text-[#86868b] text-xs font-bold py-3 rounded-full border border-[#3a3a3c]">
                Your Current Active System License
              </div>
            ) : (
              <button
                onClick={() => handleUpgrade("team")}
                disabled={!!loading}
                className="w-full bg-[#ff453a] hover:bg-[#ff3b30] text-white text-xs font-bold py-3.5 rounded-full transition shadow-md flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {loading === "team" ? "Processing..." : PREMIUM_TEAM_PLAN.cta}
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Bottom Safety Guarantee Section */}
      <div className="mt-8 p-5 bg-[#1c1c1e] border border-[#2d2d2f] rounded-2xl flex items-start gap-4">
        <span className="text-xl pt-0.5">🛡️</span>
        <div className="space-y-1">
          <h5 className="text-white text-sm font-semibold">Unconditional 30-day money-back guarantee</h5>
          <p className="text-[#86868b] text-xs leading-relaxed font-medium">
            If your revenue dashboards fail to expose specific field performance or schedule leakages worth significantly more than your system investment, email Andrew directly for an absolute refund. No questions asked.
          </p>
        </div>
      </div>

    </div>
  );
}
